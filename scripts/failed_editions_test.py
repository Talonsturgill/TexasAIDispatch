"""A retained failure never becomes shipment, another old budget, or a live-owner takeover."""
from contextlib import contextmanager
import copy
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import unittest
import five_round_fixture  # noqa: F401
from unittest.mock import patch

import claude_checkpoint as checkpoint
import checkpoint_discovery
import completion_yield
import completion_yield_test as yield_tests
import failed_editions as failed
import publication_owner as owner


class FailedEditionTests(unittest.TestCase):
    def setUp(self):
        self.fixture = yield_tests.ExhaustedRequiredReviewTests('test_original_overrun_is_retained_without_reset_or_native_panel_validation')
        self.fixture.setUp(); self.addCleanup(self.fixture.doCleanups)
        self.repo = self.fixture.repo; self.state = self.fixture.state
        self.run = self.state['run_id']; self.commit = 'a' * 40
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        files = [self.fixture.failure, self.fixture.claim, self.fixture.report]
        self.blobs = {p.relative_to(self.repo).as_posix(): p.read_bytes() for p in files}
        self.manifest = {'schema': checkpoint.SCHEMA, 'run_id': self.run, 'source_pin': 'b' * 40,
            'repo_root': str(self.repo), 'terminal_state': None, 'shipment_recorded': False,
            'ledger_sha256': hashlib.sha256(self.ledger).hexdigest(), 'files': [
                {'path': rel, 'sha256': hashlib.sha256(raw).hexdigest(), 'size': len(raw)}
                for rel, raw in self.blobs.items()]}
        self.moment = datetime(2026, 10, 25, 5, 0, tzinfo=timezone.utc)
        self.record = {'schema': owner.SCHEMA, 'run_id': self.run, 'owner_sha256': owner.identity('original'),
            'epoch': 'c' * 32, 'status': 'held', 'commit': 'd' * 40,
            'expires_at': owner.stamp(self.moment - timedelta(hours=1))}
        @contextmanager
        def snapshot(*args):
            yield self.commit
        def show(repo, commit, path):
            if path == 'config/review_limit.json':
                return json.dumps({'schema': 'dispatch_hard_review_limit/1', 'max_review_rounds': 5,
                                   'extensions_allowed': False}).encode()
            return json.dumps(self.manifest).encode() if path.endswith('/manifest.json') else self.ledger
        def materialize(repo, commit, run_id, row, target):
            raw = self.blobs[row['path']]
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
            Path(target).write_bytes(raw)
        for target, kwargs in [
            ('claude_checkpoint.verify_checkpoint', {'side_effect': lambda *a: (self.manifest, self.ledger)}),
            ('claude_checkpoint.materialize_checkpoint_file', {'side_effect': materialize}),
            ('claude_checkpoint.show', {'side_effect': show}),
            ('checkpoint_discovery.fetched_snapshot', {'side_effect': snapshot}),
            ('publication_owner.read_remote', {'side_effect': lambda *a: copy.deepcopy(self.record)})]:
            context = patch(target, **kwargs); context.start(); self.addCleanup(context.stop)

    def proof(self):
        return failed._proof(self.repo, self.commit, self.run)

    def retain(self, **kwargs):
        return failed.retain(self.repo, self.run, '2026-10-25', self.repo / 'workspace', moment=self.moment, **kwargs)

    def test_exact_failure_proof_retains_all_small_evidence_and_original_ledger(self):
        before = self.fixture.path.read_bytes(); proof = self.proof()
        self.assertEqual(self.fixture.path.read_bytes(), before)
        self.assertFalse(proof['production_finished']); self.assertFalse(proof['shipment_authorized'])
        self.assertEqual(set(proof['evidence']['files']), set(self.blobs))
        self.assertEqual(proof['original_state']['usage']['storyboard_critics'], 6)
        self.assertTrue(failed.matches_state(proof, self.state))
        self.record[failed.FIELD] = {self.run: proof}
        self.assertEqual(failed.verified(self.repo, self.run), proof)
        changed = copy.deepcopy(self.state); changed['usage']['storyboard_critics'] = 0
        self.assertFalse(failed.matches_state(proof, changed))
        changed = copy.deepcopy(self.state); changed['events'].pop()
        self.assertFalse(failed.matches_state(proof, changed))

    def test_unfundable_pre_film_failure_is_retained_like_an_exhausted_one(self):
        self.fixture.make_unfundable(); self.state = self.fixture.state
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        raw = self.fixture.claim.read_bytes(); claim = self.fixture.claim.relative_to(self.repo).as_posix()
        self.blobs[claim] = raw
        self.manifest['ledger_sha256'] = hashlib.sha256(self.ledger).hexdigest()
        for row in self.manifest['files']:
            if row['path'] == claim: row.update(sha256=hashlib.sha256(raw).hexdigest(), size=len(raw))
        proof = self.proof()
        self.assertEqual(proof['evidence']['plan']['reason'], completion_yield.UNFUNDABLE_REQUIRED_REVIEW)
        self.assertEqual(proof['original_state']['usage']['storyboard_critics'], 3)
        self.assertFalse(proof['production_finished']); self.assertFalse(proof['shipment_authorized'])
        # A checkpoint that carries opening evidence is not an unfundable dead end.
        rel = 'out/dispatch/opening-a-critic.json'; blank = b'{}'
        self.blobs[rel] = blank
        self.manifest['files'].append({'path': rel, 'sha256': hashlib.sha256(blank).hexdigest(), 'size': len(blank)})
        with self.assertRaisesRegex(ValueError, 'exhausted'):
            self.proof()

    def test_administrative_retention_changes_only_catalog_and_never_checkpoint_or_ledger(self):
        before = self.fixture.path.read_bytes()
        with patch.object(owner, 'append', return_value={'commit': 'e' * 40}) as append:
            result = self.retain()
        self.assertEqual(result['status'], 'failed_retained'); self.assertFalse(result['shipped'])
        proposed = append.call_args.args[1]
        self.assertEqual({k: v for k, v in proposed.items() if k != failed.FIELD},
                         {k: v for k, v in self.record.items() if k != 'commit'})
        self.assertEqual(append.call_args.args[2], self.record['commit'])
        self.assertEqual(self.fixture.path.read_bytes(), before)

    def test_live_owner_future_date_same_date_and_racing_heartbeat_are_not_overridden(self):
        with patch.object(owner, 'append') as append:
            self.record['expires_at'] = owner.stamp(self.moment + timedelta(seconds=1))
            with self.assertRaisesRegex(ValueError, 'live publication owner'):
                self.retain()
            self.record['expires_at'] = owner.stamp(self.moment - timedelta(hours=1))
            for value in ('2026-10-24', '2026-10-26'):
                with self.assertRaisesRegex(ValueError, 'actual later daily date'):
                    failed.retain(self.repo, self.run, value, self.repo / 'workspace', moment=self.moment)
            append.assert_not_called()
        with patch.object(owner, 'append', side_effect=checkpoint.CheckpointError('non-fast-forward')):
            with self.assertRaisesRegex(checkpoint.CheckpointError, 'non-fast-forward'):
                self.retain()

    def test_reopen_survives_a_lifted_ceiling_that_no_longer_reads_as_exhausted(self):
        proof = self.proof(); self.record[failed.FIELD] = {self.run: proof}
        with patch.object(failed, '_proof', side_effect=ValueError('only an exhausted ordinary daily production can close this path')), \
                patch.object(owner, 'append', return_value={'commit': 'e' * 40}) as append:
            with self.assertRaisesRegex(ValueError, 'exhausted'):
                failed.verified(self.repo, self.run)
            result = failed.reopen(self.repo, self.run, self.repo / 'workspace')
            self.assertEqual(result['status'], 'reopened'); self.assertFalse(result['shipped'])
            proposed = append.call_args.args[1]
            self.assertNotIn(self.run, proposed[failed.FIELD])
            self.assertEqual(proposed[failed.REOPENED][self.run]['proof'], proof)
            self.record[failed.FIELD][self.run]['checkpoint'] = 'f' * 40
            with self.assertRaisesRegex(ValueError, 'checkpoint changed'):
                failed.reopen(self.repo, self.run, self.repo / 'workspace')

    def test_original_retention_replays_under_twenty_without_reinterpreting_the_failure(self):
        import review_limit
        proof = self.proof(); self.record[failed.FIELD] = {self.run: proof}
        before = self.fixture.path.read_bytes()
        with patch.object(review_limit, 'MAX_ROUNDS', 20), patch.object(review_limit, 'POLICY',
                Path(__file__).resolve().parents[1] / 'config/review_limit.json'):
            self.assertEqual(failed.verified(self.repo, self.run), proof)
            with self.assertRaisesRegex(ValueError, 'exhausted'):
                self.proof()  # No historical proof or closure cannot create a new old-policy failure.
        self.assertEqual(self.fixture.path.read_bytes(), before)

    def test_original_unfundable_closure_replays_without_a_catalog_disposition(self):
        import review_limit
        self.fixture.make_unfundable(); self.state = self.fixture.state
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        self.manifest['ledger_sha256'] = hashlib.sha256(self.ledger).hexdigest()
        rel = self.fixture.claim.relative_to(self.repo).as_posix(); self.blobs[rel] = self.fixture.claim.read_bytes()
        for row in self.manifest['files']:
            if row['path'] == rel:
                row.update(sha256=hashlib.sha256(self.blobs[rel]).hexdigest(), size=len(self.blobs[rel]))
        evidence = self.proof()['evidence']
        self.state['events'].append({'kind': completion_yield.KIND, 'evidence': evidence})
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        self.manifest['ledger_sha256'] = hashlib.sha256(self.ledger).hexdigest()
        with patch.object(review_limit, 'MAX_ROUNDS', 20):
            proof = self.proof()
        self.assertEqual(proof['evidence'], evidence)
        self.assertEqual(proof['original_state']['events'], json.loads(self.ledger)['events'])

    def test_reopened_original_is_retained_but_newer_paid_checkpoint_stays_eligible(self):
        proof = self.proof()
        self.record[failed.REOPENED] = {self.run: {'proof': proof, 'authority': 'historical'}}
        self.assertEqual(failed.verified(self.repo, self.run), proof)
        self.assertIsNone(failed.verified(self.repo, self.run, checkpoint_commit='f' * 40))
        for run in (self.run, self.run + '-fresh-budget'):
            with self.assertRaisesRegex(ValueError, 'same-date restart'):
                failed.assert_not_retained(self.repo, run)

    def test_lost_reopened_map_is_recovered_from_actual_immutable_git_ancestry(self):
        import review_limit
        proof = self.proof(); checkpoint.git(self.repo, 'init', '--quiet')
        parent = None
        for row in ({failed.FIELD: {self.run: proof}},
                    {failed.REOPENED: {self.run: {'proof': proof, 'authority': 'original historical record'}}},
                    {'run_id': '2026-10-26'}):
            raw = json.dumps(row, indent=2, sort_keys=True).encode()
            blob = checkpoint.git(self.repo, 'hash-object', '-w', '--stdin', data=raw).stdout.decode().strip()
            tree = checkpoint.git(self.repo, 'mktree', data=f'100644 blob {blob}\tpublication.json\n'.encode()).stdout.decode().strip()
            args = ['commit-tree', tree, '-m', 'Fixture original publication history']
            if parent: args.extend(['-p', parent])
            parent = checkpoint.git(self.repo, *args, env={
                'GIT_AUTHOR_NAME': 'Fixture', 'GIT_AUTHOR_EMAIL': 'fixture@example.invalid',
                'GIT_COMMITTER_NAME': 'Fixture', 'GIT_COMMITTER_EMAIL': 'fixture@example.invalid'}).stdout.decode().strip()
        record = {'commit': parent, 'run_id': '2026-10-26'}
        original_show = checkpoint.show
        def history_show(repo, commit, path):
            if path == owner.FILE:
                return checkpoint.git(repo, 'show', commit + ':' + path).stdout
            return original_show(repo, commit, path)
        before = (self.fixture.path.read_bytes(), checkpoint.git(self.repo, 'show', parent + ':publication.json').stdout)
        with patch.object(checkpoint, 'show', side_effect=history_show), patch.object(review_limit, 'MAX_ROUNDS', 20), \
                patch.object(owner, 'append') as append:
            self.assertEqual(failed.verified(self.repo, self.run, record), proof)
            self.assertIsNone(failed.verified(self.repo, '2026-10-26', record))
            with self.assertRaisesRegex(ValueError, 'same-date restart'):
                failed.assert_not_retained(self.repo, self.run + '-reset', record)
            append.assert_not_called()
        self.assertEqual(before, (self.fixture.path.read_bytes(), checkpoint.git(self.repo, 'show', parent + ':publication.json').stdout))

    def test_new_source_policy_cannot_be_substituted_for_the_original_historical_policy(self):
        proof = self.proof(); self.record[failed.FIELD] = {self.run: proof}
        original_show = checkpoint.show
        def changed_policy(repo, commit, path):
            if path == 'config/review_limit.json':
                return b'{"schema":"dispatch_hard_review_limit/1","max_review_rounds":20,"extensions_allowed":true}'
            return original_show(repo, commit, path)
        with patch.object(checkpoint, 'show', side_effect=changed_policy), \
                self.assertRaisesRegex(ValueError, 'source-pinned'):
            failed.verified(self.repo, self.run)

    def test_prove_only_can_check_tomorrow_without_writing_a_disposition(self):
        self.moment -= timedelta(days=1)
        self.record['expires_at'] = owner.stamp(self.moment - timedelta(hours=1))
        with patch.object(owner, 'append') as append:
            result = self.retain(prove_only=True)
            append.assert_not_called()
        self.assertEqual(result['status'], 'failure_proven'); self.assertFalse(result['changed'])

    def test_same_date_suffix_and_forged_or_stale_disposition_are_refused(self):
        self.record[failed.FIELD] = {self.run: self.proof()}
        for run in (self.run, self.run + '-fresh-budget'):
            with self.assertRaisesRegex(ValueError, 'same-date restart'):
                failed.assert_not_retained(self.repo, run)
        failed.assert_not_retained(self.repo, '2026-10-25')
        self.record[failed.FIELD][self.run]['evidence']['production_finished'] = True
        with self.assertRaisesRegex(ValueError, 'original accepted evidence'):
            failed.verified(self.repo, self.run)
        self.record[failed.FIELD][self.run] = self.proof()
        self.record[failed.FIELD][self.run]['checkpoint'] = 'f' * 40
        with self.assertRaisesRegex(ValueError, 'checkpoint changed'):
            failed.verified(self.repo, self.run)

    def test_reserved_final_phone_or_native_work_cannot_be_retired(self):
        self.state['events'][5]['final_timed_phone'] = {'packet': 'already paid'}
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        self.manifest['ledger_sha256'] = hashlib.sha256(self.ledger).hexdigest()
        with self.assertRaisesRegex(ValueError, 'reserved final timed-phone'):
            self.proof()

    def test_later_acquisition_preserves_failure_and_live_owner_still_wins(self):
        proof = self.proof(); self.record[failed.FIELD] = {self.run: proof}
        self.record[failed.REOPENED] = {'2026-10-23': {'proof': {'retained': 'original'}}}
        with patch.object(owner, 'completed_proof', return_value=None), \
                patch.object(owner, 'append', side_effect=lambda repo, value, parent: {**value, 'commit': 'e' * 40}) as append:
            result = owner.acquire(self.repo, '2026-10-25', self.repo / 'new-workspace',
                                   session='scheduled-next', moment=self.moment)
            self.assertEqual(result['status'], 'owned')
            proposed = append.call_args.args[1]
            self.assertEqual(proposed[failed.FIELD][self.run], proof)
            self.assertEqual(proposed[failed.REOPENED], self.record[failed.REOPENED])
            self.assertFalse(proposed['previous_failed_edition']['shipped'])
            self.record['expires_at'] = owner.stamp(self.moment + timedelta(seconds=1))
            append.reset_mock()
            result = owner.acquire(self.repo, '2026-10-25', self.repo / 'busy-workspace',
                                   session='another', moment=self.moment)
            self.assertEqual(result['status'], 'busy'); append.assert_not_called()

    def test_old_owner_cannot_renew_or_reuse_cached_lease_after_retention(self):
        self.record[failed.FIELD] = {self.run: self.proof()}
        workspace = self.repo / 'original-workspace'
        owner.write(workspace / owner.MARKER, {**self.record, 'verified_at': owner.stamp(self.moment)})
        with patch.object(owner, 'append') as append, self.assertRaisesRegex(ValueError, 'same-date restart'):
            owner.current(self.repo, self.run, workspace, session='original', moment=self.moment)
        append.assert_not_called()


