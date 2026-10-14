"""Export an explicitly derived ledger without publishing private owner messages."""
import copy
import hashlib
import json
import os
import re


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def export(state):
    from repair_guard import envelope_digest, owner_grant_problems
    if owner_grant_problems(state):
        raise ValueError('private owner grant audit failed before public export')
    result = copy.deepcopy(state)
    previous = None
    redactions = []
    for index, grant in enumerate(result['events']):
        if grant.get('kind') != 'owner_review_grant':
            continue
        original = grant['authorization_json']
        authorization = json.loads(original)
        redactions.append({'event_index': index, 'original_event_sha256': envelope_digest(grant),
                           'original_authorization_sha256': sha(original),
                           'owner_text_sha256': sha(authorization['owner_text']),
                           'source_reference_sha256': sha(authorization['source_message_reference'])})
        authorization['owner_text'] = ('Owner approved exactly ' + str(grant['additional_calls'])
                                      + ' additional storyboard critic calls for this edition. '
                                      'Private instruction retained locally with its original digest.')
        authorization['source_message_reference'] = 'private-source-sha256:' + sha(authorization['source_message_reference'])
        authorization['approval_id'] = 'private-approval-sha256:' + sha(authorization['approval_id'])
        if previous is not None:
            authorization['previous_grant_sha256'] = envelope_digest(previous)
        grant['authorization_json'] = json.dumps(authorization, sort_keys=True)
        grant['authorization_sha256'] = sha(grant['authorization_json'])
        grant['approval_id'] = authorization['approval_id']
        previous = grant
    result['public_export'] = {'schema': 'dispatch_public_ledger/1',
        'original_private_state_sha256': envelope_digest(state),
        'description': 'Derived public account. Usage, frozen envelope, increments and verdicts are unchanged. Private owner message fields are represented by digests and an operator attestation.',
        'owner_message_redactions': redactions}
    if owner_grant_problems(result):
        raise ValueError('public grant amounts or audit chain changed')
    return result


ABSOLUTE_PATH = re.compile(r"(?<![\w.~/:-])/(?:home|root|Users|tmp|var|mnt|opt|private)/[^\s\"'<>]+")
CHARGE_BLOCKS = ('usage', 'resource_envelope', 'limits', 'escalations', 'escalation_ceiling')


def private_values(obj, private=False, key_pattern=None):
    """Every string of 8 or more characters that sits under a private key, so the output can be swept for it."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield from private_values(value, private or bool(key_pattern.search(str(key))), key_pattern)
    elif isinstance(obj, list):
        for value in obj:
            yield from private_values(value, private, key_pattern)
    elif private and isinstance(obj, str) and len(obj) >= 8:
        yield obj


def sanitized_export(state, root):
    """The canonical public export: the derived account, then the project's own sanitizer, then three refusals.

    claude_checkpoint.public_ledger runs export() above and then replaces local paths with a token and turns
    shipped Gmail identifiers, routing and receipts and every address into digests. It imports this module
    lazily for export(), so this call is not recursive. The private state is only read.

    The sanitizer works on key names and addresses, so the export fails closed on what it can't see. It refuses
    credential-shaped text exactly as a checkpoint does, any value that sat under a private key and survives
    under a neutral one, and any absolute local path. It also refuses to publish if the sanitizer altered a
    charge block, because a key that merely contains a private word would otherwise be replaced by a digest.
    """
    import claude_checkpoint as c
    text = c.ledger_text(state, root)
    if c.SECRET_TEXT.search(text) or any(v in text for v in c.credential_values(os.environ)):
        raise ValueError('public export refused: credential-shaped content in the ledger')
    for value in set(private_values(state, False, c.PRIVATE_KEY)):
        if value in text:
            raise ValueError('public export refused: a value held under a private key survived under a neutral one')
    found = ABSOLUTE_PATH.search(text)
    if found:
        raise ValueError('public export refused: an absolute local path survived: ' + found.group(0)[:40])
    public = json.loads(text)
    for block in CHARGE_BLOCKS:
        if block in state and json.dumps(c.expand(public.get(block), str(root)), sort_keys=True) != json.dumps(state[block], sort_keys=True):
            raise ValueError('public export refused: the sanitizer altered ' + block)
    if [e.get('kind') for e in public.get('events', [])] != [e.get('kind') for e in state.get('events', [])]:
        raise ValueError('public export refused: the sanitizer altered the event record')
    return text


def default_root(state_path, repo):
    """The checkout a state file belongs to, so its absolute paths are the ones replaced."""
    parts = state_path.resolve().parts
    if len(parts) >= 3 and parts[-3:-1] == ('out', 'dispatch'):
        return state_path.resolve().parents[2]
    return repo


def main(argv=None):
    import argparse
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--root', type=Path, default=None,
                        help='checkout whose absolute paths are replaced, default the one holding the state')
    args = parser.parse_args(argv)
    if args.state.resolve() == args.out.resolve() or (
            args.out.exists() and os.path.samefile(args.state, args.out)):
        raise SystemExit('Public export must never overwrite the private ledger')
    root = args.root or default_root(args.state, Path(__file__).resolve().parents[1])
    try:
        text = sanitized_export(json.loads(args.state.read_text()), root)
    except ValueError as exc:
        raise SystemExit(str(exc))
    args.out.write_text(text)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
