"""Regression: the rejected route cannot satisfy future production or a creative ceiling."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import modern_film as modern
import modern_film_proof
import story_art
import creative_release
import autonomous_completion as capacity
import run_controller as controller
import repair_guard


class ModernFilmTest(unittest.TestCase):
    def setUp(self):self.board=modern_film_proof.board('a')

    def report(self):
        rows={'film_sha256':'a'*64}
        for key in modern.policy()['review_criteria']:
            rows[key]={'pass':True,'start_s':.5,'end_s':1.4,'observed':'Offline transport fixture only, never an actual reviewer finding.'}
        return {'film_sha256':'a'*64,'modern_observations':rows}

    def test_two_complete_current_treatments_and_historical_route(self):
        self.assertEqual([],modern.problems(self.board))
        self.assertEqual([],modern.problems(modern_film_proof.board('b')))
        self.assertEqual([],modern.problems({'date':'2026-10-07'}))
        old=json.loads((modern.REPO/'runs/2026-10-07/storyboard.json').read_text())
        old['date']='2026-10-08'
        self.assertTrue(modern.problems(old))

    def test_missing_unknown_or_changed_renderer_cannot_fall_back(self):
        for key,value in [('episode','cooling-inspection-v1'),('version','old'),('renderer_inputs',[])]:
            data=copy.deepcopy(self.board);data['film_direction'][key]=value
            self.assertTrue(modern.problems(data))
        data=copy.deepcopy(self.board);data['cinematic_template']='cooling-inspection-v1'
        self.assertTrue(modern.problems(data))

    def test_retiming_preserves_editorial_anchors_without_compounding(self):
        from critic_gate import concept_digest
        original=copy.deepcopy(self.board); data=copy.deepcopy(original)
        identity=concept_digest(data)
        cursor=0
        for scene in data['scenes']:
            scene['start_s']=cursor;scene['duration_s']*=.96
            for event in scene['visual_events']:
                event['at_s']*=.96;event['duration_s']*=.96
            cursor+=scene['duration_s']
        data['runtime_s']=cursor
        self.assertEqual([],modern.retime(data))
        self.assertEqual(identity,concept_digest(data))
        once=copy.deepcopy(data['film_direction']);self.assertEqual([],modern.retime(data))
        self.assertEqual(once,data['film_direction'])
        for changed,baseline in zip(data['scenes'],original['scenes']):changed.update(baseline)
        data['runtime_s']=original['runtime_s']
        self.assertEqual([],modern.retime(data))
        self.assertEqual(original['film_direction'],data['film_direction'])

    def test_empty_holds_unimplemented_views_and_repeated_tableau_rejected(self):
        mutations=[lambda p:p['shots'][0].update(duration_s=8),
                   lambda p:p['shots'][0].update(view='old-stage'),
                   lambda p:p['shots'][1].update(start_s=2.5),
                   lambda p:p['shots'][0].update(event_id='s6-event-3'),
                   lambda p:[s.update(framing='wide') for s in p['shots']],
                   lambda p:p.update(rewards=[p['rewards'][-1]])]
        for mutation in mutations:
            data=copy.deepcopy(self.board);mutation(data['film_direction'])
            self.assertTrue(modern.problems(data))

    def test_fresh_images_source_namespace_charge_and_slices(self):
        mutations=[lambda p:p['entries'][0].update(sha256='b'*64),
                   lambda p:p['entries'][0].update(generated_at='2026-10-06T12:00:00+00:00'),
                   lambda p:p['requests'][0].update(file='generated/story-art/2026-10-06/hero.png'),
                   lambda p:p['entries'][1].update(slices={'wrench':[1500,0,100,100]}),
                   lambda p:p['entries'][0]['charge'].update(event_sha256='c'*64),
                   lambda p:p.update(entries=p['entries'][:1])]
        for mutation in mutations:
            data=copy.deepcopy(self.board);mutation(data['story_art'])
            self.assertTrue(story_art.problems(data))
        data=copy.deepcopy(self.board);data['reference_only']=False
        self.assertTrue(story_art.problems(data))

    def test_art_can_resume_after_midnight_but_cannot_duplicate_a_generation(self):
        data=copy.deepcopy(self.board)
        data['story_art']['entries'][0]['generated_at']='2026-10-08T12:00:00+00:00'
        self.assertEqual([],story_art.problems(data))
        data['story_art']['entries'][1]['generation_id']=data['story_art']['entries'][0]['generation_id']
        self.assertTrue(story_art.problems(data))

    def test_modern_repair_batch_funds_fresh_art_without_expanding_narration_scope(self):
        from production_lifecycle import repair_batch,NARRATION_SCOPE,CONTEXT_SCOPE
        self.assertNotIn('image_generations',repair_batch({'run_id':'2026-10-07'},'standard'))
        self.assertEqual(2,repair_batch({'run_id':'2026-10-08'},'standard')['image_generations'])
        self.assertNotIn('image_generations',repair_batch({'run_id':'2026-10-08'},NARRATION_SCOPE))
        self.assertNotIn('image_generations',repair_batch({'run_id':'2026-10-08'},CONTEXT_SCOPE))

    def test_clean_release_can_recover_its_exact_ignored_rasters(self):
        import shutil,subprocess
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            subprocess.run(['git','init','-q',str(root)],check=True)
            (root/'.gitignore').write_text('video-engine/public/generated/\n')
            for original in story_art.paths(self.board):
                target=root/original.relative_to(modern.REPO)
                target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original,target)
            board=root/'board.json';board.write_text(json.dumps(self.board))
            self.assertEqual(2,len(story_art.stage(board,repo=root)))
            files=subprocess.check_output(['git','-C',str(root),'ls-files'],text=True).splitlines()
            self.assertEqual(sorted('video-engine/public/'+r['file'] for r in self.board['story_art']['entries']),sorted(files))

    def test_current_controller_refuses_a_backdated_board_without_raising(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for name in ['film.mp4','manifest.json']:root.joinpath(name).write_text('{}')
            root.joinpath('board.json').write_text(json.dumps({'date':'2026-10-07'}))
            state={'mode':'production','run_id':'2026-10-08','deliverable':{'film':str(root/'film.mp4'),'board':str(root/'board.json'),'manifest':str(root/'manifest.json')}}
            self.assertEqual(['current production board date must match its edition'],controller.deliverable_problems(state))

    def test_actual_pre_upgrade_ledger_remains_unchanged_and_resumable(self):
        from production_lifecycle import allowance_problems
        path=modern.REPO/'runs/2026-10-07/run_state.json';original=path.read_bytes()
        retained=controller.read_state(path)
        self.assertNotIn('image_generations',retained['usage'])
        self.assertEqual([],allowance_problems(retained))
        self.assertEqual(original,path.read_bytes())
        with tempfile.TemporaryDirectory() as temp:
            future=Path(temp)/'run_state.json';retained['run_id']='2026-10-08'
            future.write_text(json.dumps(retained))
            with self.assertRaises(ValueError):controller.read_state(future)

    def test_lab_funding_cannot_become_production_delivery(self):
        from production_quality import publication_problems
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);board=root/'board.json';board.write_text(json.dumps(self.board))
            self.assertEqual(['engineering reference footage cannot authorize production delivery'],publication_problems(board,root/'absent.mp4'))

    def test_high_scores_and_creative_ceiling_do_not_replace_observed_finish(self):
        report=self.report();report['score']=9.5
        self.assertEqual([],modern.review_problems(self.board,report))
        report['modern_observations']['pace']['pass']=False
        with patch.object(creative_release,'eligible',return_value=True):
            self.assertFalse(creative_release.review_allows(self.board,report,embedded=True))
        self.assertTrue(modern.review_problems(self.board,{'score':9.9}))
        self.assertTrue(modern.review_problems(self.board,self.report(),'b'*64))
        self.assertTrue(modern.assessment_problems(self.board,{'defects':[{'category':'surface_finish'}]}))

    def test_future_completion_funds_art_and_preserves_original_policy(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'run_state.json'
            self.assertTrue(controller.initialise(path,'2026-10-08','production')[0])
            state=controller.read_state(path)
            original=copy.deepcopy(state['resource_envelope'])
            self.assertEqual(2,state['limits']['image_generations'])
            self.assertEqual(capacity.MODERN_POLICY_SHA256,next(e['policy_sha256'] for e in state['events'] if e['kind']==capacity.ADOPTION))
            budget=repair_guard.production_budget_precheck(state,mandatory_repair=True)
            self.assertEqual(2,budget['resources']['image_generations']['required'])
            for name in capacity.resource_requirements(state):state['usage'][name]=state['resource_envelope'][name]
            controller.event(state,'reserved',resources={k:state['usage'][k] for k in capacity.resource_requirements(state)},note='Offline already charged fixture')
            controller.save(path,state)
            report=self.report();report.update(verdict='revise',reviewer_identity='independent-fixture',blocking_defects=[{'criterion':'pace','problem':'The current film repeats an empty tableau instead of the performed source-backed turn.'}])
            report['modern_observations']['pace']['pass']=False
            failure=Path(temp)/'rejection.json';failure.write_text(json.dumps(report))
            plan=Path(temp)/'plan.json';plan.write_text(json.dumps({'director_identity':'director-fixture','repair_scope':'standard','failed_film_sha256':'a'*64,'failure_evidence':str(failure),'failure_evidence_sha256':capacity.sha(failure.read_text()),'resources':{'image_generations':2,'full_renders':1},'repair':'Repair the independently observed current film floor with fresh source-bound art and a complete renewed review path.'}))
            accepted,message=capacity.grant_capacity(path,plan)
            self.assertTrue(accepted,message)
            repaired=controller.read_state(path)
            self.assertEqual(original,repaired['resource_envelope'])
            self.assertEqual(state['usage'],repaired['usage'])
            grant=next(e for e in repaired['events'] if e['kind']==capacity.EVENT)
            self.assertEqual('modern-film-floor',grant['reason'])
            self.assertEqual(2,grant['resource_increments']['image_generations'])
            self.assertEqual([],capacity.replay(repaired)[1])
        self.assertEqual([],capacity.policy_problems(capacity.POLICY.read_text()))

    def test_guide_text_is_bound_and_three_final_responses_remain_separate(self):
        from daily_production import craft_reading_paths
        names={p.name for p in craft_reading_paths(self.board)}
        self.assertTrue({'MODERN_FILM.md','STORY_ART.md','story_art.json','autonomous_completion_v2.json'}<=names)
        self.assertIn('finished_art',modern.review_instruction(self.board))

    def test_compact_packet_policy_selection_keeps_retained_authorization(self):
        # Compact packet fixtures can omit full events; current packets must still
        # bind current capacity, while archived adoption remains authoritative.
        self.assertEqual(capacity.MODERN_POLICY,capacity.selected_policy(
            {'run_id':'2026-10-08','events':['omitted production history']}))
        state=controller.read_state(modern.REPO/'runs/2026-10-07/run_state.json')
        self.assertEqual(capacity.POLICY,capacity.selected_policy(state))


if __name__=='__main__':unittest.main()
