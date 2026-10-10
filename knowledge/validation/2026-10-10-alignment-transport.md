# Truncated alignment model download, October 10th, 2026

The first Claude cloud bootstrap failed with `Alignment model hash failed; the previous cache was
retained`. The retained partial file was 485,939,276 bytes. The pinned model
(`ggml-small.en.bin`, revision `5359861c739e955e79d9a303bcbc70fb988958b1`) is 487,614,201 bytes.
The cloud proxy ended the stream cleanly 1,674,925 bytes early, so no exception was raised and the
one-shot copy had nothing to resume from.

Repair was transport only. The pinned URL and SHA-256
(`c6138d6d58ecc8322097e0f987c32f1be8bb0a18532a3f88f734d1bbf9c41e5d`) are unchanged. Resuming the
same file with a Range request produced 487,614,201 bytes whose hash matched the pin, and the
bootstrap then completed. `scripts/cloud_bootstrap.py` now does that itself: a short stream is
continued with Range requests, a server that ignores Range restarts the file, a complete file with a
wrong hash is discarded, and nothing replaces the verified cache until the pinned hash matches.
`scripts/cloud_bootstrap_test.py` replays a clean early cut, a server that ignores Range, a corrupt
download and the unchanged pin.

No model, hash, alignment setting, timing or caption rule changed.
