cd /home/user/restore/2026-10-15
S=out/dispatch/evidence/sim-take6
set -x
python scripts/mix.py --board $S/storyboard.json --vo out/dispatch/takes-6/take1.wav --sfx $S/sfx_events.json --bed out/dispatch/music_bed.wav --bed-track sincerely --bed-manifest out/dispatch/music_bed.json --bed-gap-db 19.0 --vo-at 0.30 --out $S/mix.wav --cut 65.0 ; echo mix=$?
python scripts/vo_align.py --wav $S/mix.wav --script out/dispatch/vo_script.txt --voice $S/mix_vo.wav --out $S --cuts $S/storyboard.json --clause-boundaries ; echo align=$?
