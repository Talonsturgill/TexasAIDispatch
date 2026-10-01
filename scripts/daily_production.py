"""Cheap story continuity, demonstrated actions and compact daily handoffs.

These checks bind a human editorial verdict to the actual story and source inputs.
They do not infer causality or artistic quality from word counts or hashes.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import re
from pathlib import Path
from datetime import date, datetime

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/daily_production.json"
CATALOG = REPO / "config/production_actions.json"
VISUAL_POLICY = REPO / "config/story_visuals.json"


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def policy():
    return read(POLICY)


def targets():
    limits = read(REPO / "config/run_limits.json")["resources"]
    return {key: limits[key] for key in policy()["target_resources"]}


def in_window(value):
    try:
        return date.fromisoformat(str(value)[:10]) >= date.fromisoformat(policy()["effective_date"])
    except ValueError:
        return False


def required(board):
    return board.get("daily_production") is True or in_window(board.get("date"))


def candidate_problems(selected, edition=None):
    """Reject unsupported pictures while selection is still cheaper than narration."""
    import action_admission as admission
    import creative_production as creative
    current = creative.required({"date": edition})
    errors = admission.proposal_problems(selected, selected=selected)
    if current:
        errors += creative.candidate_problems(selected)
    try:
        proposed = {p['id']: p for p in admission.proposals(selected)}
    except (ValueError, KeyError, TypeError):
        proposed = {}
    film = selected.get("filmability") or {}
    rows = film.get("action_support") or []
    if [r.get("image") for r in rows] != ["opening", "mechanism", "consequence"]:
        return ["candidate needs opening, mechanism and consequence action_support in order"]
    catalog = {a["id"]: a for a in read(CATALOG)["actions"]}
    sources = {s.get("url") for s in selected.get("sources", [])}
    assets = {a.get("url"): a for a in film.get("asset_leads", [])}
    for row in rows:
        if row.get("source_url") not in sources:
            errors.append("candidate picture needs a fetched source from selected.sources")
        for key in ("pictured_action", "scope_fit"):
            if len(str(row.get(key, "")).strip()) < 25:
                errors.append("candidate picture needs a concrete " + key)
        if row.get("medium") == "demonstrated-action":
            if row.get("action_id") not in catalog:
                errors.append("candidate central action is outside the demonstrated library")
        elif row.get("medium") == "source-backed-action":
            proposal = proposed.get(row.get('action_id'), {})
            if not proposal or row.get('source_url') not in proposal.get('source_urls', []) or row.get('disclosure') != proposal.get('disclosure'):
                errors.append('candidate picture needs its bound source-backed action and Illustration disclosure')
        elif row.get("medium") == "source-footage" or (current and row.get("medium") in ("source-still", "source-excerpt")):
            asset = assets.get(row.get("asset_url"), {})
            for key in ("inspection", "rights_basis"):
                if len(str(asset.get(key, "")).strip()) < 25:
                    errors.append("candidate footage needs actual " + key + " evidence")
            from urllib.parse import urlparse
            url = urlparse(str(row.get("asset_url", "")))
            if url.scheme not in ("https", "http") or not url.netloc:
                errors.append("candidate footage needs a retrievable source asset")
        elif current and row.get("medium") == "diagram":
            if not concrete_diagram(row):
                errors.append("candidate diagram needs a sourced relationship and explicit illustration disclosure")
        else:
            errors.append("candidate picture has no supported production medium")
    if proposed and not set(proposed) <= {r.get('action_id') for r in rows if r.get('medium') == 'source-backed-action'}:
        errors.append('candidate must use its proposed action')
    if not current and rows[0].get("medium") not in ("demonstrated-action", "source-backed-action"):
        errors.append("candidate opening must support the dimensional opening policy")
    return sorted(set(errors))


def concrete_diagram(row):
    return len(str(row.get("relationship") or "").strip()) >= 25 and row.get("disclosure") == "Illustration"


def visual_problems(board, runs=None):
    """Check provenance and prior-edition identity; editorial relevance still needs a critic."""
    from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
    cfg = read(VISUAL_POLICY)
    if str(board.get("date") or "") < cfg["effective_date"]:
        return []
    errors = []
    plan = board.get("visual_research") or {}
    searches = plan.get("searches")
    if not isinstance(searches, list) or not 1 <= len(searches) <= cfg["max_searches"]:
        errors.append("visual research needs a bounded search record")
    else:
        for row in searches:
            if not isinstance(row, dict) or any(len(str(row.get(k) or "").strip()) < 12 for k in ("query", "finding")):
                errors.append("visual search needs the actual query and finding")
    candidates = plan.get("candidates")
    if not isinstance(candidates, list) or len(candidates) > cfg["max_candidates"]:
        errors.append("visual research needs a bounded candidate list, including rejected leads")
    else:
        for row in candidates:
            if not isinstance(row, dict) or not row.get("url") or row.get("decision") not in ("use", "reject") or len(str(row.get("reason") or "")) < 20:
                errors.append("visual candidate needs URL, decision and concrete reason")
    if len(str(plan.get("decision") or "")) < 30:
        errors.append("visual research needs its final story-specific choice or no-useful-asset explanation")
    runs = REPO / "runs" if runs is None else Path(runs)
    try:
        prior = sorted(p for p in runs.glob("????-??-??/dispatch.mp4")
                       if p.parent.name < str(board["date"]))
        previous = read(prior[-1].with_name("storyboard.json")) if prior else {}
    except (OSError, ValueError, KeyError) as exc:
        return errors + ["previous edition visual inventory unavailable: " + str(exc)]

    def identity(item):
        result = set()
        for key in ("sha256", "original_sha256", "source_sha256"):
            if item.get(key):
                result.add("hash:" + str(item[key]).lower())
        for key in ("source_url", "original_url"):
            if item.get(key):
                u = urlsplit(str(item[key]))
                query = urlencode(sorted((k, v) for k, v in parse_qsl(u.query) if not k.lower().startswith("utm_")))
                result.add("url:" + urlunsplit((u.scheme.lower(), u.netloc.lower(), u.path.rstrip("/"), query, "")))
        return result

    old = set().union(*(identity(a) for a in previous.get("native_media", [])))
    scenes = {s.get("id") for s in board.get("scenes", [])}
    claims = {c for s in board.get("scenes", []) for c in (s.get("vo_claims") or [])}
    for item in board.get("native_media") or []:
        if identity(item) & old:
            errors.append("previous shipped edition footage/imagery is forbidden, including crops and re-encodes: " + str(item.get("file")))
        if not item.get("source_url") or not item.get("sha256"):
            errors.append("story visual needs source URL and prepared asset hash")
        for key in ("subject", "relevance", "inspection", "rights_basis"):
            if len(str(item.get(key) or "").strip()) < 20:
                errors.append("story visual needs concrete " + key)
        if item.get("story_role") not in ("actual-site", "actual-person", "actual-equipment", "source-document", "actual-workflow", "context"):
            errors.append("story visual needs a specific factual role; generic mood footage is not a role")
        for key, allowed in (("scene_ids", scenes), ("claim_ids", claims)):
            refs = item.get(key)
            if not isinstance(refs, list) or not refs or not set(refs) <= allowed:
                errors.append("story visual needs current " + key)
        if not any(isinstance(c, dict) and c.get("url") == item.get("source_url") and c.get("decision") == "use" for c in (candidates if isinstance(candidates, list) else [])):
            errors.append("used story visual is absent from the inspected candidate decision")
    return sorted(set(errors))


def story_digest(board):
    # Measured timing and subtitles do not change the causal story. The final phone
    # and audiovisual gates still bind those exact bytes separately.
    scenes = []
    for scene in board.get("scenes", []):
        row = copy.deepcopy(scene)
        for key in ("start_s", "duration_s", "duration_authored", "caption"):
            row.pop(key, None)
        for event in row.get("visual_events", []):
            for key in ("at_s", "duration_s", "at_s_authored", "duration_s_authored"):
                event.pop(key, None)
        scenes.append(row)
    data = {"contract": board.get("story_contract"), "scenes": scenes,
            "title": board.get("title"), "native_media": board.get("native_media"),
            "cinematic_template": board.get("cinematic_template")}
    if "visual_research" in board:
        data["visual_research"] = board["visual_research"]
        data["visual_policy_sha256"] = digest(VISUAL_POLICY)
    if board.get('action_proposals'):
        data['action_proposals'] = board['action_proposals']
    if "creative_direction" in board:
        import creative_production as creative
        data["creative_direction"] = board["creative_direction"]
        data["creative_policy_sha256"] = digest(creative.POLICY)
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def bound(item, root=REPO):
    path = (root / item["path"]).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file() or digest(path) != item["sha256"]:
        raise ValueError("missing, changed or out-of-scope production evidence: " + str(item.get("path")))
    return path


def catalog_problems(catalog=None):
    data = read(CATALOG) if catalog is None else catalog
    errors = []
    try:
        release = data["provenance"]
        film = bound(release["film"])
        bound(release["source_renderer"])
        state = read(bound(release["state"]))
        if state.get("terminal_state") != "shipped" or state["shipment"]["film_sha256"] != digest(film):
            errors.append("action provenance is not a verified shipped film")
        from production_quality import av_problems
        requests = []
        for role in ("picture", "story", "sound"):
            receipt = bound(release["reviews"][role])
            errors += av_problems(receipt, film, role)
            requests.append(read(receipt).get("request_id"))
        if len(set(requests)) != 3:
            errors.append("action provenance needs three separate audiovisual identities")
        board = read(bound(release["board"]))
        scenes = {s["id"]: s for s in board["scenes"]}
        for action in data["actions"]:
            bound(action["module"])
            if action["source_scene"] not in scenes or not action.get("exports") or not action.get("limits"):
                errors.append("action lacks a reviewed scene, callable exports or scope limits")
        ids = [a["id"] for a in data["actions"]]
        if len(ids) != len(set(ids)):
            errors.append("duplicate demonstrated action id")
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append(str(exc))
    return errors


def structure_problems(board, claims=None):
    if not required(board):
        return []
    errors = visual_problems(board)
    contract = board.get("story_contract") or {}
    for key in policy()["story_fields"]:
        value = contract.get(key)
        if not isinstance(value, str) or not 12 <= len(value.strip()) <= 280:
            errors.append("story contract needs one concrete, compact " + key)
    scenes = board.get("scenes", [])
    ids = [s.get("id") for s in scenes]
    rows = contract.get("scenes") or []
    if [r.get("scene_id") for r in rows] != ids or not ids or len(set(ids)) != len(ids):
        errors.append("story rows must cover the current scene order exactly once")
    verified = None if claims is None else {
        c["id"] for c in claims.get("claims", [])
        if c.get("verdict") == "VERIFIED" and str(c.get("quote", "")).strip()
    }
    allowed_roles = {"action", "mechanism", "consequence", "evidence", "limit", "answer"}
    for row in rows:
        if row.get("role") not in allowed_roles or len(str(row.get("advances", "")).strip()) < 20:
            errors.append("each scene must explain how its picture advances the causal story")
        refs = row.get("claim_ids")
        if not isinstance(refs, list) or not refs or (verified is not None and not set(refs) <= verified):
            errors.append("story scene lacks current VERIFIED source bindings")
    for scene, row in zip(scenes, rows):
        stated = set(scene.get("vo_claims") or [])
        if scene.get("super_claim"):
            stated.add(scene["super_claim"])
        if not stated <= set(row.get("claim_ids") or []):
            errors.append("story row omits claims used by its actual scene")
    if rows and (rows[-1].get("role") != "answer" or not any(r.get("role") == "consequence" for r in rows)):
        errors.append("story needs a human consequence and a closing answer")
    cuts = contract.get("transitions") or []
    pairs = list(zip(ids, ids[1:]))
    if [(r.get("from"), r.get("to")) for r in cuts] != pairs:
        errors.append("every current cut needs one ordered continuity explanation")
    for cut in cuts:
        if cut.get("kind") not in policy()["transition_kinds"]:
            errors.append("cut needs an explicit continuity kind")
        for key in ("because", "visible_bridge"):
            if len(str(cut.get(key, "")).strip()) < 20:
                errors.append("cut lacks a concrete " + key)
        if cut.get("kind") == "source-example":
            disclosure = str(cut.get("disclosure", "")).strip()
            destination = next((s for s in scenes if s.get("id") == cut.get("to")), {})
            if not 20 <= len(disclosure) <= 72 or destination.get("production_disclosure") != disclosure:
                errors.append("a different source example needs its truthful disclosure in the rendered scene")
    return errors


def action_problems(board):
    if not required(board):
        return []
    import action_admission as admission
    errors = catalog_problems() + admission.board_problems(board)
    try:
        proposed = {p['id'] for p in admission.proposals(board)}
    except (ValueError, KeyError, TypeError):
        proposed = set()
    catalog = {a["id"]: a for a in read(CATALOG)["actions"]}
    dimensional = set((board.get("cinema") or {}).get("dimensional_scene_ids", []))
    for scene in board.get("scenes", []):
        if scene.get("id") not in dimensional:
            continue
        action = catalog.get(scene.get("production_action"))
        if scene.get('production_action') in proposed:
            continue
        if not action:
            errors.append(str(scene.get("id")) + " requires a demonstrated action; choose another supported treatment before voice")
        elif len(scene.get("visual_events") or []) < action["min_events"]:
            errors.append(str(scene.get("id")) + " lacks the demonstrated action's event sequence")
    # The provided route executes these ids directly. A custom composition must call
    # the actual library symbols; final film review still proves visible execution.
    if board.get("cinematic_template") != "daily-actions-v1":
        from critic_gate import renderer_files
        try:
            sources = [p.read_text() for p in renderer_files(board)
                       if p.name not in ("Dispatch.tsx", "ProvenActions.tsx")]
            for action_id in {s.get("production_action") for s in board.get("scenes", [])
                              if s.get("id") in dimensional}:
                if action_id in catalog and not any(
                    "production/ProvenActions" in source and
                    any(re.search(r"<" + re.escape(name) + r"\b", source) for name in catalog[action_id]["exports"])
                    for source in sources):
                    errors.append(str(action_id) + " is declared but its library action has no renderer call")
            if any(s.get("production_disclosure") for s in board.get("scenes", [])) and not any(
                    "production_disclosure" in source for source in sources):
                errors.append("custom renderer does not display the current source-example disclosure")
        except (ValueError, OSError) as exc:
            errors.append(str(exc))
    return errors


def review_problems(board, report):
    if not required(board):
        return []
    import action_admission
    errors = structure_problems(board) + action_admission.review_problems(board, report)
    review = report.get("story_review") or {}
    if review.get("story_sha256") != story_digest(board):
        errors.append("story changed since continuity approval; review the whole sequence before spending")
    if review.get("policy_sha256") != digest(POLICY):
        errors.append("story review does not bind the current daily contract")
    import creative_release as bounded
    if (review.get("verdict") != "pass" or review.get("blocking_defects") != []) and not bounded.review_allows(board, report):
        errors.append("story or continuity defects remain unresolved")
    director = (board.get("story_contract") or {}).get("director_identity")
    identity = report.get("reviewer_identity")
    if not director or not identity or director == identity:
        errors.append("story approval requires the independent critic, distinct from the director")
    for key in ("one_viewing_summary", "opening_to_ending", "weakest_transition"):
        if len(str(review.get(key, "")).strip()) < 30:
            errors.append("independent story review lacks " + key)
    return errors


def pre_voice_problems(board_path, claims_path, script=None):
    board = read(board_path)
    if not required(board):
        return []
    report_path = Path(board_path).with_name("storyboard_critic.json")
    report = read(report_path) if report_path.exists() else {}
    reviewed_board = board
    context_errors = []
    try:
        from review_context import required_baseline
        baseline = required_baseline(board_path)
        if baseline is not None:
            reviewed_board = read(baseline)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        context_errors.append("review-context frozen story evidence invalid: " + str(exc))
    errors = context_errors + structure_problems(board, read(claims_path)) + action_problems(board) + review_problems(reviewed_board, report)
    import creative_production as creative
    errors += creative.plan_problems(board)
    errors += creative.opening_problems(board_path)
    selection_path = Path(board_path).with_name("story_selection.json")
    if not selection_path.is_file():
        errors.append("current candidate selection and early picture fit are missing")
    else:
        import story_selection_check
        errors += story_selection_check.problems(read(selection_path), edition=board.get("date"))
        selected = read(selection_path).get('selected') or {}
        import action_admission
        errors += action_admission.proposal_problems(board, selected, read(claims_path))
        if board.get('action_proposals', []) != selected.get('action_proposals', []):
            errors.append('board action proposals differ from the selected source-backed mechanism')
    if board.get('action_proposals'):
        import critic_gate
        errors += critic_gate.problems(reviewed_board, report)
    if (report.get("story_review") or {}).get("claims_sha256") != digest(claims_path):
        errors.append("source evidence changed since the independent story review")
    if script is not None:
        narrated = " ".join(str(s.get("vo", "")) for s in board.get("scenes", []))
        if " ".join(narrated.split()) != " ".join(script.split()):
            errors.append("spoken script differs from the story that the critic approved")
    return sorted(set(errors))


def packet(board_path, claims_path, role, state_path=None):
    """Bound references, not copied history. Reviewers load their assigned sources themselves."""
    board, claims = read(board_path), read(claims_path)
    data = {
        "role": role, "date": board["date"], "story_sha256": story_digest(board),
        "board": {"path": str(Path(board_path).resolve()), "sha256": digest(board_path)},
        "claims": {"path": str(Path(claims_path).resolve()), "sha256": digest(claims_path)},
        "story": board.get("story_contract"),
        "quality_contract": "config/quality_contract.json",
        "rubric": "config/dispatch_rubric.yaml",
        "brief": ".claude/agents/" + ("scorer" if role in ("picture", "story", "sound") else role) + ".md",
        "instructions": "Read the bound current inputs and your brief. Load cited source evidence as needed. Do not copy production history. Return one consolidated verdict. Never infer audio access from text.",
    }
    selection = Path(board_path).with_name("story_selection.json")
    if selection.is_file():
        data["selection"] = {"path": str(selection.resolve()), "sha256": digest(selection)}
    import creative_production as creative
    if creative.required(board):
        data["creative_contract"] = "knowledge/craft/CREATIVE_DIRECTION.md"
        for name in ("comparison.json", "selection.json"):
            path = Path(board_path).parent / "openings" / name
            if path.is_file():
                data["opening_" + name.split(".")[0]] = {"path": str(path.resolve()), "sha256": digest(path)}
    if role in ("picture", "story", "sound"):
        root = Path(board_path).parent
        for key, name in (("film", "film.mp4"), ("av_receipt", f"cinema/{role}-review.json"),
                          ("attention_player", "attention-review.html"), ("feed", "feed-composite.png")):
            p = root / name
            if not p.is_file():
                raise ValueError("final reviewer packet is missing " + str(p))
            data[key] = {"path": str(p.resolve()), "sha256": digest(p)}
    if state_path:
        state = read(state_path)
        data["usage"] = state["usage"]
        data["phase"] = state["phase"]
        ledger = Path(state_path).with_name("current-defects.json")
        if ledger.exists():
            data["defects"] = {"path": str(ledger.resolve()), "sha256": digest(ledger)}
    encoded = json.dumps(data, indent=2)
    if len(encoded) > policy()["handoff_max_chars"]:
        raise ValueError("handoff exceeds the compact packet limit; shorten the story contract, retain source paths")
    return data


def scoreboard(runs=REPO / "runs", state_path=None):
    rows = []
    candidates = {}
    paths = list(Path(runs).glob("*/run_state.json"))
    if state_path and Path(state_path).is_file():
        paths.append(Path(state_path))
    for path in paths:
        state = read(path)
        if not in_window(state.get("run_id")):
            continue
        run_id = state["run_id"]
        previous = candidates.get(run_id)
        if not previous or state.get("updated_at", "") >= previous[1].get("updated_at", ""):
            candidates[run_id] = (path, state)
    shipped = 0
    for run_id, (path, state) in sorted(candidates.items()):
        if shipped >= policy()["measurement_editions"]:
            break
        shipped += state.get("terminal_state") == "shipped"
        # Include unfinished editions so a costly nonshipment cannot disappear.
        usage = state.get("usage", {})
        report_path = path.with_name("report_card.json")
        report = read(report_path) if report_path.exists() else {}
        rows.append({
            "run_id": state["run_id"], "state": state.get("terminal_state") or state.get("phase"),
            "shipped": state.get("terminal_state") == "shipped",
            "score": report.get("weighted_score", report.get("score")),
            "usage": usage, "first_panel_pass": report.get("ship") is True and usage.get("panel_rounds") == 1,
            "over_targets": {k: {"used": usage.get(k, 0), "target": v} for k, v in targets().items()
                             if usage.get(k, 0) > v},
            "elapsed_seconds": None,
            "account_tokens": None,
            "accounting_note": "reported_tokens covers provider telemetry only; Codex conversation and agent totals are unavailable here",
        })
        if state.get("created_at") and state.get("updated_at"):
            try:
                rows[-1]["elapsed_seconds"] = (datetime.fromisoformat(state["updated_at"].replace("Z","+00:00")) -
                                               datetime.fromisoformat(state["created_at"].replace("Z","+00:00"))).total_seconds()
            except ValueError:
                pass
    return {"policy": policy()["version"], "target_editions": policy()["measurement_editions"],
            "editions": rows, "shipped_count": sum(r["shipped"] for r in rows),
            "evidence_status": "observations only; production reliability is not established by tooling tests"}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board", type=Path)
    p.add_argument("--claims", type=Path)
    p.add_argument("--state", type=Path)
    p.add_argument("--catalog-check", action="store_true")
    p.add_argument("--digest", action="store_true")
    p.add_argument("--packet", choices=["validator", "storyboard-critic", "vo-director", "picture", "story", "sound"])
    p.add_argument("--scoreboard", action="store_true")
    p.add_argument("--out", type=Path)
    a = p.parse_args()
    try:
        if a.catalog_check:
            errors = catalog_problems()
            print("\n".join(errors) if errors else "demonstrated action provenance verified")
            return int(bool(errors))
        if a.scoreboard:
            data = scoreboard(state_path=a.state)
        elif not a.board:
            p.error("--board is required")
        elif a.digest:
            data = {"story_sha256": story_digest(read(a.board)), "policy_sha256": digest(POLICY)}
            import action_admission
            data['action_reviews'] = [{'action_id': p['id'], 'module_sha256': digest(action_admission.module_path(p)),
                                      'source_claims_sha256': action_admission.source_claims_digest(p)}
                                     for p in action_admission.proposals(read(a.board))]
        elif not a.claims:
            p.error("--claims is required")
        elif a.packet:
            data = packet(a.board, a.claims, a.packet, a.state)
        else:
            errors = pre_voice_problems(a.board, a.claims)
            print("\n".join(errors) if errors else "current story and demonstrated action checks pass")
            return int(bool(errors))
        if a.out:
            a.out.parent.mkdir(parents=True, exist_ok=True)
            a.out.write_text(json.dumps(data, indent=2) + "\n")
        else:
            print(json.dumps(data, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print("daily production refused: " + str(exc))
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
