"""Reject stale, unused and uncharged source art; retain the historical raster lane."""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import authored_story_art as art
import render_manifest as manifest
import story_art


class AuthoredArtTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        (self.repo / 'config').mkdir()
        (self.repo / 'config/authored_story_art.json').write_bytes(art.REPO.joinpath('config/authored_story_art.json').read_bytes())
        self.root = self.repo / 'out/dispatch'; self.root.mkdir(parents=True)
        self.board_path = self.root / 'storyboard.json'
        self.state_path = self.root / 'run_state.json'
        self.date = datetime.now(timezone.utc).astimezone(__import__('zoneinfo').ZoneInfo('America/New_York')).date().isoformat()
        self.edition = self.date + '-claude-pilot'
        event = {'kind': 'reserved', 'resources': {'reboards': 1},
                 'at': (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()}
        self.state = {'run_id': self.edition, 'events': [event]}
        self.state_path.write_text(json.dumps(self.state))
        (self.root / 'claims.json').write_text('{"claims":[]}')
        self.requests = []
        declarations = []
        for role in ('hero', 'support'):
            name = role.title() + 'Rig'
            file = 'video-engine/src/modern/episodes/' + self.edition + '/' + name + '.tsx'
            p = self.repo / file; p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('export function ' + name + '(){return <svg><path d="M0 0 L1 1"/></svg>}')
            self.requests.append({'id': role, 'role': role, 'file': file, 'export': name,
                                  'scene_ids': ['s1'], 'prompt': ' '.join(['finished'] * 32),
                                  'purpose': 'A source-specific object performs the current task visibly.',
                                  'source_limit': 'Illustration explains the sourced action without asserting unreported results.',
                                  'action_uses': [{'scene_id': 's1', 'event_id': 'e1', 'view': 'work',
                                                   'action_id': 'perform', 'subject_ids': ['subject']}]})
            declarations.append({'role': role, 'module': file, 'export': name, 'views': ['work']})
        module = 'video-engine/src/modern/Pilot.tsx'
        (self.repo / module).write_text("import {HeroRig} from './episodes/" + self.edition + "/HeroRig';\n"
                                       "import {SupportRig} from './episodes/" + self.edition + "/SupportRig';\n"
                                       'export function Pilot(){return <><HeroRig/><SupportRig/></>}')
        registry = {'episodes': {'pilot': {'module': module, 'assets': [r['file'] for r in self.requests],
                                          'authored_art': declarations,
                                          'narration_views': {'work': {'action_ids': ['perform'], 'subject_ids': ['subject']}}}}}
        (self.repo / 'config/modern_episode_registry.json').write_text(json.dumps(registry))
        self.board = {'date': self.date, 'scenes': [{'id': 's1', 'visual_events': [{'id': 'e1'}]}],
                      'film_direction': {'episode': 'pilot', 'shots': [{'scene_id': 's1', 'view': 'work'}]},
                      'story_art': {'version': art.VERSION, 'runtime': 'claude-sonnet-v1',
                                    'edition_id': self.edition, 'requests': self.requests}}
        self.board_path.write_text(json.dumps(self.board))
        art.record(self.board_path, self.state_path, self.repo)
        self.board = art.read(self.board_path)

    def test_valid_actual_source_receipts(self):
        self.assertEqual([], art.problems(self.board, self.repo))
        self.assertEqual([], art.charge_problems(self.board, self.root))
        self.assertEqual([], story_art.problems(self.board, self.repo))

    def inventory(self):
        """The board's native_media rows for its two authored modules, as the builder writes them."""
        board = json.loads(json.dumps(self.board))
        board['native_media'] = [{'request_id': e['request_id'], 'file': e['file'], 'sha256': e['sha256'],
                                  'basis': 'Disclosed original illustration of the reported relationship, not footage.'}
                                 for e in board['story_art']['entries']]
        return board

    def test_authored_pictures_bind_to_their_receipts_for_the_critic_renderer_and_manifest(self):
        public = self.repo / 'video-engine/public'; public.mkdir(parents=True)
        board = self.inventory()
        found = manifest.native_media_paths(board, public)
        self.assertEqual({(self.repo / r['file']).resolve() for r in self.requests}, set(found))
        with mock.patch.object(manifest, 'PUBLIC', public.resolve()), mock.patch.object(manifest, 'REPO', self.repo.resolve()), \
                mock.patch.object(manifest.native_media_paths, '__defaults__', (public.resolve(),)):
            board_file = self.root / 'inventory-board.json'; board_file.write_text(json.dumps(board))
            first = manifest.generated_media_sha256(board_file)
            (self.repo / self.requests[0]['file']).write_text((self.repo / self.requests[0]['file']).read_text() + ' ')
            with self.assertRaisesRegex(ValueError, 'changed after their receipt'):
                manifest.generated_media_sha256(board_file)
        self.assertTrue(first)

    def test_authored_inventory_that_differs_from_its_receipts_is_rejected(self):
        public = self.repo / 'video-engine/public'; public.mkdir(parents=True)
        board = self.inventory()
        board['native_media'][0]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'inventory row differs'):
            manifest.native_media_paths(board, public)
        board = self.inventory(); board['native_media'] = board['native_media'][:1]
        with self.assertRaisesRegex(ValueError, 'inventory row differs'):
            manifest.native_media_paths(board, public)
        board = self.inventory(); board['story_art']['entries'] = board['story_art']['entries'][:1]
        with self.assertRaisesRegex(ValueError, 'both recorded source receipts'):
            manifest.native_media_paths(board, public)

    def test_authored_inventory_rejects_extra_duplicate_and_traversing_rows(self):
        public = self.repo / 'video-engine/public'; public.mkdir(parents=True)
        board = self.inventory()
        board['native_media'].append({'request_id': 'extra', 'file': 'video-engine/src/x.tsx', 'sha256': '0' * 64, 'basis': 'x' * 40})
        with self.assertRaisesRegex(ValueError, 'unknown, missing or duplicate'):
            manifest.native_media_paths(board, public)
        board = self.inventory(); board['native_media'].append(dict(board['native_media'][0]))
        with self.assertRaisesRegex(ValueError, 'unknown, missing or duplicate'):
            manifest.native_media_paths(board, public)
        (self.repo / '.env').write_text('k')
        board = self.inventory()
        board['native_media'].append({'request_id': 'e', 'file': 'evidence/../../../.env',
                                      'sha256': manifest.file_sha256(self.repo / '.env'), 'basis': 'x' * 40})
        with self.assertRaisesRegex(ValueError, 'traverses public'):
            manifest.native_media_paths(board, public)

    def test_historical_raster_boards_still_use_the_public_texture_rules(self):
        public = self.repo / 'video-engine/public'; public.mkdir(parents=True)
        board = {'date': self.date, 'story_art': {'version': 'fresh-story-art-v1'},
                 'native_media': [{'file': 'generated/story-art/%s/x.png' % self.date, 'request_id': 'r', 'sha256': 'a' * 64}]}
        with self.assertRaises(ValueError):
            manifest.native_media_paths(board, public)

    def test_record_is_idempotent(self):
        before = self.board_path.read_bytes()
        art.record(self.board_path, self.state_path, self.repo)
        self.assertEqual(before, self.board_path.read_bytes())

    def test_missing_explicit_runtime(self):
        self.board['story_art']['runtime'] = 'codex'
        self.assertTrue(art.problems(self.board, self.repo))

    def test_modified_source_is_rejected(self):
        (self.repo / self.requests[0]['file']).write_text('export const HeroRig=()=>null')
        self.assertTrue(art.problems(self.board, self.repo))
        with self.assertRaisesRegex(ValueError, 'newly charged'):
            art.record(self.board_path, self.state_path, self.repo)

    def test_unused_export_is_rejected(self):
        registry_path = self.repo / 'config/modern_episode_registry.json'
        data = art.read(registry_path); data['episodes']['pilot']['authored_art'] = []
        registry_path.write_text(json.dumps(data))
        self.assertTrue(art.problems(self.board, self.repo))

    def test_import_without_a_performed_use_is_rejected(self):
        path = self.repo / 'video-engine/src/modern/Pilot.tsx'
        path.write_text(path.read_text().replace('<HeroRig/>', ''))
        self.assertTrue(art.problems(self.board, self.repo))

    def test_retained_original_bytes_cannot_be_removed(self):
        row = self.board['story_art']['entries'][0]
        (self.root / row['original_source']).unlink()
        self.assertTrue(art.charge_problems(self.board, self.root))

    def test_delivery_package_retains_verified_source_originals(self):
        destination = self.repo / 'runs' / self.edition
        art.package(self.board_path, destination, self.repo)
        for name in ('claims.json', 'run_state.json'):
            (destination / name).write_bytes((self.root / name).read_bytes())
        self.assertEqual([], art.charge_problems(self.board, destination))

    def test_unperformed_view_is_rejected(self):
        self.board['story_art']['requests'][0]['action_uses'][0]['view'] = 'decorative'
        self.assertTrue(art.problems(self.board, self.repo))

    def test_missing_import_is_rejected(self):
        path = self.repo / 'video-engine/src/modern/Pilot.tsx'
        path.write_text(path.read_text().replace('/HeroRig', '/MissingRig'))
        self.assertTrue(art.problems(self.board, self.repo))

    def test_source_claim_change_is_rejected(self):
        (self.root / 'claims.json').write_text('{"claims":[{"id":"changed"}]}')
        self.assertTrue(art.charge_problems(self.board, self.root))

    def test_charge_after_source_creation_is_rejected(self):
        for row in self.board['story_art']['entries']:
            event = row['charge']['event']; event['at'] = (datetime.now(timezone.utc) + timedelta(minutes=2)).isoformat()
            row['charge']['event_sha256'] = art.fingerprint(event)
        self.assertTrue(art.problems(self.board, self.repo))

    def test_prior_edition_reuse_is_rejected(self):
        past = self.repo / 'runs/previous'; past.mkdir(parents=True)
        (past / 'storyboard.json').write_text(json.dumps(self.board))
        self.assertTrue(art.problems(self.board, self.repo))

    def test_historical_raster_route_stays_selected(self):
        board = {'date': '2026-10-08', 'story_art': {'version': 'fresh-story-art-v1'}}
        self.assertFalse(art.selected(board))
        self.assertIn('ImageGen', ';'.join(story_art.request_problems(board)))


if __name__ == '__main__':
    unittest.main()
