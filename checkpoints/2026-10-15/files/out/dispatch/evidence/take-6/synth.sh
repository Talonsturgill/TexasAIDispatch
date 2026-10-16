cd /home/user/restore/2026-10-15
python scripts/vo_synth_gemini.py --script out/dispatch/vo_script.txt --direction out/dispatch/vo_direction.json --out out/dispatch/takes-6 --takes 1 --run-state out/dispatch/run_state.json; echo synth=$?
python scripts/vo_soundcheck.py --takes out/dispatch/takes-6/takes.json --script out/dispatch/vo_script.txt --cut 60; echo soundcheck=$?
