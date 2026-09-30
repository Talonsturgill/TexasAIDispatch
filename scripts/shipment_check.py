"""Verify shipment against current remote evidence, then retain a closure receipt.

Input manifest paths name raw Gmail readback and Computer Use observations, not
handwritten pass flags. This checker fetches GitHub and public media itself.
"""
import base64
import hashlib
import json
import re
import subprocess
from email.utils import getaddresses
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

from run_controller import digest, load_json, now
from live_check import fetch, site_url, entry_problems, media_problems


def gh(endpoint):
    return json.loads(subprocess.check_output(
        ["gh", "api", endpoint], text=True, timeout=60))


def merged_pr(url, repository):
    match = re.fullmatch(r"https://github.com/" + re.escape(repository) + r"/pull/(\d+)", url)
    if not match:
        raise ValueError(f"expected a pull request in {repository}")
    pr = gh(f"repos/{repository}/pulls/{match[1]}")
    if not pr.get("merged"):
        raise ValueError(f"PR has not merged: {url}")
    head = pr["head"]["sha"]
    rows = green_checks(repository, head)
    return {"url": url, "head_sha": head, "merge_sha": pr["merge_commit_sha"],
            "checks": rows}


def green_checks(repository, head, *, aggregate=False):
    checks = gh(f"repos/{repository}/commits/{head}/check-runs?per_page=100")
    rows = checks.get("check_runs", [])
    if (not rows or checks.get("total_count", 0) != len(rows)
            or not any(c.get("conclusion") == "success" for c in rows)
            or any(c.get("status") != "completed" or c.get("conclusion") not in
                   {"success", "skipped", "neutral"} for c in rows)):
        raise ValueError(f"exact PR head CI is not green: {head}")
    if aggregate and not any(c.get("name") == "guards" and
                             c.get("conclusion") == "success" for c in rows):
        raise ValueError(f"deployment head has no successful aggregate guards: {head}")
    return rows


def committed_feed(head):
    raw = gh(f"repos/Talonsturgill/TexasAIDocket/contents/docs/videos/videos.json?ref={head}")
    if raw.get("encoding") != "base64" or raw.get("type") != "file":
        raise ValueError("committed feed content is missing or truncated")
    body = base64.b64decode(raw.get("content", ""))
    blob = hashlib.sha1(f"blob {len(body)}\0".encode() + body).hexdigest()
    if raw.get("size") != len(body) or raw.get("sha") != blob:
        raise ValueError("committed feed bytes do not match their Git blob")
    return body, {"commit_sha": head, "blob_sha": blob,
                  "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body)}


def deployment_binding(deploy, run_id, feed_pr):
    repo = "Talonsturgill/TexasAIDocket"
    head, merged = deploy.get("head_sha"), feed_pr["merge_sha"]
    if (deploy.get("status") != "completed" or deploy.get("conclusion") != "success"
            or "pages" not in (deploy.get("name", "") + deploy.get("path", "")).lower()):
        raise ValueError("Pages deployment workflow is not successful")
    jobs = gh(f"repos/{repo}/actions/runs/{run_id}/jobs?per_page=100")
    rows = jobs.get("jobs", [])
    if (not rows or jobs.get("total_count", 0) != len(rows)
            or any(j.get("status") != "completed" or j.get("conclusion") not in
                   {"success", "skipped", "neutral"} for j in rows) or
            not any(j.get("name") == "deploy" and j.get("status") == "completed"
                    and j.get("conclusion") == "success" for j in rows)):
        raise ValueError("Pages deploy job did not succeed or job evidence is truncated")
    ancestry = {"status": "identical", "merge_sha": merged, "deployment_sha": head}
    if head != merged:
        if not all(re.fullmatch(r"[0-9a-f]{40}", str(x)) for x in (head, merged)):
            raise ValueError("deployment commit is not the feed merge or a verifiable descendant")
        compare = gh(f"repos/{repo}/compare/{merged}...{head}")
        commits = compare.get("commits", [])
        if (compare.get("status") != "ahead" or compare.get("behind_by") != 0
                or compare.get("base_commit", {}).get("sha") != merged
                or compare.get("merge_base_commit", {}).get("sha") != merged
                or not commits or compare.get("total_commits") != len(commits)
                or commits[-1].get("sha") != head):
            raise ValueError("Pages commit ancestry is unrelated, stale or truncated")
        ancestry = {"status": "ahead", "merge_sha": merged, "deployment_sha": head,
                    "merge_base_sha": merged, "commits": [c["sha"] for c in commits]}
    checks = green_checks(repo, head, aggregate=True)
    original, original_proof = committed_feed(feed_pr["head_sha"])
    deployed, deployed_proof = committed_feed(head)
    if original != deployed:
        raise ValueError("deployment commit changed the reviewed feed bytes")
    return json.loads(original), {"ancestry": ancestry, "checks": checks,
                                  "jobs": rows, "reviewed_feed": original_proof,
                                  "deployed_feed": deployed_proof}


def bound_file(item):
    p = Path(item["path"])
    if not p.is_file() or digest(p) != item["sha256"]:
        raise ValueError(f"evidence file is missing or changed: {p}")
    return p


class BodyText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []

    def handle_data(self, data):
        self.text.append(data)

    def handle_starttag(self, tag, attrs):
        if tag in {"p", "br", "div", "li", "pre"}:
            self.text.append("\n")


def text_parts(payload):
    parts = []
    mime = payload.get("mimeType", payload.get("mime_type"))
    body = payload.get("body") or {}
    content = body.get("content")
    raw = body.get("data") or body.get("base64_url_content")
    if content is None and raw:
        content = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)).decode()
    if mime in {"text/plain", "text/html"} and content is not None:
        if mime == "text/html":
            parser = BodyText()
            parser.feed(content)
            content = "".join(parser.text)
        parts.append(content)
    for part in payload.get("parts") or []:
        parts += text_parts(part)
    return parts


