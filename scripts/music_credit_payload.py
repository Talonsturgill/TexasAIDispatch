"""Copy-ready attribution from the actual mix and licensed registry, never memory."""
import argparse
import json
from pathlib import Path

import music

OPEN = '-----BEGIN MUSIC CREDITS-----'
CLOSE = '-----END MUSIC CREDITS-----'
EFFECTIVE = '2026-10-15'


def block(mix_path, registry=None):
    mix = json.loads(Path(mix_path).read_text())
    ids = [t['id'] for t in mix.get('tracks', []) if t.get('role') == 'bed']
    if mix.get('bed_track_id'):
        ids.append(mix['bed_track_id'])
    ids = list(dict.fromkeys(ids))
    if not ids:
        raise ValueError('the delivered mix identifies no licensed music bed')
    tracks = {t['id']: t for t in music.load(registry or music.REGISTRY)}
    lines = []
    for tid in ids:
        if tid not in tracks:
            raise ValueError('mixed music track is absent from the registry')
        track = tracks[tid]
        errors = music.problems_with(track)
        if errors:
            raise ValueError('; '.join(errors))
        lines.append(music.credit_line(track))
        # Screen credits may use a compact source label. Copy/paste attribution also
        # includes the exact source URL and license URL from the authoritative registry.
        lines.append(track['source_url'])
    return OPEN + '\n' + '\n\n'.join(lines) + '\n' + CLOSE


def problems(email, edition_date, registry=None):
    if edition_date[:10] < EFFECTIVE:
        return []
    email = Path(email)
    try:
        expected = block(email.parent / 'mix.json', registry)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ['music attribution could not be bound to the delivered mix: ' + str(exc)]
    text = email.read_text()
    if text.count(OPEN) != 1 or text.count(CLOSE) != 1:
        return ['include exactly one copy-ready music credit block after the caption']
    actual = OPEN + text.split(OPEN, 1)[1].split(CLOSE, 1)[0] + CLOSE
    if actual != expected:
        return ['music credits differ from the actual mix and authoritative licensed registry']
    caption_end = text.find('-----END CAPTION-----')
    if caption_end < 0 or text.index(OPEN) < caption_end:
        return ['put the music credits after the copy-ready caption']
    if len(text[:text.index(OPEN)].splitlines()) > 60:
        return ['music credits are buried below the usable post']
    return []


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mix', type=Path, required=True)
    parser.add_argument('--email', type=Path)
    args = parser.parse_args()
    credit = block(args.mix)
    if not args.email:
        print(credit)
        return
    text = args.email.read_text()
    if OPEN in text or CLOSE in text:
        if text.count(OPEN) != 1 or text.count(CLOSE) != 1 or text.index(OPEN) > text.index(CLOSE):
            raise ValueError('malformed existing music credit block')
        start, end = text.index(OPEN), text.index(CLOSE) + len(CLOSE)
        text = text[:start] + credit + text[end:]
    else:
        marker = '-----END CAPTION-----'
        if text.count(marker) != 1:
            raise ValueError('email needs one finished copy-ready caption before attribution')
        index = text.index(marker) + len(marker)
        text = text[:index] + '\n\n' + credit + text[index:]
    args.email.write_text(text)


if __name__ == '__main__':
    main()
