# Operation storage estimates

The lower admission profiles are estimates of the canonical operation, not universal
filesystem hard caps. Unknown commands, aliases, shell programs, redirected or
symlinked paths, unsupported templates and stale source proofs keep legacy admission.
Native video remains PNG at CRF16. The preflight remains 270 by 480 JPEG at CRF32.
The existing five GiB reserve is unchanged.

The model accounts for new bytes, not existing retained files already reflected in
free space. It includes the bounded frame batch, newly retained films and sheets,
scene and attention sheets, paired place stills, feed composites, report/log allowance,
and public/source bundle copies. Cinema proof counts the staging, cache and final or
failed still copies that coexist, plus silent and mixed video copies and PCM.
Both opening boards are counted. Native motion review now uses the existing in-memory
PNG byte cap and remaining-output space check used by phone review, without changing
sample coverage or exact decoded pixels.

For checkpointed editions the model reads the existing public bundle without saving
it. Distinct logical bytes plus projected new evidence are rounded up in 64 MiB
buckets, bounded by the existing 1280 MiB checkpoint limit. It also allows one full
incoming checkpoint package. Both local and incoming packages are counted again for
a possible Git repack, along with a copy of the measured shared Git object store,
rounded up to a GiB. This uses the Git common directory rather than the tiny worktree
Git pointer. External object stores and symbolic paths are not admitted. Per-file
95 MiB limits, private-data checks, monotonic history, remote readback, failure flags
and recovery behavior are unchanged.

This cannot bound arbitrary external history growth, concurrent unrelated disk users,
or arbitrary compiler output amplification. The five GiB reserve covers metadata and
incidental tool output. Source and current free space are rechecked at authorization
and execution. The renderer rechecks remaining space between batches and the decoder
before each page. A real checkpoint failure still stops paid work and retains the
unbacked flag. These estimates are not permission to delete evidence, reset a charge,
increase a budget, skip a gate, or claim a completed production run.

Verification includes negative canonical-command and source-mutation fixtures, both
opening boards, real native and phone decoded-pixel equality, an incompressible maximum
sheet, local checkpoint deduplication/fetch/repack, and a real checkpointed prepare,
consume and claim sequence with exactly one charge. Unit fixtures are synthetic and
never admission proofs. CI must exercise the final source closure before the committed
bounded renderer and contact-sheet proofs are refreshed.
