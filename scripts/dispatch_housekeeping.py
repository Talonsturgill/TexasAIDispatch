#!/usr/bin/env python3
"""Bound local Dispatch storage without deleting the durable Git archive.

Dry-run is the default. Only registered, clean, merged workspace worktrees and
hash-verified shipped scratch packages can be removed. Unknown evidence survives.
This helper uses the standard library and needs no credential or media runtime.
"""

from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass

GIB = 1024 ** 3
RUN_ID = re.compile(r"\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?\Z")
SHA256 = re.compile(r"[a-f0-9]{64}\Z")
REPOSITORIES = ("TexasAIDispatch", "TexasAIDocket")


def git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, timeout=60,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"}, check=check,
    )


def read_json(file: Path) -> dict:
    if file.is_symlink():
        raise ValueError("symlinked controller state")
    value = json.loads(file.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("controller state is not an object")
    return value


def has_symlink_component(file: Path, boundary: Path) -> bool:
    try:
        relative = file.relative_to(boundary)
    except ValueError:
        return True
    cursor = boundary
    for part in relative.parts:
        cursor /= part
        if cursor.is_symlink():
            return True
    return False


def live_paths() -> list[Path]:
    """Open files and cwd identify live checkouts without inspecting process args."""
    result = subprocess.run(
        ["lsof", "-nP", "-F", "pn"], capture_output=True, timeout=30,
    )
    if result.returncode not in (0, 1) or not result.stdout:
        raise RuntimeError("process activity could not be inspected")
    return [Path(line[1:].removesuffix(" (deleted)"))
            for line in result.stdout.decode(errors="replace").splitlines()
            if line.startswith("n/")]


@dataclass(frozen=True)
class Worktree:
    repo: Path
    path: Path
    head: str
    branch: str
    locked: bool = False


def worktrees(repo: Path) -> list[Worktree]:
    blocks = git(repo, "worktree", "list", "--porcelain", "-z").stdout.split(b"\0\0")
    found = []
    for block in blocks:
        fields = {}
        for field in block.split(b"\0"):
            key, _, value = field.partition(b" ")
            fields[key.decode()] = value.decode(errors="surrogateescape")
        if "worktree" in fields and "HEAD" in fields:
            found.append(Worktree(repo, Path(fields["worktree"]), fields["HEAD"],
                                  fields.get("branch", ""), "locked" in fields))
    return found


class Archive:
    def __init__(self, workspace: Path, repositories=None):
        self.dispatch, self.docket = repositories or tuple(
            workspace / "repositories" / name for name in REPOSITORIES)
        self.refs = {repo: git(repo, "rev-parse", "origin/main").stdout.decode().strip()
                     for repo in (self.dispatch, self.docket)}
        self.cache: dict[str, dict | None] = {}
        feed = json.loads(git(self.docket, "show", f"{self.refs[self.docket]}:docs/videos/videos.json").stdout)
        self.feed = feed["videos"] if isinstance(feed, dict) else feed
        if not isinstance(self.feed, list):
            raise ValueError("unexpected Docket feed shape")

    def shipped(self, run_id: str) -> dict | None:
        if run_id in self.cache:
            return self.cache[run_id]
        self.cache[run_id] = None
        if not RUN_ID.fullmatch(run_id):
            return None
        result = git(self.dispatch, "show", f"{self.refs[self.dispatch]}:runs/{run_id}/run_state.json", check=False)
        if result.returncode:
            return None
        try:
            state = json.loads(result.stdout)
            shipment = state["shipment"]
            film_hash = state["deliverable"]["film_sha256"]
            if (state.get("run_id") != run_id or state.get("terminal_state") != "shipped"
                    or not isinstance(shipment, dict) or not shipment.get("verified_at")
                    or not isinstance(film_hash, str) or not SHA256.fullmatch(film_hash)
                    or shipment.get("film_sha256") != film_hash
                    or state["deliverable"].get("review_only", False)):
                return None
            if not any(f"/runs/{run_id}/dispatch.mp4" in str(item.get("video", ""))
                       for item in self.feed if isinstance(item, dict)):
                return None
            # Hash the archived movie as a stream, without making another disk copy.
            blob = f"{self.refs[self.dispatch]}:runs/{run_id}/dispatch.mp4"
            process = subprocess.Popen(["git", "-C", str(self.dispatch), "cat-file", "blob", blob],
                                       stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            digest = hashlib.sha256()
            try:
                for chunk in iter(lambda: process.stdout.read(1024 * 1024), b""):
                    digest.update(chunk)
                if process.wait(timeout=30) or digest.hexdigest() != film_hash:
                    return None
            finally:
                process.stdout.close()
                if process.poll() is None:
                    process.kill()
                    process.wait()
            self.cache[run_id] = state
            return state
        except (KeyError, TypeError, ValueError):
            return None


class Housekeeping:
    def __init__(self, workspace: Path, *, keep: int = 2, idle_hours: float = 24,
                 protect: tuple[Path, ...] = (), activity: list[Path] | None = None,
                 repositories=None):
        self.workspace = workspace.resolve()
        self.boundary = self.workspace / ".worktrees"
        self.keep = keep
        self.idle_seconds = idle_hours * 3600
        self.protect = [Path.cwd().resolve(), *[p.resolve() for p in protect]]
        self.activity = live_paths() if activity is None else activity
        self.repositories = tuple(Path(repo).resolve() for repo in repositories) if repositories else tuple(
            self.workspace / "repositories" / name for name in REPOSITORIES)
        self.archive = Archive(self.workspace, self.repositories)
        self.trees = [tree for repo in self.repositories for tree in worktrees(repo)]
        self.packages: dict[Path, tuple[Worktree, dict]] = {}
        self.preserved: list[dict] = []

    def busy(self, target: Path) -> bool:
        return any(target == active or target in active.parents
                   for active in [*self.protect, *self.activity])

    def clean(self, tree: Worktree) -> bool:
        return not git(tree.path, "status", "--porcelain=v1", "--untracked-files=all").stdout

    def merged(self, tree: Worktree) -> bool:
        return git(tree.repo, "merge-base", "--is-ancestor", tree.head,
                   self.archive.refs[tree.repo], check=False).returncode == 0

    def states(self, tree: Worktree) -> list[Path]:
        out = tree.path / "out"
        if not out.is_dir() or out.is_symlink():
            return []
        return sorted(out.rglob("run_state.json"))

    def proven_package(self, tree: Worktree, file: Path) -> dict | None:
        if (file.parent == tree.path / "out" or has_symlink_component(file, tree.path)
                or any(p != file for p in file.parent.rglob("run_state.json"))
                or any(p.name == ".env" or p.suffix in (".pem", ".key")
                       for p in file.parent.rglob("*"))):
            return None
        state = read_json(file)
        if state.get("terminal_state") != "shipped":
            return None
        archived = self.archive.shipped(str(state.get("run_id", "")))
        if archived is None:
            return None
        deliverable, shipment = state.get("deliverable"), state.get("shipment")
        if not isinstance(deliverable, dict) or not isinstance(shipment, dict):
            return None
        # The scratch ledger must contain the same completed release, not another attempt.
        if (deliverable.get("film_sha256") != archived["deliverable"]["film_sha256"]
                or shipment.get("film_sha256") != archived["shipment"]["film_sha256"]
                or shipment.get("verified_at") != archived["shipment"]["verified_at"]):
            return None
        return state

    def preserve(self, target: Path, reason: str):
        self.preserved.append({"path": str(target), "reason": reason})

    def discover_packages(self):
        for tree in self.trees:
            if tree.repo != self.archive.dispatch or not tree.path.is_dir():
                continue
            if tree.path != tree.repo and tree.path.parent != self.boundary:
                continue
            if tree.path.is_symlink():
                continue
            for file in self.states(tree):
                try:
                    state = self.proven_package(tree, file)
                except (OSError, ValueError, TypeError):
                    state = None
                if state is None:
                    self.preserve(file.parent, "unfinished, unverified, or malformed state")
                else:
                    self.packages[file.parent] = (tree, state)

    def ignored_safe(self, tree: Worktree, removed_packages: set[Path]) -> bool:
        ignored = git(tree.path, "ls-files", "--others", "--ignored", "--exclude-standard", "-z").stdout
        for raw in ignored.split(b"\0"):
            if not raw:
                continue
            relative = Path(os.fsdecode(raw))
            full = tree.path / relative
            if relative.name == ".env" or relative.name.startswith(".env."):
                return False
            if any(full == package or package in full.parents for package in removed_packages):
                continue
            parts = relative.parts
            if ("node_modules" in parts or "__pycache__" in parts
                    or parts[0] in (".venv", ".pytest_cache")
                    or relative.name in (".DS_Store",) or relative.suffix == ".pyc"
                    or parts[:2] == ("out", "gates")):
                continue
            if (tree.repo == self.archive.dispatch and parts[:2] == ("assets", "sfx")
                    and relative.suffix == ".wav"):
                continue  # .gitignore identifies these as foley.py --build products.
            if tree.repo == self.archive.docket:
                generated = (
                    parts[:3] == ("out", "article-media", "tmp")
                    or parts[:2] in (("out", "document-demo-screenshots"), ("out", "txworld"))
                    or (len(parts) >= 4 and parts[0] == "out" and RUN_ID.fullmatch(parts[1])
                        and parts[2:4] == ("tmp", "article-review"))
                    or relative.as_posix() == "out/video-fixture-check.log"
                )
                if generated:
                    continue  # Inspected site-builder/browser-test output locations.
            return False
        return True

    def plan(self) -> list[dict]:
        self.discover_packages()
        recent = sorted(self.packages, key=lambda p: (
            self.packages[p][1]["shipment"]["verified_at"], str(p)), reverse=True)[:self.keep]
        protected_packages = set(recent)
        actions = []
        now = time.time()
        for package, (tree, state) in self.packages.items():
            if package in protected_packages:
                self.preserve(package, "one of the two newest completed scratch packages")
            elif self.busy(package) or tree.locked:
                self.preserve(package, "active or locked")
            elif not self.clean(tree) or not self.merged(tree):
                self.preserve(package, "checkout has uncommitted, untracked, or unmerged work")
            elif now - (package / "run_state.json").stat().st_mtime < self.idle_seconds:
                self.preserve(package, "recent activity within the grace period")
            else:
                actions.append({"kind": "scratch", "path": str(package), "run_id": state["run_id"]})
        removable_packages = {Path(a["path"]) for a in actions}
        for tree in self.trees:
            if tree.path.parent != self.boundary or not tree.path.is_dir():
                continue
            if tree.path.is_symlink() or tree.locked or self.busy(tree.path):
                self.preserve(tree.path, "active, locked, or symlinked worktree")
                continue
            if not self.clean(tree) or not self.merged(tree):
                self.preserve(tree.path, "uncommitted, untracked, or unmerged work")
                continue
            states = self.states(tree)
            if any(file.parent not in removable_packages for file in states):
                self.preserve(tree.path, "retained or unfinished controller package")
                continue
            if tree.repo == self.archive.docket:
                match = re.fullmatch(r"refs/heads/claude/dispatch-(.+)", tree.branch)
                if not match or self.archive.shipped(match[1]) is None:
                    self.preserve(tree.path, "not a verified shipped Dispatch feed checkout")
                    continue
                if match[1] in {self.packages[p][1]["run_id"] for p in recent}:
                    self.preserve(tree.path, "feed checkout for a retained recent edition")
                    continue
            if not self.ignored_safe(tree, removable_packages):
                self.preserve(tree.path, "ignored files outside the disposable allowlist")
                continue
            gitdir = Path(git(tree.path, "rev-parse", "--absolute-git-dir").stdout.decode().strip())
            changed = max(tree.path.stat().st_mtime, (gitdir / "HEAD").stat().st_mtime)
            if now - changed < self.idle_seconds:
                self.preserve(tree.path, "recent checkout within the grace period")
                continue
            actions = [a for a in actions if not tree.path in Path(a["path"]).parents]
            actions.append({"kind": "worktree", "path": str(tree.path), "repo": str(tree.repo),
                            "head": tree.head})
        return actions

    def apply(self, actions: list[dict]) -> list[dict]:
        removed = []
        for action in actions:
            target = Path(action["path"])
            # A fresh plan catches edits, new states, process starts and retention changes.
            fresh = Housekeeping(self.workspace, keep=self.keep, idle_hours=self.idle_seconds / 3600,
                                 protect=tuple(self.protect), repositories=self.repositories)
            if action not in fresh.plan():
                self.preserve(target, "changed since planning; skipped")
                continue
            if action["kind"] == "worktree":
                if target.parent != self.boundary or has_symlink_component(target, self.workspace):
                    raise ValueError("unsafe worktree removal target")
                # No --force. Git independently refuses dirty/untracked/locked/submodule trees.
                git(Path(action["repo"]), "worktree", "remove", str(target))
            else:
                owner = fresh.packages[target][0].path
                if target == owner / "out" or has_symlink_component(target, owner / "out"):
                    raise ValueError("unsafe scratch removal target")
                if any(target != file.parent for file in target.rglob("run_state.json")):
                    raise ValueError("nested controller packages need independent retention")
                if any(p.name == ".env" or p.suffix in (".pem", ".key") for p in target.rglob("*")):
                    raise ValueError("private configuration is outside the scratch allowlist")
                shutil.rmtree(target)  # Narrow validated package; never a repo or out/ root.
            removed.append(action)
        return removed


@contextlib.contextmanager
def cleanup_lock(workspace: Path):
    lock = workspace / ".dispatch-housekeeping.lock"
    if lock.is_symlink():
        raise ValueError("symlinked housekeeping lock")
    with lock.open("a") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--dispatch-repo", type=Path, help="explicit Dispatch checkout in a cloud workspace")
    parser.add_argument("--docket-repo", type=Path, help="explicit sibling Docket checkout; both paths are required")
    parser.add_argument("--apply", action="store_true", help="delete only eligible items; default is a dry-run")
    parser.add_argument("--fetch", action="store_true", help="fetch both origin/main refs before inspecting archives")
    parser.add_argument("--keep", type=int, default=2)
    parser.add_argument("--idle-hours", type=float, default=24)
    parser.add_argument("--protect", type=Path, action="append", default=[])
    parser.add_argument("--min-free-gib", type=float, default=25)
    parser.add_argument("--require-headroom", action="store_true", help="exit 3 if free disk remains below the target")
    parser.add_argument("--summary", action="store_true", help="compact output for the automation context")
    args = parser.parse_args()
    workspace = args.workspace.resolve()
    if args.keep < 2 or args.idle_hours < 0 or args.min_free_gib <= 0:
        parser.error("keep must be at least two, idle hours nonnegative, and disk target positive")
    if bool(args.dispatch_repo) != bool(args.docket_repo):
        parser.error("explicit cloud mode requires both repository paths")
    try:
        repositories = ((args.dispatch_repo.resolve(), args.docket_repo.resolve())
                        if args.dispatch_repo else tuple(workspace / "repositories" / name for name in REPOSITORIES))
        if workspace == Path(workspace.anchor) or repositories[0] == repositories[1]:
            raise ValueError("expected a bounded workspace with two distinct repositories")
        for repo in repositories:
            if (not repo.is_relative_to(workspace) or has_symlink_component(repo, workspace)
                    or Path(git(repo, "rev-parse", "--show-toplevel").stdout.decode().strip()).resolve() != repo):
                raise ValueError("repository paths must be real checkout roots within this workspace")
        before = shutil.disk_usage(workspace).free
        with cleanup_lock(workspace):
            if args.fetch:
                for repo in repositories:
                    git(repo, "fetch", "origin", "main")
            cleaner = Housekeeping(workspace, keep=args.keep, idle_hours=args.idle_hours,
                                   protect=tuple(args.protect), repositories=repositories)
            actions = cleaner.plan()
            removed = cleaner.apply(actions) if args.apply else []
        after = shutil.disk_usage(workspace).free
        ready = after >= args.min_free_gib * GIB
        report = {
            "schema": "dispatch-housekeeping/1", "mode": "apply" if args.apply else "dry-run",
            "observed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "free_gib_before": round(before / GIB, 2), "free_gib_after": round(after / GIB, 2),
            "reclaimed_gib": round((after - before) / GIB, 2),
            "target_free_gib": args.min_free_gib, "headroom_ready": ready,
            "keep_completed_scratch_packages": args.keep, "planned": actions, "removed": removed,
            "preserved": cleaner.preserved,
        }
        if args.summary:
            from collections import Counter
            report["planned"] = len(actions)
            report["preserved"] = dict(Counter(item["reason"] for item in cleaner.preserved))
        print(json.dumps(report, indent=2))
        return 3 if args.require_headroom and not ready else 0
    except BlockingIOError:
        print("housekeeping: another cleanup is running; retry after it finishes", file=sys.stderr)
        return 2
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as exc:
        print(f"housekeeping: inspection failed; no unchecked target was removed ({type(exc).__name__})", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
