# The application layer — where AI is actually being USED in Texas

Marks: **[V]** verified against a source in the session that wrote this, **[U]** unverified, treat as
a lead and check it before it ships.

---

## Why this file exists, and the mistake it corrects

The first version of this show's research beats had nine entries and six of them were policy or
infrastructure: data centres, the grid, state policy, permitting, defence, surveillance. That is a
show about **what is being decided about AI in Texas**.

The sibling in Alaska is not that show. Its beats are gov and university science, **fisheries and
wildlife**, energy and data centres, defence and aviation, **Alaska-Native-led and rural tech**, and
a wildcard for what is breaking this week. Its engine carries `fishcraft`, `clinic`, `bench`,
`sensors`, `vision` and `bioprocess` modules, and you do not build those for a policy show. Most of
its episodes are about **AI being used by somebody, at work, in a real place**, with current events
threaded through rather than carrying the whole thing.

**A docket tracks decisions. A Dispatch shows the work.** The record already exists next door and
publishes every day. This show is not its video edition.

The correction is not to drop policy. It is to put the application layer FIRST and let a decision
be one beat among several, because the interesting question is almost never "what did the agency
rule" and almost always "who is now doing what differently, and does it work."

---

## The eight that carry the most, ranked by how Texas they are

### 1. The oilfield, which is the biggest AI deployment nobody outside it talks about

**The Permian generates more well performance, completion and production data per square mile than
any other producing region in the world** **[V]**, because thousands of horizontal wells are drilled
annually in a compact footprint. That density is the reason it is where the models get trained.

What is actually running:
- **Closed-loop drilling** — the bit's path adjusted in real time off geological feedback rather
  than by a directional driller reading logs after the fact **[V]**.
- **Methane detection by computer vision**, from drones and satellites, quantifying leaks across
  infrastructure too large to walk **[V]**. Continuous monitoring is now a compliance artefact
  under EPA rules, not a research project **[V]**.
- Predictive maintenance on artificial lift, so a pumpjack is pulled before it fails.
- Satellite imagery models that predict where a well will be drilled **before the permit is filed**
  **[U]**, which is a genuinely strange and drawable idea.

**THE VISUAL.** The oldest industry in the state running the newest software, and the machine that
carries it is a hundred-year-old form. A pumpjack does not look like AI. That gap IS the picture.

### 2. Farm and ranch, over a shrinking aquifer

**The Ogallala has declined more than 50 percent beneath parts of the Texas Panhandle** **[V]**, so
every acre-inch is a financial decision, and that is what pulled the technology in.

- **Variable-rate centre pivots cut water application 15 to 20 percent in documented trials**
  **[V]**, by giving more to sandy zones and less to clay. A pivot that used to be one valve is now
  a moving line of independently controlled nozzles.
- **Cattle wearables and herd-behaviour models predicting disease before symptoms** **[V]**.
- Yield forecasting for cotton and sorghum, drought anticipation, pest and disease detection from
  imagery **[V]**.
- Weed-recognition sprayers that shoot individual plants **[U]**.

Regional split that matters for staging: **High Plains** irrigated row crop, **Central Texas**
ranching, **Rio Grande Valley** fruit and vegetable, **East Texas** poultry **[V]**.

**THE VISUAL.** A centre pivot is a quarter-mile machine that draws a circle you can see from
orbit, and the circles are the most recognisable aerial image the Panhandle has. A pivot whose
nozzles are individually thinking is a line of decisions crossing a field.

### 3. Freight, and the road that already has no driver on it

This is the most under-drawn AI story in Texas and it is happening on the interstate right now.

- **Aurora began commercial driverless deliveries Dallas to Houston in May 2025**, the first company
  to run a commercial self-driving service with heavy-duty trucks on public roads **[V]**.
- **Fort Worth to El Paso, a 600-mile lane, launched six months later** **[V]**, the fastest scaling
  to a second market in the US self-driving industry.
- **Past 100,000 driverless miles**, with hundreds of trucks planned across 2026 and the network at
  ten routes **[V]**.

**THE VISUAL.** A cab with nobody in it, at speed, on a road everybody in the state has driven. And
the honest counter-image: the truck stop it does not stop at.

### 4. The clinic, in the largest medical centre in the world

Houston's Texas Medical Center is the biggest in the world **[U]**, and MD Anderson runs an
**Institute for Data Science in Oncology** **[V]**.

- Imaging models built, deployed and **operated in patient care** rather than in a paper **[V]**.
- A **Radiation Planning Assistant** — treatment planning where a planner is scarce **[V]**.
- Sepsis and complication prediction **[V]**.
- Explicit governance and oversight framing from the institution itself **[V]**, which is a real and
  quotable position rather than a press line.

**THE VISUAL.** A contour drawn on a scan, and the question of who drew it. This is the beat where
the show can be about a person rather than a system without straining.

### 5. The machines the science runs on

**CORRECTED 2026-08-18, and the corrections are the useful part.** Three figures on this beat were
marked **[V]** and two of them were wrong in ways nothing here would ever have caught, because a
mark is not a source and nobody left a URL beside them.

