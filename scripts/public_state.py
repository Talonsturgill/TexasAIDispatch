"""Export an explicitly derived ledger without publishing private owner messages."""
import copy
import hashlib
import json
import os
import re


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def export(state):
    from repair_guard import envelope_digest, owner_grant_problems, validator_grant_problems
    if owner_grant_problems(state) or validator_grant_problems(state):
        raise ValueError('private owner grant audit failed before public export')
    result = copy.deepcopy(state)
    retained = {}
    metadata = state.get('public_export') or {}
    for row in metadata.get('owner_message_redactions', []):
        index = row.get('event_index')
        if (type(index) is not int or index in retained
                or any(not re.fullmatch(r'[0-9a-f]{64}', str(row.get(key, '')))
                       for key in ('original_event_sha256', 'original_authorization_sha256',
                                   'owner_text_sha256', 'source_reference_sha256'))):
            raise ValueError('public owner-message provenance is invalid')
        retained[index] = row
    previous = None
    redactions = []
    attestations = set()
    for index, grant in enumerate(result['events']):
        if grant.get('kind') not in {'owner_review_grant', 'owner_validator_grant'}:
            continue
        original = grant['authorization_json']
        authorization = json.loads(original)
        role = 'validator' if grant['kind'] == 'owner_validator_grant' else 'storyboard critic'
        attestation = ('Owner approved exactly ' + str(grant['additional_calls'])
                       + ' additional ' + role + ' calls for this edition. '
                       'Private instruction retained locally with its original digest.')
        if attestation in attestations:
            origin = retained[index]['original_authorization_sha256'] if index in retained else sha(original)
            attestation += ' Authorization digest ' + origin + '.'
        attestations.add(attestation)
        if index in retained:
            if (metadata.get('schema') != 'dispatch_public_ledger/1'
                    or authorization['owner_text'] != attestation
                    or not re.fullmatch(r'private-source-sha256:[0-9a-f]{64}', authorization['source_message_reference'])
                    or not re.fullmatch(r'private-approval-sha256:[0-9a-f]{64}', authorization['approval_id'])):
                raise ValueError('retained public owner attestation changed')
            redactions.append(retained[index])
            if grant['kind'] == 'owner_review_grant':
                previous = grant
            continue
        redactions.append({'event_index': index, 'original_event_sha256': envelope_digest(grant),
                           'original_authorization_sha256': sha(original),
                           'owner_text_sha256': sha(authorization['owner_text']),
                           'source_reference_sha256': sha(authorization['source_message_reference'])})
        authorization['owner_text'] = attestation
        authorization['source_message_reference'] = 'private-source-sha256:' + sha(authorization['source_message_reference'])
        authorization['approval_id'] = 'private-approval-sha256:' + sha(authorization['approval_id'])
        if grant['kind'] == 'owner_review_grant' and previous is not None:
            authorization['previous_grant_sha256'] = envelope_digest(previous)
        grant['authorization_json'] = json.dumps(authorization, sort_keys=True)
        grant['authorization_sha256'] = sha(grant['authorization_json'])
        grant['approval_id'] = authorization['approval_id']
        if grant['kind'] == 'owner_review_grant':
            previous = grant
    result['public_export'] = {'schema': 'dispatch_public_ledger/1',
        'original_private_state_sha256': envelope_digest(state),
        'description': 'Derived public account. Usage, frozen envelope, increments and verdicts are unchanged. Private owner message fields are represented by digests and an operator attestation.',
        'owner_message_redactions': redactions}
    if owner_grant_problems(result) or validator_grant_problems(result):
        raise ValueError('public grant amounts or audit chain changed')
    return result


# Any rooted path of two or more segments, wherever it points, plus file URLs. A URL path is preceded by a
# host character, so it is skipped, and a repository token or a relative path never starts with a slash.
ABSOLUTE_PATH = re.compile(r"file:/+[^\s\"'<>]+|(?<![\w.~/:}-])/[A-Za-z0-9_.@+~-]+/[^\s\"'<>]+")
VERDICT_KIND = re.compile(r"(review|verdict|score|panel|critic|reject|fail|approv|accept)", re.I)
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


