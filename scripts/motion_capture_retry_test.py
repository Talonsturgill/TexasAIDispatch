"""Offline accounting fixtures cannot supply a production film or review verdict."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import capture_guard as guard
import capture_retry_capacity as retry
import motion_capture_retry as motion
import production_lifecycle as lifecycle
import run_controller as controller


class NativeDecoderRecovery(unittest.TestCase):
    def write(self, name, value, text=False):
        path = self.root/name; path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value if text else json.dumps(value)); return path

    def setUp(self):
        tmp = tempfile.TemporaryDirectory(); self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name).resolve()
        policy = motion.POLICY.read_text()
        target = self.write('config/capture_retry_capacity_v2.json', policy, text=True)
        for name, value in [('REPO', self.root), ('POLICY', target)]:
            p = patch.object(motion, name, value); p.start(); self.addCleanup(p.stop)
        p = patch('modern_film.problems', return_value=[]); p.start(); self.addCleanup(p.stop)
        self.board = self.write('out/dispatch/storyboard.json', {'date':'2026-10-15',
            'cinematic_template':'directed-film-v2', 'film_direction':{'episode':'offline-ledger-fixture'},
            'scenes':[], 'runtime_s':4})
        self.renderer = self.write('video-engine/src/Fixture.tsx', 'offline renderer fixture', text=True)
        self.art = self.write('video-engine/src/FixtureArt.tsx', 'offline artwork fixture', text=True)
        self.write('scripts/claude_motion_review.py', '# offline operator identity\n', text=True)
        self.phone = self.write('out/dispatch/preflight.mp4', 'offline phone fixture', text=True)
        self.film = self.write('out/dispatch/film.mp4', 'offline native fixture', text=True)
        self.write('out/dispatch/render-manifest.json', {'film_sha256':retry.digest(self.film)})
        for name in ('claims.json','captions.json','words.json'):
            self.write('out/dispatch/'+name, {})
        self.write('out/dispatch/mix.wav', 'offline PCM fixture', text=True)
        self.write('out/dispatch/vo_script.txt', 'Offline narration fixture.', text=True)
        for name in ('mix.json','preflight.json','storyboard_critic.json','cinema/proof.json','cinema/hero-review.json'):
            self.write('out/dispatch/'+name, {})
        self.write('out/dispatch/credits.txt', 'Offline credits fixture.', text=True)
        self.report = self.write('out/dispatch/phone.json', {'verdict':'pass',
            'reviewer_identity':'independent offline phone reviewer', 'film_sha256':retry.digest(self.phone)})
        self.state = self.root/'out/dispatch/run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-15-fixture', 'production')[0])
        state = controller.read_state(self.state); capacity.adopt_code_policy(state)
        for key in capacity.resource_requirements(state):
            state['usage'][key] = state['resource_envelope'][key]
        controller.event(state, 'reserved', resources=dict(state['usage']), note='offline charged prior production')
        controller.event(state, 'deliverable_registered', film_sha256=retry.digest(self.film),
                         manifest_sha256=retry.digest(self.root/'out/dispatch/render-manifest.json'), review_only=False)
        controller.save(self.state, state)
        source = self.write('out/dispatch/finish.json', {'completion_reason':'finish-current',
            'director_identity':'director', 'failure_evidence':str(self.report),
            'failure_evidence_sha256':retry.digest(self.report), 'resources':{}, 'changed_inputs':[]})
        ok, message = capacity.grant_capacity(self.state, source); self.assertTrue(ok, message)
        self.assertTrue(controller.reserve(self.state, {'preflight_renders':1}, 'hero')[0])
        self.assertTrue(controller.reserve(self.state, {'preflight_renders':1}, motion.OPERATION)[0])
        state = controller.read_state(self.state); event = state['events'][-1]
        receipt = guard.event_digest(event)
        command = ('bash scripts/run_with_env.sh python scripts/claude_motion_review.py'
            ' --board out/dispatch/storyboard.json --film out/dispatch/film.mp4'
            ' --out out/dispatch/motion-review --state out/dispatch/run_state.json')
        self.auth = self.write('out/dispatch/capture-authorization.json', {
            'schema':guard.SCHEMA, 'allowed':True, 'art_receipts_recorded':True,
            'render_reservation':{'event_sha256':receipt, 'resource':'preflight_renders'},
            'prepared_capture':{'operation':motion.OPERATION, 'event_sha256':receipt,
                                'input_identity':event['preflight_identity']},
            'commands':[{'id':capacity.sha(guard.normalize(command)), 'text':command,
                         'consumed':'2026-10-17T20:33:25+00:00'}],
            'boards':[{'path':'out/dispatch/storyboard.json','sha256':retry.digest(self.board)}],
            'headroom':{'passed':True,'free_gib':20,'required_free_gib':20},
            'housekeeping':{'exit_code':0,'receipt_sha256':'d'*64},
            'bound':{'renderer':{'video-engine/src/Fixture.tsx':retry.digest(self.renderer)},
                     'art':{'video-engine/src/FixtureArt.tsx':retry.digest(self.art)}}})
        self.log = self.write('out/dispatch/evidence/motion-failure.md',
            "claude motion review: [Errno 17] File exists: 'out/dispatch/motion-review'\n", text=True)
        controller.event(state, 'prepared_capture_claimed', event_sha256=receipt,
            input_identity=event['preflight_identity'], operation=motion.OPERATION)
        controller.event(state, 'preflight_retry_authorized', evidence_sha256=retry.digest(self.log),
            input_identity=event['preflight_identity'], reason='Retained old directory before retrying exact native decoder.')
        state['deliverable'] = {'review_only':False, 'film_sha256':retry.digest(self.film),
                                'board_sha256':retry.digest(self.board)}
        controller.save(self.state, state)
        self.retained = self.root/'out/dispatch/motion-review-old-retained'
        self.write('out/dispatch/motion-review-old-retained/index.json',
                   {'schema':'dispatch_claude_motion_review/1','film_sha256':'a'*64})
        self.page = self.write('out/dispatch/motion-review-old-retained/sequence-000.png',
                              'offline retained page fixture', text=True)
        self.plan = self.root/'out/dispatch/evidence/native-retry-plan.json'
        motion.prepare(self.state, self.auth, self.log, self.retained, self.plan)
        self.before = controller.read_state(self.state)

    def test_actual_cli_grants_only_two_missing_preflights_and_preserves_all_charges(self):
        before = self.state.read_bytes(); output = io.StringIO()
        with patch('sys.argv',['controller','--state',str(self.state),'production-budget','--repair-plan',str(self.plan)]), redirect_stdout(output):
            self.assertEqual(1, controller.main())
        self.assertEqual({'preflight_renders':2}, json.loads(output.getvalue())['deficits'])
        self.assertEqual(before, self.state.read_bytes())
        ok, message = capacity.grant_capacity(self.state, self.plan); self.assertTrue(ok, message)
        state = controller.read_state(self.state)
        self.assertEqual(self.before['events'], state['events'][:-1])
        self.assertEqual(self.before['usage'], state['usage'])
        self.assertEqual(self.before['resource_envelope'], state['resource_envelope'])
        self.assertEqual({'preflight_renders':2}, state['events'][-1]['resource_increments'])
        self.assertEqual([], capacity.replay(state)[1]); self.assertEqual([], lifecycle.allowance_problems(state))
        self.assertFalse(controller.finish(self.state,'publishable')[0])
        self.assertFalse(controller.finish(self.state,'shipped')[0])

    def test_renaming_a_plan_cannot_buy_the_same_failed_attempt_twice(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        before = self.state.read_bytes(); plan = json.loads(self.plan.read_text())
        identity = retry.identity(plan); plan['root_cause'] = 'Different words for the same charged failure.'
        self.assertEqual(identity, retry.identity(plan)); self.plan.write_text(json.dumps(plan))
        self.assertFalse(capacity.grant_capacity(self.state, self.plan)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_absent_claim_retry_or_changed_authorization_cannot_fund_work(self):
        original = json.loads(self.plan.read_text())
        for key, value in [('claim_sha256','f'*64),('retry_sha256','f'*64),
                           ('reservation_sha256','e'*64),('source_grant_sha256','d'*64),
                           ('policy_sha256','c'*64),('claim_index',True)]:
            plan = copy.deepcopy(original); plan[retry.KEY][key] = value
            self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0],key)
        for change in [lambda a:a['commands'][0].update(consumed=False),
                       lambda a:a['headroom'].update(passed=False),
                       lambda a:a['prepared_capture'].update(operation='hero')]:
            plan = copy.deepcopy(original); auth = json.loads(plan[retry.KEY]['authorization_json']); change(auth)
            text = json.dumps(auth); plan[retry.KEY].update(authorization_json=text, authorization_sha256=capacity.sha(text))
            self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])

    def test_changed_retained_or_production_bytes_and_occupied_output_refuse(self):
        for path in (self.log,self.board,self.renderer,self.art,self.film,self.phone,self.report,self.page,motion.POLICY):
            raw = path.read_bytes(); path.write_bytes(raw+b' ')
            self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0],path); path.write_bytes(raw)
        destination = self.root/'out/dispatch/motion-review'; destination.mkdir()
        self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])
        self.assertEqual(self.before['usage'],controller.read_state(self.state)['usage'])

    def test_other_remaining_deficits_and_creative_edits_are_excluded(self):
        original = self.state.read_bytes()
        for resource in ('audiovisual_reviews','full_renders','scorer_calls','panel_rounds'):
            state = controller.read_state(self.state)
            state['usage'][resource] = capacity.effective_envelope(state)[resource]
            controller.save(self.state,state)
            self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0],resource)
            self.state.write_bytes(original)
        plan = json.loads(self.plan.read_text()); plan['changed_inputs'] = [{'path':str(self.renderer)}]
        self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])

    def test_retained_authorization_survives_the_next_current_authorization(self):
        self.auth.write_text('{"next":"authorization"}')
        self.assertTrue(capacity.grant_capacity(self.state,self.plan)[0])
        state = controller.read_state(self.state)
        self.assertTrue(controller.reserve(self.state, {'preflight_renders':1}, motion.OPERATION)[0])
        state = controller.read_state(self.state); self.assertEqual([], capacity.replay(state)[1])
        state['terminal_state']='shipped'; state['phase']='shipped'
        self.assertEqual([], capacity.replay(state)[1])
        for key in ('plan_json','failure_evidence_json','precheck_json','policy_json'):
            changed = copy.deepcopy(state)
            grant = next(e for e in reversed(changed['events']) if e.get('kind') == capacity.EVENT)
            grant[key] = 'changed'
            self.assertTrue(capacity.replay(changed)[1])

    def test_replay_keeps_admitted_native_identity_after_a_new_cut_is_registered(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        state = controller.read_state(self.state)
        before = copy.deepcopy(state)
        envelope = capacity.effective_envelope(state)
        self.film.write_text('later native fixture')
        self.board.write_text('{"later":"board fixture"}')
        manifest = self.root/'out/dispatch/render-manifest.json'
        manifest.write_text(json.dumps({'film_sha256':retry.digest(self.film)}))
        controller.event(state, 'deliverable_registered', film_sha256=retry.digest(self.film),
                         manifest_sha256=retry.digest(manifest), review_only=False)
        state['deliverable'] = {'film_sha256':retry.digest(self.film),
            'board_sha256':retry.digest(self.board), 'review_only':False}
        retained = copy.deepcopy(state)
        self.assertEqual([], capacity.replay(state)[1])
        self.assertEqual(retained, state)
        self.assertEqual(envelope, capacity.effective_envelope(state))
        self.assertEqual(before['usage'], state['usage'])
        self.assertEqual(before['resource_envelope'], state['resource_envelope'])
        self.assertEqual(before['events'], state['events'][:-1])
        self.assertTrue(motion.file_problems(json.loads(self.plan.read_text())))
        state['terminal_state'] = 'shipped'
        self.assertEqual([], capacity.replay(state)[1])

    def test_replay_refuses_missing_or_mismatched_admission_registration(self):
        self.assertTrue(capacity.grant_capacity(self.state, self.plan)[0])
        original = controller.read_state(self.state)
        for field, value in [('kind','unrelated_event'), ('film_sha256','f'*64),
                             ('manifest_sha256','e'*64), ('review_only',True)]:
            state = copy.deepcopy(original)
            registration = next(e for e in state['events'] if e.get('kind') == 'deliverable_registered')
            registration[field] = value
            self.assertTrue(capacity.replay(state)[1], field)

    def test_existing_checkpoint_codec_restores_and_replays_the_new_grant(self):
        import claude_checkpoint as checkpoint
        self.assertTrue(capacity.grant_capacity(self.state,self.plan)[0])
        state = controller.read_state(self.state)
        projected, origins = checkpoint.public_projection(state, self.root)
        restored = checkpoint.restored_ledger(projected, self.root/'new-checkout',
            {'repo_root':str(self.root), 'grant_origin_roots':origins})
        self.assertEqual(state['usage'], restored['usage'])
        self.assertEqual(state['resource_envelope'], restored['resource_envelope'])
        self.assertEqual([], capacity.replay(restored)[1])

    def test_pinned_increment_bounds_keep_legacy_one_unit_and_all_other_resources_closed(self):
        plan = json.loads(self.plan.read_text())
        self.assertTrue(retry.valid_increment(plan, {'preflight_renders':1}))
        self.assertTrue(retry.valid_increment(plan, {'preflight_renders':2}))
        for increments in ({}, {'preflight_renders':0}, {'preflight_renders':3},
                           {'preflight_renders':True}, {'preflight_renders':2,'scorer_calls':1}):
            self.assertFalse(retry.valid_increment(plan,increments))
        plan[retry.KEY]['schema']='dispatch_capture_retry_evidence/1'
        self.assertTrue(retry.valid_increment(plan,{'preflight_renders':1}))
        self.assertFalse(retry.valid_increment(plan,{'preflight_renders':2}))


if __name__ == '__main__': unittest.main()
