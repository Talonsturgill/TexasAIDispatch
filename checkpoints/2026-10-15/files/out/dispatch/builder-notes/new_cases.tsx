//@@street-yard
 case 'street-yard':{
  // s1 wide: the university's general example, a San Antonio yard with NO station in it. Water from
  // the flooded street tops the limestone curb and spreads across the yard; on the chain link post the
  // waterline climbs to its orange ankle mark and reaches the rain boots on the porch step while the
  // phone on the porch rail stays dark. A holds and pushes in slowly on the post. B arrives on a match
  // cut from the design detail's ankle-height lens to the post's ankle mark at the same screen spot,
  // then pulls back to the whole yard.
  const spread=s1e1;
  const front=lerp(1150,1300,ease(spread))+lerp(0,74,s1e2);
  const fence:Pt=[600,1300], fs=1.5, post:Pt=[fence[0]+175*fs,fence[1]];
  const markDepth=lerp(0,30,ease(spread))*fs+lerp(0,6,s1e2);
  const porch:Pt=[-30,1400], rail:Pt=[porch[0]+PORCH.railTop[0],porch[1]+PORCH.railTop[1]];
  const boots:Pt=[porch[0]+PORCH.w*.56,porch[1]-34];
  const bootDepth=clamp((front-1330)/40)*22;
  const world=<g>
   <Item id="s1-water">{curbside({curbY:1102,streetTop:1046,water:{front},grounded:exterior})}</Item>
   <Grounded baseY={1196} on={exterior}><At p={[1000,1196]}><StreetHubSupport part="oak" h={640} seed={9} flip/></At></Grounded>
   <Grounded baseY={fence[1]} on={exterior}><Item id="s1-post"><At p={fence} s={fs}><StreetHubSupport part="fence" x0={0} x1={350} h={300} posts={3} mark={1}/></At>
    {waterline(post[0],post[1],22,markDepth)}</Item></Grounded>
   <Grounded baseY={porch[1]} on={exterior}><At p={porch}><StreetHubSupport part="porch"/></At>
    <At p={boots}><StreetHubSupport part="boots"/></At>{waterline(boots[0]+60,boots[1],70,bootDepth)}
    <Item id="s1-phone"><At p={[rail[0]+60,rail[1]-10]}><g transform="scale(.3 .11) rotate(90)"><StreetHubSupport part="phone" pal={pal} banner={0} t={t}/></g></At></Item></Grounded>
   {rain(.28)}
  </g>;
  if(v==='a'){
   const push=ease(raw({start:shot.start_s,end:shot.start_s+shot.duration_s}));
   pic=<Cam f={mix([540,980],[660,1060],push)} s={lerp(1,1.08,push)} a={mix([540,980],[600,1020],push)}>{world}</Cam>;
  }else{
   const e=ease(raw({start:shot.start_s,end:win('s1-event-1').end}));
   pic=<Cam f={mix([post[0],post[1]-39],[540,1000],e)} s={lerp(2.2,1,e)} a={mix([540,1154],[540,1000],e)}>{world}</Cam>;
  }
  break;}
//@@phone-late
 case 'phone-late':{
  // s1 close, looking down at the porch rail's wide cap board. The worn phone lies on it, dark, the
  // flood below the balusters; the warning banner slides in only now, after the water is in the yard.
  const rot=v==='a'?-10:8, at0:Pt=v==='a'?[540,950]:[560,960];
  pic=<g data-world="porch-rail">
   <Item id="s1-water"><StreetHubSupport part="water" x0={-60} x1={1140} y={1300} depth={660} t={t} edge="straight"/></Item>
   {Array.from({length:6},(_,i)=><rect key={i} x={40+i*180+(v==='a'?0:60)} y={1280} width={34} height={420} fill="#EDE6D6" stroke="#BDB2A0" strokeWidth={2}/>)}
   <path d="M-40 700L1120 676L1120 1222L-40 1252Z" fill="#F3EEE3" stroke="#BDB2A0" strokeWidth={3}/>
   <path d="M-40 1252L1120 1222L1120 1282L-40 1314Z" fill="#D5CBB8"/>
   {[[150,780],[760,1170],[930,760],[300,1200]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={30+i*8} ry={4} fill="#B8AD98" opacity={.6}/>)}
   <path d="M-40 708L1120 684" stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
   <Item id="s1-phone"><At p={at0} s={1.5} r={rot}><g transform="scale(1 .85)">
    <Item id="s1-banner"><StreetHubSupport part="phone" pal={pal} banner={s1e3} t={t}/></Item></g></At></Item>
   {rain(.22)}
  </g>;
  break;}
