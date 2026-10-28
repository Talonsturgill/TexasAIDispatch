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
from contextlib import contextmanager
import errno
import hashlib
import gzip
import io
import zlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

REPO = Path(__file__).resolve().parents[1]
SCHEMA = "dispatch_claude_checkpoint/2"
BRANCH = "claude/checkpoint/"
ROOT = "checkpoints"
TOKEN = "{REPO}"
PRELAUNCH_TOOLS = Path('/opt/texas-dispatch-tools')
RUN_ID = re.compile(r"\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\Z")

SCRATCH_ROOT = "out/dispatch"
# Source the edition authors. Committed source is retained by the recorded source pin; what is
# modified or untracked relative to that pin rides in the tree.
SOURCE_ROOTS = ("video-engine", "assets", "config")
# Directories that are rebuilt from retained inputs. A path carrying "fail" is evidence, never skipped.
REGENERABLE_DIRS = {"tmp", "cache", ".cache", "frames", "node_modules", "__pycache__"}
# One path component at a time. Private means Gmail, readbacks, delivery routing, env files, anything
# marked private, the delivery shipment manifest, and any component with credential or secret as a whole
# word (credentials-prod.json, credential_store.yaml, secret-key.png, a credentials directory), for every file
# type. A known synthetic failure render that merely names a view, like a credential-gate still, is kept by
# `neutralize`, a byte-identical neutral-named copy with its original-name, hash, time and invocation provenance.
PRIVATE_NAME = re.compile(r"(gmail|readback|routing|^\.env|(^|[._-])private([._-]|$)|shipment(?!-public))", re.I)
CREDENTIAL_WORDS = {"credential", "credentials", "secret", "secrets"}
PRIVATE_KEY = re.compile(r"(gmail|draft_?id|label_?ids|thread_?id|recipient|readback|routing|receipt_path)", re.I)
EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+")
SECRET_TEXT = re.compile(
    r"(AIza[0-9A-Za-z_\-]{30,}|gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{40,}|sk-[A-Za-z0-9_\-]{30,}"
    r"|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abprs]-[0-9A-Za-z\-]{20,})")
TEXT_SUFFIX = {".json", ".jsonl", ".md", ".txt", ".yaml", ".yml", ".csv", ".tsv", ".srt", ".vtt", ".html", ".ts", ".tsx", ".css", ".svg"}
MAX_FILE = 95 * 1024 * 1024          # GitHub rejects a blob over 100 MiB; fail visibly before that
# A finished native edition carries the exact film, its hero proof and the complete exact-film motion
# image sequence as required evidence (a restore would otherwise repurchase the charged extraction).
# That reached 969 MB on 2026-10-15 and refused the save, stopping paid review work. Git stores each
# blob once. Bound distinct stored bytes, retaining every logical evidence path.
MAX_TOTAL = 1280 * 1024 * 1024


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


GRANT_ROOTS_FILE = 'out/dispatch/grant-projection-roots.private.json'
GRANT_KINDS = {'owner_review_grant', 'owner_validator_grant', 'owner_preflight_grant', 'mandatory_completion_grant',
               'narration_recovery_review_verified', 'narration_recovery_capacity_verified',
               'source_validation_capacity_verified', 'owner_codex_repair_granted'}
GRANT_TEXTS = {'authorization_json': 'authorization_sha256',
               'failure_evidence_json': 'failure_evidence_sha256',
               'plan_json': 'plan_sha256', 'precheck_json': 'precheck_sha256',
               'policy_json': 'policy_sha256', 'receipt_json': 'receipt_sha256',
               'report_json': 'report_sha256'}


def grant_anchor(grant):
    return grant[{'mandatory_completion_grant': 'plan_sha256',
                  'narration_recovery_capacity_verified': 'plan_sha256',
                  'source_validation_capacity_verified': 'plan_sha256',
                  'narration_recovery_review_verified': 'receipt_sha256'}.get(
                      grant['kind'], 'authorization_sha256')]


