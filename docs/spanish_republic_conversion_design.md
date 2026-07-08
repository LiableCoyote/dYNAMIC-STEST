# Design Document — "Dynamic Social Democracy: Spanish Republic"

**Working title:** *Social Democracy: The Spanish Republic* (a total-conversion of *Social Democracy: An Alternate History*)

**Premise:** Re-set the game in the **Second Spanish Republic**, playing the **PSOE** (Partido Socialista Obrero Español) through the turbulent republican years, ending on the eve of / at the outbreak of the **Spanish Civil War (July 1936)** — structurally analogous to the base game, where the SPD navigates the collapse of Weimar and the game ends with Hitler taking power.

**Purpose of this document:** Assess feasibility and break the work into **general areas of effort**. Each area is intentionally high-level; Claude Code can later expand any single area into a detailed implementation plan. This is a scoping/architecture document, **not** an implementation plan.

> **Start here if you're a fresh session:** read [`../CLAUDE.md`](../CLAUDE.md) for orientation (build/verify workflow, the rename maps, the concatenation trap, current status, and how to continue).
>
> **Progress:** **Area A** (scaffolding) ✅ · **Area B** (state schema / `root.scene.dry` / HUD display) ✅ · **Area C** (election engine — calendar, 1933 bloc-list law, CNT abstention, calibration harness, yearly ticks) ✅ *(remaining C-2/C-5/C-8 parts are coupled to Area H content)* · **Area D** (PSOE faction semantics — ideology deck, faction display, disunity/discovery cards) ✅ · **Area E** (party landscape — inter-party relations, enemies/people's-party cards, party roster) ✅ · **Area F** (the four new Spain-specific subsystems: anarchism/CNT-FAI, regional autonomy, agrarian reform, church-military-Africa) ✅ · **Areas G–M** 🔲 not started. Detailed status lives in [`planning/BC_election_engine_execution_plan.md`](planning/BC_election_engine_execution_plan.md), [`planning/D_faction_semantics.md`](planning/D_faction_semantics.md), [`planning/E_party_landscape.md`](planning/E_party_landscape.md), and [`planning/F_new_subsystems.md`](planning/F_new_subsystems.md) (Execution status sections). The **electoral engine is mechanically complete and verified by simulation**, the **player-party internals and surrounding party landscape have PSOE identity**, and **all four new subsystems have first-increment mechanics**, but the game is **not yet end-to-end playable** — it still boots into Weimar narrative content that Areas G–I replace. Area F's research surfaced several inherited engine-scale bugs (a silently-NaN-producing block in `post_event.scene.dry`, a 72-file `reichswehr_*` rename gap, the 53-file `coup_progress` event chain) flagged for Area H/B-remnant work, plus a July-1936 endgame-trigger spec for whoever picks up Area H.

---

## 1. Feasibility Verdict (read first)

**Feasible, but it is a total conversion, not a reskin.** The good news and the bad news:

- ✅ **The engine transfers for free.** The game runs on **dendrynexus** (a fork of the Dendry interactive-fiction engine). It is content-agnostic: `.dry` scene files compiled to static HTML via `dendrynexus make-html`. Nothing about the engine is Weimar-specific. Build tooling, save system, quality-display system, parliament/line-graph rendering (d3) all carry over unchanged.
- ✅ **The mechanical scaffolding is a remarkably good structural fit.** The base game already models *exactly* the situation Spain 1931–1936 presents: a **socialist party** caught between a **radical left**, an **authoritarian right**, and its own **internal factions**, inside a **fragile interwar republic** that ultimately dies. Most of the *systems* (elections, factions, inter-party relations, paramilitaries, coups, president relations) map onto Spanish analogues with reweighting rather than redesign.
- ⚠️ **The content layer is ~90% of the project and almost all of it must be rewritten.** There are **506 `.dry` files / ~77,000 lines**, of which **378 are event scenes**, all hard-coded to German history, German figures, German party names, and German-specific crises. Text, historical logic, party rosters, and event chains are not portable.
- ⚠️ **Several Spanish subsystems have no German analogue** and are net-new design: **anarcho-syndicalism (CNT-FAI)**, **regional nationalism (Catalonia / Basque Country)**, the **agrarian/land question**, and the **Church/military-in-Africa** axis. These are central to Spain, not peripheral.
- 📦 **Assets are substantial.** ~**385 unique images** and a curated music set, all thematically German. New period-appropriate, license-clean Spanish assets are needed.

**One-line estimate:** keep the engine and ~70% of the *mechanical systems*; rebuild essentially the entire *content and historical-logic layer*, and add ~4 new Spain-specific subsystems. Comparable in effort to writing a new game of similar length on a pre-built engine.

---

## 2. What the base game actually is (architecture snapshot)

Understanding this is prerequisite to scoping the conversion.

| Layer | Location | Weimar-coupling | Transfers? |
|---|---|---|---|
| **Engine (dendrynexus)** | `node_modules`, `out/html/*.js` | None | ✅ As-is |
| **Build** | `dendrynexus make-html` → `out/html` | None | ✅ As-is |
| **Global state model** | `source/scenes/root.scene.dry` (`on-arrival`) | High — ~200 hard-coded German vars | 🔁 Rework |
| **Election engine** | `source/scenes/election_algorithm.scene.dry`, `election_simulation.scene.dry` | Medium — `classes × parties` matrix, German party list | 🔁 Reweight + retarget |
| **Quality displays** | `source/qdisplays/*.qdisplay.dry` (23 files) | Medium — some German-named (`schleicher_*`, `hindenburg_*`) | 🔁 Partial |
| **Advisors** | `source/scenes/advisors/*` (28 files) | Total — named real people | ❌ Rewrite |
| **Government affairs** (policy cards) | `source/scenes/government_affairs/*` (37 files) | High — text + some German policy specifics | ❌ Mostly rewrite |
| **Party affairs** (party-management cards) | `source/scenes/party_affairs/*` (21 files) | High | ❌ Mostly rewrite |
| **Events** | `source/scenes/events/*` (378 files) | Total | ❌ Rewrite |
| **Assets** | `out/html/img` (~385), `out/html/music` | Total (thematic) | ❌ Replace |

**Core state variables** (from `root.scene.dry`) that define the simulation:
- Party internals: `resources`, `dues`, `dissent`, faction `*_strength`/`*_dissent` for `['left','center','labor','reformist','neorevisionist','social_patriot']`.
- Ideology sliders: `crisis_urgency`, `nazi_urgency`, `radicalization`, `wtb_support`, `pacifism`, `democratization`, `communist_coalition`, etc.
- Inter-party relations: `z_relation`, `kpd_relation`, `ddp_relation`, `dvp_relation`, `dnvp_relation`, `nsdap_relation`, plus per-party leaders/ideologies.
- Paramilitaries: `rb_*` (Reichsbanner), `sh_*` (Stahlhelm), `sa_*` (SA), `rfb_*` (RFB) — strength/militancy/banned/loyalty.
- State forces: `interior_police_*`, `prussian_police_*`, `reichswehr_*`.
- National opinion: `nationalism`, `socialism`, `pro_republic`; `coup_progress`, `capital_strike_progress`, `emergency_rule`.
- Demographics: `classes = ['workers','old_middle','new_middle','rural','unemployed','catholics']`; `parties = ['spd','kpd','z','ddp','dvp','dnvp','nsdap','other']`; per-class economic figures sourced from cited historical tables.
- Time: `year` (1928 start), `month`, `week`, `time`, `month_actions`.

This is the skeleton every area below either reuses, reweights, or replaces.

---

## 3. The historical mapping (design foundation)

The conversion's coherence depends on a defensible Weimar→Spain mapping. Proposed:

| Base game (Weimar) | Spanish Republic analogue | Notes |
|---|---|---|
| **SPD** (player) | **PSOE** | Direct: mass socialist party, trade-union linked (UGT). |
| SPD factions: left / center / labor / reformist / neorevisionist | **Largo Caballero (left/"Spanish Lenin") / centrist / UGT-labor / Prieto (centrist-reformist) / Besteiro (right-reformist)** | Faction system maps cleanly; retune. |
| **KPD** | **PCE** (+ later POUM) | Communist rival to the player's left. |
| **Zentrum / BVP** (Catholic) | **CEDA** (Gil Robles) — Catholic authoritarian right | Different valence: in Spain the Catholic party is the *main threat*, not a coalition partner. |
| **DDP/DVP** (liberals) | **Radical Party** (Lerroux), **Republican Left** (Azaña) | Centre/centre-left republicans. |
| **DNVP** (national right) | **Monarchists** (Renovación Española / Carlists) | Anti-republican right. |
| **NSDAP** (fascists, the end-boss) | **Falange** + the **military conspiracy (UME/Mola/Sanjurjo/Franco)** | The existential threat; "Hitler takes power" → **the July 1936 coup / civil war outbreak**. |
| *(no analogue)* | **CNT-FAI** (anarcho-syndicalists) | **NET-NEW subsystem.** No German equivalent. |
| Prussia special mechanics | **Catalonia (Generalitat/ERC)** + **Basque autonomy** | Regional autonomy question, far more central than Prussia. |
| Reichsbanner (player paramilitary) | **UGT/PSOE milicias**, later Popular Front militias | |
| Stahlhelm / SA / RFB | **Requetés (Carlist)** / **Falange militia** / **anarchist milicias** | |
| Reichswehr | **Spanish Army / Army of Africa** | Colonial dimension is new. |
| Hindenburg (president) | **Alcalá-Zamora**, then **Azaña** | Presidential-relations mechanic maps. |
| Elections 1928/1930/1932 | **1931 (constituent), 1933, 1936 (Popular Front)** | Retimed. |
| Emergency decrees / Brüning deflation | **Bienio Negro** austerity, states of emergency | |
| Prussian *Reichsexekution* / civil-war triggers | **Asturias / Catalonia October 1934 revolution** | A natural mid-game crisis climax. |
| Hitler takes power (end state) | **Nationalist coup, 17–18 July 1936** | Game end / civil-war branch. |

**Timeline shift:** base game runs ~1928→1934 (≈6 years). Spain runs **April 1931 → July 1936** (≈5 years). **Decided:** the game **ends at the July 1936 coup** (mirroring the base game's "Hitler takes power" end state); a war epilogue is explicitly deferred as possible future scope, not built in the first pass.

---

## 4. Areas of Effort

Each area is a candidate for its own detailed Claude Code planning pass. Ordered roughly by dependency. **Size** = relative build effort (S/M/L/XL). **Type** = Reuse / Reweight / Rewrite / New.

### A. Engine, Build & Project Scaffolding — *Size S · Reuse*
> 📄 **Expanded into a detailed plan:** [`planning/A_engine_build_scaffolding.md`](planning/A_engine_build_scaffolding.md)
- Fork/duplicate repo, rename package (`social_democracy` → new id), update `info.dry`, `README`, `modinfo`, credits scaffolding.
- Confirm `dendrynexus make-html` builds cleanly; set up a repeatable local build + smoke-test loop.
- **Decided:** ships as a **standalone total-conversion** (own build/repo, full control of engine + assets), *not* as a mod via the existing `mod_loader`.
- **Deliverable for planning:** build/CI recipe, naming conventions, asset-path strategy.

### B. Global State Model Redesign — *Size L · Rewrite (of `root.scene.dry`)*
> 📄 **State schema:** [`planning/B_state_schema.md`](planning/B_state_schema.md) · **Remaining B work + all of Area C:** [`planning/BC_election_engine_execution_plan.md`](planning/BC_election_engine_execution_plan.md)
- Rewrite the `on-arrival` init block: dates (1931 start), the `classes`/`parties` arrays, all faction vars, all relation vars, paramilitary rosters, state-force rosters, national-opinion axes.
- Re-source demographic weights from Spanish data (heavy rural/landless share; low industrial share vs Germany).
- Define new axes needed by Spanish subsystems (see F): `anarchist_strength`, `catalan_autonomy`, `land_reform`, `clerical_conflict`, `army_loyalty`, `africa_army`.
- **This is the linchpin.** Almost every other area reads/writes these variables, so its variable naming and semantics must be settled early.

### C. Election & Demographic Engine — *Size L · Reweight + Retarget*
> 📄 **Expanded into a detailed plan (combined with remaining Area B work):** [`planning/BC_election_engine_execution_plan.md`](planning/BC_election_engine_execution_plan.md)
- Keep the `classes × parties` matrix architecture (it is genuinely reusable and elegant).
- Replace class list to reflect Spain: e.g. `industrial_workers`, `landless_laborers (braceros)`, `smallholders`, `petite_bourgeoisie`, `middle_class`, `catholics`, `regional_nationalists` — reweighted toward the countryside.
- Replace party list with the Spanish roster (§3) and rebuild per-class baseline support tables from Spanish electoral history (1931/1933/1936).
- Model Spain's electoral specifics: the **1933 majoritarian bloc-list law** that punished a divided left and rewarded coalitions — a first-class mechanic (it *is* the story of why the Popular Front formed).
- Retime the election calendar (`set_next_election_time*`).
- **Depends on:** B.

### D. Party & Faction System (PSOE internals) — *Size M · Reweight*
> 📄 **Executed:** [`planning/D_faction_semantics.md`](planning/D_faction_semantics.md) — ✅ done for the ideology deck + faction display/disunity/discovery cards. The faction *keys* were kept generic (Area B precedent), only their identity/content changed.
- Remap the six-faction model to PSOE's real factional geometry (Caballerista left / Prietista centre / Besteirista right / UGT / youth (FJS) radicalization). ✅ done.
- Rewrite `party_affairs/ideology.scene.dry` options and the ideology sliders to Spanish debates: revolution-vs-reform, collaboration with bourgeois republicans, fusion with the PCE. ✅ done (the FJS-"bolshevization" youth-radicalization angle was not separately modeled — the existing `neorevisionist` slot was repurposed as an anti-fascist mobilization current instead; revisit if Area H wants a dedicated youth-radicalization mechanic).
- Rewrite the other `party_affairs` cards (fundraising, media, rallies, inter-party relations, streetfighting, etc.) to Spanish context. ✅ done by Area E for the party-relations and generic party-ops cards (`inter_party_relationships`, `enemies`, `campaigning`, `media`, `fundraising`, `party_organizations`, `crisis_program`, `international_relations`, the People's Party pair). **🔲 Still not done:** the paramilitary/street-politics cards (`reichsbanner`, `iron_front`, `streetfighting`, `confronting_nazis`, `weimar_rally`, `response_to_antisemitism`) — Area E found the same class of dangling vars there but deferred them to Area F as a militia-subsystem design task, not a rename.
- **Depends on:** B.

### E. Political Landscape: Parties, Leaders & Relations — *Size M · Rewrite* — ✅ done, see [`planning/E_party_landscape.md`](planning/E_party_landscape.md)
- Define each Spanish party as a data + behavior bundle: leaders, ideology tags, relation baseline, coalition willingness, splinter/merger events. ✅ done — `inter_party_relationships.scene.dry` rebuilt around the eight Spanish parties (PSOE, Republican Left, Radical Party, CEDA, PCE, monarchists, Falange, regionalists), each with live relation vars; `library.scene.dry`'s `@parties` roster and `@demographics` rewritten to match.
- Model the key dynamics: Radical–CEDA governments of the Bienio Negro; the Popular Front pact; CEDA's push for power (the trigger analogous to "Hitler as chancellor"); monarchist/military conspiracy accretion. ✅ done — the card branches on the live national coalition-state flags (`in_republican_socialist`, `in_radical_ceda`, `in_popular_front`, `in_workers_alliance`) already provisioned in `root.scene.dry`; the monarchist/conspiracy dynamic is kept intentionally minimal (a relation-only "watch and gather intelligence" framing) since the actual conspiracy-accretion clock is `coup_progress`, owned by Area C/H, not a party-relations mechanic.
- **Depends on:** B, C.

### F. New Spain-Specific Subsystems — *Size XL · New* — ✅ first increment done, see [`planning/F_new_subsystems.md`](planning/F_new_subsystems.md)
These have **no base-game analogue** and are the most design-intensive:
1. **Anarcho-syndicalism (CNT-FAI):** a large, non-electoral revolutionary bloc the player cannot recruit but must manage — insurrections (1932 Alt Llobregat, Jan/Dec 1933, Casas Viejas), general strikes, abstention-vs-participation swings that decide elections. Needs its own strength/militancy/insurrection model. ✅ first increment done — `party_affairs/cnt_relations.scene.dry` (negotiate/concessions/confront, moving the live `anarchist_electoral_stance` lever the C-4 election mechanic already consumes) + `events/casas_viejas.scene.dry` (a January-1933 stub giving `anarchist_insurrection` its first writer). 🔲 Alt Llobregat, the Dec-1933 rising, and general strikes remain Area H's to build.
2. **Regional autonomy (Catalonia, Basque Country):** statutes of autonomy, ERC alliance, the Oct 1934 Catalan declaration, Basque-Catholic-but-autonomist cross-pressure. Extends but exceeds the Prussia mechanic. ✅ first increment done — `government_affairs/catalan_affairs.scene.dry` replaces the 4 permanently-dead `prussian_affairs*.scene.dry` cards (flagged superseded, not ported) with a Statute-of-Autonomy card wiring `catalan_autonomy` + a minimal Basque-statute option wiring `basque_autonomy`. 🔲 the Oct-1934 Catalan declaration and deeper PNV/Lliga content remain Area H's to build.
3. **Agrarian/land question:** latifundia, land reform (IRA), the *braceros*, and the right's rollback — a dedicated policy axis with electoral and unrest consequences. ✅ done for the core mechanic — `government_affairs/agricultural_policy.scene.dry` rewritten as the IRA/latifundio/braceros debate, and fixed a real bug where land reform wrote to phantom class variables with zero effect on the actual demographic model (now wired to the live `landless_psoe`/`smallholder_psoe` rows). 🔲 the right's post-1933 rollback and a dedicated unrest/Casas-Viejas-style escalation chain remain Area H's.
4. **Church–military–Africa axis:** anticlericalism (church burnings 1931), the Sanjurjada (1932), the Africanista officer corps, and the accreting July-1936 conspiracy as the end-state clock. ✅ first increment done — `government_affairs/military_policy.scene.dry` rewritten around Azaña's reforms vs. the Africanista faction (wiring `africa_army`); `government_affairs/religious_policy.scene.dry` added (wiring `church_relation`/`clerical_conflict`); `events/sanjurjada_1932.scene.dry` stubs the August-1932 rising on the existing `coup_progress` counter shape. 🔲 the July-1936 endgame trigger itself is explicitly **not** built — a one-paragraph spec is in `F_new_subsystems.md` for Area H, which also owns the 53-file `coup_progress` event chain and the outstanding `reichswehr_*→army_*` rename across ~71 files beyond the one Area F touched.
- **Recommendation:** plan each of the four as a **separate** detailed pass; each is comparable to a mid-size base-game system. *(Followed — see the F-1 through F-5 stage breakdown in the plan doc.)*

### G. Government Affairs (policy card deck) — *Size L · Rewrite* — ✅ done
- Rework the 37 `government_affairs` cards to Spanish policy space: land reform, church-state separation, Catalan statute, military reform (Azaña's), public order law, education (lay schools), labor (jurados mixtos).
- Preserve the card/action-economy structure (`is-card`, `month_actions`, timers, `view-if` gating) — that framework is reusable.
- **Depends on:** B, F.
- **✅ done** — see `docs/planning/G_policy_cards.md` for full detail. Converted the ~20
  live-but-German cards Areas B/E/F/H hadn't touched: `labor_affairs`/`labor_rights`/
  `fiscal_policy` (jurados mixtos, the eight-hour day, Prieto's tax policy); the
  `economic_policy` flagship + `economic_democracy` (recon found the original's WTB/
  public-works arm — roughly half the file — was already permanently dead code, orphaned
  by an unconverted Area I advisor chain, so it was dropped rather than reframed; the
  reachable left-nationalization and moderate-Prietista arms were fully converted), then
  re-enabled the `@eco` deck Area H had left gated off pending this; `judiciary`/
  `constitutional_reform` (reframed around the 1931 electoral law's *premio de mayoría*
  and curbing Alcalá-Zamora's Article 81 dissolution power — real, mechanically-apt 1935-36
  history, not the original's anachronistic West German Basic Law borrowings)/
  `womens_rights`/`homosexual_rights` (the Republic's real 1932 Penal Code decriminalization
  vs. the 1933 vagrancy law); `police`/`domestic_enemies` (reimagined onto Area F's
  pre-built Falangist-militia/Requetés/CNT-FAI ban system — an unusually clean fit)/
  `social_welfare`/`coalition_affairs`/the toleration trio (three near-duplicate cards
  collapsed to one, reframed as the real 1936 Caballerista confidence-and-supply
  arrangement with Azaña's government); `war_guilt`→the Comisión de Responsabilidades
  (the 1921 Annual disaster inquiry); `foreign_policy` (trimmed 16→4 branches after recon
  found most of the original was non-portable Versailles/Vatican/Austria content or
  redundant with the already-converted `party_affairs/international_relations.scene.dry`);
  `education_science`→Marcelino Domingo's real school-building program and the Misiones
  Pedagógicas. Retired 4 cards with no Spanish analogue and deleted 7 dead filler files.
  Found and fixed 26 previously-uninitialized-variable bugs along the way (the same
  silent-NaN class Area B originally flagged). Verified via grep sweeps, a compiled-output
  scan, headless load, and a standalone Node end-to-end sweep across all 17 converted
  cards. **Found but explicitly out of scope:** the Area I advisor chain that would revive
  the dropped WTB arm; a silently-inert election-timing utility scene surfaced while
  trimming `coalition_affairs`.

### H. Event Content (the bulk) — *Size XL · Rewrite*
- The 378 event scenes are the largest single body of work. They must be **replaced**, not translated, because they encode specific German event chains.
- Build a **new event corpus** organized around the Spanish timeline: 1931 constituent Cortes & constitution; 1932 Sanjurjada & Catalan statute; 1933 election & Casas Viejas; 1934 October revolution; 1935 corruption scandals (Straperlo) & CEDA crisis; 1936 Popular Front & the slide to July.
- Reuse **structural templates** from the base game: yearly turn events (`1931.scene.dry` pattern), election events, coalition-formation events, party-congress events, coup/civil-war trigger events. The *shapes* port; the *content* does not.
- **Strong candidate for phased delivery:** ship a playable spine (yearly events + elections + end-state) first, then flesh out optional/flavor event chains.
- **Depends on:** B–G.
- **✅ Phase 1 (the playable spine) done** — see `docs/planning/H_event_corpus.md` for full
  detail. Built the coalition-formation writer (the government now actually changes across
  the three elections: Republican-Socialist → Radical-CEDA *bienio negro* → Popular Front,
  modeling the real Prieto/Caballero split), the Spanish election-results presentation
  (replacing the dead German parliament chart/coalition-menu tree that followed the live
  Area-C seat math), and the July-1936 endgame (4 new escalation events + a coup trigger/
  resolver computing forces from live militia/army vars, feeding into fixed Spanish
  `game_over.scene.dry` endings). **The game is now end-to-end playable, April 1931 → July
  1936.**
- **✅ Phase 2 (the bulk cleanup) done** — see `docs/planning/H2_bulk_cleanup.md` for full
  detail. Physically deleted 371 dead German scene files (493 → 122 total scene files;
  `events/` 386 → 15), including the ~2200-line dead German coalition-menu tree Phase 1 had
  left orphaned inside `election_1928.scene.dry`. Resolved the `reichswehr_*` residue (the
  feared 72-file rename turned out to be mostly moot — nearly all consumers were themselves
  dead files). Converted `ending_slides.scene.dry` to four Spanish epilogue slides. Found and
  closed 7 more reachable-but-German events beyond Phase 1's 9, plus one live policy card with
  no gate at all routing into dead content. The interleaved dead block inside
  `@post_election_1928`'s live seat math remains deliberately deferred (confirmed inert, not
  worth the surgical risk). Verified via the same end-to-end simulation re-run after every
  deletion batch — byte-identical output before and after, proving the game plays exactly the
  same with a much smaller tree. Two screens (`status.scene.dry`'s `@emergency` sub-scene,
  `status_right.scene.dry`) were found to hold substantial unconverted German content of
  uncertain reachability and left flagged for a pass with interactive browser access.

### I. Advisors / Cabinet — *Size M · Rewrite* — ✅ done
- Replace all 28 advisors (named German socialists) with Spanish figures: Largo Caballero, Prieto, Besteiro, Negrín, De los Ríos, Araquistáin, Zugazagoitia, etc., each with an advice/action card and stat effects.
- Preserve the advisor-card and "pinned cabinet" framework.
- **✅ done** — see `docs/planning/I_advisors.md` for full detail. All 28 advisor cards + the
  `shuffle_leadership` recruit roster + the two structural pinned cards converted to Spanish
  figures, preserving the faction tags, the 3-advisor cap, and the initial roster (Besteiro/
  Saborit/Negrín). Mapping highlights: Fernando de los Ríos→judiciary/constitutional, Gregorio
  Marañón→sexual-minority/women's rights & science, Julián Zugazagoitia→*El Socialista*/media,
  Largo Caballero→UGT organizing, Ramón González Peña→the Alianza Obrera militia, Santiago
  Carrillo→Socialist Youth, and the Prussia-Minister-President advisors reimagined around
  Catalonia (Vidiella→Generalitat, Galarza→regional public order, Araquistáin→autonomy from the
  left). **Revived the public-works economic plan** the flagship `economic_policy` card had lost
  (G-2 deleted it as dead code because nothing set `wtb_adopted`): the labor economist's adoption
  branch now sets it, and the public-works arm was rebuilt (Prieto's hydraulic/infrastructure
  works) — verified end-to-end. **Deleted the last 4 German `prussian_affairs*` files**, which G-5
  had kept alive only because three advisors linked to them. Advisor variable keys and scene
  filenames kept as opaque German identifiers (renaming would ripple across the roster and the
  faction bookkeeping for no gain). Found and fixed 4 more pre-existing uninitialized-variable
  bugs. Verified via dead-flag grep, compiled-output scan, headless load, and a Node sim
  exercising all 95 advisor `on-arrival` lines with zero NaN. **Out of scope:** advisor
  `card-image` portraits still point at German figures (Area K).

### J. Quality Displays & UI Text — *Size M · Partial rewrite*
- Rewrite the 23 `qdisplay` files. Some are generic (`confidence`, `dissent`, `militancy`, `loyalty`) and only need label tweaks; several are German-named (`schleicher_*`, `hindenburg_*`, `cvp_dnvp_balance`, `nazi_funds`) and need replacement with Spanish analogues (e.g. `army_conspiracy`, `cnt_militancy`, `catalan_relations`).
- Audit `status.scene.dry` / `status_right.scene.dry` for hard-coded German labels.

### K. Assets: Images & Music — *Size L · Replace* — 🟡 images done, pending human review; music deferred
- Source ~**385** period-appropriate, **license-clean** Spanish images (party posters, figures, photographs) to replace `out/html/img`, respecting the existing `credits_images.txt` model. Public-domain / CC sources and clear attribution required.
- Curate a Spanish/republican music set to replace `out/html/music` (e.g. *Himno de Riego*, *A las Barricadas*, UGT/PSOE anthems) with attention to licensing.
- Achievements: the `img/achievement/*` set and achievement definitions are German-themed and need Spanish redesign.
- **Note:** assets are the most license-sensitive area; flag for human review, don't auto-generate historical claims of provenance.
- **🟡 images functionally done** — see `docs/planning/K_assets.md` for full detail. Built
  `scripts/source_assets.mjs`, a pipeline that resolves a figure/subject's lead image via the
  Wikipedia pageimages API and verifies its license via Commons `imageinfo`/`extmetadata`,
  downloading and recording real provenance only for redistributable licenses (never fabricated,
  matching this section's own "flag for human review" note). Sourced 25 of 28 named-figure
  portraits and 4 topical/event images with verified provenance; repointed all 98 live
  `card-image:`/`set-bg:` references across 71 scene files onto `img/es/` or the shared
  placeholder — zero broken paths, zero known German-identifiable imagery on any live card.
  Visual inspection (not just filename-matching) confirmed and replaced the worst offenders — the
  Reichstag chamber and building, a 1929 Berlin street-fighting photo, a Berlin rally at the
  Lustgarten/Cathedral — with the Congreso de los Diputados facade and real period photos of
  Casas Viejas (1933) and the Asturias rising (1934); also correctly *kept* the 1864 First
  International emblem as historically apt rather than German-specific. Added two build-time
  guards to `smoke.js` (broken-image-path, credits-completeness) so both failure modes are
  permanent regressions, each proven to actually fire before being trusted. **Left for a human:**
  identity/subject sign-off on the 29 sourced files; 5 CC BY-SA (share-alike) sources needing a
  license-obligation check; 3 named figures and ~16 topical/poster items with no free Wikipedia
  image (needs Commons-category browsing, not a pageimage lookup); one portrait (Vidiella) is a
  group photo, not a solo shot. **Achievements and music remain fully deferred**, as originally
  scoped, to dedicated follow-ups.

### L. Localization, Naming & Flavor Consistency — *Size M · Rewrite*
- A global pass for tone/terminology: Spanish names, diacritics, party colors, date formats, and removing residual German strings (grep for `spd|nsdap|reichstag|hindenburg|schleicher|prussia` etc. across `source/`).
- Decide language policy: English narration with Spanish proper nouns (matches base game's English-with-German style) vs. a Spanish localization (larger scope — recommend English-first).

### M. Balancing, Playtesting & QA — *Size L · New/Ongoing*
- Re-tune every numeric threshold: election baselines, coup/insurrection clocks, faction drift rates, the end-state (July 1936) trigger conditions.
- Define win/lose/branch conditions analogous to the base game's endings (avert the coup? a different civil war? a stable Popular Front? PSOE-led republic?).
- Regression: ensure `dendrynexus make-html` stays green and core loops (turn → action → event → election → end) are reachable throughout the build.

---

## 5. Recommended Sequencing (for later detailed planning)

1. **Foundation:** A (scaffold) → B (state model) → C (election engine). Nothing else is stable until these settle variable names and the demographic/party model.
2. **Systems:** D (factions) → E (landscape) → F (the four new subsystems). F can be parallelized once B is fixed.
3. **Content:** G (policy cards) → I (advisors) → H (events, phased: spine first). J and L run alongside content.
4. **Presentation & polish:** K (assets) can start early in parallel (long lead time for sourcing/licensing) and finish late. M (balancing) is continuous, intensifying at the end.

**Minimum playable vertical slice** (good first milestone to de-risk): scaffold + state model + one working election (1931) + the yearly turn loop + a single end-state trigger (July 1936), with placeholder art. This proves the engine + mapping before the large content investment.

---

## 6. Key Risks & Open Questions

- **Scope discipline:** the base game grew to 77k lines over many versions. A faithful Spanish version could be as large. Phasing (playable spine → flavor) is essential; define an explicit MVP.
- **New-subsystem design cost (F):** anarchism, regionalism, agrarian, and army/church are where the base game gives least leverage — budget disproportionate design time here.
- **Asset licensing (K):** the single most likely blocker for public release. Resolve sourcing/licensing policy before mass-collecting images.
- **Historical framing:** the Spanish Civil War is politically sensitive; decide the intended tone/POV (the base game is sympathetic-to-SPD but historically grounded) up front so events are written consistently.
- **Naming residue:** hidden German strings in JS-heavy `on-arrival` blocks and qdisplays will surface only through play — budget QA time.
- ~~**Decision needed:** standalone build vs. mod via the existing `mod_loader`?~~ **Resolved: standalone total-conversion.**
- ~~**Decision needed:** end at the coup or epilogue into the war?~~ **Resolved: end at the July 1936 coup; war epilogue deferred as possible future scope.**

---

## 7. Summary Table

| Area | Size | Type | Blocks |
|---|---|---|---|
| A. Engine/build scaffold | S | Reuse | everything |
| B. Global state model | L | Rewrite | C–M |
| C. Election engine | L | Reweight | E, H, M |
| D. PSOE factions | M | Reweight | H, I |
| E. Party landscape | M | Rewrite | H |
| F. New subsystems (×4) | XL | New | G, H |
| G. Gov't affairs cards | L | Rewrite | H |
| H. Event corpus (378) | XL | Rewrite | — |
| I. Advisors | M | Rewrite | — |
| J. Quality displays/UI | M | Partial | — |
| K. Assets (img+music) | L | Replace | (parallel) |
| L. Localization/naming | M | Rewrite | — |
| M. Balancing/QA | L | New | (continuous) |

**Bottom line:** *Feasible and structurally well-suited* — the SPD-in-a-dying-republic framework is close to ideal for the PSOE story — **but it is a full total conversion**: reuse the engine and most mechanical systems, rebuild the entire content layer, and design four Spain-specific subsystems from scratch.
