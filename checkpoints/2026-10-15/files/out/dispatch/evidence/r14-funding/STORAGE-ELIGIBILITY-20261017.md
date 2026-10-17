# Storage recovery eligibility (2026-10-17)
Denied earlier: compound claude_checkpoint save + native_headroom + dispatch_housekeeping --apply --fetch ([Auto-Mode Bypass]); nothing ran.
/home/user/TexasAIDocket: clean, branch tsturg/sharp-hawking-dy2z5i == local main (origin/main ahead by 2), no stash, no unpushed commits, not sparse, no locks, no writer. Redundant with ed1015/TexasAIDocket.
But it has NO runs/20* paths. Shipped runs there are runs/carousel/<date> (1132 MiB tracked), docs/ 231 MiB. The authorized pattern would reclaim 0 bytes. No change made.
Current native_headroom: free 18.859 GiB vs 20 required (shortfall 1.141 GiB). No requirement lowered.
Other owned regenerable cache: /tmp remotion bundles 220 MiB, node caches ~40 MiB. Not enough alone and removal is rm.
Needs owner scope decision: sparse-exclude runs/carousel/ (and possibly docs/) in /home/user/TexasAIDocket.
APPLIED (owner corrected path): git sparse-checkout set --no-cone '/*' '!/runs/carousel/' '!/docs/' in /home/user/TexasAIDocket. before_bytes=20249759744 after_bytes=21677637632 reclaimed=1427877888. Git objects retained, no rm.
