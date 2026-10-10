"""One separately funded same-worker handback; no host-unavailability or film approval."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re

REASON = "finish-current-same-worker-handback"
POLICY = Path(__file__).resolve().parents[1] / "config/autonomous_completion_handback_v1.json"
POLICY_SHA256 = "97af629e608ad1e5b1b47ba3755435fb8c0d71c89d29fa156fb23f6db287554c"


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def identity(plan):
    from autonomous_completion import canonical, sha
    proof = plan["handback_evidence"]
    receipt = json.loads(proof["receipt_json"])
    return sha(canonical({"scope": REASON, "agent_id": receipt["agent_id"],
                          "reservation_sha256": receipt["reservation_sha256"],
                          "run_id": receipt["run_id"]}))


def eligible(state, plan, report):
    from autonomous_completion import CODE_ADOPTION, EVENT, canonical, sha
    try:
        proof = plan["handback_evidence"]
        policy = json.loads(proof["policy_json"])
        receipt = json.loads(proof["receipt_json"])
        if (sha(proof["policy_json"]) != POLICY_SHA256
                or proof["policy_sha256"] != POLICY_SHA256
                or sha(proof["receipt_json"]) != proof["receipt_sha256"]
                or plan.get("changed_inputs") or report.get("verdict") != "pass"
                or state.get("mode") != "production" or state.get("terminal_state") is not None
                or state.get("phase") != "phone_review"
                or not any(e.get("kind") == CODE_ADOPTION for e in state["events"])
                or any(e.get("kind") == EVENT and e.get("reason") == REASON for e in state["events"])):
            return False
        if (receipt.get("schema") != "dispatch_same_worker_handback/1"
                or receipt.get("run_id") != state["run_id"] or receipt.get("role") != "phone"
                or receipt.get("model") != policy["model"] or receipt.get("effort") != policy["effort"]
                or receipt.get("status") != "running" or receipt.get("verdict") is not None
                or receipt.get("provider_unavailable") is not False
                or receipt.get("action") != "TaskStop_then_SendMessage_same_id"
                or not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", receipt.get("agent_id", ""))):
            return False
        index = receipt["reservation_event_index"]
        if type(index) is not int or not 0 <= index < len(state["events"]):
            return False
        reserved = state["events"][index]
        if (reserved.get("kind") != "reserved" or reserved.get("resources") != {"storyboard_critics": 1}
                or reserved != receipt["reservation"]
                or sha(canonical(reserved)) != receipt["reservation_sha256"]
                or not any(e.get("kind") == EVENT and e.get("reason") == "finish-current"
                           and e.get("failure_evidence_sha256") == plan["failure_evidence_sha256"]
                           for e in state["events"])
                or any(e.get("kind") == "reserved" and e.get("resources", {}).get("storyboard_critics")
                       for e in state["events"][index + 1:])):
            return False
        observations = receipt["observations"]
        if not isinstance(observations, list) or len(observations) != 2:
            return False
        first, last = observations
        times = [datetime.fromisoformat(x["observed_at"].replace("Z", "+00:00")) for x in observations]
        if (any(t.tzinfo is None for t in times)
                or (times[1] - times[0]).total_seconds() < policy["minimum_observation_gap_seconds"]
                or any(x.get("agent_id") != receipt["agent_id"] or x.get("status") != "running"
                       or x.get("model") != policy["model"] or x.get("error") is not None
                       for x in observations)
                or type(last["elapsed_seconds"]) is not int
                or last["elapsed_seconds"] < policy["minimum_elapsed_seconds"]
                or type(first["elapsed_seconds"]) is not int
                or not 0 <= first["elapsed_seconds"] < last["elapsed_seconds"]
                or abs((last["elapsed_seconds"] - first["elapsed_seconds"])
                       - (times[1] - times[0]).total_seconds()) > 60
                or type(first["tool_uses"]) is not int or first["tool_uses"] <= 0
                or first["tool_uses"] != last["tool_uses"]
                or first["reported_tokens"] != last["reported_tokens"]
                or not all(isinstance(x.get("evidence"), str) and x["evidence"].strip() for x in observations)):
            return False
        bindings = proof["inputs"]
        return (isinstance(bindings, list) and len(bindings) >= 7
                and len({x["path"] for x in bindings}) == len(bindings)
                and sum(x["kind"] == "board" for x in bindings) == 2
                and sum(x["kind"] == "film" for x in bindings) == 2
                and {x["kind"] for x in bindings} >= {"board", "claims", "film", "packet", "output_contract"}
                and all(isinstance(x.get("path"), str) and x["path"]
                        and re.fullmatch(r"[a-f0-9]{64}", x.get("sha256", "")) for x in bindings))
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def file_problems(plan):
    """Validate actual current bytes before admission; replay uses retained bindings."""
    from critic_gate import problems
    try:
        root = POLICY.parent.parent.resolve()
        proof = plan["handback_evidence"]
        rows = proof["inputs"]
        for row in rows:
            path = Path(row["path"]).resolve()
            if not path.is_relative_to(root) or digest(path) != row["sha256"]:
                return ["handback input changed or is outside the production checkout"]
        receipt = json.loads(proof["receipt_json"])
        observed = datetime.fromisoformat(receipt["observations"][-1]["observed_at"].replace("Z", "+00:00"))
        if observed.tzinfo is None or not 0 <= (datetime.now(timezone.utc) - observed).total_seconds() <= 300:
            return ["handback needs fresh supported host status observed within five minutes"]
        report = json.loads(Path(plan["failure_evidence"]).read_text())
        board_path = proof["pass_board"]
        if not any(x["kind"] == "board" and x["path"] == board_path for x in rows):
            return ["handback lacks its actual approved board binding"]
        return problems(json.loads(Path(board_path).read_text()), report)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["handback current evidence could not be verified: " + str(exc)]


def prepare(base_plan, receipt_path, pass_board, inputs, output):
    from autonomous_completion import sha
    plan = json.loads(Path(base_plan).read_text())
    if plan.get("completion_reason") != "finish-current" or plan.get("changed_inputs"):
        raise ValueError("handback needs the retained finish-current plan without a correction")
    policy_text, receipt_text = POLICY.read_text(), Path(receipt_path).read_text()
    plan["completion_reason"] = REASON
    plan["handback_evidence"] = {"policy_json": policy_text, "policy_sha256": sha(policy_text),
                                "receipt_json": receipt_text, "receipt_sha256": sha(receipt_text),
                                "pass_board": str(Path(pass_board).resolve()),
                                "inputs": [{"kind": kind, "path": str(Path(path).resolve()),
                                            "sha256": digest(path)} for kind, path in inputs]}
    with Path(output).open("x") as stream:
        json.dump(plan, stream, indent=2); stream.write("\n")
    return plan


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-plan", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--pass-board", type=Path, required=True)
    parser.add_argument("--input", nargs=2, action="append", required=True, metavar=("KIND", "PATH"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    prepare(args.base_plan, args.receipt, args.pass_board, args.input, args.output)
    print("Bound same-worker handback plan. No capacity, call or review approval granted.")
