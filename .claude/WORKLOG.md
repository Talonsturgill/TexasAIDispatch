# Bounded native PNG capture

Task: fix recurring hosted-cloud disk exhaustion through bounded PNG staging, preserving native quality, ownership, capture accounting, all release safeguards, and the legacy full-frame headroom gate. Never start or change the active producer during engineering.

Baseline: main 7a08093, Remotion 4.0.399. Fresh producer has 18.964 GiB free before its Docket sibling; legacy 1778-frame gate needs 19 GiB. Safe housekeeping and compaction already exhausted.

Plan:
1. Implement bounded frame batches into one continuous encoder, with backpressure, exact frame order, cancellation and failure safety.
2. Bind the new storage profile to verified renderer bytes and exact authorized operations; retain legacy fallback requirements.
3. Verify real scenes against legacy rendering, entropy bounds, failure cases and all affected tests. Independent review and CI before merge.
4. Hand the exact tested merge to the sole parked Claude producer; no separate production run.

Status: implementation and independent review in progress. Native and existing quarter-scale preview settings are preserved through one continuous encoder. 304 Python tests and the original 21 JS tests passed; preview and transactional-publication regressions are being added. Real-scene verification runs as a dedicated PR CI job because this local browser receives SIGTERM during composition selection. The source-bound proof intentionally remains absent until real scene equivalence passes. No production edits, captures or reservations.
