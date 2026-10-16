"""Give image-only reviewers an ordered, exact-film motion sequence; never a verdict."""
from __future__ import annotations

import argparse
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont
from preflight_animatic import FFMPEG, FFPROBE

SCHEMA = 'dispatch_claude_motion_review/1'
PHONE_SCHEMA = 'dispatch_claude_phone_motion_review/1'
PHONE_OPERATIONS = {key: 'exact-phone-' + key + ' motion-image review extraction' for key in ('a', 'b')}
FPS = 5
WIDTH = 390
REPO = Path(__file__).resolve().parents[1]


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def inspect(film, phone=False):
    raw = subprocess.check_output([FFPROBE, '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,avg_frame_rate,r_frame_rate,nb_frames:format=duration',
        '-of', 'json', str(film)])
    data = json.loads(raw); video = data['streams'][0]
    if Fraction(video['avg_frame_rate']) != 30 or Fraction(video['r_frame_rate']) != 30:
        raise ValueError('motion review requires the current native constant thirty-fps film')
    frames = int(video['nb_frames']); duration = float(data['format']['duration'])
    dimensions = (270, 480) if phone else (1080, 1920)
    if (int(video['width']), int(video['height'])) != dimensions or not 0 < duration <= 300:
        raise ValueError('motion review requires the bounded ' + ('phone preflight' if phone else 'native portrait') + ' film')
    if abs(frames / 30 - duration) > .15:
        raise ValueError('native frame count and encoded duration disagree')
    return dict(width=dimensions[0], height=dimensions[1], fps=30, frames=frames, duration_s=duration)


def phone_inputs(state_path, option, board, film):
    """Admit only the exact structurally inspected comparison option, never a final film."""
    import opening_compare
    from critic_gate import renderer_digest
    state_path, board, film = map(lambda p: Path(p).resolve(), (state_path, board, film))
    output = state_path.parent / 'openings'
    if option not in PHONE_OPERATIONS or board != output / (option + '.json') or film != output / (option + '.mp4'):
        raise ValueError('phone motion review requires the canonical exact comparison option')
    state = json.loads(state_path.read_text()); data = json.loads(board.read_text())
    if state.get('terminal_state') or data.get('date') != str(state.get('run_id', ''))[:10]:
        raise ValueError('phone motion review requires this active edition')
    comparison = output / 'comparison.json'; receipt = json.loads(comparison.read_text())
    errors = opening_compare.inspection_problems(receipt, output)
    if errors:
        raise ValueError('; '.join(errors))
    row = next(r for r in receipt['options'] if r['id'] == option)
    if (opening_compare.evidence_path(output, row['board']) != board
            or opening_compare.evidence_path(output, row['film']) != film
            or receipt.get('renderer_sha256') != renderer_digest(json.loads(board.read_text()))):
        raise ValueError('phone comparison inputs or current renderer differ')
    return {'comparison_sha256': digest(comparison), 'option': option,
            'inspection_sha256': row['inspection']['sha256']}