def grant_text_fields(grant):
    required = ({'authorization_json', 'plan_json', 'failure_evidence_json'}
                if grant['kind'] == 'owner_codex_repair_granted' else
                {'plan_json', 'failure_evidence_json', 'precheck_json', 'policy_json'}
                if grant['kind'] in {'mandatory_completion_grant', 'narration_recovery_capacity_verified', 'source_validation_capacity_verified'} else
                {'receipt_json', 'report_json'} if grant['kind'] == 'narration_recovery_review_verified'
                else {'authorization_json', 'failure_evidence_json'})
    if any(key not in grant or GRANT_TEXTS[key] not in grant for key in required):
        raise CheckpointError('hash-bound event text or digest is missing')
    return required


def grant_roots(state, root):
    """Origin paths are recovery metadata, never changes to an authorization or its hashes."""
    path = Path(root) / GRANT_ROOTS_FILE
    saved = json.loads(path.read_text()) if path.is_file() else {'schema': 1, 'entries': []}
    if saved.get('schema') != 1 or not isinstance(saved.get('entries'), list):
        raise CheckpointError('grant projection origin metadata is invalid')
    known = {}
    for row in saved['entries']:
        if (set(row) != {'event_index', 'authorization_sha256', 'root'}
                or type(row['event_index']) is not int
                or not re.fullmatch(r'[0-9a-f]{64}', row['authorization_sha256'])
                or not Path(row['root']).is_absolute()):
            raise CheckpointError('grant projection origin metadata is invalid')
        key = (row['event_index'], row['authorization_sha256'])
        if key in known:
            raise CheckpointError('duplicate grant projection origin')
        known[key] = row['root']
    # The legacy metadata key remains stable; completion records use their plan or
    # receipt hash as the anchor instead of an owner authorization hash.
    return [{'event_index': index, 'authorization_sha256': grant_anchor(grant),
             'root': known.get((index, grant_anchor(grant)), str(root))}
            for index, grant in enumerate(state.get('events', [])) if grant.get('kind') in GRANT_KINDS]


def unproject_grants(state, manifest):
    origins = {(r['event_index'], r['authorization_sha256']): r['root']
               for r in manifest.get('grant_origin_roots', [])}
    restored = {}
    for index, grant in enumerate(state.get('events', [])):
        if grant.get('kind') not in GRANT_KINDS:
            continue
        origin = origins.get((index, grant_anchor(grant)), manifest['repo_root'])
        fields = {key: expand(grant[key], origin) for key in grant_text_fields(grant)}
        if any(sha256(value.encode()) != grant[GRANT_TEXTS[key]] for key, value in fields.items()):
            raise CheckpointError('hash-bound grant evidence cannot be restored exactly')
        restored[index] = fields
    return restored


def restored_ledger(state, destination, manifest):
    result = expand(state, destination)
    for index, fields in unproject_grants(state, manifest).items():
        result['events'][index].update(fields)
    return result


def public_projection(state, root):
    from public_state import export
    result = export(state)
    origins = grant_roots(result, root)
    for row in origins:
        grant = result['events'][row['event_index']]
        for key in grant_text_fields(grant):
            grant[key] = portable(grant[key], row['root'])
    result = redact(portable(result, root))
    # A private value inside exact rejection evidence must fail closed, not corrupt its hash.
    unproject_grants(result, {'repo_root': str(root), 'grant_origin_roots': origins})
    return result, origins


def public_ledger(state, root):
    return public_projection(state, root)[0]


def ledger_text(state, root):
    return json.dumps(public_ledger(state, root), indent=2, sort_keys=True) + "\n"


# ---- what a checkpoint retains --------------------------------------------------------------

def private_component(part, last):
    if PRIVATE_NAME.search(part):
        return True
    return bool(CREDENTIAL_WORDS & set(re.split(r"[._\-\s]+", part.lower())))


def private_path(rel):
    parts = Path(rel).parts
    return any(private_component(part, index == len(parts) - 1) for index, part in enumerate(parts))


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
        elif path.stat().st_size > MAX_FILE and (path.stat().st_size > MAX_TOTAL or path.suffix.lower() not in TEXT_SUFFIX):
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


def leaks(items, environ, repo=None):
    """Relative paths whose stored text carries a credential value or key-shaped string."""
    values = credential_values(environ)
    found = []
    for rel, data in items:
        if Path(rel).suffix.lower() not in TEXT_SUFFIX:
            continue
        text = data.decode(errors="replace")
        if any(v in text for v in values):
            found.append(rel)
            continue
        if repo is not None:
            from checkpoint_image_data import scan_view, SecretImageMetadata
            try:
                view = scan_view(repo,rel,data,SECRET_TEXT,values)
            except SecretImageMetadata:
                found.append(rel)
                continue
            if view is not None: text=view
        if SECRET_TEXT.search(text):
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


