"""Measure the real phone extractor. Writes evidence, never an admission proof."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import random
import subprocess

from PIL import Image, __version__ as pillow_version
import claude_motion_review as motion
import phone_review_storage as storage


def exercise(directory):
    root = Path(__file__).resolve().parents[1]
    before = storage.closure(root)
    policy = storage.sha(root / storage.POLICY)
    directory = Path(directory).resolve()
    directory.mkdir(parents=True, exist_ok=False)
    board = directory / 'board.json'; film = directory / 'phone.mp4'
    board.write_text(json.dumps({'runtime_s': 1.4, 'credits_s': 0}) + '\n')
    subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
                    'testsrc2=size=270x480:rate=30:duration=1.4', '-c:v', 'libx264',
                    '-preset', 'ultrafast', '-crf', '16', '-pix_fmt', 'yuv420p', str(film)], check=True)
    comparison = {'option': 'a', 'scope': 'engineering fixture, not a production inspection'}
    index_path = motion.build(board, film, directory / 'sequence', True, comparison)
    errors = motion.problems(index_path, board, film, True, comparison)
    if errors:
        raise ValueError('; '.join(errors))
    index = json.loads(index_path.read_text())
    expected = [0, 6, 12, 18, 24, 30, 36, 41]
    actual = [s['frame'] for page in index['pages'] for s in page['samples']]
    if actual != expected or index['sample_count'] != len(expected):
        raise ValueError('encoded fixture lost sample coverage or its last frame')
    # Decode independently, without the extractor's select filter or sample helper.
    raw = subprocess.check_output([motion.FFMPEG, '-v', 'error', '-i', str(film), '-an',
        '-vf', 'scale=390:693', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'])
    frame_bytes = 390 * 693 * 3
    if len(raw) != 42 * frame_bytes:
        raise ValueError('fixture frame count changed')
    decoded = hashlib.sha256()
    for page in index['pages']:
        with Image.open(index_path.parent / page['file']) as sheet:
            for i, sample in enumerate(page['samples']):
                x, y = 10 + (i % 3) * 400, 60 + (i // 3) * 731
                pixels = sheet.crop((x, y, x + 390, y + 693)).tobytes()
                number = sample['frame']
                if pixels != raw[number * frame_bytes:(number + 1) * frame_bytes]:
                    raise ValueError('contact sheet pixels differ from independent exact-film decode')
                decoded.update(pixels)
    # Same real extraction, now from a native film. Independently compare every
    # tile with a complete decode, so lowering admission cannot omit coverage.
    native = directory / 'native.mp4'
    subprocess.run([motion.FFMPEG, '-v', 'error', '-f', 'lavfi', '-i',
                    'testsrc2=size=1080x1920:rate=30:duration=1.4', '-c:v', 'libx264',
                    '-preset', 'ultrafast', '-crf', '16', '-pix_fmt', 'yuv420p', str(native)], check=True)
    native_index_path = motion.build(board, native, directory / 'native-sequence')
    if motion.problems(native_index_path, board, native):
        raise ValueError('native sequence did not pass exact-film verification')
    native_index = json.loads(native_index_path.read_text())
    native_raw = subprocess.check_output([motion.FFMPEG, '-v', 'error', '-i', str(native), '-an',
        '-vf', 'scale=390:693', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'])
    if len(native_raw) != 42 * frame_bytes:
        raise ValueError('native fixture count changed')
    native_samples = []
    for page in native_index['pages']:
        with Image.open(native_index_path.parent / page['file']) as sheet:
            for i, sample in enumerate(page['samples']):
                x, y = 10 + (i % 3) * 400, 60 + (i // 3) * 731
                number = sample['frame']; native_samples.append(number)
                if sheet.crop((x, y, x + 390, y + 693)).tobytes() != native_raw[number*frame_bytes:(number+1)*frame_bytes]:
                    raise ValueError('native sheet pixels differ from independent exact-film decode')
    if native_samples != expected:
        raise ValueError('native extraction lost coverage or last frame')
    # Entire maximum sheet is incompressible, including padding, header and unused
    # tile. This is deliberately more demanding than the actual five-tile layout.
    pixels = random.Random(773).randbytes(1210 * 1494 * 3)
    image = Image.frombytes('RGB', (1210, 1494), pixels)
    encoded = motion.encode_phone_sheet(image)
    if not 5 * 1024**2 < len(encoded) <= storage.EXPECTED['max_png_bytes']:
        raise ValueError('incompressible maximum-size sheet did not exercise the byte bound')
    with Image.open(io.BytesIO(encoded)) as decoded_sheet:
        if decoded_sheet.tobytes() != pixels:
            raise ValueError('sheet encoding is not lossless')
    (directory / 'high-entropy-sheet.png').write_bytes(encoded)
    if (before != storage.closure(root) or policy != storage.sha(root / storage.POLICY)
            or len(motion.sample_indices(9004)) != 1502
            or storage.bounds()['required_free_gib'] != 7):
        raise ValueError('source or upper bound changed during verification')
    report = {'schema': 'dispatch-phone-review-storage-exercise/1',
              'scope': 'engineering extraction and storage verification; no production capture or review verdict',
              'files': before, 'policy_sha256': policy,
              'exact_decoded_pixels': True, 'full_sample_coverage': True,
              'native_exact_decoded_pixels': True,
              'native_fixture': {'film_sha256': motion.digest(native),
                                 'index_sha256': motion.digest(native_index_path),
                                 'sample_indices': native_samples},
              'fixture': {'film_sha256': motion.digest(film), 'index_sha256': motion.digest(index_path),
                          'decoded_samples_sha256': decoded.hexdigest(), 'frames': 42,
                          'sample_indices': actual, 'sheet_count': len(index['pages']),
                          'sheet_bytes': [p['bytes'] for p in index['pages']]},
              'high_entropy_sheet': {'dimensions': [1210, 1494], 'bytes': len(encoded),
                                     'sha256': hashlib.sha256(encoded).hexdigest(), 'lossless': True},
              'bounds': storage.bounds(), 'pillow_version': pillow_version,
              'ffmpeg_version': subprocess.check_output([motion.FFMPEG, '-version'], text=True).splitlines()[0]}
    target = directory / 'exercise.json'
    target.write_text(json.dumps(report, indent=2) + '\n')
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True, help='new engineering evidence directory')
    args = parser.parse_args()
    print(exercise(args.out))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
