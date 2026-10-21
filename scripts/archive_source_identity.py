"""Bind immutable published evidence to reviewed capture-source identities in CI."""
from contextlib import contextmanager
from contextvars import ContextVar
import hashlib
import json
from pathlib import Path
import re
import subprocess

_IDENTITY = ContextVar("archive_source_identity", default=None)
CONFIG = "config/retained_capture_sources.json"
METADATA = {"run_state.json", "email.md", "cinematic-learning.json", "recurring-defects.json"}
STATE_FIELDS = {"phase", "terminal_state", "events", "updated_at", "public_export", "shipment"}
CAPTURE = {"scripts/opening_compare.py", "video-engine/scripts/render-batch.mjs", "video-engine/package-lock.json"}
INSPECTOR = {"opening_compare.py", "preflight_animatic.py", "creative_production.py", "documentary_check.py"}


def historical_identity(kind):
    """Return provenance only during an admitted archive publication check."""
    return (_IDENTITY.get() or {}).get(kind)


def _git(repo, *args):
    result = subprocess.run(["git", *args], cwd=repo, capture_output=True)
    if result.returncode:
        raise ValueError("archive source Git evidence unavailable: " + result.stderr.decode(errors="replace").strip())
    return result.stdout


def _sha(value):
    return hashlib.sha256(value).hexdigest()


def _file_sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def _fingerprint(value):
    return _sha(json.dumps(value, sort_keys=True, separators=(",", ":")).encode())


def _tree(repo, revision, prefix):
    result = {}
    for row in _git(repo, "ls-tree", "-rz", revision, "--", prefix).split(b"\0"):
        if row:
            description, name = row.split(b"\t", 1)
            mode, kind, oid = description.decode().split()
            if kind != "blob" or mode not in {"100644", "100755"}:
                raise ValueError("archive evidence must contain regular files")
            result[name.decode()] = (mode, oid)
    return result


def _read(repo, revision, name):
    return json.loads(_git(repo, "show", revision + ":" + name))


def _finished_receipts(receipts):
    if not receipts or any(not isinstance(row, dict) or row.get("kind") != "finished"
            or row.get("result") != "shipped" or not isinstance(row.get("at"), str) or not row["at"].strip()
            or re.fullmatch(r"[0-9a-f]{64}", str(row.get("shipment_sha256"))) is None for row in receipts):
        raise ValueError("archive closure requires complete shipment receipts")


def _shipment_binding(shipment, receipt, film):
    if (not isinstance(shipment, dict) or shipment.get("film_sha256") != film
            or shipment.get("manifest_sha256") != receipt["shipment_sha256"]):
        raise ValueError("archive closure lost its shipment binding")


def _closure(repo, base, day):
    prefix = "runs/" + day + "/"
    before, after = _tree(repo, base, prefix), _tree(repo, "HEAD", prefix)
    state_path = prefix + "run_state.json"
    if state_path not in before or state_path not in after:
        return None
    old, new = _read(repo, base, state_path), _read(repo, "HEAD", state_path)
    if new.get("terminal_state") != "shipped" or old.get("terminal_state") not in (None, "shipped"):
        return None
    already_shipped = old.get("terminal_state") == "shipped"
    # A depth-one CI checkout retains its immutable parent IDs even though Git's
    # ancestry walk treats HEAD as a root. An exact parent still proves lineage.
    base_oid = _git(repo, "rev-parse", base + "^{commit}").decode().strip()
    commit_header = _git(repo, "cat-file", "-p", "HEAD").split(b"\n\n", 1)[0]
    parents = {line[7:].decode() for line in commit_header.splitlines() if line.startswith(b"parent ")}
    if base_oid not in parents:
        _git(repo, "merge-base", "--is-ancestor", base, "HEAD")
    allowed = {prefix + name for name in METADATA}
    if set(before) - set(after) or any(before.get(p) != after.get(p) for p in set(before) | set(after) if p not in allowed):
        raise ValueError("archive closure changed published production evidence")
    disk = {str(p.relative_to(repo)) for p in (repo / prefix).rglob("*") if p.is_file() or p.is_symlink()}
    if disk != set(after):
        raise ValueError("archive closure has uncommitted or missing evidence")
    for name, (_, oid) in after.items():
        path = repo / name
        if path.is_symlink() or _git(repo, "hash-object", "--no-filters", name).decode().strip() != oid:
            raise ValueError("archive closure has uncommitted evidence substitutions")
    if (old.get("mode") != "production" or old.get("run_id") != day
            or old.get("phase") != ("shipped" if already_shipped else "publishing")
            or old.get("release_status") != "publishable"
            or new.get("phase") != "shipped"
            or {k: v for k, v in old.items() if k not in STATE_FIELDS} != {k: v for k, v in new.items() if k not in STATE_FIELDS}):
        raise ValueError("archive closure changed its accepted production ledger")
    events, appended = old.get("events", []), new.get("events", [])
    if not events or len(appended) <= len(events) or appended[:len(events)] != events:
        raise ValueError("archive closure must retain its exact event prefix")
    _finished_receipts(appended[len(events):])
    releases = [i for i, row in enumerate(events) if isinstance(row, dict) and row.get("kind") == "release_authorized"]
    if not releases or (not already_shipped and releases[-1] != len(events) - 1):
        raise ValueError("archive closure lacks its original publication authorization")
    release = events[releases[-1]]
    film = _file_sha(repo / prefix / "dispatch.mp4")
    report = old.get("final_report") or {}
    if already_shipped:
        _finished_receipts(events[releases[-1] + 1:])
        _shipment_binding(old.get("shipment"), events[-1], film)
    _shipment_binding(new.get("shipment"), appended[-1], film)
    if (release.get("kind") != "release_authorized" or release.get("result") != "publishable"
            or release.get("report_sha256") != report.get("sha256")
            or report.get("sha256") != _file_sha(repo / prefix / "report_card.json")
            or report.get("film_sha256") != film or (old.get("deliverable") or {}).get("film_sha256") != film):
        raise ValueError("archive closure lost its publication or shipment binding")
    return prefix


