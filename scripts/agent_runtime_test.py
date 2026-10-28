"""Mutation tests for isolated routing, honest counters and fail-closed pre-spend checks."""
import copy
import json
import tempfile
import unittest
import five_round_fixture  # noqa: F401
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

    def feed_fixture(self):
        # Scratch byte-binding evidence only, never a production verdict.
        (self.root / "feed-composite.json").write_text(json.dumps({
            "schema": "dispatch_feed_composite/1", "pass": True,
            "film_sha256": a.digest(self.root / "film.mp4"),
            "contact_sheet_sha256": a.digest(self.root / "feed-composite.png")}))

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
        # Only this scratch input-binding fixture uses today's renderer hashes. It grants
        # no film approval and never edits the archived production board or its evidence.
        import modern_film
        board['film_direction']['renderer_inputs'] = modern_film.renderer_inputs(board['film_direction']['episode'])
        bp=self.root/"storyboard.json";cp=self.root/"claims.json"
        bp.write_text(json.dumps(board));cp.write_bytes((source/"claims.json").read_bytes())
        for variant in ("a","b"):
            candidate=copy.deepcopy(board);candidate["film_direction"]["variant"]=variant
            (self.root/("opening-"+variant+".json")).write_text(json.dumps(candidate))
        for name in ("film.mp4","attention-review.html","feed-composite.png"):
            (self.root/name).write_bytes(b"fixture-only non-media binding")
        self.feed_fixture()
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
        self.feed_fixture()
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


