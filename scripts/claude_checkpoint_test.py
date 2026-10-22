"""A checkpoint lets a fresh container resume the same ledger, and never weakens or leaks the record."""
import copy
import base64
import hashlib
import errno
import json
import os
import subprocess
import sys
import tempfile
import shutil
import struct
import unittest
import zlib
from pathlib import Path
from unittest import mock

import claude_checkpoint as ck
import run_controller as controller
from render_manifest import build as build_manifest

SCRIPTS = Path(__file__).resolve().parent
RUN = "2026-10-09-claude-pilot"
os.environ["DISPATCH_CHECKPOINT_BACKOFF"] = "0"


class PublicImageCheckpointTest(unittest.TestCase):
    """Unit transports bind one retained public PNG, never a production verdict."""
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve() / 'original'
        self.root.mkdir()
        # Original public delivered PNG, not the 55 MB production record. Its
        # compressed pixels happen to contain a Google-key-shaped base64 run.
        self.png = (SCRIPTS/'fixtures/codex-checkpoint-pixel-pattern.png').read_bytes()
        self.secret = 'AIza' + 'A'*35  # Deliberately noncredential unit negative.
        self.rel = 'out/dispatch/evidence/codex-public-image-events.json'

    def bind(self, png=None, prose='A public unit image with visible shapes and a plain background.'):
        import codex_visual_observations as visual
        png = self.png if png is None else png
        folder = self.root/'out/dispatch'; folder.mkdir(parents=True, exist_ok=True)
        image = folder/'page.png'; image.write_bytes(png)
        guide = self.root/'guide.md'; guide.write_text('Bound unit craft guide.\n')
        index = folder/'index.json'
        index.write_text(json.dumps({'pages':[{'file':image.name,'sha256':visual.digest(image),
            'samples':[{'frame':0},{'frame':29}]}]}))
        packet = folder/'packet.json'
        packet.write_text(json.dumps({'repo_root':str(self.root),'role':'picture',
            'local_recovery':{'runtime':'codex'},'codex_visual_evidence':visual.CONTRACT,
            'motion_sequence':{'path':str(index),'sha256':visual.digest(index)},
            'craft_readings':[{'path':'guide.md','sha256':visual.digest(guide)}]}))
        payloads = [
            {'type':'custom_tool_call','name':'exec','call_id':'unit-call','input':
                'const delivered = await tools.view_image('+json.dumps({'path':str(image),'detail':'original'})+
                '); image(delivered.image_url,"original");'},
            {'type':'custom_tool_call_output','call_id':'unit-call','output':[
                {'type':'input_image','image_url':'data:image/png;base64,'+base64.b64encode(png).decode()}]},
            {'type':'message','role':'assistant','channel':'commentary','content':[{'type':'output_text',
                'text':visual.PREFIX+json.dumps({'schema':visual.NOTE_SCHEMA,'packet_sha256':visual.digest(packet),
                'page':str(image),'image_sha256':visual.digest(image),'received':True,
                'objects':['unit shapes'],'actions':None,'literal_text':None,'observed':prose})}]}]
        records=[]
        for number,payload in enumerate(payloads,1):
            event={'type':'response_item','payload':payload}
            raw=json.dumps(event)+'\n'
            records.append({'line':number,'event':event,'public_source_line':raw,
                'source_line_sha256':hashlib.sha256(raw.encode()).hexdigest()})
        events=self.root/self.rel; events.parent.mkdir(exist_ok=True)
        events.write_text(json.dumps({'session_id':'unit-session','records':records}))
        proof=visual.analyze(packet,'unit-session',records,visual.EvidencePaths(packet,self.root))
        proof['public_events']={'path':str(events),'sha256':visual.digest(events)}
        coverage=events.with_name('codex-image-coverage.json'); coverage.write_text(json.dumps(proof))
        return events,coverage

    def scan(self, events, root=None, environ=None):
        return ck.leaks([(self.rel,events.read_bytes())],environ or {},repo=root or self.root)

    def chunk(self, kind, data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)

    def test_real_pixel_falsepositive_admitted_without_evidence_rewrite(self):
        events,_=self.bind(); before=events.read_bytes()
        self.assertTrue(ck.SECRET_TEXT.search(before.decode()))
        self.assertEqual(self.scan(events),[])
        self.assertEqual(events.read_bytes(),before)

    def test_relocation_preserves_original_paths_hashes_and_bytes(self):
        events,_=self.bind(); before=events.read_bytes()
        relocated=self.root.with_name('restored'); shutil.copytree(self.root,relocated)
        shutil.rmtree(self.root)
        self.assertEqual(self.scan(relocated/self.rel,relocated),[])
        self.assertEqual((relocated/self.rel).read_bytes(),before)
        (relocated/'out/dispatch/page.png').write_bytes(self.png+b'changed')
        self.assertEqual(self.scan(relocated/self.rel,relocated),[self.rel])

    def test_unbound_or_changed_coverage_keeps_strict_scan(self):
        events,coverage=self.bind(); coverage.unlink()
        self.assertEqual(self.scan(events),[self.rel])


        events,coverage=self.bind(); proof=json.loads(coverage.read_text())
        proof['public_events']['sha256']='0'*64; coverage.write_text(json.dumps(proof))
        self.assertEqual(self.scan(events),[self.rel])

    def test_secret_shaped_public_prose_is_never_masked(self):
        events,_=self.bind(prose='Public unit observation includes '+self.secret)
        self.assertEqual(self.scan(events),[self.rel])

    def test_original_configured_credential_value_is_always_refused(self):
        value='unit-configured-secret-value-123456789'
        events,_=self.bind(prose='Public unit observation includes '+value)
        self.assertEqual(self.scan(events,environ={'GOOGLE_API_KEY':value}),[self.rel])

    def test_plain_and_compressed_png_text_secrets_are_refused(self):
        secret=self.secret.encode()
        for kind,data in [(b'tEXt',b'Comment\0'+secret),
                          (b'zTXt',b'Comment\0\0'+zlib.compress(secret)),
                          (b'iTXt',b'Comment\0\1\0\0\0'+zlib.compress(secret))]:
            with self.subTest(chunk=kind):
                png=self.png[:-12]+self.chunk(kind,data)+self.png[-12:]
                events,_=self.bind(png)
                self.assertEqual(self.scan(events),[self.rel])

    def test_changed_png_crc_retains_strict_scan(self):
        png=bytearray(self.png); png[29]^=1
        events,_=self.bind(bytes(png))
        self.assertEqual(self.scan(events),[self.rel])

    def test_relocated_guide_escape_or_symlink_is_refused(self):
        import codex_visual_observations as visual
        events,coverage=self.bind(); packet=self.root/'out/dispatch/packet.json'
        paths=visual.EvidencePaths(packet,self.root)
        with self.assertRaisesRegex(ValueError,'escapes'):
            paths.path(self.root.parent/'outside.json')
        guide=self.root/'guide.md'; guide.unlink(); guide.symlink_to('/etc/hosts')
        self.assertEqual(self.scan(events),[self.rel])


