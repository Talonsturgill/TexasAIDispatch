#!/usr/bin/env python3
"""place_bake.py: render each region's world once, as layers a camera can move through.

WHY THIS EXISTS

Place is the Dispatch's weakest axis, 6.36 on the mean of the last ten report cards, and the
current route drew every film over a flat gradient, so a Harris County story and a Reeves County
story stood in the same nowhere. The region's world is drawn in the Docket's carousel engine
(txthree.js and its kit of true-scale Texas models), which already renders Texas well, by one scene
page per plate under assets/place/scenes/. This script renders each page in headless Chromium and
writes the plate as layers: the SKY, the GROUND, and CARDS for the things standing on it, each at
its own measured distance. PlaceStage moves the ground by the exact perspective transform a camera
move gives a flat ground, and each card by the rate its own distance gives, so a camera move reads
as a camera moving through Texas rather than across a postcard.

It runs when a plate is added or changed, never during a daily run. A run reads only the committed
layers and video-engine/src/modern/placePlates.json, which records for every plate the Docket commit
and engine bytes, the scene's own sha256 and every layer's sha256, so a plate can always be traced
and rebuilt, and a scene edited without a re-bake fails CI.

THE LAYERS ARE RENDERED, NOT CUT OUT OF A PICTURE (assets/place/plate.js says how and why the
ground is one layer). What this script adds is the proof that they are right, measured on every
bake and recorded in the manifest:

  1. REASSEMBLY. Laid over one another at rest, the layers have to give back the picture the engine
     rendered whole, graded the same way. A card drawn without its occluding ground, a dome left in
     the ground or a thing drawn twice shows up here as a difference.
  2. COVER. Every layer is moved as PlaceStage moves it, and the frame is searched below the horizon
     for sky that was not there at rest. That is what an edge of the ground pulled inside the frame
     looks like, which is the limit a near ground puts on a move.
  3. SLIDE. A card moves as one distance and each thing on it stands at its own, so its base slides
     on the ground by the difference. The bake computes that slide for every thing whose base is in
     the frame, and holds it under SLIDE_MAX_PX. The part of a surface that rises above the eye (a
     skyline, a ridge) is a card too, seamed to the ground along the horizon, and its seam points
     are measured the same way.

The largest dolly, truck and rise that pass all three are the plate's LIMITS. PlaceStage moves a
plate only by the profiles in the manifest's `moves`, scaled to a share of those limits, and the
bake checks every profile's ends against the same three tests.

    place_bake.py                                        verify the committed plates (CI)
    place_bake.py --docket ../TexasAIDocket              bake every scene, then verify
    place_bake.py --docket ../TexasAIDocket --only gulf-wide
    place_bake.py --docket D --preview --only gulf-wide  one 1x picture to out/, for iterating
    place_bake.py --self-test                            prove the decoding, the camera and the checks

Exit 0 clean, 1 a check failed, 2 the inputs could not be read.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import io
import itertools
import json
import math
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SCENES = REPO / "assets" / "place" / "scenes"
PLACE_JS = REPO / "assets" / "place"
PUBLIC = REPO / "video-engine" / "public"
OUT_PUBLIC = PUBLIC / "place"
MANIFEST = REPO / "video-engine" / "src" / "modern" / "placePlates.json"
WORK = REPO / "out" / "place-bake"
SCHEMA = "dispatch-place-plates/2"

PLATE_W, PLATE_H = 1242, 2208           # the film's 1080x1920 with 15 percent overscan
FILM_W, FILM_H = 1080, 1920
SS = 2                                  # the backing store's supersampling, box filtered down here
ZMAX = 30000.0                          # plate.js's depth encoding, metres
WEBP_QUALITY = 90
CARD_PAD = 6                            # px of clear margin kept around a card's crop

# REASSEMBLY TOLERANCE, in 8-bit levels over the film frame. Each layer is graded alone, so a pixel
# an edge splits between two layers is graded in two halves and then mixed, where the whole picture
# mixed first and graded once. That differs on edges and only by the curve's bend across one pixel.
REASSEMBLY_MEAN_MAX = 1.5
REASSEMBLY_P999_MAX = 48.0
# COVER. A move may show this share of the frame's ground as sky it did not show at rest: a hair of
# the horizon's antialiased edge sliding. An edge of the ground pulled into the frame is far larger.
SEAM_SHARE_MAX = 0.0004
HORIZON_MARGIN = 6                      # px below the horizon row before ground is counted
# SLIDE. A base may slide on its ground by this much at the move's end, in film pixels.
SLIDE_MAX_PX = 2.0
# A card is never magnified past this by a dolly, so a push stays sharp on a 1x layer.
MAX_LAYER_SCALE = 1.25
# The candidate moves, metres, searched smallest first. A plate's limit is the largest that passes
# in both directions; a plate that can't take the smallest of an axis fails the bake.
STEPS = {"dolly": (0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0),
         "truck": (0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0),
         "rise": (0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5)}
# THE MOVES PlaceStage MAKES, the one copy. Each axis runs from its first multiplier to its second
# over the scene, eased, in units of MOVE_SHARE of the plate's limit on that axis. A dolly only
# pushes in. PlaceStage.tsx reads these from the manifest and has no list of its own.
MOVE_SHARE = 0.6
# WHEN THE STAGE IS ON. Every board dated from the effective date stands in its region, and an older
# board may opt in by naming the version, which is how the proofs re-render past films. Both live in
# the manifest, so PlaceStage.tsx and place_check.py read the one copy.
POLICY = {"version": "place-plates-v2", "effective_date": "2026-10-10"}
PROFILES = {
    "dollyThrough": {"dolly": [0.0, 1.0]},
    "truckAcross": {"truck": [-1.0, 1.0]},
    "riseWith": {"rise": [0.0, 1.0]},
    "craneDown": {"rise": [1.0, 0.0]},
    "orbitReveal": {"truck": [-1.0, 1.0], "dolly": [0.0, 0.35]},
}

CHROMIUM_ARGS = [
    "--allow-file-access-from-files",   # ES modules and fetch from file:// paths
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--enable-unsafe-swiftshader",      # software WebGL where there is no GPU
    "--use-angle=swiftshader",
]
ENGINE_FILES = ("assets/js/three.module.min.js", "assets/js/txthree.js", "assets/js/txkit.js",
                "assets/js/txpost.js")


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


# ---- pictures --------------------------------------------------------------------------------------

def decode_depth(rgba: np.ndarray) -> np.ndarray:
    """plate.js's sixteen-bit log depth (red the high byte, green the low) back to metres."""
    q = rgba[..., 0].astype(np.float64) * 256.0 + rgba[..., 1].astype(np.float64)
    return np.expm1(q / 65535.0 * math.log1p(ZMAX))


