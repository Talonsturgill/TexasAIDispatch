"""Durable, public-safe checkpoints so an unfinished Claude cloud edition survives its container.

Inspection on 2026-10-10 found what persists. `out/` is gitignored and dies with a cloud container.
`production_lifecycle.pending` reads only Git worktrees on that machine, and a checkpoint committed
by package_review_run.sh needs a playable film and lands on a run branch a fresh clone never fetches.
A reclaimed container therefore lost the frozen ledger, charges, failed reviews, authored source and
paid outputs, and the next invocation would have started again with a fresh budget.

`save` mirrors the resumable state to the branch `claude/checkpoint/<run-id>` on the remote through
Git plumbing. It never touches the working tree, the index or the run branch, and it only adds
commits. Each checkpoint commit has the source commit the run was built on as a second parent, so
the complete committed renderer, art and public dependency closure travels with it even when the run
branch was never pushed. Uncommitted and untracked source and every scratch output ride in the tree.

`restore` creates an ISOLATED checkout of that recorded source pin in a new directory, overlays the
verified scratch and uncommitted source on it and writes the ledger there with its paths rebuilt. It
never touches an existing ledger, has no force flag and refuses a finished edition.

Rules the saves enforce, each with a negative fixture:
- A new checkpoint must be a monotonic descendant of the remote one: same frozen envelope, the earlier
  event prefix unchanged, usage and limits and increments never lower.
- Private material stays out: any private path component, private data structure, credential value or
  key-shaped text. The ledger is sanitized, shipped Gmail identifiers included.
- Required evidence is never dropped for being large or named like a receipt. Only the known
  regenerable scratch directories are skipped. A file that cannot be retained fails the save loudly.
- Charged state is durable before paid work is dispatched and outputs after it. The controller mirrors
  every ledger write when the edition is marked as a Claude host run. A mirror that cannot be made
  after recovery attempts stops further paid work until `recover` succeeds.
"""
from __future__ import annotations

import argparse
import errno
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCHEMA = "dispatch_claude_checkpoint/2"
BRANCH = "claude/checkpoint/"
ROOT = "checkpoints"
TOKEN = "{REPO}"
RUN_ID = re.compile(r"\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\Z")

SCRATCH_ROOT = "out/dispatch"
# Source the edition authors. Committed source is retained by the recorded source pin; what is
# modified or untracked relative to that pin rides in the tree.
SOURCE_ROOTS = ("video-engine", "assets", "config")
# Directories that are rebuilt from retained inputs. A path carrying "fail" is evidence, never skipped.
REGENERABLE_DIRS = {"tmp", "cache", ".cache", "frames", "node_modules", "__pycache__"}
PRIVATE_COMPONENT = re.compile(r"(gmail|readback|routing|credential|secret|\.env|private|shipment(?!-public))", re.I)
PRIVATE_KEY = re.compile(r"(gmail|draft_?id|label_?ids|thread_?id|recipient|readback|routing|receipt_path)", re.I)
EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+")
SECRET_TEXT = re.compile(
    r"(AIza[0-9A-Za-z_\-]{30,}|gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{40,}|sk-[A-Za-z0-9_\-]{30,}"
    r"|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abprs]-[0-9A-Za-z\-]{20,})")
TEXT_SUFFIX = {".json", ".jsonl", ".md", ".txt", ".yaml", ".yml", ".csv", ".tsv", ".srt", ".vtt", ".html", ".ts", ".tsx", ".css", ".svg"}
MAX_FILE = 95 * 1024 * 1024          # GitHub rejects a blob over 100 MiB; fail visibly before that
MAX_TOTAL = 900 * 1024 * 1024


class CheckpointError(RuntimeError):
    """A checkpoint could not be made safely."""


class RetentionError(CheckpointError):
    """Required evidence could not be retained."""


class RegressionError(CheckpointError):
    """The new checkpoint would weaken the durable record."""


class UnbackedError(CheckpointError):
    """Paid work must not continue: the latest charges or outputs are not durable."""