def sample_indices(total):
    rows = list(range(0, total, 30 // FPS))
    if total - 1 not in rows:
        rows.append(total - 1)
    return rows


def build(board, film, directory, phone=False, comparison=None):
    board, film, directory = map(Path, (board, film, directory))
    if not directory.resolve().is_relative_to(board.parent.resolve()):
        raise ValueError('motion images must stay in the owned current review package')
    before = {'board_sha256': digest(board), 'film_sha256': digest(film)}
    meta = inspect(film, phone); data = json.loads(board.read_text())
    expected = float(data['runtime_s']) + float(data.get('credits_s') or 0)
    if abs(expected - meta['duration_s']) > .15:
        raise ValueError('motion review film duration differs from the current board')
    directory.mkdir(parents=True, exist_ok=False)
    indices = sample_indices(meta['frames']); height = round(WIDTH * 1920 / 1080)
    command = [FFMPEG, '-v', 'error', '-i', str(film), '-an', '-vf',
        'select=not(mod(n\\,6))+eq(n\\,%d),scale=%d:%d' % (meta['frames']-1, WIDTH, height),
        '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']
    proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    font = ImageFont.truetype(str(REPO / 'video-engine/public/fonts/Manrope-Var.ttf'), 18)
    page_rows, pages = [], []

    def save_page(rows):
        columns = 3; gap = 10; label = 28; header = 32
        sheet = Image.new('RGB', (columns*(WIDTH+gap)+gap,
            math.ceil(len(rows)/columns)*(height+label+gap)+header), '#091b20')
        draw = ImageDraw.Draw(sheet)
        draw.text((gap, 4), 'Exact-film sequence; image observations, no direct listening', font=font, fill='#f5eddd')
        entries = []
        for i, (number, image) in enumerate(rows):
            x = gap+(i%columns)*(WIDTH+gap); y = header+(i//columns)*(height+label+gap)
            draw.text((x, y), '%.3f s / frame %d' % (number/30, number), font=font, fill='#f5eddd')
            sheet.paste(image, (x, y+label))
            entries.append({'frame': number, 'at_s': number/30})
        name = 'sequence-%03d.png' % len(pages); path = directory/name
        sheet.save(path)
        pages.append({'file': name, 'sha256': digest(path), 'bytes': path.stat().st_size,
                      'width': sheet.width, 'height': sheet.height, 'samples': entries})

    try:
        size = WIDTH*height*3
        for number in indices:
            pixels = bytearray()
            while len(pixels) < size:
                part = proc.stdout.read(size-len(pixels))
                if not part:
                    error = proc.stderr.read().decode(errors='replace')
                    raise ValueError('decoded film sequence ended before its declared sample coverage: '+error[-700:])
                pixels.extend(part)
            page_rows.append((number, Image.frombytes('RGB', (WIDTH, height), bytes(pixels))))
            if len(page_rows) == FPS:
                save_page(page_rows); page_rows = []
        if proc.stdout.read(1):
            raise ValueError('decoded film sequence contains unindexed frames')
        error = proc.stderr.read().decode(errors='replace')
        if proc.wait() != 0:
            raise ValueError('exact-film decode failed: ' + error[-500:])
        if page_rows:
            save_page(page_rows)
    finally:
        if proc.poll() is None:
            proc.kill(); proc.wait()
        proc.stdout.close(); proc.stderr.close()
    if before != {'board_sha256': digest(board), 'film_sha256': digest(film)}:
        raise ValueError('film or board changed during motion extraction')
    index = {'schema': PHONE_SCHEMA if phone else SCHEMA, **before,
             'phone' if phone else 'native': meta, 'sample_fps': FPS,
             'phone_width': WIDTH, 'sample_count': len(indices), 'pages': pages,
             'basis': 'Chronological images decoded from the entire exact encoded film, including credits. '
                      'Five samples per second plus the final native frame. No authored rerender, '
                      'direct MP4 playback, direct listening or automated creative verdict.'}
    if phone:
        index['comparison'] = comparison
        index['basis'] = index['basis'].replace('final native frame', 'final phone frame')
    target = directory/'index.json'; target.write_text(json.dumps(index, indent=2)+'\n')
    return target


def problems(index, board, film, phone=False, comparison=None):
    index = Path(index); data = json.loads(index.read_text()); errors = []
    meta = inspect(Path(film), phone); expected = sample_indices(meta['frames'])
    if data.get('schema') != (PHONE_SCHEMA if phone else SCHEMA) or data.get('film_sha256') != digest(film) or data.get('board_sha256') != digest(board):
        errors.append('motion sequence does not bind the exact current film and board')
    if data.get('phone' if phone else 'native') != meta or data.get('sample_fps') != FPS or data.get('phone_width') != WIDTH:
        errors.append('motion sequence native clock, coverage or phone scale is wrong')
    if phone and (not comparison or data.get('comparison') != comparison):
        errors.append('phone sequence does not bind the current inspected comparison option')
    rows = data.get('pages') or []; actual = []; seen = set()
    for i, page in enumerate(rows):
        name = page.get('file'); path = index.parent / str(name)
        if name != 'sequence-%03d.png' % i or name in seen:
            errors.append('motion sequence pages are missing, duplicated or reordered'); continue
        seen.add(name)
        if not path.is_file() or path.is_symlink() or digest(path) != page.get('sha256') or path.stat().st_size != page.get('bytes'):
            errors.append('motion sequence page bytes are missing or changed'); continue
        with Image.open(path) as image:
            if (image.width, image.height) != (page.get('width'), page.get('height')):
                errors.append('motion sequence page dimensions changed')
        samples = page.get('samples') or []
        if not 1 <= len(samples) <= FPS:
            errors.append('motion sequence page sample coverage is invalid')
        for sample in samples:
            n = sample.get('frame'); actual.append(n)
            if not isinstance(n, int) or sample.get('at_s') != n/30:
                errors.append('motion sequence timestamp differs from the native clock')
    if actual != expected or data.get('sample_count') != len(expected):
        errors.append('motion sequence omits or reorders part of the whole film')
    if {p.name for p in index.parent.glob('sequence-*.png')} != seen:
        errors.append('motion sequence contains unindexed pages')
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--board', type=Path, required=True)
    parser.add_argument('--film', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--state', type=Path, default=Path('out/dispatch/run_state.json'))
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--phone-option', choices=('a', 'b'), help='explicit inspected comparison option; never final native evidence')
    args = parser.parse_args(argv)
    try:
        comparison = phone_inputs(args.state, args.phone_option, args.board, args.film) if args.phone_option else None
        if args.verify:
            errors = problems(args.out/'index.json', args.board, args.film, bool(args.phone_option), comparison)
            if errors: raise ValueError('; '.join(errors))
            print('claude motion review: complete exact-film image sequence verified; no creative approval')
        else:
            from run_controller import read_state, reserve
            state = read_state(args.state)
            deliverable = state.get('deliverable') or {}
            if state.get('terminal_state'):
                raise ValueError('motion extraction requires an active edition')
            if not args.phone_option and (deliverable.get('review_only') is not False
                    or deliverable.get('film_sha256') != digest(args.film)
                    or deliverable.get('board_sha256') != digest(args.board)):
                raise ValueError('motion extraction requires the active registered native film and board')
            operation = PHONE_OPERATIONS[args.phone_option] if args.phone_option else 'exact-film motion-image review extraction'
            ok, note = reserve(args.state, {'preflight_renders': 1}, operation)
            if not ok: raise ValueError(note)
            index = build(args.board, args.film, args.out, bool(args.phone_option), comparison)
            if args.phone_option and phone_inputs(args.state, args.phone_option, args.board, args.film) != comparison:
                raise ValueError('phone comparison changed during extraction')
            errors = problems(index, args.board, args.film, bool(args.phone_option), comparison)
            if errors: raise ValueError('; '.join(errors))
            print('claude motion review: current full sequence -> '+str(index)+'; no creative approval')
        return 0
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print('claude motion review: '+str(exc), file=sys.stderr); return 1


if __name__ == '__main__':
    raise SystemExit(main())