AUTHORIZATION_FILE = "out/dispatch/capture-authorization.json"
USED_FILE = "out/dispatch/capture-authorizations-used.json"


def authorization_problems(old_files, new_files):
    """Capture consumption never goes backwards across writers. A stale container that still holds an
    unconsumed authorization can't overwrite the remote record, and the used-reservation log never shrinks."""
    errors = []
    try:
        old = json.loads(old_files[AUTHORIZATION_FILE]) if AUTHORIZATION_FILE in old_files else None
        new = json.loads(new_files[AUTHORIZATION_FILE]) if AUTHORIZATION_FILE in new_files else None
    except (ValueError, KeyError):
        return ["a capture authorization could not be read for the monotonic check"]
    if old is not None:
        if new is None:
            errors.append("the consumed capture authorization disappeared")
        elif (old.get("render_reservation") or {}).get("event_sha256") == (new.get("render_reservation") or {}).get("event_sha256"):
            now_consumed = {c["id"]: c.get("consumed") for c in new.get("commands", [])}
            for entry in old.get("commands", []):
                if entry.get("consumed") and not now_consumed.get(entry["id"]):
                    errors.append("an authorized capture command that was consumed is marked unused again")
    try:
        old_used = json.loads(old_files[USED_FILE]) if USED_FILE in old_files else []
        new_used = json.loads(new_files[USED_FILE]) if USED_FILE in new_files else []
    except ValueError:
        return errors + ["the used capture reservation log could not be read"]
    missing = {u["event_sha256"] for u in old_used} - {u["event_sha256"] for u in new_used}
    if missing:
        errors.append("a used capture reservation was removed from the log")
    return errors


def storage_accounting(files):
    unique = {(row['sha256'], row['size']) for row in files}
    return {'logical_bytes': sum(row['size'] for row in files),
            'unique_blob_bytes': sum(size for _, size in unique), 'unique_blobs': len(unique)}


def encoded_storage(data):
    """Deterministic transport only: the original evidence is never rewritten."""
    buffer = io.BytesIO()
    with gzip.GzipFile(fileobj=buffer, mode='wb', filename='', mtime=0, compresslevel=6) as stream:
        for at in range(0, len(data), 1 << 20):
            stream.write(data[at:at+(1 << 20)])
            if buffer.tell() > MAX_FILE:
                raise RetentionError('lossless encoded evidence exceeds the unchanged blob limit')
    encoded = buffer.getvalue()
    if len(encoded) > MAX_FILE:
        raise RetentionError('lossless encoded evidence exceeds the unchanged blob limit')
    return encoded


def storage_metadata(row):
    storage = row.get('storage')
    if storage is None:
        return None
    if (not isinstance(storage, dict) or set(storage) != {'encoding', 'size', 'sha256'}
            or storage['encoding'] != 'gzip/1' or type(storage['size']) is not int
            or not 0 < storage['size'] <= MAX_FILE
            or re.fullmatch('[0-9a-f]{64}', str(storage['sha256'])) is None
            or Path(row['path']).suffix.lower() not in TEXT_SUFFIX
            or type(row.get('size')) is not int or not MAX_FILE < row['size'] <= MAX_TOTAL
            or re.fullmatch('[0-9a-f]{64}', str(row.get('sha256'))) is None):
        raise CheckpointError('invalid encoded checkpoint metadata: ' + str(row.get('path')))
    return storage


