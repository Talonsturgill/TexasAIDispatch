# Free test of the three whole media-limit requests (PR213 head 6261bd3b, no provider call, no reservation)
Receipts prepared with the full verbatim native partial handbacks and normalized coverage (hash fields only), full prior phone context carried by the packet: panel2/{picture,story,sound}-media-limit-failure.json.
Whole request wire (complete, exact semantic roundtrip verified through decode_shared and fingerprint):
- picture: 575862 chars (extra 75862 over 500000), sha256 e03646607d97b336..., prompt 583804
- story: 557964 chars (extra 57964), sha256 9278bee0d7342694..., prompt 565904
- sound: 569733 chars (extra 69733), sha256 fcce5ec261932957..., prompt 577673
All under the 650000 role maximum; packet_capacity_request validates. run_state.json hash identical before and after; film 1cb1b02a91912bce, board b7d3d14ac139 unchanged. Panel round 2 / scorer calls 6 still reserved; AV reviews 23 (three lenses).
