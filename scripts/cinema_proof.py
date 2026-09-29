#!/usr/bin/env python3
"""Build current native cinematic proof, reusing only verified unchanged render dependencies."""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from production_quality import REPO, policy_path, digest, engine_sha256, read, plan_problems, stage_sample_problems
from render_manifest import generated_media_sha256
from run_controller import reserve
import critic_gate
import cinema_cache as cache


def run(argv, cwd=None):
    subprocess.run(argv, cwd=cwd, check=True)


def current_bindings(board, mix):
    return {"board_sha256":digest(board),"engine_sha256":engine_sha256(),"policy_sha256":digest(policy_path(read(board))),
            "mix_sha256":digest(mix),"generated_media_sha256":generated_media_sha256(board)}


def archive_failure(root, staging, proof, errors):
    """Retain rejected bytes separately; this never publishes a current proof."""
    failures = root / "failed-proofs"
    failures.mkdir(parents=True, exist_ok=True)
    archive = Path(tempfile.mkdtemp(prefix="proof-", dir=failures))
    shutil.copytree(staging, archive, dirs_exist_ok=True)
    record = {**proof, "pass": False, "problems": list(errors),
              "retained_files": {p.relative_to(archive).as_posix(): digest(p)
                                 for p in sorted(archive.rglob("*")) if p.is_file()}}
    (archive / "proof.json").write_text(json.dumps(record, indent=2) + "\n")
    return archive


