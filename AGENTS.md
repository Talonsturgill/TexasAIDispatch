# Dispatch worker routing

The current production lane is `prompts/daily_routine.md`, executed through
`scripts/lean.py`. Read `CLAUDE.md` and that runbook before production work. They replace the
controller, checkpoint, capture-authorization and phase-prompt lane retained for historical
editions.

Daily creative assignments use the built-in `general-purpose` worker with the model and effort
named in `prompts/daily_routine.md`. Do not substitute the agent definitions under `.claude/` or
the retired runtime plans under `config/`. Those files remain only so older editions and their
tests stay reproducible.

Brief each worker once with the current compact inputs. Reuse it only for a bounded follow-up on
those inputs. Never recursively delegate or add a reviewer to compensate for a weak assignment.
A worker's response is research, a pitch or a review. It is never a production reservation,
shipment verdict or permission to send anything.

Run every Dispatch shell command through `scripts/run_with_env.sh`. Preserve unrelated work and
shipped run bytes. Never print, copy or commit credentials. Never send email. Authorized daily
social publishing follows `prompts/social_delivery.md`.

The workspace personal writing rule applies to every newly authored audience-facing word. Use
concrete actions, outcomes and consequences. Run the existing prose check before voice synthesis
and delivery. Preserve quoted source evidence and code identifiers.