def downsample(rgba: np.ndarray, k: int = SS) -> np.ndarray:
    """A box filter over k by k, done on premultiplied colour so an edge keeps its own colour.
    Returns straight RGBA as float in 0..1."""
    h, w = rgba.shape[:2]
    if h % k or w % k:
        raise ValueError("downsample: the picture is not a whole multiple of the filter")
    x = rgba.astype(np.float32) / 255.0
    a = x[..., 3:4]
    pm = np.concatenate([x[..., :3] * a, a], axis=-1).reshape(h // k, k, w // k, k, 4).mean(axis=(1, 3), dtype=np.float64)
    alpha = pm[..., 3:4]
    rgb = np.divide(pm[..., :3], alpha, out=np.zeros_like(pm[..., :3]), where=alpha > 1e-9)
    return np.concatenate([np.clip(rgb, 0, 1), alpha], axis=-1)


def over(layers: list[np.ndarray]) -> np.ndarray:
    """Straight RGBA layers, back to front, composited. Returns RGB and the total alpha."""
    rgb = np.zeros(layers[0].shape[:2] + (3,))
    alpha = np.zeros(layers[0].shape[:2] + (1,))
    for L in layers:
        a = L[..., 3:4]
        rgb = L[..., :3] * a + rgb * (1 - a)
        alpha = a + alpha * (1 - a)
    return np.concatenate([rgb, alpha], axis=-1)


def compose_cards(base: np.ndarray, cards: list[tuple[np.ndarray, tuple[int, int, int, int]]]) -> np.ndarray:
    """A composite (straight RGBA) with each card, far first, laid over it from its own crop."""
    out = base.copy()
    for crop, (x, y, w, h) in cards:
        region = out[y:y + h, x:x + w]
        a = crop[..., 3:4]
        rgb = crop[..., :3] * a + region[..., :3] * region[..., 3:4] * (1 - a)
        alpha = a + region[..., 3:4] * (1 - a)
        region[..., :3] = np.divide(rgb, alpha, out=np.zeros_like(rgb), where=alpha > 1e-9)
        region[..., 3:4] = alpha
    return out


def film_crop(img: np.ndarray) -> np.ndarray:
    y0, x0 = (img.shape[0] - FILM_H) // 2, (img.shape[1] - FILM_W) // 2
    return img[y0:y0 + FILM_H, x0:x0 + FILM_W]


def reassembly(layers: list[np.ndarray], whole: np.ndarray) -> dict:
    """How far the layers at rest are from the whole picture, in 8-bit levels over the film frame."""
    return reassembly_of(over(layers), whole)


def reassembly_of(built: np.ndarray, whole: np.ndarray) -> dict:
    diff = np.abs(film_crop(built)[..., :3] - film_crop(whole)[..., :3]).max(axis=-1) * 255.0
    return {"mean": round(float(diff.mean()), 3), "p999": round(float(np.percentile(diff, 99.9)), 2)}


def crop_box(alpha: np.ndarray, pad: int = CARD_PAD) -> tuple[int, int, int, int] | None:
    """The smallest box holding every pixel a card draws, with a clear margin, as x, y, w, h."""
    ys, xs = np.nonzero(alpha > 0)
    if not ys.size:
        return None
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(alpha.shape[1], xs.max() + 1 + pad), min(alpha.shape[0], ys.max() + 1 + pad)
    return int(x0), int(y0), int(x1 - x0), int(y1 - y0)


# ---- the camera, the one copy of the arithmetic PlaceStage.tsx repeats ------------------------

def camera_of(cam: dict) -> dict:
    """The plate camera from the engine's report: position, axes, focal length in plate pixels."""
    fpx = (PLATE_H / 2.0) / math.tan(math.radians(cam["fov"]) / 2.0)
    out = {k: [float(v) for v in cam[k]] for k in ("position", "right", "up", "forward")}
    out.update(fov=float(cam["fov"]), fpx=fpx, cx=PLATE_W / 2.0, cy=PLATE_H / 2.0)
    return out


def move_vector(cam: dict, move: dict) -> np.ndarray:
    """A move in the world: truck along the camera's right, rise straight up, dolly along the
    camera's forward laid flat, in metres."""
    r = np.array(cam["right"])
    f = np.array(cam["forward"], dtype=float)
    fh = np.array([f[0], 0.0, f[2]])
    fh = fh / (np.linalg.norm(fh) or 1.0)
    return move.get("truck", 0.0) * r + move.get("rise", 0.0) * np.array([0.0, 1.0, 0.0]) + move.get("dolly", 0.0) * fh


def camera_move(cam: dict, move: dict) -> np.ndarray:
    """The move in camera axes as a picture uses them: x right, y down, z forward."""
    m = move_vector(cam, move)
    return np.array([np.dot(cam["right"], m), -np.dot(cam["up"], m), np.dot(cam["forward"], m)])


def intrinsics(cam: dict) -> np.ndarray:
    return np.array([[cam["fpx"], 0, cam["cx"]], [0, cam["fpx"], cam["cy"]], [0, 0, 1.0]])


def ground_homography(cam: dict, move: dict) -> np.ndarray:
    """Where a pixel of the ground plane y = 0 goes when the camera moves without turning:
    K (I + m n^T / h) K^-1, with m the move and n the ground's normal in camera axes and h the
    camera's height over the ground. Exact for a flat ground."""
    m = camera_move(cam, move)
    n = np.array([cam["right"][1], -cam["up"][1], cam["forward"][1]])
    h = cam["position"][1]
    if h <= 0:
        raise ValueError("the camera stands at or under the ground plane")
    K = intrinsics(cam)
    return K @ (np.eye(3) + np.outer(m, n) / h) @ np.linalg.inv(K)


def card_matrix(cam: dict, depth: float, move: dict) -> np.ndarray:
    """A card at `depth` metres along the axis: it scales about the centre and shifts."""
    m = camera_move(cam, move)
    d = max(depth - m[2], 1e-3)
    s = depth / d
    tx, ty = -cam["fpx"] * m[0] / d, -cam["fpx"] * m[1] / d
    return np.array([[s, 0, (1 - s) * cam["cx"] + tx], [0, s, (1 - s) * cam["cy"] + ty], [0, 0, 1.0]])


def parallax(cam: dict, depth, move: dict, xs: np.ndarray, ys: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Where pixels at `depth` (one distance, or one per pixel) go under a move: card_matrix, vectorised."""
    m = camera_move(cam, move)
    d = np.maximum(np.asarray(depth, dtype=np.float64) - m[2], 1e-3)
    s = np.asarray(depth, dtype=np.float64) / d
    return (s * xs + (1 - s) * cam["cx"] - cam["fpx"] * m[0] / d, s * ys + (1 - s) * cam["cy"] - cam["fpx"] * m[1] / d)


def apply(H: np.ndarray, p) -> np.ndarray:
    v = H @ np.array([p[0], p[1], 1.0])
    return v[:2] / v[2]


def warp(alpha: np.ndarray, H: np.ndarray, size=(PLATE_W, PLATE_H)) -> np.ndarray:
    """An alpha map moved by the forward matrix H (input pixel to output pixel), bilinear."""
    Hi = np.linalg.inv(H)
    Hi = Hi / Hi[2, 2]
    a8 = alpha if alpha.dtype == np.uint8 else np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    im = Image.fromarray(a8, "L")
    out = im.transform(size, Image.Transform.PERSPECTIVE, tuple(Hi.flatten()[:8]),
                       resample=Image.Resampling.BILINEAR, fillcolor=0)
    return np.asarray(out, dtype=np.float64) / 255.0


def sky_on_ground(alphas: list[np.ndarray], horizon_y: float) -> float:
    """Share of the film frame's ground where every layer is clear, so the sky shows through."""
    cover = np.zeros_like(alphas[0])
    for a in alphas:
        cover = a + cover * (1 - a)
    crop = film_crop(cover)
    first = max(0, int(math.ceil(horizon_y + HORIZON_MARGIN)) - (PLATE_H - FILM_H) // 2)
    ground = crop[first:]
    return float(np.mean(ground < 0.5)) if ground.size else 0.0


def in_film(p, margin: float = 0.0) -> bool:
    x0, y0 = (PLATE_W - FILM_W) / 2, (PLATE_H - FILM_H) / 2
    return x0 - margin <= p[0] <= x0 + FILM_W + margin and y0 - margin <= p[1] <= y0 + FILM_H + margin


class Plate:
    """Everything the three checks need: the camera, the ground's alpha, each card's alpha at full
    plate size and its distance, and every thing's base pixel and distance."""

    def __init__(self, cam: dict, horizon_y: float, ground: np.ndarray, cards: list[dict], z1: np.ndarray | None = None):
        self.cam, self.horizon_y, self.ground, self.cards = cam, horizon_y, ground, cards
        self.rest = self.cover_at_rest()
        # A surface's part above the eye is one card over a range of distances: every third pixel of it
        # in the film, at the distance the depth pass measured there, so slide can hold each to its own.
        self.surface_px = []
        x0, y0 = (PLATE_W - FILM_W) / 2, (PLATE_H - FILM_H) / 2
        for c in cards if z1 is not None else []:
            if not c.get("tall"):
                continue
            ys, xs = np.nonzero(c["alpha"][::3, ::3] > 128)
            xs, ys = xs * 3 + c["box"][0], ys * 3 + c["box"][1]
            zs = z1[ys, xs].astype(np.float64)
            keep = ((zs >= 0.9 * c["min"]) & (zs <= 1.1 * c["max"]) & (xs >= x0) & (xs <= x0 + FILM_W)
                    & (ys >= y0) & (ys <= y0 + FILM_H))
            self.surface_px.append((c, xs[keep].astype(np.float64), ys[keep].astype(np.float64), zs[keep]))

    def cover_at_rest(self) -> float:
        return sky_on_ground([warp(self.ground, np.eye(3))] + [
            warp(c["alpha"], np.array([[1, 0, c.get("box", (0, 0))[0]], [0, 1, c.get("box", (0, 0))[1]], [0, 0, 1.0]]))
            for c in self.cards], self.horizon_y)

    def cover(self, move: dict) -> float:
        H = ground_homography(self.cam, move)
        moved = [warp(self.ground, H)]
        for c in self.cards:                 # a card's crop, moved by its matrix after its own offset
            x, y = c.get("box", (0, 0, 0, 0))[:2]
            moved.append(warp(c["alpha"], card_matrix(self.cam, c["depth"], move) @ np.array([[1, 0, x], [0, 1, y], [0, 0, 1.0]])))
        return max(0.0, sky_on_ground(moved, self.horizon_y) - self.rest)

    def slide(self, move: dict) -> float:
        """The largest distance, in pixels, any in-frame base moves away from the ground under it, and
        any pixel of a surface's part above the eye moves away from where its own distance puts it."""
        H = ground_homography(self.cam, move)
        worst = 0.0
        for c in self.cards:
            A = card_matrix(self.cam, c["depth"], move)
            for t in c["things"]:
                if in_film(t["base"]):
                    worst = max(worst, float(np.linalg.norm(apply(H, t["base"]) - apply(A, t["base"]))))
        for c, xs, ys, zs in self.surface_px:
            if len(xs):
                gx, gy = parallax(self.cam, c["depth"], move, xs, ys)
                tx, ty = parallax(self.cam, zs, move, xs, ys)
                worst = max(worst, float(np.hypot(gx - tx, gy - ty).max()))
        return worst

    def scale(self, move: dict) -> float:
        return max([card_matrix(self.cam, c["depth"], move)[0, 0] for c in self.cards] or [1.0])

    def passes(self, move: dict) -> tuple[bool, dict]:
        got = {"cover": round(float(self.cover(move)), 6), "slide_px": round(float(self.slide(move)), 3),
               "scale": round(float(self.scale(move)), 4)}
        return (got["cover"] <= SEAM_SHARE_MAX and got["slide_px"] <= SLIDE_MAX_PX and got["scale"] <= MAX_LAYER_SCALE), got


# The directions each axis moves in. A truck goes either way. A dolly only pushes in and a rise only
# lifts, since every profile below starts or ends at rest and never goes under it: a rise drops the
# ground lower in the frame, and only a camera lowered under its rest would pull the ground's near
# edge up into view.
SIGNS = {"dolly": (1.0,), "truck": (1.0, -1.0), "rise": (1.0,)}


def limits(plate: Plate) -> tuple[dict, dict]:
    """The largest dolly, truck and rise, each alone and in each direction its profiles use, that
    pass cover, slide and scale. Returns the limits and what the limit measured."""
    found, measured = {}, {}
    for axis, steps in STEPS.items():
        best, at = 0.0, None
        for step in steps:
            signs = SIGNS[axis]
            results = [plate.passes({axis: sgn * step}) for sgn in signs]
            if not all(ok for ok, _ in results):
                break
            best, at = step, max((g for _, g in results), key=lambda g: (g["cover"], g["slide_px"]))
        found[axis + "_m"], measured[axis + "_m"] = best, at
    return found, measured


def profile_ends(lim: dict, share: float = MOVE_SHARE, profiles: dict = PROFILES):
    """Every corner of every profile, as the move it is in metres."""
    for name, axes in profiles.items():
        keys = sorted(axes)
        for corner in itertools.product(*[axes[k] for k in keys]):
            yield name, {k: share * lim[k + "_m"] * v for k, v in zip(keys, corner)}


def mean_rgb(img: np.ndarray, mask: np.ndarray) -> list[int]:
    if not mask.any():
        return [0, 0, 0]
    return [int(round(v * 255)) for v in img[..., :3][mask].mean(axis=0)]


# ---- the render --------------------------------------------------------------------------------

def place_imports(html: str) -> list[str]:
    """The modules a scene page imports from assets/place: plate.js always, water.js where there is water."""
    return sorted(set(re.findall(r"@@PLACE@@/([\w.-]+\.js)", html)))


def resolve(scene: Path, docket_assets: Path) -> Path:
    WORK.mkdir(parents=True, exist_ok=True)
    html = scene.read_text(encoding="utf-8")
    html = html.replace("@@ASSETS@@", docket_assets.as_uri()).replace("@@PLACE@@", PLACE_JS.as_uri())
    out = WORK / scene.name
    out.write_text(html, encoding="utf-8")
    return out


def launch(p):
    try:
        return p.chromium.launch(args=CHROMIUM_ARGS)
    except Exception:
        for c in sorted(Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome")):
            try:
                return p.chromium.launch(executable_path=str(c), args=CHROMIUM_ARGS)
            except Exception:
                continue
        raise


def quiet(text: str) -> bool:
    """The engine's console lines that are not faults: its model statistics, and the snapshot's place
    verdict, which it prints on every snapshot of a world and says of itself is not a defect."""
    return "KIT_STATS" in text or "A verdict, not a defect" in text


def render(page_path: Path, hash_: str, timeout_ms: int = 1800000, on_pass=None) -> dict:
    """Load one scene page with a pass hash and read back every canvas it exported. With on_pass,
    each pass is handed over as it is read and not kept, so a plate of fifty cards never holds fifty
    full pictures at once."""
    from playwright.sync_api import sync_playwright
    errors: list[str] = []
    t0 = time.time()
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport={"width": PLATE_W, "height": PLATE_H}, device_scale_factor=1)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and not quiet(m.text) else None)
        page.goto(page_path.as_uri() + hash_, wait_until="load", timeout=timeout_ms)
        page.wait_for_function("() => window.plateResult !== undefined || window.plateFailed !== undefined",
                               timeout=timeout_ms, polling=1000)
        failed = page.evaluate("() => window.plateFailed")
        if failed:
            browser.close()
            raise RuntimeError(f"{page_path.stem}: the page threw: {failed}")
        result = page.evaluate("() => window.plateResult")
        images = {}
        if hash_ == "#layers":
            for name in result["passes"]:
                url = page.evaluate("n => window.plateExport(n)", name)
                rgba = np.asarray(Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGBA"))
                del url
                if on_pass:
                    on_pass(name, rgba)
                else:
                    images[name] = rgba
        else:
            buf = page.locator("#plate").screenshot()
            images["plate"] = np.asarray(Image.open(io.BytesIO(buf)).convert("RGBA"))
        browser.close()
    return {"ms": int((time.time() - t0) * 1000), "errors": errors, "result": result, "images": images}


def docket_commit(docket: Path) -> str:
    try:
        return subprocess.run(["git", "-C", str(docket), "rev-parse", "HEAD"], capture_output=True,
                              text=True, check=True).stdout.strip()
    except Exception:
        return "unknown"


def scene_spec(scene: Path) -> dict:
    """The id, region and county scope out of a scene page's spec. `counties` makes the plate those
    counties' own; `also` lets a board choose it for those counties by name, and never by default."""
    text = scene.read_text(encoding="utf-8")
    spec = text[text.index("const spec"):] if "const spec" in text else text
    region = re.search(r"region:\s*'([a-z_]+)'", spec)
    pid = re.search(r"id:\s*'([a-z0-9-]+)'", spec)
    if not region or not pid:
        raise ValueError(f"{scene.name}: the spec has no id or region")
    lists = {}
    for key in ("counties", "also"):
        m = re.search(key + r":\s*\[([^\]]*)\]", spec.split("world:")[0])
        lists[key] = re.findall(r"'([^']+)'", m.group(1)) if m else []
    return {"id": pid.group(1), "region": region.group(1), **lists}


def save_webp(rgba01: np.ndarray, path: Path, opaque: bool = False) -> Path:
    arr = np.clip(np.round(rgba01 * 255.0), 0, 255).astype(np.uint8)
    im = Image.fromarray(arr, "RGBA")
    (im.convert("RGB") if opaque else im).save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    return path


def bake_one(scene: Path, docket: Path) -> dict:
    spec = scene_spec(scene)
    if spec["id"] != scene.stem:
        raise ValueError(f"{scene.name}: spec id {spec['id']} differs from the file name")
    page = resolve(scene, (docket / "assets").resolve())
    kept: dict = {}

    def on_pass(name: str, rgba: np.ndarray) -> None:
        if name == "depth":
            kept["z1"] = decode_depth(rgba)[::SS, ::SS].astype(np.float32)
        elif name.startswith("card"):
            layer = downsample(rgba).astype(np.float32)
            box = crop_box(layer[..., 3])
            kept[name] = None if box is None else (layer[box[1]:box[1] + box[3], box[0]:box[0] + box[2]].copy(), box)
        else:
            kept[name] = downsample(rgba).astype(np.float32)

    r = render(page, "#layers", on_pass=on_pass)
    res = r["result"]
    if not res or res.get("ok") is False:
        raise RuntimeError(f"{spec['id']}: the engine reported a failed render: {res}")
    cam = camera_of(res["camera"])
    pitch = math.asin(max(-1.0, min(1.0, cam["forward"][1])))
    horizon_y = cam["cy"] + cam["fpx"] * math.tan(pitch)
    sky, ground = kept["sky"], kept["ground"]
    cards = []
    for c in res["cards"]:                                  # far first, as the page drew them
        got = kept.get(c["name"])
        if got is None:
            continue                                        # a card whose things are all out of frame
        crop, box = got
        cards.append({"name": c["name"], "layer": crop, "box": box,
                      "alpha": np.clip(np.round(crop[..., 3] * 255.0), 0, 255).astype(np.uint8),
                      "depth": float(c["depth"]), "min": float(c["min"]), "max": float(c["max"]), "things": c["things"],
                      "tall": c.get("tall")})
    check = reassembly_of(compose_cards(over([sky, ground]), [(c["layer"], c["box"]) for c in cards]), kept["flat"])
    plate = Plate(cam, horizon_y, ground[..., 3], cards, kept["z1"])
    lim, at = limits(plate)
    if not all(lim[k] > 0 for k in ("dolly_m", "truck_m", "rise_m")):
        raise ValueError(f"{spec['id']}: the plate can't take the smallest move: {lim} {at}")
    worst_profile = {"cover": 0.0, "slide_px": 0.0, "scale": 1.0}
    for name, move in profile_ends(lim):
        ok, got = plate.passes(move)
        if not ok:
            raise ValueError(f"{spec['id']}: profile {name} fails at its end {move}: {got}")
        worst_profile = {k: max(worst_profile[k], got[k]) for k in got}
    z1 = kept["z1"]
    whole = kept["full"]
    rows = np.arange(PLATE_H)[:, None] * np.ones((1, PLATE_W))
    out_dir = OUT_PUBLIC / spec["id"]
    if out_dir.exists():
        for old in out_dir.glob("*.webp"):
            old.unlink()
    out_dir.mkdir(parents=True, exist_ok=True)
    entry = lambda f: {"file": f.relative_to(PUBLIC).as_posix(), "sha256": sha256(f), "bytes": f.stat().st_size}
    card_rows = []
    for k, c in enumerate(cards):
        x, y, w, h = c["box"]
        f = save_webp(c["layer"], out_dir / f"card{k:02d}.webp")
        row = dict(entry(f), x=x, y=y, w=w, h=h, depth_m=round(c["depth"], 3),
                   min_m=round(c["min"], 3), max_m=round(c["max"], 3), things=len(c["things"]))
        if c.get("tall"):           # the part of a surface above the eye; its things are seam points on the horizon
            row["tall"] = c["tall"]
        card_rows.append(row)
    poster = WORK / spec["id"] / "full.png"
    poster.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.round(whole[..., :3] * 255), 0, 255).astype(np.uint8), "RGB").save(poster)
    return {
        "id": spec["id"], "region": spec["region"], "counties": spec["counties"], "also": spec["also"],
        "scene": scene.relative_to(REPO).as_posix(), "scene_sha256": sha256(scene),
        "modules": {name: sha256(PLACE_JS / name) for name in place_imports(scene.read_text(encoding="utf-8"))},
        "camera": {k: (round(v, 6) if isinstance(v, float) else [round(x, 6) for x in v]) for k, v in cam.items()},
        "horizon_y": round(horizon_y, 2),
        "sky": entry(save_webp(sky, out_dir / "sky.webp", opaque=True)),
        "ground": entry(save_webp(ground, out_dir / "ground.webp")),
        "cards": card_rows,
        "sky_rgb": mean_rgb(whole, (rows < horizon_y - 40) & (z1 >= 0.6 * ZMAX)),
        "ground_rgb": mean_rgb(whole, rows > horizon_y + 160),
        "limits": lim,
        "checks": {"reassembly_mean": check["mean"], "reassembly_p999": check["p999"], "at_limits": at,
                   "profiles_worst": worst_profile, "surfaces": res.get("surfaces"), "things": res.get("things"),
                   "render_ms": r["ms"], "page_errors": len(r["errors"])},
        "_errors": r["errors"],
    }


# ---- the manifest ------------------------------------------------------------------------------

def load_manifest(path: Path = MANIFEST) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_manifest(plates: dict, docket: Path, path: Path = MANIFEST) -> None:
    old = load_manifest(path) if path.exists() else {}
    merged = dict(old.get("plates", {})) if old.get("schema") == SCHEMA else {}
    # A plate baked before each plate recorded its own modules was baked with the one plate.js the
    # manifest then named for every plate, and imported nothing else from assets/place.
    shared = old.get("engine", {}).get("plate_js_sha256")
    for pid, entry in merged.items():
        if "modules" not in entry and shared:
            merged[pid] = dict(entry, modules={"plate.js": shared})
    merged.update(plates)
    doc = {
        "schema": SCHEMA,
        "_why": ("Each region's world, rendered once in the Docket's carousel engine as a sky, one ground and "
                 "cards for the things standing on it, so PlaceStage can move a camera through Texas. Written "
                 "by scripts/place_bake.py; every number in it was measured on the bake, never typed."),
        "_how": ("The ground moves by the exact homography a camera move gives the plane y = 0; a card moves as "
                 "its depth_m, the geometric mean of its nearest and farthest thing. limits are the largest "
                 "dolly, truck and rise that kept the ground covering the frame, slid no base over "
                 f"{SLIDE_MAX_PX} px and magnified no card past {MAX_LAYER_SCALE}. moves are the only camera "
                 "PlaceStage has, in shares of those limits."),
        "policy": POLICY,
        "moves": {"share": MOVE_SHARE, "profiles": PROFILES},
        "engine": {"docket_commit": docket_commit(docket),
                   "files": {f: sha256(docket / f) for f in ENGINE_FILES if (docket / f).exists()},
                   "kit": {p.name: sha256(p) for p in sorted((docket / "assets/js/kit").glob("*.js"))}},
        "film": {"w": FILM_W, "h": FILM_H}, "plate": {"w": PLATE_W, "h": PLATE_H},
        "plates": {k: merged[k] for k in sorted(merged)},
    }
    path.write_text(json.dumps(doc, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")


def verify(doc: dict, repo: Path = REPO, check_files: bool = True) -> list[str]:
    """Everything a run relies on about the plates, without a browser."""
    errors: list[str] = []
    if doc.get("schema") != SCHEMA:
        return [f"manifest schema is {doc.get('schema')!r}, expected {SCHEMA}"]
    if doc.get("policy") != POLICY:
        errors.append("the manifest's policy differs from place_bake.py's; re-run the bake to write it")
    if doc.get("moves") != {"share": MOVE_SHARE, "profiles": PROFILES}:
        errors.append("the manifest's moves differ from place_bake.py's; re-bake so the bake checked what the film does")
    plates = doc.get("plates") or {}
    if not plates:
        return errors + ["manifest holds no plates"]
    sys.path.insert(0, str(repo / "scripts"))
    import county_regions
    regions = set(county_regions.GOULD_TO_ENGINE.values())
    defaults = {}
    for pid, p in plates.items():
        if not p.get("counties") and not p.get("also"):
            defaults.setdefault(p.get("region"), []).append(pid)
    for region in sorted(regions):
        if len(defaults.get(region, [])) != 1:
            errors.append(f"region {region} needs exactly one plate of its own with no county scope, has "
                          f"{defaults.get(region, [])}: a story in any of its counties stands in it")
    table = json.loads((repo / "config" / "county_regions.json").read_text(encoding="utf-8")) if check_files else None
    owned: dict[tuple[str, str], str] = {}
    for pid, p in plates.items():
        for key in ("counties", "also"):
            for county in p.get(key) or []:
                if table is not None:
                    name, entry = county_regions.find(table, county)
                    if entry is None:
                        errors.append(f"plate {pid}: {county!r} is not a Texas county")
                        continue
                    if p.get("region") not in county_regions.allowed(entry):
                        errors.append(f"plate {pid}: {name} County is not in {p.get('region')}, so its {key} can't list it")
                if key == "counties":
                    k = (p.get("region"), county.lower())
                    if k in owned:
                        errors.append(f"{county} County has two plates of its own in {p.get('region')}: {owned[k]} and {pid}")
                    owned[k] = pid
    for pid, p in plates.items():
        where = f"plate {pid}"
        if p.get("region") not in regions:
            errors.append(f"{where}: region {p.get('region')!r} is not one of the ten")
        scene = repo / p.get("scene", "")
        if check_files:
            if not scene.is_file():
                errors.append(f"{where}: scene {p.get('scene')} is missing")
            elif sha256(scene) != p.get("scene_sha256"):
                errors.append(f"{where}: {p.get('scene')} changed since it was baked; re-bake it")
            else:
                mods = p.get("modules") or {}
                for name in place_imports(scene.read_text(encoding="utf-8")):
                    f = repo / "assets" / "place" / name
                    if name not in mods:
                        errors.append(f"{where}: the bake recorded no hash for assets/place/{name}, which its scene imports")
                    elif not f.is_file() or sha256(f) != mods[name]:
                        errors.append(f"{where}: assets/place/{name} changed since it was baked; re-bake it")
        files = [p.get("sky") or {}, p.get("ground") or {}] + list(p.get("cards") or [])
        for L in files:
            f = repo / "video-engine" / "public" / L.get("file", "")
            if check_files:
                if not f.is_file():
                    errors.append(f"{where}: {L.get('file')} is missing")
                elif sha256(f) != L.get("sha256"):
                    errors.append(f"{where}: {L.get('file')} differs from what was baked")
        depths = [c.get("depth_m") for c in p.get("cards") or []]
        if any(not isinstance(d, (int, float)) or d <= 0 for d in depths) or depths != sorted(depths, reverse=True):
            errors.append(f"{where}: cards must run far to near at positive distances: {depths}")
        for c in p.get("cards") or []:
            if not all(isinstance(c.get(k), int) and c.get(k) >= 0 for k in ("x", "y", "w", "h")) or \
                    c["x"] + c["w"] > PLATE_W or c["y"] + c["h"] > PLATE_H:
                errors.append(f"{where}: card {c.get('file')} lies outside the plate")
        cam = p.get("camera") or {}
        if not (isinstance(cam.get("fpx"), (int, float)) and cam["fpx"] > 0 and len(cam.get("position") or []) == 3
                and cam["position"][1] > 0):
            errors.append(f"{where}: the camera must be measured and stand above the ground")
        lim = p.get("limits") or {}
        if not all(isinstance(lim.get(k), (int, float)) and lim.get(k) > 0 for k in ("dolly_m", "truck_m", "rise_m")):
            errors.append(f"{where}: limits must be measured and positive: {lim}")
        ck = p.get("checks") or {}
        if not (isinstance(ck.get("reassembly_mean"), (int, float)) and ck["reassembly_mean"] <= REASSEMBLY_MEAN_MAX
                and isinstance(ck.get("reassembly_p999"), (int, float)) and ck["reassembly_p999"] <= REASSEMBLY_P999_MAX):
            errors.append(f"{where}: the layers did not reassemble into the picture: {ck.get('reassembly_mean')}")
        worst = ck.get("profiles_worst") or {}
        if not (worst.get("cover", 1) <= SEAM_SHARE_MAX and worst.get("slide_px", 99) <= SLIDE_MAX_PX
                and worst.get("scale", 9) <= MAX_LAYER_SCALE):
            errors.append(f"{where}: a camera profile failed on the bake: {worst}")
        if ck.get("page_errors"):
            errors.append(f"{where}: the engine logged {ck['page_errors']} errors on the bake")
        hy = p.get("horizon_y")
        if not (isinstance(hy, (int, float)) and 0 < hy < PLATE_H):
            errors.append(f"{where}: the horizon must be measured and in the plate")
    return errors


# ---- self-test ---------------------------------------------------------------------------------

def self_test() -> int:
    fails: list[str] = []

    def check(cond, what):
        if not cond:
            fails.append(what)

    # depth codes round-trip to a part in four thousand
    for zm in (0.5, 7.0, 420.0, 9000.0, 27600.0):
        v = math.log1p(zm) / math.log1p(ZMAX)
        q = int(math.floor(v * 65535 + 0.5))
        back = float(decode_depth(np.array([[[q // 256, q % 256, 0, 255]]], dtype=np.uint8))[0, 0])
        check(abs(back - zm) / zm < 3e-4, f"depth {zm} m decoded as {back}")
    # a premultiplied box filter keeps an edge's colour; a straight one would darken it toward black
    edge = np.zeros((2, 2, 4), dtype=np.uint8)
    edge[0, 0] = [200, 100, 50, 255]
    d = downsample(edge)
    check(abs(d[0, 0, 3] - 0.25) < 1e-9 and np.allclose(d[0, 0, :3] * 255, [200, 100, 50]),
          f"edge pixel lost its colour: {d[0, 0]}")

    # A CAMERA 6.5 m up, looking 3 degrees down, and points it projects.
    pitch = math.radians(-3.0)
    fwd = [0.0, math.sin(pitch), -math.cos(pitch)]
    up = [0.0, math.cos(pitch), math.sin(pitch)]
    cam = camera_of({"position": [0.0, 6.5, 0.0], "right": [1.0, 0.0, 0.0], "up": up, "forward": fwd, "fov": 48.0})

    def project(X, C=None):
        C = np.array(C if C is not None else cam["position"])
        v = np.array(X, dtype=float) - C
        x, y, z = np.dot(cam["right"], v), -np.dot(cam["up"], v), np.dot(cam["forward"], v)
        return np.array([cam["cx"] + cam["fpx"] * x / z, cam["cy"] + cam["fpx"] * y / z]), z

    # the homography is exact for ground points under every move, and a card is exact at its depth
    for move in ({"truck": 0.4}, {"rise": 0.7}, {"dolly": 2.5}, {"truck": -0.3, "dolly": 1.0, "rise": 0.2}):
        H = ground_homography(cam, move)
        C2 = np.array(cam["position"]) + move_vector(cam, move)
        for X in ([3.0, 0.0, -20.0], [-12.0, 0.0, -80.0], [40.0, 0.0, -400.0]):
            p0, z0 = project(X)
            p1, _ = project(X, C2)
            check(np.linalg.norm(apply(H, p0) - p1) < 1e-6, f"ground homography off at {X} for {move}")
            Y = [X[0], 5.0, X[2]]                    # a point 5 m up the thing standing there
            q0, zq = project(Y)
            q1, _ = project(Y, C2)
            check(np.linalg.norm(apply(card_matrix(cam, zq, move), q0) - q1) < 1e-6, f"card off at {Y} for {move}")
            check(np.linalg.norm(apply(card_matrix(cam, z0, move), p0) - p1) < 1e-6,
                  f"card at its base's depth misses the base for {move}")
    hy = cam["cy"] + cam["fpx"] * math.tan(pitch)
    check(abs(apply(ground_homography(cam, {"dolly": 3.0}), [500.0, hy])[1] - hy) < 1e-6,
          "the horizon must stay put under a dolly")

    # A SYNTHETIC PLATE: ground below the horizon, one tree card. The cover check sees the ground's
    # bottom edge come up into the frame when the camera rises too far, and the slide check sees a
    # card set at the wrong distance.
    rows = np.arange(PLATE_H)[:, None] * np.ones((1, PLATE_W))
    ground = (rows >= hy).astype(np.float64)
    tree_alpha = np.zeros((PLATE_H, PLATE_W))
    base_px, base_z = project([2.0, 0.0, -30.0])
    top_px, _ = project([2.0, 9.0, -30.0])
    tree_alpha[int(top_px[1]):int(base_px[1]), int(base_px[0]) - 12:int(base_px[0]) + 12] = 1.0
    good = Plate(cam, hy, ground, [{"alpha": tree_alpha, "depth": base_z, "things": [{"base": list(base_px), "depth": base_z}]}])
    ok, got = good.passes({"truck": 0.2})
    check(ok and got["slide_px"] < 1e-6, f"a card at its base's depth slid: {got}")
    wrong = Plate(cam, hy, ground, [{"alpha": tree_alpha, "depth": base_z * 1.6, "things": [{"base": list(base_px), "depth": base_z}]}])
    ok_w, got_w = wrong.passes({"truck": 0.5})
    check(not ok_w and got_w["slide_px"] > SLIDE_MAX_PX, f"a card at the wrong distance did not slide: {got_w}")
    ok_r, got_r = good.passes({"rise": -1.5})
    check(not ok_r and got_r["cover"] > SEAM_SHARE_MAX, f"a camera lowered until the ground's edge shows passed: {got_r}")
    ok_t, got_t = good.passes({"truck": 0.75})
    check(not ok_t and got_t["cover"] > SEAM_SHARE_MAX, f"a truck that pulls the ground's side into frame passed: {got_t}")
    # A RIDGE ABOVE THE EYE: one card at 900 m whose pixels the depth pass puts at 900 m slides nowhere,
    # and the same card over ground the depth pass puts at 250 m is caught, though it has no base at all.
    ridge = np.zeros((PLATE_H, PLATE_W), dtype=np.uint8)
    ridge[int(hy) - 120:int(hy), 300:900] = 255
    box = (0, 0, PLATE_W, PLATE_H)
    for z, should in ((900.0, True), (250.0, False)):
        z1 = np.full((PLATE_H, PLATE_W), z, dtype=np.float32)
        tall = Plate(cam, hy, ground, [{"alpha": ridge, "box": box, "depth": 900.0, "min": min(z, 900.0), "max": max(z, 900.0),
                                        "things": [], "tall": ["mesa"]}], z1)
        ok_s, got_s = tall.passes({"rise": 0.9})
        check(ok_s == should, f"a ridge card at 900 m over ground at {z} m: {got_s}")
    lim, _ = limits(good)
    check(0 < lim["truck_m"] < 0.75 and lim["rise_m"] > 0 and lim["dolly_m"] > 0, f"limits wrong: {lim}")
    check(all(min(rng) >= 0 or min(SIGNS[k]) < 0 for prof in PROFILES.values() for k, rng in prof.items()),
          "a profile moves an axis in a direction its limit was never measured in")
    for name, move in profile_ends(lim):
        ok_p, got_p = good.passes(move)
        check(ok_p, f"profile {name} fails at {move} on a clean plate: {got_p}")
    # reassembly
    sky = np.zeros((PLATE_H, PLATE_W, 4)); sky[..., :3] = [0.6, 0.7, 0.9]; sky[..., 3] = 1
    g = np.zeros((PLATE_H, PLATE_W, 4)); g[..., :3] = [0.4, 0.5, 0.3]; g[..., 3] = ground
    t = np.zeros((PLATE_H, PLATE_W, 4)); t[..., :3] = [0.2, 0.3, 0.1]; t[..., 3] = tree_alpha
    whole = over([sky, g, t])
    check(reassembly([sky, g, t], whole)["mean"] < 1e-9, "identical layers did not reassemble")
    check(reassembly([sky, g], whole)["p999"] > 10, "a missing card reassembled clean")
    check(crop_box(tree_alpha)[2] == 24 + 2 * CARD_PAD, f"card crop wrong: {crop_box(tree_alpha)}")

    # the verifier goes red on a bad manifest
    sys.path.insert(0, str(REPO / "scripts"))
    import county_regions
    good_doc = {"schema": SCHEMA, "engine": {}, "policy": POLICY, "moves": {"share": MOVE_SHARE, "profiles": PROFILES},
                "plates": {}}
    for i, region in enumerate(sorted(set(county_regions.GOULD_TO_ENGINE.values()))):
        good_doc["plates"][f"p{i}"] = {
            "region": region, "scene": "x.html", "scene_sha256": "0" * 64, "horizon_y": 1000.0,
            "camera": {"fpx": 2480.0, "position": [0.0, 6.5, 0.0]},
            "sky": {"file": "a.webp"}, "ground": {"file": "b.webp"},
            "cards": [{"file": "c.webp", "x": 0, "y": 0, "w": 10, "h": 10, "depth_m": dm} for dm in (900.0, 120.0, 25.0)],
            "limits": {"dolly_m": 1.0, "truck_m": 0.3, "rise_m": 0.3},
            "checks": {"reassembly_mean": 0.5, "reassembly_p999": 20.0, "page_errors": 0,
                       "profiles_worst": {"cover": 0.0, "slide_px": 1.0, "scale": 1.1}}}
    for k, (region, counties, also) in enumerate([("gulf", ["Harris"], []), ("gulf", [], ["Harris", "Galveston"])]):
        good_doc["plates"][f"c{k}"] = dict(json.loads(json.dumps(good_doc["plates"]["p0"])), region=region,
                                           counties=counties, also=also)
    check(verify(good_doc, check_files=False) == [], f"a good manifest failed: {verify(good_doc, check_files=False)}")
    for mutate, why in [
        (lambda m: m["plates"].pop("p0"), "a region with no plate"),
        (lambda m: m["plates"]["p1"]["cards"].reverse(), "cards out of order"),
        (lambda m: m["plates"]["p2"]["limits"].update(truck_m=0), "an unmeasured limit"),
        (lambda m: m["plates"]["p3"]["checks"].update(reassembly_mean=9.0), "layers that did not reassemble"),
        (lambda m: m["plates"]["p4"]["checks"]["profiles_worst"].update(slide_px=7.0), "a profile that slid"),
        (lambda m: m["plates"]["p5"]["camera"].update(position=[0.0, -1.0, 0.0]), "a camera under the ground"),
        (lambda m: m["moves"].update(share=0.9), "moves the bake did not check"),
        (lambda m: m["policy"].update(effective_date="2026-01-01"), "a policy the bake did not write"),
        (lambda m: m["plates"]["p6"]["cards"][0].update(x=1240), "a card off the plate"),
        (lambda m: m["plates"]["c0"].update(counties=[]), "a region with two plates of its own"),
        (lambda m: m["plates"].__setitem__("c2", dict(m["plates"]["c0"])), "a county with two plates of its own"),
    ]:
        bad_doc = json.loads(json.dumps(good_doc))
        mutate(bad_doc)
        check(verify(bad_doc, check_files=False), f"the verifier passed {why}")
    if fails:
        print("place_bake self-test FAILED:")
        for f in fails:
            print("  " + f)
        return 1
    print(f"place_bake self-test: ok (truck limit {lim['truck_m']} m on the synthetic plate, "
          f"a misplaced card slid {got_w['slide_px']:.1f} px)")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--docket", type=Path, help="a TexasAIDocket checkout (its assets/js draws the world)")
    ap.add_argument("--only", default="")
    ap.add_argument("--preview", action="store_true", help="one 1x picture per scene to out/, for iterating")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--matrices", action="store_true",
                    help="print every plate's ground and card matrices at every profile's ends, for the engine's parity test")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if a.matrices:
        doc = load_manifest()
        rows = []
        for pid, p in sorted(doc["plates"].items()):
            for name, move in profile_ends(p["limits"], doc["moves"]["share"], doc["moves"]["profiles"]):
                full = {"dolly": 0.0, "truck": 0.0, "rise": 0.0, **move}
                rows.append({"plate": pid, "profile": name, "move": full,
                             "ground": ground_homography(p["camera"], full).flatten().tolist(),
                             "cards": [card_matrix(p["camera"], c["depth_m"], full).flatten().tolist() for c in p["cards"]]})
        print(json.dumps(rows))
        return 0
    if not a.docket:
        if not MANIFEST.exists():
            print(f"place_bake: {MANIFEST.relative_to(REPO)} is missing")
            return 2
        doc = load_manifest()
        errors = verify(doc)
        for e in errors:
            print("FAIL " + e)
        print(f"place_bake: {len(doc.get('plates', {}))} plates, " + ("ok" if not errors else f"{len(errors)} problems"))
        return 1 if errors else 0
    if not (a.docket / "assets" / "js" / "txthree.js").exists():
        print("--docket must be a TexasAIDocket checkout with assets/js/txthree.js")
        return 2
    scenes = sorted(SCENES.glob("*.html"))
    if a.only:
        scenes = [s for s in scenes if s.stem in a.only.split(",")]
    if not scenes:
        print("no scenes matched")
        return 2
    if a.preview:
        assets = (a.docket / "assets").resolve()
        for scene in scenes:
            r = render(resolve(scene, assets), "#preview")
            out = WORK / scene.stem / "preview.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(r["images"]["plate"]).convert("RGB").save(out)
            print(f"{scene.stem}: {r['ms']} ms, errors={len(r['errors'])} -> {out.relative_to(REPO)}")
            for e in r["errors"][:5]:
                print("    " + e[:200])
        return 0
    failed = 0
    for scene in scenes:
        try:
            p = bake_one(scene, a.docket)
        except Exception as exc:                     # one bad scene never costs the others their bake
            print(f"FAIL {scene.stem}: {exc}", flush=True)
            failed += 1
            continue
        errs = p.pop("_errors")
        ck, lim = p["checks"], p["limits"]
        size = (p["sky"]["bytes"] + p["ground"]["bytes"] + sum(c["bytes"] for c in p["cards"])) // 1024
        print(f"{p['id']}: {ck['render_ms']} ms, reassembly {ck['reassembly_mean']} / {ck['reassembly_p999']}, "
              f"{len(p['cards'])} cards ({ck['things']} things), limits {lim}, worst profile {ck['profiles_worst']}, "
              f"{size} KB, errors {len(errs)}", flush=True)
        for e in errs[:5]:
            print("    " + e[:200])
        write_manifest({p["id"]: p}, a.docket)       # each plate lands as it finishes
    errors = verify(load_manifest()) if MANIFEST.exists() else ["no manifest written"]
    for e in errors:
        print("FAIL " + e)
    return 1 if (failed or errors) else 0


if __name__ == "__main__":
    sys.exit(main())
