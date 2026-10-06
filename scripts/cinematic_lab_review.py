"""Normal audiovisual-provider A/B observation for owner-requested R&D.

Three separate responses, alternate order, exact native bytes and original findings.
This is not independent-provider host recovery or production scoring/approval.
"""
import argparse
import hashlib
import json
import os
import re
import time
import uuid
from pathlib import Path
import requests
from audiovisual_review import media_part, remove_upload, streamed_response
from cinematic_lab import change
from production_quality import policy

REPO = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def parsed_result(raw):
    text = ''.join(p.get('text', '') for p in raw['candidates'][0]['content']['parts'])
    normalizations = []
    # An observed provider emitted 06.2 and 08.0 as timestamps. Their numeric
    # value is unambiguous; preserve the raw bytes and record this transport fix.
    def timestamp(match):
        token = match.group(2)
        value = str(float(token))
        normalizations.append({'field': match.group(1), 'original_numeric_token': token, 'parsed_numeric_value': value})
        return '"' + match.group(1) + '": ' + value
    corrected = re.sub(r'"(start_s|end_s)"\s*:\s*(0[0-9]+(?:\.[0-9]+)?)(?=\s*[,}])', timestamp, text)
    return json.loads(corrected), normalizations


def review(root, a, b, sources, ledger=None):
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    ledger = Path(ledger) if ledger else root / 'ledger.json'
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise ValueError('audiovisual provider credential unavailable; no observation invented')
    guides = [REPO / 'config/dispatch_rubric.yaml', REPO / 'config/quality_contract.json',
              REPO / 'knowledge/craft/ART_DIRECTION.md', REPO / 'knowledge/craft/cinematic_reference_bank.json']
    context = '\n'.join(str(g.relative_to(REPO)) + '\n' + g.read_text() for g in guides)
    source_text = Path(sources).read_text()
    for index, lens in enumerate(['picture', 'story', 'sound']):
        out = root / ('comparison-' + lens + '.json')
        films = [a, b] if index != 1 else [b, a]
        if out.exists():
            retained = json.loads(out.read_text())
            if [f['sha256'] for f in retained['order']] != [digest(f) for f in films]:
                raise ValueError('retained comparison has different films; never overwrite it')
            print(json.dumps({'lens': lens, 'retained_response_id': retained['response_id']}), flush=True)
            continue
        raw_path = root / ('comparison-' + lens + '-response.json')
        prompt_path = root / ('comparison-' + lens + '-prompt.txt')
        if raw_path.exists():
            raw = json.loads(raw_path.read_text())
            result, normalizations = parsed_result(raw)
            events = json.loads(ledger.read_text())['events']
            matching = [e for e in events if e['kind'] == 'charged' and e.get('resource') == 'av_reviews'
                        and e['note'].endswith('comparison ' + lens)
                        and [r['sha256'] for r in e['inputs'][:2]] == [digest(f) for f in films]]
            if not matching:
                raise ValueError('retained response lacks its actual pre-execution charge and exact film bindings')
            receipt = {'schema': 'dispatch-cinematic-lab-comparison/1',
                       'identity': str(uuid.uuid5(uuid.NAMESPACE_URL, raw['responseId'])),
                       'model': policy()['av_model'], 'response_id': raw['responseId'], 'starting_lens': lens,
                       'basis': 'Independent audiovisual model observation, not human listening or production approval',
                       'order': [{'path': str(Path(f).resolve()), 'sha256': digest(f)} for f in films],
                       'prompt_sha256': digest(prompt_path), 'response': {'path': str(raw_path), 'sha256': digest(raw_path)},
                       'original_result': result, 'transport_normalizations': normalizations,
                       'charge_index': matching[-1]['index'], 'usage': raw.get('usageMetadata', {})}
            out.write_text(json.dumps(receipt, indent=2) + '\n')
            change(ledger, 'observed', note='Parsed retained original provider timestamps; no new provider call or changed verdict', inputs=[raw_path, out])
            print(json.dumps({'lens': lens, 'retained_response_id': raw['responseId'], 'winner': result.get('winner'), 'transport_normalizations': normalizations}), flush=True)
            continue
        identity = str(uuid.uuid4())
        prompt = ('Independent engineering A/B study, NOT a production approval or final panel. '
                  'Two 14.8-second passages use identical source-backed words, mix and captions. '
                  'Watch both in supplied order before reading the rationale. Evaluate phone-size recognition and native surface/action finish. '
                  'Your starting lens is ' + lens + '. Compare both under the attached existing criteria; the excerpt is not a complete news edition. '
                  'Return JSON with winner: first|second|tie, first and second objects containing scores (existing rubric axes), '
                  'one_viewing_summary, observed strengths, and defects [{start_s,end_s,category,observed,criterion,blocking}]. '
                  'Also return comparison_reason, audio_observed and source_limits. Use exact times and actual pixels/sound; '
                  'do not assume the illustrated version is better, or demand 3D. Distinguish style preferences from missing action/source/technical failures. '
                  'The reference bank teaches decisions; its old films/scores are not these candidates.\n' + context + '\nFetched source excerpts:\n' + source_text)
        prompt_path.write_text(prompt)
        event = change(ledger, 'charged', 'av_reviews', 1,
                       'Normal independent audiovisual R&D comparison ' + lens, films + guides + [Path(sources)])
        parts, uploads = [], []
        started = time.monotonic()
        status, raw = None, None
        try:
            for film in films:
                part, upload, film_hash = media_part(Path(film), key)
                parts += [{'text': 'FIRST' if not parts else 'SECOND'}, part]
                uploads.append(upload)
            parts.append({'text': prompt})
            response = requests.post('https://generativelanguage.googleapis.com/v1beta/models/' + policy()['av_model'] + ':streamGenerateContent?alt=sse',
                                     headers={'x-goog-api-key': key}, json={'contents': [{'role': 'user', 'parts': parts}],
                                     'generationConfig': {'responseMimeType': 'application/json', 'temperature': .2}},
                                     timeout=(30, 180), stream=True)
            status = response.status_code
            if status != 200:
                (root / ('comparison-' + lens + '-failure.json')).write_text(json.dumps({'http_status': status, 'provider_body': response.text}) + '\n')
                raise ValueError('audiovisual provider HTTP ' + str(status) + '; failure retained')
            raw = streamed_response(response)
            raw_path = root / ('comparison-' + lens + '-response.json')
            raw_path.write_text(json.dumps(raw, indent=2) + '\n')
            result, normalizations = parsed_result(raw)
            receipt = {'schema': 'dispatch-cinematic-lab-comparison/1', 'identity': identity,
                       'model': policy()['av_model'], 'response_id': raw['responseId'], 'starting_lens': lens,
                       'basis': 'Independent audiovisual model observation, not human listening or production approval',
                       'order': [{'path': str(Path(f).resolve()), 'sha256': digest(f)} for f in films],
                       'prompt_sha256': digest(prompt_path), 'response': {'path': str(raw_path), 'sha256': digest(raw_path)},
                       'original_result': result, 'transport_normalizations': normalizations,
                       'charge_index': event['index'], 'usage': raw.get('usageMetadata', {})}
            out.write_text(json.dumps(receipt, indent=2) + '\n')
            print(json.dumps({'lens': lens, 'winner': result.get('winner'), 'response_id': raw['responseId'], 'usage': raw.get('usageMetadata', {})}), flush=True)
        except requests.RequestException as exc:
            (root / ('comparison-' + lens + '-failure.json')).write_text(json.dumps({'transport_error': type(exc).__name__}) + '\n')
            raise ValueError('provider transport failed; actual attempt retained') from None
        finally:
            for upload in uploads:
                remove_upload(upload, key)
            change(ledger, 'observed', note='Actual provider attempt ' + lens,
                   telemetry={'elapsed_ms': round((time.monotonic() - started) * 1000), 'http_status': status,
                              'reported_tokens': (raw or {}).get('usageMetadata', {}).get('totalTokenCount', 0)})


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, required=True)
    p.add_argument('--a', type=Path, required=True)
    p.add_argument('--b', type=Path, required=True)
    p.add_argument('--sources', type=Path, required=True)
    p.add_argument('--ledger', type=Path)
    args = p.parse_args()
    review(args.root, args.a, args.b, args.sources, args.ledger)
