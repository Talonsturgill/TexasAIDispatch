#!/usr/bin/env python3
"""Serve the comparison locally with byte ranges so the video scrubber can seek."""
import argparse
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

DIRECTORY=Path(__file__).resolve().parent/'deliverables'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(DIRECTORY),**kwargs)
    def send_head(self):
        self.remaining=None
        path=Path(self.translate_path(self.path))
        value=self.headers.get('Range','')
        if not value.startswith('bytes=') or ',' in value or not path.is_file():
            return super().send_head()
        size=path.stat().st_size
        try:
            first,last=value[6:].split('-',1)
            if first:
                start=int(first);end=min(int(last),size-1) if last else size-1
            else:
                count=int(last)
                if count<=0: raise ValueError()
                start=max(0,size-count);end=size-1
            if start<0 or start>=size or end<start: raise ValueError()
        except ValueError:
            self.send_response(416)
            self.send_header('Content-Range',f'bytes */{size}')
            self.send_header('Content-Length','0')
            self.end_headers()
            return None
        handle=path.open('rb')
        handle.seek(start)
        self.remaining=end-start+1
        self.send_response(206)
        self.send_header('Content-Type',self.guess_type(str(path)))
        self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length',str(self.remaining))
        self.end_headers()
        return handle
    def end_headers(self):
        self.send_header('Accept-Ranges','bytes')
        super().end_headers()
    def copyfile(self,source,output):
        if self.remaining is None:
            return super().copyfile(source,output)
        while self.remaining:
            data=source.read(min(65536,self.remaining))
            if not data: break
            output.write(data);self.remaining-=len(data)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8783)
    port=parser.parse_args().port
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    print(f'Comparison player at http://127.0.0.1:{port}',flush=True)
    server.serve_forever()
