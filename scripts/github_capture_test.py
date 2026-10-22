"""Offline transport regressions. No GitHub job, render, provider or production claim."""
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import capture_guard
import github_capture as capture


class CaptureTest(unittest.TestCase):
    def request(self):
        return {'schema': capture.SCHEMA, 'repository': capture.REPOSITORY,
                'source_commit': 'a'*40, 'github_actor': 'actual-unit-caller', 'operation': 'cinema'}

    def environment(self):
        return {'GITHUB_ACTIONS': 'true', 'GITHUB_REPOSITORY': capture.REPOSITORY,
                'GITHUB_JOB': 'capture', 'GITHUB_EVENT_NAME': 'workflow_dispatch',
                'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_SHA': 'a'*40, 'GITHUB_WORKFLOW_SHA': 'a'*40,
                'GITHUB_ACTOR': 'actual-unit-caller', 'GITHUB_TRIGGERING_ACTOR': 'actual-unit-caller',
                'GITHUB_RUN_ID': '1234', 'GITHUB_WORKFLOW_REF': capture.REPOSITORY+
                    '/.github/workflows/guards.yml@refs/heads/unit'}

    def test_exact_identity_admission(self):
        self.assertEqual(capture.context_problems(self.request(), self.environment()), [])

    def test_wrong_actor_epoch_host_workflow_and_retry_refuse(self):
        for key, value in [('GITHUB_ACTOR','other'), ('GITHUB_TRIGGERING_ACTOR','other'),
                ('GITHUB_REPOSITORY','other/repo'), ('GITHUB_RUN_ATTEMPT','2'),
                ('GITHUB_ACTIONS','false'), ('GITHUB_WORKFLOW_SHA','b'*40),
                ('GITHUB_JOB','guards'), ('GITHUB_EVENT_NAME','push')]:
            with self.subTest(key=key):
                env = self.environment(); env[key] = value
                self.assertTrue(capture.context_problems(self.request(), env))

    def test_only_fixed_compute_operations(self):
        for operation in ['publish', 'shell', 'send', 'cinema; anything']:
            row = self.request(); row['operation'] = operation
            self.assertTrue(capture.context_problems(row, self.environment()))
        self.assertEqual(set(capture.OPS), {'preflight','cinema','full','phone-motion','full-motion'})

    def test_motion_commands_use_original_exact_operator_notes(self):
        from capture_reservation import operation_for
        import shlex
        from claude_motion_review import PHONE_OPERATIONS
        for operation in ('phone-motion','full-motion'):
            note,resource,argv = capture.OPS[operation]
            command='bash scripts/run_with_env.sh '+shlex.join(argv)
            self.assertEqual(operation_for([command],Path('/unit')),note)
            self.assertEqual(resource,'preflight_renders')
        self.assertEqual(capture.OPS['phone-motion'][0],PHONE_OPERATIONS['current'])

    def test_motion_destination_cannot_overwrite_retained_sequence(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve()
            (repo/'out/dispatch/phone-motion-current').mkdir(parents=True)
            with self.assertRaisesRegex(ValueError,'already exists'):
                capture.operation_precheck(repo,'phone-motion',{})

    def test_charge_identity_and_replay(self):
        note, resource, _ = capture.OPS['cinema']
        event = {'kind':'reserved', 'resources':{resource:1}, 'note':note,
                 'preflight_identity':'actual-unit-input'}
        hashed = capture_guard.event_digest(event)
        state = {'events':[event]}
        self.assertEqual(capture.prepaid(state, 'cinema', hashed), event)
        for bad in ['0'*64, capture_guard.event_digest({'kind':'other'})]:
            with self.assertRaises(ValueError): capture.prepaid(state, 'cinema', bad)
        state['events'].append({'kind':'prepared_capture_claimed','event_sha256':hashed})
        with self.assertRaisesRegex(ValueError, 'unused prepaid'):
            capture.prepaid(state, 'cinema', hashed)

    def test_cas_claim_creation_never_overwrites(self):
        with patch.object(capture.ck, 'git', return_value=subprocess.CompletedProcess([],0,b'',b'')) as git:
            capture.claim_once(Path('/unit'), 'refs/heads/codex/capture-claims/unit', 'a'*40)
            self.assertIn('--force-with-lease=refs/heads/codex/capture-claims/unit:', git.call_args.args)
            self.assertNotIn('--force', git.call_args.args)

    def test_real_git_cas_refuses_replay(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); remote = root/'remote.git'; repo = root/'repo'
            subprocess.run(['git','init','--bare','-q',str(remote)],check=True)
            subprocess.run(['git','init','-q',str(repo)],check=True)
            subprocess.run(['git','-C',str(repo),'remote','add','origin',str(remote)],check=True)
            first = capture.commit_record(repo,'claim.json',{'unit':1},'Unit claim')
            ref = 'refs/heads/codex/capture-claims/unit'
            capture.claim_once(repo,ref,first)
            with self.assertRaisesRegex(ValueError,'already claimed'):
                capture.claim_once(repo,ref,first)
            second = capture.commit_record(repo,'claim.json',{'unit':2},'Unit replay')
            with self.assertRaisesRegex(ValueError,'already claimed'):capture.claim_once(repo,ref,second)
            current = subprocess.check_output(['git','--git-dir',str(remote),'rev-parse',ref],text=True).strip()
            self.assertEqual(current,first)

    def test_request_hash_mismatch_stops_before_restore_or_claim(self):
        with patch.object(capture,'request_at',return_value=(self.request(),'1'*64)), \
                patch.object(capture.ck,'restore') as restore, patch.object(capture,'claim_once') as claim:
            with self.assertRaisesRegex(ValueError,'request bytes differ'):
                capture.stage(Path('/unit'),'a'*40,'2'*64,Path('/new'))
            restore.assert_not_called();claim.assert_not_called()

    def test_unpinned_request_rejected(self):
        with self.assertRaisesRegex(ValueError,'immutable commit'):
            capture.request_at('/unit','main')

    def test_delegate_fences_changed_epoch_and_extra_controller_charge(self):
        import publication_owner
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve();path=repo/'out/dispatch/run_state.json'
            path.parent.mkdir(parents=True)
            state={'run_id':'2026-10-21','mode':'production','events':[],'usage':{'preflight_renders':1}}
            path.write_text(json.dumps(state))
            request={**self.request(),'run_id':state['run_id'],'owner_sha256':'a'*64,
                     'epoch':'b'*32,'reservation_event_sha256':'c'*64,'checkpoint_oid':'d'*40}
            activation={'request_oid':'e'*40,'request_sha256':'f'*64,
                        'github_run_id':'1234','claim_commit':'1'*40}
            active=repo/'activation.json';active.write_text(json.dumps(activation))
            owner={'status':'held','runtime':'codex','run_id':state['run_id'],
                   'owner_sha256':'a'*64,'epoch':'b'*32,'expires_at':'2099-01-01T00:00:00+00:00'}
            claim={k:activation[k] for k in ('request_oid','request_sha256','github_run_id')}
            claim['github_actor']='actual-unit-caller'
            env={**self.environment(),'DISPATCH_GITHUB_CAPTURE_REQUEST':str(active)}
            raw=json.dumps(capture.ck.public_ledger(state,repo)).encode()
            def git(root,*args,**kwargs):
                return subprocess.CompletedProcess(args,0,(('1'*40+' refs/heads/unit\n').encode()
                                                   if args[0]=='ls-remote' else b''),b'')
            with patch.dict(capture.os.environ,env,clear=True), \
                    patch.object(capture,'request_at',return_value=(request,'f'*64)), \
                    patch.object(capture.ck,'git',side_effect=git), \
                    patch.object(capture.ck,'show',return_value=json.dumps(claim).encode()), \
                    patch.object(capture.ck,'verify_checkpoint',return_value=({},raw)), \
                    patch.object(publication_owner,'read_remote',return_value=owner):
                self.assertEqual(capture.require_delegate(path)['epoch'],'b'*32)
                owner['epoch']='2'*32
                with self.assertRaisesRegex(ValueError,'lease or epoch'):
                    capture.require_delegate(path)
                owner['epoch']='b'*32
                proposed=copy.deepcopy(state);proposed['usage']['preflight_renders']=2
                with self.assertRaisesRegex(ValueError,'no extra charges'):
                    capture.require_delegate(path,state=proposed)

    def test_checkpoint_prefix_and_usage_cannot_regress(self):
        old = {'run_id':'2026-10-21','events':[{'kind':'reserved'}],
               'resource_envelope':{'full_renders':1},'usage':{'full_renders':1}}
        for key, value in [('events',[]),('usage',{'full_renders':0}),('resource_envelope',{})]:
            new = copy.deepcopy(old);new[key]=value
            self.assertTrue(capture.ck.monotonic_problems(old,new))

    def test_import_streams_changed_bytes_and_preserves_grant_origins(self):
        import publication_owner
        with tempfile.TemporaryDirectory() as temporary:
            repo = Path(temporary).resolve()
            subprocess.run(['git','init','-q',str(repo)],check=True)
            package = repo/'out/dispatch';package.mkdir(parents=True)
            state = {'run_id':'2026-10-21','mode':'production','events':[],
                     'usage':{'full_renders':1},'resource_envelope':{'full_renders':1}}
            (package/'run_state.json').write_text(json.dumps(state))
            (package/'same.txt').write_text('unchanged')
            unchanged_time = (package/'same.txt').stat().st_mtime_ns
            (package/'changed.txt').write_text('retained baseline')
            owner = {'owner_sha256':'a'*64,'epoch':'b'*32}
            result = {'owner_sha256':owner['owner_sha256'],'epoch':owner['epoch'],
                      'request_oid':'c'*40,'request_sha256':'d'*64,'source_commit':'e'*40}
            base = repo/'checkpoints/2026-10-21';(base/'files/out/dispatch').mkdir(parents=True)
            payloads = {'same.txt':b'unchanged','changed.txt':b'new captured bytes',
                        'github-capture-result.json':json.dumps(result).encode()}
            rows=[]
            for name,data in payloads.items():
                path=base/'files/out/dispatch'/name;path.write_bytes(data)
                rows.append({'path':'out/dispatch/'+name,'sha256':capture.digest(data)})
            raw=(json.dumps(capture.ck.public_ledger(state,repo))).encode()
            (base/'run_state.json').write_bytes(raw)
            origins=[]
            manifest={'schema':capture.ck.SCHEMA,'run_id':state['run_id'],
                      'ledger_sha256':capture.digest(raw),'files':rows,'repo_root':'/original',
                      'grant_origin_roots':origins}
            (base/'manifest.json').write_text(json.dumps(manifest))
            subprocess.run(['git','-C',str(repo),'add','checkpoints'],check=True)
            subprocess.run(['git','-C',str(repo),'-c','user.name=Unit','-c','user.email=unit@example.invalid',
                            'commit','-qm','Unit returned checkpoint'],check=True)
            oid=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
            original_git=capture.ck.git
            def git(root,*args,**kwargs):
                if args[0]=='fetch':return subprocess.CompletedProcess(args,0,b'',b'')
                return original_git(root,*args,**kwargs)
            with patch.object(publication_owner,'require_owner',return_value=owner), \
                    patch.object(capture.ck,'remote_tip',return_value=oid),patch.object(capture.ck,'git',side_effect=git), \
                    patch.object(capture,'request_at',return_value=({'source_commit':'e'*40,
                        'run_id':state['run_id'],'checkpoint_oid':oid},'d'*64)):
                imported=capture.import_result(repo,oid)
            self.assertEqual(imported['changed_files'],2)
            self.assertEqual((package/'same.txt').stat().st_mtime_ns,unchanged_time)
            self.assertEqual((package/'changed.txt').read_bytes(),b'new captured bytes')
            self.assertTrue(list((package/'github-capture-import-baseline').glob('*')))
            self.assertEqual(json.loads((repo/capture.ck.GRANT_ROOTS_FILE).read_text()),{'schema':1,'entries':origins})


if __name__ == '__main__':
    unittest.main()
