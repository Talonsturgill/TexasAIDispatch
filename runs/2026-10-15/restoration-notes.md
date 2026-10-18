Restoration and release notes for the 2026-10-15 edition (public-safe).

Restoring the unfinished edition in a new root failed its audit twice and both failures are retained. First the checkpoint restore rewrote event paths to the new directory while the retry event at index 437 was hashed under the previous root, so the replay of grant event 454 refused. Restoring into the original root repaired that without changing any ledger byte. Second, the restore audit run from a newer main checkout could not see the uncommitted authored episode source, which the restored checkout carried. File timestamps were reset in logical order for the freshness gate after the film, board and mix hashes were confirmed equal to the registered deliverable. Film 1cb1b02a, board b7d3d14a and every ledger charge are unchanged.

The first release head failed the dated modern film CI fixture (run 39100631583) because registering this episode changed the global renderer digests. The fixture rebinding landed on the next head and passed. A deterministic derivation of that fixture is deferred to future source work.

Usage figures are the recorded controller ledger, 3,345,993 reported tokens, and are not total Claude billing. The session audit covers only the final resuming session. Older native account telemetry is unavailable.
