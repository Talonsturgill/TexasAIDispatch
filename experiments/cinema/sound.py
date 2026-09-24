#!/usr/bin/env python3
"""Original procedural foley for the optical study. No speech or music recording."""
import json, wave
from pathlib import Path
import numpy as np
SR=48000
DURATION=20
rng=np.random.default_rng(230923)
mix=np.zeros((SR*DURATION,2),dtype=np.float64)
events=[]
def add(at,samples,gain=1,pan=0,label=""):
    start=round(at*SR)
    if start<0 or start+len(samples)>len(mix): raise ValueError(label)
    angle=(pan+1)*np.pi/4
    mix[start:start+len(samples),0]+=samples*gain*np.cos(angle)
    mix[start:start+len(samples),1]+=samples*gain*np.sin(angle)
    events.append({"at_s":at,"duration_s":len(samples)/SR,"event":label,"pan":pan})
def click(at,pitch,gain,pan=0,label=""):
    t=np.arange(round(.2*SR))/SR
    x=np.sin(2*np.pi*pitch*t)*np.exp(-t*65)
    x+=.25*rng.standard_normal(len(t))*np.exp(-t*155)
    add(at,x,gain,pan,label)
def servo(at,dur,low,high,gain,pan,label):
    t=np.arange(round(dur*SR))/SR
    phase=2*np.pi*(low*t+(high-low)*t*t/(2*dur))
    envelope=np.sin(np.pi*t/dur)**1.6
    noise=rng.standard_normal(len(t))
    noise=np.convolve(noise,np.ones(24)/24,mode='same')
    x=(np.sin(phase)+.16*np.sin(phase*3)+noise*.9)*envelope
    add(at,x,gain,pan,label)
servo(.22,1.25,92,185,.13,-.18,"iris servo opens")
for j in range(9): click(.3+j*.105,1200+j*93,.055,j/8-.5,"iris blade contact")
# A low, stable motor bed keeps the pullback connected to the mechanism.
servo(2.4,2.3,52,56,.035,0,"quiet mechanism bed")
for j in range(5):
    at=5+j*.18
    click(at,480+j*140,.08,(j-2)/3,"lens group releases")
    servo(at+.05,1.4,210+j*30,65+j*12,.045,(j-2)/3,"lens group separates")
# Smooth, overlapping partials represent an invisible process without percussive clicks.
for j in range(5):
    at=8+j*.18
    dur=2.15
    t=np.arange(round(dur*SR))/SR
    envelope=np.sin(np.pi*t/dur)**2
    pitch=330*2**(j/12)
    x=(np.sin(2*np.pi*pitch*t)+.18*np.sin(2*np.pi*pitch*2*t))*envelope
    add(at,x,.018,(j-2)/3,"schematic light path sonification")
for j in range(12):
    dur=.55
    t=np.arange(round(dur*SR))/SR
    envelope=np.sin(np.pi*t/dur)**2
    pitch=660*2**(j/24)
    x=(np.sin(2*np.pi*pitch*t)+.12*np.sin(2*np.pi*pitch*1.5*t))*envelope
    add(10.55+j*.12,x,.014,(j-5.5)/7,"soft sensor response sonification")
for j in reversed(range(5)):
    servo(14+j*.12,1.5,75+j*25,200+j*20,.045,(j-2)/3,"lens group returns")
    click(16+j*.12,350+j*110,.08,(j-2)/3,"lens group seats")
servo(17.05,1.65,135,48,.07,0,"mechanism settles")
# True silence at the boundaries; reserve peak room for browser and AAC reconstruction.
peak=float(np.abs(mix).max())
mix*=.63/max(peak,.001)
out=Path('out/cinema/study-sound.wav');out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
    w.writeframes((mix*32767).astype('<i2').tobytes())
Path('out/cinema/sound-events.json').write_text(json.dumps({
    "sample_rate":SR,"duration_s":DURATION,"source":"Original synthesized mechanical foley and illustrative sonification",
    "speech":False,"music":False,"time_stretch":1.0,"events":events
},indent=2)+'\n')
print(out)
