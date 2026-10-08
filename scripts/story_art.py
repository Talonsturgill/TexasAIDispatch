"""Fresh per-edition ImageGen props, with pre-execution charges and exact source bounds."""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import shutil
from zoneinfo import ZoneInfo
from PIL import Image

REPO=Path(__file__).resolve().parents[1]
PUBLIC=REPO/'video-engine/public'
POLICY=REPO/'config/story_art.json'


def read(path):return json.loads(Path(path).read_text())
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'))
def fingerprint(value):return hashlib.sha256(canonical(value).encode()).hexdigest()


def request_problems(board):
    cfg=read(POLICY); plan=board.get('story_art') or {}
    if plan.get('version')!=cfg['version']:return ['current film requires fresh-story-art-v1']
    rows=plan.get('requests')
    if not isinstance(rows,list) or len(rows)!=2:return ['storyboarding requires exactly two fresh ImageGen requests']
    errors=[]; ids=set(); scenes={s['id'] for s in board.get('scenes',[])}
    if {r.get('role') for r in rows}!=set(cfg['roles']):errors.append('story art needs a hero and purposeful supporting art')
    for row in rows:
        key=row.get('id'); ids.add(key)
        if not isinstance(key,str) or not key.replace('-','').isalnum():errors.append('story art needs stable request ids')
        if (len(str(row.get('prompt','')).split())<30 or len(str(row.get('purpose','')).strip())<30
            or len(str(row.get('source_limit','')).strip())<30):errors.append('story art must direct a relevant finished subject and explicit source limit')
        if not row.get('scene_ids') or not set(row['scene_ids'])<=scenes:errors.append('story art must name its current on-screen scenes')
        file=str(row.get('file',''))
        if (not file.startswith('generated/story-art/'+str(board.get('date'))+'/')
            or '..' in Path(file).parts or Path(file).suffix!='.png'):errors.append('fresh art needs its own edition namespace')
    if len(ids)!=len(rows):errors.append('fresh art requests must be distinct')
    return errors


def problems(board,repo=REPO):
    errors=request_problems(board)
    if errors:return errors
    cfg=read(POLICY); plan=board['story_art']; entries=plan.get('entries',[])
    requests={r['id']:r for r in plan['requests']}
    if {e.get('request_id') for e in entries}!=set(requests) or len(entries)!=len(requests):
        return ['both fresh storyboard images must be generated and recorded before animation']
    seen=set(); generations=set(); pixels=set()
    for row in entries:
        req=requests[row['request_id']]; path=(Path(repo)/'video-engine/public'/req['file']).resolve()
        try:
            if not path.is_relative_to((Path(repo)/'video-engine/public').resolve()):raise ValueError('asset leaves public')
            if row.get('file')!=req['file'] or digest(path)!=row.get('sha256'):raise ValueError('asset bytes changed')
            if row.get('prompt_sha256')!=fingerprint(req):raise ValueError('generation belongs to a different storyboard request')
            if row.get('tool')!=cfg['tool'] or len(str(row.get('generation_id','')))<20:raise ValueError('original generation identity absent')
            generated=datetime.fromisoformat(row['generated_at'].replace('Z','+00:00'))
            if generated.astimezone(ZoneInfo('America/New_York')).date().isoformat()<str(board['date']):raise ValueError('asset predates this edition')
            if row['generation_id'] in generations or row['sha256'] in pixels:raise ValueError('two fresh calls must produce distinct original assets')
            generations.add(row['generation_id']);pixels.add(row['sha256'])
            im=Image.open(path);im.verify()
            if max(im.size)<cfg['min_long_edge']:raise ValueError('generated image too small for finished native artwork')
            if (row.get('width'),row.get('height'))!=im.size:raise ValueError('generated image dimensions differ from its measured sprite inputs')
            for rect in row.get('slices',{}).values():
                if (not isinstance(rect,list) or len(rect)!=4 or not all(type(n) is int for n in rect)
                    or rect[0]<0 or rect[1]<0 or rect[2]<=0 or rect[3]<=0
                    or rect[0]+rect[2]>im.width or rect[1]+rect[3]>im.height):raise ValueError('generated prop slice leaves its actual image')
            charge=row['charge'];event=charge['event']
            if fingerprint(event)!=charge['event_sha256']:raise ValueError('generation charge evidence changed')
            if charge['kind']=='production':
                if event.get('kind')!='reserved' or event.get('resources')!={'image_generations':1}:raise ValueError('generation lacks one prior production charge')
            elif charge['kind']=='engineering' and board.get('reference_only') is True:
                if event.get('kind')!='charged' or event.get('resource')!='art_assets' or event.get('count')!=1:raise ValueError('engineering image charge absent')
            else:raise ValueError('lab evidence cannot fund production artwork')
            if datetime.fromisoformat(event['at'].replace('Z','+00:00'))>=generated:raise ValueError('generation was not charged before execution')
            identity=(charge['kind'],charge['index'])
            if identity in seen:raise ValueError('one charge cannot generate two assets')
            seen.add(identity)
            older=list((Path(repo)/'runs').glob('*/storyboard.json'))+list((Path(repo)/'experiments').glob('*/board-*.json'))
            for old in older:
                previous=read(old)
                if str(previous.get('date',old.parent.name))>=str(board['date']):continue
                for prior in previous.get('story_art',{}).get('entries',[]):
                    if row['sha256']==prior.get('sha256') or row['generation_id']==prior.get('generation_id'):
                        raise ValueError('prior-edition artwork cannot be reused as fresh')
        except (OSError,ValueError,KeyError,TypeError) as exc:errors.append('fresh storyboard art invalid: '+str(exc))
    return errors


