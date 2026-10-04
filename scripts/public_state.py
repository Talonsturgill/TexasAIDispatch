"""Export an explicitly derived ledger without publishing private owner messages."""
import copy
import hashlib
import json


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


if __name__ == '__main__':
    import argparse
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.state.resolve() == args.out.resolve():
        raise SystemExit('Public export must never overwrite the private ledger')
    args.out.write_text(json.dumps(export(json.loads(args.state.read_text())), indent=2) + '\n')
