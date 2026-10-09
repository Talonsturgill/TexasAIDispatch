# Research and select

Read knowledge/texas/APPLICATIONS.md, the researcher brief and config/production_actions.json.
Start with current Docket movements, then fetch primary evidence for the application and its
human consequence. Read full pages before citing them. A headline or search snippet is a lead.

For newly planned editions from October 3rd, read the visual-storytelling selector and
knowledge/craft/visual-storytelling/viewer-plan.md. Screen the reporting angle through the actual picture access before choosing
the story. A candidate earns its place through a recognizable task, transformation or changed
choice. Ask the existing researchers for the strongest useful image, the missing picture and
the strongest source limitation in their existing filmability rationale. Keep the same bounded
research pass and compact role assignments; no additional outlet-study pass is required daily.

For newly planned editions under agent_runtime.json, prefer one promising beat. Retain the
actual researcher response as out/dispatch/research.json. Before reserving, prepare its source
packet with the actual Docket ledger path and the current applications reference:

```sh
python scripts/agent_runtime.py --input-packet --role researcher --edition <date> --input <actual-docket-ledger> --input knowledge/texas/APPLICATIONS.md --out out/dispatch/researcher-packet.json
python scripts/agent_runtime.py --plan --role researcher --packet out/dispatch/researcher-packet.json --task-name researcher --scope "Research one current source-backed Texas application and its filmable action, consequence and limit" --out out/dispatch/researcher-assignment.json
```

Execute the returned spawn_args only after the existing reservation. Expand research only
when source or filmability screening requires another angle; never spawn the maximum by habit.

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
python scripts/agent_runtime.py --input-packet --role validator --edition <date> --input out/dispatch/research.json --input out/dispatch/story_selection.json --out out/dispatch/validator-packet.json
python scripts/agent_runtime.py --plan --role validator --packet out/dispatch/validator-packet.json --task-name validator --scope "Independently re-fetch each source and verify every assertion, number, quote and limitation" --out out/dispatch/validator-assignment.json
python scripts/run_controller.py consume --resource validator_agents --note "current claims and script evidence"
```

For pre-effective editions use the original compact assignments; runtime planning never resets their ledgers. For current editions pass validator-assignment.json spawn_args. An empty rejected list is valid only after every claim was independently supported; never invent a rejection quota.

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

Make one of those searches the Library of Congress's Lyda Hill Texas Collection, whose photographs of Texas places carry the advisory "No known restrictions on publication" in their own records. Search with the story's actual site or town, and fetch a chosen photograph so its provenance is written beside it.

```sh
python scripts/place_photos.py --place "<actual site or town>" --out out/dispatch/place_photos.json
python scripts/place_photos.py --fetch <item url> --dest out/dispatch/media/<name>.jpg
```

A photograph of the actual site is story_role actual-site. A photograph of the place around it is context only with its specific relationship stated, never as mood. Copy the sidecar's source_url, creator, date, rights_basis, credit_line and sha256 into the native_media row.
