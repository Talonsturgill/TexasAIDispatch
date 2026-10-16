# Fresh independent source validation of the R9 narration (charged, precharged before dispatch)

You are the fresh independent validator (Opus High, read plus fetch only). Do the work yourself, launch no agents, edit nothing. The director reserved validator_agents 4 of 4 before this dispatch. You can't verify that, so say so. Every hash below was computed by the director with sha256sum. You compute none, and you must not claim to.

What you validate. The narration in /home/user/ed1015/TexasAIDispatch/out/dispatch/vo_script.txt (sha256 7b73e3fcde1e2c0ae0500b099298b66af70142a39db40a4dd51641b994ee4444, 15 sentences) against the claims in /home/user/ed1015/TexasAIDispatch/out/dispatch/claims.json (sha256 49b2379c63534c1685c5fcd480bbf0aa8cadee104811bfe9abb29cbb14f6438e, c1 to c20) and the source. The sentence to claim bindings are in /home/user/ed1015/TexasAIDispatch/out/dispatch/vo_bindings.json (sha256 ae84d1e253a252c28cac9cebd05293f8f132cc8d493caf1d224c4271f919a7fc). The fetched snapshot is /home/user/ed1015/TexasAIDispatch/out/dispatch/sources/utsa.txt (sha256 9ec493983d1b4b41a043b5eb934563ca37c64e1f98a2bb88bca90a8e49b551c9). The live page is https://news.utsa.edu/2026/09/ut-san-antonio-researcher-builds-self-powered-smart-warning-system-to-catch-local-floods-before-disaster-strikes/ . Fetch it with WebFetch and compare it with the snapshot. Read the story framing in /home/user/ed1015/TexasAIDispatch/out/dispatch/story_selection.json too.

History you should know, not rely on. This script replaced a nine sentence script that an earlier validator passed. The sentences and their claim wording changed, so nothing from that pass carries over. An independent code and recurrence critic read this script and raised two wording questions for you. Rule on both explicitly with your own reading of the source.
1. Sentence 11 "The university reports early chip AI validation." followed by sentence 12 "Accuracy was ninety eight point eight two percent." The source line is "So far, the AI has performed well, achieving 98.82% validation accuracy in initial assessments post-training." in the on-device TinyML section. Does the pair keep the limits (the university reports it, the subject is the on-device chip AI and not the hub model, it is validation accuracy, it comes from early or initial assessments) and avoid implying a stronger validation or an unqualified accuracy? The on-screen card and tag carry "Initial assessments after training" and a validation card, and the words "after training" are not spoken.
2. Sentences 13 and 14, "The university reports no field result." and "It names no town with an installed station." Are they limited to what the university's announcement reports and names?
Then judge every other sentence the same way: any overstatement, dropped qualifier, numeral not in a verified quote, wrong claim binding, result moved to another subject, place or time, and any house rule break (no colons, semicolons, em or en dashes, no first person, never "cannot", no sentence opened with And or But, none of the words gap, matters or pattern, ordinal dates, straight quotes, no digits in spoken numbers).

Rejecting is allowed and expected if a sentence fails. If anything fails, return result REVISE with the exact required edits. Don't invent a rejection to fill a quota, and don't pass what you can't prove. PASS only if every sentence and every cited claim is proven verbatim against the live page and the snapshot.

Return ONE JSON object with exactly these keys, then a one line note:
- date "2026-10-15"
- source: a string saying what you fetched, when, and what you compared
- result "PASS", "PASS_WITH_DROPS" or "REVISE"
- verified_claim_ids: the list of claim ids you proved verbatim (a PASS covers all of c1 to c20)
- rejected: a non empty list of strings. If nothing is rejected, one string saying so and why
- required_edits_applied: a non empty list of strings. If nothing was required, one string saying so
- reviewer_identity: your model and role, and what you could not verify
- script_sha256 "7b73e3fcde1e2c0ae0500b099298b66af70142a39db40a4dd51641b994ee4444" and claims_sha256 "49b2379c63534c1685c5fcd480bbf0aa8cadee104811bfe9abb29cbb14f6438e" (echo the hashes above only if you read exactly those files)
- sentences: one entry per sentence with n, text, claim_ids, supported (true/false), limits_note
- rulings: your explicit rulings on questions 1 and 2 above
- house_rules: pass or the exact failures

Your response will be saved unchanged. It approves no take, caption, picture, film, score or shipment.
