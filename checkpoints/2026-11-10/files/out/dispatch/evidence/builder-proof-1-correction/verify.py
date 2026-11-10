import json,sys
sys.argv=['x',sys.argv[1]]
src=open('solve2.py').read().replace('\nmain()\n','\n')
exec(compile(src,'solve','exec'))
bad=0
for t in 'ab':
    r=json.load(open(f'probe-{t}.json'))
    for s in r['objects']:
        s['variant']=t
        kind=kind_of(s['view'])
        if kind=='split':
            for p,c in enumerate(s['cams']):
                keep=set(SPLIT_ITEMS[s['view']][p]); subs,others=classify(s)
                subs=[dict(o,whole=(o['bbox'][2]-o['bbox'][0]<=420 and o['bbox'][3]-o['bbox'][1]<=260)) for o in subs if set(o['items'])&keep]
                others=[o for o in others if set(o['items'])&keep and o['key']!='tabs']
                P=PANES[p]; fx=(P[0]+P[2])/2; fy=(P[1]+P[3])/2; z=c['z']; cx=(fx-c['tx'])/z; cy=(fy-c['ty'])/z
                ok,why=ok_camera(z,cx,cy,fx,fy,[(subs,others,ymin_for(s),words_for(s,keep))],P)
                print(t,s['shot'],s['view'],'pane',p,'z=%.2f'%z,'OK' if ok else 'FAIL '+str(why)); bad+=not ok
            continue
        c=s['cams'][0]; z=c['z']
        band=CHECK if kind=='check' else BAND
        fx=(band['x0']+band['x1'])/2; fy=(band['y0']+band['y1'])/2
        if kind=='wide' and z==1 and c['tx']==0: fx,fy=470,810
        cx=(fx-c['tx'])/z; cy=(fy-c['ty'])/z
        subs,others=classify(s)
        ok,why=ok_camera(z,cx,cy,fx,fy,[(subs,others,ymin_for(s),words_for(s))],(0,0,1080,1920))
        print(t,s['shot'],s['view'],'z=%.2f'%z,'OK' if ok else 'FAIL '+str(why)); bad+=not ok
print('failures',bad)
