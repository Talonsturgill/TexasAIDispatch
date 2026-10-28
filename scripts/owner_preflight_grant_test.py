"""Exercise the owner preflight render grant: CLI, chain, refusals, replay and private export."""
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

KIND = 'owner_preflight_grant'
RES = 'preflight_renders'


class OwnerPreflightGrantTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / 'state.json'
        c.initialise(self.path, '2026-10-26', 'production')
        self.before = c.read_state(self.path)
        self.failure = self.root / 'deficit.json'
        self.failure.write_text(json.dumps({'date': '2026-10-26', 'source': 'production-budget',
                                            'deficits': {RES: 2}}))
        self.authorization = self.root / 'authorization.json'
        self.auth = self.make_auth(self.before, 1)
        self.authorization.write_text(json.dumps(self.auth))

    def make_auth(self, state, n, previous=None):
        auth = {'approval_id': 'owner-msg-%d' % n, 'run_id': state['run_id'], 'resource': RES,
                'additional_calls': n, 'confirmation': g.PREFLIGHT_CONFIRMATION,
                'owner_text': 'Owner authorized extra preflight renders, instruction %d.' % n,
                'source_message_reference': 'private-conversation/owner-%d' % n,
                'resource_envelope_sha256': g.envelope_digest(state['resource_envelope']),
                'failure_evidence': str(self.failure),
                'failure_evidence_sha256': c.digest(self.failure)}
        if previous is not None:
            auth['previous_grant_sha256'] = g.envelope_digest(previous)
        return auth

    def grant(self, n=None):
        n = n or self.auth['additional_calls']
        return c.grant_owner_preflight(self.path, self.authorization, self.failure, n,
                                       g.PREFLIGHT_CONFIRMATION)

    def next_grant(self, n, **changes):
        state = c.read_state(self.path)
        prev = [e for e in state['events'] if e['kind'] == KIND]
        auth = self.make_auth(state, len(prev) + 1 + 10, prev[-1] if prev else None)
        auth['additional_calls'] = n
        auth.update(changes)
        self.authorization.write_text(json.dumps(auth))
        return auth

    def test_valid_grant_raises_ceiling_exactly_and_keeps_usage(self):
        ceiling = self.before['escalation_ceiling'][RES]
        self.auth['additional_calls'] = 2
        self.authorization.write_text(json.dumps(self.auth))
        ok, message = self.grant()
        self.assertTrue(ok, message)
        after = c.read_state(self.path)
        self.assertEqual(after['escalation_ceiling'][RES], ceiling + 2)
        self.assertEqual(after['resource_envelope'], self.before['resource_envelope'])
        self.assertEqual(after['usage'], self.before['usage'])
        self.assertEqual(after['events'][:-1], self.before['events'])
        other = {k: v for k, v in after['escalation_ceiling'].items() if k != RES}
        self.assertEqual(other, {k: v for k, v in self.before['escalation_ceiling'].items() if k != RES})
        self.assertEqual(life.allowance_problems(after), [])
        self.assertEqual(ac.replay(after)[0][RES], self.before['resource_envelope'][RES] + 2)

    def test_real_cli(self):
        command = [sys.executable, str(Path(c.__file__)), '--state', str(self.path),
                   'grant-owner-preflight', '--authorization', str(self.authorization),
                   '--failure-evidence', str(self.failure), '--additional-calls', '1',
                   '--confirm', g.PREFLIGHT_CONFIRMATION]
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(c.read_state(self.path)['events'][-1]['kind'], KIND)

    def test_validator_and_critic_resources_unaffected(self):
        self.assertTrue(self.grant()[0])
        after = c.read_state(self.path)
        for name in ('validator_agents', 'storyboard_critics'):
            self.assertEqual(after['escalation_ceiling'][name], self.before['escalation_ceiling'][name])

    def test_malformed_authorizations_are_refused(self):
        for field, value in [('confirmation', 'yes'), ('resource', 'full_renders'),
                             ('resource', 'validator_agents'), ('run_id', '2026-10-27'),
                             ('additional_calls', True), ('additional_calls', 0),
                             ('additional_calls', 5), ('owner_text', ''),
                             ('failure_evidence_sha256', 'stale'),
                             ('resource_envelope_sha256', 'stale')]:
            with self.subTest(field=field, value=value):
                self.authorization.write_text(json.dumps(dict(self.auth, **{field: value})))
                self.assertFalse(self.grant(1)[0])
                self.assertEqual(c.read_state(self.path), self.before)
        self.authorization.write_text(json.dumps(dict(self.auth, extra='x')))
        self.assertFalse(self.grant(1)[0])
        self.authorization.write_text(json.dumps(self.auth))
        self.assertFalse(c.grant_owner_preflight(self.path, self.authorization, self.failure, 1, 'nope')[0])
        self.assertFalse(c.grant_owner_preflight(self.path, self.authorization, self.failure, 5,
                                                 g.PREFLIGHT_CONFIRMATION)[0])
        self.assertEqual(c.read_state(self.path), self.before)

    def test_bad_failure_evidence_is_refused(self):
        for body in ({'date': '2026-10-26', 'source': 'x', 'deficits': {'full_renders': 2}},
                     {'date': '2026-10-25', 'source': 'x', 'deficits': {RES: 2}},
                     {'date': '2026-10-26', 'source': 'x', 'deficits': {RES: 0}}):
            self.failure.write_text(json.dumps(body))
            self.auth['failure_evidence_sha256'] = c.digest(self.failure)
            self.authorization.write_text(json.dumps(self.auth))
            self.assertFalse(self.grant(1)[0])
        self.assertEqual(c.read_state(self.path), self.before)

    def test_chain_distinctness_and_limits(self):
        self.assertTrue(self.grant(1)[0])
        first = json.loads(c.read_state(self.path)['events'][-1]['authorization_json'])
        for changes in ({'approval_id': first['approval_id']},
                        {'source_message_reference': first['source_message_reference']},
                        {'owner_text': first['owner_text']},
                        {'previous_grant_sha256': 'stale'}):
            snapshot = c.read_state(self.path)
            self.next_grant(1, **changes)
            self.assertFalse(self.grant(1)[0], changes)
            self.assertEqual(c.read_state(self.path), snapshot)
        auth = self.next_grant(1)
        del auth['previous_grant_sha256']
        self.authorization.write_text(json.dumps(auth))
        self.assertFalse(self.grant(1)[0])
        for n in (2, 3, 4):
            self.next_grant(n if n < 4 else 1)
            self.assertTrue(self.grant(n if n < 4 else 1)[0])
        state = c.read_state(self.path)
        self.assertEqual(len([e for e in state['events'] if e['kind'] == KIND]), 4)
        self.assertEqual(life.allowance_problems(state), [])
        self.assertEqual(state['escalation_ceiling'][RES],
                         self.before['escalation_ceiling'][RES] + 1 + 2 + 3 + 1)
        self.next_grant(1)
        self.assertFalse(self.grant(1)[0])
        self.assertEqual(c.read_state(self.path), state)

    def test_tampered_retained_grant_fails_replay_and_reservation(self):
        self.assertTrue(self.grant()[0])
        for mutate in (lambda e: e.update(additional_calls=4, new_ceiling=e['previous_ceiling'] + 4),
                       lambda e: e.update(authorization_json=e['authorization_json'] + ' '),
                       lambda e: e.update(failure_evidence_json=e['failure_evidence_json'] + ' '),
                       lambda e: e.update(new_ceiling=e['new_ceiling'] + 1)):
            state = c.read_state(self.path)
            mutate(state['events'][-1])
            self.assertTrue(g.preflight_grant_problems(state))
            self.assertTrue(ac.replay(state)[1])
        state = c.read_state(self.path)
        state['events'][-1]['additional_calls'] = 4
        c.save(self.path, state)
        self.assertFalse(c.reserve(self.path, {RES: 1})[0])

    def test_ceiling_hand_raise_without_event_fails_allowance(self):
        state = c.read_state(self.path)
        state['escalation_ceiling'][RES] += 2
        self.assertTrue(life.allowance_problems(state))

    def test_grant_funds_reservation_without_resetting_usage(self):
        used = self.before['escalation_ceiling'][RES]
        self.assertTrue(c.reserve(self.path, {RES: used})[0])
        self.assertFalse(c.reserve(self.path, {RES: 1})[0])
        self.auth['additional_calls'] = 2
        self.authorization.write_text(json.dumps(self.auth))
        self.assertTrue(self.grant()[0])
        self.assertEqual(c.read_state(self.path)['usage'][RES], used)
        self.assertTrue(c.reserve(self.path, {RES: 2})[0])
        self.assertFalse(c.reserve(self.path, {RES: 1})[0])

    def test_public_export_redacts_and_replays_chain(self):
        self.assertTrue(self.grant(1)[0])
        self.next_grant(2)
        self.assertTrue(self.grant(2)[0])
        state = c.read_state(self.path)
        result = public_state.export(state)
        rendered = json.dumps(result)
        self.assertNotIn(self.auth['owner_text'], rendered)
        self.assertNotIn('private-conversation/owner-1', rendered)
        self.assertEqual(result['usage'], state['usage'])
        self.assertEqual(result['resource_envelope'], state['resource_envelope'])
        self.assertEqual(g.preflight_grant_problems(result), [])
        self.assertEqual(life.allowance_problems(result), [])
        self.assertEqual(ac.replay(result)[1], [])
        again = public_state.export(result)
        self.assertEqual(result['events'], again['events'])


if __name__ == '__main__':
    unittest.main()
