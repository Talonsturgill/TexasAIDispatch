"""R11 board metadata reconciliation. Deterministic, text only. Writes under proposal-r11/ from the applied R10 boards."""
import json, hashlib
R = "out/dispatch/"; O = R + "evidence/proposal-r11/"
OLD1 = "there is no field result, and the university names no installation"
NEW1 = "the announcement reports no field result and names no installation"
def fix(b):
    n = 0
    for s, r in zip(b["scenes"], b["story_contract"]["scenes"]):
        for c in s.get("vo_claims") or []:
            if c not in r["claim_ids"]: r["claim_ids"].append(c); n += 1
    REPL = [(OLD1, NEW1), ("The university names no", "The announcement names no"), ("the university names no", "the announcement names no")]
    def sub(v):
        for a, c in REPL: v = v.replace(a, c)
        return v
    def walk(x):
        global_count = 0
        if isinstance(x, dict):
            for k, v in list(x.items()):
                if isinstance(v, str) and sub(v) != v: x[k] = sub(v); global_count += 1
                else: global_count += walk(v)
        elif isinstance(x, list):
            for i, v in enumerate(x):
                if isinstance(v, str) and sub(v) != v: x[i] = sub(v); global_count += 1
                else: global_count += walk(v)
        return global_count
    return n, walk(b)
for src, dst in (("opening-a.json", "storyboard-a.json"), ("opening-b.json", "storyboard-b.json")):
    b = json.load(open(R + src)); n, w = fix(b)
    json.dump(b, open(O + dst, "w"), indent=2); print(dst, "claim ids added", n, "source_limit texts reconciled", w, hashlib.sha256(open(O + dst, "rb").read()).hexdigest())
