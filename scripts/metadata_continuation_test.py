"""Negative coverage for the narrow geographic metadata provenance chain."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import metadata_continuation as m
from critic_gate import concept_digest
from daily_production import story_digest


class MetadataTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
        (self.root/'config').mkdir()
        self.cmap={'counties':{'Travis':{'region':'blackland'}}}
        self.write('config/county_regions.json',self.cmap)
        self.before={'cinematic_template':'carton-unload-v1','scenes':[
            {'id':f's{i}','county':'Travis','region':'hill_country','start_s':i,'vo':'unchanged','visual_events':[]}
            for i in range(1,9)]}
        self.after=copy.deepcopy(self.before)
        for s in self.after['scenes']:s['region']='blackland'
        self.board=self.root/'storyboard.json'
        self.write('storyboard.json',self.after);self.write('before.json',self.before)
        for name in ('film.mp4','preflight.mp4','mix.wav','preflight.json','storyboard_critic.json','cinema/proof.json'):
            self.write(name,{'retained':name})
        for name in m.CORE_EVIDENCE:
            if not (self.root/name).exists():self.write(name,{'retained':name})
        self.write('cinema/proof.json',{'hero':{'file':'hero.mp4'},'samples':{'s2':[{'normal':{'file':'normal.png'},'without_stage':{'file':'without.png'}}]}})
        self.write('cinema/hero-review.json',{'response':{'file':'hero-response.json'}})
        self.write('openings/comparison.json',{'options':[{'board':{'file':'a.json'},'film':{'file':'a.mp4'},'inspection':{'file':'a-inspection.json'}}]})
        self.write('openings/technical-continuation.json',{k:{'file':k+'.json'} for k in ('before_source','failure','code_review','inspection_a','inspection_b')})
        for name in m.required_evidence(self.root):
            if not (self.root/name).exists():self.write(name,{'retained':name})
        self.bindings={'before_board_sha256':m.digest(self.root/'before.json'),'after_board_sha256':m.digest(self.board),
            'before_concept_sha256':concept_digest(self.before),'after_concept_sha256':concept_digest(self.after),
            'before_story_sha256':story_digest(self.before),'after_story_sha256':story_digest(self.after),
            'renderer_sha256':'renderer','engine_sha256':'engine','generated_media_sha256':'media'}
        diagnosis={'schema':'dispatch-independent-technical-diagnosis/1','failure_category':'source','verdict':'revise',
            'reviewer_identity':'critic','reviewed_at':'2026-10-04T04:00:00Z','render_dependency_assessment':{
                'rendered_inputs_change':False,'board_sha256_before':self.bindings['before_board_sha256'],
                'renderer_sha256_before':'renderer','engine_sha256':'engine',
                'film_sha256':m.digest(self.root/'film.mp4'),'preflight_sha256':m.digest(self.root/'preflight.mp4')}}
        self.write('diagnosis.json',diagnosis);self.bindings['diagnosis_sha256']=m.digest(self.root/'diagnosis.json')
        evidence=m.collect_evidence(self.root)
        self.bindings['evidence_manifest_sha256']=m.evidence_manifest(evidence)
        self.write('audit.json',{'reviewer_identity':'critic','reviewed_at':'2026-10-04T04:05:00Z',
            'verdict':'pass','blocking_defects':[],'bindings':self.bindings})
        plan={'mechanism_id':m.MECHANISM,'director_identity':'director',
            'changed_inputs':[{'path':'out/dispatch/storyboard.json','before_sha256':self.bindings['before_board_sha256'],
                               'after_sha256':self.bindings['after_board_sha256']}],
            'failure_evidence_sha256':self.bindings['diagnosis_sha256']}
        event={'kind':'repair_authorized','repair_scope':'technical-integrity','repair_plan':plan}
        self.state={'events':[{'kind':'repair_started','failure_sha256':self.bindings['diagnosis_sha256'],
            'mechanism_id':m.MECHANISM,'repair_scope':'technical-integrity'},
            {'kind':'reserved','resources':{'reboards':1}},event]}
        self.write('run_state.json',self.state)
        self.value={'schema':m.SCHEMA,'current_board_sha256':m.digest(self.board),'baseline':self.ref('before.json'),
            'county_map':self.ref('config/county_regions.json'),'diagnosis':self.ref('diagnosis.json'),
            'audit':self.ref('audit.json'),'repair_event_index':2,'repair_event':event,'bindings':self.bindings,
            'evidence':evidence}
        self.write(m.SIDECAR,self.value)
        for p in (patch.object(m,'REPO',self.root),patch('critic_gate.renderer_digest',return_value='renderer'),
                  patch('production_lifecycle.allowance_problems',return_value=[]),
                  patch('render_manifest.engine_sha256',return_value='engine'),
                  patch('render_manifest.generated_media_sha256',return_value='media')):
            p.start();self.addCleanup(p.stop)

    def write(self,name,data):
        p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data))

    def ref(self,name):return {'file':name,'sha256':m.digest(self.root/name)}

    def test_exact_and_portable_chain(self):
        self.assertEqual(m.baseline(self.board),(self.root/'before.json').resolve())
        target=self.root/'portable';target.mkdir()
        import shutil
        shutil.copy2(self.board,target/'storyboard.json');shutil.copy2(self.root/'run_state.json',target/'run_state.json')
        shutil.copy2(self.root/'film.mp4',target/'dispatch.mp4')
        m.package(self.root,target)
        self.assertEqual(m.baseline(target/'storyboard.json'),(target/'before.json').resolve())

    def test_every_nonregion_change_refused(self):
        for key,value in [('county','Bastrop'),('vo','new'),('start_s',99),('super','new'),('region','piney_woods')]:
            changed=copy.deepcopy(self.after);changed['scenes'][0][key]=value
            self.assertTrue(m.correction_problems(self.before,changed,self.cmap),key)
        for key,value in [('cinematic_template','daily-actions-v1'),('captions',[]),('native_media',[]),('credits','new')]:
            changed=copy.deepcopy(self.after);changed[key]=value
            self.assertTrue(m.correction_problems(self.before,changed,self.cmap),key)

    def test_evidence_changes_refused(self):
        for name in ('before.json','diagnosis.json','audit.json','film.mp4','preflight.mp4','mix.wav','preflight.json','storyboard_critic.json','cinema/proof.json'):
            p=self.root/name;old=p.read_bytes();p.write_bytes(b'changed')
            with self.assertRaises((ValueError,KeyError)):m.baseline(self.board)
            p.write_bytes(old)

    def test_missing_or_mutated_charge_authorization(self):
        for mutate in (lambda s:s['events'].pop(1),lambda s:s['events'][2].update(kind='reserved'),
                       lambda s:s.update(active_repair={'pending':True})):
            state=copy.deepcopy(self.state);mutate(state);self.write('run_state.json',state)
            with self.assertRaises((ValueError,IndexError)):m.baseline(self.board)

    def test_stale_map_renderer_or_independent_identity(self):
        with patch('critic_gate.renderer_digest',return_value='changed'):
            with self.assertRaises(ValueError):m.baseline(self.board)
        self.write('config/county_regions.json',{'counties':{'Travis':{'region':'hill_country'}}})
        with self.assertRaises(ValueError):m.baseline(self.board)
        self.write('config/county_regions.json',self.cmap)
        audit=json.loads((self.root/'audit.json').read_text());audit['reviewer_identity']='director';self.write('audit.json',audit)
        self.value['audit']=self.ref('audit.json');self.write(m.SIDECAR,self.value)
        with self.assertRaises(ValueError):m.baseline(self.board)

    def test_path_escape_refused(self):
        self.value['baseline']['file']='../before.json';self.write(m.SIDECAR,self.value)
        with self.assertRaises(ValueError):m.baseline(self.board)

    def test_missing_duplicate_or_unaudited_closure_refused(self):
        for refs in (self.value['evidence'][1:],self.value['evidence']+[self.value['evidence'][0]],
                     [r for r in self.value['evidence'] if r['file']!='mix.wav']):
            value=copy.deepcopy(self.value);value['evidence']=refs;self.write(m.SIDECAR,value)
            with self.assertRaises(ValueError):m.baseline(self.board)

    def test_unrelated_or_duplicate_reboard_refused(self):
        for extra in ({'kind':'repair_started','mechanism_id':'other'},
                      {'kind':'reserved','resources':{'reboards':1}}):
            state=copy.deepcopy(self.state);state['events'].insert(1,extra)
            value=copy.deepcopy(self.value);value['repair_event_index']=3
            self.write('run_state.json',state);self.write(m.SIDECAR,value)
            with self.assertRaises(ValueError):m.baseline(self.board)

    def test_fresh_structural_measurement_binds_all_original_roles(self):
        self.write('openings/comparison.json',{'options':[{'id':'a','board':{'sha256':'board'},
            'film':{'sha256':'film'},'renderer_sha256':'original-renderer'}]})
        report={'board_sha256':'board','film_sha256':'film','renderer_sha256':'original-renderer',
            'inspector_sha256':'current-inspector','pass':True,'problems':[]}
        self.write('fresh-a.json',report)
        value=copy.deepcopy(self.value);value['structural_inspections']={'a':self.ref('fresh-a.json')}
        self.write(m.SIDECAR,value)
        with patch.object(m,'baseline',return_value=self.root/'before.json'),patch('opening_compare.inspection_producer',return_value='current-inspector'):
            self.assertEqual(m.structural_inspection(self.board,'a'),report)
            for key,bad in [('board_sha256','different'),('film_sha256','different'),
                            ('renderer_sha256','different'),('inspector_sha256','old'),('pass',False)]:
                changed=copy.deepcopy(report);changed[key]=bad;self.write('fresh-a.json',changed)
                value['structural_inspections']['a']=self.ref('fresh-a.json');self.write(m.SIDECAR,value)
                with self.assertRaises(ValueError):m.structural_inspection(self.board,'a')


if __name__=='__main__':unittest.main()
