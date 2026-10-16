
def opening_problems(board_path):
    board_path = Path(board_path)
    board = read(board_path)
    try:
        from metadata_continuation import baseline as metadata_baseline
        metadata_board = metadata_baseline(board_path)
        if metadata_board is not None:
            board = read(metadata_board)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["opening geographic metadata continuation invalid: " + str(exc)]
    if not required(board):
        return []
    try:
        root = board_path.parent / "openings"
        receipt = read(root / "comparison.json")
        review = read(root / "selection.json")
        from critic_gate import renderer_digest
        errors = []
        if receipt.get("policy_sha256") != digest(POLICY) or (not treatment_required(board) and receipt.get("renderer_sha256") != renderer_digest(board)):
            errors.append("opening comparison uses stale policy or renderer inputs")
        from opening_compare import adoption_problems
        adopted = bool(receipt.get("inspection_adoption")) and not adoption_problems(receipt, root)
        if receipt.get("inspection_adoption") and not adopted:
            errors.append("retained opening inspection adoption is invalid")
        if receipt.get("producer_sha256") != opening_producer() and not adopted:
            errors.append("opening comparison uses stale capture tools or fonts")
        options = receipt["options"]
        from opening_compare import inspection_problems
        ledger = read(board_path.with_name("run_state.json"))
        continuation = caption_renderer_continuation(board_path, receipt, review, ledger)
        if (root / "technical-continuation.json").exists() and not continuation:
            errors.append("historical treatment technical continuation is invalid")
        inspected_errors = finishing_inspection_problems(board, receipt, review, root, ledger)
        if continuation:
            inspected_errors = [e for e in inspected_errors if e not in {
                "opening a: structural inspection has stale inspector_sha256",
                "opening b: structural inspection has stale inspector_sha256"}]
        errors += inspected_errors
        reservation = receipt["reservation"]
        event = ledger["events"][reservation["event_index"]]
        if (reservation["run_id"] != ledger["run_id"] or reservation["run_id"] != board.get("run_id", board.get("date")) or board.get("date") != reservation["run_id"][:10]
                or event.get("kind") != "reserved" or event.get("resources") != {"preflight_renders": 1}
                or event.get("preflight_identity") != reservation["identity"]
                or event.get("note") != "two opening comparison batch"):
            errors.append("opening batch has no matching cumulative reservation")
        if (len(options) != policy()["opening_options"] or {r["id"] for r in options} != {"a", "b"}
                or len({r["concept_sha256"] for r in options}) != 2 or len({r["film"]["sha256"] for r in options}) != 2):
            errors.append("opening comparison must contain exactly two distinct concepts")
        for option in options:
            for key in ("board", "film"):
                ref = option[key]
                p = (root / ref["file"]).resolve()
                if not p.is_relative_to(root.resolve()) or digest(p) != ref["sha256"]:
                    errors.append("opening comparison evidence changed: " + key)
            option_board = read(root / option["board"]["file"])
            if treatment_required(board) and option.get("renderer_sha256") != renderer_digest(option_board) and not continuation:
                errors.append("opening treatment uses stale renderer inputs")
            if opening_digest(option_board) != option["concept_sha256"]:
                errors.append("opening concept does not match its board")
        comparison_hashes = {digest(root / "comparison.json")}
        if adopted:
            comparison_hashes.add(receipt["inspection_adoption"]["original_comparison"]["sha256"])
        if review.get("comparison_sha256") not in comparison_hashes:
            errors.append("opening choice belongs to different comparison bytes")
        chosen = next((r for r in options if r["id"] == review.get("selected")), None)
        if chosen and treatment_required(board) and chosen.get("renderer_sha256") != renderer_digest(board) and not continuation:
            errors.append("selected treatment renderer differs from the current film")
        if not chosen or chosen["concept_sha256"] != opening_digest(board):
            errors.append("current opening is not the selected concept")
        if not review.get("reviewer_identity") or review.get("reviewer_identity") == review.get("director_identity") or not review.get("director_identity"):
            errors.append("opening choice requires the existing independent phone critic")
        if review.get("director_identity") != (board.get("story_contract") or {}).get("director_identity"):
            errors.append("opening choice must identify the actual story director")
        reason = review.get("reason")
        if reason is None and "comparative_reason" in review:
            # Read the original provider's key without rewriting its verified object.
            from independent_review import evidence_problems
            if not review.get("provider_evidence"):
                errors.append("provider comparative reason lacks original independent evidence")
            else:
                errors += evidence_problems(review)
            reason = review["comparative_reason"]
        if not concrete(reason) or not concrete(review.get("rejected_reason")):
            errors.append("opening choice needs comparative observed reasons")
        from creative_release import review_allows
