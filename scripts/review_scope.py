"""Exact-evidence continuation for a positive full-film finished-art observation.

The provider report is never edited. This receipt records a derived story intersection,
not a provider timestamp. All other observations and every clause remain strict.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCHEMA = 'dispatch_positive_finished_art_scope/1'
NAME = 'finished-art-scope.json'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def derive(board, report, root, diagnosis):
    """Authenticate original evidence and derive exactly one permitted intersection."""
    from independent_review import evidence_problems, review_context
    import modern_film
    root = Path(root)
    film = root / ('film.mp4' if (root / 'film.mp4').exists() else 'dispatch.mp4')
    original = root / 'scorer-sound-01.json'
    errors = evidence_problems(report)
    if errors or not report.get('provider_evidence'):
        raise ValueError('original provider evidence rejected: ' + '; '.join(errors))
    if json.loads(original.read_text()) != report:
        raise ValueError('report does not equal original sealed file')
    if (report.get('ship') is not True or report.get('hard_fails') or report.get('defects')
            or not isinstance(report.get('score'), (int, float)) or not math.isfinite(report['score'])):
        raise ValueError('negative or incomplete verdict cannot use scope continuation')
    errors = modern_film.review_problems(board, report, sha(film), _scope=False)
    if errors != ['modern engagement or finish unproven: finished_art']:
        raise ValueError('only finished-art whole-film scope may continue: ' + '; '.join(errors))
    item = report['modern_observations'].get('finished_art')
    if not isinstance(item, dict):
        raise ValueError('original finished-art observation is missing')
    proof = report['provider_evidence']
    bounds = proof['bindings']
    from critic_gate import renderer_digest
    if bounds['renderer_sha256'] != renderer_digest(board):
        raise ValueError('original renderer changed')
    story_end = max(s['start_s'] + s['duration_s'] for s in board['scenes'])
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                    'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(film)], text=True))
    # Full story plus the unchanged required credit sign-off, never a partial-story clamp.
    if (board['runtime_s'] != story_end or board.get('credits_s') != 5
            or abs(duration - story_end - 5) > .001 or not board.get('credits')
            or item.get('pass') is not True or item.get('start_s') != 0
            or item.get('end_s') != duration or not modern_film.prose(item.get('observed'))):
        raise ValueError('not a positive exact whole-film observation with five-second credits')
    observed = item['observed'].lower()
    if (not any(w in observed for w in ('truck', 'tractor'))
            or not any(w in observed for w in ('facility', 'dock', 'warehouse'))
            or sum(w in observed for w in ('alpha', 'light', 'surface', 'ground')) < 2
            or len(board.get('story_art', {}).get('entries', [])) != 2):
        raise ValueError('finished-art finding lacks concrete current hero/support finish evidence')
    if (bounds['film_sha256'] != sha(film) or bounds['board_sha256'] != sha(root / 'storyboard.json')
            or proof['input']['board'] != board
            or bounds['claims_sha256'] != sha(root / 'claims.json')):
        raise ValueError('original film/board/claims or context changed')
    manifest = json.loads((root / 'render-manifest.json').read_text())
    if (manifest['film_sha256'] != sha(film) or manifest['board_sha256'] != bounds['board_sha256']):
        raise ValueError('render manifest does not bind unchanged film and board')
    if (diagnosis.get('verdict') != 'revise' or diagnosis.get('film_sha256') != sha(film)
            or diagnosis.get('board_sha256') != bounds['board_sha256']
            or diagnosis.get('original_provider_score', {}).get('sha256') != sha(original)
            or diagnosis.get('original_provider_score', {}).get('modern_finished_art') != item
            or diagnosis.get('blocking_defects') != ['modern engagement or finish unproven: finished_art']):
        raise ValueError('independent exact scope diagnosis absent or changed')
    for entry in board['story_art']['entries']:
        if sha(REPO / 'video-engine/public' / entry['file']) != entry['sha256']:
            raise ValueError('original artwork changed')
    files = {name: sha(root / name) for name in
             ('storyboard.json', 'claims.json', 'captions.json', 'words.json', 'mix.json',
              'vo_script.txt', 'render-manifest.json', 'scorer-sound-01.json')}
    return {'schema': SCHEMA, 'criterion': 'finished_art', 'original_interval': [0, duration],
            'derived_story_intersection': [0, story_end], 'credits_interval': [story_end, duration],
            'derivation': 'Intersection only; original provider timestamps, score, flags and prose unchanged.',
            'film_sha256': sha(film), 'files': files, 'original_report_sha256': sha(original),
            'raw_response_sha256': proof['response_sha256'], 'context_sha256': digest(review_context(proof)),
            'request_id': proof['request_id'], 'input_sha256': proof['input_sha256'],
            'prompt_sha256': proof['prompt_sha256'], 'host_failure_sha256': digest(proof['host_failure']),
            'diagnosis_sha256': sha(root / 'final-review-scope-diagnosis.json'), 'producer_sha256': sha(__file__),
            'credits_text_sha256': hashlib.sha256(board['credits'].encode()).hexdigest()}


def admits(board, report, film_sha):
    """Find exact local or archived evidence; absent/stale evidence never grants passage."""
    roots = [REPO / 'out/dispatch'] + sorted((REPO / 'runs').glob('*'))
    for root in roots:
        receipt = root / NAME
        if not receipt.exists():
            continue
        try:
            data = json.loads(receipt.read_text())
            if data.get('film_sha256') != film_sha:
                continue
            original = json.loads((root / 'scorer-sound-01.json').read_text())
            diagnosis = json.loads((root / 'final-review-scope-diagnosis.json').read_text())
            if original == report and data == derive(board, report, root, diagnosis):
                return True
        except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
            continue
    return False



def privacy_problems(value):
    """Technical provenance is allowed; account, routing and owner-message fields are not."""
    forbidden = {'recipient', 'recipients', 'to', 'cc', 'bcc', 'gmail_draft_id',
                 'gmail_message_id', 'gmail_thread_id', 'owner_message', 'owner_text',
                 'api_key', 'access_token', 'refresh_token', 'credential', 'password'}
    errors = []
    def walk(item):
        if isinstance(item, dict):
            for key, child in item.items():
                if key.lower() in forbidden and not (key.lower() == 'to' and isinstance(child, str) and re.fullmatch(r's[0-9]+', child)):
                    errors.append('private account/routing/credential field: ' + key)
                walk(child)
        elif isinstance(item, list):
            for child in item: walk(child)
        elif isinstance(item, str):
            if re.search(r'-----BEGIN .*PRIVATE KEY-----|(?:sk-[A-Za-z0-9]{20,})|ya29\.[A-Za-z0-9_-]+', item):
                errors.append('credential-shaped secret')
            # The only admitted contact addresses are the retained corporate press contacts.
            for address in re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', item):
                if not address.lower().endswith('@volvo.com'):
                    errors.append('non-public-source contact address')
    walk(value)
    return errors


def package(source, destination):
    """Copy original sealed technical evidence and receipt; refuse different existing bytes."""
    source, destination = Path(source), Path(destination)
    receipt = source / NAME
    if not receipt.exists():
        return
    board = json.loads((source / 'storyboard.json').read_text())
    report = json.loads((source / 'scorer-sound-01.json').read_text())
    diagnosis = json.loads((source / 'final-review-scope-diagnosis.json').read_text())
    if json.loads(receipt.read_text()) != derive(board, report, source, diagnosis):
        raise ValueError('scope package lacks authenticated exact receipt')
    for value in (report, diagnosis):
        if privacy_problems(value):
            raise ValueError('scope evidence contains private account, routing or credential data')
    names = [NAME, 'scorer-sound-01.json', 'final-review-scope-diagnosis.json']
    # Validate the entire copy set before any write. Ordinary delivery supplies the bound
    # board/claims/captions/words/mix/manifest and permanent dispatch.mp4 separately.
    for name in names:
        target = destination / name
        if target.exists() and sha(target) != sha(source / name):
            raise ValueError('refusing changed original scope evidence')
    destination.mkdir(parents=True, exist_ok=True)
    for name in names:
        shutil.copyfile(source / name, destination / name)
        if sha(source / name) != sha(destination / name):
            raise ValueError('scope archive copy changed')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out', type=Path, default=REPO / 'out/dispatch')
    p.add_argument('--verify', action='store_true')
    a = p.parse_args()
    board = json.loads((a.out / 'storyboard.json').read_text())
    report = json.loads((a.out / 'scorer-sound-01.json').read_text())
    diagnosis = json.loads((a.out / 'final-review-scope-diagnosis.json').read_text())
    data = derive(board, report, a.out, diagnosis)
    if a.verify:
        if json.loads((a.out / NAME).read_text()) != data:
            raise ValueError('scope receipt differs from exact derivation')
    else:
        (a.out / NAME).write_text(json.dumps(data, indent=2) + '\n')
    print('Original positive whole-film observation retained; exact story intersection recorded.')


if __name__ == '__main__':
    main()
