"""Targets are not ceilings; findings are preserved, never normalized into new evidence."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import run_controller as c
import production_lifecycle as life
import validation_check
from validation_findings import valid_findings
from validator_grant_test import ValidatorGrantTests


class CapacityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / "run_state.json"
        c.initialise(self.path, "2026-11-10", "production")

    def test_target_exhaustion_is_not_capacity_exhaustion(self):
        for _ in range(2):
            self.assertTrue(c.reserve(self.path, {"validator_agents": 1})[0])
        before = self.path.read_bytes()
        result = c.validator_capacity(self.path)
        self.assertEqual(result["current_target"], 2)
        self.assertEqual(result["effective_ceiling"], 4)
        self.assertEqual(result["remaining"], 2)
        self.assertEqual(result["next_action"], "reserve_existing_capacity")
        self.assertEqual(self.path.read_bytes(), before)
        self.assertTrue(c.reserve(self.path, {"validator_agents": 1})[0])
        state = c.read_state(self.path)
        self.assertEqual(state["usage"]["validator_agents"], 3)
        self.assertEqual(state["resource_envelope"]["validator_agents"], 4)
        self.assertEqual(life.allowance_problems(state), [])
        self.assertFalse(any(e["kind"] == "owner_validator_grant" for e in state["events"]))

    def test_real_cli_read_only_and_actual_exhaustion(self):
        for _ in range(4):
            self.assertTrue(c.reserve(self.path, {"validator_agents": 1})[0])
        before = self.path.read_bytes()
        result = subprocess.run([sys.executable, c.__file__, "--state", str(self.path),
                                 "validator-capacity"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["next_action"], "plan_mandatory_completion")
        self.assertEqual(self.path.read_bytes(), before)
        self.assertFalse(c.reserve(self.path, {"validator_agents": 1})[0])

    def test_tampered_ceiling_and_terminal_state_do_not_offer_spend(self):
        before = c.read_state(self.path)
        for state in (dict(before, terminal_state="shipped"), copy.deepcopy(before)):
            if state.get("terminal_state") is None:
                state["escalation_ceiling"]["validator_agents"] += 1
            c.save(self.path, state)
            result = c.validator_capacity(self.path)
            self.assertTrue(result["errors"])
            self.assertEqual(result["next_action"], "resolve_integrity_blocker")
            self.assertIsNone(result["remaining"])

    def test_structured_findings_validate_without_rewriting(self):
        self.path.unlink()  # test report shape independently of the live controller
        claims = self.root / "claims.json"
        claims.write_text(json.dumps({"claims": [{"id": "c1", "verdict": "VERIFIED"}]}))
        report = self.root / "validation.json"
        report.write_text(json.dumps({"date": "2026-11-10", "source": "independent-validator",
            "result": "PASS_WITH_DROPS", "verified_claim_ids": ["c1"],
            "rejected": [{"id": "c3", "reason": "The source does not support the broader claim."}],
            "required_edits_applied": ["Dropped the unsupported claim."]}))
        before = report.read_bytes()
        self.assertEqual(validation_check.check(report, claims, edition_date="2026-11-10"), [])
        self.assertEqual(report.read_bytes(), before)

    def test_malformed_findings_fail_closed(self):
        for value in (None, [], [""], [None], [{}], [{"id": "c3"}],
                      [{"id": "c3", "reason": ""}], [{"id": True, "reason": "defect"}],
                      [{"id": "c3", "reason": {"text": "defect"}}]):
            self.assertFalse(valid_findings(value), repr(value))
        self.assertTrue(valid_findings(["Defect", {"id": "c3", "reason": "Unsupported"}]))
        self.assertTrue(valid_findings([], allow_empty=True))

    def test_structured_retained_rejection_can_use_explicit_historical_grant(self):
        fixture = ValidatorGrantTests(); fixture.setUp(); self.addCleanup(fixture.doCleanups)
        report = json.loads(fixture.failure.read_text())
        report["rejected"] = [{"id": "c3", "reason": "Keep the source limitation."}]
        fixture.failure.write_text(json.dumps(report))
        fixture.auth["failure_evidence_sha256"] = c.digest(fixture.failure)
        fixture.authorization.write_text(json.dumps(fixture.auth))
        before = fixture.failure.read_bytes()
        self.assertTrue(fixture.grant()[0])
        self.assertEqual(fixture.failure.read_bytes(), before)
        self.assertEqual(life.allowance_problems(c.read_state(fixture.path)), [])


if __name__ == "__main__":
    unittest.main()
