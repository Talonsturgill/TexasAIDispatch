# Geodata in this folder

## tx-counties.topo.json

The 254 Texas counties, as TopoJSON with five-digit FIPS ids and county names. Copied unchanged
from `TexasAIDocket/assets/geo/tx-counties.topo.json`, which filtered it from
[us-atlas](https://github.com/topojson/us-atlas) 3.0.1, `counties-10m.json`. us-atlas derives
its shapes from the US Census Bureau's cartographic boundary files, which are a public-domain
US Government work. The 10m file is generalised for a 1:10,000,000 map, so a county line here is
right to within a mile or two and is never a survey.

sha256 `5b136fa01e62c27498221b396fd8587af3d83cdd9f966679a511d8c0cb73f29c`

us-atlas is distributed under the ISC licence, reproduced here as it requires:

```
Copyright 2013-2019 Michael Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

## What is deliberately NOT here

TPWD's Gould ecoregion polygons. `config/county_regions.json` is computed from them by
`scripts/county_regions.py`, and the table records the download URL and the file's sha256 so
the computation can be repeated byte for byte. TPWD publishes the layer for download with no
access constraint but states no licence for redistribution, so the polygons stay with TPWD. CI
fetches the file from TPWD, refuses it unless its sha256 is the one the table records, and
rebuilds the table from it (`county_regions.py --check`). The runner's cache keeps that copy
between runs and never enters the repository.
