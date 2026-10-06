"""Offline admission mutations. Fixture approvals never authorize production media."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import action_admission as a
import critic_gate
import daily_production as d
from daily_production_test import fixture, selection_fixture, fixture_review


class AdmissionTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.src = self.root / 'video-engine/src'
        for name in ('lib/cinema/CinematicStage.tsx', 'lib/cinema/Studio.tsx', 'lib/cinema/ProofContext.tsx',
                     'lib/cinema/projection.ts', 'lib/direction.ts'):
            p = self.src / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('export const Fixture = () => null;')
        self.module = self.src / 'Mechanism.tsx'
        self.module.write_text('export const Mechanism = () => <mesh />;')
        self.renderer = self.src / 'Episode.tsx'
        self.renderer.write_text('''import {Mechanism} from './Mechanism';
import {CinematicStage} from './lib/cinema/CinematicStage';
export const Episode = ({scene}) => <><CinematicStage><Mechanism /></CinematicStage><div>{scene.production_disclosure}</div></>;''')
        (self.src / 'Dispatch.tsx').write_text('''import {Episode} from './Episode';
if (cinematic_template === 'fixture-action-v1') {return <Episode />;}''')
        self.board, self.claims = fixture()
        self.selected = selection_fixture()['selected']
        self.proposal = dict(id='fixture-action-v1', module={'path': 'video-engine/src/Mechanism.tsx', 'sha256': d.digest(self.module)},
                             exports=['Mechanism'], source_urls=['https://example.org/source'], claim_ids=['c1'],
                             disclosure='Illustration of the sourced process')
        for key in ('visible_action', 'consequence', 'limits', 'source_basis'):
            self.proposal[key] = 'Synthetic fixture description of the source supported explanatory action.'
        self.board.update(cinematic_template='fixture-action-v1', action_proposals=[self.proposal])
        self.board['cinema'] = {'dimensional_scene_ids': ['action'], 'hero_scene_id': 'action'}
        self.board['scenes'][0].update(production_action=self.proposal['id'], production_disclosure=self.proposal['disclosure'], visual_events=[{}, {}, {}])
        self.selected['action_proposals'] = copy.deepcopy(self.board['action_proposals'])
        for row in self.selected['filmability']['action_support']:
            row.update(medium='source-backed-action', action_id=self.proposal['id'], disclosure=self.proposal['disclosure'])
        self.claims['claims'][0]['url'] = self.proposal['source_urls'][0]
        self.cp = self.root / 'claims.json'
        self.cp.write_text(json.dumps(self.claims))
        self.report = fixture_review(self.board, self.cp)
        self.report['action_reviews'] = [dict(action_id=self.proposal['id'], module_sha256=self.proposal['module']['sha256'],
            source_claims_sha256=a.source_claims_digest(self.proposal), verdict='pass', blocking_defects=[],
            code_observations={k: 'Synthetic concrete code observation for this test fixture only.' for k in
                               ('source_fidelity', 'visible_action', 'consequence', 'disclosure', 'limits')})]
        for obj in (d, critic_gate):
            patcher = patch.object(obj, 'REPO', self.root)
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_valid_source_backed_action_and_review(self):
        self.assertEqual([], d.candidate_problems(self.selected))
        self.assertEqual([], a.proposal_problems(self.board, self.selected, self.claims))
        self.assertEqual([], a.board_problems(self.board))
        self.assertEqual([], d.review_problems(self.board, self.report))

    def test_missing_stale_and_escaping_module(self):
        for path in ('video-engine/src/missing.tsx', '../outside.tsx', '/tmp/outside.tsx'):
            b = copy.deepcopy(self.board)
            b['action_proposals'][0]['module']['path'] = path
            self.assertTrue(a.proposal_problems(b))
        self.module.write_text('changed')
        self.assertTrue(a.board_problems(self.board))
        self.module.unlink()
        outside = self.root / 'outside.tsx'
        outside.write_text('outside')
        self.module.symlink_to(outside)
        self.proposal['module']['sha256'] = d.digest(outside)
        self.assertTrue(a.proposal_problems(self.board))

    def test_bound_sources_claims_and_unique_single_action(self):
        for mutate in (lambda p: p.update(id='document-accumulation-v1'),
                       lambda p: p.update(source_urls=['https://example.org/unfetched']),
                       lambda p: p.update(disclosure='Actual staff interface'),
                       lambda p: p.update(claim_ids=['missing'])):
            b = copy.deepcopy(self.board)
            mutate(b['action_proposals'][0])
            self.assertTrue(a.proposal_problems(b, self.selected, self.claims))
        self.claims['claims'][0]['verdict'] = 'UNVERIFIED'
        self.assertTrue(a.proposal_problems(self.board, self.selected, self.claims))
        self.board['action_proposals'] *= 2
        self.assertTrue(a.proposal_problems(self.board))

    def test_uncalled_action_missing_stage_and_disclosure_fail(self):
        original = self.renderer.read_text()
        for source in (original.replace('<Mechanism />', ''),
                       original.replace('<Mechanism />', '/* <Mechanism /> */'),
                       original.replace('<CinematicStage>', '<div>').replace('</CinematicStage>', '</div>'),
                       original.replace('{scene.production_disclosure}', '')):
            self.renderer.write_text(source)
            self.assertTrue(a.board_problems(self.board))
        self.renderer.write_text(original)
        self.board['cinema']['hero_scene_id'] = 'answer'
        self.assertTrue(a.board_problems(self.board))
        self.board['cinematic_template'] = 'unregistered'
        self.assertTrue(a.board_problems(self.board))

    def test_independent_review_exact_bindings_required(self):
        for mutate in (lambda r: r.pop('action_reviews'),
                       lambda r: r.update(reviewer_identity='test-director'),
                       lambda r: r['action_reviews'][0].update(module_sha256='stale'),
                       lambda r: r['action_reviews'][0].update(source_claims_sha256='stale'),
                       lambda r: r['action_reviews'][0].update(blocking_defects=['unresolved']),
                       lambda r: r['action_reviews'][0].update(code_observations={})):
            report = copy.deepcopy(self.report)
            mutate(report)
            self.assertTrue(d.review_problems(self.board, report))
        changed = copy.deepcopy(self.board)
        changed['action_proposals'][0]['limits'] += ' Changed source boundary.'
        self.assertNotEqual(d.story_digest(changed), d.story_digest(self.board))
        before = critic_gate.renderer_digest(self.board)
        self.module.write_text(self.module.read_text() + '\n// changed')
        self.assertNotEqual(before, critic_gate.renderer_digest(self.board))

    def test_global_context_edit_invalidates_independent_renderer_binding(self):
        before = critic_gate.renderer_digest(self.board)
        context = self.src / 'lib/cinema/ProofContext.tsx'
        context.write_text('export const Fixture = ({children}) => <div>{children}</div>;')
        self.assertNotEqual(before, critic_gate.renderer_digest(self.board))

    def test_selection_mismatch_rejected_before_voice(self):
        bp = self.root / 'storyboard.json'
        bp.write_text(json.dumps(self.board))
        (self.root / 'storyboard_critic.json').write_text(json.dumps(self.report))
        selected = selection_fixture()
        selected['selected'] = self.selected
        selected['selected']['action_proposals'][0]['limits'] += ' Different selection.'
        (self.root / 'story_selection.json').write_text(json.dumps(selected))
        with patch.object(d, 'catalog_problems', return_value=[]):
            errors = d.pre_voice_problems(bp, self.cp)
        self.assertIn('board action proposals differ', ' '.join(errors))

    def test_valid_pre_voice_retains_concept_renderer_and_claims_gates(self):
        bp = self.root / 'storyboard.json'
        bp.write_text(json.dumps(self.board))
        selected = selection_fixture()
        selected['selected'] = self.selected
        (self.root / 'story_selection.json').write_text(json.dumps(selected))
        self.report.update(verdict='pass', concept_sha256=critic_gate.concept_digest(self.board),
                           renderer_sha256=critic_gate.renderer_digest(self.board), reviewed_at='fixture time',
                           weakest_frame='Synthetic fixture frame observation')
        rp = self.root / 'storyboard_critic.json'
        with patch.object(d, 'catalog_problems', return_value=[]), patch('quality_contract.plan_problems', return_value=[]):
            rp.write_text(json.dumps(self.report))
            self.assertEqual([], d.pre_voice_problems(bp, self.cp))
            for key in ('concept_sha256', 'renderer_sha256'):
                changed = {**self.report, key: 'stale'}
                rp.write_text(json.dumps(changed))
                self.assertTrue(d.pre_voice_problems(bp, self.cp), key)
            rp.write_text(json.dumps(self.report))
            self.claims['claims'][0]['verdict'] = 'UNVERIFIED'
            self.cp.write_text(json.dumps(self.claims))
            self.assertTrue(d.pre_voice_problems(bp, self.cp))


if __name__ == '__main__':
    unittest.main()