def consume_checkpoint_row(read, oid, row, sink=None):
    """Stream and verify stored bytes, then exact original bytes with a bounded decoder."""
    storage = storage_metadata(row)
    if storage is None:
        size, digest, _ = read(oid, consume=sink, max_size=MAX_FILE)
    else:
        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
        original = hashlib.sha256(); size = 0

        def consume(chunk):
            nonlocal size
            pending = chunk
            try:
                while pending:
                    decoded = decoder.decompress(pending, min(1 << 20, row['size'] - size + 1))
                    size += len(decoded)
                    if size > row['size']:
                        raise CheckpointError('decoded checkpoint exceeds its original size: ' + row['path'])
                    original.update(decoded)
                    if sink is not None:
                        sink(decoded)
                    if decoder.unused_data:
                        raise CheckpointError('encoded checkpoint has trailing data: ' + row['path'])
                    pending = decoder.unconsumed_tail
            except zlib.error as exc:
                raise CheckpointError('invalid encoded checkpoint stream: ' + row['path']) from exc

        stored_size, stored_digest, _ = read(oid, consume=consume, max_size=MAX_FILE)
        if stored_size != storage['size'] or stored_digest != storage['sha256']:
            raise CheckpointError('encoded checkpoint differs from stored binding: ' + row['path'])
        if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
            raise CheckpointError('encoded checkpoint is truncated or has trailing data: ' + row['path'])
        digest = original.hexdigest()
    if digest != row['sha256']:
        raise CheckpointError('checkpoint file differs from its manifest: ' + row['path'])
    if 'size' in row and (type(row['size']) is not int or size != row['size']):
        raise CheckpointError('checkpoint file size differs from its manifest: ' + row['path'])


def materialize_checkpoint_file(repo, commit, run_id, row, target):
    """Write one verified logical file; callers stage it before replacing active evidence."""
    relative = row['path']
    if (not RUN_ID.fullmatch(run_id) or not re.fullmatch('[0-9a-f]{40}', commit)
            or not isinstance(relative, str) or not relative or '\0' in relative
            or PurePosixPath(relative).is_absolute() or '..' in PurePosixPath(relative).parts
            or PurePosixPath(relative).as_posix() != relative):
        raise CheckpointError('unsafe checkpoint materialization path')
    path = f'{ROOT}/{run_id}/files/{relative}'
    listing = git(repo, 'ls-tree', '-z', '--full-tree', commit, '--', path).stdout
    entries = list(filter(None, listing.split(b'\0')))
    if len(entries) != 1 or b'\t' not in entries[0]:
        raise CheckpointError('checkpoint file is missing: ' + relative)
    metadata, actual_path = entries[0].split(b'\t', 1)
    mode, kind, oid = metadata.decode('ascii').split()
    if (actual_path.decode('utf-8', errors='surrogateescape') != path
            or kind != 'blob' or mode not in {'100644', '100755'}):
        raise CheckpointError('checkpoint file is not a regular blob: ' + relative)
    with _checkpoint_blob_reader(repo) as read, Path(target).open('wb') as output:
        consume_checkpoint_row(read, oid, row, output.write)


