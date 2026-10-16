"""Exercise the real validator CLI, cumulative accounting and private export."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import autonomous_completion as ac
import production_lifecycle as life
import public_state
import repair_guard as g
import run_controller as c


class ValidatorGrantTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / 'state.json'
        c.initialise(self.path, '2026-10-15', 'production')
        state = c.read_state(self.path)
        # Replay the actual old frozen two-call allocation, independent of new defaults.
        state['resource_envelope']['validator_agents'] = 2
        state['escalation_ceiling']['validator_agents'] = 2
        state['limits']['validator_agents'] = 2
        state['usage']['validator_agents'] = 2
        for event in state['events']:
            if event['kind'] == 'resource_envelope_frozen':
                event['envelope']['validator_agents'] = 2
            if event['kind'] == 'initialised':
                event['ceiling_snapshot']['validator_agents'] = 2
        c.save(self.path, state)
        self.before = copy.deepcopy(state)
        self.failure = self.root / 'rejected.json'
        self.failure.write_text(json.dumps({'date': '2026-10-15', 'source': 'independent-validator',
            'result': 'REVISE', 'rejected': ['Use can carry to preserve the source limit.']}))
        self.authorization = self.root / 'authorization.json'
        self.auth = {'approval_id': 'retained-owner-message-1', 'run_id': state['run_id'],
            'resource': 'validator_agents', 'additional_calls': 1,
            'confirmation': g.VALIDATOR_CONFIRMATION,
            'owner_text': 'Owner explicitly authorized the additional validator pass.',
            'source_message_reference': 'private-conversation/owner-budget-instruction',
            'resource_envelope_sha256': g.envelope_digest(state['resource_envelope']),
            'failure_evidence': str(self.failure), 'failure_evidence_sha256': c.digest(self.failure)}
        self.authorization.write_text(json.dumps(self.auth))

    def grant(self):
        return c.grant_validator_review(self.path, self.authorization, self.failure, g.VALIDATOR_CONFIRMATION)

    def test_real_cli_changes_allowance_without_spending_or_rewriting_history(self):
        command = [sys.executable, str(Path(c.__file__)), '--state', str(self.path),
            'grant-validator-review', '--authorization', str(self.authorization),
            '--failure-evidence', str(self.failure), '--confirm', g.VALIDATOR_CONFIRMATION]
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        after = c.read_state(self.path)
        self.assertEqual(after['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(after['usage'], self.before['usage'])
        self.assertEqual(after['events'][:-1], self.before['events'])
        self.assertEqual(after['escalation_ceiling']['validator_agents'], 3)
        self.assertEqual(life.allowance_problems(after), [])
        self.assertTrue(c.reserve(self.path, {'validator_agents': 1})[0])
        self.assertFalse(c.reserve(self.path, {'validator_agents': 1})[0])
        self.assertFalse(self.grant()[0])

    def test_wrong_owner_or_rejected_evidence_never_grants(self):
        for field, value in [('run_id', '2026-10-16'), ('additional_calls', True),
                ('additional_calls', 2), ('resource', 'full_renders'), ('owner_text', ''),
                ('confirmation', 'yes'), ('failure_evidence_sha256', 'stale'),
                ('resource_envelope_sha256', 'stale')]:
            with self.subTest(field=field, value=value):
                bad = dict(self.auth, **{field: value})
                self.authorization.write_text(json.dumps(bad))
                self.assertFalse(self.grant()[0])
                self.assertEqual(c.read_state(self.path), self.before)
        self.authorization.write_text(json.dumps(dict(self.auth, context='private owner message')))
        self.assertFalse(self.grant()[0])
        self.assertEqual(c.read_state(self.path), self.before)
        self.authorization.write_text(json.dumps(self.auth))
        self.failure.write_text(self.failure.read_text().replace('REVISE', 'PASS'))
        self.auth['failure_evidence_sha256'] = c.digest(self.failure)
        self.authorization.write_text(json.dumps(self.auth))
        self.assertFalse(self.grant()[0])

    def test_export_redacts_private_authorization_and_keeps_auditable_increment(self):
        self.assertTrue(self.grant()[0])
        state = c.read_state(self.path)
        result = public_state.export(state)
        rendered = json.dumps(result)
        self.assertNotIn(self.auth['owner_text'], rendered)
        self.assertNotIn(self.auth['source_message_reference'], rendered)
        self.assertEqual(result['usage'], state['usage'])
        self.assertEqual(result['resource_envelope'], state['resource_envelope'])
        self.assertEqual(g.validator_grant_problems(result), [])
        self.assertEqual(life.allowance_problems(result), [])

    def test_tampered_grant_fails_replay_and_next_reservation(self):
        self.assertTrue(self.grant()[0])
        state = c.read_state(self.path)
        state['events'][-1]['additional_calls'] = 5
        self.assertTrue(ac.replay(state)[1])
        c.save(self.path, state)
        self.assertFalse(c.reserve(self.path, {'validator_agents': 1})[0])

    def test_reexport_preserves_public_grant_history_and_original_provenance(self):
        import claude_checkpoint as ck
        self.assertTrue(self.grant()[0])
        raw = c.read_state(self.path)
        before = copy.deepcopy(raw)
        first = public_state.export(raw)
        second = public_state.export(first)
        self.assertEqual(first['events'], second['events'])
        self.assertEqual(first['public_export']['owner_message_redactions'],
                         second['public_export']['owner_message_redactions'])
        self.assertEqual(ck.monotonic_problems(first, second), [])
        self.assertEqual(raw, before)

    def test_checkpoint_relocation_preserves_exact_grant_text_hashes_and_charges(self):
        import claude_checkpoint as ck
        self.assertTrue(self.grant()[0])
        raw = c.read_state(self.path)
        projected, origins = ck.public_projection(raw, self.root)
        self.assertNotIn(self.auth['owner_text'], json.dumps(projected))
        for legacy in (False, True):
            with self.subTest(legacy_manifest=legacy):
                destination = self.root / ('legacy-restored' if legacy else 'restored')
                (destination / 'out/dispatch').mkdir(parents=True)
                manifest = {'repo_root': str(self.root)}
                if not legacy:
                    manifest['grant_origin_roots'] = origins
                restored = ck.restored_ledger(projected, destination, manifest)
                self.assertEqual(g.validator_grant_problems(restored), [])
                self.assertEqual(life.allowance_problems(restored), [])
                self.assertEqual(restored['usage'], raw['usage'])
                self.assertEqual(restored['resource_envelope'], raw['resource_envelope'])
                self.assertEqual(restored['events'][-1]['failure_evidence_json'],
                                 raw['events'][-1]['failure_evidence_json'])
                (destination / ck.GRANT_ROOTS_FILE).write_text(json.dumps({'schema': 1, 'entries': origins}))
                again, retained = ck.public_projection(restored, destination)
                self.assertEqual(projected['events'], again['events'])
                self.assertEqual(retained, origins)
                self.assertEqual(ck.monotonic_problems(projected, again), [])
                state_path = destination / 'state.json'
                c.save(state_path, restored)
                self.assertTrue(c.reserve(state_path, {'validator_agents': 1})[0])
                charged = c.read_state(state_path)
                final, _ = ck.public_projection(charged, destination)
                self.assertEqual(charged['usage']['validator_agents'], 3)
                self.assertEqual(charged['resource_envelope']['validator_agents'], 2)
                self.assertEqual(ck.monotonic_problems(projected, final), [])

    def test_wrong_origin_or_tampered_public_attestation_fails_closed(self):
        import claude_checkpoint as ck
        self.assertTrue(self.grant()[0])
        projected, origins = ck.public_projection(c.read_state(self.path), self.root)
        wrong = copy.deepcopy(origins)
        wrong[0]['root'] = str(self.root / 'wrong-origin')
        with self.assertRaisesRegex(ck.CheckpointError, 'exactly'):
            ck.restored_ledger(projected, self.root / 'new',
                               {'repo_root': str(self.root), 'grant_origin_roots': wrong})
        exported = public_state.export(c.read_state(self.path))
        grant = exported['events'][-1]
        auth = json.loads(grant['authorization_json'])
        auth['owner_text'] = 'private replacement of the retained public attestation'
        grant['authorization_json'] = json.dumps(auth, sort_keys=True)
        grant['authorization_sha256'] = public_state.sha(grant['authorization_json'])
        with self.assertRaisesRegex(ValueError, 'attestation changed'):
            public_state.export(exported)


if __name__ == '__main__':
    unittest.main()
