"""Analytic geometry of the repair-5 s8 close and s8-shot-1 (screen px, 1080x1920). No render."""
import json
PILL=(44,132,516,188); BOARD_TAG_S=.74; BOARDS=.46; kb=1.2; T=kb*BOARD_TAG_S/BOARDS
W={'evaluating':307,'decision':338,'report':244,'accuracy':339,'care':339}; H=108
PINS={'start':(40,677),'half':(382,677),'end':(700,677)}
S8={'decision':('start','left',0),'report':('start','left',150),'evaluating':('end','left',60)}
def bez(p,t):
    a,b,c,d=p; u=1-t
    return (u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0], u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1])
def tag(pin,side,drop,w,s):
    dx=-w-4 if side=='left' else -14; dy=34+drop
    body=(pin[0]+dx*s,pin[1]+dy*s,pin[0]+(dx+w)*s,pin[1]+(dy+H)*s)
    pts=[(0,0),(4,dy*.4),(dx+10,dy+H/2-30),(dx+18,dy+H/2)]
    string=[bez([(pin[0]+x*s,pin[1]+y*s) for x,y in pts],i/200) for i in range(201)]
    return body,string
def inter(a,b): return not(a[2]<=b[0] or b[2]<=a[0] or a[3]<=b[1] or b[3]<=a[1])
out={'tag_scale_end':round(T,4),'eval_type_px_native':round(25*T,2),'eval_type_px_at_270':round(25*T/4,2),
     's8_shot1_tag_scale':round(2.2*BOARD_TAG_S,4)}
board=(-140,-604*kb)
pin=lambda k:(board[0]+PINS[k][0]*kb,board[1]+PINS[k][1]*kb)
tags={k:tag(pin(p),sd,d,W[k],T) for k,(p,sd,d) in S8.items()}
inframe=lambda r:r[2]>0 and r[0]<1080 and r[3]>0 and r[1]<1920
out['tags']={k:{'body':[round(v,1) for v in b],'in_frame':inframe(b),
  'string_in_pill':any(PILL[0]<=x<=PILL[2] and PILL[1]<=y<=PILL[3] for x,y in s),
  'body_in_pill':inter(b,PILL)} for k,(b,s) in tags.items()}
vis=[k for k,(b,s) in tags.items() if inframe(b)]
out['visible_tag_overlaps']=[(a,b) for i,a in enumerate(vis) for b in vis[i+1:] if inter(tags[a][0],tags[b][0])]
# board rows: figure rows end at local y<=596 (184 tall, wobble 6, rotation 2deg)
out['lowest_figure_row_bottom_y']=round(board[1]+596*kb,1)
out['bar_label_top_y']=round(board[1]+616*kb,1); out['bar_bottom_y']=round(board[1]+694*kb,1)
# answer group at (530,815) s1.5: card 344x250; open tags hang left of the clip, local y 46..278
ax,ay,aS=530,815,1.5
out['answer_card']=[ax,ay,ax+344*aS,ay+250*aS]
out['open_tags']=[round(ax+(14-4-339)*aS,1),round(ay+46*aS,1),ax+14*aS,round(ay+278*aS,1)]
out['open_tag_type_px']=25*aS
out['chart_a']=[-70,520-18*.95,round(-70+372*.95,1),round(520+.772*.95*470,1)]
out['chart_b']=[-50,500-18*.8,round(-50+372*.8,1),round(500+.8*470,1)]
eb=tags['evaluating'][0]
out['chart_clear_of_eval']={'a':not inter(out['chart_a'],eb),'b':not inter(out['chart_b'],eb)}
out['chart_clear_of_open_tags']={'a':not inter(out['chart_a'],out['open_tags']),'b':not inter(out['chart_b'],out['open_tags'])}
out['answer_clear_of_pill']=not inter(out['answer_card'],PILL) and not inter(out['open_tags'],PILL)
out['caption_top_y_estimate']=1298
out['above_caption']=max(out['answer_card'][3],out['open_tags'][3],eb[3])<1298
# s8-shot-1 (world units -> screen): A f=(816,398), B f=(778,685), s=2.2, a=(540,760)
def shot1(board_w,f):
    S=lambda p:(540+(p[0]-f[0])*2.2,760+(p[1]-f[1])*2.2)
    pw=lambda k:(board_w[0]+PINS[k][0]*BOARDS,board_w[1]+PINS[k][1]*BOARDS)
    r={}
    for k,(p,sd,d) in S8.items():
        b,_=tag(S(pw(p)),sd,d,W[k],2.2*BOARD_TAG_S); r[k]={'body':[round(v,1) for v in b],'in_frame':inframe(b),'pin_x':round(S(pw(p))[0],1)}
    return r
out['shot1']={'a':shot1((540,40),(816,398)),'b':shot1((500,150),(778,685))}
ok=(out['eval_type_px_at_270']>=12 and out['tag_scale_end']>=out['s8_shot1_tag_scale'] and not out['visible_tag_overlaps']
    and vis==['evaluating'] and not any(t['string_in_pill'] or t['body_in_pill'] for t in out['tags'].values())
    and out['lowest_figure_row_bottom_y']<0 and out['bar_bottom_y']<PILL[1] and out['answer_clear_of_pill'] and out['above_caption']
    and all(out['chart_clear_of_eval'].values()) and all(out['chart_clear_of_open_tags'].values())
    and all(not v['decision']['in_frame'] and not v['report']['in_frame'] and v['evaluating']['in_frame'] for v in out['shot1'].values()))
out['pass']=ok
print(json.dumps(out,indent=1)); raise SystemExit(0 if ok else 1)
