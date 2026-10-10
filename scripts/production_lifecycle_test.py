"""Regression tests for the September 26 premature production stop."""
import base64
import copy
import json
import hashlib
from datetime import datetime, timedelta
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import run_controller as c
import production_lifecycle as life
import shipment_check as ship
import critic_gate


class LifecycleTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / "run_state.json"
        c.initialise(self.state, "2026-09-26", "production")

    def test_same_day_edition_delivery_rejects_old_or_shipped_namespace(self):
        import subprocess
        script = Path(c.__file__).with_name("deliver_run.sh").read_text()
        code = script.split("<<'PY_EDITION'\n", 1)[1].split("\nPY_EDITION", 1)[0]
        destination = self.root / "runs" / "2026-10-02-second"
        destination.mkdir(parents=True)
        incoming = self.root / "film.mp4"
        incoming.write_bytes(b"reviewed second film")
        current = self.write("second.json", {"run_id": "2026-10-02-second"})
        def invoke(identity="2026-10-02-second"):
            return subprocess.run(["python3", "-c", code, str(current), identity,
                                   str(destination), str(incoming)], capture_output=True)
        self.assertEqual(invoke().returncode, 0)
        self.assertNotEqual(invoke("2026-10-02").returncode, 0)
        archived = destination / "run_state.json"
        archived.write_text(json.dumps({"run_id": "2026-10-02-second", "terminal_state": None}))
        (destination / "dispatch.mp4").write_bytes(incoming.read_bytes())
        self.assertEqual(invoke().returncode, 0)  # Interrupted same-byte delivery can resume.
        archived.write_text(json.dumps({"run_id": "2026-10-02-second", "terminal_state": "shipped"}))
        self.assertNotEqual(invoke().returncode, 0)
        archived.write_text(json.dumps({"run_id": "2026-10-02-second", "terminal_state": None}))
        (destination / "dispatch.mp4").write_bytes(b"different earlier film")
        self.assertNotEqual(invoke().returncode, 0)
        self.assertEqual((destination / "dispatch.mp4").read_bytes(), b"different earlier film")

    def write(self, name, data):
        p = self.root / name
        p.write_text(json.dumps(data))
        return p

    def plan(self):
        source = self.root / "scene.tsx"
        baseline = self.root / "scene.before.tsx"
        source.write_text("unrecognizable mechanism")
        baseline.write_bytes(source.read_bytes())
        failure = self.write("review.json", {"pass": False, "weakest": "floating record; no consequence"})
        return self.write("plan.json", {
            "root_cause": "The capture object floats without a physical transfer.",
            "repair": "Replace the floating card with a source-grounded camera action.",
            "mechanism_change": "The truck now crosses the optical plane and exposes the surface.",
            "expected_visible_result": "Contact and the recorded street detail remain identifiable.",
            "failure_evidence": str(failure), "failure_evidence_sha256": c.digest(failure),
            "changed_inputs": [{"path": str(source), "before_path": str(baseline),
                                "before_sha256": c.digest(baseline)}],
            "resources": {"preflight_renders": 2, "full_renders": 1,
                          "audiovisual_reviews": 4, "panel_rounds": 1, "scorer_calls": 3}})


    def test_technical_scope_is_predeclared_charged_and_cannot_be_relabelled(self):
        import creative_release
        state = c.read_state(self.state)
        state["run_id"] = "2026-09-30"
        c.save(self.state, state)
        plan_path = self.plan()
        plan = c.load_json(plan_path)
        plan.update(repair_scope="technical-integrity", director_identity="director")
        finding = {"id": "layout", "observed": "Attribution overlaps source text."}
        failure = self.write("review.json", {"reviewer_identity": "critic",
            "blocking_defects": [finding],
            "technical_repair": {"findings": [{"finding": finding, "category": "layout"}]}})
        plan["failure_evidence_sha256"] = c.digest(failure)
        plan_path.write_text(json.dumps(plan))
        self.assertTrue(life.begin_repair(self.state, plan_path)[0])
        self.assertTrue(c.reserve(self.state, {"reboards": 1})[0])
        self.assertEqual(creative_release.creative_rounds(c.read_state(self.state)), 0)
        source = Path(plan["changed_inputs"][0]["path"])
        source.write_text("attribution and source occupy separate regions")
        plan["changed_inputs"][0]["after_sha256"] = c.digest(source)
        plan["repair_scope"] = "standard"
        plan_path.write_text(json.dumps(plan))
        self.assertFalse(life.authorize_repair(self.state, plan_path)[0])
        plan["repair_scope"] = "technical-integrity"
        plan_path.write_text(json.dumps(plan))
        self.assertTrue(life.authorize_repair(self.state, plan_path)[0])
        self.assertEqual(c.read_state(self.state)["usage"]["reboards"], 1)
        self.assertEqual(life.allowance_problems(c.read_state(self.state)), [])

    def test_existing_paid_technical_scopes_preserve_envelope_and_cannot_be_reallocated(self):
        import repair_guard
        state = c.read_state(self.state);state['run_id'] = '2026-09-30'
        state['repair_policy'] = repair_guard.VERSION
        state['escalation_ceiling']['storyboard_critics'] = 7
        repair_guard.freeze(state);c.save(self.state, state)
        for _ in range(6):
            self.assertTrue(c.reserve(self.state, {'storyboard_critics': 1}, 'fixture-only paid scope')[0])
        state = c.read_state(self.state)
        indexes = [i for i,e in enumerate(state['events']) if e.get('resources') == {'storyboard_critics': 1}][-2:]
        plan_path = self.plan();plan = c.load_json(plan_path)
        plan.update(repair_scope='technical-integrity', director_identity='fixture-director',
                    mechanism_id='fixture-caption', failure_family='unclassified')
        finding = 'Fixture-only lexical detector rejected identical spoken parts.'
        refs = []
        for role,index in zip(('code','final-phone'), indexes):
            event = state['events'][index]
            stamp = datetime.fromisoformat(event['at'].replace('Z','+00:00')) + timedelta(seconds=1)
            identity = 'fixture-critic'  # One independent critic completes both distinct paid roles.
            report = self.write('review.json' if role=='code' else 'phone.json', {
                'verdict': 'revise', 'reviewer_identity': identity, 'reviewed_at': stamp.isoformat(), 'blocking_defects': [finding],
                'technical_repair': {'findings': [{'finding': finding, 'category': 'captions'}]}})
            refs.append({'role':role, 'event_index':index, 'event_sha256':hashlib.sha256(json.dumps(event,sort_keys=True).encode()).hexdigest(),
                         'completion_only':True, 'reviewer_identity':identity, 'report_file':str(report), 'report_sha256':c.digest(report)})
        plan['failure_evidence_sha256'] = refs[0]['report_sha256']
        plan['existing_critic_reservations'] = refs
        self.assertEqual(life.existing_critic_problems(state,plan), [])
        for field,value in [('event_index',-1),('event_index',True),('event_index',9999),('event_sha256','stale'),
                            ('report_sha256','stale'),('reviewer_identity','fixture-director'),('completion_only',False)]:
            bad=copy.deepcopy(plan);bad['existing_critic_reservations'][0][field]=value
            self.assertTrue(life.existing_critic_problems(state,bad))
        for scope in ('standard','narration-performance'):
            self.assertTrue(life.existing_critic_problems(state,{**plan,'repair_scope':scope}))
        bad=copy.deepcopy(plan);bad['existing_critic_reservations'][1]=copy.deepcopy(refs[0]);bad['existing_critic_reservations'][1]['role']='final-phone'
        self.assertTrue(life.existing_critic_problems(state,bad))
        report_path=Path(refs[1]['report_file']);saved=report_path.read_bytes();report_path.unlink()
        self.assertTrue(life.existing_critic_problems(state,plan));report_path.write_bytes(saved)
        original=copy.deepcopy(state['escalation_ceiling'])
        without=copy.deepcopy(plan);without.pop('existing_critic_reservations');plan_path.write_text(json.dumps(without))
        self.assertFalse(life.begin_repair(self.state,plan_path)[0])
        plan_path.write_text(json.dumps(plan));self.assertTrue(life.begin_repair(self.state,plan_path)[0])
        current=c.read_state(self.state)
        self.assertEqual(current['usage']['storyboard_critics'],6)
        self.assertEqual(current['escalation_ceiling'],original)
        self.assertEqual(current['active_repair']['existing_critic_reservations'],refs)
        self.assertEqual(current['events'][-1]['existing_critic_reservations'],refs)
        self.assertTrue(c.reserve(self.state,{'reboards':1})[0])
        source=Path(plan['changed_inputs'][0]['path']);source.write_text('fixture-only corrected detector')
        plan['changed_inputs'][0]['after_sha256']=c.digest(source)
        changed=copy.deepcopy(plan);changed['existing_critic_reservations'][0]['event_sha256']='stale'
        plan_path.write_text(json.dumps(changed));self.assertFalse(life.authorize_repair(self.state,plan_path)[0])
        plan_path.write_text(json.dumps(plan));self.assertTrue(life.authorize_repair(self.state,plan_path)[0])
        self.assertTrue(life.existing_critic_problems(c.read_state(self.state),plan))
        continuation = copy.deepcopy(plan)
        continuation['failed_film_sha256'] = 'changed-film'
        for row in continuation['existing_critic_reservations']:
            prior = json.loads(Path(row['report_file']).read_text())
            prior.update(reviewed_at=(datetime.now().astimezone()+timedelta(seconds=1)).isoformat(),
                         film_sha256='changed-film', blocking_defects=['New technical layout defect'])
            report = self.write('next-'+row['role']+'.json', prior)
            row.update(report_file=str(report), report_sha256=c.digest(report),
                       continuation_of_failure_sha256=plan['failure_evidence_sha256'])
        continuation.update(failure_evidence=continuation['existing_critic_reservations'][0]['report_file'],
                            failure_evidence_sha256=continuation['existing_critic_reservations'][0]['report_sha256'])
        finished = c.read_state(self.state)
        self.assertEqual(life.existing_critic_problems(finished, continuation), [])
        code_only = copy.deepcopy(continuation)
        code_only['existing_critic_reservations'][1] = copy.deepcopy(refs[1])
        self.assertEqual(life.existing_critic_problems(finished, code_only), [])
        unchanged = copy.deepcopy(code_only)
        unchanged['existing_critic_reservations'][0] = copy.deepcopy(refs[0])
        unchanged.update(failure_evidence=refs[0]['report_file'],
                         failure_evidence_sha256=refs[0]['report_sha256'])
        self.assertTrue(life.existing_critic_problems(finished, unchanged))
        old_phone = Path(refs[1]['report_file'])
        saved_phone = old_phone.read_bytes()
        closed_phone = json.loads(saved_phone)
        closed_phone['verdict'] = 'pass'
        old_phone.write_text(json.dumps(closed_phone))
        self.assertTrue(life.existing_critic_problems(finished, code_only))
        old_phone.write_bytes(saved_phone)
        code_row = continuation['existing_critic_reservations'][0]
        code_path = Path(code_row['report_file']); fresh = code_path.read_bytes()
        old_time = json.loads(Path(refs[0]['report_file']).read_text())['reviewed_at']
        for stamp in [old_time, (datetime.fromisoformat(old_time)-timedelta(seconds=1)).isoformat()]:
            stale = json.loads(fresh); stale['reviewed_at'] = stamp
            code_path.write_text(json.dumps(stale)); code_row['report_sha256'] = c.digest(code_path)
            continuation['failure_evidence_sha256'] = code_row['report_sha256']
            self.assertTrue(life.existing_critic_problems(finished, continuation))
        code_path.write_bytes(fresh); code_row['report_sha256'] = c.digest(code_path)
        continuation['failure_evidence_sha256'] = code_row['report_sha256']
        self.assertEqual(finished['usage']['storyboard_critics'], 6)
        self.assertEqual(finished['escalation_ceiling'], original)
        for field, value in [('failed_film_sha256', 'stale-film'), ('repair_scope', 'standard')]:
            self.assertTrue(life.existing_critic_problems(finished, {**continuation, field:value}))
        phone = Path(continuation['existing_critic_reservations'][1]['report_file'])
        closed = json.loads(phone.read_text()); closed['verdict'] = 'pass'; phone.write_text(json.dumps(closed))
        continuation['existing_critic_reservations'][1]['report_sha256'] = c.digest(phone)
        self.assertTrue(life.existing_critic_problems(finished, continuation))
        self.assertFalse(c.reserve(self.state,{'storyboard_critics':2})[0])

    def test_september26_stop_is_rejected(self):
        state = c.read_state(self.state)
        state["usage"]["reboards"] = state["escalation_ceiling"]["reboards"]
        state["usage"]["storyboard_critics"] = state["escalation_ceiling"]["storyboard_critics"]
        c.save(self.state, state)
        self.assertFalse(c.reserve(self.state, {"reboards": 1})[0])
        self.assertEqual(c.read_state(self.state)["phase"], "repair_planning")
        self.assertFalse(c.finish(self.state, "needs_review", reason="ceiling reached")[0])
        self.assertIsNone(c.read_state(self.state)["terminal_state"])
        # An exhausted board resource no longer disables unrelated judging.
        with patch("preship_check.current_for", return_value=(True, "current")):
            self.assertTrue(c.reserve_panel(self.state, 3)[0])
        plan = self.plan()
        before_usage = c.read_state(self.state)["usage"]
        self.assertTrue(life.begin_repair(self.state, plan)[0])
        self.assertEqual(c.read_state(self.state)["usage"], before_usage)
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        self.assertTrue(c.reserve(self.state, {"reboards": 1})[0])
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        data = c.load_json(plan)
        source = Path(data["changed_inputs"][0]["path"])
        source.write_text("truck intersects camera field; recorded image persists")
        data["changed_inputs"][0]["after_sha256"] = c.digest(source)
        plan.write_text(json.dumps(data))
        self.assertTrue(life.authorize_repair(self.state, plan)[0])
        self.assertFalse(life.authorize_repair(self.state, plan)[0])
        self.assertFalse(life.begin_repair(self.state, plan)[0])
        self.assertFalse(life.allowance_problems(c.read_state(self.state)))
        self.assertEqual(c.read_state(self.state)["usage"]["reboards"], before_usage["reboards"] + 1)
        altered = c.read_state(self.state)
        altered["escalation_ceiling"]["full_renders"] += 1
        self.assertTrue(life.allowance_problems(altered))

    def test_publishable_is_release_permission_not_completion(self):
        report = self.write("report.json", {"score": c.threshold(), "ship": True, "hard_fails": []})
        state = c.read_state(self.state)
        state["deliverable"] = {"film_sha256": "f" * 64}
        c.save(self.state, state)
        with patch.object(c, "deliverable_problems", return_value=[]), patch.object(c, "cinematic_report_problems", return_value=[]):
            self.assertTrue(c.finish(self.state, "publishable", report=report)[0])
            self.assertIsNone(c.read_state(self.state)["terminal_state"])
            self.assertTrue(c.check_delivery(self.state, report)[0])
            self.assertFalse(c.finish(self.state, "shipped")[0])
            self.assertFalse(c.finish(self.state, "shipped", shipment=self.root / "absent")[0])
            self.assertIsNone(c.read_state(self.state)["terminal_state"])
            report.write_text('{"score": 0, "ship": false}')
            self.assertFalse(c.check_delivery(self.state, report)[0])

    def test_current_operator_surfaces_do_not_advertise_legacy_completion(self):
        surfaces = {
            name: " ".join((c.REPO / name).read_text().lower().split())
            for name in ("README.md", "HANDOFF.md", "config/voices.yaml")
        }
        forbidden = {
            "README.md": ("a run ends as either",),
            "HANDOFF.md": ("until the run reaches `publishable` or `needs_review`",),
            "config/voices.yaml": ("blocked package as needs_review",),
        }
        for name, phrases in forbidden.items():
            for phrase in phrases:
                self.assertNotIn(phrase, surfaces[name])
        self.assertIn("production run completes only as `shipped`", surfaces["README.md"])
        self.assertIn("production run reaches `shipped`", surfaces["HANDOFF.md"])
        self.assertIn("active ledger", surfaces["config/voices.yaml"])

    def test_publication_evidence_uses_exact_report_package_board(self):
        import production_quality as quality
        package = self.root / "package"
        snapshot = self.root / "immutable"
        package.mkdir()
        snapshot.mkdir()
        board = package / "storyboard.json"
        board.write_text(json.dumps({"date": "2026-09-29"}))
        saved_board = snapshot / "storyboard.json"
        saved_board.write_bytes(board.read_bytes())
        film = package / "film.mp4"
        film.write_bytes(b"exact registered film")
        report = package / "report.json"
        report.write_text(json.dumps({"judges": [{"role": "picture"}]}))
        state = c.read_state(self.state)
        state["run_id"] = "2026-09-29"
        state["deliverable"] = {
            "board": str(saved_board), "board_sha256": c.digest(saved_board),
            "film_sha256": c.digest(film)}
        original_state = copy.deepcopy(state)
        (package / "openings").mkdir()
        opening = package / "openings/comparison.json"
        opening.write_text("{}")
        mix = package / "mix.json"
        mix.write_text("{}")

        def check_dependencies(current_board, current_film, judges):
            self.assertEqual(current_board, board)
            self.assertEqual(current_film, film)
            self.assertEqual(judges, [{"role": "picture"}])
            return [str(current_board.parent / name) + " unavailable"
                    for name in ("openings/comparison.json", "mix.json")
                    if not (current_board.parent / name).is_file()]

        with patch.object(quality, "required", return_value=True), patch.object(
                quality, "publication_problems", side_effect=check_dependencies) as check:
            self.assertEqual(c.cinematic_report_problems(state, report), [])
            self.assertFalse((snapshot / "mix.json").exists())
            for dependency in (opening, mix):
                original = dependency.read_bytes()
                dependency.unlink()
                self.assertIn(str(dependency), " ".join(
                    c.cinematic_report_problems(state, report)))
                dependency.write_bytes(original)
            original = board.read_bytes()
            for replacement in (None, b'{"date":"2026-09-29","changed":true}'):
                with self.subTest(replacement=replacement):
                    if replacement is None:
                        board.unlink()
                    else:
                        board.write_bytes(replacement)
                    check.reset_mock()
                    self.assertIn("exact registered storyboard", " ".join(
                        c.cinematic_report_problems(state, report)))
                    check.assert_not_called()
                    board.write_bytes(original)
            saved_board.write_text('{"date":"2026-09-29","changed":true}')
            check.reset_mock()
            self.assertIn("exact registered storyboard", " ".join(
                c.cinematic_report_problems(state, report)))
            check.assert_not_called()
            saved_board.write_bytes(original)
            film.write_bytes(b"substituted film")
            self.assertIn("exact registered final film", " ".join(
                c.cinematic_report_problems(state, report)))
            self.assertEqual(state, original_state)
        # Editions outside cinematic policy retain their existing contract.
        board.unlink()
        with patch.object(quality, "required", return_value=False), patch.object(
                quality, "publication_problems") as check:
            self.assertEqual(c.cinematic_report_problems(state, report), [])
            check.assert_not_called()

    def test_checkpoint_keeps_ledger_active(self):
        package = self.root / "checkpoint"
        package.mkdir()
        state = c.read_state(self.state)
        saved = {}
        for file, key in (("dispatch.mp4", "film"), ("storyboard.json", "board"),
                          ("render-manifest.json", "manifest")):
            p = package / file
            p.write_text(file)
            saved[key + "_sha256"] = c.digest(p)
        state["deliverable"] = saved
        c.save(self.state, state)
        usage = copy.deepcopy(state["usage"])
        self.assertTrue(life.checkpoint(self.state, package, "Repair the capture action before the next exact-film review")[0])
        self.assertEqual(c.read_state(self.state)["usage"], usage)
        self.assertIsNone(c.read_state(self.state)["terminal_state"])
        script = (c.REPO / "scripts/package_review_run.sh").read_text()
        self.assertNotIn("finish --result needs_review", script)
        self.assertIn('checkpoint', script)

    def test_preship_errors_and_bypass_cannot_purchase_panel(self):
        with patch("preship_check.current_for", side_effect=OSError("missing evidence")):
            self.assertFalse(c.reserve_panel(self.state, 3)[0])
        self.assertFalse(c.reserve_panel(self.state, 3, skip_preship=True)[0])
        self.assertEqual(c.read_state(self.state)["usage"]["scorer_calls"], 0)

    def test_pending_resumes_mutable_state_and_ignores_old_schema(self):
        old = self.root / "old/out/dispatch"
        old.mkdir(parents=True)
        (old / "run_state.json").write_text(json.dumps({"run_id": "2026-09-21", "mode": "production"}))
        current = self.root / "current/out/dispatch"
        current.mkdir(parents=True)
        c.save(current / "run_state.json", c.read_state(self.state))
        archived = self.root / "current/runs/review/edition"
        archived.mkdir(parents=True)
        state = c.read_state(self.state)
        state["terminal_state"] = "needs_review"
        c.save(archived / "run_state.json", state)
        listing = f"worktree {self.root / 'old'}\n\nworktree {self.root / 'current'}\n"
        with patch.object(life.subprocess, "check_output", return_value=listing):
            result = life.pending(self.root)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0]["state"], str(current / "run_state.json"))
            state["terminal_state"] = "shipped"
            state["shipment"] = {"film_sha256": "verified receipt fixture"}
            c.save(current / "run_state.json", state)
            self.assertFalse(life.pending(self.root))

    def test_phone_plan_does_not_prove_finished_assets(self):
        board = {"date": "2026-09-26"}
        report = {"verdict": "pass", "reviewer_identity": "critic", "reviewed_at": "now",
                  "weakest_frame": "close", "concept_sha256": critic_gate.concept_digest(board),
                  "review_scope": "exact-muted-phone-preflight", "reviewed_preflight_sha256": "film"}
        preflight = {"pass": True, "board_sha256": "board", "film_sha256": "film", "renderer_sha256": None}
        self.assertEqual(len(critic_gate.film_review_problems(board, report, preflight, "board", "film")), 4)
        report["phone_observations"] = {
            k: {"pass": True, "start_s": i, "end_s": i + 1,
                "observed": "The observed object changes state with a readable consequence."}
            for i, k in enumerate(("subject_recognition", "contact_and_consequence", "surface_finish", "closing_payoff"))}
        self.assertFalse(critic_gate.film_review_problems(board, report, preflight, "board", "film"))
        report["phone_observations"]["surface_finish"]["pass"] = False
        self.assertTrue(critic_gate.film_review_problems(board, report, preflight, "board", "film"))