def git(repo, *args, env=None, check=True, data=None):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, input=data,
                            env={**os.environ, **(env or {})}, timeout=900)
    if check and result.returncode:
        raise CheckpointError("git " + " ".join(args[:2]) + " failed: " + result.stderr.decode(errors="replace")[:400])
    return result


def sha256(path_or_bytes):
    h = hashlib.sha256()
    if isinstance(path_or_bytes, (bytes, bytearray)):
        h.update(path_or_bytes)
        return h.hexdigest()
    with open(path_or_bytes, "rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def credential_values(environ):
    """Values the secret scan must never find. Names say what a variable is; values are never printed."""
    return {v for k, v in environ.items()
            if re.search(r"(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)", k, re.I) and len(v) >= 16
            and not k.startswith("CLAUDE_CODE_") and not re.fullmatch(r"[0-9a-f\-]{36}", v)}


# ---- portable, sanitized ledgers -------------------------------------------------------------

def portable(obj, root):
    root = str(root)
    if isinstance(obj, str):
        return obj.replace(root, TOKEN)
    if isinstance(obj, list):
        return [portable(v, root) for v in obj]
    if isinstance(obj, dict):
        return {portable(k, root): portable(v, root) for k, v in obj.items()}
    return obj


def expand(obj, root):
    root = str(root)
    if isinstance(obj, str):
        return obj.replace(TOKEN, root)
    if isinstance(obj, list):
        return [expand(v, root) for v in obj]
    if isinstance(obj, dict):
        return {expand(k, root): expand(v, root) for k, v in obj.items()}
    return obj


def _digest_label(value, prefix):
    return "[%s-sha256:%s]" % (prefix, hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest())


def redact(obj):
    """Replace private data structures and addresses with digests, keeping the record's shape."""
    if isinstance(obj, dict):
        return {k: (_digest_label(v, "private") if PRIVATE_KEY.search(str(k)) else redact(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact(v) for v in obj]
    if isinstance(obj, str):
        return EMAIL.sub(lambda m: _digest_label(m.group(0), "private-email"), obj)
    return obj


def has_private_structure(obj):
    if isinstance(obj, dict):
        return any(PRIVATE_KEY.search(str(k)) or has_private_structure(v) for k, v in obj.items())
    if isinstance(obj, list):
        return any(has_private_structure(v) for v in obj)
    return False


def public_ledger(state, root):
    from public_state import export
    return redact(portable(export(state), root))


def ledger_text(state, root):
    return json.dumps(public_ledger(state, root), indent=2, sort_keys=True) + "\n"


# ---- what a checkpoint retains --------------------------------------------------------------

def private_path(rel):
    return any(PRIVATE_COMPONENT.search(part) for part in Path(rel).parts)


def stored_bytes(repo, rel):
    """What is written to the checkpoint for a file. A ledger copy is sanitized like the ledger."""
    path = Path(repo) / rel
    if path.name == "run_state.json":
        return ledger_text(json.loads(path.read_text()), repo).encode()
    return path.read_bytes()


def _private_json(path):
    try:
        return has_private_structure(json.loads(path.read_text()))
    except (ValueError, UnicodeDecodeError):
        return False


def candidates(repo):
    """Resumable files, each exclusion with its reason, and anything required that cannot be retained."""
    repo = Path(repo)
    chosen, excluded, problems = {}, [], []
    regenerable = {"files": 0, "bytes": 0}
    scratch = repo / SCRATCH_ROOT

    def consider(path, kind, rel):
        if private_path(rel):
            excluded.append({"path": rel, "reason": "private path component"})
        elif path.is_symlink():
            excluded.append({"path": rel, "reason": "symbolic link is not retained"})
        elif path.stat().st_size > MAX_FILE:
            problems.append("%s is %d bytes, over the %d byte limit" % (rel, path.stat().st_size, MAX_FILE))
        elif path.suffix.lower() == ".json" and path.name != "run_state.json" and _private_json(path):
            excluded.append({"path": rel, "reason": "private data structure"})
        else:
            chosen[rel] = kind

    for path in sorted(scratch.rglob("*")) if scratch.is_dir() else []:
        if not path.is_file() and not path.is_symlink():
            continue
        rel = path.relative_to(repo).as_posix()
        inside = set(path.relative_to(scratch).parts[:-1])
        if rel == f"{SCRATCH_ROOT}/run_state.json":
            continue  # exported separately, sanitized
        if inside & REGENERABLE_DIRS and "fail" not in rel.lower():
            regenerable["files"] += 1
            regenerable["bytes"] += path.stat().st_size if path.is_file() else 0
            continue
        consider(path, "scratch", rel)
    status = git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all", "--", *SOURCE_ROOTS).stdout.decode()
    deleted = []
    for entry in filter(None, status.split("\0")):
        code, rel = entry[:2], entry[3:]
        path = repo / rel
        if "D" in code and not path.exists():
            deleted.append(rel)
        elif path.is_file() or path.is_symlink():
            consider(path, "source", rel)
    return chosen, excluded, problems, regenerable, sorted(deleted)


def leaks(items, environ):
    """Relative paths whose stored text carries a credential value or key-shaped string."""
    values = credential_values(environ)
    found = []
    for rel, data in items:
        if Path(rel).suffix.lower() not in TEXT_SUFFIX:
            continue
        text = data.decode(errors="replace")
        if SECRET_TEXT.search(text) or any(v in text for v in values):
            found.append(rel)
    return found


def monotonic_problems(old, new):
    """Everything that would make a new checkpoint weaker than the durable one."""
    errors = []
    if old.get("run_id") != new.get("run_id"):
        return ["checkpoint belongs to another run"]
    if old.get("terminal_state") == "shipped" and new.get("terminal_state") != "shipped":
        errors.append("a shipped edition cannot return to an open state")
    if old.get("resource_envelope") is not None and new.get("resource_envelope") != old.get("resource_envelope"):
        errors.append("the frozen resource envelope changed")
    old_events, new_events = old.get("events") or [], new.get("events") or []
    if new_events[:len(old_events)] != old_events:
        errors.append("the earlier event history was altered, removed or reordered")
    for field in ("usage", "limits", "escalation_ceiling"):
        before, after = old.get(field) or {}, new.get(field) or {}
        for key, value in before.items():
            if key not in after:
                errors.append(f"{field}.{key} disappeared")
            elif isinstance(value, (int, float)) and after[key] < value:
                errors.append(f"{field}.{key} fell from {value} to {after[key]}")
    old_up, new_up = old.get("escalations") or [], new.get("escalations") or []
    if new_up[:len(old_up)] != old_up:
        errors.append("recorded increments were altered or removed")
    return errors


def build_bundle(repo, state_path, note, environ=None):
    environ = os.environ if environ is None else environ
    repo = Path(repo)
    state = json.loads(Path(state_path).read_text())
    run_id = str(state["run_id"])
    if not RUN_ID.fullmatch(run_id):
        raise CheckpointError("run id is not a safe branch name")
    ledger = ledger_text(state, repo)
    chosen, excluded, problems, regenerable, deleted = candidates(repo)
    if problems:
        raise RetentionError("required evidence cannot be retained: " + "; ".join(problems[:6]))
    stored = {rel: stored_bytes(repo, rel) for rel in chosen}
    bad = leaks(stored.items(), environ)
    if SECRET_TEXT.search(ledger) or any(v in ledger for v in credential_values(environ)):
        bad.append("ledger")
    if bad:
        raise CheckpointError("checkpoint refused: credential-shaped content in " + ", ".join(bad))
    total = sum(len(v) for v in stored.values())
    if total > MAX_TOTAL:
        raise RetentionError("required evidence totals %d bytes, over the %d byte limit" % (total, MAX_TOTAL))
    pin = git(repo, "rev-parse", "HEAD").stdout.decode().strip()
    closure = git(repo, "ls-tree", "-r", pin, "--", "video-engine").stdout
    branch = git(repo, "branch", "--show-current", check=False).stdout.decode().strip()
    files = [{"path": rel, "class": chosen[rel], "sha256": sha256(data), "size": len(data)}
             for rel, data in sorted(stored.items())]
    ledger_obj = json.loads(ledger)
    manifest = {"schema": SCHEMA, "run_id": run_id, "saved_at": now(), "note": note, "phase": state.get("phase"),
                "terminal_state": state.get("terminal_state"), "shipment_recorded": bool(state.get("shipment")),
                "created_at": state.get("created_at"), "repo_root": str(repo), "source_pin": pin, "source_branch": branch or None,
                "source_closure": {"root": "video-engine", "files": closure.count(b"\n"), "sha256": sha256(closure)},
                "deleted_source": deleted, "ledger_sha256": sha256(ledger.encode()),
                "original_private_ledger_sha256": ledger_obj["public_export"]["original_private_state_sha256"],
                "usage": state.get("usage"), "files": files, "excluded": excluded, "regenerable": regenerable,
                "public_safe": "Gmail, routing, delivery receipts and credentials are excluded or redacted. Ledger is the sanitized public export."}
    return run_id, manifest, ledger, stored, ledger_obj


def commit_tree(repo, run_id, manifest, ledger, stored, parent, pin, old_manifest):
    """Build the checkpoint tree in a throwaway index so the working tree and branch stay untouched."""
    base = f"{ROOT}/{run_id}"
    old_blobs = {}
    if parent:
        for line in git(repo, "ls-tree", "-r", parent, "--", f"{base}/files").stdout.decode().splitlines():
            meta, path = line.split("\t", 1)
            old_blobs[path[len(base) + 7:]] = meta.split()[2]
    old_hash = {row["path"]: row["sha256"] for row in (old_manifest or {}).get("files", [])}
    with tempfile.TemporaryDirectory() as directory:
        env = {"GIT_INDEX_FILE": str(Path(directory) / "index")}
        lines = []

        def add(path, blob):
            lines.append(f"100644 {blob}\t{path}\n")

        def write(data):
            return git(repo, "hash-object", "-w", "--stdin", data=data).stdout.decode().strip()

        add(f"{base}/run_state.json", write(ledger.encode()))
        add(f"{base}/manifest.json", write((json.dumps(manifest, indent=2) + "\n").encode()))
        for row in manifest["files"]:
            reuse = old_blobs.get(row["path"]) if old_hash.get(row["path"]) == row["sha256"] else None
            add(f"{base}/files/{row['path']}", reuse or write(stored[row["path"]]))
        git(repo, "update-index", "--add", "--index-info", env=env, data="".join(lines).encode())
        tree = git(repo, "write-tree", env=env).stdout.decode().strip()
    if old_manifest:
        keys = ("ledger_sha256", "files", "phase", "terminal_state", "shipment_recorded", "source_pin", "deleted_source")
        if {k: old_manifest.get(k) for k in keys} == {k: manifest.get(k) for k in keys}:
            return parent, False
    identity = {"GIT_AUTHOR_NAME": "Talon Sturgill", "GIT_AUTHOR_EMAIL": "Talon.sturgill@gmail.com",
                "GIT_COMMITTER_NAME": "Talon Sturgill", "GIT_COMMITTER_EMAIL": "Talon.sturgill@gmail.com"}
    message = f"Checkpoint {run_id}: {manifest['phase']} ({manifest['note']})"[:200]
    args = ["commit-tree", tree, "-m", message]
    for p in dict.fromkeys(filter(None, [parent, pin])):
        args += ["-p", p]
    return git(repo, *args, env=identity).stdout.decode().strip(), True


def remote_tip(repo, run_id, remote):
    ref = f"refs/heads/{BRANCH}{run_id}"
    listed = git(repo, "ls-remote", "--heads", remote, ref, check=False)
    if listed.returncode:
        raise CheckpointError("cannot reach the checkpoint remote: " + listed.stderr.decode()[:200])
    if not listed.stdout.split():
        return None
    git(repo, "fetch", "--quiet", "--no-tags", remote, ref)
    return git(repo, "rev-parse", "FETCH_HEAD").stdout.decode().strip()


def show(repo, commit, path):
    return git(repo, "show", f"{commit}:{path}").stdout


def _backoff():
    return float(os.environ.get("DISPATCH_CHECKPOINT_BACKOFF", "1"))


def save(repo=REPO, state_path=None, note="manual", remote="origin", environ=None, push=True):
    repo = Path(repo)
    state_path = Path(state_path or repo / SCRATCH_ROOT / "run_state.json")
    run_id, manifest, ledger, stored, ledger_obj = build_bundle(repo, state_path, note, environ)
    parent = remote_tip(repo, run_id, remote) if push else None
    old_manifest = None
    if parent:
        old_manifest = json.loads(show(repo, parent, f"{ROOT}/{run_id}/manifest.json"))
        errors = monotonic_problems(json.loads(show(repo, parent, f"{ROOT}/{run_id}/run_state.json")), ledger_obj)
        if errors:
            raise RegressionError("checkpoint would weaken the durable record: " + "; ".join(errors[:6]))
    commit, changed = commit_tree(repo, run_id, manifest, ledger, stored, parent, manifest["source_pin"], old_manifest)
    if changed and push:
        delay = 2
        for attempt in range(1, 6):
            result = git(repo, "push", "--quiet", remote, f"{commit}:refs/heads/{BRANCH}{run_id}", check=False)
            if not result.returncode:
                break
            if attempt == 5:
                raise CheckpointError("checkpoint push failed after 5 attempts: " + result.stderr.decode()[:300])
            time.sleep(delay * _backoff()); delay *= 2
        if remote_tip(repo, run_id, remote) != commit:
            raise CheckpointError("remote checkpoint does not match the saved commit")
    git(repo, "update-ref", f"refs/heads/{BRANCH}{run_id}", commit)
    return {"run_id": run_id, "commit": commit, "changed": changed, "files": len(manifest["files"]),
            "bytes": sum(f["size"] for f in manifest["files"]), "phase": manifest["phase"],
            "excluded": len(manifest["excluded"]), "source_pin": manifest["source_pin"]}


# ---- durability around paid work --------------------------------------------------------------

def required(state_path):
    path = Path(state_path)
    return os.environ.get("DISPATCH_CHECKPOINT_REQUIRED") == "1" or (path.parent / "claude-host.json").is_file()


def flag_path(state_path):
    return Path(state_path).parent / "checkpoint-unbacked.json"


def repo_of(state_path):
    out = git(Path(state_path).resolve().parent, "rev-parse", "--show-toplevel").stdout.decode().strip()
    return Path(out)


def require_backed(state_path):
    """Called before any paid reservation. A recorded unbacked failure blocks new paid work."""
    if required(state_path) and flag_path(state_path).is_file():
        raise UnbackedError("the latest charges or outputs are not durable (" + str(flag_path(state_path))
                            + "); run `python scripts/claude_checkpoint.py recover` before more paid work")


def free_regenerable(repo):
    """Reclaim only rebuildable space, then let Git drop unreachable objects."""
    scratch = Path(repo) / SCRATCH_ROOT
    for path in sorted(scratch.rglob("*")) if scratch.is_dir() else []:
        if path.is_dir() and path.name in REGENERABLE_DIRS and "fail" not in str(path).lower():
            shutil.rmtree(path, ignore_errors=True)
    git(repo, "gc", "--auto", "--quiet", "--prune=now", check=False)


def save_with_recovery(repo, state_path, note, attempts=4, remote="origin", environ=None):
    """Recover real storage and transport failures. Content failures are never retried into silence."""
    last = None
    for attempt in range(1, attempts + 1):
        try:
            return save(repo, state_path, note, remote, environ)
        except (RetentionError, RegressionError):
            raise
        except CheckpointError as exc:
            if "credential-shaped" in str(exc):
                raise
            last = exc
        except OSError as exc:
            last = CheckpointError("checkpoint storage failure: " + str(exc))
            if exc.errno == errno.ENOSPC:
                free_regenerable(repo)
        if "No space left" in str(last):
            free_regenerable(repo)
        if attempt < attempts:
            time.sleep(3 * (3 ** (attempt - 1)) * _backoff())
    raise last


def mirror(state_path, note="ledger write"):
    """Controller hook: make a just-written ledger durable. No-op unless this is a Claude host edition."""
    if not required(state_path):
        return None
    try:
        result = save_with_recovery(repo_of(state_path), state_path, note)
    except Exception as exc:
        flag_path(state_path).write_text(json.dumps({"at": now(), "note": note, "error": str(exc)[:500]}, indent=2) + "\n")
        raise UnbackedError("checkpoint failed; paid work is stopped until it is recovered: " + str(exc)[:300]) from exc
    flag_path(state_path).unlink(missing_ok=True)
    return result


# ---- discover and restore -------------------------------------------------------------------

def verify_checkpoint(repo, commit, run_id):
    base = f"{ROOT}/{run_id}"
    manifest = json.loads(show(repo, commit, f"{base}/manifest.json"))
    ledger = show(repo, commit, f"{base}/run_state.json")
    if manifest.get("schema") != SCHEMA or manifest.get("run_id") != run_id:
        raise CheckpointError("checkpoint manifest belongs to another run or schema")
    if sha256(ledger) != manifest["ledger_sha256"]:
        raise CheckpointError("checkpoint ledger differs from its manifest")
    for row in manifest["files"]:
        if sha256(show(repo, commit, f"{base}/files/{row['path']}")) != row["sha256"]:
            raise CheckpointError("checkpoint file differs from its manifest: " + row["path"])
    return manifest, ledger


def discover(repo=REPO, remote="origin"):
    """Unfinished checkpointed editions visible to a clean clone, newest save first."""
    repo = Path(repo)
    listed = git(repo, "ls-remote", "--heads", remote, f"refs/heads/{BRANCH}*")
    found = []
    for line in listed.stdout.decode().splitlines():
        _, ref = line.split("\t")
        run_id = ref[len(f"refs/heads/{BRANCH}"):]
        if not RUN_ID.fullmatch(run_id):
            continue
        git(repo, "fetch", "--quiet", "--no-tags", remote, ref)
        commit = git(repo, "rev-parse", "FETCH_HEAD").stdout.decode().strip()
        manifest = json.loads(show(repo, commit, f"{ROOT}/{run_id}/manifest.json"))
        done = manifest.get("terminal_state") == "shipped" and manifest.get("shipment_recorded")
        found.append({"run_id": run_id, "commit": commit, "saved_at": manifest["saved_at"], "phase": manifest["phase"],
                      "created_at": manifest.get("created_at"),
                      "source_pin": manifest.get("source_pin"), "files": len(manifest["files"]),
                      "finished": bool(done), "usage": manifest.get("usage")})
    return sorted(found, key=lambda row: row["saved_at"], reverse=True)


def oldest_unfinished(found):
    """The edition to resume first: oldest by run identity, then ledger creation time. Never found[0],
    which discover orders newest save first."""
    open_rows = [row for row in found if not row["finished"]]
    return min(open_rows, key=lambda row: (row["run_id"][:10], row.get("created_at") or "", row["run_id"]), default=None)


def restore(repo=REPO, run_id=None, remote="origin", dest=None):
    """Rebuild an unfinished edition in a NEW isolated checkout of its recorded source pin."""
    repo = Path(repo)
    tip = remote_tip(repo, run_id, remote)
    if not tip:
        raise CheckpointError(f"no checkpoint for {run_id} on {remote}")
    manifest, ledger = verify_checkpoint(repo, tip, run_id)
    if manifest.get("terminal_state") == "shipped" and manifest.get("shipment_recorded"):
        raise CheckpointError(f"{run_id} already shipped; a finished edition is immutable and is not restored")
    dest = Path(dest) if dest else repo.parent / f"{repo.name}-{run_id}"
    if dest.exists() and any(dest.iterdir()):
        raise CheckpointError(f"restore needs a new empty directory; {dest} exists")
    pin = manifest["source_pin"]
    if git(repo, "cat-file", "-e", pin + "^{commit}", check=False).returncode:
        raise CheckpointError("the recorded source pin is not in the checkpoint history: " + pin)
    git(repo, "worktree", "add", "--quiet", "--detach", str(dest), pin)
    branch = manifest.get("source_branch")
    if branch and git(dest, "rev-parse", "--verify", "--quiet", f"refs/heads/{branch}", check=False).returncode:
        git(dest, "switch", "--quiet", "-c", branch)
    closure = git(dest, "ls-tree", "-r", "HEAD", "--", manifest["source_closure"]["root"]).stdout
    if sha256(closure) != manifest["source_closure"]["sha256"]:
        raise CheckpointError("the restored renderer, art and public closure differs from the recorded one")
    for rel in manifest.get("deleted_source", []):
        (dest / rel).unlink(missing_ok=True)
    for row in manifest["files"]:
        target = dest / row["path"]
        target.parent.mkdir(parents=True, exist_ok=True)
        data = show(repo, tip, f"{ROOT}/{run_id}/files/{row['path']}")
        if target.name == "run_state.json":
            data = (json.dumps(expand(json.loads(data), dest), indent=2, sort_keys=True) + "\n").encode()
        target.write_bytes(data)
    state_path = dest / SCRATCH_ROOT / "run_state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(expand(json.loads(ledger), dest), indent=2, sort_keys=True) + "\n")
    (state_path.parent / "claude-host.json").write_text(json.dumps({"run_id": run_id, "restored_from": tip, "at": now()}) + "\n")
    from production_lifecycle import allowance_problems
    from run_controller import deliverable_problems, read_state
    state = read_state(state_path)
    problems = allowance_problems(state)
    if state.get("deliverable"):
        problems += deliverable_problems(state)
    if problems:
        raise CheckpointError("restored edition fails its audit: " + "; ".join(problems))
    return {"run_id": run_id, "checkpoint": tip, "dest": str(dest), "phase": manifest["phase"], "source_pin": pin,
            "restored_files": len(manifest["files"]) + 1, "saved_at": manifest["saved_at"], "usage": manifest.get("usage"),
            "next": "cd there, run cloud_bootstrap.py --install for its node_modules, then resume the controller"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=REPO, help="the checkout that owns the edition (default: this one)")
    sub = parser.add_subparsers(dest="action", required=True)
    p = sub.add_parser("save"); p.add_argument("--note", default="manual"); p.add_argument("--state", type=Path)
    p.add_argument("--remote", default="origin")
    p = sub.add_parser("recover"); p.add_argument("--state", type=Path); p.add_argument("--remote", default="origin")
    p = sub.add_parser("discover"); p.add_argument("--remote", default="origin")
    p.add_argument("--oldest-unfinished", action="store_true", help="print only the edition to resume first")
    p = sub.add_parser("restore"); p.add_argument("--run-id", required=True); p.add_argument("--remote", default="origin")
    p.add_argument("--dest", type=Path)
    p = sub.add_parser("guard", help="make state durable, run one paid command, make its outputs durable")
    p.add_argument("--note", required=True); p.add_argument("--state", type=Path); p.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args(argv)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    repo = args.repo.resolve()
    try:
        state = getattr(args, "state", None) or repo / SCRATCH_ROOT / "run_state.json"
        if args.action == "save":
            result = save(repo, state, args.note, args.remote)
        elif args.action == "recover":
            result = save_with_recovery(repo, state, "recover", remote=args.remote)
            flag_path(state).unlink(missing_ok=True)
        elif args.action == "discover":
            result = discover(repo, args.remote)
            if args.oldest_unfinished:
                result = oldest_unfinished(result)
        elif args.action == "restore":
            result = restore(repo, args.run_id, args.remote, args.dest)
        else:
            command = [c for c in args.command if c != "--"]
            if not command:
                raise CheckpointError("guard needs a command after --")
            require_backed(state)
            save_with_recovery(repo, state, "before " + args.note)
            code = subprocess.run(command).returncode
            try:
                after = save_with_recovery(repo, state, "after " + args.note)
            except CheckpointError as exc:
                flag_path(state).write_text(json.dumps({"at": now(), "note": "after " + args.note, "error": str(exc)[:500]}) + "\n")
                print(json.dumps({"error": "UNBACKED: " + str(exc)}), file=sys.stderr)
                return 75
            flag_path(state).unlink(missing_ok=True)
            print(json.dumps({"command_exit": code, "after": after["commit"]}))
            return code
    except (CheckpointError, OSError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        # Guarded paid work that cannot be made durable stops with the unbacked status.
        return 75 if isinstance(exc, UnbackedError) or args.action == "guard" else 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
