"""Serve only the local comparison artifacts, with byte ranges for video seeking."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import mimetypes
import re

ROOT = Path(__file__).resolve().parent / 'deliverables'
FILES = {'review.html', 'documentary-pilot.mp4', 'original.mp4', 'documentary-production.mp4', 'attention-review.html', 'attention-review.png'}


class ReviewHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        name = urlsplit(self.path).path.lstrip('/') or 'review.html'
        path = ROOT / name
        if name == 'original.mp4' and not path.is_file():
            path = ROOT.parents[2] / 'runs/2026-09-15/dispatch.mp4'
        if name not in FILES or not path.is_file():
            self.send_error(404)
            return
        size = path.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
            if not match or not any(match.groups()):
                self.send_error(416)
                return
            first, last = match.groups()
            if not first:
                start = max(0, size - int(last))
            else:
                start = int(first)
                end = min(size - 1, int(last)) if last else size - 1
            if start > end or start >= size:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers()
                return
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', mimetypes.guess_type(name)[0] or 'application/octet-stream')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Cache-Control', 'no-cache')
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        with path.open('rb') as stream:
            stream.seek(start)
            remaining = end - start + 1
            try:
                while remaining:
                    block = stream.read(min(65536, remaining))
                    if not block:
                        break
                    self.wfile.write(block)
                    remaining -= len(block)
            except (BrokenPipeError, ConnectionResetError):
                pass


if __name__ == '__main__':
    print('Review player at http://127.0.0.1:8779/review.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8779), ReviewHandler).serve_forever()