class ShipmentTest(unittest.TestCase):
    setUp = LifecycleTest.setUp
    write = LifecycleTest.write
    def test_remote_checks_and_actual_media_are_required(self):
        body = "Watch the source-grounded film.\nThe email remains a draft."
        gmail = {"id": "draft-1", "message": {"id": "message-1", "labelIds": ["DRAFT"],
                 "payload": {"mimeType": "text/plain", "headers": [{"name": "To", "value": "owner@example.com"}],
                             "body": {"data": base64.urlsafe_b64encode(body.encode()).decode()}}}}
        self.assertFalse(ship.draft_problems(gmail, "owner@example.com", body))
        wrong = copy.deepcopy(gmail)
        wrong["message"]["labelIds"].append("SENT")
        self.assertTrue(ship.draft_problems(wrong, "owner@example.com", body))
        self.assertTrue(ship.draft_problems(gmail, "wrong@example.com", body))
        self.assertTrue(ship.draft_problems(gmail, "owner@example.com", "another edition"))
        connector = {"draft_id": "draft-1", "message": {
            "id": "message-1", "label_ids": ["DRAFT"],
            "payload": {"mime_type": "text/html", "parts": None,
                        "headers": [{"name": "To", "value": "owner@example.com"}],
                        "body": {"content": "<p>Watch the source-grounded film.</p><p>The email remains a draft.</p>"}}}}
        self.assertFalse(ship.draft_problems(connector, "owner@example.com", body))
        connector["message"]["payload"]["body"]["content"] = "<p>A different film.</p>"
        self.assertTrue(ship.draft_problems(connector, "owner@example.com", body))
        master = b"actual final film bytes"
        mobile = self.root / "phone.mp4"
        mobile.write_bytes(b"phone rendition bytes")
        film_hash = __import__("hashlib").sha256(master).hexdigest()
        live = "https://texasaidocket.com/videos/#2026-09-26-test"
        mobile_url = "https://media.example/phone.mp4"
        shot = self.root / "phone.png"
        shot.write_bytes(b"retained screenshot fixture")
        def bound(p): return {"path": str(p), "sha256": c.digest(p)}
        phone = {"url": live, "master_sha256": film_hash, "viewport": {"width": 390},
                 "tool": "Computer Use", "observed_at": c.now(), "screenshots": [bound(shot)],
                 "samples": [{"currentSrc": mobile_url, "readyState": 4, "paused": False,
                              "error": None, "currentTime": t} for t in (2, 4)]}
        email = self.root / "email.md"
        email.write_text(body)
        raw = self.write("gmail.json", gmail)
        playback = self.write("phone.json", phone)
        routing = self.write("routing.json", {"run_id": "2026-09-26", "recipient": "owner@example.com"})
        manifest_data = {"run_id": "2026-09-26", "film_sha256": film_hash,
                         "dispatch_pr": "https://github.com/Talonsturgill/TexasAIDispatch/pull/1",
                         "feed_pr": "https://github.com/Talonsturgill/TexasAIDocket/pull/2",
                         "deployment_run_id": 42, "live_url": live,
                         "expected_recipient": "owner@example.com", "delivery_routing": bound(routing),
                         "mobile": bound(mobile), "email": bound(email),
                         "gmail_readback": bound(raw), "phone_playback": bound(playback)}
        manifest = self.write("shipment.json", manifest_data)
        state = c.read_state(self.state)
        state["deliverable"] = {"film_sha256": film_hash}
        feed = {"media_base": "https://media.example", "videos": [{
            "date": "2026-09-26", "id": "2026-09-26-test", "video": "/runs/2026-09-26/dispatch.mp4",
            "video_mobile": "/phone.mp4", "poster": "/poster.png", "poster_thumb": "/thumb.jpg"}]}
        bad = {}
        def github(endpoint):
            if "/pulls/" in endpoint:
                return {"merged": True, "head": {"sha": "head"}, "merge_commit_sha": "merge"}
            if "/check-runs" in endpoint:
                return {"total_count": 1, "check_runs": [{"name": "guards", "status": "completed", "conclusion": bad.get("ci", "success")}]}
            if "/jobs?" in endpoint:
                return {"total_count": 1, "jobs": [{"name": "deploy", "status": "completed", "conclusion": bad.get("deploy_job", "success")}]}
            if "/contents/" in endpoint:
                data = json.dumps(feed).encode()
                return {"type": "file", "encoding": "base64", "size": len(data),
                        "sha": __import__("hashlib").sha1(f"blob {len(data)}\0".encode() + data).hexdigest(),
                        "content": base64.b64encode(data).decode()}
            return {"status": "completed", "conclusion": "success", "name": "pages build and deployment",
                    "head_sha": bad.get("deploy", "merge")}
        def fetch(url, **kwargs):
            live_feed = copy.deepcopy(feed)
            if bad.get("live_entry"):
                live_feed["videos"][0]["title"] = "Unreviewed title"
            if bad.get("live_base"):
                live_feed["media_base"] = "https://unreviewed.example"
            data = json.dumps(live_feed).encode() if url.endswith("videos.json") else (
                bad.get("master", master) if url.endswith("/runs/2026-09-26/dispatch.mp4") else mobile.read_bytes())
            return 200, data, {}
        with patch.object(ship, "gh", side_effect=github), patch.object(ship, "fetch", side_effect=fetch), patch.object(ship, "media_problems", return_value=[]):
            self.assertFalse(ship.verify_shipment(state, manifest)[1])
            c.save(self.state, state)
            with patch.object(c, "check_package", return_value=(True, "exact quality evidence")):
                self.assertTrue(c.finish(self.state, "shipped", shipment=manifest)[0])
                self.assertEqual(c.read_state(self.state)["terminal_state"], "shipped")
                self.assertFalse(c.reopen(self.state, "cannot alter a shipped edition")[0])
            for name, value in (("ci", "failure"), ("deploy", "stale"),
                                ("deploy_job", "skipped"), ("live_entry", True),
                                ("live_base", True), ("master", b"stale film")):
                bad[name] = value
                self.assertTrue(ship.verify_shipment(state, manifest)[1], name)
                bad.clear()
            raw.write_text(json.dumps(wrong))
            self.assertTrue(ship.verify_shipment(state, manifest)[1])
            # Do not accept a rehashed sent message either.
            manifest_data["gmail_readback"] = bound(raw)
            manifest.write_text(json.dumps(manifest_data))
            self.assertTrue(ship.verify_shipment(state, manifest)[1])
        phone["samples"][-1]["currentTime"] = 2
        self.assertTrue(ship.playback_problems(phone, live, mobile_url, film_hash))

    def test_descendant_deployment_preserves_exact_feed_and_green_checks(self):
        import hashlib
        original, merged, deployed = "a" * 40, "b" * 40, "c" * 40
        feed = {"videos": [{"date": "2026-09-26", "id": "2026-09-26-test"}]}
        body = json.dumps(feed).encode()
        bad = {}
        def github(endpoint):
            if "/jobs?" in endpoint:
                return {"total_count": bad.get("jobs_count", 1), "jobs": [
                    {"name": "deploy", "status": "completed", "conclusion": bad.get("deploy_job", "success")}]}
            if "/compare/" in endpoint:
                return {"status": bad.get("ancestry", "ahead"), "behind_by": 0,
                        "base_commit": {"sha": merged},
                        "merge_base_commit": {"sha": bad.get("merge_base", merged)},
                        "total_commits": bad.get("commits_count", 1), "commits": [{"sha": deployed}]}
            if "/check-runs" in endpoint:
                return {"total_count": bad.get("checks_count", 1), "check_runs": [
                    {"name": bad.get("aggregate", "guards"), "status": bad.get("status", "completed"),
                     "conclusion": bad.get("ci", "success")}]}
            if "/contents/" in endpoint:
                data = body + (b" " if bad.get("feed_changed") and endpoint.endswith(deployed) else b"")
                return {"type": "file", "encoding": bad.get("encoding", "base64"),
                        "size": len(data), "content": base64.b64encode(data).decode(),
                        "sha": bad.get("blob", hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest())}
            self.fail(endpoint)
        deployment = {"status": "completed", "conclusion": "success", "name": "pages", "head_sha": deployed}
        pr = {"head_sha": original, "merge_sha": merged}
        with patch.object(ship, "gh", side_effect=github):
            actual, proof = ship.deployment_binding(deployment, "42", pr)
            self.assertEqual(actual, feed)
            self.assertEqual(proof["ancestry"]["deployment_sha"], deployed)
            self.assertEqual(proof["reviewed_feed"]["sha256"], proof["deployed_feed"]["sha256"])
            for key, value in (("deploy_job", "skipped"), ("jobs_count", 2), ("ancestry", "diverged"),
                               ("merge_base", "d" * 40), ("commits_count", 2), ("checks_count", 2),
                               ("aggregate", "build"), ("ci", "failure"), ("status", "in_progress"),
                               ("feed_changed", True), ("encoding", "none"), ("blob", "d" * 40)):
                with self.subTest(key=key):
                    bad[key] = value
                    with self.assertRaises(ValueError):
                        ship.deployment_binding(deployment, "42", pr)
                    bad.clear()


if __name__ == "__main__":
    unittest.main()