//@@station-wide
 case 'station-wide':{
  // s2 wide: the whole prototype station at the curb, standing in shallow water with its lowest mark
  // lit, revealed on s2-event-1 while "its researchers built a flood station" is heard. A tilts up from
  // the wet foot; B cranes down from the antenna tip to the whole station.
  const base:Pt=[500,1380], s=.86;
  const world=<g>
   {curbside({curbY:1240,streetTop:1110,water:{front:1430},grounded:exterior})}
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><Item id="s2-post"><Item id="s2-panel"><At p={base} s={s}>{station({})}</At></Item></Item></Item>
    {waterline(base[0]+8,base[1],34,-LEVEL.ankle*s)}
    <At p={[base[0]+130,base[1]-860]}>{tag(['Prototype','flood station'],s2e1,{side:'right',drop:30,scale:.9})}</At></Grounded>
   {rain(.2)}
  </g>;
  const e=ease(raw({start:shot.start_s,end:win('s2-event-1').end}));
  pic=v==='a'
   ?<Cam f={mix([base[0],base[1]-140],[540,860],e)} s={lerp(1.7,1,e)} a={mix([540,1100],[540,860],e)}>{world}</Cam>
   :<Cam f={mix([base[0]+80*s,base[1]-1080*s],[540,860],e)} s={lerp(2.0,1,e)} a={mix([560,560],[540,860],e)}>{world}</Cam>;
  break;}