class InfeasibleFailedEditionTests(unittest.TestCase):
    def setUp(self):
        self.fixture = yield_tests.InfeasibleRequiredReviewTests(
            'test_four_actual_attempts_close_only_proven_infeasible_mandatory_path')
        self.fixture.setUp(); self.addCleanup(self.fixture.doCleanups)
        self.repo = self.fixture.repo; self.state = self.fixture.state; self.run = self.state['run_id']
        self.commit = 'a' * 40
        self.ledger = checkpoint.ledger_text(self.state, self.repo).encode()
        files = [self.fixture.packet, self.fixture.claim, self.fixture.receipt]
        self.blobs = {p.relative_to(self.repo).as_posix(): p.read_bytes() for p in files}
        self.manifest = {'schema': checkpoint.SCHEMA, 'run_id': self.run, 'source_pin': 'b' * 40,
            'repo_root': str(self.repo), 'terminal_state': None, 'shipment_recorded': False,
            'ledger_sha256': hashlib.sha256(self.ledger).hexdigest(), 'files': [
                {'path': rel, 'sha256': hashlib.sha256(raw).hexdigest(), 'size': len(raw)}
                for rel, raw in self.blobs.items()]}
        def materialize(repo, commit, run_id, row, target):
            raw = self.blobs[row['path']]
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
            Path(target).write_bytes(raw)
        for target, kwargs in [
            ('claude_checkpoint.verify_checkpoint', {'side_effect': lambda *a: (self.manifest, self.ledger)}),
            ('claude_checkpoint.materialize_checkpoint_file', {'side_effect': materialize})]:
            context = patch(target, **kwargs); context.start(); self.addCleanup(context.stop)

    def proof(self):
        return failed._proof(self.repo, self.commit, self.run)

    def test_retention_reproves_original_fourth_rejection_and_preserves_actual_count(self):
        before = self.fixture.path.read_bytes(); proof = self.proof()
        self.assertEqual(self.fixture.path.read_bytes(), before)
        self.assertEqual(proof['original_state']['usage']['storyboard_critics'], 4)
        self.assertFalse(proof['production_finished']); self.assertFalse(proof['shipment_authorized'])
        self.assertEqual(proof['evidence']['review_path']['required'], 2)
        self.assertEqual(proof['evidence']['review_path']['remaining'], 1)
        self.assertEqual(set(proof['evidence']['files']), set(self.blobs))
        self.assertTrue(failed.matches_state(proof, self.state))
        changed = copy.deepcopy(self.state); changed['usage']['storyboard_critics'] = 5
        self.assertFalse(failed.matches_state(proof, changed))

    def test_checkpoint_without_original_response_cannot_be_retired(self):
        self.manifest['files'] = [row for row in self.manifest['files']
                                  if completion_yield.CRITIC_RECEIPTS not in row['path']]
        with self.assertRaisesRegex(ValueError, 'retain the (actual )?original'):
            self.proof()

    def test_native_hero_and_missing_packet_are_preserved_not_classified_as_rejection(self):
        original = copy.deepcopy(self.manifest['files'])
        self.manifest['files'].append({'path': 'out/dispatch/cinema/hero.mp4', 'size': 1, 'sha256': 'a' * 64})
        with self.assertRaisesRegex(ValueError, 'native film'):
            self.proof()
        self.manifest['files'] = [row for row in original if row['path'] != 'out/dispatch/combined-packet.json']
        with self.assertRaisesRegex(ValueError, 'original paid critic packet'):
            self.proof()

if __name__ == '__main__':
    unittest.main()