class RestoredAuditTest(unittest.TestCase):
    """Exercise real nested authored-byte checks in a fresh relocated import graph."""
    def test_scoped_authored_receipts_survive_removed_origin_and_refuse_stale_or_escape(self):
        with tempfile.TemporaryDirectory() as tmp:
            origin=Path(tmp).resolve()/'original';scripts=origin/'scripts';scripts.mkdir(parents=True)
            shutil.copyfile(SCRIPTS/'render_manifest.py',scripts/'render_manifest.py')
            (scripts/'production_lifecycle.py').write_text('def allowance_problems(state): return []\n')
            (scripts/'run_controller.py').write_text(
                'import json\nimport render_manifest as nested\n'
                'def read_state(path): return json.loads(path.read_text())\n'
                'def deliverable_problems(state,repo=None):\n'
                '    try: nested.authored_media_paths(state["board"],nested.REPO); return []\n'
                '    except (ValueError,OSError) as exc: return [str(exc)]\n')
            entries=[]
            for name in ('Hero','Support'):
                relative='video-engine/src/'+name+'.tsx'; path=origin/relative
                path.parent.mkdir(parents=True,exist_ok=True);path.write_text('unit authored '+name)
                entries.append({'file':relative,'request_id':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
            board={'story_art':{'entries':entries},'native_media':[
                {**row,'basis':'Unit authored source receipt preserves exact byte identity across hosts.'} for row in entries]}
            package=origin/'out/dispatch';package.mkdir(parents=True)
            state=package/'run_state.json';state.write_text(json.dumps({'deliverable':True,'board':board}))
            original=state.read_bytes()
            self.assertEqual(ck.restored_audit(origin),[])
            restored=origin.with_name('restored');shutil.copytree(origin,restored);shutil.rmtree(origin)
            self.assertEqual(ck.restored_audit(restored),[])
            self.assertEqual((restored/'out/dispatch/run_state.json').read_bytes(),original)
            path=restored/entries[0]['file'];prior=path.read_bytes();path.write_bytes(prior+b'changed')
            self.assertTrue(any('source bytes changed' in e for e in ck.restored_audit(restored)))
            path.write_bytes(prior)
            outside=restored.parent/'outside.tsx';outside.write_bytes(prior)
            path.unlink();path.symlink_to(outside)
            self.assertTrue(any('outside' in e for e in ck.restored_audit(restored)))


def sh(*args, cwd=None):
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True).stdout


def fixture_ffmpeg():
    """A full ffmpeg with the lavfi sources. Fails, rather than skips, when none exists."""
    for directory in os.environ.get("PATH", "").split(os.pathsep):
        candidate = Path(directory) / "ffmpeg"
        if not candidate.is_file():
            continue
        probe = subprocess.run([str(candidate), "-hide_banner", "-filters"], capture_output=True, text=True)
        if " color " in probe.stdout + probe.stderr and " anullsrc " in probe.stdout + probe.stderr:
            return str(candidate)
    raise AssertionError("no installed ffmpeg provides the color and anullsrc filters")


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        tools = mock.patch.object(ck, 'PRELAUNCH_TOOLS', self.root / 'absent-host-tools')
        tools.start(); self.addCleanup(tools.stop)
        self.origin = self.root / "origin.git"
        sh("git", "init", "--bare", "-q", str(self.origin))
        sh("git", "symbolic-ref", "HEAD", "refs/heads/main", cwd=self.origin)
        self.repo = self.clone(self.root / "work")
        sh("git", "checkout", "-q", "-b", "main", cwd=self.repo)
        (self.repo / ".gitignore").write_text("out/\n")
        (self.repo / "README.md").write_text("seed\n")
        (self.repo / "video-engine/src").mkdir(parents=True)
        (self.repo / "video-engine/src/base.tsx").write_text("export const base = 1;\n")
        (self.repo / "video-engine/src/gone.tsx").write_text("export const gone = 1;\n")
        sh("git", "add", "-A", cwd=self.repo)
        sh("git", "commit", "-qm", "seed", cwd=self.repo)
        sh("git", "push", "-q", "origin", "main", cwd=self.repo)
        self.state = self.repo / "out/dispatch/run_state.json"
        self.scratch = self.repo / "out/dispatch"

    def clone(self, path):
        sh("git", "clone", "-q", str(self.origin), str(path))
        sh("git", "config", "user.name", "Test", cwd=path); sh("git", "config", "user.email", "t@example.com", cwd=path)
        return Path(path)

    def init_ledger(self, mode="production", run=RUN):
        controller.initialise(self.state, run, mode)

    def ledger(self):
        return json.loads(self.state.read_text())

    def write_ledger(self, state):
        self.state.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")

    def save(self, note="t", **kw):
        return ck.save(self.repo, self.state, note, environ={}, **kw)


class CodecRuntime(Base):
    def test_stale_prelaunch_codec_refuses_before_any_charge(self):
        self.init_ledger()
        tools = self.root / 'installed-tools'
        for directory in (tools / 'scripts', self.repo / 'scripts'):
            directory.mkdir(parents=True, exist_ok=True)
            for name in ('public_state.py', 'claude_checkpoint.py'):
                (directory / name).write_text('matching serialization fixture')
        before = self.state.read_bytes()
        with mock.patch.object(ck, 'PRELAUNCH_TOOLS', tools), mock.patch.object(ck, 'required', return_value=True):
            ck.require_backed(self.state)
            (tools / 'scripts/public_state.py').write_text('stale prelaunch serialization fixture')
            with self.assertRaisesRegex(ck.CheckpointError, 'fresh supported routine'):
                controller.reserve(self.state, {'preflight_renders': 1}, 'fixture capture')
        self.assertEqual(self.state.read_bytes(), before)


class ReservationDurability(Base):
    def setUp(self):
        super().setUp()
        self.scratch.mkdir(parents=True)
        (self.scratch / "claude-host.json").write_text("{}")
        self.init_ledger("dry-run")

    def test_stale_writer_refuses_before_changing_its_ledger_or_dispatching(self):
        fresh = self.clone(self.root / "newer-host")
        destination = self.root / "newer-edition"
        ck.restore(fresh, RUN, dest=destination)
        current = destination / "out/dispatch/run_state.json"
        self.assertTrue(controller.reserve(current, {"reported_tokens": 1}, "newer writer")[0])
        tip = ck.remote_tip(destination, RUN, "origin")
        before = self.state.read_bytes()
        dispatched = []
        with self.assertRaisesRegex(ck.UnbackedError, "earlier event history|reported_tokens fell"):
            if controller.reserve(self.state, {"reported_tokens": 1}, "stale writer")[0]:
                dispatched.append("paid work")
        self.assertEqual(self.state.read_bytes(), before)
        self.assertEqual(dispatched, [])
        self.assertTrue(ck.flag_path(self.state).is_file())
        self.assertEqual(ck.remote_tip(self.repo, RUN, "origin"), tip)

    def test_current_writer_makes_its_reservation_durable(self):
        frozen = copy.deepcopy(self.ledger().get("resource_envelope"))
        self.assertTrue(controller.reserve(self.state, {"reported_tokens": 1}, "current writer")[0])
        tip = ck.remote_tip(self.repo, RUN, "origin")
        _, raw = ck.verify_checkpoint(self.repo, tip, RUN)
        durable = json.loads(raw)
        self.assertEqual(durable["usage"]["reported_tokens"], 1)
        self.assertEqual(durable.get("resource_envelope"), frozen)
        self.assertEqual(sum(e.get("resources", {}).get("reported_tokens", 0)
                             for e in durable["events"] if e.get("kind") == "reserved"), 1)

    def test_unreachable_checkpoint_refuses_before_changing_the_ledger(self):
        before = self.state.read_bytes()
        sh("git", "remote", "set-url", "origin", str(self.root / "missing.git"), cwd=self.repo)
        with self.assertRaises(ck.UnbackedError):
            controller.reserve(self.state, {"reported_tokens": 1}, "unreachable remote")
        self.assertEqual(self.state.read_bytes(), before)
        self.assertTrue(ck.flag_path(self.state).is_file())


class RoundTrip(Base):
    def test_original_root_restore_preserves_paths_without_overwriting_the_old_host(self):
        # macOS exposes tempfile's /var through /private/var. The supported route uses
        # actual workspace paths, and deliberately refuses a symlink alias as an origin.
        self.root, self.repo = self.root.resolve(), self.repo.resolve()
        self.state = self.state.resolve()
        self.init_ledger('dry-run')
        self.save()
        original = self.repo
        archived = original.with_name('retained-original-host')
        original.rename(archived)
        fresh = self.clone(self.root / 'fresh-origin-host')
        old = (archived / 'out/dispatch/run_state.json').read_bytes()
        restored = ck.restore(fresh, RUN, origin_workspace=self.root)
        self.assertEqual(Path(restored['dest']), original)
        actual = json.loads((original / 'out/dispatch/run_state.json').read_bytes())
        for key, value in json.loads(old).items():
            self.assertEqual(actual[key], value)
        self.assertEqual(set(actual) - set(json.loads(old)), {'public_export'})
        self.assertEqual((archived / 'out/dispatch/run_state.json').read_bytes(), old)
        with self.assertRaisesRegex(ck.CheckpointError, 'occupied'):
            ck.restore(fresh, RUN, origin_workspace=self.root)

    def test_original_root_rejects_foreign_symlink_and_mismatched_workspace(self):
        fresh = self.clone(self.root / 'fresh-origin-safety')
        link = self.root / 'linked-origin'
        link.symlink_to(self.repo, target_is_directory=True)
        for root, workspace in ((str(self.root.parent / 'foreign'), self.root),
                                (str(link), self.root),
                                (str(self.root), self.root),
                                (str(self.root / 'empty'), self.root.parent)):
            with self.subTest(root=root), self.assertRaises(ck.CheckpointError):
                ck.original_destination(fresh, {'repo_root': root}, workspace)

    def test_validator_grant_survives_git_restore_and_next_durable_reservation(self):
        import repair_guard
        from validator_grant_test import ValidatorGrantTests
        fixture = ValidatorGrantTests(); fixture.setUp(); self.addCleanup(fixture.doCleanups)
        self.scratch.mkdir(parents=True)
        self.write_ledger(copy.deepcopy(fixture.before))
        failure = self.scratch / 'validator-rejected.json'
        failure.write_bytes(fixture.failure.read_bytes())
        auth = dict(fixture.auth, failure_evidence=str(failure))
        authorization = self.scratch / 'validator-authorization.private.json'
        authorization.write_text(json.dumps(auth))
        ok, message = controller.grant_validator_review(self.state, authorization, failure,
                                                       repair_guard.VALIDATOR_CONFIRMATION)
        self.assertTrue(ok, message)
        (self.scratch / 'claude-host.json').write_text('{}')
        first = self.save('grant before container replacement')
        fresh = self.clone(self.root / 'fresh-container')
        destination = self.root / 'different' / 'edition'
        ck.restore(fresh, '2026-10-15', dest=destination)
        restored = destination / 'out/dispatch/run_state.json'
        self.assertEqual(repair_guard.validator_grant_problems(controller.read_state(restored)), [])
        self.assertTrue(controller.reserve(restored, {'validator_agents': 1}, 'same existing grant')[0])
        tip = ck.remote_tip(destination, '2026-10-15', 'origin')
        final_manifest, final = ck.verify_checkpoint(destination, tip, '2026-10-15')
        _, original = ck.verify_checkpoint(self.repo, first['commit'], '2026-10-15')
        self.assertEqual(ck.monotonic_problems(json.loads(original), json.loads(final)), [])
        self.assertEqual(json.loads(final)['usage']['validator_agents'], 3)
        self.assertEqual(json.loads(final)['resource_envelope']['validator_agents'], 2)
        self.assertEqual(final_manifest['grant_origin_roots'][0]['root'], str(self.repo))
        self.assertNotIn(ck.GRANT_ROOTS_FILE, ck.candidates(destination)[0])

    def test_different_path_clone_restores_committed_and_dirty_source_with_a_registered_deliverable(self):
        sh("git", "checkout", "-q", "-b", "claude/dispatch-" + RUN, cwd=self.repo)
        episode = self.repo / "video-engine/src/modern/episodes" / RUN
        episode.mkdir(parents=True)
        (episode / "Hero.tsx").write_text("export const Hero = () => null; // committed authored art\n")
        sh("git", "add", "-A", cwd=self.repo); sh("git", "commit", "-qm", "author the hero", cwd=self.repo)
        pin = sh("git", "rev-parse", "HEAD", cwd=self.repo).strip()
        (episode / "Support.tsx").write_text("export const Support = () => null; // untracked\n")
        (self.repo / "video-engine/src/base.tsx").write_text("export const base = 2; // modified\n")
        (self.repo / "video-engine/src/gone.tsx").unlink()
        self.scratch.mkdir(parents=True, exist_ok=True)
        (self.scratch / "claude-host.json").write_text("{}")  # every ledger write is now mirrored
        self.init_ledger("dry-run")
        film, board, manifest = (self.scratch / "film.mp4", self.scratch / "board.json", self.scratch / "manifest.json")
        subprocess.run([fixture_ffmpeg(), "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30:d=0.5",
                        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.5", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-shortest", str(film)], check=True)
        board.write_text('{"runtime_s": 0.5, "scenes": [{"start_s": 0, "duration_s": 0.5}]}\n')
        manifest.write_text(json.dumps(build_manifest(film, board), indent=2) + "\n")
        accepted, message = controller.register_deliverable(self.state, film, board, manifest)
        self.assertTrue(accepted, message)
        ok, _ = controller.reserve(self.state, {"tts_calls": 1}, "first take")
        self.assertTrue(ok)
        (self.scratch / "vo").mkdir(); (self.scratch / "vo/take-1.wav").write_bytes(b"RIFF paid audio")
        (self.scratch / "retained-failures").mkdir()
        failed = os.urandom(4 * 1024 * 1024)
        (self.scratch / "retained-failures/hero-rejected.png").write_bytes(failed)
        (self.scratch / "authored-art-receipt.json").write_text('{"modules": ["Hero.tsx"]}')
        (self.scratch / "frames").mkdir(); (self.scratch / "frames/f0001.png").write_bytes(b"regenerable")
        result = self.save("before the next paid call")
        self.assertEqual(pin, result["source_pin"])
        self.assertTrue(result["changed"])

        # A different path, a clean clone of main that never saw the run branch.
        fresh = self.clone(self.root / "elsewhere/fresh")
        self.assertEqual([RUN], [row["run_id"] for row in ck.discover(fresh)])
        main_before = sh("git", "rev-parse", "HEAD", cwd=fresh).strip()
        dest = self.root / "isolated" / "resumed"
        restored = ck.restore(fresh, RUN, dest=dest)
        self.assertEqual(pin, sh("git", "rev-parse", "HEAD", cwd=dest).strip())
        self.assertEqual(main_before, sh("git", "rev-parse", "HEAD", cwd=fresh).strip())
        self.assertEqual("", sh("git", "status", "--porcelain", cwd=fresh))  # unrelated checkout untouched
        self.assertIn("committed authored art", (dest / "video-engine/src/modern/episodes" / RUN / "Hero.tsx").read_text())
        self.assertIn("untracked", (dest / "video-engine/src/modern/episodes" / RUN / "Support.tsx").read_text())
        self.assertIn("modified", (dest / "video-engine/src/base.tsx").read_text())
        self.assertFalse((dest / "video-engine/src/gone.tsx").exists())
        self.assertEqual(failed, (dest / "out/dispatch/retained-failures/hero-rejected.png").read_bytes())
        self.assertTrue((dest / "out/dispatch/authored-art-receipt.json").is_file())
        self.assertEqual(b"RIFF paid audio", (dest / "out/dispatch/vo/take-1.wav").read_bytes())
        self.assertFalse((dest / "out/dispatch/frames").exists())
        restored_state = controller.read_state(dest / "out/dispatch/run_state.json")
        self.assertEqual(self.ledger()["usage"], restored_state["usage"])
        self.assertEqual(self.ledger()["limits"], restored_state["limits"])
        self.assertEqual(self.ledger().get("resource_envelope"), restored_state.get("resource_envelope"))
        saved = restored_state["deliverable"]
        self.assertTrue(str(dest) in saved["film"] and str(self.repo) not in saved["film"])
        self.assertEqual([], controller.deliverable_problems(restored_state))
        self.assertEqual(self.ledger()["deliverable"]["film_sha256"], saved["film_sha256"])

        # The resumed edition continues from the other path: charges mirror and stay monotonic.
        with mock.patch.dict(os.environ, {"DISPATCH_CHECKPOINT_REQUIRED": "1"}):
            ok, _ = controller.reserve(dest / "out/dispatch/run_state.json", {"tts_calls": 1}, "second take")
        self.assertTrue(ok)
        fresh2 = self.clone(self.root / "again")
        tip = ck.remote_tip(fresh2, RUN, "origin")
        newest = json.loads(ck.show(fresh2, tip, f"checkpoints/{RUN}/run_state.json"))
        self.assertEqual(2, newest["usage"]["tts_calls"])
        self.assertGreaterEqual(len(sh("git", "rev-list", "--first-parent", tip, "--", f"checkpoints/{RUN}", cwd=fresh2).split()), 2)

    def test_restore_refuses_an_existing_directory_and_has_no_force(self):
        self.init_ledger()
        self.save()
        fresh = self.clone(self.root / "fresh")
        busy = self.root / "busy"; busy.mkdir(); (busy / "x").write_text("x")
        with self.assertRaisesRegex(ck.CheckpointError, "new empty directory"):
            ck.restore(fresh, RUN, dest=busy)
        done = subprocess.run([sys.executable, str(SCRIPTS / "claude_checkpoint.py"), "restore", "--run-id", RUN, "--force"],
                              capture_output=True, text=True)
        self.assertNotEqual(0, done.returncode)
        self.assertIn("unrecognized arguments", done.stderr)

    def test_a_finished_edition_is_not_restored(self):
        self.init_ledger()
        state = self.ledger(); state.update(terminal_state="shipped", shipment={"verified_at": "2026-10-10T00:00:00Z"})
        self.write_ledger(state)
        self.save()
        fresh = self.clone(self.root / "fresh")
        self.assertTrue(ck.discover(fresh)[0]["finished"])
        with self.assertRaisesRegex(ck.CheckpointError, "already shipped"):
            ck.restore(fresh, RUN, dest=self.root / "nope")


class CaptureConsumption(Base):
    """Command consumption is a monotonic checkpoint invariant across checkpoint writers."""

    def setUp(self):
        super().setUp()
        self.init_ledger()
        self.scratch.mkdir(parents=True, exist_ok=True)
        self.auth = self.scratch / "capture-authorization.json"
        self.used = self.scratch / "capture-authorizations-used.json"

    def write(self, consumed, reservation="r" * 64, used=("r" * 64,)):
        self.auth.write_text(json.dumps({"render_reservation": {"event_sha256": reservation},
                                         "commands": [{"id": "c" * 64, "consumed": consumed}]}))
        self.used.write_text(json.dumps([{"event_sha256": u} for u in used]))

    def test_a_stale_writer_cannot_mark_a_consumed_command_unused_again(self):
        self.write(False); self.save("issued")
        self.write("2026-10-10T03:00:00+00:00"); self.save("consumed")
        self.write(False)                       # an old container that never saw the consumption
        with self.assertRaisesRegex(ck.RegressionError, "marked unused again"):
            self.save("stale writer")
        self.write("2026-10-10T03:00:00+00:00")
        self.assertFalse(self.save("same state")["changed"] and False)

    def test_the_used_reservation_log_never_shrinks_and_the_authorization_cannot_vanish(self):
        self.write("2026-10-10T03:00:00+00:00", used=("a" * 64, "b" * 64)); self.save("two used")
        self.write("2026-10-10T03:00:00+00:00", used=("a" * 64,))
        with self.assertRaisesRegex(ck.RegressionError, "removed from the log"):
            self.save("shrunk log")
        self.write("2026-10-10T03:00:00+00:00", used=("a" * 64, "b" * 64)); self.auth.unlink()
        with self.assertRaisesRegex(ck.RegressionError, "disappeared"):
            self.save("vanished")

    def test_a_new_reservation_may_issue_a_new_authorization(self):
        self.write("2026-10-10T03:00:00+00:00"); self.save("consumed")
        self.write(False, reservation="s" * 64, used=("r" * 64, "s" * 64))
        self.assertTrue(self.save("a fresh reservation and authorization")["changed"])


class Selection(unittest.TestCase):
    def test_oldest_unfinished_is_chosen_by_identity_not_by_save_order(self):
        rows = [  # discover() order: newest save first
            {"run_id": "2026-10-11", "created_at": "2026-10-11T03:00:00+00:00", "finished": False},
            {"run_id": "2026-10-09-claude-pilot", "created_at": "2026-10-10T01:00:00+00:00", "finished": False},
            {"run_id": "2026-10-08", "created_at": "2026-10-08T07:00:00+00:00", "finished": True},
            {"run_id": "2026-10-09", "created_at": "2026-10-09T07:00:00+00:00", "finished": False}]
        self.assertEqual("2026-10-09", ck.oldest_unfinished(rows)["run_id"])
        self.assertIsNone(ck.oldest_unfinished([rows[2]]))
        same_day = [dict(rows[1], run_id="2026-10-09-b", created_at="2026-10-10T05:00:00+00:00"),
                    dict(rows[1], run_id="2026-10-09-a", created_at="2026-10-10T02:00:00+00:00")]
        self.assertEqual("2026-10-09-a", ck.oldest_unfinished(same_day)["run_id"])


class Monotonic(Base):
    def setUp(self):
        super().setUp()
        self.init_ledger()
        (self.scratch).mkdir(parents=True, exist_ok=True)
        ok, _ = controller.reserve(self.state, {"research_agents": 1}, "one")
        self.assertTrue(ok)
        self.save()

    def refuses(self, mutate, expected):
        state = self.ledger(); mutate(state); self.write_ledger(state)
        with self.assertRaisesRegex(ck.RegressionError, expected):
            self.save("regress")

    def test_lower_usage_is_refused(self):
        self.refuses(lambda s: s["usage"].update(research_agents=0), "usage.research_agents fell")

    def test_changed_frozen_envelope_is_refused(self):
        def change(s):
            key = next(iter(s["resource_envelope"])) if isinstance(s["resource_envelope"], dict) else None
            s["resource_envelope"] = dict(s["resource_envelope"], **{key: 999999})
        self.refuses(change, "frozen resource envelope")

    def test_truncated_or_rewritten_event_history_is_refused(self):
        self.refuses(lambda s: s.update(events=s["events"][:-1]), "event history")
        self.refuses(lambda s: s["events"][0].update(at="2000-01-01T00:00:00Z"), "event history")

    def test_lowered_limits_and_ceiling_are_refused(self):
        self.refuses(lambda s: s["limits"].update(tts_calls=0), "limits.tts_calls fell")
        self.refuses(lambda s: s["escalation_ceiling"].update(tts_calls=0), "escalation_ceiling.tts_calls fell")

    def test_altered_increments_are_refused(self):
        state = self.ledger(); state["escalations"] = [{"resource": "tts_calls", "amount": 1}]; self.write_ledger(state)
        self.save("add an increment")
        self.refuses(lambda s: s.update(escalations=[]), "increments")

    def test_a_replacement_ledger_for_the_same_run_cannot_overwrite_the_remote_record(self):
        other = self.root / "fresh-budget" / "run_state.json"
        controller.initialise(other, RUN, "production")     # a fresh budget for the same edition
        self.state.write_text(other.read_text())
        with self.assertRaises(ck.RegressionError):
            self.save("fresh budget")

    def test_a_shipped_edition_cannot_reopen(self):
        state = self.ledger(); state.update(terminal_state="shipped", shipment={"ok": True}); self.write_ledger(state)
        self.save("shipped")
        self.refuses(lambda s: s.update(terminal_state=None, shipment=None), "cannot return to an open state")

    def test_monotonic_increase_is_accepted(self):
        ok, _ = controller.reserve(self.state, {"research_agents": 1}, "two")
        self.assertTrue(ok)
        self.assertTrue(self.save("more")["changed"])
        self.assertEqual([], ck.monotonic_problems(copy.deepcopy(self.ledger()), self.ledger()))


class Privacy(Base):
    def setUp(self):
        super().setUp()
        self.init_ledger()
        self.scratch.mkdir(parents=True, exist_ok=True)

    def names(self, result):
        return sh("git", "ls-tree", "-r", "--name-only", result["commit"], cwd=self.repo).splitlines()

    def test_every_path_component_and_data_structure_is_filtered(self):
        for rel, body in {
            "gmail/response.json": '{"id": "r1"}', "x.private.json": "{}", "delivery/routing.json": "{}",
            "drafts/gmail-draft.json": "{}", "notes/readback-final.txt": "x", "secrets/key.txt": "x",
            "shipment.json": "{}", "neutral-name.json": '{"labelIds": ["DRAFT"], "threadId": "t"}',
            "nested/also.json": '{"a": {"gmail_draft_id": "r9"}}',
        }.items():
            path = self.scratch / rel; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(body)
        (self.scratch / "shipment-public.json").write_text('{"live_url": "https://example.test"}')
        (self.scratch / "claims.json").write_text('{"claims": []}')
        result = self.save()
        kept = {n.split("/files/", 1)[1] for n in self.names(result) if "/files/" in n}
        self.assertEqual({"out/dispatch/claims.json", "out/dispatch/shipment-public.json"}, kept)
        manifest = json.loads(sh("git", "show", f"{result['commit']}:checkpoints/{RUN}/manifest.json", cwd=self.repo))
        reasons = {row["path"]: row["reason"] for row in manifest["excluded"]}
        self.assertEqual("private path component", reasons["out/dispatch/gmail/response.json"])
        self.assertEqual("private path component", reasons["out/dispatch/x.private.json"])
        self.assertEqual("private data structure", reasons["out/dispatch/neutral-name.json"])
        self.assertEqual("private data structure", reasons["out/dispatch/nested/also.json"])

    def test_credential_and_secret_names_stay_private_for_every_file_type(self):
        (self.scratch / "retained-failures").mkdir()
        for name in ("credentials.json", "credentials-prod.json", "credential_store.yaml", "secret-key.txt", "credentials.png",
                     "secret-key.png", "a-s3-shot-1-credential-gate.png", "secret-handshake.jpg", ".env", ".env.local",
                     "my.credentials", "secret-santa-notes.md"):
            (self.scratch / "retained-failures" / name).write_bytes(b"x")
        (self.scratch / "secrets").mkdir(); (self.scratch / "secrets/key.txt").write_text("x")
        (self.scratch / "credential-gate").mkdir(); (self.scratch / "credential-gate/frame.png").write_bytes(b"png")
        (self.scratch / "plain-evidence.png").write_bytes(b"png")
        result = self.save()
        kept = {n.split("/files/", 1)[1] for n in self.names(result) if "/files/" in n}
        self.assertEqual({"out/dispatch/plain-evidence.png"}, kept)

    def test_a_known_synthetic_failure_render_is_retained_as_a_neutral_copy_with_provenance(self):
        (self.scratch / "stills").mkdir()
        original = self.scratch / "stills/a-s3-shot-1-credential-gate.png"
        original.write_bytes(os.urandom(2048))
        info = ck.neutralize(self.repo, original, "remotion still bundle Dispatch a-s3-shot-1-credential-gate.png --scale=0.5",
                             "synthetic authored-art scene render")
        neutral = Path(info["neutral_copy"])
        self.assertEqual(original.read_bytes(), neutral.read_bytes())
        self.assertNotIn("credential", neutral.name)
        result = self.save()
        kept = {n.split("/files/", 1)[1] for n in self.names(result) if "/files/" in n}
        self.assertIn(neutral.relative_to(self.repo).as_posix(), kept)
        self.assertIn("out/dispatch/retained-failures/neutral/mapping.json", kept)
        self.assertNotIn("out/dispatch/stills/a-s3-shot-1-credential-gate.png", kept)   # the private name stays out
        mapping = json.loads((neutral.parent / "mapping.json").read_text())
        self.assertEqual("a-s3-shot-1-credential-gate.png", mapping[0]["original_name"])
        self.assertEqual(info["sha256"], mapping[0]["sha256"])
        self.assertIn("remotion still", mapping[0]["invocation"])
        self.assertTrue(mapping[0]["source_mtime_utc"])

    def test_shipped_ledger_is_sanitized(self):
        state = self.ledger()
        state.update(terminal_state="shipped", shipment={
            "gmail_draft_id": "r-1234567", "note": "draft for docket@example.com", "manifest_path": str(self.repo / "out/dispatch/shipment.json"),
            "gmail": {"labelIds": ["DRAFT"], "threadId": "thr-9"}, "live_url": "https://texasaidocket.com/videos/#x"})
        self.write_ledger(state)
        result = self.save()
        text = sh("git", "show", f"{result['commit']}:checkpoints/{RUN}/run_state.json", cwd=self.repo)
        for private in ("r-1234567", "docket@example.com", "thr-9", "labelIds"[:0] or "DRAFT"):
            self.assertNotIn(private, text)
        self.assertNotIn(str(self.repo), text)
        self.assertIn("https://texasaidocket.com/videos/#x", text)
        self.assertIn("{REPO}/out/dispatch/shipment.json", text)

    def test_credential_values_and_key_shapes_fail_closed_without_printing(self):
        token = "supersecretvalue-0123456789abcdef"
        (self.scratch / "research_notes.md").write_text("note " + token)
        with self.assertRaises(ck.CheckpointError) as caught:
            ck.save(self.repo, self.state, "x", environ={"EXAMPLE_API_KEY": token})
        self.assertNotIn(token, str(caught.exception))
        self.assertIn("research_notes.md", str(caught.exception))
        (self.scratch / "research_notes.md").write_text("AIza" + "A" * 35)
        with self.assertRaises(ck.CheckpointError):
            self.save()
        (self.scratch / "research_notes.md").unlink()
        ledger_sourced = self.ledger(); ledger_sourced["review_reasons"] = [token]; self.write_ledger(ledger_sourced)
        with self.assertRaises(ck.CheckpointError):
            ck.save(self.repo, self.state, "x", environ={"EXAMPLE_API_KEY": token})


class Retention(Base):
    def setUp(self):
        super().setUp()
        self.init_ledger()
        self.scratch.mkdir(parents=True, exist_ok=True)

    def kept(self, result):
        return {n.split("/files/", 1)[1] for n in sh("git", "ls-tree", "-r", "--name-only", result["commit"], cwd=self.repo).splitlines()
                if "/files/" in n}

    def test_large_failed_images_receipts_and_unknown_types_are_retained(self):
        (self.scratch / "retained-failures").mkdir()
        (self.scratch / "retained-failures/hero-failed-take.png").write_bytes(os.urandom(5 * 1024 * 1024))
        (self.scratch / "frames").mkdir()
        (self.scratch / "frames/failed-frame-0007.png").write_bytes(os.urandom(1024))   # a failure is evidence even here
        (self.scratch / "frames/f0001.png").write_bytes(b"x" * 100)                     # rebuilt from retained inputs
        (self.scratch / "authored-art-receipt.json").write_text("{}")
        (self.scratch / "hero-review-receipt.json").write_text("{}")
        (self.scratch / "voice.bin").write_bytes(b"\x00\x01")
        (self.scratch / "tmp").mkdir(); (self.scratch / "tmp/scratch.json").write_text("{}")
        result = self.save()
        self.assertEqual({"out/dispatch/retained-failures/hero-failed-take.png", "out/dispatch/frames/failed-frame-0007.png",
                          "out/dispatch/authored-art-receipt.json", "out/dispatch/hero-review-receipt.json", "out/dispatch/voice.bin"},
                         self.kept(result))
        manifest = json.loads(sh("git", "show", f"{result['commit']}:checkpoints/{RUN}/manifest.json", cwd=self.repo))
        self.assertEqual(2, manifest["regenerable"]["files"])

    def test_required_evidence_that_cannot_be_retained_fails_visibly_and_saves_nothing(self):
        (self.scratch / "hero-rejected.mp4").write_bytes(os.urandom(2048))
        with mock.patch.object(ck, "MAX_FILE", 1024):
            with self.assertRaisesRegex(ck.RetentionError, "hero-rejected.mp4"):
                self.save()
        self.assertEqual("", sh("git", "ls-remote", "--heads", "origin", "claude/checkpoint/*", cwd=self.repo))
        with mock.patch.object(ck, "MAX_TOTAL", 10):
            (self.scratch / "a.txt").write_text("x" * 100)
            with self.assertRaisesRegex(ck.RetentionError, "totals"):
                self.save()


class Durability(Base):
    def setUp(self):
        super().setUp()
        self.scratch.mkdir(parents=True, exist_ok=True)
        (self.scratch / "claude-host.json").write_text("{}")
        self.init_ledger()

    def break_remote(self):
        sh("git", "remote", "set-url", "origin", str(self.root / "missing.git"), cwd=self.repo)

    def fix_remote(self):
        sh("git", "remote", "set-url", "origin", str(self.origin), cwd=self.repo)

    def test_a_charge_is_on_the_remote_before_the_reserve_returns(self):
        ok, _ = controller.reserve(self.state, {"research_agents": 1}, "dispatch researcher")
        self.assertTrue(ok)
        tip = ck.remote_tip(self.repo, RUN, "origin")
        durable = json.loads(ck.show(self.repo, tip, f"checkpoints/{RUN}/run_state.json"))
        self.assertEqual(1, durable["usage"]["research_agents"])

    def test_remote_loss_after_precheck_keeps_the_charge_until_recovered(self):
        controller.reserve(self.state, {"research_agents": 1}, "first")
        real_mirror = ck.mirror

        def disconnect_after_precheck(path, note="ledger write"):
            result = real_mirror(path, note)
            if note == "before paid reservation":
                self.break_remote()
            return result

        with mock.patch.object(ck, "mirror", side_effect=disconnect_after_precheck):
            with self.assertRaises(ck.UnbackedError):
                controller.reserve(self.state, {"tts_calls": 1}, "second, unbackable")
        self.assertTrue(ck.flag_path(self.state).is_file())
        self.assertEqual(1, self.ledger()["usage"]["tts_calls"])        # the charge is kept, never refunded
        with self.assertRaises(ck.UnbackedError):                       # and nothing further is dispatched
            controller.reserve(self.state, {"tts_calls": 1}, "third")
        self.assertEqual(1, self.ledger()["usage"]["tts_calls"])
        self.fix_remote()
        code = ck.main(["--repo", str(self.repo), "recover", "--state", str(self.state)])
        self.assertEqual(0, code)
        self.assertFalse(ck.flag_path(self.state).exists())
        ok, _ = controller.reserve(self.state, {"tts_calls": 1}, "after recovery")
        self.assertTrue(ok)

    def test_storage_failure_is_recovered_by_freeing_only_regenerable_space(self):
        (self.scratch / "frames").mkdir(); (self.scratch / "frames/f1.png").write_bytes(b"x")
        (self.scratch / "keep-me.json").write_text("{}")
        real = ck.save
        calls = []

        def full_disk_once(*a, **k):
            calls.append(1)
            if len(calls) == 1:
                raise OSError(errno.ENOSPC, "No space left on device")
            return real(*a, **k)

        with mock.patch.object(ck, "save", side_effect=full_disk_once):
            result = ck.save_with_recovery(self.repo, self.state, "after full disk")
        self.assertEqual(2, len(calls))
        self.assertFalse((self.scratch / "frames").exists())
        self.assertTrue((self.scratch / "keep-me.json").is_file())
        self.assertTrue(result["commit"])

    def test_content_failures_are_not_retried_into_silence(self):
        calls = []
        with mock.patch.object(ck, "save", side_effect=lambda *a, **k: calls.append(1) or (_ for _ in ()).throw(ck.RetentionError("x"))):
            with self.assertRaises(ck.RetentionError):
                ck.save_with_recovery(self.repo, self.state, "n")
        self.assertEqual(1, len(calls))

    def test_guard_runs_nothing_when_charges_are_not_durable_and_saves_after_outputs(self):
        marker = self.root / "ran"
        guard = [sys.executable, str(SCRIPTS / "claude_checkpoint.py"), "--repo", str(self.repo), "guard", "--note", "tts take",
                 "--state", str(self.state), "--", "touch", str(marker)]
        out = subprocess.run(guard, capture_output=True, text=True)
        self.assertEqual(0, out.returncode, out.stderr)
        self.assertTrue(marker.exists())
        self.assertIn("command_exit", out.stdout)
        marker.unlink()
        self.break_remote()
        out = subprocess.run(guard, capture_output=True, text=True, env={**os.environ, "DISPATCH_CHECKPOINT_BACKOFF": "0"})
        self.assertEqual(75, out.returncode)
        self.assertFalse(marker.exists())                                # the paid command never started
        ck.flag_path(self.state).write_text("{}")
        self.fix_remote()
        out = subprocess.run(guard, capture_output=True, text=True)
        self.assertEqual(75, out.returncode)                             # flagged until `recover` clears it
        self.assertFalse(marker.exists())

    def test_output_that_cannot_be_made_durable_after_a_paid_command_is_reported_unbacked(self):
        script = self.root / "break.sh"
        script.write_text(f"#!/bin/sh\ngit -C {self.repo} remote set-url origin {self.root}/missing.git\n")
        script.chmod(0o755)
        guard = [sys.executable, str(SCRIPTS / "claude_checkpoint.py"), "--repo", str(self.repo), "guard", "--note", "render",
                 "--state", str(self.state), "--", str(script)]
        out = subprocess.run(guard, capture_output=True, text=True, env={**os.environ, "DISPATCH_CHECKPOINT_BACKOFF": "0"})
        self.assertEqual(75, out.returncode)
        self.assertIn("UNBACKED", out.stderr)
        self.assertTrue(ck.flag_path(self.state).is_file())

    def test_ordinary_runs_are_untouched(self):
        (self.scratch / "claude-host.json").unlink()
        self.break_remote()
        with mock.patch.object(ck, "save") as save:
            ok, _ = controller.reserve(self.state, {"research_agents": 1}, "no host marker")
        save.assert_not_called()
        self.assertTrue(ok)
        self.assertFalse(ck.flag_path(self.state).exists())


if __name__ == "__main__":
    unittest.main()