//@@panel-charge
 case 'panel-charge':{
  // s2 close. Low sun from the upper left reaches the small panel, a glint crosses its cells and the
  // battery bar fills cell by cell on s2-event-2 ("that charges itself from light"). B holds this close
  // through "and needs no cell tower": a far cell tower stands on the horizon behind the antenna and a
  // dashed line toward it stops halfway on s2-event-3.
  const s=v==='a'?1.6:1.85, base:Pt=v==='a'?[560,2560]:[600,2830];
  const sun=s2e2, beam=clamp(s2e2*3)*(1-.4*clamp((s2e2-.8)*5));
  const tip:Pt=[base[0]+110*s,base[1]-1146*s], towerAt:Pt=[985,1036], towerTop:Pt=[985,1036-460*.5];
  const end=mix(tip,towerTop,lerp(0,.5,ease(s2e3)));
  pic=<g data-world="panel-close">
   {v==='b'&&<Item id="s2-tower"><At p={towerAt} s={.5}><StreetHubSupport part="tower" h={420} dim={.25}/></At></Item>}
   <path d={`M-200 -200L${base[0]-28*s-200} ${base[1]-1062*s-120}L${base[0]-28*s+120} ${base[1]-1062*s+60}Z`} fill="#FFE2B6" opacity={.28*beam}/>
   <path d={`M-200 -200L${base[0]-28*s-120} ${base[1]-1062*s-40}`} stroke="#FFF1D8" strokeWidth={6} opacity={.35*beam}/>
   <Item id="s2-station"><At p={base} s={s}><Item id="s2-panel"><Item id="s2-battery">{station({sun,sunStrength:beam,shadow:0})}</Item></Item></At></Item>
   <At p={[120,560]}>{tag(['Charges from light'],s2e2,{side:'right',drop:24,scale:.85})}</At>
   {v==='b'&&s2e3>0&&<g data-part="unconnected-link"><path d={`M${tip[0]} ${tip[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round"/>
    <circle cx={end[0]} cy={end[1]} r={13} fill="none" stroke={pal.ink} strokeWidth={5}/></g>}
   {v==='b'&&<At p={[1040,520]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:24,scale:.8})}</At>}
   {rain(.12)}
  </g>;
  break;}
//@@water-marks
 case 'water-marks':{
  // The signature view: the post's sensor column large, brown water rising past its marks, each mark
  // lighting as the water reaches it. B s1 opens on it as a disclosed DESIGN DETAIL with no yard,
  // fence or household around it: the lowest, ankle-height lens goes under and lights. In s3 the water
  // rises from the first mark past the second on s3-event-2 ("watch the water"), after the four lenses
  // have caught the light in turn on s3-event-1. A frames the column left of centre and holds; B frames
  // it right of centre, lower, and settles back as the lenses catch the light.
  const detail=at('s1');
  const base:Pt=detail?[520,1340]:v==='a'?[470,1380]:[650,1330];
  const s=detail?3.2:v==='a'?2.3:2.0;
  const glints=at('s3')?[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i))):[0,0,0,0];
  const ids=detail?['s1-post','s1-marks','s1-water']:['s3-stack','s3-marks','s3-water'];
  const inner=<g data-world={detail?'design-detail':'sensor-column'}>
   <Item id={ids[0]}><Item id={ids[1]}><At p={base} s={s}>{station({shadow:0})}</At></Item></Item>
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+10)*s} cy={base[1]+q[1]*s} r={52*glints[i]} fill="#FFF4DA" opacity={.5*glints[i]}/>;})}
   <Item id={ids[2]}><StreetHubSupport part="water" x0={-80} x1={1160} y={base[1]+level*s} depth={800} t={t} edge="straight" opacity={.88}/></Item>
   {!detail&&rain(.18)}
  </g>;
  pic=v==='b'&&at('s3')?<Cam f={[600,1000]} s={lerp(1.25,1,ease(s3e1))} a={[560,980]}>{inner}</Cam>:inner;
  break;}
//@@chip-glow
 case 'chip-glow':{
  // s4. The housing opened: readings run in along thin traces from the four marks and the four weather
  // sensors to one small chip on s4-event-1 ("A small chip on the station runs the AI itself"). In the
  // detail framing the view pushes in on the chip and the amber risk lamp on the board, which light on
  // s4-event-2 ("so it judges flood risk"). No cable leaves the box for a server.
  const c:Pt=[520,820], s=1.25, lamp:Pt=[c[0]+70*s,c[1]+128*s];
  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s4-event-2').start})):0;
  const chipGlow=Math.max(.35*s4e1,s4e2);
  pic=<g data-world="housing-cutaway"><Cam f={mix(c,mix(lamp,[c[0]+36*s,c[1]+20*s],.5),push)} s={lerp(1,1.45,push)} a={mix(c,[540,820],push)}>
   <Item id="s4-traces"><Item id="s4-chip"><Item id="s4-risk"><At p={c} s={s}>
    <FloodStationHero part="cutaway" readings={s4e1} chip={chipGlow} risk={s4e2} battery={battery}/></At></Item></Item></Item>
  </Cam>
   <At p={[90,300]}>{tag(['Judged on','the station'],s4e2,{side:'right',drop:24,scale:.9})}</At>
  </g>;
  break;}
//@@no-server
 case 'no-server':{
  // s4. Close (B's opening shot of the scene): the station's housing large, its window glowing as
  // readings run along its traces to the chip on s4-event-1, seen from the street. Wide (both
  // treatments' last shot, "without a central server"): the station large in the right foreground and,
  // far off on the left, a dashed outline of a central server that draws itself and stays dark on
  // s4-event-3, with nothing running between them. A low angle unlike the cell tower shot.
  if(fr==='close'){
   const base:Pt=[560,2300], s=1.5;
   pic=<g data-world="housing-window">
    <Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1,readings:s4e1,shadow:0})}</At></Item></Item></Item>
    {rain(.14)}
   </g>;
   break;
  }
  const base:Pt=[800,1430], s=1.05;
  const draw=ease(s4e3);
  pic=<g data-world="curbside-no-server">
   {curbside({curbY:1180,streetTop:1070,water:{front:1430},grounded:exterior})}
   <Item id="s4-server"><At p={[250,900]} s={.7} o={lerp(.2,1,draw)}><g opacity={1-.35*Math.sin(Math.PI*clamp(s4e3*2-1))}>
    <StreetHubSupport part="server" pal={pal} dark={1}/></g></At></Item>
   <Grounded baseY={base[1]} on={exterior}><Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1})}</At></Item></Item></Item></Grounded>
   <At p={[400,990]}>{tag(['No line to it'],clamp((s4e3-.4)/.6),{side:'right',drop:20,scale:.9})}</At>
   {rain(.18)}
  </g>;
  break;}
//@@radio-open
 case 'radio-open':
 case 'hub-wide':{
  // s5 open country. A wide ring rolls in across open fields from the station's side; the leading ring
  // arrives at the hub's rooftop mast at the middle of s5-event-3 and the mast lamp lights as it does,
  // as the five-mile tag pins ("up to five miles in open country, to a hub").
  const hubAt:Pt=view==='radio-open'?[730,1210]:[560,1290], hs=view==='radio-open'?.62:1.0;
  const origin:Pt=[-260,view==='radio-open'?900:960], rx=1500, ry=700;
  const mast:Pt=[hubAt[0]+(-126)*hs,hubAt[1]+(-622)*hs];
  const arrive=Math.hypot((mast[0]-origin[0])/rx,(mast[1]-origin[1])/ry);   // the leading ring's u at the mast
  const e3=win('s5-event-3'), tm=(e3.start+e3.end)/2;
  const ringP=clamp((t-shot.start_s)/(tm-shot.start_s)*arrive/1.44);
  const lead=ringP*1.44, lamp=clamp((lead-arrive)/.06);
  const fenceY=view==='radio-open'?1150:1180;
  pic=<g data-world="open-country">
   <Grounded baseY={1120} on={exterior}>
    <StreetHubSupport part="lawn" d="M-60 1060L1140 1050L1140 1980L-60 1980Z" box={[-60,1050,1200,930]} seed={23}/>
    {Array.from({length:6},(_,i)=><path key={i} d={`M${-60+i*240} 1980L${300+i*90} 1060`} stroke="#7E8A4A" strokeWidth={22} opacity={.35}/>)}
    <path d="M-60 1120Q500 1100 1140 1140" stroke="#C9B994" strokeWidth={18} fill="none"/>
   </Grounded>
   <Grounded baseY={fenceY} on={exterior}><At p={[80,fenceY]} s={.8}><StreetHubSupport part="fence" x0={0} x1={420} h={260} posts={4} mark={-1}/></At></Grounded>
   <Item id="s5-hub"><Grounded baseY={hubAt[1]} on={exterior}><At p={hubAt} s={hs}><StreetHubSupport part="hub" lamp={lamp} pal={pal}/></At></Grounded></Item>
   <Item id="s5-ring"><At p={origin}><StreetHubSupport part="rings" p={ringP} rx={rx} ry={ry} n={3} pal={pal} width={7}/></At></Item>
   <Item id="s5-tags"><Item id="s5-fivemile"><At p={view==='radio-open'?[120,960]:[60,880]}>{tag(['Up to five miles','in open country'],s5e3,{side:'right',drop:22,scale:.8,tone:'accent'})}</At></Item></Item>
  </g>;
  break;}
//@@radio-map
 case 'radio-map':{
  // B s5 overhead. The street map from above: a ring leaves the station dot on s5-event-1 and spreads
  // over the city grid toward open country and the hub. The half-mile circle is a tenth of the
  // five-mile circle, and each label appears only as the ring reaches its circle.
  const m:Pt=[80,300], mw=840, mh=960, stationAt:Pt=[300,330], hubAt:Pt=[700,860];
  const lead=clamp(s5e1*1.3);
  pic=<g data-world="radio-map">
   <Item id="s5-station-dot"><Item id="s5-ring"><At p={m}><StreetHubSupport part="radiomap" w={mw} h={mh} ring={s5e1} half={.6} five={.6} hub={0} pal={pal} station={stationAt} hubAt={hubAt}/></At></Item></Item>
   <Item id="s5-tags"><g opacity={clamp((lead-.1)*8)}><At p={[m[0]+stationAt[0]+90,m[1]+stationAt[1]-110]}><StreetHubSupport part="label" text="More than a half-mile" pal={pal} size={30}/></At></g>
   <g opacity={clamp((lead-.92)*12)}><At p={[m[0]+330,m[1]+mh-120]}><StreetHubSupport part="label" text="Up to five miles" pal={pal} size={30}/></At></g></Item>
  </g>;
  break;}
//@@hub-desk
 case 'hub-desk':{
  // s6 inside the hub, close on the desk, so the window behind is only soft light. A: station dots
  // arrive on the dashboard and a tag names the second, larger model (s6-event-1) as a responder's
  // sleeved forearm swings down to rest. B: the dashed higher-risk outlines settle on the screen and
  // the forearm comes to rest beside it as the responders tag pins (s6-event-3).
  const scr:[number,number,number,number]=[170,630,740,470];
  const arm=v==='a'?ease(raw({start:win('s6-event-1').start,end:win('s6-event-1').end+.4})):s6e3;
  pic=<g data-world="hub-desk"><g transform="translate(0 -160)">
   <Item id="s6-dashboard"><Item id="s6-hand"><StreetHubSupport part="desk" arm={arm} screen={scr}>
    <Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones"><StreetHubSupport part="dashboard" w={scr[2]} h={scr[3]} dots={v==='a'?s6e1:1} paths={v==='a'?.15*s6e1:1} zones={v==='a'?0:s6e3} t={t} pal={pal}/></Item></Item></Item>
   </StreetHubSupport></Item></Item>
  </g>
   {v==='a'&&<At p={[640,320]}>{tag(['A second,','larger model'],s6e1,{side:'right',drop:22,scale:.85})}</At>}
   {v==='b'&&<At p={[640,320]}>{tag(['For emergency','responders'],s6e3,{side:'right',drop:22,scale:.85})}</At>}
  </g>;
  break;}
//@@flood-paths
 case 'flood-paths':{
  // s6 overhead on the hub's screen. Shaded flood paths spread from the first dots along the low
  // streets (s6-event-2, "draws a map of how flooding could spread"). A: higher-risk zones outline
  // themselves and the responders tag pins (s6-event-3). B opens here: the dots arrive and the second,
  // larger model tag pins (s6-event-1) before the paths spread.
  const x=50,y=280,w=980,h=1000;
  pic=<g data-world="dashboard-screen">
   <rect x={x-26} y={y-26} width={w+52} height={h+52} rx={18} fill="#26292B" stroke="#121415" strokeWidth={4}/>
   <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
    <Item id="s6-dashboard"><Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones">
     <StreetHubSupport part="dashboard" w={w} h={h} dots={v==='a'?1:s6e1} paths={s6e2} zones={v==='a'?s6e3:0} t={t} pal={pal}/></Item></Item></Item></Item>
   </svg>
   <At p={[600,400]}>{v==='a'?tag(['For emergency','responders'],s6e3,{side:'right',drop:20,scale:.8}):tag(['A second,','larger model'],s6e1,{side:'right',drop:20,scale:.8})}</At>
  </g>;
  break;}
//@@validation-card
 case 'validation-card':
 case 'no-field-card':{
  // s7, on the wall, in clause order in both treatments. The validation card's bar fills and the
  // university's reported figure appears and holds (s7-event-1, "The university reports ninety eight
  // point eight two percent"); the initial assessments tag pins under it (s7-event-2); the field result
  // card stays blank and takes its none reported stamp only on "and no field result" (s7-event-3).
  // validation-card: the card alone, the blank card's edge beside it; its detail framing pushes in on
  // the bar end and the tag. no-field-card: both cards side by side, the blank card emphasised.
  if(view==='validation-card'){
   const push=fr==='detail'?ease(raw({start:shot.start_s,end:shot.start_s+1})):0;
   const resAt:Pt=v==='a'?[900,470]:[-330,470];
   pic=<Cam f={[560,700]} s={lerp(1,1.3,push)} a={[560,700]}><g data-world="validation-card">
    <Item id="s7-card"><Item id="s7-bar"><At p={[200,400]}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At></Item></Item>
    <Item id="s7-tag"><At p={[260,780]}>{tag(['Initial assessments','after training'],s7e2,{side:'right',drop:30,scale:.92})}</At></Item>
    <Item id="s7-card2"><Item id="s7-blank"><At p={resAt} s={.85}><StreetHubSupport part="result" stamp={0} pal={pal}/></At></Item></Item>
   </g></Cam>;
   break;
  }
  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s7-event-3').start})):0;
  pic=<Cam f={mix([540,700],[726,700],push)} s={lerp(1,1.12,push)} a={mix([540,700],[600,700],push)}><g data-world="two-cards">
   <Item id="s7-card"><Item id="s7-bar"><At p={[40,560]} s={.62}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At></Item></Item>
   <Item id="s7-tag"><At p={[60,810]}>{tag(['Initial assessments','after training'],s7e2,{side:'right',drop:24,scale:.62})}</At></Item>
   <Item id="s7-card2"><Item id="s7-blank"><At p={[460,500]} s={.95}><StreetHubSupport part="result" stamp={s7e3} pal={pal}/></At></Item></Item>
  </g></Cam>;
  break;}
//@@empty-map
 case 'empty-map':{
  // The ONE paper street map, close: it is pinned to the chain link fence at the curb, the same map the
  // station-return wide shows. s8: it settles on the mesh (s8-event-1), a search ring sweeps it and finds
  // no installed station (s8-event-2) and the no installation tag pins (s8-event-3). B s9: the tag stays,
  // a dashed goal pin hovers and does not land (s9-event-1), a dashed ring draws itself on the empty spot
  // beneath it (s9-event-2) and the deployment goal tag pins (s9-event-3).
  const close=at('s9');
  const settle=at('s8')?ease(s8e1):1, noTown=at('s8')?s8e3:1;
  const m:Pt=[120,lerp(300,330,settle)], mw=840, mh=940;
  const sx=close?'s9':'s8';
  pic=<g data-world="paper-map-on-fence">
   <Item id={sx+'-fence'}><At p={[-40,1400]} s={2.6}><StreetHubSupport part="fence" x0={0} x1={460} h={420} posts={3} lean={1.5} mark={-1}/></At></Item>
   <Item id={sx+'-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-spot':'s8-search'}><At p={m} r={lerp(4,-1,settle)} o={clamp(settle*3+.2)}>
    <StreetHubSupport part="mapcard" w={mw} h={mh} search={at('s8')?s8e2:0} goal={close?s9e1:0} spot={close?s9e2:0} pal={pal}/></At></Item></Item></Item>
   {[[m[0]+30,m[1]+14],[m[0]+mw-34,m[1]+18]].map(([x,y2],i)=><circle key={i} cx={x} cy={y2} r={11} fill="#5A5249" stroke="#2E2A26" strokeWidth={2}/>)}
   <Item id={sx==='s8'?'s8-tag':'s9-notown'}><At p={[m[0]+mw-60,m[1]+40]}>{tag(['No installation','named'],noTown,{side:'left',drop:26,scale:.95,tone:'ink'})}</At></Item>
   {close&&<Item id="s9-tag"><At p={[m[0]+mw*.55+80,m[1]+mh*.48-190]}>{tag(['Deployment goal'],s9e3,{side:'right',drop:24,scale:.9,tone:'accent'})}</At></Item>}
  </g>;
  break;}
//@@station-return
 case 'station-return':{
  // The curb again, with NO station standing there and no flood: a wet street after the rain, the
  // chain link fence and the same paper map pinned to it. B s8: the map on the fence beside the empty
  // curb (s8-event-1), a search ring sweeps it and finds nothing installed (s8-event-2), the no
  // installation tag pins (s8-event-3). A s9: the tag stays, a dashed goal pin hovers over the map and
  // does not land (s9-event-1), a dashed outline of the station draws itself at the curb where one could
  // stand, uninstalled (s9-event-2), and the deployment goal tag pins (s9-event-3).
  const close=at('s9');
  const card:Pt=[650,905], cw=300, ch=336;
  const swing=close?1:ease(s8e1), noTown=close?1:s8e3;
  const sx=close?'s9':'s8';
  pic=<g data-world="curbside-after">
   {curbside({curbY:1210,streetTop:1090,grounded:exterior})}
   <Item id={sx+'-fence'}><Grounded baseY={1330} on={exterior}><At p={[600,1330]} s={1.1}><StreetHubSupport part="fence" x0={0} x1={420} h={400} posts={3} mark={-1}/></At></Grounded></Item>
   <Item id={sx+'-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-map-pin':'s8-search'}><At p={card} r={lerp(10,-1,swing)} o={clamp(swing*3+.2)}>
    <StreetHubSupport part="mapcard" w={cw} h={ch} search={close?0:s8e2} goal={close?s9e1:0} pal={pal}/></At></Item></Item></Item>
   {[[card[0]+12,card[1]+6],[card[0]+cw-14,card[1]+8]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={7} fill="#5A5249"/>)}
   {close&&<Item id="s9-station"><Grounded baseY={1400} on={exterior}><At p={[360,1400]} s={.84}><FloodStationHero part="outline" p={s9e2} pal={pal}/></At></Grounded></Item>}
   <Item id={sx==='s8'?'s8-tag':'s9-notown'}><At p={[950,640]}>{tag(['No installation','named'],noTown,{side:'left',drop:20,scale:.8,tone:'ink'})}</At></Item>
   {close&&<Item id="s9-tag"><At p={[560,500]}>{tag(['Deployment goal'],s9e3,{side:'right',drop:24,scale:.85,tone:'accent'})}</At></Item>}
  </g>;
  break;}
