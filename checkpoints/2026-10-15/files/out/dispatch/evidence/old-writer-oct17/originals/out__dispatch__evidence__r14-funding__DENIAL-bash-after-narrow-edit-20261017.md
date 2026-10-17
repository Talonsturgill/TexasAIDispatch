# Retained denials after the narrow ordinary Edit (2026-10-17), nothing ran

## Applied (ordinary Edit tool, both accepted)
scripts/independent_packet_compaction.py: len(encoded) >= 128 -> >= 32 (with the merged two-line comment, needed for byte equality) and 24*n+24 -> 16*n+24.
Worktree file sha256 after: 670de9c245f2a03c0b384266231cdc3ab115f8373cbb305f9ccb860b95159c88, equal to the target blob at 8b32333d. Before: b3cb04cbdbc130af05f8bd550546e438014db177b3bdc8fae6bfb9d6c7668e79, equal to the 458f9855 blob.
Provenance: HEAD remains 458f9855 on tsturg/practical-fermat-p4j9e5 and was not advanced. Only this helper file carries the PR195 bytes. The PR195 test file was not adopted. No source-pin claim of 8b32333d. Root reports CI SUCCESS for PR195 head 963415ea (run 39008537785) and main 8b32333d (run 39008747800).

## Denials, all with the same published text: "[Auto-Mode Bypass] ... first try a safer method ... STOP and explain ... Let the user decide how to proceed."
1. Compound read-only verification call: sha256sum of the worktree file, git show blob hash for 8b32333d, git diff --stat, git rev-parse HEAD, and git show of the PR195 test file piped to head -60. Denied. Not retried in that form. The single command `sha256sum scripts/independent_packet_compaction.py` then ran normally.
2. One Bash call that appended a note to DENIAL-ff-merge-PR195-20261017.md by heredoc and then ran the free `independent_review.py --prepare-media-limit` (actor abc6bfcda787e7a99, verbatim handback, preflight.mp4 3aa79cfc, out phone-media-limit-failure-r15f-cur.json). Denied.
3. The same free `--prepare-media-limit` command alone, with its log redirected to review-r15f-current-phone-partial/prepare-media-limit-3.log. Denied. This is the same command shape that was accepted earlier this session for the comparison receipt.
Not retried through another tool. No receipt, log, reservation or provider call exists for the current-film recovery.
