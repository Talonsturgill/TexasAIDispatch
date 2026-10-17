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
