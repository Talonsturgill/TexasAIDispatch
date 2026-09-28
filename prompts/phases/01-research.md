# Research and select

Read knowledge/texas/APPLICATIONS.md, the researcher brief and config/production_actions.json.
Start with current Docket movements, then fetch primary evidence for the application and its
human consequence. Read full pages before citing them. A headline or search snippet is a lead.

```sh
python scripts/dedupe.py list --days 30
python scripts/run_controller.py consume --resource research_agents --note "<distinct beat>"
```

Spawn the accepted `researcher` agents in one bounded parallel batch, after reserving each.
Use as many independent angles as the decision needs, up to the configured normal target.
The target is not a minimum. Workers do not recursively delegate. Reuse valid current research.

Choose one dated Texas action: who did what, where, when, what changed, what happens next,
and who can still act. Prefer work in the oilfield, farm/ranch/water, transport, medicine,
public research, emergencies or manufacturing. Build-out and policy are individual beats,
not substitutes for the application layer. Search beyond the first candidate when its pictures
cannot explain its action. Respect the dedupe window and beat caps.

Before narration, screen the opening, mechanism and consequence against the action catalog's
actual scope. Researcher filmability.action_support records a demonstrated action_id or an
inspected source asset, its factual source, scope_fit and rights evidence. Apply the dated medium policy in CREATIVE_DIRECTION.md; from September 29 the opening
may use the strongest authenticated medium. Record selected.visual_stakes and its fetched source URLs. Unsupported synthetic human performance is a reason to select a filmable sourced angle now. If the starter catalog and inspected footage do not supply the central action, use the bounded source-backed proposal in DAILY_PRODUCTION.md. Record the actual source, module, disclosure and visible consequence before candidate admission; a concept alone is not approval.

Write out/dispatch/story_selection.json using schema dispatch_story_selection/1 and edition_date.
Include selected title, beat, county, texas_link, record_status/id/URL, movement actor/action/object/
event_type/date, why_today, consequence, application_change, counter_image, earned_take,
sources with retrieval dates and types, agency next_step/who_can_act/open, and filmability.
Record at least one real rejected alternative and its concrete reason.

```sh
python scripts/story_selection_check.py --selection out/dispatch/story_selection.json --date <date>
python scripts/dedupe.py check --entities "<real entities>" --beat <beat>
python scripts/run_controller.py consume --resource validator_agents --note "current claims and script evidence"
```

Spawn `validator` to re-fetch cited URLs and verify every factual assertion, number and quote.
Keep claims and the dated validation report. Partial evidence cannot become a verified claim.
Before synthesis, have the same independent validation role inspect each spoken sentence and
its claim bindings. If an excerpt seems too narrow, re-fetch surrounding context before
rewriting. Preserve contradictions and source limits; never fabricate verification.

Select the three key images and the earned take from those sources. An illustrative rendering
must not impersonate observed footage, actual private software, a named person's property or
an unreported outcome. Licensed or justified source excerpts retain their provenance and
limitations. Fitting a schema does not establish that a picture tells the story.

Apply DAILY_PRODUCTION.md's story-specific visual policy during this same research pass. Inspect the actual place, people, equipment, workflow and documents before generic alternatives. Keep bounded visual_research searches/candidate decisions for the board; no repeated stock hunt. Compare candidates with the latest shipped edition and reject repeat b-roll, including derivatives.
