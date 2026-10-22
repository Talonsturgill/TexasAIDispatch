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

    def test_both_installers_rewrite_actual_mirror_file_and_keep_signed_sources(self):
        import shlex
        import sys
        import yaml
        workflow=yaml.safe_load((Path(__file__).resolve().parents[1]/'.github/workflows/guards.yml').read_text())
        sources=('Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\n'
                 'Suites: noble noble-updates noble-backports noble-security\n'
                 'Components: main restricted universe multiverse\n'
                 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n')
        mirrors=('http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\n'
                 'https://archive.ubuntu.com/ubuntu/\tpriority:2\n'
                 'https://security.ubuntu.com/ubuntu/\tpriority:3\n')
        expected=mirrors.replace('http://azure.archive.ubuntu.com/ubuntu/',
                                 'https://archive.ubuntu.com/ubuntu/')
        for job in ('capture','guards'):
            commands=[line.strip() for step in workflow['jobs'][job]['steps']
                      for line in step.get('run','').splitlines() if 'sudo find /etc/apt ' in line]
            self.assertEqual(len(commands),1)
            with self.subTest(job=job), tempfile.TemporaryDirectory() as temporary:
                root=Path(temporary);(root/'sources.list.d').mkdir()
                source=root/'sources.list.d/ubuntu.sources';source.write_text(sources)
                mirror=root/'apt-mirrors.txt';mirror.write_text(mirrors)
                secondary=root/'apt-mirrors-security.txt';secondary.write_text(mirrors)
                unrelated=root/'notes.txt';unrelated.write_text(mirrors)
                command=commands[0].removeprefix('sudo ').replace('/etc/apt',shlex.quote(str(root)))
                if sys.platform=='darwin':
                    # BSD sed spells the same no-backup in-place operation with an empty argument.
                    command=command.replace('sed -i ',"sed -i '' ")
                subprocess.run(['bash','-c',command],check=True)
                self.assertEqual(source.read_text(),sources)
                self.assertEqual(mirror.read_text(),expected)
                self.assertEqual(secondary.read_text(),expected)
                self.assertEqual(unrelated.read_text(),mirrors)

    def test_only_fixed_compute_operations(self):
        for operation in ['publish', 'shell', 'send', 'cinema; anything']:
            row = self.request(); row['operation'] = operation
            self.assertTrue(capture.context_problems(row, self.environment()))
        self.assertEqual(set(capture.OPS), {'openings','preflight','cinema','full','phone-motion',
                                         'phone-motion-a','phone-motion-b','full-motion','preship'})

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
        for operation in ('openings','phone-motion','phone-motion-a','phone-motion-b','full-motion'):
            note,resource,argv = capture.OPS[operation]
            command='bash scripts/run_with_env.sh '+shlex.join(argv)
            self.assertEqual(operation_for([command],Path('/unit')),note)
            self.assertEqual(resource,'preflight_renders')
        self.assertEqual(capture.OPS['phone-motion'][0],PHONE_OPERATIONS['current'])
        self.assertEqual(capture.OPS['phone-motion-a'][0],PHONE_OPERATIONS['a'])
        self.assertEqual(capture.OPS['phone-motion-b'][0],PHONE_OPERATIONS['b'])

    def test_opening_precheck_requires_empty_output_and_owned_provisional_board(self):
        import run_controller
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve(); package=repo/'out/dispatch';package.mkdir(parents=True)
            (package/'run_state.json').write_text(json.dumps(
                {'schema':run_controller.SCHEMA,'run_id':'2026-10-21','limits':run_controller.limits()}))
            boards=[{'date':'2026-10-21','run_id':'2026-10-21','option':key} for key in ('a','b')]
            for key,board in zip(('a','b'),boards):
                (package/('opening-'+key+'.json')).write_text(json.dumps(board))
            (package/'storyboard.json').write_text(json.dumps(boards[0]))
            capture.operation_precheck(repo,'openings',{})
            (package/'storyboard.json').write_text(json.dumps({'date':'2026-10-21','option':'changed'}))
            with self.assertRaisesRegex(ValueError,'provisional board'):
                capture.operation_precheck(repo,'openings',{})
            (package/'storyboard.json').write_text(json.dumps(boards[0]))
            previous=package/'openings';previous.mkdir();(previous/'comparison.json').write_text('{}')
            with self.assertRaisesRegex(ValueError,'already exists'):
                capture.operation_precheck(repo,'openings',{})

    def test_option_motion_precheck_uses_exact_option_and_keeps_retained_output(self):
        import claude_motion_review
        for option in ('a','b'):
            with self.subTest(option=option), tempfile.TemporaryDirectory() as temporary:
                repo=Path(temporary).resolve(); package=repo/'out/dispatch/openings';package.mkdir(parents=True)
                operation='phone-motion-'+option
                with patch.object(claude_motion_review,'phone_inputs') as inputs:
                    capture.operation_precheck(repo,operation,{})
                    inputs.assert_called_once_with(repo/'out/dispatch/run_state.json',option,
                                                   package/(option+'.json'),package/(option+'.mp4'))
                with patch.object(claude_motion_review,'phone_inputs',side_effect=ValueError('stale exact option')):
                    with self.assertRaisesRegex(ValueError,'stale exact option'):
                        capture.operation_precheck(repo,operation,{})
                (package/('phone-motion-'+option)).mkdir()
                with patch.object(claude_motion_review,'phone_inputs') as inputs:
                    with self.assertRaisesRegex(ValueError,'already exists'):
                        capture.operation_precheck(repo,operation,{})
                    inputs.assert_not_called()

    def test_new_operations_require_their_own_unused_exact_charge(self):
        for operation in ('openings','phone-motion-a','phone-motion-b'):
            with self.subTest(operation=operation):
                note,resource,_=capture.OPS[operation]
                event={'kind':'reserved','note':note,'resources':{resource:1}}
                hashed=capture_guard.event_digest(event);state={'events':[event]}
                self.assertEqual(capture.prepaid(state,operation,hashed),event)
                with self.assertRaises(ValueError):
                    capture.prepaid(state,'phone-motion',hashed)
                state['events'].append({'kind':'prepared_capture_claimed','event_sha256':hashed})
                with self.assertRaisesRegex(ValueError,'unused prepaid'):
                    capture.prepaid(state,operation,hashed)

    def test_new_operators_bind_exact_boards_and_consume_before_execution(self):
        import capture_reservation
        for operation in ('openings','phone-motion-a','phone-motion-b'):
            with self.subTest(operation=operation), tempfile.TemporaryDirectory() as temporary:
                repo=Path(temporary).resolve(); package=repo/'out/dispatch';package.mkdir(parents=True)
                state_path=package/'run_state.json'
                state_path.write_text(json.dumps({'run_id':'2026-10-21'}))
                note,resource,argv=capture.OPS[operation]
                expected=([package/('opening-'+key+'.json') for key in ('a','b')]
                          if operation=='openings' else [package/'openings'/(operation[-1]+'.json')])
                auth={'render_reservation':{'event_sha256':'a'*64}}
                consumed=[]
                def execute(command,**kwargs):
                    if command[3]=='scripts/native_headroom.py':
                        self.assertEqual(command[command.index('--board')+1],str(expected[0].relative_to(repo)))
                    else:
                        self.assertEqual(command,['bash','scripts/run_with_env.sh',*argv])
                        self.assertEqual(consumed,[True])
                    return subprocess.CompletedProcess(command,0)
                with patch.object(capture,'prepaid',return_value={'preflight_identity':'unit-input'}), \
                        patch.object(capture,'operation_precheck'), \
                        patch.object(capture_guard,'authorize',return_value=auth) as authorize, \
                        patch.object(capture_guard,'atomic_json'), \
                        patch.object(capture_guard,'capture_problems',return_value=[]), \
                        patch.object(capture_guard,'consume',side_effect=lambda *a:consumed.append(True) or True), \
                        patch.object(capture_reservation,'input_identity',return_value='unit-input'), \
                        patch.object(capture.subprocess,'run',side_effect=execute):
                    self.assertEqual(capture.perform_capture(repo,state_path,
                        {'operation':operation,'reservation_event_sha256':'a'*64},lambda _:None),0)
                    self.assertEqual(authorize.call_args.args[2],expected)
                    self.assertEqual(authorize.call_args.kwargs,{'resource':resource,'housekeeping':True})

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
                claim.assert_not_called();operator.assert_not_called()
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

    def test_failed_preship_import_preserves_bytes_charges_and_invalidates_old_pass(self):
        import publication_owner
        import preship_compute
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
            stale=repo/'out/gates/preship.json';stale.parent.mkdir();stale.write_text('old PASS')
            owner = {'owner_sha256':'a'*64,'epoch':'b'*32}
            result = {'owner_sha256':owner['owner_sha256'],'epoch':owner['epoch'],
                      'request_oid':'c'*40,'request_sha256':'d'*64,'source_commit':'e'*40,
                      'operation':'preship','exit_code':1}
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
                        'run_id':state['run_id'],'checkpoint_oid':oid,'operation':'preship'},'d'*64)), \
                    patch.object(preship_compute,'import_verdict') as install:
                imported=capture.import_result(repo,oid)
                install.assert_not_called()
            self.assertEqual(imported['changed_files'],2)
            self.assertEqual((package/'same.txt').stat().st_mtime_ns,unchanged_time)
            self.assertEqual((package/'changed.txt').read_bytes(),b'new captured bytes')
            self.assertTrue(list((package/'github-capture-import-baseline').glob('*')))
            self.assertFalse(stale.exists())
            self.assertEqual(json.loads((package/'run_state.json').read_text())['usage'],state['usage'])
            self.assertEqual(json.loads((package/'github-capture-result.json').read_text())['exit_code'],1)
            self.assertEqual(json.loads((repo/capture.ck.GRANT_ROOTS_FILE).read_text()),{'schema':1,'entries':origins})


