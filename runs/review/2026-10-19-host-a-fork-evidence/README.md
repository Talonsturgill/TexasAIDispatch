# Host A fork evidence, edition 2026-10-19 (no film bytes, no ledger)

Host A is the original container of the scheduled run. After a container restart the platform started a second invocation (host B). Both advanced the same edition from the same checkpoint, so host A's ledger forked. Host B's checkpoint chain is authoritative.

Facts host A can verify that host B cannot see in its own chain:

- Host A executed the code-plan review round 15 once, by the Opus critic agent abbd12ae, on reservation storyboard_critics 24/24 (packet critic-packet-round15 b885acc5). It returned REVISE for both treatments (the s6 may underline built with a zero side radius). Report files: code-round15/report-a.json, report-b.json, handback.txt.
- Host B executed the same reservation again with agent aea70021 and got PASS for A. One of the two executions has no separate controller debit. An honest late debit belongs in the authoritative ledger.
- Host A earlier resumed the code critic abbd12ae by SendMessage after the container restart (round 11), also noted in host-a-WORKLOG.md.
- Host A's local ledger was never accepted by the remote checkpoint after the fork (checkpoint verification refused it), so none of its later charges landed in the authoritative chain: critic rounds 12, 13, 14 (phone, agent aef1b6a9), 15 as above, reboard follow-ups and comparison renewals were host A work on the forked line.
- Tooling merged to main by host A: PRs 239, 241, 242, 243, 247.
