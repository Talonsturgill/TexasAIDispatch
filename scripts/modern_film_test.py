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


class NarrationPictureTest(unittest.TestCase):
    """Replay absent analysis, early cutaway and wrong-condition failures offline."""
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        (self.root/'config').mkdir()
        views={'candidate':{'subject_ids':['gene'],'action_ids':['select']},
               'analysis':{'subject_ids':['parent','child'],'action_ids':['compare']},
               'qualified':{'subject_ids':['result'],'action_ids':['clinical-limit']},
               'normal':{'subject_ids':['normal-fly'],'action_ids':['restore-normal']}}
        (self.root/'config/modern_episode_registry.json').write_text(json.dumps({'episodes':{'fixture':{'narration_views':views}}}))
        self.mock=patch.object(modern,'REPO',self.root);self.mock.start()
        texts=['Select a gene candidate.','Compare parent and child records.','A likely diagnosis, not a treatment.']
        self.captions={'cues':[{'id':f'c{i+1}','text':t,'start':a,'end':b,'source':'measured_boundary',
            'start_measured':True,'end_measured':True} for i,(t,a,b) in enumerate(zip(texts,[.3,2.3,4.6],[1.8,4.2,6.6]))]}
        self.words={'method':'offline-test-fixture','words':[{'word':w,'start':0,'end':.1} for t in texts for w in t.split()]}
        self.board={'reference_only':True,'runtime_s':7,'scenes':[{'id':'s1','start_s':0,'duration_s':7,
            'vo':' '.join(texts),'visual_events':[{'id':f'e{i+1}','narration_id':f'c{i+1}',
            'clause_fraction_start':.1,'clause_fraction_end':.8} for i in range(3)]}],
            'narration_picture':{'version':'narration-picture-v1','clauses':[]},
            'film_direction':{'episode':'fixture','shots':[],'rewards':[]}}
        for i,(view,subjects,action) in enumerate([('candidate',['gene'],'select'),('analysis',['parent','child'],'compare'),('qualified',['result'],'clinical-limit')]):
            cid=f'c{i+1}';eid=f'e{i+1}'
            self.board['narration_picture']['clauses'].append({'id':cid,'cue_ids':[cid],'text':texts[i],
                'scene_id':'s1','subject_ids':subjects,'action_id':action,'claim_ids':['verified-fixture'],'event_ids':[eid]})
            self.board['film_direction']['shots'].append({'id':cid+'-shot','scene_id':'s1','view':view,
                'event_id':eid,'narration_ids':[cid],'start_s':0,'duration_s':1})
            self.board['film_direction']['rewards'].append({'shot_id':cid+'-shot','event_id':eid,'event_fraction':.5})
        modern.compile_narration(self.board,self.captions,self.words)

    def tearDown(self):self.mock.stop();self.temp.cleanup()

    def errors(self,board=None,captions=None,words=None):
        return modern.narration_problems(board or self.board,captions or self.captions,words or self.words)

    def test_complete_measured_contract_and_idempotent_compilation(self):
        self.assertEqual([],self.errors());before=copy.deepcopy(self.board)
        modern.compile_narration(self.board,self.captions,self.words);self.assertEqual(before,self.board)

    def test_provisional_silent_plan_cannot_authorize_measured_delivery(self):
        self.board['narration_picture']['timing_mode']='authored'
        self.board['captions']=copy.deepcopy(self.captions['cues'])
        for cue in self.board['captions']:cue['source']='authored_estimate'
        self.assertEqual([],modern.narration_problems(self.board))
        self.assertTrue(any('authored estimate' in e for e in self.errors()))

    def test_absent_parent_child_analysis_cannot_be_replaced_by_candidate(self):
        self.board['film_direction']['shots'][1]['view']='candidate'
        self.assertTrue(any('incompatible subject' in e for e in self.errors()))

    def test_cut_cannot_leave_candidate_before_its_spoken_clause_ends(self):
        self.board['film_direction']['shots'][0]['duration_s']=1
        self.assertTrue(any('does not cover' in e for e in self.errors()))

    def test_qualifiers_and_original_word_positions_are_required(self):
        self.board['narration_picture']['clauses'][-1]['text']='A diagnosis.'
        self.assertTrue(self.errors())
        self.board['narration_picture']['clauses'][-1]['text']=self.captions['cues'][-1]['text']
        self.board['narration_picture']['clauses'][-1]['word_range']=[0,6]
        self.assertTrue(any('positional' in e for e in self.errors()))

    def test_duplicate_or_omitted_clauses_are_rejected(self):
        self.board['narration_picture']['clauses'].append(copy.deepcopy(self.board['narration_picture']['clauses'][0]))
        self.assertTrue(self.errors())
        self.board['narration_picture']['clauses']=self.board['narration_picture']['clauses'][1:3]
        self.assertTrue(self.errors())

    def test_stale_caption_or_acoustic_evidence_fails(self):
        self.words['words'][0]['end']=.5
        self.assertTrue(any('stale acoustic' in e for e in self.errors()))
        self.captions['cues'][0]['end']=1.9
        self.assertTrue(any('clause clock' in e for e in self.errors()))

    def test_modelled_boundaries_and_decorative_action_substitution_fail(self):
        self.captions['cues'][0]['start_measured']=False
        self.assertTrue(self.errors());self.captions['cues'][0]['start_measured']=True
        self.board['narration_picture']['clauses'][0]['action_id']='camera-orbit'
        self.assertTrue(any('incompatible' in e for e in self.errors()))

    def test_current_registered_consumers_reject_the_two_observed_false_views(self):
        # Read the actual production registry; keep this independent of private run files.
        actual=json.loads((Path(__file__).resolve().parents[1]/'config/modern_episode_registry.json').read_text())
        fixture=json.loads((self.root/'config/modern_episode_registry.json').read_text())
        fixture['episodes']['fly-gene-test-v2']=actual['episodes']['fly-gene-test-v2']
        (self.root/'config/modern_episode_registry.json').write_text(json.dumps(fixture))
        self.board['film_direction']['episode']='fly-gene-test-v2'
        row=self.board['narration_picture']['clauses'][0]
        row.update(subject_ids=['gene-candidate'],action_id='select-candidate')
        self.board['film_direction']['shots'][0]['view']='gene-detail'
        self.assertTrue(any('incompatible subject or action' in e for e in self.errors()))
        row.update(subject_ids=['test-fly','culture-vial'],action_id='living-test')
        self.board['film_direction']['shots'][0]['view']='paired-result'
        self.assertTrue(any('incompatible subject or action' in e for e in self.errors()))

    def test_patient_variant_cannot_use_normal_condition(self):
        row=self.board['narration_picture']['clauses'][0]
        row.update(subject_ids=['variant-fly'],action_id='restore-partial')
        self.board['film_direction']['shots'][0]['view']='normal'
        self.assertTrue(any('incompatible' in e for e in self.errors()))

    def test_new_measured_pause_moves_clause_handoff_without_scene_scaling(self):
        first=copy.deepcopy(self.board['narration_picture']['clauses'][0])
        self.captions['cues'][1].update(start=2.8,end=4.3)
        modern.compile_narration(self.board,self.captions,self.words)
        self.assertEqual(first,self.board['narration_picture']['clauses'][0])
        self.assertEqual(2.3,self.board['film_direction']['shots'][1]['start_s'])
        self.assertEqual([],self.errors())


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

    def narration_report(self):
        board=copy.deepcopy(self.board)
        board['narration_picture']={'version':'narration-picture-v1','clauses':[
            {'id':'c1','start_s':.5,'end_s':1.4},
            {'id':'c2','start_s':1.5,'end_s':2.4}]}
        report=self.report()
        report['narration_picture_observations']={'film_sha256':'a'*64,'clauses':[
            dict(row,pass_value=True,observed='Offline observed-action transport fixture, never film approval.')
            for row in board['narration_picture']['clauses']]}
        for row in report['narration_picture_observations']['clauses']:
            row['pass']=row.pop('pass_value')
        return board,report

    def test_malformed_narration_review_shape_fails_closed_without_crashing(self):
        board,report=self.narration_report()
        self.assertEqual([],modern.review_problems(board,report))
        # Reproduce the actual provider shape: valid observation rows as a top-level list.
        rows=copy.deepcopy(report['narration_picture_observations']['clauses'])
        for value in [rows,[],None,'invalid',7,True]:
            with self.subTest(observations_type=type(value).__name__):
                changed=copy.deepcopy(report);changed['narration_picture_observations']=value
                self.assertTrue(modern.review_problems(board,changed))
        for value in [{},'invalid',7,None]:
            with self.subTest(clauses_type=type(value).__name__):
                changed=copy.deepcopy(report);changed['narration_picture_observations']['clauses']=value
                self.assertTrue(modern.review_problems(board,changed))
        for value in [None,[],['invalid'],'invalid',7,{'id':[]}]:
            with self.subTest(row_type=type(value).__name__):
                changed=copy.deepcopy(report);changed['narration_picture_observations']['clauses'][0]=value
                self.assertTrue(modern.review_problems(board,changed))

    def test_valid_narration_review_still_requires_exact_hash_order_and_verdict(self):
        board,report=self.narration_report()
        mutations=[
            lambda o:o.update(film_sha256='b'*64),
            lambda o:o['clauses'].reverse(),
            lambda o:o['clauses'].pop(),
            lambda o:o['clauses'][0].update({'pass':False}),
            lambda o:o['clauses'][0].update(start_s=.6),
            lambda o:o['clauses'][0].update(observed=''),
        ]
        for mutation in mutations:
            changed=copy.deepcopy(report);mutation(changed['narration_picture_observations'])
            self.assertTrue(modern.review_problems(board,changed))
        self.assertEqual([],modern.review_problems(board,report))

    def test_malformed_modern_review_rows_are_refused(self):
        for value in [None,[],['invalid'],'invalid',7]:
            with self.subTest(row_type=type(value).__name__):
                report=self.report();report['modern_observations']['pace']=value
                self.assertTrue(modern.review_problems(self.board,report))

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
