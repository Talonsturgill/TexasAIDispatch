"""Read-only film learning: five-edition outcomes and exact recurring defect evidence."""
import argparse
import hashlib
import json
from datetime import date, datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / 'config/cinematic_learning.json'


def read(path):
    return json.loads(Path(path).read_text())


def stamp(path, logical=None):
    path = Path(path)
    try:
        name = str(path.resolve().relative_to(REPO.resolve()))
    except ValueError:
        name = path.name
    return {'path': logical or name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def report(runs, state_path=None):
    cfg = read(POLICY)
    states = {}
    paths = list(Path(runs).glob('*/run_state.json'))
    if state_path and Path(state_path).is_file():
        paths.append(Path(state_path))
    for path in paths:
        state = read(path)
        identity = str(state.get('run_id', ''))
        try:
            edition = date.fromisoformat(identity[:10])
        except ValueError:
            continue
        if edition < date.fromisoformat(cfg['effective_date']):
            continue
        if identity not in states or state.get('updated_at', '') >= states[identity][1].get('updated_at', ''):
            states[identity] = (path, state)
    rows = []
    for identity, (path, state) in sorted(states.items()):
        shipped = state.get('terminal_state') == 'shipped'
        card = read(path.with_name('report_card.json')) if path.with_name('report_card.json').is_file() else {}
        board = read(path.with_name('storyboard.json')) if path.with_name('storyboard.json').is_file() else {}
        elapsed = None
        try:
            elapsed = (datetime.fromisoformat(state['updated_at'].replace('Z', '+00:00')) -
                       datetime.fromisoformat(state['created_at'].replace('Z', '+00:00'))).total_seconds()
        except (KeyError, ValueError, TypeError):
            pass
        usage = state.get('usage', {})
        publication_mode = state.get('publication_mode')
        deferral = (publication_mode == 'bounded_creative_release' if publication_mode else
                    card.get('creative_deferral', card.get('bounded_release')))
        rows.append({'run_id': identity, 'shipped': shipped, 'state': state.get('terminal_state') or state.get('phase'),
                     'score': card.get('weighted_score', card.get('score')), 'usage': usage,
                     'first_panel_pass': card.get('ship') is True and usage.get('panel_rounds') == 1 and deferral is not True,
                     'corrections': usage.get('reboards', 0), 'artistic_deferral': deferral,
                     'publication_mode': publication_mode,
                     'art_profile_version': (board.get('art_direction') or {}).get('version'),
                     'modern_film_version': (board.get('film_direction') or {}).get('version'),
                     'fresh_generated_images': len((board.get('story_art') or {}).get('entries', [])),
                     'image_generation_attempts': usage.get('image_generations'),
                     'modern_floor_pass': (len(card.get('judges', [])) == 3 and all(all((j.get('modern_observations') or {}).get(k, {}).get('pass') is True
                                                    for k in ('first_frame', 'visual_progression', 'shot_variety', 'performed_turn', 'pace', 'closing_answer', 'finished_art'))
                                              for j in card.get('judges', [])) if card.get('judges') and board.get('film_direction') else None),
                     'elapsed_seconds': elapsed, 'account_tokens': None,
                     'state_evidence': stamp(path, 'runs/' + identity + '/run_state.json')})
    def bounded(values,limit):
        selected=[];completed=0
        for row in values:
            if row['shipped'] and completed>=limit:continue
            selected.append(row);completed+=row['shipped']
        return selected
    measured=bounded(rows,cfg['measurement_editions'])
    modern_rows=bounded([r for r in rows if r['run_id'][:10]>=cfg.get('modern_measurement_effective_date','9999-12-31')],cfg.get('modern_measurement_editions',5))
    return {'schema': 'dispatch-cinematic-learning/1', 'policy_sha256': stamp(POLICY)['sha256'],
            'target_shipped_editions': cfg['measurement_editions'], 'shipped_count': sum(r['shipped'] for r in measured), 'editions': measured,
            'modern_measurement_window': {'effective_date': cfg.get('modern_measurement_effective_date'),
               'target_editions': cfg.get('modern_measurement_editions'),
               'shipped_count': sum(r['shipped'] for r in modern_rows), 'editions': modern_rows},
            'status': 'Measured observations only. Future editions and unknown account token totals are not inferred.'}


def findings(value):
    if isinstance(value, dict):
        for key, child in value.items():
            # General score notes can praise a surface or contact. Only the
            # provider's explicit defect/finding fields enter failure recurrence.
            if key in ('blocking_defects', 'defects', 'findings') and isinstance(child, list):
                for item in child:
                    if isinstance(item, dict) or isinstance(item, str):
                        yield item
            elif isinstance(child, (dict, list)):
                yield from findings(child)
    elif isinstance(value, list):
        for child in value:
            yield from findings(child)


def category(item):
    text = json.dumps(item, ensure_ascii=False).casefold()
    groups = [('contact', ['intersect', 'detached', 'contact', 'floating']),
              ('recognition', ['unrecognizable', 'generic', 'placeholder', 'silhouette']),
              ('framing', ['occlud', 'crop', 'framing', 'off-screen', 'caption band']),
              ('motion', ['jolt', 'jerk', 'rush', 'idle', 'timing', 'pacing']),
              ('finish', ['surface', 'faceted', 'texture', 'unfinished', 'lighting']),
              ('sound', ['clipping', 'masking', 'sync', 'audio', 'foley'])]
    return next((name for name, words in groups if any(word in text for word in words)), None)


def recurring(runs, today, previous=None):
    cfg = read(POLICY)
    since = today - timedelta(days=cfg['defect_window_days'])
    buckets = {}
    for folder in sorted(Path(runs).iterdir()):
        try:
            edition = date.fromisoformat(folder.name[:10])
        except ValueError:
            continue
        if not folder.is_dir() or not since <= edition <= today:
            continue
        seen = set()
        paths = sorted(set(folder.glob('panel-round-*.json')) | set(folder.glob('**/*critic*.json')) |
                       set(folder.glob('**/*review-response.json')))
        for path in paths:
            try:
                content = read(path)
                # Provider text is retained exactly; parse its original JSON for extraction.
                if isinstance(content, dict) and 'candidates' in content:
                    text = ''.join(p.get('text', '') for c in content['candidates']
                                   for p in (c.get('content') or {}).get('parts', []))
                    content = json.loads(text)
            except (ValueError, OSError, TypeError):
                continue
            for item in findings(content):
                name = category(item)
                identity = json.dumps(item, sort_keys=True)
                if not name or identity in seen:
                    continue
                seen.add(identity)
                buckets.setdefault(name, []).append({'run_id': folder.name, 'original_finding': item,
                    'evidence': stamp(path, 'runs/' + folder.name + '/' + str(path.relative_to(folder)))})
    repeated = [{'category': name, 'distinct_editions': len({e['run_id'] for e in evidence}),
                 'evidence': evidence} for name, evidence in sorted(buckets.items())
                if len({e['run_id'] for e in evidence}) >= cfg['minimum_distinct_editions']]
    previous = previous or {}
    last = previous.get('last_engineering_decision')
    try:
        due = (today - date.fromisoformat(last['date'])).days >= cfg['engineering_interval_days']
    except (KeyError, TypeError, ValueError):
        due = True
    return {'schema': 'dispatch-cinematic-recurring-defects/1', 'as_of': str(today), 'since': str(since),
            'due': due and bool(repeated), 'last_engineering_decision': last,
            'max_shared_advances': cfg['max_shared_advances'], 'findings': repeated[:cfg['max_findings']],
            'instruction': 'Existing builder: reproduce exact failed evidence, consider one reusable correction, test it and prove it in the already reserved two-treatment comparison. Preserve all findings and cumulative resources. Record advance or skip; optional engineering never delays shipment.'}


def latest_decision(runs, experiments=None):
    """A clean next-day checkout inherits the durable cadence, never resets it."""
    decisions = []
    paths = list(Path(runs).glob('*/recurring-defects.json'))
    if experiments:
        paths += list(Path(experiments).glob('*/recurring-defects.json'))
    for path in paths:
        try:
            decision = read(path).get('last_engineering_decision')
            if decision and date.fromisoformat(decision['date']):
                decisions.append(decision)
        except (ValueError, OSError, KeyError, TypeError):
            continue
    return max(decisions, key=lambda row: row['date']) if decisions else None


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--runs', type=Path, default=REPO / 'runs')
    p.add_argument('--state', type=Path)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--defects-out', type=Path, required=True)
    p.add_argument('--today', type=date.fromisoformat, default=date.today())
    p.add_argument('--decision', choices=['advance', 'skip'])
    p.add_argument('--decision-note')
    p.add_argument('--proof', type=Path)
    a = p.parse_args()
    previous = read(a.defects_out) if a.defects_out.is_file() else {'last_engineering_decision': latest_decision(a.runs, REPO / 'experiments')}
    if a.decision:
        if not a.decision_note or not a.proof or not a.proof.is_file():
            p.error('engineering decision requires its actual note and retained proof file')
        previous['last_engineering_decision'] = {'date': str(a.today), 'decision': a.decision,
                                               'note': a.decision_note, 'proof': stamp(a.proof)}
    for dest, result in [(a.out, report(a.runs, a.state)), (a.defects_out, recurring(a.runs, a.today, previous))]:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(result, indent=2) + '\n')
    print('cinematic_learning: actual observations and bounded engineering packet recorded')


if __name__ == '__main__':
    main()
