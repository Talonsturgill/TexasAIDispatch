#!/usr/bin/env python3
"""Reject a blank optical-study subject in actual render output, including a hidden SVG."""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

def inspect(path):
    image=Image.open(path).convert('RGB')
    w,h=image.size
    crop=np.asarray(image.crop((round(w*.1),round(h*.3),round(w*.9),round(h*.68))),dtype=float)
    luminance=crop@np.array([.2126,.7152,.0722])
    spread=float(luminance.std())
    bright=float(np.mean(luminance>80))
    if spread<14 or bright<.06:
        raise ValueError(f'{path}: subject absent or unreadably dark. Spread {spread:.2f}, visible fraction {bright:.4f}')
    print(f'{path}: visible subject. Spread {spread:.2f}, visible fraction {bright:.4f}')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('frames',type=Path,nargs='+')
    for frame in parser.parse_args().frames: inspect(frame)