class CompactRecoveryGuides(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve() / ('restored-original-checkpoint-' * 5)
        self.root.mkdir()
        self.repo = patch.object(a, 'REPO', self.root); self.repo.start()
        self.addCleanup(self.repo.stop)
        self.guides = []
        for index in range(19):
            path = self.root / 'knowledge/craft' / (str(index) + '.md')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('Complete guide text ' + str(index))
            self.guides.append(a.bound(path))
        self.packet = {'role': 'storyboard-critic', 'date': '2026-10-21',
            'local_recovery': {'runtime': 'codex'}, 'instructions': 'Read every bound guide in full.',
            'board': a.bound(self.guides[0]['path']),
            'craft_readings': self.guides, 'completion_readings': self.guides[:2],
            'agent_contracts': self.guides[:6], 'source_runtime_contracts': self.guides[:9]}

    def test_long_restored_path_roundtrips_all_guides_and_native_phone_fields(self):
        import claude_runtime, codex_visual_observations
        # Phone policy and observation instructions are genuine source contracts, not verdicts.
        self.packet.update(phone_decision_scope=claude_runtime.phone_decision_scope(),
            phone_options=[{'board': self.packet['board'], 'motion_sequence': self.packet['board']}])
        claude_runtime.image_reading(self.packet)
        before = copy.deepcopy(self.packet)
        self.assertGreater(len(json.dumps(before, separators=(',', ':'))), 10000)
        encoded = d.packet_text(self.packet)
        self.assertLessEqual(len(encoded), 10000)
        compact = json.loads(encoded)
        self.assertEqual(str(self.root), compact['repo_root'])
        self.assertEqual(before['board'], compact['board'])
        self.assertEqual(before, a.expand_packet_bindings(compact))
        self.assertEqual(before, self.packet)
        path = self.root / 'packet.json'; path.write_text(encoded)
        with patch('os.getcwd', return_value='/unrelated/worker/directory'):
            for reader in (a.read, claude_runtime.read, codex_visual_observations.read):
                self.assertEqual(before, reader(path))
        a.validate_references(a.read(path))
        self.assertEqual(10000, d.policy()['handoff_max_chars'])
        # A guide hash is never replaced by a successful path expansion.
        Path(self.guides[0]['path']).write_text('Changed current guide')
        with self.assertRaisesRegex(ValueError, 'input changed'):
            a.validate_references(a.read(path))

    def test_wrong_root_traversal_alias_and_runtime_are_rejected(self):
        compact = a.compact_packet_bindings(self.packet)
        for mutation in ('root', 'traversal', 'absolute', 'alias', 'runtime'):
            value = copy.deepcopy(compact)
            if mutation == 'root':
                value['repo_root'] = str(self.root.parent)
            elif mutation == 'runtime':
                value['local_recovery']['runtime'] = 'claude'
            elif mutation == 'alias':
                (self.root / 'alias.md').symlink_to(self.guides[0]['path'])
                value['craft_readings'][0]['path'] = 'alias.md'
            else:
                value['craft_readings'][0]['path'] = ('../elsewhere.md' if mutation == 'traversal'
                                                      else self.guides[0]['path'])
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                a.expand_packet_bindings(value)

    def test_normal_route_and_real_excess_are_not_exempted(self):
        ordinary = copy.deepcopy(self.packet); ordinary.pop('local_recovery')
        self.assertEqual(ordinary, json.loads(d.packet_text(ordinary)))
        self.packet['instructions'] = 'x' * 11000
        self.assertGreater(len(d.packet_text(self.packet)), 10000)


class LocalRecoveryRouting(unittest.TestCase):
    setUp = RuntimeTest.setUp
    source_packet = RuntimeTest.source_packet
    # Scratch bindings exercise routing only; they assert no media quality or review verdict.
    def recovery_packet(self, role='vo-director'):
        import claude_runtime
        self.state = self.root / 'out/dispatch/run_state.json'
        self.state.parent.mkdir(parents=True, exist_ok=True)
        self.state.write_text(json.dumps({'run_id': '2026-10-21', 'mode': 'production',
            'terminal_state': None, 'usage': {'storyboard_critics': 4}, 'events': [], 'phase': 'active_repair'}))
        self.board = self.state.with_name('storyboard.json')
        self.claims = self.state.with_name('claims.json')
        self.board.write_text(json.dumps({'date': '2026-10-21', 'scenes': [],
            'creative_direction': {'medium_choice': 'explanatory animation'},
            'story_art': {'version': 'authored-story-art-v1', 'runtime': 'claude',
                          'edition_id': '2026-10-21', 'requests': []}}))
        self.claims.write_text('{"claims":[]}')
        self.owner = {'runtime': 'codex', 'run_id': '2026-10-21', 'owner_sha256': 'a' * 64, 'epoch': 'b' * 32}
        with patch('publication_owner.require_owner', return_value=self.owner):
            data = d.packet(self.board, self.claims, role, self.state, runtime='codex')
        self.packet.write_text(json.dumps(data))
        return data

    def test_explicit_local_route_preserves_original_art_guides_and_default_claude(self):
        import claude_runtime
        data = self.recovery_packet()
        before = self.board.read_bytes()
        self.assertEqual(a.assignment('vo-director', '2026-10-21'), data['agent_assignment'])
        self.assertEqual(claude_runtime.contracts('vo-director'), data['source_runtime_contracts'])
        self.assertEqual('codex', data['local_recovery']['runtime'])
        self.assertEqual(before, self.board.read_bytes())
        original = d.packet(self.board, self.claims, 'vo-director', self.state)
        self.assertEqual(claude_runtime.assignment('vo-director', '2026-10-21'), original['agent_assignment'])
        self.assertEqual(original['craft_readings'], data['craft_readings'])
        self.assertEqual(original['board'], data['board'])
        self.assertEqual(original['claims'], data['claims'])
        with patch('publication_owner.require_owner', return_value=None), self.assertRaisesRegex(ValueError, 'ownership'):
            d.packet(self.board, self.claims, 'vo-director', self.state, runtime='codex')
        with self.assertRaisesRegex(ValueError, 'original authored board'):
            d.packet(self.board, self.claims, 'vo-director', runtime='codex')

    def test_local_visual_contract_dispatches_actual_codex_evidence_only(self):
        import claude_runtime
        import codex_visual_observations as visual
        data = self.recovery_packet()
        claude_runtime.image_reading(data)
        self.assertEqual(visual.CONTRACT, data['codex_visual_evidence'])
        self.assertIn('CODEX_VISUAL_OBSERVATION', data['instructions'])
        self.assertNotIn('before another image Read', data['instructions'])
        claude_runtime.image_policy_inputs(data)
        self.packet.write_text(json.dumps(data))
        coverage = self.root / 'coverage.json'; coverage.write_text('{}')
        with patch.object(visual, 'coverage_problems', return_value=['native evidence missing']) as verifier:
            self.assertEqual(['native evidence missing'], claude_runtime.image_coverage_problems(self.packet, coverage))
            verifier.assert_called_once_with(self.packet, coverage)
        data.pop('local_recovery'); self.packet.write_text(json.dumps(data))
        with patch.object(visual, 'coverage_problems') as verifier:
            self.assertTrue(claude_runtime.image_coverage_problems(self.packet, coverage))
            verifier.assert_not_called()

    def test_local_plan_requires_own_fresh_claim_and_retains_all_bound_inputs(self):
        data = self.recovery_packet()
        brief = self.root / data['brief']; brief.parent.mkdir(parents=True, exist_ok=True)
        brief.write_bytes((a.REPO / data['brief']).read_bytes())
        contract_rows = data['agent_contracts']
        with patch.object(a, 'REPO', self.root), patch.object(a, 'contracts', return_value=contract_rows), \
                patch('publication_owner.require_owner', return_value=self.owner), \
                patch('publication_owner.has_unclaimed_worker_reservation', return_value=False), \
                patch('publication_owner.claim_worker', return_value=False) as claim:
            result = a.plan('vo-director', self.packet, 'voice', 'Retain current exact evidence')
            self.assertFalse(result['dispatch_ready']); self.assertNotIn('spawn_args', result)
            claim.assert_called_once()
            data['source_runtime_contracts'][0]['sha256'] = '0' * 64
            self.packet.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'original authored runtime'):
                a.plan('vo-director', self.packet, 'voice', 'Retain current exact evidence')
            self.assertEqual(1, claim.call_count)

    def test_recovery_binding_cannot_be_removed_from_owned_local_plan(self):
        self.source_packet()
        with patch('publication_owner.local_workspace', return_value=self.root), \
                self.assertRaisesRegex(ValueError, 'cannot drop'):
            a.plan('researcher', self.packet, 'researcher', 'One actual beat')

    def test_fifth_local_review_refuses_code_and_replay_without_new_capacity(self):
        import claude_runtime
        data = self.recovery_packet()
        role = 'storyboard-critic'
        data.update(role=role, agent_assignment=a.assignment(role, '2026-10-21'),
                    agent_contracts=a.contracts(role), source_runtime_contracts=claude_runtime.contracts(role),
                    brief=a.policy()['roles'][role]['brief'])
        self.packet.write_text(json.dumps(data))
        with patch.object(a, 'REPO', self.root), \
                patch('publication_owner.require_owner', return_value=self.owner), \
                patch('publication_owner.has_unclaimed_worker_reservation', return_value=False), \
                patch('publication_owner.claim_worker') as claim:
            with self.assertRaisesRegex(ValueError, 'fifth review is protected'):
                a.plan(role, self.packet, 'critic', 'Current code')
            data.update(phone_mode='current', review_scope='exact-muted-phone-preflight')
            self.packet.write_text(json.dumps(data))
            state = json.loads(self.state.read_text()); state['usage']['storyboard_critics'] = 5
            self.state.write_text(json.dumps(state))
            with self.assertRaisesRegex(ValueError, 'hard five-review limit reached'):
                a.plan(role, self.packet, 'critic', 'Current timed phone')
            claim.assert_not_called()
        brief = self.root / data['brief']; brief.parent.mkdir(parents=True, exist_ok=True)
        brief.write_bytes((a.REPO / data['brief']).read_bytes())
        claim_path = self.root / 'claim.json'; claim_path.write_text('{"fixture":"new owned reservation"}')
        # Gate stubs isolate reservation plumbing; no observation, media pass or score is created.
        with patch.object(a, 'REPO', self.root), patch.object(a, 'required_inputs'), \
                patch('publication_owner.require_owner', return_value=self.owner), \
                patch('publication_owner.has_unclaimed_worker_reservation', return_value=True), \
                patch('publication_owner.claim_worker', return_value=claim_path), \
                patch.object(claude_runtime, 'phone_review_inputs') as phone_gate, \
                patch.object(claude_runtime, 'image_policy_inputs') as image_gate:
            result = a.plan(role, self.packet, 'critic', 'Current timed phone')
            self.assertTrue(result['dispatch_ready'])
            self.assertEqual('gpt-6.1-sol', result['spawn_args']['model'])
            self.assertEqual('high', result['spawn_args']['reasoning_effort'])
            self.assertEqual('none', result['spawn_args']['fork_turns'])
            phone_gate.assert_called_once(); image_gate.assert_called_once()


if __name__=="__main__":unittest.main()