def _source_identity(repo, base, prefix):
    config_path = repo / CONFIG
    if not config_path.is_file():
        return None
    raw = _git(repo, "show", "HEAD:" + CONFIG)
    if config_path.is_symlink() or config_path.read_bytes() != raw:
        raise ValueError("archive source provenance must be committed")
    config = json.loads(raw)
    if config.get("schema") != "dispatch-retained-capture-sources/1":
        raise ValueError("unknown archive source provenance schema")
    receipt = _read(repo, base, prefix + "openings/comparison.json")
    fonts = {str(p.relative_to(repo)) for p in (repo / "video-engine/public/fonts").glob("*") if p.is_file()}
    capture = CAPTURE | fonts
    dependencies = capture | {"scripts/" + name for name in INSPECTOR}
    for entry in config.get("sources", []):
        original, current = entry["original_dependencies"], entry["current_dependencies"]
        if (re.fullmatch(r"[0-9a-f]{40}", str(entry.get("original_source"))) is None
                or set(original) != dependencies or set(current) != dependencies
                or any(re.fullmatch(r"[0-9a-f]{64}", str(v)) is None for v in [*original.values(), *current.values()])):
            raise ValueError("incomplete archive source dependency provenance")
        identity = {"producer": _fingerprint({p: original[p] for p in capture}),
                    "inspector": _fingerprint({p: original["scripts/" + p] for p in INSPECTOR})}
        if identity["producer"] != receipt.get("producer_sha256"):
            continue
        if any((repo / p).is_symlink() or _file_sha(repo / p) != sha for p, sha in current.items()):
            raise ValueError("reviewed current capture or inspection dependencies changed")
        options = receipt.get("options", [])
        if len(options) != 2 or {o.get("id") for o in options} != {"a", "b"}:
            raise ValueError("archive source needs both retained opening inspections")
        for option in options:
            ref = option["inspection"]
            if Path(ref["file"]).name != ref["file"]:
                raise ValueError("archive inspection must be local to its package")
            raw = _git(repo, "show", base + ":" + prefix + "openings/" + ref["file"])
            if _sha(raw) != ref["sha256"] or json.loads(raw).get("inspector_sha256") != identity["inspector"]:
                raise ValueError("archive inspection differs from its recorded source")
        return identity
    return None


@contextmanager
def validation_context(repo, base, day):
    """Select identities; the caller must still execute every publication gate."""
    token = _IDENTITY.set(None)
    try:
        repo = Path(repo).resolve()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}(?:-[a-zA-Z0-9_-]+)?", day) is None:
            raise ValueError("invalid archive edition directory")
        prefix = _closure(repo, base, day)
        _IDENTITY.set(_source_identity(repo, base, prefix) if prefix else None)
        yield
    except (OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise ValueError("archive source evidence unavailable: " + str(exc)) from exc
    finally:
        _IDENTITY.reset(token)
