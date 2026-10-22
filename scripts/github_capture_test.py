"""Offline transport regressions. No GitHub job, render, provider or production claim."""
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import re
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

    def test_workflow_job_env_uses_only_supported_job_contexts(self):
        import yaml
        workflow=yaml.safe_load((Path(__file__).resolve().parents[1]/'.github/workflows/guards.yml').read_text())
        allowed={'github','needs','strategy','matrix','vars','secrets','inputs'}
        for job in workflow['jobs'].values():
            for value in job.get('env',{}).values():
                expressions=re.findall(r'\$\{\{(.*?)\}\}',str(value))
                for expression in expressions:
                    self.assertTrue(set(re.findall(r'\b([a-z_]+)\.',expression))<=allowed)
        first=workflow['jobs']['capture']['steps'][0]['run']
        self.assertIn('$RUNNER_TEMP/dispatch-capture/TexasAIDispatch',first)
        self.assertIn('CAPTURE_ROOT=%s',first)
        self.assertIn('DISPATCH_GITHUB_CAPTURE_REQUEST=%s',first)
        self.assertEqual(first.count('>> "$GITHUB_ENV"'),2)

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
        self.assertEqual(set(capture.OPS), {'preflight','cinema','full','phone-motion','full-motion','preship'})

    def test_preship_fixed_command_is_native_and_prepaid(self):
        import capture_reservation
        import shlex
        note,resource,argv=capture.OPS['preship']
        command='bash scripts/run_with_env.sh '+shlex.join(argv)
        self.assertTrue(capture_guard.is_capture(command,'/unit',Path('/unit')))
        self.assertEqual(capture_reservation.operation_for([command],Path('/unit')),note)
        self.assertEqual(resource,'preflight_renders')

    def test_preship_refuses_unregistered_or_changed_native_film(self):
        import preship_compute as preship
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); output=root/'out/dispatch';output.mkdir(parents=True)
            (output/'film.mp4').write_bytes(b'unit native film')
            (output/'storyboard.json').write_text('{}')
            state={'deliverable':{'review_only':False,'film_sha256':preship.digest(output/'film.mp4'),
                                 'board_sha256':preship.digest(output/'storyboard.json')}}
            capture.operation_precheck(root,'preship',state)
            (output/'film.mp4').write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'registered exact native film'):
                capture.operation_precheck(root,'preship',state)

    def test_preship_import_preserves_real_verdict_and_refuses_stale_film(self):
        import preship_compute as preship
        import capture_reservation
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve(); output=root/'out/dispatch';output.mkdir(parents=True)
            (output/'film.mp4').write_bytes(b'unit film');(output/'storyboard.json').write_text('{}')
            state={'deliverable':{'review_only':False,'film_sha256':preship.digest(output/'film.mp4'),
                                 'board_sha256':preship.digest(output/'storyboard.json')}}
            (output/'run_state.json').write_text(json.dumps(state))
            package=root/preship.PACKAGE;package.mkdir()
            raw=json.dumps({'schema':'dispatch_preship/1','board_sha256':state['deliverable']['board_sha256'],
                            'gates':['unit original mechanical gate']},indent=1).encode()
            (package/'preship.json').write_bytes(raw)
            receipt={'schema':'dispatch_remote_preship/1','exit_code':0,
                     **preship.current_inputs(root,state),'input_identity':'unit bound identity',
                     'verdict_sha256':preship.digest(package/'preship.json')}
            (package/'receipt.json').write_text(json.dumps(receipt))
            result={'operation':'preship','exit_code':0}; request={'operation':'preship'}
            with patch.object(capture_reservation,'input_identity',return_value='unit bound identity'):
                preship.import_verdict(root,result,request)
                self.assertEqual((root/'out/gates/preship.json').read_bytes(),raw)
                for key,value in [('input_identity','changed'),('verdict_sha256','0'*64),('exit_code',1)]:
                    bad={**receipt,key:value};(package/'receipt.json').write_text(json.dumps(bad))
                    with self.assertRaises(ValueError):preship.import_verdict(root,result,request)
                (package/'receipt.json').write_text(json.dumps(receipt))
                (output/'film.mp4').write_bytes(b'changed film')
                with self.assertRaisesRegex(ValueError,'registered exact native film'):
                    preship.import_verdict(root,result,request)

    def test_preship_operator_claims_before_checks_and_retains_real_failure(self):
        import preship_compute as preship
        import capture_reservation
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve(); output=root/'out/dispatch';output.mkdir(parents=True)
            (output/'film.mp4').write_bytes(b'unit film');(output/'storyboard.json').write_text('{}')
            state={'deliverable':{'review_only':False,'film_sha256':preship.digest(output/'film.mp4'),
                                 'board_sha256':preship.digest(output/'storyboard.json')}}
            (output/'run_state.json').write_text(json.dumps(state))
            stale=root/'out/gates/preship.json';stale.parent.mkdir();stale.write_text('stale')
            called=[]
            def claim(*args):
                called.append('claim');return True,'unit prepaid claim'
            def operator(argv,**kwargs):
                self.assertEqual(called,['claim']);self.assertFalse(stale.exists())
                self.assertIn('scripts/preship_check.py',argv)
                return subprocess.CompletedProcess(argv,1,b'actual unit gate failed\n',b'unit stderr\n')
            with patch.object(capture_reservation,'claim',side_effect=claim), \
                    patch.object(capture_reservation,'input_identity',return_value='unit identity'), \
                    patch.object(preship.subprocess,'run',side_effect=operator):
                self.assertEqual(preship.run(root),1)
            package=root/preship.PACKAGE
            self.assertEqual((package/'stdout.txt').read_bytes(),b'actual unit gate failed\n')
            self.assertEqual(preship.read(package/'receipt.json')['exit_code'],1)
            self.assertFalse((package/'preship.json').exists())

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

    def test_failed_isolated_restore_audit_cannot_activate_or_execute_operator(self):
        import publication_owner
        request={**self.request(),'run_id':'unit-run','checkpoint_oid':'b'*40,
                 'ledger_sha256':'c'*64,'owner_sha256':'d'*64,'epoch':'e'*32,
                 'reservation_event_sha256':'f'*64}
        owner={k:request[k] for k in ('run_id','owner_sha256','epoch')}
        owner.update(runtime='codex',status='held',expires_at='2099-01-01T00:00:00+00:00')
        with tempfile.TemporaryDirectory() as tmp:
            repo=Path(tmp).resolve()/'source';repo.mkdir(); destination=repo.parent/'restored'
            def git(*args,**kwargs):
                return subprocess.CompletedProcess([],0,('a'*40).encode() if args[1:3]==('rev-parse','HEAD') else b'',b'')
            with patch.object(capture,'request_at',return_value=(request,'1'*64)), \
                    patch.object(capture,'context_problems',return_value=[]), \
                    patch.object(capture.ck,'git',side_effect=git), \
                    patch.object(capture.ck,'remote_tip',return_value=request['checkpoint_oid']), \
                    patch.object(capture.ck,'verify_checkpoint',return_value=({'ledger_sha256':'c'*64},b'{}')), \
                    patch.object(capture,'prepaid'),patch.object(publication_owner,'read_remote',return_value=owner), \
                    patch.object(capture,'commit_record',return_value='2'*40),patch.object(capture,'claim_once') as claim, \
                    patch.dict(capture.os.environ,{'GITHUB_RUN_ID':'123','GITHUB_ACTOR':'unit'}), \
                    patch.object(capture.ck,'restore',side_effect=capture.ck.CheckpointError('unit actual audit failed')) as restore, \
                    patch.object(capture,'perform_capture') as operator:
                with self.assertRaisesRegex(capture.ck.CheckpointError,'actual audit failed'):
                    capture.stage(repo,'3'*40,'1'*64,destination)
                restore.assert_called_once_with(repo,'unit-run',dest=destination,helper_source=repo/'scripts')
                claim.assert_called_once();operator.assert_not_called()
                self.assertFalse((destination/'out/dispatch/github-capture-activation.json').exists())

    def test_foreign_or_dirty_helper_source_refuses_before_claim(self):
        for head,dirty in [('b'*40,False),('a'*40,True)]:
            def git(*args,**kwargs):
                if args[1:3]==('rev-parse','HEAD'):
                    return subprocess.CompletedProcess([],0,head.encode(),b'')
                return subprocess.CompletedProcess([],int(dirty),b'',b'')
            with self.subTest(head=head,dirty=dirty), \
                    patch.object(capture,'request_at',return_value=(self.request(),'1'*64)), \
                    patch.object(capture,'context_problems',return_value=[]), \
                    patch.object(capture.ck,'git',side_effect=git), \
                    patch.object(capture,'claim_once') as claim,patch.object(capture.ck,'restore') as restore:
                with self.assertRaisesRegex(ValueError,'helper source'):
                    capture.stage(Path('/unit'),'a'*40,'1'*64,Path('/new'))
                claim.assert_not_called();restore.assert_not_called()

    def test_unpinned_request_rejected(self):
        with self.assertRaisesRegex(ValueError,'immutable commit'):
            capture.request_at('/unit','main')

    def test_identity_probe_imports_checkout_scripts_in_actual_subprocess(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve();scripts=repo/'scripts';scripts.mkdir()
            (scripts/'run_with_env.sh').write_text('#!/bin/sh\nexec "$@"\n')
            (scripts/'capture_reservation.py').write_text(
                'def input_identity(path,note):\n    return path.name+":"+note\n')
            self.assertEqual(capture.current_identity(repo,repo/'state.json','unit-operation'),
                             'state.json:unit-operation')

    def test_prologue_failure_is_retained_without_render_or_recharge(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve();(repo/'out/dispatch').mkdir(parents=True)
            active=repo/'activation.json';active.write_text(json.dumps({'request_oid':'a'*40,'request_sha256':'b'*64}))
            request={**self.request(),'owner_sha256':'c'*64,'epoch':'d'*32}
            def failure(root,state,request,phase):
                phase('native-headroom');raise ValueError('Unit measured storage refusal')
            with patch.dict(capture.os.environ,{'DISPATCH_GITHUB_CAPTURE_REQUEST':str(active),'GITHUB_RUN_ID':'123'}), \
                    patch.object(capture,'request_at',return_value=(request,'b'*64)), \
                    patch.object(capture,'require_delegate',return_value={'status':'held'}), \
                    patch.object(capture,'perform_capture',side_effect=failure), \
                    patch.object(capture.ck,'save_with_recovery',return_value={'commit':'e'*40}) as saved:
                result=capture.run(repo)
            self.assertEqual(result['phase'],'native-headroom')
            self.assertFalse(result['capture_started'])
            self.assertEqual(result['error']['message'],'Unit measured storage refusal')
            self.assertEqual(result['checkpoint_oid'],'e'*40)
            self.assertFalse(result['approval']);saved.assert_called_once()
            self.assertTrue((repo/result['lifecycle_evidence']['path']).is_file())

    def test_fenced_owner_retains_artifact_without_checkpoint_write(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve();active=repo/'activation.json'
            active.write_text(json.dumps({'request_oid':'a'*40,'request_sha256':'b'*64}))
            request={**self.request(),'owner_sha256':'c'*64,'epoch':'d'*32}
            with patch.dict(capture.os.environ,{'DISPATCH_GITHUB_CAPTURE_REQUEST':str(active)}), \
                    patch.object(capture,'request_at',return_value=(request,'b'*64)), \
                    patch.object(capture,'require_delegate',side_effect=ValueError('Unit owner fenced')), \
                    patch.object(capture,'perform_capture') as render, \
                    patch.object(capture.ck,'save_with_recovery') as saved:
                result=capture.run(repo)
            self.assertFalse(result['owner_verified']);render.assert_not_called();saved.assert_not_called()
            self.assertEqual(result['error']['message'],'Unit owner fenced')
            self.assertTrue((repo/'out/github-capture-public-result.json').is_file())

    def test_checkpoint_failure_does_not_report_transport_success(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve();active=repo/'activation.json'
            active.write_text(json.dumps({'request_oid':'a'*40,'request_sha256':'b'*64}))
            request={**self.request(),'owner_sha256':'c'*64,'epoch':'d'*32}
            with patch.dict(capture.os.environ,{'DISPATCH_GITHUB_CAPTURE_REQUEST':str(active)}), \
                    patch.object(capture,'request_at',return_value=(request,'b'*64)), \
                    patch.object(capture,'require_delegate',return_value={'status':'held'}), \
                    patch.object(capture,'perform_capture',return_value=0), \
                    patch.object(capture.ck,'save_with_recovery',side_effect=capture.ck.CheckpointError('Unit push failed')):
                result=capture.run(repo)
            self.assertEqual(result['capture_exit_code'],0)
            self.assertNotEqual(result['exit_code'],0)
            self.assertEqual(result['checkpoint_error']['message'],'Unit push failed')

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