def strings(obj):
    if isinstance(obj, dict):
        for value in obj.values():
            yield from strings(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from strings(value)
    elif isinstance(obj, str):
        yield obj


def private_key_problems(events, key_pattern):
    """The sanitizer digests anything under a key that merely contains a private word. That is right for a
    draft id or a path and wrong for a score, so a digested value must be a string and must not sit in an
    event that records a verdict or a charged failure."""
    def walk(node, kind):
        if isinstance(node, dict):
            for key, value in node.items():
                if key_pattern.search(str(key)):
                    if not isinstance(value, str):
                        yield str(kind) + '.' + str(key) + ' is not a string'
                    elif VERDICT_KIND.search(str(kind)):
                        yield str(kind) + '.' + str(key) + ' sits in a verdict event'
                else:
                    yield from walk(value, kind)
        elif isinstance(node, list):
            for value in node:
                yield from walk(value, kind)
    for event in events:
        if isinstance(event, dict):
            yield from walk(event, event.get('kind'))


def historical_path_projection(state, public, origins, root, codec):
    """Derive public path labels only from verified, owned historical grant origins.

    This export is separate from the checkpoint codec. Every origin gets a distinct
    digest label, and expanding those labels must recover the entire prior public
    object exactly. The private ledger and its frozen evidence are never edited.
    """
    candidates = set()
    owned = ('/out/dispatch/', '/video-engine/', '/assets/', '/config/')
    for origin in origins:
        earlier = origin['root']
        if earlier == str(root):
            continue
        grant = state['events'][origin['event_index']]
        # Owner-message exports have their own irreversible, audited redactions.
        # They cannot establish a new filesystem projection authority here.
        if grant.get('kind') in {'owner_review_grant', 'owner_validator_grant'}:
            continue
        fields = codec.grant_text_fields(grant)
        if (codec.grant_anchor(grant) != origin['authorization_sha256']
                or any(sha(grant[key]) != grant[codec.GRANT_TEXTS[key]] for key in fields)):
            raise ValueError('public export refused: historical origin lacks exact grant evidence')
        # An arbitrary ancestor such as /home/user or /tmp is not an owned checkout.
        if any(earlier + suffix in grant[key] for key in fields for suffix in owned):
            candidates.add(earlier)
    result = copy.deepcopy(public)
    labels = []
    for earlier in sorted(candidates, key=len, reverse=True):
        label = '{HISTORICAL_REPO_SHA256_' + sha(earlier) + '}'
        if label in json.dumps(result):
            raise ValueError('public export refused: historical path token collision')
        pattern = re.compile(r'(?<![\w.~/:}-])' + re.escape(earlier) + r'(?=$|[/\s\"\'<>])')
        count = 0
        def project(node):
            nonlocal count
            if isinstance(node, str):
                value, changed = pattern.subn(lambda _: label, node)
                count += changed
                return value
            if isinstance(node, list):
                return [project(value) for value in node]
            if isinstance(node, dict):
                return {project(key): project(value) for key, value in node.items()}
            return node
        result = project(result)
        if count:
            labels.append((label, earlier, count))
    if not labels:
        return public
    restored = result
    for label, earlier, _ in reversed(labels):
        restored = _replace_label(restored, label, earlier)
    if restored != public:
        raise ValueError('public export refused: historical path projection changed evidence')
    result['public_export']['historical_path_projection'] = {
        'schema':'dispatch_public_historical_paths/1',
        'original_public_projection_sha256':sha(json.dumps(public, sort_keys=True)),
        'exact_inverse_verified':True,
        'origins':[{'token':label, 'root_sha256':sha(earlier), 'occurrences':count}
                   for label, earlier, count in labels]}
    return result


def _replace_label(node, label, original):
    if isinstance(node, str):
        return node.replace(label, original)
    if isinstance(node, list):
        return [_replace_label(value, label, original) for value in node]
    if isinstance(node, dict):
        return {_replace_label(key, label, original):_replace_label(value, label, original)
                for key, value in node.items()}
    return node


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
    public, origins = c.public_projection(state, root)
    text = json.dumps(public, indent=2, sort_keys=True) + '\n'
    if c.SECRET_TEXT.search(text) or any(v in text for v in c.credential_values(os.environ)):
        raise ValueError('public export refused: credential-shaped content in the ledger')
    # Compared against the decoded strings of the output, since JSON escapes a newline, a quote or a backslash.
    decoded = list(strings(json.loads(text)))
    for value in set(private_values(state, False, c.PRIVATE_KEY)):
        if any(value in part for part in decoded):
            raise ValueError('public export refused: a value held under a private key survived under a neutral one')
    problem = next(private_key_problems(state.get('events', []), c.PRIVATE_KEY), None)
    if problem:
        raise ValueError('public export refused: the sanitizer would replace protected evidence: ' + problem)
    public = historical_path_projection(state, public, origins, root, c)
    text = json.dumps(public, indent=2, sort_keys=True) + '\n'
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