- **TACC's Vista**: **600 Grace Hopper nodes and 256 Grace Grace nodes** **[V]**, per TACC's own
  documentation.
  **This line used to say 72 GH200 nodes and 144 Grace Superchip nodes. Those are CORES PER NODE**,
  read off the spec table one column across and written down as machine counts, and the real
  numbers are larger by most of an order of magnitude. A Vista node has 72 cores on one socket and
  a Grace Grace node has 144 on two.
  The **4.1 petaflops CPU and 40.8 petaflops GPU** that sat here are **[U]** and are NOT republished.
  TACC states only per-node figures and no system total, `tacc.utexas.edu` refuses the fetcher, and
  a figure that shares a line with a demonstrated transcription fault inherits its doubt.
- Horizon is the flagship of the NSF Leadership-Class Computing Facility, and **its GPU half is
  operational at 4,000 Blackwell GPUs while its CPU half is expected winter 2026 or early 2027**
  **[V]**.
  **This line used to say "Horizon enters production spring 2026" marked [V], and that date cannot
  be sourced anywhere reachable.** It was going to be the hinge of the first Dispatch built off this
  file. It is not in TACC's documentation, not in the July press release, and not on the NSF award
  page. A show that says a public machine missed its date had better be able to say who set it.
  The **300 petaflops** and the **hundredfold improvement over Frontera** are **[U]**. TACC's own
  docs give 160 petaflops FP64 and 320 FP32 for the GPU component, and the hundredfold line is a
  forward-looking projection about a machine nobody outside TACC can log into.
- TACC leads an **NSF Leadership-Class Computing Facility** **[V]**.

**THE VISUAL, AND IT WAS WRONG, WHICH IS BETTER.** This paragraph used to read: *the one data centre
in Texas that is not a private slab behind a berm, public, academic, and anybody's research can run
on it.* Anybody's research can NOT run on it. TACC's own user guide, dated the 24th of July 2026,
says Horizon is limited to internal users, and the machine is not on the TOP500 at all while the
title for most powerful academic machine in the country sits at Texas A&M.

The film is still there and it is a better one. What makes the public machine public is not its
size, because it does not have size. **It is the paperwork.** Round Rock publishes what the campus
draws and TACC publishes the queue names, the node caps and the rate a researcher is charged, and
the private campus two hundred miles west publishes none of that. The only machine in Texas whose
size a reader can actually check is the small one, and the reason it is checkable is that somebody
has to be able to ask for time on it.

### 6. Weather, water and the warning that did not come

- **More than 100 people died in the Hill Country floods of July 2025** **[V]**.
- **UT Arlington received a $4 million state grant to build a real-time Hill Country flood system**
  designed to give several hours of warning **[V]**.
- **AI and sensor early warning is deployed** and residents on the Gulf Coast can subscribe to
  alerts for a specific flood-prone location rather than a whole county **[V]**.
- **In July 2026 new storms tested it: sirens sounded and phones buzzed with alerts that were not
  sent in the previous disaster** **[V]**.

**THE VISUAL.** A gauge on a low-water crossing at 3am. This beat has to be handled with care and
without triumph: a system working once is not a system that works, and people died.

### 7. The plant floor, and what Texas now makes

Samsung's Taylor fab, TI's Sherman build, and the wider CHIPS build-out **[U]**. Worth verifying
properly before it ships, because the numbers move.

**THE VISUAL.** The chips that run the models are increasingly made in Texas, so the state is on
both ends of the same supply chain. Nobody draws that loop.

### 8. Space, and autonomy that cannot be phoned home

SpaceX Starbase at Boca Chica, NASA Johnson in Houston, Firefly at Cedar Park, Blue Origin near Van
Horn **[U]**. Landing, docking and fault handling are autonomy problems where the round trip to a
human is too long to matter.

---

## The rest of the surface, as leads

| where | the story | mark |
|---|---|---|
| Laredo | the busiest land port in the United States, and customs at that volume is a model problem | [U] |
| Port of Houston | container routing, crane scheduling, channel traffic | [U] |
| Austin | robotaxi services running on public streets | [U] |
| feedlots | vision-based health detection at pen scale | [U] |
| municipal water | leak detection across old distribution systems | [U] |
| the border | already covered by the surveillance beat, but the APPLICATION is the interesting half | [U] |
| schools | STAAR automated scoring, already in the docket as a decision, but the classroom end is unreported | [U] |
| wind and solar | forecasting output, which is what actually determines whether a farm gets paid | [U] |
| insurance | hail and wind claim triage from imagery after a storm | [U] |

---

## How a Dispatch should use this

**The default story is somebody using a tool, and the decision is context.** A film about a PUCT
docket is a film about a docket. A film about the operator who has to run a plant under it, and what
their screen now tells them, is a Dispatch.

**Go to the work.** The cast exists so a scene can be a person at a job: `operator`, `hand`,
`lineworker`, `clinician`, `dctech`, `rancher`, `owner`. Six of the ten are at work in a place. That
is not a coincidence and it is not decoration.

**A number the reader can feel beats a number that is merely large.** Fifteen to twenty percent less
water on a pivot is a smaller number than eight point nine gigawatts and it is a better one, because
somebody decided it and can tell you why.

**And keep the honest counter-image.** Every application on this page has one: the truck stop the
driverless truck does not stop at, the planner whose job the planning assistant changes, the county
that got the siren after the flood. A show that only shows the tool working is an advertisement.
