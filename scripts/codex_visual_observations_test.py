"""Synthetic unit transports only; no test receipt is production image evidence."""
import base64
import copy
import json
from pathlib import Path
import tempfile
import unittest

import codex_visual_observations as visual

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1cAAAAASUVORK5CYII=')


class CodexVisualTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.packet = self.root / 'packet.json'
        self.index = self.root / 'index.json'
        self.guide = self.root / 'guide.md'
        self.guide.write_text('Actual unit guide text.\n')
        pages = []
        for n in range(2):
            path = self.root / f'page{n}.png'
            path.write_bytes(PNG)
            pages.append({'file': path.name, 'sha256': visual.digest(path),
                          'samples': [{'frame': n*30}, {'frame': n*30+29}]})
        self.index.write_text(json.dumps({'pages': pages}))
        self.data = {'role': 'picture', 'local_recovery': {'runtime': 'codex'},
                     'codex_visual_evidence': visual.CONTRACT,
                     'motion_sequence': {'path': str(self.index), 'sha256': visual.digest(self.index)},
                     'craft_readings': [{'path': str(self.guide), 'sha256': visual.digest(self.guide)}]}
        self.packet.write_text(json.dumps(self.data))
        self.records = []
        for n, page in enumerate(pages):
            code = 'const delivered = await tools.view_image(' + json.dumps(
                {'path': str(self.root/page['file']), 'detail': 'original'}) + '); image(delivered.image_url,"original");'
            payloads = [
                {'type': 'custom_tool_call', 'name': 'exec', 'call_id': f'call{n}', 'input': code},
                {'type': 'custom_tool_call_output', 'call_id': f'call{n}', 'output': [
                    {'type': 'input_image', 'image_url': 'data:image/png;base64,'+base64.b64encode(PNG).decode()}]},
                {'type': 'message', 'role': 'assistant', 'channel': 'commentary', 'content': [
                    {'type': 'output_text', 'text': visual.PREFIX+json.dumps({
                        'schema': visual.NOTE_SCHEMA, 'packet_sha256': visual.digest(self.packet),
                        'page': str(self.root/page['file']), 'image_sha256': page['sha256'],
                        'received': True, 'objects': ['small image'], 'actions': None, 'literal_text': None,
                        'observed': 'Unit fixture description only, never a production image review.'})}]}]
            for payload in payloads:
                self.records.append({'line': len(self.records)+2, 'event': {'type': 'response_item', 'payload': payload}})

    def analyze(self):
        return visual.analyze(self.packet, 'unit-reviewer-session', self.records)

    def test_exact_delivered_pixels_and_public_chronology(self):
        result = self.analyze()
        self.assertEqual(result['reviewer_session_id'], 'unit-reviewer-session')
        self.assertEqual([x['first_frame'] for x in result['pages']], [0, 30])
        self.assertFalse(result['planning_or_creative_approval'])
        self.assertEqual(result['audio_access'], 'not_established')

    def supplementary(self, path=None):
        path = path or self.root / 'native-crop.png'
        path.write_bytes(PNG)
        extra = copy.deepcopy(self.records[:3])
        extra[0]['event']['payload']['call_id'] = 'crop-call'
        extra[0]['event']['payload']['input'] = 'const delivered = await tools.view_image(' + json.dumps(
            {'path': str(path), 'detail': 'original'}) + '); image(delivered.image_url,"original");'
        extra[1]['event']['payload']['call_id'] = 'crop-call'
        text = extra[2]['event']['payload']['content'][0]
        note = json.loads(text['text'][len(visual.PREFIX):])
        note['page'] = str(path)
        text['text'] = visual.PREFIX + json.dumps(note)
        for n, row in enumerate(extra): row['line'] = len(self.records)+n+2
        return extra

    def test_extra_native_observations_retained_after_complete_chronology(self):
        self.records += self.supplementary()
        result = self.analyze()
        self.assertEqual(len(result['pages']), 2)
        self.assertEqual(len(result['supplemental_images']), 1)
        self.assertEqual(result['supplemental_images'][0]['call_id'], 'crop-call')
        self.assertFalse(result['planning_or_creative_approval'])

    def test_extra_cannot_replace_missing_or_reordered_required_page(self):
        extra = self.supplementary()
        for records in (self.records[:3]+extra, extra+self.records):
            for n, row in enumerate(records): row['line'] = n+2
            with self.assertRaisesRegex(ValueError, 'chronological page'):
                visual.analyze(self.packet, 'unit', records)

    def test_extra_wrong_pixels_outside_package_or_repeated_page_refuse(self):
        extra = self.supplementary()
        extra[1]['event']['payload']['output'][0]['image_url'] += 'AAAA'
        with self.assertRaises(ValueError):
            visual.analyze(self.packet, 'unit', self.records+extra)
        for path in (self.root/'page0.png', self.root.parent/(self.root.name+'-outside.png')):
            try:
                with self.assertRaisesRegex(ValueError, 'supplemental image'):
                    visual.analyze(self.packet, 'unit', self.records+self.supplementary(path))
            finally:
                if path.parent != self.root: path.unlink()

    def test_export_keeps_all_supplementary_source_lines_and_old_shape_unchanged(self):
        self.assertNotIn('supplemental_images', self.analyze())
        self.records += self.supplementary()
        rollout = self.root/'extra-rollout.jsonl'
        rows = [{'type': 'session_meta', 'payload': {'id': 'unit-reviewer-session'}}]
        rows += [r['event'] for r in self.records]
        rollout.write_text(''.join(json.dumps(x)+'\n' for x in rows))
        result = visual.coverage(self.packet, rollout, self.root/'extra-evidence')
        retained = json.loads(Path(result['public_events']['path']).read_text())
        self.assertEqual(len(retained['records']), 9)
        target = self.root/'extra-coverage.json'; target.write_text(json.dumps(result))
        self.assertEqual(visual.coverage_problems(self.packet, target), [])

    def with_checksum_correction(self):
        fixed = copy.deepcopy(self.records[2])
        text = self.records[2]['event']['payload']['content'][0]
        note = json.loads(text['text'][len(visual.PREFIX):])
        note['image_sha256'] = 'short-typing-error'
        text['text'] = visual.PREFIX+json.dumps(note)
        self.records.insert(3, fixed)
        for n, row in enumerate(self.records): row['line'] = n+2

    def test_checksum_only_correction_retains_original_line_without_new_image(self):
        self.with_checksum_correction()
        result = self.analyze()
        self.assertEqual(len(result['pages']), 2)
        self.assertEqual(result['metadata_corrections'][0]['original_image_sha256'], 'short-typing-error')
        self.assertEqual(result['pages'][0]['annotation_line'], self.records[3]['line'])

    def test_checksum_note_can_explain_metadata_but_cannot_append_new_facts(self):
        self.with_checksum_correction()
        text = self.records[3]['event']['payload']['content'][0]
        note = json.loads(text['text'][len(visual.PREFIX):])
        note['observed'] += ' ' + visual.CHECKSUM_CORRECTION_NOTE
        text['text'] = visual.PREFIX+json.dumps(note)
        self.assertEqual(len(self.analyze()['metadata_corrections']), 1)
        note['observed'] += ' An additional person acted here.'
        text['text'] = visual.PREFIX+json.dumps(note)
        with self.assertRaisesRegex(ValueError, 'lacks preceding actual image'):
            self.analyze()

    def test_supplemental_symlink_refuses(self):
        target = self.root/'crop-target.png'; target.write_bytes(PNG)
        link = self.root/'crop-link.png'; link.symlink_to(target)
        with self.assertRaisesRegex(ValueError, 'symbolic links'):
            visual.analyze(self.packet, 'unit', self.records+self.supplementary(link))

    def test_correction_cannot_change_facts_or_replace_an_unseen_image(self):
        self.with_checksum_correction()
        text = self.records[3]['event']['payload']['content'][0]
        note = json.loads(text['text'][len(visual.PREFIX):])
        for key, value in [('observed', 'Different facts about an image never actually seen.'),
                           ('received', False), ('page', str(self.root/'page1.png')),
                           ('packet_sha256', '0'*64)]:
            changed = dict(note, **{key: value})
            text['text'] = visual.PREFIX+json.dumps(changed)
            with self.assertRaisesRegex(ValueError, 'lacks preceding actual image'):
                self.analyze()
        text['text'] = visual.PREFIX+json.dumps(dict(note, image_sha256='still-incorrect'))
        with self.assertRaisesRegex(ValueError, 'exact packet'):
            self.analyze()

    def test_late_checksum_correction_after_another_image_refuses(self):
        self.with_checksum_correction()
        correction = self.records.pop(3)
        self.records.append(correction)
        for n, row in enumerate(self.records): row['line'] = n+2
        with self.assertRaisesRegex(ValueError, 'lacks preceding actual image'):
            self.analyze()

    def test_byte_changed_output_refuses_even_with_source_path(self):
        self.records[1]['event']['payload']['output'][0]['image_url'] = 'data:image/png;base64,'+base64.b64encode(PNG+b'changed').decode()
        with self.assertRaisesRegex(ValueError, 'delivered PNG bytes differ'):
            self.analyze()

    def test_parallel_call_before_public_annotation_refuses(self):
        self.records[2], self.records[3] = self.records[3], self.records[2]
        for n, record in enumerate(self.records):
            record['line'] = n+2
        with self.assertRaisesRegex(ValueError, 'annotation must precede'):
            self.analyze()

    def test_batched_image_output_refuses(self):
        self.records[1]['event']['payload']['output'] *= 2
        with self.assertRaisesRegex(ValueError, 'one actual delivered image'):
            self.analyze()

    def test_missing_page_and_reordered_pages_refuse(self):
        with self.assertRaises(ValueError):
            visual.analyze(self.packet, 'unit', self.records[:3])
        self.records = self.records[3:]+self.records[:3]
        for n, record in enumerate(self.records):
            record['line'] = n+2
        with self.assertRaisesRegex(ValueError, 'chronological page'):
            self.analyze()

    def test_private_channel_cannot_supply_public_observation(self):
        self.records[2]['event']['payload']['channel'] = 'analysis'
        with self.assertRaisesRegex(ValueError, 'annotation must precede'):
            self.analyze()

    def test_actual_public_commentary_phase_is_supported(self):
        for r in self.records:
            payload=r['event']['payload']
            if payload.get('type')=='message':payload['phase']=payload.pop('channel')
        self.assertEqual(len(self.analyze()['pages']),2)

    def test_current_guide_and_packet_binding_are_required(self):
        self.guide.write_text('changed')
        with self.assertRaisesRegex(ValueError, 'guide changed'):
            self.analyze()

    def test_old_packet_notes_cannot_approve_new_packet(self):
        self.data['new_binding'] = 'different'
        self.packet.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, 'exact packet'):
            self.analyze()

    def test_codex_explicit_contract_required(self):
        self.data.pop('local_recovery')
        self.packet.write_text(json.dumps(self.data))
        with self.assertRaisesRegex(ValueError, 'explicit owned local'):
            self.analyze()

    def test_export_retains_public_records_only_and_verifies(self):
        rollout = self.root/'unit-rollout.jsonl'
        rows = [{'type': 'session_meta', 'payload': {'id': 'unit-reviewer-session'}},
                {'type': 'response_item', 'payload': {'type': 'reasoning', 'private': 'never-retain-unit-sentinel'}}]
        rows += [r['event'] for r in self.records]
        rollout.write_text(''.join(json.dumps(x)+'\n' for x in rows))
        result = visual.coverage(self.packet, rollout, self.root/'evidence')
        coverage = self.root/'coverage.json'
        coverage.write_text(json.dumps(result))
        self.assertEqual(visual.coverage_problems(self.packet, coverage), [])
        public = Path(result['public_events']['path'])
        self.assertNotIn('never-retain-unit-sentinel', public.read_text())
        self.assertNotIn('dispatch_visual_observation_write', public.read_text())
        public.write_text(public.read_text()+' ')
        self.assertTrue(visual.coverage_problems(self.packet, coverage))

    def test_packet_scope_ignores_prior_packet_in_same_session(self):
        old = copy.deepcopy(self.records[:3])
        old[0]['event']['payload']['call_id'] = 'old-call'
        old[1]['event']['payload']['call_id'] = 'old-call'
        note = old[2]['event']['payload']['content'][0]
        value = json.loads(note['text'][len(visual.PREFIX):])
        value['packet_sha256'] = '0'*64
        note['text'] = visual.PREFIX+json.dumps(value)
        combined = old+self.records
        for n, r in enumerate(combined):
            r['line'] = n+2
        scoped = visual.packet_records(self.packet, combined)
        self.assertEqual(len(scoped), 6)

    def test_actual_fork_metadata_keeps_child_identity_and_excludes_parent_history(self):
        rollout=self.root/'fork.jsonl'
        rows=[{'type':'session_meta','payload':{'id':'child','timestamp':'2026-10-22T01:00:00Z',
                'source':{'subagent':{'thread_spawn':{'parent_thread_id':'parent'}}}}},
              {'type':'session_meta','payload':{'id':'parent','timestamp':'2026-10-21T01:00:00Z','source':'vscode'}},
              {'type':'response_item','timestamp':'2026-10-21T02:00:00Z',
               'payload':self.records[0]['event']['payload']}]
        rows += [dict(r['event'],timestamp='2026-10-22T02:00:00Z') for r in self.records]
        rollout.write_text(''.join(json.dumps(r)+'\n' for r in rows))
        session,records=visual.public_records(rollout)
        self.assertEqual(session,'child');self.assertEqual(len(records),6)
        self.assertEqual(visual.analyze(self.packet,session,records)['reviewer_session_id'],'child')
        rows[1]['payload']['id']='unrelated'
        rollout.write_text(''.join(json.dumps(r)+'\n' for r in rows))
        with self.assertRaisesRegex(ValueError,'one actual reviewer'):
            visual.public_records(rollout)


if __name__ == '__main__':
    unittest.main()