def build_bundle(repo, state_path, note, environ=None):
    environ = os.environ if environ is None else environ
    repo = Path(repo)
    state = json.loads(Path(state_path).read_text())
    run_id = str(state["run_id"])
    if not RUN_ID.fullmatch(run_id):
        raise CheckpointError("run id is not a safe branch name")
    ledger_obj, grant_origin_roots = public_projection(state, repo)
    ledger = json.dumps(ledger_obj, indent=2, sort_keys=True) + "\n"
    chosen, excluded, problems, regenerable, deleted = candidates(repo)
    if problems:
        raise RetentionError("required evidence cannot be retained: " + "; ".join(problems[:6]))
    stored = {rel: stored_bytes(repo, rel) for rel in chosen}
    bad = leaks(stored.items(), environ, repo=repo)
    if SECRET_TEXT.search(ledger) or any(v in ledger for v in credential_values(environ)):
        bad.append("ledger")
    if bad:
        raise CheckpointError("checkpoint refused: credential-shaped content in " + ", ".join(bad))
    files = [{"path": rel, "class": chosen[rel], "sha256": sha256(data), "size": len(data)}
             for rel, data in sorted(stored.items())]
    storage = storage_accounting(files)
    total = storage['unique_blob_bytes']
    if total > MAX_TOTAL:
        raise RetentionError("required distinct evidence totals %d bytes, over the %d byte limit" % (total, MAX_TOTAL))
    encodings = {}
    for row in files:
        if row['size'] > MAX_FILE:
            key = (row['sha256'], row['size'])
            if key not in encodings:
                encodings[key] = encoded_storage(stored[row['path']])
            data = encodings[key]
            row['storage'] = {'encoding': 'gzip/1', 'size': len(data), 'sha256': sha256(data)}
            stored[row['path']] = data
    pin = git(repo, "rev-parse", "HEAD").stdout.decode().strip()
    closure = git(repo, "ls-tree", "-r", pin, "--", "video-engine").stdout
    branch = git(repo, "branch", "--show-current", check=False).stdout.decode().strip()
    manifest = {"schema": SCHEMA, "run_id": run_id, "saved_at": now(), "note": note, "phase": state.get("phase"),
                "terminal_state": state.get("terminal_state"), "shipment_recorded": bool(state.get("shipment")),
                "created_at": state.get("created_at"), "repo_root": str(repo), "source_pin": pin, "source_branch": branch or None,
                "source_closure": {"root": "video-engine", "files": closure.count(b"\n"), "sha256": sha256(closure)},
                "deleted_source": deleted, "ledger_sha256": sha256(ledger.encode()),
                "original_private_ledger_sha256": ledger_obj["public_export"]["original_private_state_sha256"],
                "grant_origin_roots": grant_origin_roots,
                "usage": state.get("usage"), "files": files, "storage_accounting": storage,
                "excluded": excluded, "regenerable": regenerable,
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
    def identity(row):
        return row['sha256'], row.get('size'), row.get('storage')
    old_hash = {row["path"]: identity(row) for row in (old_manifest or {}).get("files", [])}
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
            reuse = old_blobs.get(row["path"]) if old_hash.get(row["path"]) == identity(row) else None
            add(f"{base}/files/{row['path']}", reuse or write(stored[row["path"]]))
        git(repo, "update-index", "--add", "--index-info", env=env, data="".join(lines).encode())
        tree = git(repo, "write-tree", env=env).stdout.decode().strip()
    if old_manifest:
        keys = ("ledger_sha256", "files", "phase", "terminal_state", "shipment_recorded", "source_pin", "deleted_source", "grant_origin_roots")
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
        old_files = {path: show(repo, parent, f"{ROOT}/{run_id}/files/{path}") for path in (AUTHORIZATION_FILE, USED_FILE)
                     if path in {row["path"] for row in old_manifest.get("files", [])}}
        errors += authorization_problems(old_files, {k: v for k, v in stored.items() if k in (AUTHORIZATION_FILE, USED_FILE)})
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
            "unique_blob_bytes": manifest['storage_accounting']['unique_blob_bytes'],
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
    if not required(state_path):
        return
    if flag_path(state_path).is_file():
        raise UnbackedError("the latest charges or outputs are not durable (" + str(flag_path(state_path))
                            + "); run `python scripts/claude_checkpoint.py recover` before more paid work")
    if PRELAUNCH_TOOLS.is_dir():
        repo = repo_of(state_path)
        for name in ('public_state.py', 'claude_checkpoint.py'):
            installed, active = PRELAUNCH_TOOLS / 'scripts' / name, repo / 'scripts' / name
            if not installed.is_file() or not active.is_file() or sha256(installed) != sha256(active):
                raise CheckpointError('prelaunch checkpoint codec differs from production (' + name +
                                      '); preserve the checkpoint and use a fresh supported routine launch '
                                      'after environment setup, before more paid work')


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

@contextmanager
def _checkpoint_blob_reader(repo):
    """One Git process; stream bodies and reuse only immutable OIDs within this call."""
    with tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(['git', '-C', str(repo), 'cat-file', '--batch'],
                                   stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=errors)
        timer = threading.Timer(900, process.kill)
        timer.daemon = True
        timer.start()
        hashes = {}

        def read(oid, retain=False, consume=None, max_size=None):
            if oid in hashes and not retain and consume is None:
                size, digest = hashes[oid]
                if max_size is not None and size > max_size:
                    raise CheckpointError('checkpoint stored blob exceeds its byte limit: ' + oid)
                return size, digest, None
            process.stdin.write(oid.encode('ascii') + b'\n')
            process.stdin.flush()
            header = process.stdout.readline(256).strip().split()
            if (len(header) != 3 or header[0].decode('ascii', errors='replace') != oid
                    or header[1] != b'blob' or not header[2].isdigit()):
                raise CheckpointError('checkpoint object is missing or is not a blob: ' + oid)
            size = remaining = int(header[2])
            if max_size is not None and size > max_size:
                raise CheckpointError('checkpoint stored blob exceeds its byte limit: ' + oid)
            digest = hashlib.sha256()
            body = bytearray() if retain else None
            while remaining:
                chunk = process.stdout.read(min(1 << 20, remaining))
                if not chunk:
                    raise CheckpointError('checkpoint blob stream ended before its declared size: ' + oid)
                digest.update(chunk)
                if consume is not None:
                    consume(chunk)
                if body is not None:
                    body.extend(chunk)
                remaining -= len(chunk)
            if process.stdout.read(1) != b'\n':
                raise CheckpointError('checkpoint blob stream has an invalid terminator: ' + oid)
            hashes[oid] = (size, digest.hexdigest())
            return size, digest.hexdigest(), bytes(body) if body is not None else None

        try:
            yield read
            process.stdin.close()
            if process.wait(timeout=30):
                errors.seek(0)
                raise CheckpointError('git cat-file failed: ' + errors.read(400).decode(errors='replace'))
        except (BrokenPipeError, subprocess.TimeoutExpired) as exc:
            raise CheckpointError('checkpoint blob reader failed or timed out') from exc
        finally:
            timer.cancel()
            if process.poll() is None:
                process.kill()
            process.wait()
            process.stdin.close()
            process.stdout.close()


def verify_checkpoint(repo, commit, run_id):
    if not isinstance(run_id, str) or not RUN_ID.fullmatch(run_id):
        raise CheckpointError('checkpoint run id is not a safe path')
    base = f"{ROOT}/{run_id}"
    # Resolve the caller's ref once. Every path is then looked up in that exact tree,
    # never interpolated into another revision expression or followed through symlinks.
    pin = git(repo, 'rev-parse', '--verify', '--end-of-options', str(commit)+'^{commit}').stdout.decode().strip()
    entries = {}
    listing = git(repo, 'ls-tree', '-r', '-z', '--full-tree', pin, '--', base).stdout
    for entry in filter(None, listing.split(b'\0')):
        metadata, path = entry.split(b'\t', 1)
        mode, kind, oid = metadata.decode('ascii').split()
        entries[path.decode('utf-8', errors='surrogateescape')] = (mode, kind, oid)

    def blob(path):
        row = entries.get(path)
        if row is None:
            raise CheckpointError('checkpoint file is missing: ' + path)
        mode, kind, oid = row
        if kind != 'blob' or mode not in {'100644', '100755'}:
            raise CheckpointError('checkpoint file is not a regular blob: ' + path)
        return oid

    with _checkpoint_blob_reader(repo) as read:
        _, _, raw = read(blob(f'{base}/manifest.json'), retain=True)
        manifest = json.loads(raw)
        _, ledger_digest, ledger = read(blob(f'{base}/run_state.json'), retain=True)
        if manifest.get("schema") != SCHEMA or manifest.get("run_id") != run_id:
            raise CheckpointError("checkpoint manifest belongs to another run or schema")
        if ledger_digest != manifest["ledger_sha256"]:
            raise CheckpointError("checkpoint ledger differs from its manifest")
        seen = set(); decoded = set()
        for row in manifest["files"]:
            rel = row['path']
            if (not isinstance(rel, str) or not rel or '\0' in rel
                    or PurePosixPath(rel).is_absolute() or '..' in PurePosixPath(rel).parts
                    or PurePosixPath(rel).as_posix() != rel or rel in seen):
                raise CheckpointError('checkpoint manifest has an invalid or repeated file path: ' + str(rel))
            seen.add(rel)
            oid = blob(f'{base}/files/{rel}')
            key = (oid, row['sha256'], row.get('size'), json.dumps(row.get('storage'), sort_keys=True))
            storage_metadata(row)  # Every path still validates its own typed metadata.
            if row.get('storage') is None or key not in decoded:
                consume_checkpoint_row(read, oid, row)
                decoded.add(key)
        if ('storage_accounting' in manifest
                and manifest['storage_accounting'] != storage_accounting(manifest['files'])):
            raise CheckpointError('checkpoint storage accounting differs from its verified files')
    return manifest, ledger


def discover(repo=REPO, remote="origin"):
    """Use the same verified selection and isolated snapshots as the startup catalog."""
    from checkpoint_discovery import discover as catalog
    return catalog(repo, remote)


def neutralize(repo, path, invocation, nature="synthetic scene render"):
    """Retain a private-named but known synthetic failure render as a byte-identical neutral-named copy plus provenance."""
    repo = Path(repo)
    source = Path(path)
    digest = sha256(source)
    folder = repo / SCRATCH_ROOT / "retained-failures" / "neutral"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / ("still-%s%s" % (digest[:12], source.suffix.lower()))
    shutil.copy2(source, target)
    if sha256(target) != digest:
        raise CheckpointError("neutral copy is not byte-identical")
    mapping_path = folder / "mapping.json"
    mapping = json.loads(mapping_path.read_text()) if mapping_path.is_file() else []
    if not any(row["sha256"] == digest and row["original_name"] == source.name for row in mapping):
        mapping.append({"original_name": source.name, "original_path": str(source), "neutral_copy": target.relative_to(repo).as_posix(),
                        "sha256": digest, "bytes": source.stat().st_size,
                        "source_mtime_utc": datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat(),
                        "invocation": invocation, "nature": nature, "copied_at": now()})
        mapping_path.write_text(json.dumps(mapping, indent=2) + "\n")
    return {"neutral_copy": str(target), "sha256": digest, "mapping": str(mapping_path)}


def oldest_unfinished(found):
    """The edition to resume first: oldest by run identity, then ledger creation time. Never found[0],
    which discover orders newest save first."""
    open_rows = [row for row in found if not row["finished"] and not row.get('failed_retained')]
    return min(open_rows, key=lambda row: (row["run_id"][:10], row.get("created_at") or "", row["run_id"]), default=None)


def original_destination(repo, manifest, workspace):
    """Keep hash-bound event paths at their recorded root inside this host workspace."""
    repo, workspace = Path(repo).resolve(), Path(workspace).resolve()
    dest = Path(manifest['repo_root'])
    if (workspace == Path(workspace.anchor) or repo.parent != workspace
            or not dest.is_absolute() or '..' in dest.parts
            or dest == workspace or not dest.is_relative_to(workspace)
            or dest.resolve() != dest):
        raise CheckpointError('recorded origin must be a real directory inside the selected shared workspace')
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):
        raise CheckpointError('recorded origin is occupied; preserve it and inspect its existing edition before resuming')
    return dest


