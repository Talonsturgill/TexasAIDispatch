"""Offline capture accounting fixtures never supply production review evidence."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import autonomous_completion as capacity
import capture_guard
import capture_retry_capacity as retry
import production_lifecycle as lifecycle
import run_controller as controller


class CaptureRetryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        policy_text = retry.POLICY.read_text()
        self.write('config/capture_retry_capacity_v1.json', policy_text, text=True)
        for name,value in [('REPO', self.root), ('POLICY', self.root/'config/capture_retry_capacity_v1.json')]:
            patcher = patch.object(retry, name, value); patcher.start(); self.addCleanup(patcher.stop)
        # Sampler admission has its own real-fixture regression suite. This fixture
        # isolates charged/consumed authorization and capacity replay, never grading pixels.
        patcher = patch('modern_film.problems', return_value=[])
        patcher.start(); self.addCleanup(patcher.stop)
        self.board = self.write('out/dispatch/storyboard.json', {
            'date': '2026-10-09', 'cinematic_template': 'directed-film-v2',
            'film_direction': {'episode': 'offline-accounting-fixture'},
            'cinema': {'hero_scene_id':'s1','dimensional_scene_ids':[]},
            'scenes':[{'id':'s1','start_s':0,'duration_s':4,'visual_events':[
                {'id':'e1','at_s':0,'duration_s':.8},
                {'id':'e2','at_s':1.2,'duration_s':.8},
                {'id':'e3','at_s':2.4,'duration_s':.8}]}]})
        self.renderer = self.write('video-engine/src/Fixture.tsx', 'offline synthetic renderer', text=True)
        self.art = self.write('video-engine/src/FixtureArt.tsx', 'offline synthetic art', text=True)
        self.film = self.write('out/dispatch/preflight.mp4', 'offline synthetic film', text=True)
        for name in ['claims.json','captions.json','words.json']:
            self.write('out/dispatch/'+name, {})
        self.write('out/dispatch/mix.wav', 'offline synthetic PCM', text=True)
        self.write('out/dispatch/vo_script.txt', 'Offline narration fixture.', text=True)
        self.report = self.write('out/dispatch/phone.json', {'verdict':'pass',
            'reviewer_identity':'independent Opus phone reviewer', 'film_sha256':retry.digest(self.film)})
        self.state = self.root/'out/dispatch/run_state.json'
        self.assertTrue(controller.initialise(self.state,'2026-10-09-pilot','production')[0])
        state = controller.read_state(self.state); capacity.adopt_code_policy(state)
        for key in capacity.resource_requirements(state):
            state['usage'][key] = state['resource_envelope'][key]
        controller.event(state,'reserved',resources=dict(state['usage']),note='offline charged prior production fixture')
        controller.save(self.state,state)
        self.source_plan = self.write('out/dispatch/finish.json', {
            'completion_reason':'finish-current','director_identity':'director',
            'failure_evidence':str(self.report),'failure_evidence_sha256':retry.digest(self.report),
            'resources':{},'changed_inputs':[]})
        ok,msg=capacity.grant_capacity(self.state,self.source_plan); self.assertTrue(ok,msg)
        self.assertTrue(controller.reserve(self.state,{'preflight_renders':1},'hero')[0])
        state=controller.read_state(self.state); reservation=state['events'][-1]
        command = 'bash scripts/run_with_env.sh python scripts/cinema_proof.py --board out/dispatch/storyboard.json'
        self.auth = self.write('out/dispatch/retained-failures/authorization.json', {
            'schema':capture_guard.SCHEMA,'allowed':True,'art_receipts_recorded':True,
            'render_reservation':{'event_sha256':capture_guard.event_digest(reservation),
                                  'resource':'preflight_renders'},
            'commands':[{'id':capacity.sha(capture_guard.normalize(command)),
                         'consumed':'2026-10-11T00:47:47+00:00', 'text':command}],
            'boards':[{'path':'out/dispatch/storyboard.json','sha256':retry.digest(self.board)}],
            'headroom':{'passed':True},'housekeeping':{'receipt_sha256':'d'*64},
            'bound':{'renderer_inputs':{'video-engine/src/Fixture.tsx':retry.digest(self.renderer)},
                     'authored_art':{'video-engine/src/FixtureArt.tsx':retry.digest(self.art)}}})
        self.log = self.write('out/dispatch/retained-failures/failure.log',
            'cinema_proof: s1 has no unique principal-picture event\n\n[exited with code 1]\n', text=True)
        self.plan = self.root/'out/dispatch/capture-retry.json'
        retry.prepare(self.state,self.auth,self.log,self.plan)
        self.before=controller.read_state(self.state)

    def write(self,name,value,text=False):
        path=self.root/name; path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(value if text else json.dumps(value)); return path

    def test_exact_one_deficit_cli_and_frozen_charges_without_approval(self):
        before=self.state.read_bytes(); output=io.StringIO()
        with patch('sys.argv',['controller','--state',str(self.state),'production-budget','--repair-plan',str(self.plan)]),redirect_stdout(output):
            self.assertEqual(controller.main(),1)
        self.assertEqual(json.loads(output.getvalue())['deficits'],{'preflight_renders':1})
        self.assertEqual(self.state.read_bytes(),before)
        ok,msg=capacity.grant_capacity(self.state,self.plan); self.assertTrue(ok,msg)
        state=controller.read_state(self.state)
        self.assertEqual(state['events'][:-1],self.before['events'])
        self.assertEqual(state['usage'],self.before['usage'])
        self.assertEqual(state['resource_envelope'],self.before['resource_envelope'])
        self.assertEqual(state['events'][-1]['resource_increments'],{'preflight_renders':1})
        self.assertEqual([],capacity.replay(state)[1]); self.assertEqual([],lifecycle.allowance_problems(state))
        self.assertFalse(controller.finish(self.state,'publishable')[0])
        self.assertFalse(controller.finish(self.state,'shipped')[0])

    def test_spent_reservation_cannot_buy_duplicate_or_renamed_capacity(self):
        self.assertTrue(capacity.grant_capacity(self.state,self.plan)[0])
        original=self.state.read_bytes(); plan=json.loads(self.plan.read_text())
        old=retry.identity(plan); plan['repair']='New wording for the same actual failed capture.'
        self.assertEqual(old,retry.identity(plan)); self.plan.write_text(json.dumps(plan))
        alternate=copy.deepcopy(plan); alternate[retry.KEY]['command_id']='a'*64
        self.assertEqual(old,retry.identity(alternate))
        self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])
        self.assertEqual(original,self.state.read_bytes())

    def test_uncaptured_unrelated_or_mutated_receipts_and_policy_refused(self):
        original=json.loads(self.plan.read_text())
        for key,value in [('reservation_sha256','a'*64),('source_grant_sha256','b'*64),
                          ('command_id','e'*64),('run_id','2026-10-10'),('policy_sha256','f'*64)]:
            plan=copy.deepcopy(original); plan[retry.KEY][key]=value; self.plan.write_text(json.dumps(plan))
            self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0],key)
        for mutate in [lambda a:a['commands'][0].update(consumed=False),
                       lambda a:a['render_reservation'].update(resource='full_renders'),
                       lambda a:a['headroom'].update(passed=False)]:
            plan=copy.deepcopy(original); auth=json.loads(plan[retry.KEY]['authorization_json']); mutate(auth)
            text=json.dumps(auth); plan[retry.KEY].update(authorization_json=text,authorization_sha256=capacity.sha(text))
            self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])
        self.plan.write_text(json.dumps(original))
        for path in [self.auth,self.log,self.board,self.renderer,self.art,self.film,self.report,retry.POLICY]:
            raw=path.read_bytes(); path.write_bytes(raw+b' ')
            self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0],path)
            path.write_bytes(raw)

    def test_complete_remaining_path_and_unchanged_cut_are_required(self):
        original=self.state.read_bytes(); state=controller.read_state(self.state)
        state['usage']['audiovisual_reviews']=capacity.effective_envelope(state)['audiovisual_reviews']
        controller.save(self.state,state)
        self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])
        self.state.write_bytes(original)
        plan=json.loads(self.plan.read_text()); plan['changed_inputs']=[{'path':str(self.renderer)}]
        self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])

    def test_omitted_binding_or_wrong_wrapped_board_cannot_buy_a_retry(self):
        original=json.loads(self.plan.read_text())
        plan=copy.deepcopy(original); plan[retry.KEY]['input_bindings']=[r for r in plan[retry.KEY]['input_bindings']
            if r['path'] != 'out/dispatch/claims.json']
        self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])
        plan=copy.deepcopy(original); auth=json.loads(plan[retry.KEY]['authorization_json'])
        command=auth['commands'][0]; command['text']=command['text'].replace('storyboard.json','other-board.json')
        command['id']=capacity.sha(capture_guard.normalize(command['text']))
        text=json.dumps(auth); self.auth.write_text(text)
        plan[retry.KEY].update(authorization_json=text,authorization_sha256=capacity.sha(text),command_id=command['id'])
        self.plan.write_text(json.dumps(plan)); self.assertFalse(capacity.grant_capacity(self.state,self.plan)[0])

    def test_later_charged_work_and_shipped_replay_preserve_admission(self):
        self.assertTrue(capacity.grant_capacity(self.state,self.plan)[0])
        self.assertTrue(controller.reserve(self.state,{'preflight_renders':1},'offline newly charged native capture')[0])
        state=controller.read_state(self.state); self.assertEqual([],capacity.replay(state)[1])
        state['terminal_state']='shipped'; state['phase']='shipped'
        self.assertEqual([],capacity.replay(state)[1])
        for key in ['plan_json','failure_evidence_json','precheck_json','policy_json']:
            altered=copy.deepcopy(state); grants=[e for e in altered['events'] if e['kind']==capacity.EVENT]
            grants[-1][key]+=' '; self.assertTrue(capacity.replay(altered)[1],key)


if __name__=='__main__':
    unittest.main()
