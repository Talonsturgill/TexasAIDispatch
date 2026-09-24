#!/usr/bin/env python3
"""Extract review surfaces and measurements from the final study MP4s."""
import json,re,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'experiments/cinema/deliverables'
OUT=ROOT/'out/cinema'
sys.path.insert(0,str(ROOT/'scripts'))
sys.path.insert(0,str(ROOT/'video-engine/tests'))
from render_manifest import file_sha256,engine_sha256
from cinema_pixels import inspect

def ffmpeg(args):
    return subprocess.run(['ffmpeg','-y','-v','error',*map(str,args)],check=True,capture_output=True)

def main():
    evidence=json.loads((D/'render-evidence.json').read_text())
    assert evidence['engine_sha256']==engine_sha256(),'Engine changed after rendering'
    assert evidence['sound_source_sha256']==file_sha256(ROOT/'experiments/cinema/sound.py'),'Sound changed after rendering'
    times=[.6,3.8,7.7,10.2,12.8,16.2,18.5]
    sheet=Image.new('RGB',(180*len(times),350*3),(5,17,23));draw=ImageDraw.Draw(sheet)
    for row,mode in enumerate(['vector','dimensional','hybrid']):
        source=D/(('hybrid-master' if mode=='hybrid' else mode)+'.mp4')
        assert evidence['renders'][mode]['film_sha256']==file_sha256(source),'Film changed after rendering'
        ffmpeg(['-i',source,'-f','null','-'])
        for col,t in enumerate(times):
            still=OUT/f'{mode}-{t}.jpg'
            ffmpeg(['-ss',t,'-i',source,'-frames:v',1,'-vf','scale=180:320',still])
            sheet.paste(Image.open(still),(col*180,row*350+25))
            draw.text((col*180+6,row*350+7),f'{mode} {t}s',fill=(214,208,185))
            if t==7.7: inspect(still)
    sheet.save(D/'comparison.jpg',quality=92)
    ffmpeg(['-ss','7.7','-i',D/'hybrid-master.mp4','-frames:v','1','-vf','scale=540:960',D/'poster.jpg'])
    audio=subprocess.run(['ffmpeg','-i',str(D/'hybrid-master.mp4'),'-af','ebur128=peak=true','-f','null','-'],
      capture_output=True,text=True,check=True)
    (OUT/'audio-measurement.log').write_text(audio.stderr)
    integrated=re.findall(r'I:\s+(-?[0-9.]+) LUFS',audio.stderr)
    peaks=re.findall(r'Peak:\s+(-?[0-9.]+) dBFS',audio.stderr)
    assert integrated and peaks,'Loudness measurement missing'
    evidence['audio_measurement']={'method':'FFmpeg ebur128 on final AAC film',
      'integrated_lufs':float(integrated[-1]),'true_peak_dbfs':float(peaks[-1]),
      'speech':False,'music':False,'description':'Original foley and schematic sonification'}
    evidence['controller_usage']=json.loads((OUT/'run_state.json').read_text())['usage']
    evidence['contact_sheet_sha256']=file_sha256(D/'comparison.jpg')
    evidence['poster_sha256']=file_sha256(D/'poster.jpg')
    (D/'render-evidence.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print(json.dumps(evidence['audio_measurement'],indent=2))
if __name__=='__main__': main()