def restored_audit(destination):
    """Run existing gates with the restored checkout as their real module root.

    A caller importing gates from its own clean source checkout cannot supply the
    restored authored modules merely by passing repo to the outermost gate.
    Nested gates use their own __file__ roots, so isolate the whole import graph.
    """
    destination = Path(destination).resolve()
    code = ('from pathlib import Path; import json,sys; '
            'sys.path.insert(0,str(Path.cwd()/"scripts")); '
            'from production_lifecycle import allowance_problems; '
            'from run_controller import restored_deliverable_problems,read_state; '
            'state=read_state(Path("out/dispatch/run_state.json")); '
            'errors=allowance_problems(state); '
            'errors+=restored_deliverable_problems(state,Path("out/dispatch/run_state.json")) '
            'if state.get("deliverable") and not errors else []; '
            'print(json.dumps(errors))')
    result = subprocess.run([sys.executable,'-c',code],cwd=destination,
                            capture_output=True,text=True,timeout=300)
    if result.returncode:
        raise CheckpointError('restored isolated audit could not run: '+result.stderr[-1500:])
    errors = json.loads(result.stdout)
    if not isinstance(errors,list) or not all(isinstance(error,str) for error in errors):
        raise CheckpointError('restored isolated audit did not return its actual gate findings')
    return errors


