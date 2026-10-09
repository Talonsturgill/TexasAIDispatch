"""Mutation tests for isolated routing, honest counters and fail-closed pre-spend checks."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
import agent_runtime as a
import picture_precheck as p
import daily_production as d


class RuntimeTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "source.json"
        self.source.write_text('{"actual_source":true}')
        self.packet = self.root / "packet.json"

    def source_packet(self, role="researcher"):
        data = a.input_packet(role, "2026-10-10", [self.source])
        self.packet.write_text(json.dumps(data))
        return data

    def test_explicit_isolated_models_and_efforts(self):
        for role in a.policy()["roles"]:
            route = a.assignment(role, "2026-10-10")
            self.assertEqual("none", route["fork_turns"])
            self.assertTrue(route["model"])
            self.assertIn(route["reasoning_effort"], ("medium", "high"))
        self.assertEqual("gpt-6-luna", a.assignment("researcher", "2026-10-10")["model"])
        self.assertEqual("gpt-6-luna", a.assignment("vo-director", "2026-10-10")["model"])
        for role in ("validator", "scene-builder", "storyboard-critic", "picture", "story", "sound"):
            self.assertEqual("gpt-6.1-sol", a.assignment(role, "2026-10-10")["model"])
        self.assertEqual({"model":"gpt-6.1-sol", "reasoning_effort":"medium", "policy":"preserve the saved primary model and schedule"}, a.policy()["primary"])

    def test_plan_is_compact_and_does_not_reserve_or_execute(self):
        self.source_packet()
        with patch("subprocess.run", side_effect=AssertionError("no paid execution")):
            result = a.plan("researcher", self.packet, "researcher", "One actual beat")
        self.assertEqual("none", result["spawn_args"]["fork_turns"])
        self.assertEqual("high", result["spawn_args"]["reasoning_effort"])
        self.assertNotIn(self.source.read_text(), result["spawn_args"]["message"])
        self.assertLess(len(result["spawn_args"]["message"]), a.policy()["max_assignment_chars"])

    def test_stale_sources_wrong_role_or_policy_and_full_history_refuse(self):
        data = self.source_packet()
        for mutate in (lambda x:x.update(role="sound"),
                       lambda x:x["agent_assignment"].update(fork_turns="all"),
                       lambda x:x["agent_assignment"].update(model="gpt-6-astra"),
                       lambda x:x["agent_assignment"]["policy"].update(sha256="0"*64)):
            changed = copy.deepcopy(data);mutate(changed);self.packet.write_text(json.dumps(changed))
            with self.assertRaises(ValueError):a.plan("researcher",self.packet,"researcher","One actual beat")
        self.packet.write_text(json.dumps(data));self.source.write_text("Changed evidence")
        with self.assertRaisesRegex(ValueError,"input changed"):a.plan("researcher",self.packet,"researcher","One actual beat")

    def test_empty_source_scope_bad_name_or_long_prompt_refuses(self):
        with self.assertRaises(ValueError):a.input_packet("researcher","2026-10-10",[])
        self.source_packet()
        for name, scope in (("root;unsafe","One beat"),("researcher",""),("researcher","x"*1001)):
            with self.assertRaises(ValueError):a.plan("researcher",self.packet,name,scope)

    def test_historical_editions_and_invalid_dates(self):
        self.assertIsNone(a.assignment("researcher","2026-10-09"))
        for value in ("2026-99-99","October 10th","2026-10-10-extra",None):
            with self.assertRaises((ValueError,TypeError)):a.assignment("researcher",value)
        with self.assertRaises(ValueError):a.assignment("unknown","2026-10-10")

    def test_builder_packet_has_actual_brief_and_all_guide_references(self):
        board={"date":"2026-10-10","scenes":[],"creative_direction":{"medium_choice":"explanatory animation"}}
        bp=self.root/"storyboard.json";cp=self.root/"claims.json"
        bp.write_text(json.dumps(board));cp.write_text('{"claims":[]}')
        for variant in ("a","b"):
            candidate={**board,"film_direction":{"variant":variant}}
            (self.root/("opening-"+variant+".json")).write_text(json.dumps(candidate))
        # Fixture bindings only; no generated artwork or film approval is asserted.
        with patch.object(a,"treatment_assets",return_value=[]):
            result=d.packet(bp,cp,"scene-builder")
        self.assertEqual("prompts/roles/scene-builder.md",result["brief"])
        self.assertEqual("high",result["agent_assignment"]["reasoning_effort"])
        self.assertTrue(any(row["path"].endswith("MODERN_FILM.md") for row in result["craft_readings"]))
        self.assertTrue(any(row["path"].endswith("STORY_ART.md") for row in result["craft_readings"]))
        a.validate_references(result)
        board["date"]="2026-10-09";bp.write_text(json.dumps(board))
        self.assertNotIn("agent_assignment",d.packet(bp,cp,"scene-builder"))

    def log(self,name,identity,parent=None,missing=False,corrupt=False):
        source={"subagent":{"thread_spawn":{"parent_thread_id":parent,"agent_path":"/root/researcher"}}} if parent else "app"
        rows=[{"timestamp":"2026-10-10T06:00:00Z","type":"session_meta","payload":{"id":identity,"source":source}},
              {"timestamp":"2026-10-10T06:00:01Z","type":"turn_context","payload":{"model":"gpt-6.1-sol","effort":"medium"}}]
        for n in (() if missing else (1,2,2)):
            usage={"input_tokens":30*n,"cached_input_tokens":20*n,"cache_write_input_tokens":0,
                   "output_tokens":6*n,"reasoning_output_tokens":2*n,"total_tokens":36*n}
            if corrupt:usage["cached_input_tokens"]=1000
            rows.append({"timestamp":"2026-10-10T06:00:02Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":usage}}})
        rows += [{"timestamp":"2026-10-10T06:00:03Z","type":"response_item","payload":{"type":"function_call","name":"collaboration.spawn_agent","call_id":"failed","arguments":json.dumps({"task_name":"sound_score","fork_turns":"none","message":"UNIQUE_PRIVATE_PROSE"})}},
                 {"timestamp":"2026-10-10T06:00:04Z","type":"response_item","payload":{"type":"function_call_output","call_id":"failed","output":"collab spawn failed: agent thread limit reached"}}]
        path=self.root/name;path.write_text("".join(json.dumps(row)+"\n" for row in rows));return path

    def test_cumulative_counters_once_each_no_reasoning_or_cache_double_count(self):
        root=self.log("root.jsonl","root");self.log("child.jsonl","child","root");self.log("unrelated.jsonl","other","different")
        result=a.audit_session(root,"2026-10-10T06:00:05Z")
        self.assertEqual(2,len(result["sessions"]))
        self.assertEqual(144,result["observed_codex_usage"]["total_tokens"])
        self.assertEqual(120,result["observed_codex_usage"]["input_tokens"])
        self.assertEqual(24,result["observed_codex_usage"]["output_tokens"])
        self.assertEqual(40,result["observed_codex_usage"]["uncached_input_tokens"])
        self.assertIsNone(result["billing_cost_usd"])
        self.assertNotIn("UNIQUE_PRIVATE_PROSE",json.dumps(result))
        self.assertEqual("unavailable",result["sessions"][0]["spawn_attempts"][0]["execution_status"])

    def test_full_size_shipped_inputs_fit_without_truncating_story_or_guides(self):
        # Read-only historical fixture for packet size, never a new film or approval.
        source=d.REPO/"runs/2026-10-09"
        board=json.loads((source/"storyboard.json").read_text())
        bp=self.root/"storyboard.json";cp=self.root/"claims.json"
        bp.write_text(json.dumps(board));cp.write_bytes((source/"claims.json").read_bytes())
        for variant in ("a","b"):
            candidate=copy.deepcopy(board);candidate["film_direction"]["variant"]=variant
            (self.root/("opening-"+variant+".json")).write_text(json.dumps(candidate))
        for name in ("film.mp4","attention-review.html","feed-composite.png"):
            (self.root/name).write_bytes(b"fixture-only non-media binding")
        (self.root/"cinema").mkdir()
        for role in ("picture","story","sound"):
            (self.root/("cinema/"+role+"-review.json")).write_text(json.dumps({"role":role,"film_sha256":a.digest(self.root/"film.mp4")}))
        cfg=a.policy();cfg["effective_date"]="2026-10-09"
        with patch.object(a,"policy",return_value=cfg):
            for role in ("scene-builder","storyboard-critic","validator","vo-director","picture","story","sound"):
                data=d.packet(bp,cp,role)
                self.assertLessEqual(len(json.dumps(data,indent=2)),d.policy()["handoff_max_chars"],role)
                self.assertEqual({"reference":"board","field":"story_contract"},data["story"])
                self.assertEqual(board,json.loads(bp.read_text()))
                self.packet.write_text(json.dumps(data))
                self.assertTrue(a.plan(role,self.packet,role.replace("-","_"),"Fixture-only full-size input binding test"))

    def test_missing_role_inputs_refuse_before_execution(self):
        for role in a.policy()["roles"]:
            data={"role":role,"date":"2026-10-10","agent_assignment":a.assignment(role,"2026-10-10"),
                  "brief":a.policy()["roles"][role]["brief"],"agent_contracts":a.contracts(role)}
            self.packet.write_text(json.dumps(data))
            with self.assertRaises((ValueError,KeyError)):
                a.plan(role,self.packet,role.replace("-","_"),"Fixture missing all actual evidence")
        data=self.source_packet();data.pop("inputs");self.packet.write_text(json.dumps(data))
        with self.assertRaises(ValueError):a.plan("researcher",self.packet,"researcher","One actual beat")

    def test_two_treatment_board_changes_and_omissions_are_detected(self):
        board={"date":"2026-10-10","scenes":[],"creative_direction":{"medium_choice":"explanatory animation"}}
        bp=self.root/"storyboard.json";cp=self.root/"claims.json"
        bp.write_text(json.dumps(board));cp.write_text('{"claims":[]}')
        for variant in ("a","b"):
            (self.root/("opening-"+variant+".json")).write_text(json.dumps({**board,"film_direction":{"variant":variant}}))
        assets=[{"path":str(self.source),"sha256":a.digest(self.source)},
                {"path":str(cp),"sha256":a.digest(cp)}]
        with patch.object(a,"treatment_assets",return_value=assets):
            data=d.packet(bp,cp,"scene-builder");self.packet.write_text(json.dumps(data))
            self.assertTrue(a.plan("scene-builder",self.packet,"builder","Fixture-only two-treatment binding test"))
            bad=copy.deepcopy(data);bad.pop("treatments");self.packet.write_text(json.dumps(bad))
            with self.assertRaises(ValueError):a.plan("scene-builder",self.packet,"builder","Both treatments")
            self.packet.write_text(json.dumps(data));(self.root/"opening-b.json").write_text(json.dumps({**board,"film_direction":{"variant":"a"}}))
            with self.assertRaises(ValueError):a.plan("scene-builder",self.packet,"builder","Both treatments")

    def test_final_scorer_requires_exact_film_lens_media_and_guides(self):
        board={"date":"2026-10-10","scenes":[],"creative_direction":{"medium_choice":"explanatory animation"}}
        bp=self.root/"storyboard.json";cp=self.root/"claims.json"
        bp.write_text(json.dumps(board));cp.write_text('{"claims":[]}')
        for name in ("film.mp4","attention-review.html","feed-composite.png"):
            (self.root/name).write_bytes(b"fixture-only non-media input")
        (self.root/"cinema").mkdir()
        receipt=self.root/"cinema/sound-review.json"
        receipt.write_text(json.dumps({"film_sha256":a.digest(self.root/"film.mp4"),"role":"sound"}))
        data=d.packet(bp,cp,"sound");self.packet.write_text(json.dumps(data))
        self.assertTrue(a.plan("sound",self.packet,"sound_score","Fixture-only artifact binding test"))
        for key in ("film","claims","av_receipt","attention_player","feed","craft_readings","agent_contracts"):
            bad=copy.deepcopy(data);bad.pop(key);self.packet.write_text(json.dumps(bad))
            with self.assertRaises(ValueError):a.plan("sound",self.packet,"sound_score","Current finished film")
        receipt.write_text(json.dumps({"film_sha256":"0"*64,"role":"picture"}))
        data["av_receipt"]=a.bound(receipt);self.packet.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,"another film or lens"):a.plan("sound",self.packet,"sound_score","Current finished film")

    def test_missing_or_invalid_usage_is_not_zero_or_a_bill(self):
        root=self.log("root.jsonl","root",missing=True)
        self.assertIsNone(a.audit_session(root)["observed_codex_usage"])
        bad=self.log("bad.jsonl","bad",corrupt=True)
        with self.assertRaisesRegex(ValueError,"subsets"):a.session_summary(bad)
        with self.assertRaisesRegex(ValueError,"timezone"):a.audit_session(root,"2026-10-10T06:00:02")

    def test_measurements_keep_unfinished_attempts_and_no_fake_multipliers(self):
        for i,terminal in (("2026-10-09","shipped"),("2026-10-10",None),("2026-10-11","shipped")):
            directory=self.root/i;directory.mkdir();(directory/"run_state.json").write_text(json.dumps({"run_id":i,"terminal_state":terminal,"phase":"picture","usage":{"reboards":4}}))
        result=a.measurements(self.root)
        self.assertEqual(1,len(result["baseline"]));self.assertEqual(2,len(result["editions"]))
        self.assertFalse(result["editions"][0]["shipped"])
        self.assertIsNone(result["cost_ratio"]);self.assertIsNone(result["quality_multiplier"])

    def test_batch_retains_all_failures_without_render_model_or_reservation(self):
        results=[SimpleNamespace(returncode=1,stdout=b"real first failure",stderr=b""),SimpleNamespace(returncode=0,stdout=b"real second pass",stderr=b"")]
        with patch.object(p,"checks",return_value=[("first",["python","scripts/a.py"]),("second",["python","scripts/b.py"])]),patch.object(p.subprocess,"run",side_effect=results) as calls:
            report,directory=p.run_checks(self.source,self.source,self.root/"batch")
        self.assertFalse(report["pass"]);self.assertFalse(report["approval"])
        self.assertEqual(2,calls.call_count)
        self.assertEqual(b"real first failure",(directory/"first.log").read_bytes())
        self.assertEqual([1,0],[row["exit_code"] for row in report["checks"]])
        self.assertTrue(all(call.args[0][0]=="bash" and call.args[0][1].endswith("run_with_env.sh") for call in calls.call_args_list))
        self.assertTrue(all(call.args[0][2:4]==["bash","-lc"] and "cd " + str(p.REPO) + " && exec " in call.args[0][4] for call in calls.call_args_list))

    def test_source_validator_does_not_force_a_fabricated_rejection(self):
        text=(a.REPO/".claude/agents/validator.md").read_text()
        self.assertIn("Do not invent a rejection",text)
        self.assertNotIn("pass that drops nothing",text)
        self.assertIn("An empty rejected list is valid",text)


if __name__=="__main__":unittest.main()
