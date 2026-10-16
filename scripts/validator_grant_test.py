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


if __name__ == '__main__':
    unittest.main()
