"""The one human-approved manual exception cannot renew the daily routine or rewrite evidence."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import manual_codex_repair as manual
import run_controller as controller
import review_limit
import autonomous_completion
import production_lifecycle
import publication_owner


class ManualRepair(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.out = self.root/'out/dispatch'; self.out.mkdir(parents=True)
        self.state = self.out/'run_state.json'
        self.assertTrue(controller.initialise(self.state, manual.RUN_ID, 'production')[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 5}, 'original five actual attempts')[0])
        self.assertTrue(controller.reserve(self.state, {'reported_tokens': 172597}, 'actual retained AV telemetry')[0])
        self.instruction = 'offline explicit authorization fixture'
        instruction_patch = patch.object(manual, 'OWNER_INSTRUCTION_SHA256', manual.sha(self.instruction))
        instruction_patch.start(); self.addCleanup(instruction_patch.stop)
        self.owner = {'runtime': 'codex', 'run_id': manual.RUN_ID, 'status': 'held',
                      'owner_sha256': manual.sha('codex:offline-owner'), 'epoch': 'original-epoch',
                      'repo': str(self.root)}
        self.identity = patch.object(publication_owner, 'require_owner', return_value=self.owner)
        self.identity.start(); self.addCleanup(self.identity.stop)
        self.film = self.out/'retained-failed.mp4'; self.film.write_bytes(b'original failed film fixture')
        self.hashpatch = patch.object(manual, 'FILM', controller.digest(self.film))
        self.hashpatch.start(); self.addCleanup(self.hashpatch.stop)
        self.board = self.out/'storyboard.json'; self.board.write_text('{"date":"2026-10-21"}')
        self.baseline = self.out/'baseline.json'; self.baseline.write_bytes(self.board.read_bytes())
        for name in manual.FROZEN:
            (self.out/name).write_bytes(('unchanged source/voice '+name).encode())
        (self.out/'words.json').write_text(json.dumps({'words':[{'word':'same','start':0.1,'end':1.0}], 'provenance':{}}))
        (self.out/'captions.json').write_text(json.dumps({'cues':[{'text':'same','start':0.1,'end':1.0}], 'words_file':'out/dispatch/words.json'}))
        self.report = self.out/'original-panel.json'
        judges = [{'role': role, 'reviewer_identity': '/root/'+role+'_score; packet='+('a'*64), 'packet_sha256':'a'*64, 'film_sha256': manual.FILM,
                   'ship': False, 'hard_fails': ['exact unsupported source credit'],
                   'defects': ['exact unsupported source credit'],
                   'bounded_release': {'defects': [{'finding': 'exact unsupported source credit', 'category': 'source'}]}}
                  for role in ('picture','story','sound')]
        judges[2]['audiovisual_role'] = judges[2].pop('role')
        self.report.write_text(json.dumps({'ship':False,'hard_fails':['exact unsupported source credit'],'judges':judges}))
        state = controller.read_state(self.state)
        state['deliverable'] = {'film':str(self.film),'film_sha256':manual.FILM}
        controller.save(self.state,state)
        self.before = controller.read_state(self.state)
        self.authorization = self.out/'authorization.json'
        self.auth = {'schema':'dispatch_owner_manual_repair_authorization/1','run_id':manual.RUN_ID,
            'authorization':self.instruction,'authority':'direct human message in current Codex thread',
            'thread_id':'offline-owner','runtime':'codex','daily_review_cap':5,'claude_tokens_allowed':0,
            'one_time_consolidated_repairs':1,'failed_film_sha256':manual.FILM,
            'failed_report_sha256':controller.digest(self.report),'publication_owner':self.owner}
        self.authorization.write_text(json.dumps(self.auth))
        authorization_patch = patch.object(manual, 'ORIGINAL_AUTHORIZATION_SHA256', controller.digest(self.authorization))
        authorization_patch.start(); self.addCleanup(authorization_patch.stop)
        self.plan_file = self.out/'repair-plan.json'
        self.plan = {'repair_scope':'standard','failed_film_sha256':manual.FILM,
            'failure_evidence':str(self.report),'failure_evidence_sha256':controller.digest(self.report),
            'resources':{'reboards':1,'full_renders':1,'audiovisual_reviews':4,'panel_rounds':1,'scorer_calls':3},
            'changed_inputs':[{'path':str(self.board),'before_path':str(self.baseline),
                               'before_sha256':controller.digest(self.board)}],
            'root_cause':'The exact final panel identified an unsupported source credit in this film.',
            'repair':'Remove the unsupported credit detail and align the pictured literal actions.',
            'expected_visible_result':'The source credit and every narrated subject agree with the final film.',
            'mechanism_change':'Perform the named event during its current measured narration clause.',
            'mechanism_id':'exact-owner-approved-clause-alignment','failure_family':'continuity',
            'director_identity':'original Codex director'}
        self.plan_file.write_text(json.dumps(self.plan))

    def grant(self):
        return manual.grant(self.state,self.authorization,self.plan_file,manual.CONFIRMATION)

    def accepted(self):
        ok,why=self.grant(); self.assertTrue(ok,why)
        return controller.read_state(self.state)

    def packet(self,scope='code-plan',mode=None):
        data={'role':'storyboard-critic','review_scope':scope,'local_recovery':{
            'runtime':'codex','run_id':manual.RUN_ID,'owner_sha256':self.owner['owner_sha256'],'epoch':self.owner['epoch']}}
        if mode:
            data['phone_mode']=mode
        return data

    def test_exact_grant_preserves_five_original_events_envelope_and_charges(self):
        state=self.accepted()
        self.assertEqual(self.before['events'],state['events'][:-1])
        self.assertEqual(self.before['usage'],state['usage'])
        self.assertEqual(self.before['resource_envelope'],state['resource_envelope'])
        self.assertEqual([],production_lifecycle.allowance_problems(state))
        self.assertEqual([],autonomous_completion.replay(state)[1])
        self.assertEqual(5,review_limit.policy()['max_review_rounds'])
        self.assertIs(False,review_limit.policy()['extensions_allowed'])
        self.assertEqual(manual.RESOURCES,state['events'][-1]['resources'])
        before=self.state.read_bytes(); self.assertFalse(self.grant()[0])
        self.assertEqual(before,self.state.read_bytes())

    def test_wrong_owner_runtime_run_film_authorization_and_panel_refuse_without_mutation(self):
        for key,value in [('run_id','2026-10-22'),('runtime','claude'),('authorization','automatic standing permission'),
                          ('daily_review_cap',6),('claude_tokens_allowed',1),('failed_film_sha256','0'*64)]:
            with self.subTest(key=key):
                altered={**self.auth,key:value}; self.authorization.write_text(json.dumps(altered))
                before=self.state.read_bytes(); self.assertFalse(self.grant()[0]); self.assertEqual(before,self.state.read_bytes())
        self.authorization.write_text(json.dumps(self.auth))
        with patch.object(publication_owner,'require_owner',return_value={**self.owner,'epoch':'other'}):
            self.assertFalse(self.grant()[0])
        self.report.write_text('{}'); self.assertFalse(self.grant()[0])

    def test_exact_three_critic_scopes_then_no_fourth_and_no_claude(self):
        self.accepted()
        for scope,mode in [('code-plan',None),('exact-muted-phone-preflight','comparison'),
                           ('exact-muted-phone-preflight','current')]:
            packet=self.packet(scope,mode)
            state=controller.read_state(self.state)
            self.assertEqual([],review_limit.worker_plan_problems(state,packet))
            self.assertTrue(review_limit.worker_plan_problems(state,{'role':'storyboard-critic','review_scope':scope}))
            ok,why=controller.reserve(self.state,{'storyboard_critics':1},'manual scoped independent check')
            self.assertTrue(ok,why)
            self.assertEqual([],review_limit.worker_plan_problems(controller.read_state(self.state),packet,charged=True))
        state=controller.read_state(self.state)
        self.assertEqual(8,state['usage']['storyboard_critics'])
        self.assertTrue(review_limit.worker_plan_problems(state,self.packet('exact-muted-phone-preflight','current')))
        before=self.state.read_bytes()
        self.assertFalse(controller.reserve(self.state,{'storyboard_critics':1},'retry')[0])
        self.assertEqual(before,self.state.read_bytes())

    def test_eight_distinct_preflight_operations_are_funded_and_not_renewable(self):
        self.accepted()
        for note in manual.PREFLIGHTS:
            with patch.object(controller,'preflight_identity',return_value=None):
                ok,why=controller.reserve(self.state,{'preflight_renders':1},note)
            self.assertTrue(ok,why)
        state=controller.read_state(self.state)
        self.assertEqual(8,state['usage']['preflight_renders'])
        self.assertEqual([],production_lifecycle.allowance_problems(state))
        for note in (manual.PREFLIGHTS[0],'new unplanned capture'):
            before=self.state.read_bytes(); self.assertFalse(controller.reserve(self.state,{'preflight_renders':1},note)[0])
            self.assertEqual(before,self.state.read_bytes())

    def test_early_duplicate_operation_refuses_even_with_remaining_budget(self):
        self.accepted()
        with patch.object(controller,'preflight_identity',return_value=None):
            self.assertTrue(controller.reserve(self.state,{'preflight_renders':1},manual.PREFLIGHTS[0])[0])
            self.assertFalse(controller.reserve(self.state,{'preflight_renders':1},manual.PREFLIGHTS[0])[0])

    def test_no_tts_validator_image_new_capacity_or_owner_transfer(self):
        self.accepted()
        for key in ('tts_calls','validator_agents','image_generations','research_agents'):
            before=self.state.read_bytes(); self.assertFalse(controller.reserve(self.state,{key:1},'unapproved')[0])
            self.assertEqual(before,self.state.read_bytes())
        self.assertFalse(autonomous_completion.grant_capacity(self.state,self.plan_file)[0])
        with patch.object(publication_owner,'require_owner',return_value={**self.owner,'owner_sha256':'0'*64}):
            self.assertFalse(controller.reserve(self.state,{'storyboard_critics':1},'wrong owner')[0])

    def test_frozen_source_or_voice_change_refuses(self):
        self.accepted()
        for name in manual.FROZEN:
            path=self.out/name; original=path.read_bytes(); path.write_bytes(b'changed')
            self.assertFalse(controller.reserve(self.state,{'storyboard_critics':1},'changed input')[0])
            path.write_bytes(original)

    def test_only_original_plan_and_one_consolidated_repair_are_admitted(self):
        self.accepted()
        state=controller.read_state(self.state)
        self.assertEqual([],review_limit.repair_problems(state,self.plan))
        self.assertTrue(review_limit.repair_problems(state,{**self.plan,'repair':'a different repair'}))
        ok,why=production_lifecycle.begin_repair(self.state,self.plan_file,reserve_reboard=True)
        self.assertTrue(ok,why)
        self.board.write_text('{"date":"2026-10-21","corrected":true}')
        self.plan['changed_inputs'][0]['after_sha256']=controller.digest(self.board)
        self.plan_file.write_text(json.dumps(self.plan))
        ok,why=production_lifecycle.authorize_repair(self.state,self.plan_file)
        self.assertTrue(ok,why)
        self.assertEqual([],production_lifecycle.allowance_problems(controller.read_state(self.state)))
        self.assertFalse(production_lifecycle.begin_repair(self.state,self.plan_file)[0])

    def test_replay_refuses_refund_duplicate_or_mutated_grant(self):
        state=self.accepted()
        for mutate in (lambda s:s['events'].append(copy.deepcopy(s['events'][-1])),
                       lambda s:s['events'][-1]['resources'].update(storyboard_critics=4),
                       lambda s:s['usage'].update(storyboard_critics=4),
                       lambda s:s['events'][-1].update(daily_review_limit_unchanged=False),
                       lambda s:s['resource_envelope'].update(storyboard_critics=99),
                       lambda s:s['events'][1].update(resources={'storyboard_critics':4})):
            changed=copy.deepcopy(state); mutate(changed)
            self.assertTrue(autonomous_completion.replay(changed)[1])

    def test_public_checkpoint_roundtrip_keeps_exact_grant_and_private_proof_private(self):
        import claude_checkpoint as checkpoint
        import public_state
        state = self.accepted()
        public, origins = checkpoint.public_projection(state, self.root)
        encoded = json.dumps(public)
        self.assertNotIn(self.instruction, encoded)
        self.assertNotIn('offline-owner', encoded)
        self.assertNotIn(str(self.root), encoded)
        self.assertIn(manual.ORIGINAL_AUTHORIZATION_SHA256, encoded)
        manifest = {'repo_root':str(self.root), 'grant_origin_roots':origins}
        restored = checkpoint.restored_ledger(public, Path('/home/runner/restored'), manifest)
        self.assertEqual([], autonomous_completion.replay(restored)[1])
        self.assertEqual([], production_lifecycle.allowance_problems(restored))
        for key in ('authorization_json','plan_json','failure_evidence_json'):
            self.assertEqual(state['events'][-1][key], restored['events'][-1][key])
        for key in public_state.CHARGE_BLOCKS:
            self.assertEqual(state[key], restored[key])
        self.assertTrue(checkpoint.has_private_structure(self.auth))
        safe = json.loads(public_state.sanitized_export(state, self.root))
        self.assertTrue(safe['public_export']['reviewer_identity_projection']['exact_inverse_verified'])
        self.assertEqual(state['events'][-1]['failure_evidence_sha256'],safe['events'][-1]['failure_evidence_sha256'])
        bad = copy.deepcopy(state); bad['events'].append({'kind':'note','text':'/root/private-file'})
        with self.assertRaisesRegex(ValueError, 'absolute local path survived'):
            public_state.sanitized_export(bad, self.root)

    def test_delegated_capture_requires_original_codex_owner_and_rejects_claude(self):
        state = self.accepted(); row = manual.record(state)
        self.identity.stop()
        import os, github_capture
        # Actual require_owner delegate branch verifies the remote owner's result.
        with patch.dict(os.environ, {'DISPATCH_GITHUB_CAPTURE_REQUEST':'fixture-request'}):
            with patch.object(github_capture, 'require_delegate', return_value=self.owner):
                self.assertEqual([], manual.runtime_problems(row, self.state))
            with patch.object(github_capture, 'require_delegate', return_value={**self.owner,'runtime':'claude'}):
                self.assertTrue(manual.runtime_problems(row, self.state))

    def test_observed_token_forecast_adds_capacity_without_actual_spend(self):
        # Real production shape: 681107 spent against original 900000.
        self.assertTrue(controller.reserve(self.state, {'reported_tokens':508510}, 'second actual AV telemetry')[0])
        before = controller.read_state(self.state)
        state = self.accepted(); grant = state['events'][-1]
        allowance = 508510 * 5
        self.assertEqual(allowance, grant['token_forecast']['reported_tokens_allowance'])
        self.assertEqual(before['usage'], state['usage'])
        self.assertEqual(before['resource_envelope'], state['resource_envelope'])
        self.assertEqual(681107+allowance-900000, grant['resource_increments']['reported_tokens'])
        self.assertTrue(controller.reserve(self.state, {'reported_tokens':allowance}, 'actual remaining AV telemetry')[0])
        self.assertFalse(controller.reserve(self.state, {'reported_tokens':1}, 'no extra capacity')[0])

    def test_genuine_realign_provenance_allowed_but_content_or_source_change_refuses(self):
        state = self.accepted(); row = manual.record(state)
        (self.root/'config').mkdir()
        config = {'sha256':'a'*64, 'version':'1.9.2'}
        (self.root/'config/alignment.json').write_text(json.dumps(config))
        (self.out/'acoustic-asr.json').write_text('{"segments":[]}')
        (self.out/'mix.wav').write_bytes(b'genuine new mix fixture')
        meta = {'asr_sha256':controller.digest(self.out/'acoustic-asr.json'),
                'voice_sha256':controller.digest(self.out/'mix_vo.wav'),
                'model_sha256':'a'*64, 'version':'1.9.2', 'flash_attention':False}
        (self.out/'acoustic-asr-meta.json').write_text(json.dumps(meta))
        words = json.loads((self.out/'words.json').read_text())
        words['provenance'] = {**meta, 'mix_sha256':controller.digest(self.out/'mix.wav'),
                              'script_sha256':controller.digest(self.out/'vo_script.txt')}
        (self.out/'words.json').write_text(json.dumps(words))
        self.assertEqual([], manual.runtime_problems(row,self.state))
        words['words'][0]['end'] = 1.1
        (self.out/'words.json').write_text(json.dumps(words))
        self.assertTrue(manual.runtime_problems(row,self.state))
        words['words'][0]['end'] = 1.0
        words['provenance']['mix_sha256'] = '0'*64
        (self.out/'words.json').write_text(json.dumps(words))
        self.assertTrue(manual.runtime_problems(row,self.state))

    def test_budget_tracks_only_remaining_manual_path_after_reboard_and_critic(self):
        import repair_guard
        state = self.accepted()
        result = repair_guard.production_budget_precheck(state)
        self.assertTrue(result['feasible'],result)
        self.assertEqual(8,result['resources']['preflight_renders']['required'])
        self.assertEqual(3,result['resources']['storyboard_critics']['required'])
        self.assertNotIn('tts_calls',result['resources'])
        ok,why = production_lifecycle.begin_repair(self.state,self.plan_file,reserve_reboard=True)
        self.assertTrue(ok,why)
        self.assertTrue(controller.reserve(self.state,{'storyboard_critics':1},'actual first code critic')[0])
        result = repair_guard.production_budget_precheck(controller.read_state(self.state))
        self.assertTrue(result['feasible'],result)
        self.assertEqual(0,result['resources']['reboards']['required'])
        self.assertEqual(2,result['resources']['storyboard_critics']['required'])

    def test_future_daily_run_still_refuses_sixth(self):
        other=self.out/'future.json'; self.assertTrue(controller.initialise(other,'2026-10-23','production')[0])
        self.assertTrue(controller.reserve(other,{'storyboard_critics':5},'future daily five')[0])
        before=other.read_bytes(); self.assertFalse(controller.reserve(other,{'storyboard_critics':1},'sixth')[0])
        self.assertEqual(before,other.read_bytes())

if __name__=='__main__':
    unittest.main()