def draft_problems(raw, expected_to, expected_body):
    # Native API or connector message, retained unchanged inside a draft-id envelope.
    message = raw.get("message", {})
    labels = message.get("labelIds", message.get("label_ids", []))
    errors = []
    if not (raw.get("draft_id") or raw.get("id")) or not message.get("id") or "DRAFT" not in labels or any(
            str(label).startswith("SENT") for label in labels):
        errors.append("Gmail readback must identify an unsent DRAFT message")
    headers = message.get("payload", {}).get("headers", [])
    addresses = [address.lower() for _, address in getaddresses(
        [h["value"] for h in headers if h.get("name", "").lower() == "to"])]
    if addresses != [expected_to.lower()] or "@" not in expected_to:
        errors.append("Gmail recipient differs from the run's configured delivery recipient")
    if any(h.get("name", "").lower() in {"cc", "bcc"} and h.get("value", "").strip()
           for h in headers):
        errors.append("Gmail draft includes an unconfigured additional recipient")
    bodies = text_parts(message.get("payload", {}))
    # HTML and plain MIME alternatives may wrap lines differently. Every visible word
    # must still match the committed email. Keep full raw readback for audit.
    if not bodies or any(" ".join(body.split()) != " ".join(expected_body.split()) for body in bodies):
        errors.append("Gmail readback body differs from the committed email")
    return errors


def playback_problems(raw, url, mobile_url, film_hash):
    errors = []
    if raw.get("url") != url or raw.get("master_sha256") != film_hash:
        errors.append("phone playback evidence belongs to another edition or URL")
    viewport = raw.get("viewport", {})
    if not 300 <= viewport.get("width", 0) <= 430:
        errors.append("Computer Use evidence must use a phone viewport")
    samples = raw.get("samples", [])
    if len(samples) < 2:
        errors.append("phone playback needs before and after observations")
    else:
        for sample in samples:
            if (sample.get("currentSrc") != mobile_url or sample.get("error") is not None
                    or sample.get("readyState", 0) < 2 or sample.get("paused") is not False):
                errors.append("canonical phone video did not play the published rendition")
        if samples[-1].get("currentTime", 0) - samples[0].get("currentTime", 0) < 1:
            errors.append("playback time did not advance")
    if not raw.get("tool") or not raw.get("observed_at"):
        errors.append("retain the Computer Use tool and observation timestamp")
    try:
        shots = raw.get("screenshots", [])
        if not shots:
            raise ValueError("no phone playback screenshot")
        for shot in shots:
            bound_file(shot)
    except (OSError, KeyError, ValueError) as exc:
        errors.append(str(exc))
    return errors


