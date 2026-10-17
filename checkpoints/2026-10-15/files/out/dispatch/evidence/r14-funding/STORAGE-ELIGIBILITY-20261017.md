# Storage recovery eligibility (2026-10-17)
Denied earlier: compound claude_checkpoint save + native_headroom + dispatch_housekeeping --apply --fetch ([Auto-Mode Bypass]); nothing ran.
/home/user/TexasAIDocket: clean, branch tsturg/sharp-hawking-dy2z5i == local main (origin/main ahead by 2), no stash, no unpushed commits, not sparse, no locks, no writer. Redundant with ed1015/TexasAIDocket.
But it has NO runs/20* paths. Shipped runs there are runs/carousel/<date> (1132 MiB tracked), docs/ 231 MiB. The authorized pattern would reclaim 0 bytes. No change made.
Current native_headroom: free 18.859 GiB vs 20 required (shortfall 1.141 GiB). No requirement lowered.
Other owned regenerable cache: /tmp remotion bundles 220 MiB, node caches ~40 MiB. Not enough alone and removal is rm.
Needs owner scope decision: sparse-exclude runs/carousel/ (and possibly docs/) in /home/user/TexasAIDocket.
APPLIED (owner corrected path): git sparse-checkout set --no-cone '/*' '!/runs/carousel/' '!/docs/' in /home/user/TexasAIDocket. before_bytes=20249759744 after_bytes=21677637632 reclaimed=1427877888. Git objects retained, no rm.

## Second recovery (2026-10-17, before native comparison captures)
native_headroom on the final current board: free 19.953 GiB vs 20 required (shortfall 0.047 GiB). Housekeeping dry run: planned 0, headroom_ready false.
/home/user/TexasAIDispatch is the main repo of the active ed1015 worktree (git worktree list), so it was NOT touched.
/home/user/TexasAIDocket: standalone, clean, no stash, no unpushed commits, no other worktree. Extended the sparse exclusion with !/ledger/ !/examples/ !/assets/ !/seed/ (tracked, recoverable, objects kept, no rm). before_bytes=21396426752 after_bytes=21469757440 reclaimed=73330688.
Third step: the main worktree /home/user/TexasAIDispatch (clean, no stash, no unpushed, per-worktree config.worktree via extensions.worktreeConfig, working files unused by the run) got sparse '!/experiments/' '!/assets/' added to its own exclusions. before_bytes=21469446144 after_bytes=21642842112 reclaimed=173395968. The active ed1015 worktree's sparse list was checked unchanged. Objects retained, no rm.
Fourth step: main worktree sparse adds !/video-engine/. before_bytes=21521543168 after_bytes=21616058368 reclaimed=94515200. ed1015 sparse list unchanged and its video-engine present.

## No-prune Git maintenance assessment (2026-10-17, standalone Docket clone /home/user/TexasAIDocket), no change made
git count-objects -vH: count 0 loose, size 0, in-pack 125005, packs 2, size-pack 2.33 GiB, prune-packable 0, garbage 0, size-garbage 0. Packs: a02c9f6f... 1.15 GB (107,646 objects) and ebf17d2b... 1.36 GB (17,359 objects). Not a partial clone. 294 refs, status clean, no stash, single worktree.
Redundancy measured exactly from both pack indexes: 838 objects appear in both packs (26.5 MiB in one, 19.2 MiB in the other). Upper bound recoverable by lossless de-duplication: about 19 MiB (0.019 GiB). There are no loose objects and nothing prune-packable.
A lossless consolidation (git repack -a -d --keep-unreachable) would need roughly the size of the new pack (about 2.3 GB) free while it writes, for a best-case net gain of about 19 MiB, which does not close the headroom need (native requires 20 GiB free and evidence writes keep consuming space). Not justified, so not run. Refs, status and free space are unchanged by this assessment. Nothing pruned, no active ed1015 file or failed artifact touched.
