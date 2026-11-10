"""Cancellation preserves history, recovery and live-owner fencing."""
import copy
from datetime import timedelta
import json
import subprocess
import unittest
from unittest.mock import patch
import cancelled_editions as cancel
import failed_editions as failed
import failed_editions_test
import publication_owner as owner

class CancellationTests(unittest.TestCase):
    def setUp(self):
        self.f = failed_editions_test.FailedEditionTests('runTest')
        self.f.setUp(); self.addCleanup(self.f.doCleanups)
        self.request = self.f.repo / 'cancel.json'
        self.request.write_text(json.dumps({'action': 'cancel-edition', 'run_id': self.f.run,
            'instruction': 'Cancel this edition and start a newer date.'}))
        self.archive = []
        self.canonical = self.f.commit
        def git(repo, *args, **kwargs):
            if args[0] == 'ls-remote':
                rows = (self.archive if args[-1].startswith(cancel.ARCHIVE)
                        else [self.canonical, args[-1]])
                return subprocess.CompletedProcess(args, 0, ('\t'.join(rows) + '\n').encode() if rows else b'', b'')
            if args[0] == 'push':
                self.assertIn('--force-with-lease=' + cancel.ARCHIVE + self.f.run + ':', args)
                self.assertFalse(self.archive)
                self.archive[:] = [self.f.commit, cancel.ARCHIVE + self.f.run]
                return subprocess.CompletedProcess(args, 0, b'', b'')
            raise AssertionError(str(args))
        self.git_patch = patch('claude_checkpoint.git', side_effect=git)
        self.git = self.git_patch.start(); self.addCleanup(self.git_patch.stop)
        def append(repo, proposed, parent):
            self.assertEqual(parent, self.f.record['commit'])
            self.f.record = {**copy.deepcopy(proposed), 'commit': 'e' * 40}
            return self.f.record
        self.append_patch = patch('publication_owner.append', side_effect=append)
        self.append = self.append_patch.start(); self.addCleanup(self.append_patch.stop)
    def run_cancel(self, **kwargs):
        return cancel.cancel(self.f.repo, self.f.run, self.request, self.f.repo / 'workspace',
                             moment=self.f.moment, confirmed=True, **kwargs)
    def test_cancel_preserves_and_verifies_history(self):
        before = copy.deepcopy(self.f.state)
        result = self.run_cancel(); proof = result['proof']
        self.assertEqual(result['status'], 'owner_cancelled'); self.assertFalse(result['shipped'])
        self.assertEqual(self.archive, [self.f.commit, cancel.ARCHIVE + self.f.run])
        self.assertEqual(before, self.f.state)
        self.assertEqual(proof['original_state']['usage'], before['usage'])
        self.assertFalse(proof['shipment_authorized'])
        self.assertEqual(failed.verified(self.f.repo, self.f.run), proof)
        self.assertTrue(failed.matches_state(proof, self.f.state))
        changed = copy.deepcopy(before); changed['usage']['storyboard_critics'] += 1
        self.assertFalse(failed.matches_state(proof, changed))
        self.assertNotIn('Cancel this edition', json.dumps(proof))
    def test_requires_explicit_confirmation_and_exact_run(self):
        with self.assertRaisesRegex(ValueError, 'confirmation'):
            cancel.cancel(self.f.repo, self.f.run, self.request, self.f.repo / 'workspace', moment=self.f.moment)
        self.request.write_text(json.dumps({'action': 'cancel-edition', 'run_id': '2026-10-01', 'instruction': 'Cancel.'}))
        with self.assertRaisesRegex(ValueError, 'exact edition'): self.run_cancel()
        self.append.assert_not_called()
    def test_live_owner_protected(self):
        self.f.record['expires_at'] = owner.stamp(self.f.moment + timedelta(hours=1))
        with self.assertRaisesRegex(ValueError, 'expired lease'): self.run_cancel()
        self.append.assert_not_called()
    def test_dry_run_and_retry_after_handoff(self):
        self.assertFalse(self.run_cancel(prove_only=True)['changed'])
        self.append.assert_not_called()
        self.run_cancel(); self.append.reset_mock()
        self.f.record['run_id'] = '2026-10-25'
        self.f.record['expires_at'] = owner.stamp(self.f.moment + timedelta(hours=1))
        self.assertFalse(self.run_cancel()['changed']); self.append.assert_not_called()
    def test_archive_collision_loss_and_checkpoint_drift_fail_closed(self):
        self.archive[:] = ['f' * 40, cancel.ARCHIVE + self.f.run]
        with self.assertRaisesRegex(ValueError, 'existing cancellation archive'): self.run_cancel()
        self.append.assert_not_called()
        self.archive.clear(); self.run_cancel()
        with self.assertRaisesRegex(ValueError, 'checkpoint changed'):
            failed.verified(self.f.repo, self.f.run, checkpoint_commit='f' * 40)
        self.archive.clear()
        with self.assertRaisesRegex(ValueError, 'recoverable archive'): failed.verified(self.f.repo, self.f.run)
    def test_racing_checkpoint_prevents_disposition(self):
        self.canonical = 'f' * 40
        with self.assertRaisesRegex(ValueError, 'checkpoint advanced'): self.run_cancel()
        self.append.assert_not_called()
    def test_post_append_drift_reports_uncertain_applied_disposition(self):
        append = self.append.side_effect
        def raced(repo, proposed, parent):
            result = append(repo, proposed, parent)
            self.canonical = 'f' * 40
            return result
        self.append.side_effect = raced
        with self.assertRaisesRegex(ValueError, 'checkpoint advanced'):
            self.run_cancel()
        self.assertIn(self.f.run, self.f.record[failed.FIELD])
        self.assertTrue(self.archive)

    def test_racing_owner_preserves_archive_without_success(self):
        self.append.side_effect = ValueError('non-fast-forward')
        before = copy.deepcopy(self.f.record)
        with self.assertRaisesRegex(ValueError, 'non-fast-forward'): self.run_cancel()
        self.assertEqual(before, self.f.record); self.assertTrue(self.archive)
    def test_same_date_blocked_and_later_current_date_acquires(self):
        self.run_cancel()
        with self.assertRaisesRegex(ValueError, 'no same-date restart'):
            failed.assert_not_retained(self.f.repo, self.f.run)
        with patch('publication_owner.completed_proof', return_value=None):
            result = owner.acquire(self.f.repo, '2026-10-25', self.f.repo / 'next-workspace',
                                   session='next-session', moment=self.f.moment)
        self.assertEqual(result['status'], 'owned'); self.assertFalse(result['review_approval'])
        self.assertEqual(self.f.record[failed.FIELD][self.f.run]['schema'], cancel.SCHEMA)

if __name__ == '__main__': unittest.main()
