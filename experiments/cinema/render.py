#!/usr/bin/env python3
"""Render the optical comparison through the existing bounded resource controller."""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
ENGINE=ROOT/'video-engine'
OUT=ROOT/'out/cinema'
DELIVERY=ROOT/'experiments/cinema/deliverables'
sys.path.insert(0,str(ROOT/'scripts'))
from render_manifest import engine_sha256, file_sha256

def run(args, *, cwd=ROOT, log=None):
    if log:
        with log.open('w') as handle:
            result=subprocess.run(args,cwd=cwd,stdout=handle,stderr=subprocess.STDOUT)
        if result.returncode:
            raise RuntimeError(f"Command failed with {result.returncode}. Read {log.relative_to(ROOT)}")
    else:
        subprocess.run(args,cwd=cwd,check=True)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--modes',nargs='+',choices=['vector','dimensional','hybrid'],default=['vector','dimensional','hybrid'])
    parser.add_argument('--state',type=Path,default=OUT/'run_state.json')
    args=parser.parse_args()
    os.chdir(ROOT)
    OUT.mkdir(parents=True,exist_ok=True); DELIVERY.mkdir(parents=True,exist_ok=True)
    controller=[sys.executable,'scripts/run_controller.py','--state',str(args.state.resolve())]
    if not args.state.exists():
        run(controller+['init','--run-id','cinema-study','--mode','dry-run'])
    run([sys.executable,'experiments/cinema/sound.py'])
    source_hash=engine_sha256()
    manifest_path=DELIVERY/'render-evidence.json'
    evidence=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'schema':'cinema_study/1','renders':{}}
    evidence.update({'engine_sha256':source_hash,'sound_source_sha256':file_sha256(ROOT/'experiments/cinema/sound.py'),
      'package_lock_sha256':file_sha256(ENGINE/'package-lock.json'),'audio_sha256':file_sha256(OUT/'study-sound.wav'),
      'scope':'Illustrative design study. No daily publication authority or audience score.'})
    for mode in dict.fromkeys(args.modes):
        run(controller+['consume','--resource','full_renders','--note',f'Corrected {mode} optical study'])
        start=time.monotonic()
        silent=OUT/f'{mode}-final-silent.mp4'
        scale='1' if mode=='hybrid' else '.5'
        run(['npx','remotion','render','src/cinema/index.tsx',f'Cinema-{mode}',str(silent),
             '--scale='+scale,'--codec=h264','--crf=17','--gl=angle'],cwd=ENGINE,log=OUT/f'{mode}-final-render.log')
        if engine_sha256()!=source_hash: raise RuntimeError('Source changed during render')
        target=DELIVERY/('hybrid-master.mp4' if mode=='hybrid' else f'{mode}.mp4')
        run(['ffmpeg','-y','-v','error','-i',str(silent),'-i',str(OUT/'study-sound.wav'),
             '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-movflags','+faststart','-shortest',str(target)])
        if mode=='hybrid':
            run(['ffmpeg','-y','-v','error','-i',str(target),'-vf','scale=540:960',
                 '-c:v','libx264','-crf','18','-c:a','copy','-movflags','+faststart',str(DELIVERY/'hybrid.mp4')])
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(target)]))
        streams=probe['streams']
        assert any(s['codec_type']=='audio' for s in streams),'Missing audio'
        assert abs(float(probe['format']['duration'])-20)<.05,'Wrong duration'
        video=next(s for s in streams if s['codec_type']=='video')
        evidence['renders'][mode]={'film':target.name,'film_sha256':file_sha256(target),
          'engine_sha256':source_hash,'audio_sha256':file_sha256(OUT/'study-sound.wav'),
          'render_and_mux_seconds':round(time.monotonic()-start,2),
          'width':video['width'],'height':video['height'],'duration_s':float(probe['format']['duration'])}
        if mode=='hybrid': evidence['renders'][mode]['preview_sha256']=file_sha256(DELIVERY/'hybrid.mp4')
        manifest_path.write_text(json.dumps(evidence,indent=2)+'\n')
        print(f"{mode} ready at {target.relative_to(ROOT)}",flush=True)
    evidence['controller_usage']=json.loads(args.state.read_text())['usage']
    manifest_path.write_text(json.dumps(evidence,indent=2)+'\n')

if __name__=='__main__': main()
