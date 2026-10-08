"""Cold-shot integration regression for the actual rejected missing-raster capture."""
import argparse,json
from pathlib import Path
import numpy as np
from PIL import Image

def observation(path):
    with Image.open(path) as image:
        pixels=np.asarray(image.convert('RGB').resize((270,480)),dtype=float)[125:312,30:233]
    edges=np.linalg.norm(np.diff(pixels,axis=1),axis=2)
    return {'std':float(pixels.std()),'edge_ratio':float(np.mean(edges>24))}

def loaded(value):
    # This measured region excludes title, caption and disclosure text. The
    # retained missing-sprite frame has only smooth heat overlays and a flag.
    return value['std']>=45 and value['edge_ratio']>=.08

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('current',type=Path);parser.add_argument('rejected',type=Path)
    args=parser.parse_args();current=observation(args.current);rejected=observation(args.rejected)
    if loaded(rejected):raise SystemExit('Regression no longer rejects the actual missing-image capture')
    if not loaded(current):raise SystemExit('Fresh raster props are absent from the cold mounted shot: '+json.dumps(current))
    print('Cold-shot artwork is present; actual rejected missing-image frame still fails. '+json.dumps(current))
