"""Unused recovery fixtures never authorize production or weaken its capture boundary."""
import copy
import json
from pathlib import Path
import subprocess
import unittest
from unittest import mock

import capture_guard as guard
import capture_reservation as prepared
import claude_checkpoint as checkpoint
import operation_storage as storage
import operation_storage_test
import refresh_capture_authorization as refresh
import run_controller as controller


class UnusedCapture(unittest.TestCase):
    def setUp(self):
        self.fixture = operation_storage_test.OperationCosts(methodName='runTest'); self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root, self.state, self.board = self.fixture.root, self.fixture.state, self.fixture.board
        self.command = self.fixture.commands[0]
        self.state.unlink(); controller.initialise(self.state, '2026-08-01-unused-fixture', 'rehearsal')
        self.receipt = self.board.with_name('original-housekeeping.json'); self.receipt.write_text('{"exit_code":0}')
        self.housekeeping = {'receipt': str(self.receipt), 'receipt_sha256': guard.sha(self.receipt), 'exit_code': 0}
        self.remote_patch = mock.patch.object(refresh, 'remote_identity')
        self.remote_patch.start(); self.addCleanup(self.remote_patch.stop)
        self.objects = 4275552256
        self.free = int(15.84 * storage.GIB)
        self.patches = [mock.patch.object(controller, 'REPO', self.root),
            mock.patch('authored_story_art.problems', return_value=[]),
            mock.patch.object(prepared, 'animatic_precheck'),
            mock.patch.object(guard, 'housekeeping_run', return_value=self.housekeeping),
            mock.patch.object(guard.shutil, 'disk_usage', side_effect=lambda root: mock.Mock(free=self.free))]
        for item in self.patches:
            item.start(); self.addCleanup(item.stop)

    def authorize(self):
        return guard.authorize(self.root, self.state, [self.board], [self.command], prepare=True)

    def saved(self):
        return {str(p): p.read_bytes() for p in (self.state, self.root/guard.AUTHORIZATION, self.root/guard.USED)}

    def write_auth(self, value):
        (self.root/guard.AUTHORIZATION).write_text(json.dumps(value))

    def test_same_charge_storage_bucket_refresh_renewal_and_one_claim(self):
        auth = self.authorize(); auth['expires_at'] = '2020-01-01T00:00:00+00:00'; self.write_auth(auth)
        before = self.saved(); old = copy.deepcopy(auth['headroom']['storage_profile'])
        changed = {**old, 'git_object_allowance_bytes': 5*storage.GIB, 'required_free_gib': old['required_free_gib'] + 1}
        with mock.patch('bounded_capture.plan', return_value=changed):
            self.assertTrue(guard.capture_problems(self.command, auth, self.root, self.root))
            result = refresh.refresh(self.root, self.state)
            self.assertEqual([], guard.capture_problems(self.command, result, self.root, self.root))
        self.assertEqual(before[str(self.state)], self.state.read_bytes())
        self.assertEqual(before[str(self.root/guard.USED)], (self.root/guard.USED).read_bytes())
        self.assertEqual(auth['prepared_capture'], result['prepared_capture'])
        self.assertEqual(auth['commands'], result['commands'])
        self.assertEqual(auth['issued_at'], result['issued_at'])
        self.assertGreater(result['expires_at'], auth['expires_at'])
        history = self.root/guard.HISTORY/(result['revalidation']['previous_authorization_sha256']+'.json')
        self.assertEqual(before[str(self.root/guard.AUTHORIZATION)], history.read_bytes())
        with mock.patch('bounded_capture.plan', return_value=changed):
            self.assertIsNone(guard.decide({'tool_name':'Bash','cwd':str(self.root),'tool_input':{'command':self.command}},self.root))
        self.assertTrue(prepared.claim(self.state,'quarter-scale animatic')[0])
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'],1)
        self.assertFalse(prepared.claim(self.state,'quarter-scale animatic')[0])
        with self.assertRaises(ValueError):refresh.refresh(self.root,self.state)

    def test_identity_mutations_fail_without_auth_ledger_or_used_changes(self):
        original = self.authorize(); ledger = self.state.read_bytes(); used = (self.root/guard.USED).read_bytes()
        mutations = [lambda a:a['commands'][0].update(consumed='already'),
                     lambda a:a['commands'][0].update(id='wrong'),
                     lambda a:a['commands'][0].update(text=a['commands'][0]['text']+' --unknown true'),
                     lambda a:a['prepared_capture'].update(operation='different'),
                     lambda a:a['prepared_capture'].update(resource='full_renders'),
                     lambda a:a['prepared_capture'].update(run_id='foreign'),
                     lambda a:a['prepared_capture'].update(input_identity='changed'),
                     lambda a:a['render_reservation'].update(event_sha256='missing'),
                     lambda a:a['boards'][0].update(sha256='changed'),
                     lambda a:a['bound']['capture_storage'].update({'scripts/capture_guard.py':'changed'}),
                     lambda a:a.update(issued_at='changed')]
        for mutate in mutations:
            value=copy.deepcopy(original);mutate(value);self.write_auth(value);before=self.saved()
            with self.assertRaises((ValueError,KeyError)):refresh.refresh(self.root,self.state)
            self.assertEqual(before,self.saved())
        self.state.write_bytes(ledger);(self.root/guard.USED).write_bytes(used)

    def test_claimed_terminal_missing_issuance_and_low_capacity_fail(self):
        auth=self.authorize(); original=self.saved(); sha=auth['prepared_capture']['event_sha256']
        for kind in ('claimed','terminal','issuance','headroom','housekeeping'):
            for path,data in original.items():Path(path).write_bytes(data)
            state=json.loads(self.state.read_text())
            if kind=='claimed':state['events'].append({'kind':'prepared_capture_claimed','event_sha256':sha})
            if kind=='terminal':state['terminal_state']='shipped'
            if kind in ('claimed','terminal'):self.state.write_text(json.dumps(state))
            if kind=='issuance':(self.root/guard.USED).write_text('[]')
            if kind=='headroom':self.free=storage.GIB
            if kind=='housekeeping':self.receipt.write_text('changed')
            before=self.saved()
            with self.assertRaises(ValueError):refresh.refresh(self.root,self.state)
            self.assertEqual(before,self.saved());self.free=int(15.84*storage.GIB)

    def test_changed_publication_owner_or_epoch_fails(self):
        owner={'owner_sha256':'owner','epoch':'epoch'}
        with mock.patch('publication_owner.require_owner',return_value=owner):auth=self.authorize()
        for other in (None,{'owner_sha256':'foreign','epoch':'epoch'},{'owner_sha256':'owner','epoch':'next'}):
            before=self.saved()
            with mock.patch('publication_owner.require_owner',return_value=other),self.assertRaises(ValueError):
                refresh.refresh(self.root,self.state)
            self.assertEqual(before,self.saved())

    def test_storage_failure_after_atomic_write_restores_original_auth(self):
        self.authorize();before=self.saved();real=refresh.candidate;calls=0
        def fail(*args):
            nonlocal calls
            calls+=1
            if calls==3:raise ValueError('simulated final measurement failure')
            return real(*args)
        with mock.patch.object(refresh,'candidate',side_effect=fail),self.assertRaisesRegex(ValueError,'measurement'):
            refresh.refresh(self.root,self.state)
        self.assertEqual(before,self.saved())

    def git_fixture(self):
        self.remote_patch.stop()
        def git(*args):return subprocess.check_output(['git','-C',str(self.root),*args],stderr=subprocess.PIPE)
        git('init','-q');git('config','user.name','Talon Sturgill');git('config','user.email','Talon.sturgill@gmail.com')
        origin=self.root/'.git/fixture-origin.git';subprocess.run(['git','init','--bare','-q',str(origin)],check=True)
        git('remote','add','origin',str(origin));(self.root/'.gitignore').write_text('out/\n')
        git('add','.');git('commit','-qm','Unused capture recovery engineering fixture')
        (self.board.parent/'claude-host.json').write_text('{}')
        checkpoint.save(self.root,self.state,'engineering baseline',environ={})

    def test_real_remote_consumption_cannot_be_revived_from_stale_local_auth(self):
        self.git_fixture();self.authorize();unused=(self.root/guard.AUTHORIZATION).read_bytes()
        self.assertTrue(guard.consume(self.root,self.command))
        (self.root/guard.AUTHORIZATION).write_bytes(unused);before=self.saved()
        with self.assertRaisesRegex(ValueError,'consumed'):
            refresh.refresh(self.root,self.state)
        self.assertEqual(before,self.saved())

    def test_real_checkpoint_refresh_keeps_single_charge_and_remote_command(self):
        self.git_fixture();auth=self.authorize();checkpoint.mirror(self.state,'retain original unused fixture authorization');before=self.saved()
        result=refresh.refresh(self.root,self.state)
        self.assertEqual(before[str(self.state)],self.state.read_bytes())
        self.assertEqual(before[str(self.root/guard.USED)],(self.root/guard.USED).read_bytes())
        self.assertEqual([],guard.capture_problems(self.command,result,self.root,self.root))
        self.assertTrue(guard.consume(self.root,self.command));self.assertTrue(prepared.claim(self.state,'quarter-scale animatic')[0])
        self.assertEqual(controller.read_state(self.state)['usage']['preflight_renders'],1)

    def test_no_remote_anchor_or_same_charge_command_edit_cannot_mint_authority(self):
        self.git_fixture();auth=self.authorize();before=self.saved()
        with self.assertRaises((ValueError,checkpoint.CheckpointError)):
            refresh.refresh(self.root,self.state)
        self.assertEqual(before,self.saved())
        checkpoint.mirror(self.state,'retain original unused fixture authorization')
        edited=copy.deepcopy(auth);edited['commands'][0]['text']+=' --state out/dispatch/run_state.json'
        import hashlib
        edited['commands'][0]['id']=hashlib.sha256(edited['commands'][0]['text'].encode()).hexdigest()
        self.write_auth(edited);before=self.saved()
        with self.assertRaisesRegex(ValueError,'saved unused authorization identity'):
            refresh.refresh(self.root,self.state)
        self.assertEqual(before,self.saved())

    def test_saved_disabled_or_unknown_authority_cannot_be_reenabled_locally(self):
        self.git_fixture();auth=self.authorize()
        for field,value in (('allowed',False),('schema','unknown')):
            revoked=copy.deepcopy(auth);revoked[field]=value;self.write_auth(revoked)
            checkpoint.mirror(self.state,'retain disabled original fixture authority')
            self.write_auth(auth);before=self.saved()
            with self.assertRaisesRegex(ValueError,'saved unused authorization identity'):
                refresh.refresh(self.root,self.state)
            self.assertEqual(before,self.saved())

    def test_remote_uncertainty_leaves_local_authority_unchanged(self):
        self.authorize();before=self.saved()
        with mock.patch.object(checkpoint,'mirror',side_effect=checkpoint.UnbackedError('transport uncertain')):
            with self.assertRaisesRegex(checkpoint.UnbackedError,'uncertain'):refresh.refresh(self.root,self.state)
        self.assertEqual(before,self.saved())


if __name__=='__main__':unittest.main()
