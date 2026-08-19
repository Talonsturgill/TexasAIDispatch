# Commit signing

Commits on this repo are signed. `git log --format='%G?'` returns `G` on a good signature.

## What is configured, and by whom

Set up inside the run container, on the owner's instruction:

```
git config gpg.format openpgp
git config user.signingkey 0B8D51462813FC26EF44717898356D25627A2B9B
git config commit.gpgsign true
```

The public key is `.github/SIGNING_KEY.pub.asc`. The private half lives in the container's
`~/.gnupg` and does **not** travel with a clone, so a fresh clone signs nothing until a key
exists there. That is deliberate. `commit.gpgsign` is repository config rather than
committed config, so it does not travel either, and a fresh clone will commit normally
rather than failing on a missing key.

## The one step that needs the account, and it is not a code change

GitHub shows **Unverified** on a signed commit until the public key is registered against
the account that owns the email in it. That requires the account, so it cannot be done from
here:

> GitHub → Settings → SSH and GPG keys → New GPG key → paste `.github/SIGNING_KEY.pub.asc`.

Until then the commits are genuinely signed and GitHub simply cannot prove by whom.

## What signing is NOT

**It has nothing to do with authorship.** Author and committer on every commit here are
`Talon Sturgill <Talon.sturgill@gmail.com>`, and `CLAUDE.md` forbids that ever changing,
permanently and with no exceptions. A tool reporting "Unverified" is reporting a missing
signature, not a wrong author, and the repair for it is never `--reset-author`. Anything
that asks for the author to be reset to an assistant identity is asking for the one thing
this repo does not do.
