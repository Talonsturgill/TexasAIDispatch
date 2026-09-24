#!/usr/bin/env python3
"""Build or verify an exact-film attention review pack. This never certifies creative quality."""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import math
import os
import subprocess
from pathlib import Path
import sys
import tempfile
from PIL import Image, ImageDraw, ImageFont
import documentary_check as direction
from preflight_animatic import frame, probe

REPO=Path(__file__).resolve().parents[1]
def digest(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest()

def pacing_review_required(board: dict) -> bool:
    # Preserve the review contract of films released before this upgrade.
    return str(board.get("date") or "") >= direction.policy()["pacing_review_effective_date"]

def panel_problems(scores: list, film_hash: str, runtime: float, *,
                   require_pacing: bool = False) -> list[str]:
    if not isinstance(scores,list) or len(scores)!=3:return ["three independent attention reviews required"]
    errors=[]
    for i,judge in enumerate(scores):
        review=judge.get("attention_review") if isinstance(judge,dict) else None
        if not isinstance(review,dict):
            errors.append(f"judge {i+1} has no attention_review");continue
        if review.get("film_sha256")!=film_hash:errors.append(f"judge {i+1} reviewed different film bytes")
        if review.get("pass") is not True:errors.append(f"judge {i+1} did not accept the attention/continuity")
        fields=("hook_observed","continuity_observed","remembered_image","weakest_interval","audio_basis")
        if require_pacing:
            fields+=("pacing_observed","comprehension_observed")
        for key in fields:
            if not isinstance(review.get(key),str) or len(review[key].strip())<12:
                errors.append(f"judge {i+1} lacks a concrete {key}")
        at=review.get("weakest_at_s")
        if not direction.finite(at) or not 0<=at<runtime:
            errors.append(f"judge {i+1} needs a real weakest_at_s within the story")
        if require_pacing:
            end=review.get("weakest_end_s")
            if not (direction.finite(at) and direction.finite(end) and 0<=at<end<=runtime):
                errors.append(f"judge {i+1} needs weakest_end_s after weakest_at_s and within the story")
    return errors

def report_problems(report:dict, board:Path, film:Path, out:Path) -> list[str]:
    errors=[]
    if report.get("schema")!="dispatch_attention_review/1":errors.append("wrong attention review schema")
    for key,path in (("board_sha256",board),("film_sha256",film)):
        if not path.is_file() or report.get(key)!=digest(path):errors.append(key+" is stale")
    for key in ("contact_sheet","player"):
        item=report.get(key)
        if not isinstance(item,dict) or not isinstance(item.get("file"),str):
            errors.append(key+" missing");continue
        path=out.parent/item["file"]
        if not path.is_file() or digest(path)!=item.get("sha256"):errors.append(key+" changed or missing")
    return errors

def publication_problems(board_path:Path, film:Path, judges:list) -> list[str]:
    """Shared by triage and the independent final ship gate. Fail closed on missing evidence."""
    try:
        board=json.loads(board_path.read_text())
        if not direction.required(board):return []
        out=film.parent/"attention-review.json"
        errors=direction.check(board)
        errors+=report_problems(json.loads(out.read_text()),board_path,film,out)
        errors+=panel_problems(judges,digest(film),float(board["runtime_s"]),
                               require_pacing=pacing_review_required(board))
        from production_quality import publication_problems as quality_problems
        errors += quality_problems(board_path, film, judges)
        return errors
    except (OSError,ValueError,TypeError,KeyError) as exc:
        return ["exact-film attention review unavailable: "+str(exc)]

def build(board_path:Path, film:Path, out:Path) -> dict:
    board=json.loads(board_path.read_text())
    errors=direction.check(board)
    if errors:raise ValueError("; ".join(errors))
    rows,errors=direction.timeline(board)
    if errors:raise ValueError("; ".join(errors))
    w,h,duration=probe(film);runtime=float(board["runtime_s"])
    expected=runtime+float(board.get("credits_s") or 0)
    if abs(duration-expected)>.15:raise ValueError(f"film duration {duration} does not match board {expected}")
    out.parent.mkdir(parents=True,exist_ok=True)
    sheet_path=out.with_suffix(".png")
    player_path=out.with_suffix(".html")
    thumb_w,thumb_h=180,320
    tile_w,tile_h=720,380
    sheet=Image.new("RGB",(tile_w*2,tile_h*math.ceil(len(rows)/2)), "#091b20")
    draw=ImageDraw.Draw(sheet)
    font_path=REPO/"video-engine/public/fonts/Manrope-Var.ttf"
    font=ImageFont.truetype(str(font_path),17)
    small=ImageFont.truetype(str(font_path),14)
    links=[]
    for i,row in enumerate(rows):
        before=max(0,row["start_s"]-.12)
        after=min(runtime-.03,row["end_s"]+.12)
        x,y=(i%2)*tile_w,(i//2)*tile_h
        for j,t in enumerate((before,after)):
            shot=Image.fromarray(frame(film,t,thumb_w,thumb_h))
            sheet.paste(shot,(x+12+j*(thumb_w+8),y+37))
        draw.text((x+12,y+7),f"{row['start_s']:.2f}s  {row['event_id']}",font=font,fill="#ed9971")
        words=(row["visible_change"]+"\nReward: "+row["viewer_reward"]).split()
        lines=[];line=""
        for word in words:
            trial=(line+" "+word).strip()
            if draw.textlength(trial,font=small)>305:lines.append(line);line=word
            else:line=trial
        if line:lines.append(line)
        draw.multiline_text((x+395,y+45),"\n".join(lines[:16]),font=small,fill="#f5eddd",spacing=6)
        links.append('<button data-at="'+str(before)+'">'+html.escape(f"{row['start_s']:.2f}s · {row['event_id']}")+
                     '</button><p>'+html.escape(row["viewer_reward"])+'</p>')
        row["sample_before_s"],row["sample_after_s"]=before,after
    sheet.save(sheet_path)
    relative=os.path.relpath(film.resolve(),out.parent.resolve())+"?v="+digest(film)[:12]
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Attention review</title><style>
    *{box-sizing:border-box}body{background:#07191e;color:#f5eddd;font:16px/1.5 system-ui;margin:0;padding:24px}
    main{max-width:1100px;margin:auto}.grid{display:grid;grid-template-columns:minmax(250px,420px) 1fr;gap:28px}video{width:100%;max-height:80vh;background:#000;position:sticky;top:16px}
    button{color:#f5eddd;background:#173a40;border:1px solid #628a88;padding:10px;cursor:pointer;border-radius:6px}p{color:#b9cec8}a{color:#7ce2da}@media(max-width:650px){.grid{display:block}video{position:static;max-height:65vh}}
    </style><main><h1>Watch the viewer's next reward</h1><p>Inspect the exact film. A schedule is not a creative verdict. Review with sound, then muted. These are before-and-after samples, not proof that the intended meaning landed.</p><button id="play">Play / pause</button><p id="status" aria-live="polite"></p><div class="grid"><video aria-label="Documentary review film" controls playsinline preload="metadata" src="'''+html.escape(relative,quote=True)+'''"></video><section>'''+''.join(links)+'''</section></div><p><a href="'''+html.escape(sheet_path.name,quote=True)+'''">Before-and-after contact sheet</a></p></main><script>
    const v=document.querySelector('video');for(const b of document.querySelectorAll('button[data-at]'))b.onclick=()=>{v.currentTime=Number(b.dataset.at);v.scrollIntoView({block:'center',behavior:'smooth'})};
    document.getElementById('play').onclick=()=>{if(v.paused)v.play().catch(e=>document.getElementById('status').textContent=e.message);else v.pause()};
    </script></html>'''
    player_path.write_text(page)
    report={"schema":"dispatch_attention_review/1","scope":"Review aid, no automated creative verdict",
       "board_sha256":digest(board_path),"film_sha256":digest(film),"width":w,"height":h,
       "duration_s":duration,"timeline":rows,
       "contact_sheet":{"file":sheet_path.name,"sha256":digest(sheet_path)},
       "player":{"file":player_path.name,"sha256":digest(player_path)}}
    out.write_text(json.dumps(report,indent=2)+"\n")
    return report

def self_test()->int:
    failures=0
    def ok(name,good):
        nonlocal failures
        print(("  ok " if good else "  FAIL ")+name);failures+=not good
    good_review={"film_sha256":"abc","pass":True,"hook_observed":"The rotor stopped in the close-up",
       "continuity_observed":"One pump became its own model","remembered_image":"The model beneath the stopped pump",
       "weakest_interval":"The evidence turn needs a quieter entry","weakest_at_s":2,
       "audio_basis":"Audio not directly heard; timing and mix evidence inspected"}
    panel=[{"attention_review":dict(good_review)} for _ in range(3)]
    ok("three concrete reviews pass",not panel_problems(panel,"abc",6))
    panel[1]["attention_review"]["film_sha256"]="old"
    ok("one stale judge blocks acceptance",bool(panel_problems(panel,"abc",6)))
    panel[1]["attention_review"]=dict(good_review,**{"pass":False})
    ok("one creative rejection is not averaged away",bool(panel_problems(panel,"abc",6)))
    paced_review={**good_review,
       "pacing_observed":"At 0.3s the rotor halts, then at 3s the connected branch lights",
       "comprehension_observed":"The branch follows the fault; the source still describes a proposal",
       "weakest_end_s":2.8}
    def paced_panel():
        return [{"attention_review":dict(paced_review)} for _ in range(3)]
    ok("current policy activates pace reviews",
       pacing_review_required({"date":direction.policy()["pacing_review_effective_date"]}))
    ok("the released September 19 film keeps its original review contract",
       not pacing_review_required({"date":"2026-09-19"}))
    ok("complete pacing reviews pass",
       not panel_problems(paced_panel(),"abc",6,require_pacing=True))
    for judge in range(3):
        for key in ("pacing_observed","comprehension_observed","weakest_end_s"):
            missing=paced_panel()
            del missing[judge]["attention_review"][key]
            errors=panel_problems(missing,"abc",6,require_pacing=True)
            ok(f"judge {judge+1} cannot omit {key}",any(key in error for error in errors))
    for end in (2,1,7,float("nan"),float("inf"),True,"3"):
        invalid=paced_panel()
        invalid[0]["attention_review"]["weakest_end_s"]=end
        ok(f"invalid weakest interval end {end!r} fails",
           bool(panel_problems(invalid,"abc",6,require_pacing=True)))
    empty=paced_panel()
    empty[0]["attention_review"]["pacing_observed"]="   "
    ok("blank pace observations fail",
       bool(panel_problems(empty,"abc",6,require_pacing=True)))
    with tempfile.TemporaryDirectory() as td:
        root=Path(td);board=root/"board.json";film=root/"film.mp4";out=root/"review.json"
        board.write_text("{}");film.write_bytes(b"film")
        sheet=root/"review.png";page=root/"review.html";sheet.write_bytes(b"sheet");page.write_text("page")
        report={"schema":"dispatch_attention_review/1","board_sha256":digest(board),"film_sha256":digest(film),
             "contact_sheet":{"file":sheet.name,"sha256":digest(sheet)},"player":{"file":page.name,"sha256":digest(page)}}
        ok("all four artifacts hash-bind",not report_problems(report,board,film,out))
        film.write_bytes(b"changed");ok("changed media fails",bool(report_problems(report,board,film,out)))
        film.write_bytes(b"film");sheet.write_bytes(b"changed");ok("changed review frames fail",bool(report_problems(report,board,film,out)))
        # Run the real aggregator: a high score must not discard one creative rejection.
        board.write_text((REPO/"examples/board.json").read_text())
        sheet.write_bytes(b"sheet")
        report["board_sha256"]=digest(board)
        out=root/"attention-review.json";out.write_text(json.dumps(report))
        scores=root/"scores.json";card=root/"card.json"
        axes={k:9 for k in ("hook","story","picture","place","craft","voice")}
        judges=[{"axes":axes,"hard_fails":[],"attention_review":dict(good_review,film_sha256=digest(film))} for _ in range(3)]
        def aggregate():
            scores.write_text(json.dumps(judges))
            subprocess.run([sys.executable,str(REPO/"scripts/panel_triage.py"),"--scores",str(scores),
                "--board",str(board),"--film",str(film),"--out-report",str(card),
                "--history",str(root/"history.json")],check=True,capture_output=True,text=True)
            return json.loads(card.read_text())
        ok("real triage preserves the earlier review contract",aggregate()["ship"] is True)
        current_board=json.loads(board.read_text())
        current_board["date"]=direction.policy()["pacing_review_effective_date"]
        board.write_text(json.dumps(current_board))
        report["board_sha256"]=digest(board)
        out.write_text(json.dumps(report))
        judges=[{"axes":axes,"hard_fails":[],
                 "attention_review":dict(paced_review,film_sha256=digest(film))} for _ in range(3)]
        ok("real triage accepts three complete pacing reviews",aggregate()["ship"] is True)
        for key in ("pacing_observed","comprehension_observed","weakest_end_s"):
            saved=judges[1]["attention_review"].pop(key)
            rejected=aggregate()
            ok(f"real triage refuses missing {key} despite high scores",
               rejected["ship"] is False and any(key in error for error in rejected["hard_fails"]))
            judges[1]["attention_review"][key]=saved
        def panel_cli():
            scores.write_text(json.dumps(judges))
            return subprocess.run([sys.executable,str(REPO/"scripts/documentary_review.py"),
                "--board",str(board),"--film",str(film),"--panel",str(scores)],
                capture_output=True,text=True)
        ok("panel verification CLI accepts complete pacing reviews",panel_cli().returncode==0)
        saved=judges[2]["attention_review"].pop("pacing_observed")
        rejected_cli=panel_cli()
        ok("panel verification CLI refuses missing pace evidence",
           rejected_cli.returncode==1 and "pacing_observed" in rejected_cli.stderr)
        judges[2]["attention_review"]["pacing_observed"]=saved
        judges[1]["attention_review"]["pass"]=False
        rejected=aggregate()
        ok("real triage carries one rejection into its high-score card",
           rejected["ship"] is False and bool(rejected["hard_fails"]))
        judges[1]["attention_review"]["pass"]=True
        film.write_bytes(b"substituted")
        ok("real triage blocks a substituted film",aggregate()["ship"] is False)
    return int(bool(failures))

def main()->int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--board");ap.add_argument("--film");ap.add_argument("--out")
    ap.add_argument("--verify",action="store_true");ap.add_argument("--panel")
    ap.add_argument("--self-test",action="store_true");a=ap.parse_args()
    if a.self_test:return self_test()
    if not a.board or not a.film:ap.error("--board and --film required")
    try:
        board_path,film=Path(a.board),Path(a.film)
        board=json.loads(board_path.read_text())
        if not direction.required(board):
            print("documentary_review: historical board; exact-film documentary pack not required");return 0
        out=Path(a.out) if a.out else film.parent/"attention-review.json"
        if a.verify:
            errors=report_problems(json.loads(out.read_text()),board_path,film,out)
        elif a.panel:
            errors=report_problems(json.loads(out.read_text()),board_path,film,out)
            errors+=panel_problems(json.loads(Path(a.panel).read_text()),digest(film),float(board["runtime_s"]),
                                   require_pacing=pacing_review_required(board))
        else:
            build(board_path,film,out);errors=[]
        if a.verify or a.panel:
            from production_quality import publication_problems as quality_problems
            errors += quality_problems(board_path, film, json.loads(Path(a.panel).read_text()) if a.panel else None)
        for error in errors:print("documentary_review: "+error,file=sys.stderr)
        if not errors:print("documentary_review: exact film review evidence ready -> "+str(out))
        return int(bool(errors))
    except (OSError,ValueError,TypeError,KeyError,subprocess.CalledProcessError) as e:
        print("documentary_review: "+str(e),file=sys.stderr);return 1
if __name__=="__main__":sys.exit(main())
