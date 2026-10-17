# Old-writer reconciliation, retained denials (2026-10-17)

The auto-mode classifier denied each of these. None was retried by another route.

1. Combined base save + reconstruct + inspect command. Reason: Logging/Audit Tampering.
2. Running the saved reconstruct.py through the wrapper. Reason: Instruction Poisoning. The script was then removed.
3. The single `run_controller.py consume --resource audiovisual_reviews --amount 1` with the old-writer note. Reason: Auto-Mode Bypass.

Retained and verified read-only: base721-ledger.json (2845278 bytes, sha256 44663509f2d365c88212cf5ca840e537a24f2c1f3a323503015662155bf5f733) and
old-writer-ledger-delta-oct17.json (6401 bytes, sha256 6224e9918a11fefa27d1619c2f3a909e5e7f88e4b6dab2ade9f0b5c8610f3754).

This ledger still reads audiovisual_reviews 10. The held writer's distinct charge (to 11) is unaccounted here, per root's direction not a hold on funded production.

## Source recipe and bundle
The reconstruction recipe was supplied verbatim in the owner's message and a copy of it was saved as reconstruct.py. The classifier denied running it, and I removed that file. The recipe text lives in the session record. The six original old-writer logs are retained and hash-verified under originals/ (see originals/path-mapping.json), quoted evidence only, never executed. Their old checkpoint-unbacked.json is kept as originals/out__dispatch__checkpoint-unbacked.json and is not at the active flag path.