def build(board, mix, state):
    board, mix = Path(board).resolve(), Path(mix).resolve()
    data = read(board)
    expected = current_bindings(board,mix)
    errors = plan_problems(data)
    if errors or not data.get("cinema"):
        raise ValueError("; ".join(errors) or "a current cinema plan is required")
    if str(data.get("date") or "") >= "2026-09-25":
        phone = board.parent / "preflight.mp4"
        errors = critic_gate.film_review_problems(data,read(board.with_name("storyboard_critic.json")),
                   read(phone.with_suffix(".json")),expected["board_sha256"],digest(phone))
        if errors:
            raise ValueError("phone visual review is not current: " + "; ".join(errors))
    root = board.parent / "cinema"
    root.mkdir(parents=True,exist_ok=True)
    retained = root / "render-cache"
    frames = cache.hero_frames(data)
    hero_picture_key = cache.picture_key(board,frames)
    hero_audio_key = cache.audio_segment(mix,frames)
    hero_key = cache.digest_json({"picture":hero_picture_key,"audio":hero_audio_key})
    hero_cached = cache.lookup(retained,hero_key)
    silent_cached = cache.lookup(retained,hero_picture_key)
    sample_keys, samples_cached = {}, {}
    for sid,times in cache.sample_frames(data).items():
        sample_keys[sid], samples_cached[sid] = [], []
        for frame in times:
            keys = {kind:cache.sample_key(board,frame,kind=="without_stage") for kind in ("normal","without_stage")}
            sample_keys[sid].append(keys)
            samples_cached[sid].append({kind:cache.lookup(retained,key) for kind,key in keys.items()})
    changes = hero_cached is None or any(value is None for pairs in samples_cached.values() for pair in pairs for value in pair.values())
    if changes:
        ok,message = reserve(state,{"preflight_renders":1},"finished cinematic hero and stage ablation batch")
        if not ok:
            raise ValueError(message)
    with tempfile.TemporaryDirectory(prefix="proof-",dir=root) as tmp:
        staging = Path(tmp)
        props = staging / "props.json"; props.write_bytes(board.read_bytes())
        removed = staging / "without.json"; removed.write_text(json.dumps(dict(data,__cinemaProofWithoutStage=True)))
        jobs = []
        silent = staging / "hero-silent.mp4"
        if hero_cached is None:
            if silent_cached:
                shutil.copyfile(silent_cached,silent)
            else:
                jobs.append({"kind":"video","props":str(props),"output":str(silent),"frames":frames})
        sample_paths = {}
        for sid,times in cache.sample_frames(data).items():
            sample_paths[sid] = []
            for index,frame in enumerate(times):
                paths = {}
                for kind,source_props in (("normal",props),("without_stage",removed)):
                    path = staging / f"{sid}-{index}-{kind}.png"
                    cached = samples_cached[sid][index][kind]
                    if cached:
                        shutil.copyfile(cached,path)
                    else:
                        jobs.append({"kind":"still","props":str(source_props),"output":str(path),"frame":frame})
                    paths[kind] = path
                sample_paths[sid].append(paths)
        if jobs:
            jobfile = staging / "batch.json"
            jobfile.write_text(json.dumps({"jobs":jobs,"report":str(staging/"batch-report.json")}))
            run(["node",str(REPO/"video-engine/scripts/render-batch.mjs"),str(jobfile)],REPO/"video-engine")
        hero = staging / "hero.mp4"
        if hero_cached:
            shutil.copyfile(hero_cached,hero)
        else:
            audio = staging / "hero.wav"
            cache.audio_segment(mix,frames,audio)
            run(["ffmpeg","-v","error","-y","-i",str(silent),"-i",str(audio),
                 "-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","aac","-b:a","320k",str(hero)])
        def entry(path):
            return {"file":path.name,"sha256":digest(path)}
        proof = {**expected,"hero":entry(hero),"samples":{
            sid:[{kind:entry(path) for kind,path in pair.items()} for pair in pairs]
            for sid,pairs in sample_paths.items()},
            "reuse":{"version":cache.SCHEMA,"render_environment":cache.picture_recipe(board,frames)["environment"],"hero_picture_key":hero_picture_key,"hero_audio_key":hero_audio_key,
                     "sample_keys":sample_keys,"rendered_jobs":len(jobs),"hero_reused":hero_cached is not None}}
        deferred, observations = [], []
        errors = stage_sample_problems(data,staging,proof["samples"],deferred=deferred,
                                       observations=observations)
        proof["principal_picture_measurements"] = observations
        if deferred:
            proof["bounded_creative_findings"] = deferred
        binding_errors = cache.binding_problems(board,proof,mix)
        if current_bindings(board,mix) != expected:
            binding_errors.append("production inputs changed during hero rendering; preview approval invalid")
        # Cache proves completed bytes and their dependencies, never artistic acceptance.
        # A failed stage measurement must not discard an unrelated completed hero.
        if not binding_errors:
            if hero_cached is None:
                cache.retain(retained,hero_picture_key,silent)
                cache.retain(retained,hero_key,hero)
            for sid,pairs in sample_paths.items():
                for index,pair in enumerate(pairs):
                    for kind,path in pair.items():
                        if samples_cached[sid][index][kind] is None:
                            cache.retain(retained,sample_keys[sid][index][kind],path)
        errors += binding_errors
        if errors:
            archive = archive_failure(root,staging,proof,errors)
            raise ValueError("cinematic proof failed before audiovisual review: " + "; ".join(errors)
                             + f"; exact failed evidence retained at {archive}")
        for sid,pairs in sample_paths.items():
            for index,pair in enumerate(pairs):
                for kind,path in pair.items():
                    shutil.copyfile(path,root/path.name)
        old_hero = root / "hero.mp4"
        if old_hero.exists() and digest(old_hero) != digest(hero):
            (root/"hero-review.json").unlink(missing_ok=True)
        shutil.copyfile(hero,old_hero)
        (root/"proof.json").write_text(json.dumps(proof,indent=2)+"\n")
    print(f"cinema_proof: {len(jobs)} render jobs; current native proof ready; exact-byte hero approval required")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board",type=Path,default=Path("out/dispatch/storyboard.json"))
    p.add_argument("--mix",type=Path,default=Path("out/dispatch/mix.wav"))
    p.add_argument("--state",type=Path,default=Path("out/dispatch/run_state.json"))
    a = p.parse_args()
    try:
        build(a.board,a.mix,a.state)
    except (ValueError,OSError,KeyError,subprocess.SubprocessError) as e:
        print("cinema_proof: "+str(e),file=sys.stderr)
        sys.exit(1)
