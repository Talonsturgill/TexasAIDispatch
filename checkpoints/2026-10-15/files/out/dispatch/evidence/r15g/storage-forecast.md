# Checkpoint storage forecast for the MUSIC end-card correction (read-only, 2026-10-17)

## Measured now (claude_checkpoint.candidates + stored_bytes, no write)
- 3,441 required files, 933,474,084 bytes. Cap MAX_TOTAL 943,718,400. Headroom 10,244,316 bytes (9.8 MiB). Zero retention problems.
- Largest groups: evidence/r13-opening-binding-refusal 114 MB, evidence/r15f 72 MB, openings-pre-r10 comparison 65 MB, evidence/r15-repair 60 MB, openings/motion-a and motion-b 68 MB, music_bed.wav 34 MB.
- Host disk: about 20 GiB free after the move, native_headroom 20.0 required.

## What the correction adds, with the old failed film and its evidence kept
Per the owner: preserve the last playable native film, every failed review and every original refusal.
- New native film.mp4: about 22 MB. The ab7058ff film stays as retained evidence.
- Controller deliverable snapshot of the new film: about 21 MB (the existing one is deliverables/ab7058ff...).
- silent.mp4 re-render: about 20 MB (the old copy would be kept if it must be retained).
- New exact-film motion-image sequence for the new film: about 38 MB (current motion-review is 38.2 MB and stays).
- New timed phone preview, hero proof reuse or refresh, three audiovisual lenses, scorer packets and responses, panel rounds, delivery and shipment receipts: roughly 10 to 15 MB.
- Estimated added retained payload: about 111 to 116 MB.

## Result
Estimated total about 1.04 to 1.05 GB against a 943.7 MB cap. That is roughly 100 to 105 MB over the cap even after the 35.7 MB move, because the old film, its snapshot and its motion sequence must stay as failed evidence.

Without a capacity change the first save after the new render will be refused again and every paid review stops. None of this is a model budget: the frozen envelope, charges and usage are unchanged.

## Options that retain all evidence (no decision made here)
1. A storage-capacity source repair to the application cap in claude_checkpoint.py with its own regression test and normal exact-head and main CI. The owner's standing instruction authorizes a repair of this kind provided evidence, credential, monotonic, usage and frozen-envelope guards and native quality settings stay. The earlier commit of this change was refused by the platform before that instruction.
2. Future-only: root's PR198 stops retaining a second copy of each cinema artifact, which would have saved about 36 MB on this edition.
3. Neither lowers native 1080x1920, PNG capture or CRF 16.

## Cap source repair request refused again (2026-10-17)
Requested transparently under the owner standing instruction for a storage-capacity source repair that keeps all guards. The commit of the MAX_TOTAL change in /home/user/fix-ck was refused by the platform, reason Auto-Mode Bypass. Not retried. Change remains uncommitted there.
