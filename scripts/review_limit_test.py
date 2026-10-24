"""Five real reservations are the end of editorial review, even after recovery."""
import copy
import json
from pathlib import Path
import tempfile
import subprocess
import unittest
from unittest.mock import patch

import creative_release
import modern_film
import review_limit as limit
import run_controller as controller


class ReviewLimit(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-20', 'production')[0])

    def charge(self, count=1, note='offline actual code/phone review attempt'):
        return controller.reserve(self.state, {'storyboard_critics': count}, note)

    def test_real_sixth_reservation_refuses_before_any_ledger_mutation(self):
        for name in ('code', 'phone', 'retry', 'consolidated correction', 'final timed phone'):
            accepted, message = self.charge(note=name)
            self.assertTrue(accepted, message)
        before = self.state.read_bytes()
        accepted, message = self.charge()
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())
        self.assertEqual(5, json.loads(before)['usage']['storyboard_critics'])

    def test_bulk_charge_cannot_cross_the_limit(self):
        self.assertTrue(self.charge(4)[0]); before = self.state.read_bytes()
        self.assertFalse(self.charge(2)[0]); self.assertEqual(before, self.state.read_bytes())
        self.assertTrue(self.charge()[0])

    def test_first_review_refuses_actual_authored_deadlock_before_any_charge(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures/retime_feasibility_2026_10_21.json').read_text())
        board = self.root / 'storyboard.json'
        board.write_text(json.dumps(fixture['original_s1_projection']))
        before = self.state.read_bytes()
        accepted, message = self.charge()
        self.assertFalse(accepted)
        self.assertIn('authored retime feasibility before first review', message)
        self.assertIn('s1-shot-1', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_first_review_checks_other_treatment_and_accepts_compilable_plan(self):
        from retime_feasibility_test import valid
        board = self.root / 'storyboard.json'; board.write_text(json.dumps(valid()))
        other = valid(); other['film_direction']['shots'][0]['narration_ids'] = ['n1', 'n2']
        treatment = self.root / 'opening-b.json'; treatment.write_text(json.dumps(other))
        before = self.state.read_bytes()
        self.assertFalse(self.charge()[0]); self.assertEqual(before, self.state.read_bytes())
        treatment.write_text(json.dumps(valid()))
        accepted, message = self.charge()
        self.assertTrue(accepted, message)
        self.assertEqual(1, json.loads(self.state.read_text())['usage']['storyboard_critics'])

    def test_retained_four_review_recovery_is_not_a_new_code_review(self):
        self.assertTrue(self.charge(4)[0])
        (self.root / 'opening-a.json').write_text(json.dumps({'narration_picture': {'timing_mode': 'authored'}}))
        accepted, message = self.charge(note='reserved fifth exact timed phone')
        self.assertTrue(accepted, message)
        self.assertEqual(5, json.loads(self.state.read_text())['usage']['storyboard_critics'])

    def test_larger_ceilings_new_script_and_recovery_names_cannot_reset_counter(self):
        self.assertTrue(self.charge(5)[0])
        value = json.loads(self.state.read_text())
        value['limits']['storyboard_critics'] = 500
        value['escalation_ceiling']['storyboard_critics'] = 500
        value['events'].append({'kind': 'test_retained_source_pivot', 'new_script': 'new angle'})
        self.state.write_text(json.dumps(value)); before = self.state.read_bytes()
        for name in ('mandatory code', 'source pivot', 'process retry', 'owner capacity', 'review-context'):
            self.assertIn('hard five-review', self.charge(note=name)[1])
            self.assertEqual(before, self.state.read_bytes())

    def test_cap_closes_rebuild_and_all_creative_pivot_admission(self):
        self.assertTrue(self.charge(5)[0]); state = json.loads(self.state.read_text())
        for scope in ('standard', 'narration-performance', 'source-pivot'):
            self.assertTrue(limit.repair_problems(state, {'repair_scope': scope,
                'changed_inputs': [{'path': 'new-scene.tsx'}]}))
        self.assertTrue(limit.reservation_problems(state, {'reboards': 1}))
        self.assertTrue(limit.repair_problems(state, {'resources': {'storyboard_critics': 1}}))
        self.assertEqual([], limit.reservation_problems(state, {'full_renders': 1}))
        self.assertEqual([], limit.reservation_problems(state, {'audiovisual_reviews': 3}))
        self.assertEqual([], limit.reservation_problems(state, {'panel_rounds': 1, 'scorer_calls': 3}))

    def test_actual_completion_capacity_cannot_buy_a_sixth_attempt(self):
        import autonomous_completion
        self.assertTrue(self.charge(5)[0]); before = self.state.read_bytes()
        plan = self.root / 'completion.json'
        plan.write_text(json.dumps({'changed_inputs': [], 'resources': {'storyboard_critics': 1}}))
        accepted, message = autonomous_completion.grant_capacity(self.state, plan)
        self.assertFalse(accepted); self.assertIn('hard five-review', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_history_keeps_counts_and_cloud_adoption_closes_an_old_overrun(self):
        value = json.loads(self.state.read_text()); value['run_id'] = '2026-10-19'
        value['usage']['storyboard_critics'] = 61
        with patch('publication_owner.enabled', return_value=False):
            self.assertFalse(limit.enabled(value))
        original = copy.deepcopy(value)
        with patch('publication_owner.enabled', return_value=True):
            self.assertTrue(limit.reached(value))
            self.assertTrue(limit.reservation_problems(value, {'storyboard_critics': 1}))
        self.assertEqual(original, value)
        value['terminal_state'] = 'shipped'
        self.assertFalse(limit.enabled(value))

    def test_diminishing_returns_preserve_the_final_review_path(self):
        self.assertTrue(self.charge(3)[0])
        value = json.loads(self.state.read_text())
        self.assertTrue(creative_release.finishing_required(value))
        self.assertEqual(2, limit.MAX_ROUNDS - limit.used(value))

    def test_actual_continuation_feedback_closes_creative_recovery_instead_of_extending_it(self):
        import routine_continuation
        self.assertTrue(self.charge(3)[0]); value = json.loads(self.state.read_text())
        hint = routine_continuation.capacity_recovery_hint(value)
        self.assertIn('FIVE cumulative editorial reviews', hint)
        self.assertIn('verified unsent draft with music', hint)
        self.assertNotIn('completion-capacity', hint)
        self.assertNotIn('retained_replacement decision', hint)
        self.assertEqual(3, value['usage']['storyboard_critics'])

    def test_last_slot_accepts_only_the_final_timed_phone_and_cannot_dispatch_six(self):
        self.assertTrue(self.charge(4)[0]); value = json.loads(self.state.read_text())
        self.assertTrue(limit.worker_plan_problems(value, {'role': 'storyboard-critic'}))
        current = {'role': 'storyboard-critic', 'phone_mode': 'current',
                   'review_scope': 'exact-muted-phone-preflight'}
        self.assertEqual([], limit.worker_plan_problems(value, current))
        value['usage']['storyboard_critics'] = 5
        self.assertEqual([], limit.worker_plan_problems(value, current, charged=True))
        self.assertTrue(limit.worker_plan_problems(value, current))
        value['usage']['storyboard_critics'] = 6
        self.assertTrue(limit.worker_plan_problems(value, current))

    def test_surface_boundary_keeps_timed_observations_and_actual_action(self):
        board = {'date': '2026-10-20', 'runtime_s': 10, 'narration_picture': {'clauses': []}}
        report = {'film_sha256': 'a'*64, 'modern_observations': {'film_sha256': 'a'*64},
                  'narration_picture_observations': {'film_sha256': 'a'*64, 'clauses': []}}
        for name in modern_film.policy()['review_criteria']:
            report['modern_observations'][name] = {'pass': True, 'start_s': 1, 'end_s': 2,
                'observed': 'The actual current image shows the performed source-bound action clearly.'}
        report['modern_observations']['finished_art']['pass'] = False
        self.assertEqual([], modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))
        self.assertTrue(modern_film.review_problems(board, report, _scope=False))
        for name in ('performed_turn', 'visual_progression', 'pace', 'closing_answer'):
            changed = copy.deepcopy(report); changed['modern_observations'][name]['pass'] = False
            self.assertTrue(modern_film.review_problems(board, changed, _scope=False, _surface_deferred=True))
        report['modern_observations']['finished_art']['start_s'] = -1
        self.assertTrue(modern_film.review_problems(board, report, _scope=False, _surface_deferred=True))

    def test_surface_classification_cannot_defer_motion_pacing_or_ending(self):
        board = {'date': '2026-10-20'}
        self.assertEqual([], modern_film.assessment_problems(board,
            {'defects': [{'category': 'surface_finish'}]}, _surface_deferred=True))
        for category in ('motion', 'pacing', 'ending_artistry'):
            self.assertTrue(modern_film.assessment_problems(board,
                {'defects': [{'category': category}]}, _surface_deferred=True))


class FinalPhoneReservation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.output = self.root / 'out/dispatch'
        self.output.mkdir(parents=True); self.state = self.output / 'run_state.json'
        self.assertTrue(controller.initialise(self.state, '2026-10-24', 'production')[0])
        self.assertTrue(controller.reserve(self.state, {'storyboard_critics': 4}, 'four earlier attempts')[0])

    def packet(self, *, authored=False, silent=False):
        import claude_runtime as runtime
        import claude_motion_review as motion
        import critic_gate
        board = self.output / 'storyboard.json'; film = self.output / 'preflight.mp4'
        # A tiny mechanical timing fixture, never a creative or acoustic production verdict.
        text = 'Software flags the leak.'
        captions = {'cues': [{'id': 'c1', 'text': text, 'start': .3, 'end': 1.6,
                    'source': 'measured_boundary', 'start_measured': True, 'end_measured': True}]}
        words = {'method': 'offline-test-fixture', 'words': [
            {'word': word, 'start': start, 'end': end}
            for word, start, end in [('Software', .3, .55), ('flags', .6, .8),
                                     ('the', .9, 1.0), ('leak.', 1.2, 1.6)]]}
        data = {'date': '2026-10-24', 'runtime_s': 1.8, 'credits_s': 0,
                'scenes': [{'id': 's1', 'start_s': 0, 'duration_s': 1.8, 'vo': text,
                    'visual_events': [{'id': 'e1', 'narration_id': 'n1', 'at_s': .4, 'duration_s': .5,
                                       'clause_fraction_start': .1, 'clause_fraction_end': .8}]}],
                'film_direction': {'episode': 'leak-review-v1', 'shots': [
                    {'id': 'shot1', 'scene_id': 's1', 'view': 'alert-panel', 'event_id': 'e1',
                     'narration_ids': ['n1'], 'start_s': 0, 'duration_s': 1.8}]},
                'narration_picture': {'version': 'narration-picture-v1',
                    'timing_mode': 'authored' if authored else 'measured_caption_boundaries',
                    'timing_provenance': {'cue_content_sha256': modern_film.cue_digest(captions['cues']),
                                          'word_content_sha256': modern_film.narration_digest(words)},
                    'clauses': [{'id': 'n1', 'cue_ids': ['c1'], 'text': text, 'start_s': .3, 'end_s': 1.6,
                        'word_range': [0, 4], 'scene_id': 's1', 'subject_ids': ['s2-alert'],
                        'action_id': 'software-alert-claim', 'claim_ids': ['test-claim'], 'event_ids': ['e1']}]}}
        if silent:
            data.pop('narration_picture')
        board.write_text(json.dumps(data))
        (self.output / 'captions.json').write_text(json.dumps(captions))
        (self.output / 'words.json').write_text(json.dumps(words))
        (self.output / 'vo_script.txt').write_text(text)
        subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
            'testsrc2=size=270x480:rate=30:duration=1.8', '-c:v', 'libx264',
            '-preset', 'ultrafast', '-crf', '16', str(film)], check=True)
        (self.output / 'preflight.json').write_text(json.dumps({'pass': True, 'problems': [],
            'renderer_sha256': critic_gate.renderer_digest(data),
            'board_sha256': motion.digest(board), 'film_sha256': motion.digest(film)}))
        binding = motion.phone_inputs(self.state, 'current', board, film)
        index = motion.build(board, film, self.output / 'timed-motion', True, binding)
        claims = self.output / 'claims.json'; claims.write_text('{}')
        data = {'role': 'storyboard-critic', 'date': '2026-10-24',
                'agent_assignment': runtime.assignment('storyboard-critic', '2026-10-24'),
                'board': runtime.bound(board), 'claims': runtime.bound(claims),
                'phone_state': str(self.state), 'phone_mode': 'current',
                'review_scope': 'exact-muted-phone-preflight',
                'phone_options': runtime.phone_options(self.state, [index], True),
                'phone_decision_scope': runtime.phone_decision_scope()}
        data['phone_options'][0]['report_bindings']['story_review']['claims_sha256'] = runtime.digest(claims)
        path = self.output / 'current-phone-packet.json'; path.write_text(json.dumps(data))
        return path, data

    def test_generic_fifth_cannot_be_spent_for_code_pivot_or_named_phone(self):
        before = self.state.read_bytes()
        for note in ('code correction', 'narration pivot', 'final timed phone', 'owner-granted extra review'):
            ok, message = controller.reserve(self.state, {'storyboard_critics': 1}, note)
            self.assertFalse(ok); self.assertIn('--review-packet', message)
            self.assertEqual(before, self.state.read_bytes())

    def test_bulk_reservation_cannot_hide_the_protected_fifth(self):
        other = self.root / 'bulk.json'
        self.assertTrue(controller.initialise(other, '2026-10-24', 'production')[0])
        before = other.read_bytes()
        self.assertFalse(controller.reserve(other, {'storyboard_critics': 5}, 'bulk reviews')[0])
        self.assertEqual(before, other.read_bytes())

    def test_real_current_phone_packet_can_spend_fifth_once_and_bind_dispatch(self):
        packet, data = self.packet()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                          'final timed phone', review_packet=packet)
        self.assertTrue(ok, message)
        value = controller.read_state(self.state)
        self.assertEqual(5, value['usage']['storyboard_critics'])
        bound = value['events'][-1]['final_timed_phone']
        self.assertEqual(controller.digest(packet), bound['packet']['sha256'])
        self.assertEqual([], limit.worker_plan_problems(value, data, charged=True))
        changed = copy.deepcopy(data); changed['instructions'] = 'different paid task'
        self.assertTrue(limit.worker_plan_problems(value, changed, charged=True))
        before = self.state.read_bytes()
        self.assertFalse(controller.reserve(self.state, {'storyboard_critics': 1},
                                            'repeat final phone', review_packet=packet)[0])
        self.assertEqual(before, self.state.read_bytes())

    def test_authored_clock_cannot_spend_the_final_timed_slot(self):
        packet, _ = self.packet(authored=True); before = self.state.read_bytes()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'claimed final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('still an authored estimate', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_silent_current_preview_cannot_spend_the_final_timed_slot(self):
        packet, _ = self.packet(silent=True); before = self.state.read_bytes()
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'claimed final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('complete narration-picture contract', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_actual_claude_plan_charge_replan_preserves_packet_and_claims_once(self):
        import claude_runtime as runtime
        import publication_owner as owner
        import claude_checkpoint as checkpoint
        packet, data = self.packet()
        brief = '.claude/agents/' + data['agent_assignment']['agent'] + '.md'
        (self.root / brief).parent.mkdir(parents=True)
        (self.root / brief).write_bytes((runtime.REPO / brief).read_bytes())
        data['brief'] = brief; packet.write_text(json.dumps(data)); packet_before = packet.read_bytes()
        identity = {'owner_sha256': 'a' * 64, 'epoch': 'offline-test-epoch'}
        # Only external ownership/remote checkpoint transport and unrelated guide inventory
        # are isolated. Actual phone/clock/hash validation, plans, charges and claims execute.
        with patch.object(runtime, 'REPO', self.root), \
                patch.object(owner, 'enabled', return_value=True), \
                patch.object(owner, 'require_owner', return_value=identity), \
                patch.object(owner, 'local_workspace', return_value=self.root), \
                patch.object(checkpoint, 'mirror'), patch('agent_runtime.required_inputs'), \
                patch.object(runtime, 'contracts', return_value=[]), \
                patch.object(runtime, 'image_policy_inputs'):
            planned = runtime.plan('storyboard-critic', packet, 'phone_final', 'Inspect the exact timed phone.')
            self.assertFalse(planned['dispatch_ready'])
            self.assertEqual(packet_before, packet.read_bytes())
            ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                              'final timed phone', review_packet=packet)
            self.assertTrue(ok, message)
            ready = runtime.plan('storyboard-critic', packet, 'phone_final', 'Inspect the exact timed phone.')
            self.assertTrue(ready['dispatch_ready'])
            self.assertTrue(Path(ready['reservation_claim']['path']).is_file())
            self.assertEqual(packet_before, packet.read_bytes())
            with self.assertRaisesRegex(ValueError, 'hard five-review'):
                runtime.plan('storyboard-critic', packet, 'phone_again', 'Repeat the exact timed phone.')

    def test_wrong_scope_foreign_state_and_stale_media_refuse_without_charge(self):
        packet, data = self.packet(); before = self.state.read_bytes()
        for key, value in [('phone_mode', 'comparison'), ('review_scope', 'code-plan'),
                           ('phone_state', str(self.root / 'other-state.json'))]:
            changed = copy.deepcopy(data); changed[key] = value
            packet.write_text(json.dumps(changed))
            self.assertFalse(controller.reserve(self.state, {'storyboard_critics': 1},
                                                'final phone', review_packet=packet)[0])
            self.assertEqual(before, self.state.read_bytes())
        packet.write_text(json.dumps(data))
        board = Path(data['board']['path']); board.write_text(board.read_text() + '\n')
        ok, message = controller.reserve(self.state, {'storyboard_critics': 1},
                                         'final phone', review_packet=packet)
        self.assertFalse(ok); self.assertIn('input changed', message)
        self.assertEqual(before, self.state.read_bytes())

    def test_normal_policy_rejects_unverified_owner_grants(self):
        data = limit.policy()
        data['owner_grants'] = [{'edition': '2026-10-24', 'extra_reviews': 1,
                                'authority': 'Unverified claimed owner instruction ' * 3}]
        path = self.root / 'policy.json'; path.write_text(json.dumps(data))
        before = self.state.read_bytes()
        with patch.object(limit, 'POLICY', path):
            with self.assertRaisesRegex(ValueError, 'hard five-review'):
                controller.reserve(self.state, {'storyboard_critics': 1}, 'extra review')
        self.assertEqual(before, self.state.read_bytes())


if __name__ == '__main__':
    unittest.main()