class UnstartedContinuationTest(unittest.TestCase):
    def setUp(self):
        self.original_oid='b'*40
        self.hashed='c'*64
        event={'kind':'reserved','resources':{'preflight_renders':1},
               'note':capture.OPS['openings'][0],'preflight_identity':'actual-native-input'}
        self.state={'run_id':'2026-10-21','mode':'production','events':[event],
                    'usage':{'preflight_renders':1},'terminal_state':None}
        self.original={'schema':capture.SCHEMA,'repository':capture.REPOSITORY,
            'run_id':'2026-10-21','source_commit':'a'*40,'checkpoint_oid':'d'*40,
            'ledger_sha256':capture.digest(json.dumps(self.state).encode()),'owner_sha256':'f'*64,'epoch':'1'*32,
            'github_actor':'actual-unit-caller','operation':'openings',
            'reservation_event_sha256':capture_guard.event_digest(event)}
        self.current={**self.original,'source_commit':'2'*40,'checkpoint_oid':'3'*40}
        self.claim={'request_oid':self.original_oid,'request_sha256':self.hashed,
                    'github_actor':'actual-unit-caller','github_run_id':'39801377869'}
        self.run={'id':39801377869,'run_attempt':1,'status':'completed','conclusion':'failure',
                  'event':'workflow_dispatch','head_sha':'a'*40,'path':'.github/workflows/guards.yml',
                  'actor':{'login':'actual-unit-caller'},'triggering_actor':{'login':'actual-unit-caller'}}
        self.job={'id':119902689891,'run_id':39801377869,'run_attempt':1,'head_sha':'a'*40,
                  'name':'capture','status':'completed','conclusion':'failure','steps':[
            {'name':name,'number':number,'status':'completed','conclusion':conclusion}
            for number,name,conclusion in [(7,capture.STAGE_STEP,'failure'),
                (8,capture.INSTALL_STEP,'skipped'),(9,capture.EXECUTE_STEP,'skipped')]]}
        self.jobs={'total_count':2,'jobs':[self.job,{'name':'guards','conclusion':'skipped'}]}
        self.log=b'2026-10-22T15:12:06Z delegated GitHub capture refused: restored edition fails its audit: actual retained source mismatch\n'

    def proof(self):
        def git(repo,*args,**kwargs):
            return subprocess.CompletedProcess(args,0,b'4444444444444444444444444444444444444444 refs/heads/unit\n'
                if args[0]=='ls-remote' else b'',b'')
        def api(endpoint,raw=False):
            if endpoint.endswith('/logs'):return self.log
            return self.jobs if '/jobs?' in endpoint else self.run
        def show(repo,oid,path):
            if path=='claim.json':return json.dumps(self.claim).encode()
            if path.endswith('/run_state.json'):return json.dumps(self.state).encode()
            if path.endswith('/manifest.json'):
                return json.dumps({'schema':capture.ck.SCHEMA,'run_id':self.original['run_id'],
                    'ledger_sha256':self.original['ledger_sha256']}).encode()
            return b'actual pinned workflow'
        with patch.object(capture,'request_at',return_value=(self.original,self.hashed)), \
                patch.object(capture.ck,'git',side_effect=git), \
                patch.object(capture.ck,'show',side_effect=show), \
                patch.object(capture,'github_api',side_effect=api):
            return capture.unstarted_proof(Path('/unit'),self.original_oid,self.current)

    def test_completed_stage_failure_keeps_actual_api_log_and_original_charge(self):
        original=copy.deepcopy(self.original);state=copy.deepcopy(self.state)
        result=self.proof()
        self.assertEqual(result['original_claim_commit'],'4'*40)
        self.assertEqual(result['original_request_sha256'],self.hashed)
        self.assertEqual(result['job'],self.job)
        self.assertEqual(result['job_log_sha256'],capture.digest(self.log))
        self.assertEqual(result['restore_refusal'],self.log.decode().splitlines())
        self.assertEqual(self.original,original);self.assertEqual(self.state,state)
        self.assertNotEqual(self.current['source_commit'],self.original['source_commit'])
        self.assertNotEqual(self.current['checkpoint_oid'],self.original['checkpoint_oid'])

    def test_started_rerun_wrong_actor_or_other_run_refuses(self):
        for key,value in [('run_attempt',2),('status','in_progress'),('conclusion','success'),
                          ('event','push'),('head_sha','5'*40),('id',123),('path','another.yml'),
                          ('actor',{'login':'other'}),('triggering_actor',{'login':'other'})]:
            with self.subTest(key=key):
                original=self.run[key];self.run[key]=value
                with self.assertRaises(ValueError):self.proof()
                self.run[key]=original

    def test_any_executed_installer_operator_or_fenced_run_refuses(self):
        for index in (1,2):
            for conclusion in ('success','failure','cancelled',None):
                with self.subTest(step=index,conclusion=conclusion):
                    self.job['steps'][index]['conclusion']=conclusion
                    with self.assertRaises(ValueError):self.proof()
            self.job['steps'][index]['conclusion']='skipped'
        self.job['steps'][0]['conclusion']='skipped'
        with self.assertRaises(ValueError):self.proof()
        self.job['steps'][0]['conclusion']='failure'
        self.log=b'delegated GitHub capture refused: original owner was fenced\n'
        with self.assertRaisesRegex(ValueError,'restore-audit failure'):self.proof()

    def test_missing_ambiguous_or_foreign_job_evidence_refuses(self):
        baseline=copy.deepcopy(self.jobs)
        mutations=[lambda:self.jobs.update(total_count=3),
            lambda:self.jobs['jobs'].append(copy.deepcopy(self.job)),
            lambda:self.job.update(head_sha='9'*40),
            lambda:self.job.update(run_attempt=2),
            lambda:self.job.update(status='in_progress'),
            lambda:self.job['steps'].pop(),
            lambda:self.job['steps'][2].update(number=1),
            lambda:self.jobs['jobs'][1].update(conclusion='success')]
        for mutate in mutations:
            self.jobs=copy.deepcopy(baseline);self.job=self.jobs['jobs'][0]
            mutate()
            with self.assertRaises(ValueError):self.proof()

    def test_changed_owner_charge_ledger_or_chained_continuation_refuses(self):
        for key in ('owner_sha256','epoch','run_id','github_actor','operation',
                    'reservation_event_sha256','ledger_sha256'):
            with self.subTest(key=key):
                before=self.current[key];self.current[key]='changed'
                with self.assertRaisesRegex(ValueError,'original owner, charge or ledger'):self.proof()
                self.current[key]=before
        self.original['unstarted_continuation']={'schema':capture.CONTINUATION}
        with self.assertRaisesRegex(ValueError,'itself be continued'):self.proof()

    def test_claim_must_bind_exact_original_request_and_used_charge_stays_refused(self):
        for key in ('request_oid','request_sha256','github_actor','github_run_id'):
            before=self.claim[key];self.claim[key]='changed'
            with self.assertRaises(ValueError):self.proof()
            self.claim[key]=before
        self.state['events'].append({'kind':'prepared_capture_claimed',
            'event_sha256':self.original['reservation_event_sha256']})
        self.original['ledger_sha256']=self.current['ledger_sha256']=capture.digest(json.dumps(self.state).encode())
        with self.assertRaisesRegex(ValueError,'unused prepaid'):self.proof()

    def test_delegate_rechecks_proof_and_one_immutable_continuation_request(self):
        proof=self.proof();request={**self.current,'unstarted_continuation':proof}
        with patch.object(capture,'unstarted_proof',return_value=proof) as verify, \
                patch.object(capture.ck,'git',return_value=subprocess.CompletedProcess([],0,
                    ('6'*40+' ref\n').encode(),b'')) as git:
            capture.verify_continuation('/unit',request,'6'*40)
            verify.assert_called_once_with('/unit',self.original_oid,request)
            self.assertIn(capture.continuation_request_ref(request),git.call_args.args)
            with self.assertRaisesRegex(ValueError,'one immutable continuation'):
                capture.verify_continuation('/unit',request,'7'*40)
            verify.return_value={**proof,'original_claim_commit':'7'*40}
            with self.assertRaisesRegex(ValueError,'proof changed'):
                capture.verify_continuation('/unit',request,'6'*40)

    def test_real_git_one_continuation_request_and_claim_keep_original_claim(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);remote=root/'remote.git';repo=root/'repo'
            subprocess.run(['git','init','--bare','-q',str(remote)],check=True)
            subprocess.run(['git','init','-q',str(repo)],check=True)
            subprocess.run(['git','-C',str(repo),'remote','add','origin',str(remote)],check=True)
            old=capture.commit_record(repo,'claim.json',self.claim,'Original failed setup claim')
            original_ref=capture.claim_ref(self.original);capture.claim_once(repo,original_ref,old)
            request={**self.current,'unstarted_continuation':{'schema':capture.CONTINUATION}}
            request_oid=capture.commit_record(repo,capture.REQUEST_FILE,request,'One setup continuation')
            request_ref=capture.continuation_request_ref(request)
            capture.claim_once(repo,request_ref,request_oid)
            with self.assertRaisesRegex(ValueError,'already claimed'):
                capture.claim_once(repo,request_ref,request_oid)
            new=capture.commit_record(repo,'claim.json',{'request_oid':request_oid},'Continuation claim')
            continued_ref=capture.claim_ref(request)
            self.assertFalse(continued_ref.startswith(original_ref+'/'))
            capture.claim_once(repo,continued_ref,new)
            with self.assertRaisesRegex(ValueError,'already claimed'):
                capture.claim_once(repo,continued_ref,new)
            self.assertEqual(subprocess.check_output(['git','--git-dir',str(remote),
                'rev-parse',original_ref],text=True).strip(),old)

    def test_stage_restores_and_admits_before_claim_and_refuses_changed_or_fenced(self):
        import publication_owner
        with tempfile.TemporaryDirectory() as temporary:
            repo=Path(temporary).resolve()/'source';repo.mkdir();destination=Path(temporary).resolve()/'episode'
            state_path=destination/'out/dispatch/run_state.json';state_path.parent.mkdir(parents=True)
            original_root=Path('/actual-original-host/episode')
            original_state={**self.state,'board':str(original_root/'out/dispatch/storyboard.json')}
            public=capture.ck.public_ledger(original_state,original_root)
            raw=json.dumps(public).encode()
            manifest={'ledger_sha256':self.current['ledger_sha256'],
                      'repo_root':str(original_root),'grant_origin_roots':[]}
            restored=capture.ck.restored_ledger(public,destination,manifest)
            state_path.write_text(json.dumps(restored))
            self.assertEqual(restored['board'],str(state_path.parent/'storyboard.json'))
            self.assertNotEqual(capture.ck.public_ledger(restored,destination),public)
            owner={key:self.current[key] for key in ('run_id','owner_sha256','epoch')}
            owner.update(runtime='codex',status='held',expires_at='2099-01-01T00:00:00+00:00')
            order=[]
            def git(root,*args,**kwargs):
                return subprocess.CompletedProcess(args,0,self.current['source_commit'].encode()
                    if args[:2]==('rev-parse','HEAD') else b'',b'')
            for identity,fenced in [('changed',False),('actual-native-input',True),('actual-native-input',False)]:
                order.clear()
                with self.subTest(identity=identity,fenced=fenced), \
                        patch.object(capture,'request_at',return_value=(self.current,self.hashed)), \
                        patch.object(capture,'context_problems',return_value=[]), \
                        patch.object(capture.ck,'git',side_effect=git), \
                        patch.object(capture.ck,'remote_tip',return_value=self.current['checkpoint_oid']), \
                        patch.object(capture.ck,'verify_checkpoint',return_value=(manifest,raw)), \
                        patch.object(capture.ck,'restore',side_effect=lambda *a,**kw:order.append('restore')), \
                        patch.object(capture,'current_identity',return_value=identity), \
                        patch.object(capture,'operation_precheck',side_effect=lambda *a:order.append('precheck')), \
                        patch.object(publication_owner,'read_remote',side_effect=[owner,None if fenced else owner]), \
                        patch.object(capture,'commit_record',return_value='8'*40), \
                        patch.object(capture,'claim_once',side_effect=lambda *a:order.append('claim')) as claim, \
                        patch.dict(capture.os.environ,{'GITHUB_RUN_ID':'123','GITHUB_ACTOR':'actual-unit-caller'}):
                    if identity=='changed' or fenced:
                        with self.assertRaises(ValueError):capture.stage(repo,'9'*40,self.hashed,destination)
                        claim.assert_not_called()
                    else:
                        capture.stage(repo,'9'*40,self.hashed,destination)
                        self.assertEqual(order,['restore','precheck','claim'])


if __name__ == '__main__':
    unittest.main()
