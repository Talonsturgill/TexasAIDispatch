set -euo pipefail
cd /home/user/restore/2026-10-15
python scripts/mix.py --board out/dispatch/storyboard.json --vo out/dispatch/takes-5/take1.wav --sfx out/dispatch/sfx_events.json --bed out/dispatch/music_bed.wav --bed-track sincerely --bed-manifest out/dispatch/music_bed.json --bed-gap-db 19.0 --vo-at 0.30 --out out/dispatch/mix.wav --cut 61.8
python scripts/vo_align.py --wav out/dispatch/mix.wav --script out/dispatch/vo_script.txt --voice out/dispatch/mix_vo.wav --out out/dispatch --cuts out/dispatch/storyboard.json --clause-boundaries
python scripts/board_captions.py --board out/dispatch/storyboard.json --captions out/dispatch/captions.json
python scripts/board_retime.py --board out/dispatch/storyboard.json --words out/dispatch/words.json --sfx out/dispatch/sfx_events.json
