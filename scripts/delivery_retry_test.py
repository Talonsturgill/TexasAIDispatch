"""Retry an identical unshipped package through every ordinary delivery gate."""
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

import dedupe
import storyboard_check


class DeliveryRetry(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.scripts = self.root/'scripts'; self.scripts.mkdir()
        self.out = self.root/'out/dispatch'; self.out.mkdir(parents=True)
        self.dest = self.root/'runs/2099-01-01'
        self.bin = self.root/'bin'; self.bin.mkdir()
        self.log = self.root/'calls.log'
        self.env = {**os.environ,'PATH':str(self.bin)+os.pathsep+os.environ['PATH'],
                    'DELIVERY_TEST_LOG':str(self.log)}
        (self.bin/'python3').symlink_to(sys.executable)
        node = self.bin/'node'
        node.write_text('#!/bin/sh\nprintf "node\\n" >> "$DELIVERY_TEST_LOG"\n')
        node.chmod(0o755)
        ffmpeg = self.bin/'ffmpeg'
        ffmpeg.write_text('#!'+sys.executable+'\n'+
                         'import os,sys\nfrom pathlib import Path\n'+
                         'if os.environ.get("FAIL_RENDITION"):raise SystemExit(1)\n'+
                         'Path(sys.argv[-1]).write_bytes(b"fixture derived media")\n')
        ffmpeg.chmod(0o755)
        source = Path(__file__).parent
        for name in ('deliver_run.sh','dedupe.py','publish_feed.py'):
            shutil.copy2(source/name,self.scripts/name)
        body = '''import json,os,sys
from pathlib import Path
name=Path(sys.argv[0]).stem
with open(os.environ['DELIVERY_TEST_LOG'],'a') as f:f.write(name+'\\n')
if name=='public_state':
    if os.environ.get('FAIL_PUBLIC_EXPORT'):raise SystemExit('fixture export refused')
    Path(sys.argv[sys.argv.index('--out')+1]).write_bytes(Path(sys.argv[sys.argv.index('--state')+1]).read_bytes())
elif name in ('documentary_review','feed_composite_check') and '--out' in sys.argv:
    Path(sys.argv[sys.argv.index('--out')+1]).write_text('{}')
'''
        script = (source/'deliver_run.sh').read_text()
        for name in set(re.findall(r'scripts/([a-z_]+\.py)',script)) - {'dedupe.py'}:
            (self.scripts/name).write_text(body)
        for name in ('authored_story_art','alignment_reconciliation','review_scope','creative_release'):
            (self.scripts/(name+'.py')).write_text('def package(*args): pass\ndef package_assessments(*args): pass\n')
        self.board = {'date':'2099-01-01','run_id':'2099-01-01','edition_id':'2099-01-01',
                      'fingerprint':{'palette':'ochre','layout':'one'}}
        self.board_path = self.out/'storyboard.json'
        self.board_path.write_text(json.dumps(self.board))
        (self.out/'film.mp4').write_bytes(b'fixture native movie')
        (self.out/'poster.png').write_bytes(b'fixture poster')
        (self.out/'report_card.json').write_text('{}')
        self.state = {'mode':'production','run_id':'2099-01-01','phase':'publishing',
                      'terminal_state':None,'release_status':'publishable',
                      'deliverable':{'film':str(self.out/'film.mp4'),
                                    'film_sha256':self.sha(self.out/'film.mp4'),
                                    'board_sha256':self.sha(self.board_path)}}
        self.state['final_report'] = {'film_sha256':self.state['deliverable']['film_sha256']}
        self.state_path = self.out/'run_state.json'
        self.state_path.write_text(json.dumps(self.state))
        self.entry = {'date':'2099-01-01','topic':'Fixture topic','slug':'fixture','beat':'fixture',
                      'entities':['Fixture'],'fingerprint':self.board['fingerprint'],'palette':'ochre'}
        (self.root/'ledger').mkdir()
        self.history = self.root/'ledger/dispatch_history.json'
        self.history.write_text(json.dumps({'dispatches':[self.entry]}))
        (self.root/'.gitignore').write_text('out/\ncalls.log\n')
        self.git('init','-q')
        for key,value in (('user.name','Talon Sturgill'),('user.email','Talon.sturgill@gmail.com'),
                          ('commit.gpgsign','false'),('core.hooksPath',str(self.root/'no-hooks'))):
            self.git('config',key,value)
        self.git('add','.')
        self.git('commit','-qm','Create isolated retry fixture')

    def git(self,*args):
        return subprocess.check_output(['git','-C',str(self.root),*args],stderr=subprocess.STDOUT)

    @staticmethod
    def sha(path):
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def partial(self, shipped=False, different=False):
        self.dest.mkdir(parents=True)
        archived = {**self.state,'terminal_state':'shipped' if shipped else None}
        (self.dest/'run_state.json').write_text(json.dumps(archived))
        (self.dest/'dispatch.mp4').write_bytes(b'other movie' if different else (self.out/'film.mp4').read_bytes())
        later = time.time()+5
        os.utime(self.dest/'dispatch.mp4',(later,later))

    def deliver(self, extra_env=None):
        return subprocess.run(['bash',str(self.scripts/'deliver_run.sh'),'--date','2099-01-01',
            '--topic','Fixture topic','--slug','fixture','--beat','fixture','--entities','Fixture','--no-push'],
            cwd=self.root,env={**self.env,**(extra_env or {})},capture_output=True,text=True)

    def test_newer_identical_unshipped_movie_retries_every_gate_without_duplicate(self):
        self.partial()
        before = self.history.read_bytes(); private = self.state_path.read_bytes()
        result = self.deliver()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        gates = {'delivery_authority','run_discipline','storyboard_check','caption_layout','narration_picture',
                 'watchability','documentary_review','staging_check','flow_check','acoustic_alignment',
                 'music_sources','music_registry','ship_gate','music_package','super_evidence','validation_match',
                 'source_validation_proof','board_scale','floor_check','safe_area_check','feed_composite',
                 'bar_check','mutation_check','freshness_check','public_ledger'}
        observed = set(re.findall(r'^\s+([a-z_]+)\s+exit=0$',result.stdout,re.M))
        self.assertEqual(observed,gates)
        self.assertEqual(self.history.read_bytes(),before)
        self.assertEqual(self.state_path.read_bytes(),private)
        self.assertEqual((self.dest/'dispatch.mp4').read_bytes(),(self.out/'film.mp4').read_bytes())
        self.assertEqual(json.loads(self.history.read_text())['dispatches'],[self.entry])
        self.assertIn('--no-push',result.stdout)
        for name in ('dispatch-720.mp4','poster-540.jpg'):
            self.assertEqual((self.dest/name).read_bytes(),b'fixture derived media')
            self.assertEqual(self.git('show','HEAD:runs/2099-01-01/'+name),b'fixture derived media')

    def test_rendition_failure_does_not_commit_an_incomplete_release(self):
        before = self.git('rev-parse','HEAD')
        result = self.deliver({'FAIL_RENDITION':'1'})
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(self.git('rev-parse','HEAD'),before)
        self.assertFalse((self.dest/'dispatch-720.mp4').exists())

    def test_shipped_and_different_existing_movies_refuse_without_changes(self):
        self.partial(shipped=True)
        before = (self.dest/'dispatch.mp4').read_bytes()
        self.assertNotEqual(self.deliver().returncode,0)
        self.assertEqual((self.dest/'dispatch.mp4').read_bytes(),before)
        (self.dest/'run_state.json').write_text(json.dumps(self.state))
        (self.dest/'dispatch.mp4').write_bytes(b'different')
        self.assertNotEqual(self.deliver().returncode,0)
        self.assertEqual((self.dest/'dispatch.mp4').read_bytes(),b'different')

    def test_public_export_refusal_precedes_variety_and_artifact_writes(self):
        self.history.write_text(json.dumps({'dispatches':[]}))
        before = self.history.read_bytes()
        result = self.deliver({'FAIL_PUBLIC_EXPORT':'1'})
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(self.history.read_bytes(),before)
        self.assertFalse(self.dest.exists())

    def test_unrelated_staged_index_is_preserved_and_refused(self):
        path = self.root/'unrelated.txt'; path.write_text('Keep this staged work.')
        self.git('add',path.name)
        before = self.git('diff','--cached','--binary')
        result = self.deliver()
        self.assertNotEqual(result.returncode,0)
        self.assertIn('pre-existing staged index',result.stdout+result.stderr)
        self.assertEqual(self.git('diff','--cached','--binary'),before)
        self.assertFalse(self.dest.exists())

    def test_exact_entry_is_idempotent_but_conflicts_and_duplicate_rows_refuse(self):
        ledger = {'dispatches':[copy.deepcopy(self.entry)]}; before = copy.deepcopy(ledger)
        self.assertFalse(dedupe.append_entry_once(ledger,self.entry))
        self.assertEqual(ledger,before)
        with self.assertRaises(ValueError):
            dedupe.append_entry_once(ledger,{**self.entry,'topic':'Different story'})
        self.assertEqual(ledger,before)
        with self.assertRaises(ValueError):
            dedupe.append_entry_once({'dispatches':[self.entry,self.entry]},self.entry)
        self.assertTrue(dedupe.append_entry_once(ledger,{**self.entry,'slug':'other-edition'}))

    def test_only_exact_registered_current_entry_is_removed_from_delivery_comparison(self):
        other = {**self.entry,'slug':'prior'}
        history = [other,copy.deepcopy(self.entry)]
        self.assertEqual(storyboard_check.delivery_history(history,self.board_path,self.state_path,'fixture'),[other])
        self.assertEqual(history,[other,self.entry])
        problems = storyboard_check.check_divergence(self.board,[other],storyboard_check.load_rule())
        self.assertTrue(any('same film' in p or 'spatial signature' in p for p in problems))
        changed = copy.deepcopy(history); changed[-1]['fingerprint'] = {'palette':'different'}
        with self.assertRaises(ValueError):
            storyboard_check.delivery_history(changed,self.board_path,self.state_path,'fixture')

    def test_changed_registration_or_shipped_state_cannot_exclude_history(self):
        for change in ({'terminal_state':'shipped'},{'phase':'storyboard'},{'release_status':'pending'}):
            self.state_path.write_text(json.dumps({**self.state,**change}))
            with self.assertRaises(ValueError):
                storyboard_check.delivery_history([self.entry],self.board_path,self.state_path,'fixture')
        self.state_path.write_text(json.dumps(self.state))
        self.board_path.write_text(json.dumps({**self.board,'changed':True}))
        with self.assertRaises(ValueError):
            storyboard_check.delivery_history([self.entry],self.board_path,self.state_path,'fixture')
        self.board_path.write_text(json.dumps(self.board))
        (self.out/'film.mp4').write_bytes(b'changed movie')
        with self.assertRaises(ValueError):
            storyboard_check.delivery_history([self.entry],self.board_path,self.state_path,'fixture')


if __name__ == '__main__':
    unittest.main()
