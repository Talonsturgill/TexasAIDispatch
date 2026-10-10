"""Durable, public-safe checkpoints so an unfinished Claude cloud edition survives its container.

Inspection on 2026-10-10 found what persists. `out/` is gitignored and dies with a cloud container.
`production_lifecycle.pending` reads only Git worktrees on that machine, and a checkpoint committed
by package_review_run.sh needs a playable film and lands on a run branch a fresh clone never fetches.
A reclaimed container therefore lost the frozen ledger, charges, failed reviews, authored source and
paid outputs, and the next invocation would have started again with a fresh budget.

`save` mirrors the resumable state to the branch `claude/checkpoint/<run-id>` on the remote through
Git plumbing. It never touches the working tree, the index or the run branch, and it only adds
commits. `discover` finds unfinished editions on a clean clone. `restore` rebuilds the files in place,
verifying every hash, so the controller resumes the same ledger. Nothing here replaces a ledger or
grants a resource.

The public-safe rule is enforced at save time. The ledger is exported through public_state.export.
Gmail drafts, readbacks, routing, shipment receipts, credentials and key-shaped text are excluded, and
the save fails closed if a credential value from the environment appears in any included file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCHEMA = "dispatch_claude_checkpoint/1"
BRANCH = "claude/checkpoint/"
ROOT = "checkpoints"
RUN_ID = re.compile(r"\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\Z")

SCRATCH_ROOT = "out/dispatch"
# Source the edition authors lives in the working tree until it is committed. It is bound by Git
# status, so a file the run branch already committed is not duplicated here.
SOURCE_ROOTS = ("video-engine/src", "video-engine/public")
KEEP_SUFFIX = {".json", ".jsonl", ".md", ".txt", ".yaml", ".yml", ".csv", ".tsv", ".srt", ".vtt", ".html",
               ".wav", ".mp3", ".m4a", ".flac", ".mp4", ".jpg", ".jpeg", ".png", ".ts", ".tsx", ".css", ".svg"}
SKIP_DIRS = {"tmp", "cache", ".cache", "frames", "node_modules", "__pycache__", "renders-scratch"}
PRIVATE_NAME = re.compile(r"(gmail|draft|readback|routing|credential|secret|token|\.env|receipt|shipment(?!-public))", re.I)
SECRET_TEXT = re.compile(
    r"(AIza[0-9A-Za-z_\-]{30,}|gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{40,}|sk-[A-Za-z0-9_\-]{30,}"
    r"|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abprs]-[0-9A-Za-z\-]{20,})")
TEXT_SUFFIX = {".json", ".jsonl", ".md", ".txt", ".yaml", ".yml", ".csv", ".tsv", ".srt", ".vtt", ".html", ".ts", ".tsx", ".css", ".svg"}
MAX_FILE = 80 * 1024 * 1024
MAX_PNG = 3 * 1024 * 1024
MAX_TOTAL = 400 * 1024 * 1024


def git(repo, *args, env=None, check=True, data=None):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, input=data,
                            env={**os.environ, **(env or {})}, timeout=600)
    if check and result.returncode:
        raise RuntimeError("git " + " ".join(args[:2]) + " failed: " + result.stderr.decode(errors="replace")[:400])
    return result


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
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


def candidates(repo):
    """Resumable files with the reason each excluded one is left out."""
    repo = Path(repo)
    chosen, excluded = {}, []
    scratch = repo / SCRATCH_ROOT
    for path in sorted(scratch.rglob("*")) if scratch.is_dir() else []:
        rel = path.relative_to(repo).as_posix()
        if not path.is_file() or path.is_symlink():
            continue
        parts = set(path.relative_to(scratch).parts[:-1])
        if parts & SKIP_DIRS:
            excluded.append({"path": rel, "reason": "regenerable scratch"})
        elif PRIVATE_NAME.search(path.name):
            excluded.append({"path": rel, "reason": "private delivery or credential material"})
        elif path.suffix.lower() not in KEEP_SUFFIX:
            excluded.append({"path": rel, "reason": "unrecognised type"})
        elif path.name == "run_state.json":
            continue  # the ledger is exported separately
        elif path.suffix.lower() == ".png" and path.stat().st_size > MAX_PNG:
            excluded.append({"path": rel, "reason": "large regenerable frame"})
        elif path.stat().st_size > MAX_FILE:
            excluded.append({"path": rel, "reason": "over the per-file limit"})
        else:
            chosen[rel] = "scratch"
    status = git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all", "--", *SOURCE_ROOTS).stdout.decode()
    for entry in filter(None, status.split("\0")):
        code, rel = entry[:2], entry[3:]
        path = repo / rel
        if code.strip() == "D" or not path.is_file() or path.is_symlink():
            continue
        if path.suffix.lower() not in KEEP_SUFFIX or PRIVATE_NAME.search(path.name) or path.stat().st_size > MAX_FILE:
            excluded.append({"path": rel, "reason": "not checkpointed source"})
        else:
            chosen[rel] = "source"
    return chosen, excluded


def leaks(repo, rels, environ):
    values = credential_values(environ)
    found = []
    for rel in rels:
        path = Path(repo) / rel
        if path.suffix.lower() not in TEXT_SUFFIX:
            continue
        text = path.read_text(errors="replace")
        if SECRET_TEXT.search(text) or any(v in text for v in values):
            found.append(rel)
    return found


def build_bundle(repo, state_path, note, environ=None):
    from public_state import export
    environ = os.environ if environ is None else environ
    state = json.loads(Path(state_path).read_text())
    run_id = str(state["run_id"])
    if not RUN_ID.fullmatch(run_id):
        raise ValueError("run id is not a safe branch name")
    public = export(state)
    chosen, excluded = candidates(repo)
    bad = leaks(repo, chosen, environ)
    ledger_text = json.dumps(public, indent=2) + "\n"
    if SECRET_TEXT.search(ledger_text) or any(v in ledger_text for v in credential_values(environ)):
        bad.append("ledger")
    if bad:
        raise ValueError("checkpoint refused: credential-shaped content in " + ", ".join(bad))
    total = sum((Path(repo) / rel).stat().st_size for rel in chosen)
    if total > MAX_TOTAL:
        raise ValueError("checkpoint exceeds the %d MiB limit; exclude regenerable output" % (MAX_TOTAL >> 20))
    head = git(repo, "rev-parse", "HEAD").stdout.decode().strip()
    files = [{"path": rel, "class": kind, "sha256": sha256(Path(repo) / rel), "size": (Path(repo) / rel).stat().st_size}
             for rel, kind in sorted(chosen.items())]
    manifest = {"schema": SCHEMA, "run_id": run_id, "saved_at": now(), "note": note, "phase": state.get("phase"),
                "terminal_state": state.get("terminal_state"), "shipment_recorded": bool(state.get("shipment")),
                "base_head": head, "ledger_sha256": hashlib.sha256(ledger_text.encode()).hexdigest(),
                "original_private_ledger_sha256": public["public_export"]["original_private_state_sha256"],
                "usage": state.get("usage"), "files": files, "excluded": excluded,
                "public_safe": "Gmail, routing, receipts and credentials are excluded. Ledger is the public export."}
    return run_id, manifest, ledger_text


def commit_tree(repo, run_id, manifest, ledger_text, parent):
    """Build the checkpoint tree in a throwaway index so the working tree and branch stay untouched."""
    base = f"{ROOT}/{run_id}"
    with tempfile.TemporaryDirectory() as directory:
        env = {"GIT_INDEX_FILE": str(Path(directory) / "index")}
        lines = []

        def add(path, data=None, source=None):
            blob = git(repo, "hash-object", "-w", "--stdin" if data is not None else str(source),
                       data=data).stdout.decode().strip()
            lines.append(f"100644 {blob}\t{path}\n")

        add(f"{base}/run_state.json", data=ledger_text.encode())
        add(f"{base}/manifest.json", data=(json.dumps(manifest, indent=2) + "\n").encode())
        for row in manifest["files"]:
            add(f"{base}/files/{row['path']}", source=Path(repo) / row["path"])
        git(repo, "update-index", "--add", "--index-info", env=env, data="".join(lines).encode())
        tree = git(repo, "write-tree", env=env).stdout.decode().strip()
    if parent:
        # The save time and note always differ, so compare what a restore would rebuild.
        old = json.loads(show(repo, parent, f"{base}/manifest.json"))
        same = {k: old.get(k) for k in ("ledger_sha256", "files", "phase", "terminal_state", "shipment_recorded")}
        if same == {k: manifest.get(k) for k in same}:
            return parent, False
    identity = {"GIT_AUTHOR_NAME": "Talon Sturgill", "GIT_AUTHOR_EMAIL": "Talon.sturgill@gmail.com",
                "GIT_COMMITTER_NAME": "Talon Sturgill", "GIT_COMMITTER_EMAIL": "Talon.sturgill@gmail.com"}
    message = f"Checkpoint {run_id}: {manifest['phase']} ({manifest['note']})"[:200]
    args = ["commit-tree", tree, "-m", message] + (["-p", parent] if parent else [])
    commit = git(repo, *args, env=identity).stdout.decode().strip()
    return commit, True


def remote_tip(repo, run_id, remote):
    ref = f"refs/heads/{BRANCH}{run_id}"
    listed = git(repo, "ls-remote", "--heads", remote, ref, check=False)
    if listed.returncode:
        raise RuntimeError("cannot reach the checkpoint remote: " + listed.stderr.decode()[:200])
    line = listed.stdout.decode().split()
    if not line:
        return None
    git(repo, "fetch", "--quiet", "--no-tags", remote, ref)
    return git(repo, "rev-parse", "FETCH_HEAD").stdout.decode().strip()


def save(repo=REPO, state_path=None, note="manual", remote="origin", environ=None, push=True):
    repo = Path(repo)
    state_path = Path(state_path or repo / SCRATCH_ROOT / "run_state.json")
    run_id, manifest, ledger = build_bundle(repo, state_path, note, environ)
    parent = remote_tip(repo, run_id, remote) if push else None
    commit, changed = commit_tree(repo, run_id, manifest, ledger, parent)
    if changed and push:
        delay = 2
        for attempt in range(1, 6):
            result = git(repo, "push", "--quiet", remote, f"{commit}:refs/heads/{BRANCH}{run_id}", check=False)
            if not result.returncode:
                break
            if attempt == 5:
                raise RuntimeError("checkpoint push failed after 5 attempts: " + result.stderr.decode()[:300])
            import time
            time.sleep(delay); delay *= 2
        confirm = remote_tip(repo, run_id, remote)
        if confirm != commit:
            raise RuntimeError("remote checkpoint does not match the saved commit")
    git(repo, "update-ref", f"refs/heads/{BRANCH}{run_id}", commit)
    return {"run_id": run_id, "commit": commit, "changed": changed, "files": len(manifest["files"]),
            "bytes": sum(f["size"] for f in manifest["files"]), "phase": manifest["phase"],
            "excluded": len(manifest["excluded"])}


def show(repo, commit, path):
    return git(repo, "show", f"{commit}:{path}").stdout


def fetch_checkpoint(repo, run_id, remote):
    tip = remote_tip(repo, run_id, remote)
    if not tip:
        raise ValueError(f"no checkpoint for {run_id} on {remote}")
    return tip


def verify_checkpoint(repo, commit, run_id):
    base = f"{ROOT}/{run_id}"
    manifest = json.loads(show(repo, commit, f"{base}/manifest.json"))
    ledger = show(repo, commit, f"{base}/run_state.json")
    if manifest.get("schema") != SCHEMA or manifest.get("run_id") != run_id:
        raise ValueError("checkpoint manifest belongs to another run or schema")
    if hashlib.sha256(ledger).hexdigest() != manifest["ledger_sha256"]:
        raise ValueError("checkpoint ledger differs from its manifest")
    for row in manifest["files"]:
        if hashlib.sha256(show(repo, commit, f"{base}/files/{row['path']}")).hexdigest() != row["sha256"]:
            raise ValueError("checkpoint file differs from its manifest: " + row["path"])
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
                      "files": len(manifest["files"]), "finished": bool(done), "usage": manifest.get("usage")})
    return sorted(found, key=lambda row: row["saved_at"], reverse=True)


def restore(repo=REPO, run_id=None, remote="origin", force=False):
    repo = Path(repo)
    commit = fetch_checkpoint(repo, run_id, remote)
    manifest, ledger = verify_checkpoint(repo, commit, run_id)
    state_path = repo / SCRATCH_ROOT / "run_state.json"
    writes = [(state_path, ledger)] + [(repo / row["path"], show(repo, commit, f"{ROOT}/{run_id}/files/{row['path']}"))
                                        for row in manifest["files"]]
    for path, data in writes:
        if path.is_file() and path.read_bytes() != data and not force:
            raise ValueError("refusing to overwrite a different existing file: " + str(path.relative_to(repo))
                             + " (an active ledger is never replaced; use a clean checkout)")
    for path, data in writes:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    from production_lifecycle import allowance_problems
    from run_controller import read_state
    state = read_state(state_path)
    problems = allowance_problems(state)
    if problems:
        raise ValueError("restored ledger fails its allowance audit: " + "; ".join(problems))
    return {"run_id": run_id, "commit": commit, "phase": manifest["phase"], "restored_files": len(writes),
            "saved_at": manifest["saved_at"], "base_head": manifest["base_head"], "usage": manifest.get("usage")}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    p = sub.add_parser("save"); p.add_argument("--note", default="manual"); p.add_argument("--state", type=Path)
    p.add_argument("--remote", default="origin")
    p = sub.add_parser("discover"); p.add_argument("--remote", default="origin")
    p = sub.add_parser("restore"); p.add_argument("--run-id", required=True); p.add_argument("--remote", default="origin")
    p.add_argument("--force", action="store_true")
    args = parser.parse_args(argv)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    try:
        if args.action == "save":
            result = save(REPO, args.state, args.note, args.remote)
        elif args.action == "discover":
            result = discover(REPO, args.remote)
        else:
            result = restore(REPO, args.run_id, args.remote, args.force)
    except (ValueError, RuntimeError, OSError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