def verify_shipment(state, manifest):
    try:
        data = load_json(manifest)
        film_hash = state["deliverable"]["film_sha256"]
        date = state["run_id"][:10]
        if data.get("run_id") != state["run_id"] or data.get("film_sha256") != film_hash:
            raise ValueError("shipment manifest belongs to another run or film")
        release = merged_pr(data["dispatch_pr"], "Talonsturgill/TexasAIDispatch")
        feed_pr = merged_pr(data["feed_pr"], "Talonsturgill/TexasAIDocket")
        run_id = str(data["deployment_run_id"])
        if not run_id.isdigit():
            raise ValueError("deployment_run_id must be the GitHub Pages run ID")
        deploy = gh(f"repos/Talonsturgill/TexasAIDocket/actions/runs/{run_id}")
        committed, deploy_proof = deployment_binding(deploy, run_id, feed_pr)
        site = site_url()
        status, body, _ = fetch(site + "/videos/videos.json")
        if status != 200:
            raise ValueError("canonical feed fetch failed")
        feed = json.loads(body)
        errors, entry = entry_problems(feed, date, site)
        if errors:
            return {}, errors
        committed_errors, committed_entry = entry_problems(committed, date, site)
        if committed_errors or entry != committed_entry or feed.get("media_base") != committed.get("media_base"):
            raise ValueError("live edition differs from the exact committed feed entry")
        errors = media_problems(entry, feed, site)
        if errors:
            return {}, errors
        def media(key):
            value = entry[key]
            return value if value.startswith("https://") else str(feed.get("media_base") or site).rstrip("/") + "/" + value.lstrip("/")
        master_url, mobile_url = media("video"), media("video_mobile")
        status, master, _ = fetch(master_url, timeout=60)
        if status != 200 or hashlib.sha256(master).hexdigest() != film_hash:
            raise ValueError("permanent master URL does not serve the reviewed film bytes")
        # A live mobile rendition must match the one produced and inspected by this run.
        mobile_path = bound_file(data["mobile"])
        status, mobile, _ = fetch(mobile_url, timeout=60)
        if status != 200 or hashlib.sha256(mobile).hexdigest() != digest(mobile_path):
            raise ValueError("phone rendition differs from the inspected local rendition")
        email = bound_file(data["email"])
        gmail = bound_file(data["gmail_readback"])
        playback = bound_file(data["phone_playback"])
        recipient = data["expected_recipient"]
        # Routing is configured in a retained run input, separate from the observed Gmail To.
        routing = load_json(bound_file(data["delivery_routing"]))
        if routing.get("recipient") != recipient or routing.get("run_id") != state["run_id"]:
            raise ValueError("delivery routing does not match this edition")
        errors = draft_problems(load_json(gmail), recipient, email.read_text())
        errors += playback_problems(load_json(playback), data["live_url"], mobile_url, film_hash)
        parsed = urlparse(data["live_url"])
        if (parsed.scheme != "https" or parsed.netloc != urlparse(site).netloc
                or parsed.path.rstrip("/") != "/videos" or parsed.fragment != entry.get("id")):
            errors.append("playback URL must use the canonical public site")
        if errors:
            return {}, errors
        return {"verified_at": now(), "film_sha256": film_hash,
                "manifest_path": str(manifest.resolve()), "manifest_sha256": digest(manifest),
                "dispatch": release, "feed": feed_pr, "deployment": deploy,
                "deployment_binding": deploy_proof,
                "live_url": data["live_url"], "master_url": master_url,
                "mobile_url": mobile_url,
                "gmail_draft_id": load_json(gmail).get("draft_id") or load_json(gmail)["id"],
                "evidence": {k: data[k] for k in ("email", "gmail_readback", "phone_playback",
                                                "delivery_routing", "mobile")}}, []
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, subprocess.SubprocessError) as exc:
        return {}, [str(exc)]