def restore(repo=REPO, run_id=None, remote="origin", dest=None, *, origin_workspace=None, helper_source=None):
    """Rebuild an unfinished edition in a NEW isolated checkout of its recorded source pin."""
    repo = Path(repo)
    tip = remote_tip(repo, run_id, remote)
    if not tip:
        raise CheckpointError(f"no checkpoint for {run_id} on {remote}")
    manifest, ledger = verify_checkpoint(repo, tip, run_id)
    if manifest.get("terminal_state") == "shipped" and manifest.get("shipment_recorded"):
        raise CheckpointError(f"{run_id} already shipped; a finished edition is immutable and is not restored")
    if origin_workspace is not None:
        if dest is not None:
            raise CheckpointError('choose a destination or the recorded origin, never both')
        dest = original_destination(repo, manifest, origin_workspace)
    else:
        dest = Path(dest) if dest else repo.parent / f"{repo.name}-{run_id}"
    if dest.exists() and any(dest.iterdir()):
        raise CheckpointError(f"restore needs a new empty directory; {dest} exists")
    pin = manifest["source_pin"]
    if git(repo, "cat-file", "-e", pin + "^{commit}", check=False).returncode:
        raise CheckpointError("the recorded source pin is not in the checkpoint history: " + pin)
    git(repo, "worktree", "add", "--quiet", "--detach", str(dest), pin)
    from source_view import full_production_view
    full_production_view(dest)
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
        materialize_checkpoint_file(repo, tip, run_id, row, target)
        if target.name == "run_state.json":
            target.write_text(json.dumps(restored_ledger(json.loads(target.read_text()), dest, manifest),
                                         indent=2, sort_keys=True) + "\n")
    state_path = dest / SCRATCH_ROOT / "run_state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    source_ledger = json.loads(ledger)
    state_path.write_text(json.dumps(restored_ledger(source_ledger, dest, manifest), indent=2, sort_keys=True) + "\n")
    origins = manifest.get('grant_origin_roots') or [
        {'event_index': index, 'authorization_sha256': grant_anchor(grant), 'root': manifest['repo_root']}
        for index, grant in enumerate(source_ledger.get('events', [])) if grant.get('kind') in GRANT_KINDS]
    (dest / GRANT_ROOTS_FILE).write_text(json.dumps({'schema': 1, 'entries': origins}, indent=2) + '\n')
    (state_path.parent / "claude-host.json").write_text(json.dumps({"run_id": run_id, "restored_from": tip, "at": now()}) + "\n")
    if helper_source is not None:
        # The compute caller has already verified its immutable request source.
        # Install that same helper closure before any nested audit imports it.
        helper_source = Path(helper_source).resolve()
        if helper_source == (dest/'scripts').resolve() or not (helper_source/'run_controller.py').is_file():
            raise CheckpointError('delegated audit needs the separate immutable helper source')
        shutil.copytree(helper_source,dest/'scripts',dirs_exist_ok=True)
    # Without an explicit delegated source, these remain the recorded source
    # pin's own helpers. Every nested gate must read that same restored edition.
    problems = restored_audit(dest)
    state = json.loads(state_path.read_text())
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
    p = sub.add_parser("neutralize", help="retain a private-named synthetic failure render as a neutral-named byte copy")
    p.add_argument("--path", type=Path, required=True); p.add_argument("--invocation", required=True)
    p.add_argument("--nature", default="synthetic scene render")
    p = sub.add_parser("recover"); p.add_argument("--state", type=Path); p.add_argument("--remote", default="origin")
    p = sub.add_parser("discover"); p.add_argument("--remote", default="origin")
    p.add_argument("--oldest-unfinished", action="store_true", help="print only the edition to resume first")
    p = sub.add_parser("restore"); p.add_argument("--run-id", required=True); p.add_argument("--remote", default="origin")
    p.add_argument("--dest", type=Path)
    p.add_argument("--origin-workspace", type=Path,
                   help="restore at the recorded original root within this checkout's shared parent; refuses occupied paths")
    p = sub.add_parser("guard", help="make state durable, run one paid command, make its outputs durable")
    p.add_argument("--note", required=True); p.add_argument("--state", type=Path); p.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args(argv)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    repo = args.repo.resolve()
    try:
        state = getattr(args, "state", None) or repo / SCRATCH_ROOT / "run_state.json"
        if args.action == "save":
            result = save(repo, state, args.note, args.remote)
        elif args.action == "neutralize":
            result = neutralize(repo, args.path, args.invocation, args.nature)
        elif args.action == "recover":
            result = save_with_recovery(repo, state, "recover", remote=args.remote)
            flag_path(state).unlink(missing_ok=True)
        elif args.action == "discover":
            result = discover(repo, args.remote)
            if args.oldest_unfinished:
                result = oldest_unfinished(result)
        elif args.action == "restore":
            result = restore(repo, args.run_id, args.remote, args.dest, origin_workspace=args.origin_workspace)
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
