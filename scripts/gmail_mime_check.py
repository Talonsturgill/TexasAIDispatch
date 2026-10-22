"""Verify retained Gmail FULL/RAW bytes against the delivered email and attachments."""
import argparse
import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from email import policy
from email.parser import BytesParser
from email.utils import getaddresses
from pathlib import Path

from music_credit_payload import problems as music_problems
from shipment_check import draft_problems, visible_text


def bound(path):
    path = Path(path).resolve()
    return {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def message_data(path, draft_id):
    data = json.loads(Path(path).read_text())
    if not isinstance(data, dict) or data.get("isError"):
        raise ValueError("Gmail input must be an actual successful message object")
    data = data.get("structuredContent", data)
    if isinstance(data, dict) and "message" in data:
        if data.get("draft_id", data.get("id")) != draft_id:
            raise ValueError("Gmail draft envelope identifies another draft")
        data = data["message"]
    if not isinstance(data, dict) or not data.get("id"):
        raise ValueError("Gmail input has no actual message identity")
    return data


def verify(full_path, raw_path, draft_id, run, routing_path):
    run = Path(run)
    record = {"schema": "dispatch_private_gmail_mime_verification/1",
              "verified_at": datetime.now(timezone.utc).isoformat(), "run_id": run.name,
              "draft_id": draft_id, "attachments": []}
    errors, envelope = [], None
    try:
        if not str(draft_id).strip():
            raise ValueError("Use the draft ID returned by actual creation or listing")
        full, raw = (message_data(p, draft_id) for p in (full_path, raw_path))
        routing = json.loads(Path(routing_path).read_text())
        if routing.get("run_id") != run.name:
            raise ValueError("Configured delivery routing belongs to another edition")
        expected = (run / "email.md").read_text()
        subject, recipient = expected.splitlines()[0].strip(), routing["recipient"]
        envelope = {"draft_id": draft_id, "message": full}
        record.update(message_id=full["id"], full=bound(full_path), raw=bound(raw_path),
                      email=bound(run / "email.md"), routing=bound(routing_path))
        errors += draft_problems(envelope, recipient, expected)
        errors += music_problems(run / "email.md", run.name)
        if full["id"] != raw["id"]:
            errors.append("FULL and RAW message identities differ")
        for data in (full, raw):
            labels = data.get("label_ids", data.get("labelIds", []))
            if "DRAFT" not in labels or any(str(x).startswith("SENT") for x in labels):
                errors.append("Actual labels do not prove an unsent DRAFT")
        subjects = [h["value"] for h in full["payload"]["headers"]
                    if h.get("name", "").lower() == "subject"]
        if subjects != [subject]:
            errors.append("FULL subject differs from the committed title")
        encoded = raw["raw"]
        message_bytes = base64.b64decode(encoded + "=" * (-len(encoded) % 4),
                                       altchars=b"-_", validate=True)
        message = BytesParser(policy=policy.default).parsebytes(message_bytes)
        record.update(actual_rfc2822_bytes=len(message_bytes),
                      rfc2822_sha256=hashlib.sha256(message_bytes).hexdigest())
        if [str(s) for s in message.get_all("Subject", [])] != [subject]:
            errors.append("RAW subject differs from the committed title")
        addresses = [addr.lower() for _, addr in getaddresses(message.get_all("To", []))]
        if addresses != [recipient.lower()] or any(
                str(v).strip() for k in ("Cc", "Bcc") for v in message.get_all(k, [])):
            errors.append("RAW recipients differ from configured delivery routing")
        expected_files = {"dispatch-720.mp4": "video/mp4", "poster.png": "image/png"}
        bodies = []
        for part in message.walk():
            if part.is_multipart():
                continue
            payload = part.get_payload(decode=True) or b""
            filename = part.get_filename()
            if part.get_content_disposition() == "attachment" or filename:
                record["attachments"].append({"filename": filename,
                    "mime_type": part.get_content_type(), "bytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest()})
                if filename not in expected_files:
                    errors.append("Unexpected RAW attachment")
                elif (part.get_content_type() != expected_files[filename]
                      or payload != (run / filename).read_bytes()):
                    errors.append("RAW attachment differs from final file: " + filename)
            elif part.get_content_type() in ("text/plain", "text/html"):
                body = payload.decode(part.get_content_charset() or "utf-8")
                bodies.append(visible_text(body) if part.get_content_type() == "text/html" else body)
        if any(part.defects for part in message.walk()):
            errors.append("RAW MIME is malformed or truncated")
        if sorted(row["filename"] or "" for row in record["attachments"]) != sorted(expected_files):
            errors.append("RAW needs exactly the final phone and poster attachments")
        if not bodies or any(" ".join(body.split()) != " ".join(expected.split()) for body in bodies):
            errors.append("RAW visible body differs from the committed email")
    except (OSError, ValueError, KeyError, TypeError, IndexError, AttributeError, LookupError) as exc:
        errors.append("Gmail evidence unavailable or invalid: " + str(exc))
    record.update({"pass": not errors, "problems": errors})
    return record, envelope


def write_private(path, data):
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as out:
        os.fchmod(out.fileno(), 0o600)
        out.write(json.dumps(data, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("full", "raw", "run", "routing", "out"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--draft-id", required=True)
    parser.add_argument("--readback", type=Path,
                        help="write the shipment draft-id/message envelope only on success")
    args = parser.parse_args()
    protected = {p.resolve() for p in (args.full, args.raw, args.routing,
                 args.run / "email.md", args.run / "mix.json",
                 args.run / "dispatch-720.mp4", args.run / "poster.png")}
    outputs = [p.resolve() for p in (args.out, args.readback) if p is not None]
    if protected.intersection(outputs) or len(outputs) != len(set(outputs)):
        parser.error("Derived output paths must not overwrite input evidence or each other")
    record, envelope = verify(args.full, args.raw, args.draft_id, args.run, args.routing)
    write_private(args.out, record)
    if record["pass"] and args.readback:
        write_private(args.readback, envelope)
    print(json.dumps({"pass": record["pass"], "problems": record["problems"]}))
    return int(not record["pass"])


if __name__ == "__main__":
    raise SystemExit(main())
