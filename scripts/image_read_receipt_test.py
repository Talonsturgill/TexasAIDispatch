"""Actual hook payload evidence stays distinct from model visibility and creative judgment."""
import base64
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import image_read_receipt as hook

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC')


class ImageDelivery(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.workspace = Path(self.temp.name).resolve()
        self.repo = self.workspace / 'Dispatch'
        self.repo.mkdir()
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True, capture_output=True)
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'add', 'origin', hook.REMOTE], check=True)
        self.image = self.repo / 'out/dispatch/motion/sequence-000.png'
        self.image.parent.mkdir(parents=True)
        self.image.write_bytes(PNG)
        self.payload = {'hook_event_name': 'PostToolUse', 'tool_name': 'Read',
                        'session_id': 'fixture-session-private', 'tool_use_id': 'fixture-tool-private',
                        'cwd': str(self.workspace), 'tool_input': {'file_path': str(self.image)},
                        'tool_response': {'type': 'image', 'file': {
                            'base64': base64.b64encode(PNG).decode(), 'type': 'image/png',
                            'originalSize': len(PNG)}}}

    def receipts(self):
        return list((self.repo / 'out/dispatch/image-tool-delivery').glob('*.json'))

    def test_records_returned_bytes_not_visibility_or_creative_approval(self):
        result = hook.record(self.payload, self.workspace)
        self.assertEqual(result['hookSpecificOutput']['hookEventName'], 'PostToolUse')
        raw = self.receipts()[0].read_text(); record = json.loads(raw)
        self.assertTrue(record['returned_image'])
        self.assertEqual(record['source_sha256'], hook.sha(PNG))
        self.assertEqual(record['returned_sha256'], hook.sha(PNG))
        self.assertTrue(record['byte_identical_to_file'])
        self.assertEqual(record['source_dimensions'], {'width': 1, 'height': 1})
        self.assertEqual(record['model_visibility'], 'not_established')
        self.assertFalse(record['creative_approval'])
        for private in ('fixture-session-private', 'fixture-tool-private', 'base64', str(self.workspace)):
            self.assertNotIn(private, raw)
        self.assertNotIn('permissionDecision', json.dumps(result))
        self.assertNotIn('decision', result)
        context = result['hookSpecificOutput']['additionalContext']
        self.assertIn('brief public image description in ordinary assistant text', context)
        self.assertIn('visible objects, actions or text', context)

    def test_later_placeholder_cannot_rewrite_the_original_image_event(self):
        hook.record(self.payload, self.workspace)
        before = self.receipts()[0].read_bytes()
        changed = copy.deepcopy(self.payload); changed['tool_response'] = hook.MEDIA_LIMIT
        with self.assertRaisesRegex(ValueError, 'cannot be rewritten'):
            hook.record(changed, self.workspace)
        self.assertEqual(before, self.receipts()[0].read_bytes())
        hook.record(self.payload, self.workspace)
        self.assertEqual(before, self.receipts()[0].read_bytes())

    def test_a_new_literal_failure_is_retained_separately_without_a_grade(self):
        hook.record(self.payload, self.workspace)
        failed = copy.deepcopy(self.payload)
        failed.update(tool_use_id='new-actual-event', tool_response=hook.MEDIA_LIMIT)
        result = hook.record(failed, self.workspace)
        records = [json.loads(p.read_text()) for p in self.receipts()]
        self.assertEqual(len(records), 2)
        row = next(r for r in records if not r['returned_image'])
        self.assertEqual(row['literal_tool_error'], hook.MEDIA_LIMIT)
        self.assertNotIn('returned_sha256', row)
        self.assertFalse(row['creative_approval'])
        context = result['hookSpecificOutput']['additionalContext']
        self.assertIn('Read returned the literal media-limit error', context)
        self.assertIn('return partial coverage', context)
        self.assertNotIn('permissionDecision', json.dumps(result))

    def test_readonly_test_artifacts_are_marked_and_do_not_create_an_edition(self):
        target = self.repo / 'out/environment-test/probe.png'; target.parent.mkdir(parents=True)
        target.write_bytes(PNG)
        payload = copy.deepcopy(self.payload); payload['tool_input']['file_path'] = str(target)
        hook.record(payload, self.workspace)
        records = list((target.parent / 'image-tool-delivery').glob('*.json'))
        self.assertTrue(json.loads(records[0].read_text())['reference_only'])
        self.assertFalse((self.repo / 'out/dispatch/run_state.json').exists())

    def test_ignores_private_foreign_nonartifact_and_nonimage_reads(self):
        for path in (self.repo / 'out/dispatch/private/frame.png',
                     self.repo / 'knowledge/frame.png', self.workspace / 'outside.png'):
            payload = copy.deepcopy(self.payload); payload['tool_input']['file_path'] = str(path)
            self.assertIsNone(hook.record(payload, self.workspace))
        for response in ({'type': 'text', 'file': {'content': 'ordinary text'}}, 'not an image'):
            payload = copy.deepcopy(self.payload); payload['tool_response'] = response
            self.assertIsNone(hook.record(payload, self.workspace))
        subprocess.run(['git', '-C', str(self.repo), 'remote', 'set-url', 'origin',
                        'https://github.com/Talonsturgill/TexasAIDocket'], check=True)
        self.assertIsNone(hook.record(self.payload, self.workspace))
        self.assertFalse(self.receipts())

    def test_symlinks_and_parent_traversal_cannot_redirect_evidence(self):
        linked = self.image.with_name('link.png'); linked.symlink_to(self.image)
        for path in (linked, self.image.parent / '..' / 'motion' / self.image.name):
            payload = copy.deepcopy(self.payload); payload['tool_input']['file_path'] = str(path)
            self.assertIsNone(hook.record(payload, self.workspace))
        outside = self.workspace / 'outside'; outside.mkdir()
        (self.repo / 'out/dispatch/image-tool-delivery').symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'owned artifact package'):
            hook.record(self.payload, self.workspace)
        self.assertFalse(list(outside.iterdir()))

    def test_malformed_image_payload_is_not_recorded_as_an_image(self):
        for data in ('not base64!', base64.b64encode(b'not a PNG').decode()):
            payload = copy.deepcopy(self.payload); payload['tool_response']['file']['base64'] = data
            with self.assertRaises(ValueError):
                hook.record(payload, self.workspace)
        self.assertFalse(self.receipts())

    def test_oversized_source_is_ignored_before_loading_its_pixels(self):
        with self.image.open('r+b') as stream:
            stream.truncate(10 * 1024 * 1024 + 1)
        self.assertIsNone(hook.record(self.payload, self.workspace))
        self.assertFalse(self.receipts())

    def test_actual_cli_receives_post_tool_payload_but_no_permission_decision(self):
        done = subprocess.run([sys.executable, hook.__file__, '--workspace', str(self.workspace)],
                              input=json.dumps(self.payload), capture_output=True, text=True)
        self.assertEqual(done.returncode, 0, done.stderr)
        result = json.loads(done.stdout)
        self.assertEqual(set(result), {'hookSpecificOutput'})
        self.assertIn('not model visibility', result['hookSpecificOutput']['additionalContext'])
        self.assertEqual(len(self.receipts()), 1)


if __name__ == '__main__':
    unittest.main()
