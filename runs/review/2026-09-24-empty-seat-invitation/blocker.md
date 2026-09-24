# September 24 Dispatch delivery blocker

The film cleared its three-judge panel at 7.304, with no hard fails. Dispatch PRs #61 and #62 passed exact-head guards and merged. The master, phone rendition, poster, and thumbnail each return HTTP 200 from their permanent media URLs.

The Docket feed is held in ready PR #355 at commit `9cd0285fe376afbc8ad44b83e6a5f336b3d0b4da`. Its `gates` job failed because `scripts/site/docket_staleness.py` exited 2 on ten live record items, each five days since verification against a two-day limit:

`tx-2026-0015`, `tx-2026-0016`, `tx-2026-0027`, `tx-2026-0032`, `tx-2026-0037`, `tx-2026-0057`, `tx-2026-0063`, `tx-2026-0077`, `tx-2026-0128`, `tx-2026-0138`.

The failure reproduced locally on the isolated Docket worktree. The feed entry and 39 generated files passed site freshness and `dispatch` ownership checks. The Dispatch lane owns only the feed entry and generated output; the Docket daily record owner must re-verify these source records. Keep PR #355 unmerged until its exact-head checks pass, then verify the canonical feed and playback before creating the correctly addressed unsent Gmail draft. No email or social post was sent.

The review package's `dispatch.mp4` is a byte-for-byte copy of the scored 43-second film. The original run artifacts are already on Dispatch `main`; this review copy preserves the blocked publication state without changing the film.
