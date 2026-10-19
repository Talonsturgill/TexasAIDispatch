"""Exercise actual hook-shaped Read/Write flows and reject forged or destructive annotations."""
import base64
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import image_read_receipt as image
from image_read_receipt_test import PNG
import visual_observations as visual


class VisualEvidence(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name).resolve(); self.repo = self.workspace / 'Dispatch'
        self.repo.mkdir()
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True, capture_output=True)
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'add', 'origin', image.REMOTE], check=True)
        self.package = self.repo / 'out/dispatch'; self.package.mkdir(parents=True)
        self.page = self.package / 'motion/sequence-000.png'; self.page.parent.mkdir(); self.page.write_bytes(PNG)
        self.read = {'hook_event_name': 'PostToolUse', 'tool_name': 'Read',
            'session_id': 'test-session', 'agent_id': 'test-critic', 'agent_type': visual.ROLE_NAMES[0],
            'tool_use_id': 'real-read-1', 'cwd': str(self.workspace),
            'tool_input': {'file_path': str(self.page)},
            'tool_response': {'type': 'image', 'file': {'base64': base64.b64encode(PNG).decode(), 'type': 'image/png'}}}

    def delivered(self):
        result = image.record(self.read, self.workspace)
        path = next((self.package / 'image-tool-delivery').glob('*.json'))
        receipt = visual.load(path)
        note = {'schema': visual.SCHEMA, 'image_event_key': receipt['event_key'],
            'page': receipt['source_file'], 'image_sha256': receipt['source_sha256'], 'received': True,
            'objects': ['red robot'], 'actions': ['robot turns toward a door'], 'text': None,
            'observed': 'A red robot turns toward the open door at the right edge.', 'literal_error': None}
        write = {**self.read, 'hook_event_name': 'PreToolUse', 'tool_name': 'Write', 'tool_use_id': 'real-write-1',
                 'tool_input': {'file_path': str(self.repo / receipt['observation_path']), 'content': json.dumps(note)}}
        return result, receipt, note, write

    def save(self, write):
        visual.guard(write, self.workspace)
        target = Path(write['tool_input']['file_path']); target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(write['tool_input']['content'])
        visual.record_write({**write, 'hook_event_name': 'PostToolUse'}, self.workspace)
        return target

    def test_real_tools_preserve_facts_and_allow_the_next_image_only_after_write(self):
        result, receipt, note, write = self.delivered()
        self.assertIn('Use Write now', result['hookSpecificOutput']['additionalContext'])
        self.assertNotIn('permissionDecision', json.dumps(result))
        next_read = {**self.read, 'hook_event_name': 'PreToolUse'}
        with self.assertRaisesRegex(ValueError, 'previous actual image'):
            visual.guard(next_read, self.workspace)
        target = self.save(write)
        visual.guard(next_read, self.workspace)
        self.assertEqual(visual.load(target), note)
        with self.assertRaisesRegex(ValueError, 'one new annotation'):
            visual.guard(write, self.workspace)
        self.assertNotIn('test-session', json.dumps(receipt)); self.assertNotIn('test-critic', json.dumps(receipt))

    def test_forbidden_paths_actor_forgery_overwrites_and_mutated_image_are_denied(self):
        _, receipt, note, write = self.delivered()
        for path in (self.repo / 'scripts/owned.py', self.package / 'run_state.json',
                     self.package / 'claims.json', self.workspace / 'outside.json'):
            changed = copy.deepcopy(write); changed['tool_input']['file_path'] = str(path)
            with self.assertRaises(ValueError): visual.guard(changed, self.workspace)
            self.assertFalse(path.exists())
        changed = copy.deepcopy(write); changed['agent_id'] = 'different-scorer'
        with self.assertRaises(ValueError): visual.guard(changed, self.workspace)
        self.page.write_bytes(PNG + b'changed')
        with self.assertRaisesRegex(ValueError, 'unchanged image'):
            visual.guard(write, self.workspace)

    def test_leaf_scoped_guard_refuses_unknown_type_and_identity_but_allows_text_reads(self):
        for value in (None, 'researcher'):
            with self.assertRaisesRegex(ValueError, 'actual host'):
                visual.guard({**self.read, 'agent_type': value}, self.workspace)
        self.delivered()
        text = {**self.read, 'tool_input': {'file_path': str(self.repo / 'CLAUDE.md')}}
        visual.guard(text, self.workspace)
        with self.assertRaisesRegex(ValueError, 'actual host'):
            visual.guard({**self.read, 'agent_id': None}, self.workspace)

    def test_exact_literal_failure_is_saved_and_stops_image_traversal(self):
        _, _, note, write = self.delivered()
        note.update(received=False, observed=image.MEDIA_LIMIT, literal_error=image.MEDIA_LIMIT,
                    objects=None, actions=None, text=None)
        write['tool_input']['content'] = json.dumps(note); self.save(write)
        with self.assertRaisesRegex(ValueError, 'unseen'):
            visual.guard(self.read, self.workspace)

    def test_annotations_cannot_follow_symlinks_or_smuggle_extra_report_fields(self):
        _, receipt, note, write = self.delivered()
        changed = copy.deepcopy(write); note['verdict'] = 'PASS'
        changed['tool_input']['content'] = json.dumps(note)
        with self.assertRaisesRegex(ValueError, 'exact public annotation schema'):
            visual.guard(changed, self.workspace)
        directory = Path(write['tool_input']['file_path']).parent
        outside = self.workspace / 'outside'; outside.mkdir()
        directory.parent.mkdir(parents=True); directory.symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'real workspace'):
            visual.guard(write, self.workspace)
        self.assertFalse(list(outside.iterdir()))

    def test_writing_after_advancing_images_does_not_establish_immediate_observation(self):
        _, _, _, write = self.delivered(); target = self.save(write)
        witness = self.package / 'visual-observation-receipts' / target.parent.name / target.name
        row = visual.load(witness); row['written_at'] = '2099-01-01T00:00:00+00:00'
        witness.write_text(json.dumps(row))
        # Simulate a skipped guard: an actual later Read precedes the late annotation.
        second = copy.deepcopy(self.read); second['tool_use_id'] = 'actual-read-before-late-note'
        image.record(second, self.workspace)
        note = {'received': True, 'observed': visual.load(target)['observed'],
                'observation': {'path': str(target), 'sha256': visual.digest(target)},
                'writer_receipt': {'path': str(witness), 'sha256': visual.digest(witness)}}
        self.assertIn('before the next actual image', visual.note_problems(self.repo, note,
            self.page.relative_to(self.repo), visual.digest(self.page))[0])

    def test_a_parent_annotation_without_the_actual_independent_write_cannot_advance(self):
        _, _, note, write = self.delivered()
        target = Path(write['tool_input']['file_path']); target.parent.mkdir(parents=True)
        target.write_text(json.dumps(note))
        with self.assertRaisesRegex(ValueError, 'previous actual image'):
            visual.guard(self.read, self.workspace)

    def test_coverage_is_exact_and_later_mutation_or_missing_write_is_rejected(self):
        _, _, _, write = self.delivered(); target = self.save(write)
        index = self.page.parent / 'index.json'
        index.write_text(json.dumps({'pages': [{'file': self.page.name, 'sha256': visual.digest(self.page),
                                             'samples': [{'frame': 0}, {'frame': 24}]}]}))
        packet = self.package / 'phone-packet.json'
        packet.write_text(json.dumps({'role': 'storyboard-critic', 'board': {'path': str(self.package / 'storyboard.json')},
            'public_visual_evidence': visual.CONTRACT,
            'phone_options': [{'motion_sequence': {'path': str(index), 'sha256': visual.digest(index)}}]}))
        result = visual.coverage(packet, target.parent)
        self.assertEqual(result['packet_sha256'], visual.digest(packet))
        row = result['sequences'][0]['pages'][0]
        self.assertEqual((row['first_frame'], row['last_frame']), (0, 24))
        self.assertFalse(visual.note_problems(self.repo, row, self.page.relative_to(self.repo), visual.digest(self.page)))
        target.write_text(target.read_text() + ' ')
        self.assertIn('changed', visual.note_problems(self.repo, row, self.page.relative_to(self.repo),
                                                    visual.digest(self.page))[0])

    def test_installed_hooks_preserve_models_and_settings_and_cannot_overwrite_foreign_leaves(self):
        settings = self.workspace / '.claude/settings.json'; settings.parent.mkdir()
        settings.write_text('{"model":"sonnet","permissions":{"deny":["send"]}}')
        before = settings.read_bytes()
        result = visual.install(visual.REPO, self.workspace)
        visual.check_installation(visual.REPO, self.workspace)
        self.assertEqual(before, settings.read_bytes()); self.assertFalse(result['permission_settings_changed'])
        self.assertEqual(visual.install(visual.REPO, self.workspace), result)
        critic = self.workspace / '.claude/agents/dispatch-visual-critic.md'
        body = critic.read_text()
        self.assertIn('model: claude-opus-5-5\neffort: high', body)
        self.assertIn('matcher: Read|Write', body); self.assertIn('PostToolUse:', body)
        critic.write_text(body + 'foreign edit\n')
        with self.assertRaisesRegex(ValueError, 'preserve the foreign'):
            visual.install(visual.REPO, self.workspace)
        self.assertTrue(critic.read_text().endswith('foreign edit\n'))


if __name__ == '__main__':
    unittest.main()