def charge_problems(board,root):
    if board.get('reference_only') is True:return []
    try:
        state=read(Path(root)/'run_state.json')
        if state.get('run_id','')[:10]!=board.get('date'):raise ValueError('art ledger belongs to a different edition')
        for item in board['story_art']['entries']:
            charge=item['charge']
            if charge['kind']!='production' or fingerprint(state['events'][charge['index']])!=charge['event_sha256']:
                raise ValueError('fresh art charge is absent from the cumulative production ledger')
        return []
    except (OSError,ValueError,KeyError,TypeError,IndexError) as exc:return ['fresh-art production accounting failed: '+str(exc)]


def paths(board,public=PUBLIC):
    return [Path(public)/row['file'] for row in (board.get('story_art') or {}).get('entries',[])]


def stage(board_path,repo=REPO):
    """Carry the exact ignored raster assets into the release's clean checkout."""
    import subprocess
    from modern_film import required
    board=read(board_path)
    if not required(board):return []
    errors=problems(board,repo)+charge_problems(board,Path(board_path).parent)
    if errors:raise ValueError('; '.join(errors))
    media=paths(board,Path(repo)/'video-engine/public')
    subprocess.run(['git','-C',str(repo),'--literal-pathspecs','add','-f','--',*[str(p.resolve()) for p in media]],check=True)
    return media


def reserve(board_path,state_path,request_id):
    from run_controller import reserve as charge,read_state
    board=read(board_path);errors=request_problems(board)
    if errors:raise ValueError('; '.join(errors))
    req=next(r for r in board['story_art']['requests'] if r['id']==request_id)
    ok,message=charge(Path(state_path),{'image_generations':1},'Fresh ImageGen '+request_id+' request '+fingerprint(req))
    if not ok:raise ValueError(message)
    state=read_state(Path(state_path)); index=len(state['events'])-1;event=state['events'][index]
    return {'kind':'production','index':index,'event':event,'event_sha256':fingerprint(event)}


def record(board_path,source,request_id,generation_id,generated_at,charge_path):
    board=read(board_path);errors=request_problems(board)
    if errors:raise ValueError('; '.join(errors))
    req=next(r for r in board['story_art']['requests'] if r['id']==request_id)
    target=PUBLIC/req['file'];target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists() and digest(target)!=digest(source):raise ValueError('retain rejected artwork; a new attempt needs a new asset filename')
    if Path(source).resolve()!=target.resolve():shutil.copyfile(source,target)
    im=Image.open(target)
    entry=dict(request_id=request_id,file=req['file'],sha256=digest(target),prompt_sha256=fingerprint(req),
               generation_id=generation_id,generated_at=generated_at,tool=read(POLICY)['tool'],charge=read(charge_path))
    entry.update(width=im.width,height=im.height)
    entries=board['story_art'].setdefault('entries',[])
    existing=next((row for row in entries if row['request_id']==request_id),None)
    if existing:
        if all(existing.get(key)==value for key,value in entry.items()):return existing
        raise ValueError('retain the original generation record; a correction needs a new request id')
    entries.append(entry);Path(board_path).write_text(json.dumps(board,indent=2)+'\n')
    return entry


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--board',type=Path,required=True)
    sub=p.add_subparsers(dest='action',required=True)
    r=sub.add_parser('reserve');r.add_argument('--state',type=Path,required=True);r.add_argument('--request',required=True);r.add_argument('--out',type=Path,required=True)
    r=sub.add_parser('record');r.add_argument('--source',type=Path,required=True);r.add_argument('--request',required=True);r.add_argument('--generation-id',required=True);r.add_argument('--generated-at',required=True);r.add_argument('--charge',type=Path,required=True)
    sub.add_parser('verify');sub.add_parser('stage');a=p.parse_args()
    if a.action=='reserve':
        result=reserve(a.board,a.state,a.request);a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(result,indent=2)+'\n');print('Fresh ImageGen call charged; use this exact request, then record the original output.')
    elif a.action=='record':print(json.dumps(record(a.board,a.source,a.request,a.generation_id,a.generated_at,a.charge),indent=2))
    elif a.action=='stage':print('Exact fresh raster assets staged: '+str(len(stage(a.board))))
    else:
        errors=problems(read(a.board))+charge_problems(read(a.board),a.board.parent)
        print('\n'.join(errors) if errors else 'Fresh storyboard artwork, exact pixels and pre-execution charges verified.')
        raise SystemExit(bool(errors))
