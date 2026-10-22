"""Scan verified native image records as text plus PNG metadata, without rewriting evidence."""
import base64
import hashlib
import json
from pathlib import Path
import struct
import zlib

LIMIT = 16 * 1024 * 1024


class SecretImageMetadata(ValueError):
    pass


def inflate(data):
    stream = zlib.decompressobj()
    text = stream.decompress(data, LIMIT+1)
    if len(text) > LIMIT or stream.unconsumed_tail or not stream.eof:
        raise ValueError('unbounded or invalid PNG metadata')
    return text


def metadata(raw):
    """Only IDAT is pixel compression. Text and every other chunk stay scanned."""
    if not raw.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('not PNG')
    at, texts, ended = 8, [], False
    while at < len(raw):
        if len(raw)-at < 12:
            raise ValueError('truncated PNG chunk')
        size = struct.unpack('>I',raw[at:at+4])[0]
        kind = raw[at+4:at+8]
        end = at+12+size
        if end > len(raw): raise ValueError('truncated PNG payload')
        data = raw[at+8:at+8+size]
        crc = struct.unpack('>I',raw[end-4:end])[0]
        if zlib.crc32(kind+data)&0xffffffff != crc:
            raise ValueError('PNG metadata or image CRC differs')
        if kind != b'IDAT': texts.append(data)
        if kind in (b'zTXt',b'iCCP'):
            _, compressed = data.split(b'\0',1)
            if not compressed or compressed[0] != 0: raise ValueError('unsupported PNG compression')
            texts.append(inflate(compressed[1:]))
        if kind == b'iTXt':
            _, rest = data.split(b'\0',1)
            if len(rest)<2 or rest[0] not in (0,1) or rest[1]!=0:
                raise ValueError('unsupported PNG international text')
            _, _, text = rest[2:].split(b'\0',2)
            texts.append(inflate(text) if rest[0] else text)
        at = end
        if kind == b'IEND':
            texts.append(raw[at:]); ended=True; break
    if not ended: raise ValueError('missing PNG end')
    return '\n'.join(t.decode('latin1') for t in texts)


def scan_view(repo, rel, data, pattern, values):
    """Return a verified scan-only view, or None to retain the ordinary strict scan.

    The coverage validator rechecks the exact packet, guides, actual returned pixel
    bytes, hashes and public chronology. No path alone admits binary treatment.
    Original environment credential values are checked before this function.
    """
    if Path(rel).name not in {'codex-public-image-events.json', 'all-public-image-events.json'}:
        return None
    from codex_visual_observations import coverage_problems, digest, EvidencePaths
    path = Path(repo)/rel
    try:
        hashed = hashlib.sha256(data).hexdigest()
        # A retained complete excerpt may sit beside an earlier partial coverage.
        # Find an exact content binding, then validate its original canonical file.
        candidates = [path.with_name('codex-image-coverage.json')]
        candidates += sorted((Path(repo)/'out/dispatch').rglob('codex-image-coverage.json'))
        for coverage in dict.fromkeys(candidates):
            if coverage.is_symlink() or not coverage.is_file(): continue
            proof = json.loads(coverage.read_text())
            ref = proof.get('public_events') if isinstance(proof, dict) else None
            if isinstance(ref, dict) and hashed == ref.get('sha256'): break
        else:
            return None
        # Historical handoffs bind the packet digest, not its filename. Do not
        # infer its identity from a naming convention the evidence never promised.
        packets = (Path(repo)/'out/dispatch').rglob('*.json')
        packet = next((p for p in packets if not p.is_symlink() and p.stat().st_size < 2*1024*1024
                       and digest(p)==proof['packet_sha256']),None)
        if packet is None: return None
        paths = EvidencePaths(packet,repo)
        paths.path(path)  # Refuse escaping or symlinked retained copies too.
        if paths.path(proof['public_events']['path']).read_bytes() != data: return None
        if coverage_problems(packet,coverage,repository=repo): return None
        document = json.loads(data)
        images = proof['pages'] + proof.get('supplemental_images', [])
        allowed = {p['returned_sha256'] for p in images}
        image_count = 0
        for record in document['records']:
            event = record['event']
            original = json.loads(record['public_source_line'])
            if original != event: return None
            for version in (event,original):
                payload = version['payload']
                output = payload.get('output')
                if not isinstance(output,list): continue
                for image in output:
                    if not isinstance(image,dict) or image.get('type')!='input_image': continue
                    uri = image.get('image_url','')
                    if not uri.startswith('data:image/png;base64,'): return None
                    raw = base64.b64decode(uri.split(',',1)[1],validate=True)
                    hashed = hashlib.sha256(raw).hexdigest()
                    if hashed not in allowed: return None
                    text = metadata(raw)
                    if pattern.search(text) or any(v in text for v in values):
                        raise SecretImageMetadata('PNG nonpixel metadata contains credential-shaped content')
                    image['image_url']='[validated original PNG binary sha256 '+hashed+']'
                    image_count += 1
            # Parse the duplicate original JSON string; never remove its prose or
            # replace the entire source record merely because it includes pixels.
            record['public_source_line']=json.dumps(original,separators=(',',':'))
        if image_count!=2*len(images): return None
        return json.dumps(document,separators=(',',':'))
    except SecretImageMetadata:
        raise
    except (OSError,ValueError,KeyError,TypeError,StopIteration):
        return None
