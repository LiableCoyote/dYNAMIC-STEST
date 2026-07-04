# Design Document — "Dynamic Social Democracy: Spanish Republic"

**Working title:** *Social Democracy: The Spanish Republic* (a total-conversion of *Social Democracy: An Alternate History*)

**Premise:** Re-set the game in the **Second Spanish Republic**, playing the **PSOE** (Partido Socialista Obrero Español) through the turbulent republican years, ending on the eve of / at the outbreak of the **Spanish Civil War (July 1936)** — structurally analogous to the base game, where the SPD navigates the collapse of Weimar and the game ends with Hitler taking power.

**Purpose of this document:** Assess feasibility and break the work into **general areas of effort**. Each area is intentionally high-level; Claude Code can later expand any single area into a detailed implementation plan. This is a scoping/architecture document, **not** an implementation plan.

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

**Timeline shift:** base game runs ~1928→1934 (≈6 years). Spain would run **April 1931 → July 1936** (≈5 years), with an optional epilogue into the war's opening.

---

## 4. Areas of Effort

Each area is a candidate for its own detailed Claude Code planning pass. Ordered roughly by dependency. **Size** = relative build effort (S/M/L/XL). **Type** = Reuse / Reweight / Rewrite / New.

### A. Engine, Build & Project Scaffolding — *Size S · Reuse*
- Fork/duplicate repo, rename package (`social_democracy` → new id), update `info.dry`, `README`, `modinfo`, credits scaffolding.
- Confirm `dendrynexus make-html` builds cleanly; set up a repeatable local build + smoke-test loop.
- Decide mod-vs-standalone: base game has a `mod_loader` — decide whether the conversion ships as a standalone build or leverages the mod system.
- **Deliverable for planning:** build/CI recipe, naming conventions, asset-path strategy.

### B. Global State Model Redesign — *Size L · Rewrite (of `root.scene.dry`)*
- Rewrite the `on-arrival` init block: dates (1931 start), the `classes`/`parties` arrays, all faction vars, all relation vars, paramilitary rosters, state-force rosters, national-opinion axes.
- Re-source demographic weights from Spanish data (heavy rural/landless share; low industrial share vs Germany).
- Define new axes needed by Spanish subsystems (see F): `anarchist_strength`, `catalan_autonomy`, `land_reform`, `clerical_conflict`, `army_loyalty`, `africa_army`.
- **This is the linchpin.** Almost every other area reads/writes these variables, so its variable naming and semantics must be settled early.

### C. Election & Demographic Engine — *Size L · Reweight + Retarget*
- Keep the `classes × parties` matrix architecture (it is genuinely reusable and elegant).
- Replace class list to reflect Spain: e.g. `industrial_workers`, `landless_laborers (braceros)`, `smallholders`, `petite_bourgeoisie`, `middle_class`, `catholics`, `regional_nationalists` — reweighted toward the countryside.
- Replace party list with the Spanish roster (§3) and rebuild per-class baseline support tables from Spanish electoral history (1931/1933/1936).
- Model Spain's electoral specifics: the **1933 majoritarian bloc-list law** that punished a divided left and rewarded coalitions — a first-class mechanic (it *is* the story of why the Popular Front formed).
- Retime the election calendar (`set_next_election_time*`).
- **Depends on:** B.

### D. Party & Faction System (PSOE internals) — *Size M · Reweight*
- Remap the six-faction model to PSOE's real factional geometry (Caballerista left / Prietista centre / Besteirista right / UGT / youth (FJS) radicalization).
- Rewrite `party_affairs/ideology.scene.dry` options and the ideology sliders to Spanish debates: revolution-vs-reform, collaboration with bourgeois republicans, the "bolshevization" of the FJS, fusion with the PCE (the real 1936 JSU merger).
- Rewrite the other `party_affairs` cards (fundraising, media, rallies, inter-party relations, streetfighting, etc.) to Spanish context.
- **Depends on:** B.

### E. Political Landscape: Parties, Leaders & Relations — *Size M · Rewrite*
- Define each Spanish party as a data + behavior bundle: leaders, ideology tags, relation baseline, coalition willingness, splinter/merger events.
- Model the key dynamics: Radical–CEDA governments of the Bienio Negro; the Popular Front pact; CEDA's push for power (the trigger analogous to "Hitler as chancellor"); monarchist/military conspiracy accretion.
- **Depends on:** B, C.

### F. New Spain-Specific Subsystems — *Size XL · New*
These have **no base-game analogue** and are the most design-intensive:
1. **Anarcho-syndicalism (CNT-FAI):** a large, non-electoral revolutionary bloc the player cannot recruit but must manage — insurrections (1932 Alt Llobregat, Jan/Dec 1933, Casas Viejas), general strikes, abstention-vs-participation swings that decide elections. Needs its own strength/militancy/insurrection model.
2. **Regional autonomy (Catalonia, Basque Country):** statutes of autonomy, ERC alliance, the Oct 1934 Catalan declaration, Basque-Catholic-but-autonomist cross-pressure. Extends but exceeds the Prussia mechanic.
3. **Agrarian/land question:** latifundia, land reform (IRA), the *braceros*, and the right's rollback — a dedicated policy axis with electoral and unrest consequences.
4. **Church–military–Africa axis:** anticlericalism (church burnings 1931), the Sanjurjada (1932), the Africanista officer corps, and the accreting July-1936 conspiracy as the end-state clock.
- **Recommendation:** plan each of the four as a **separate** detailed pass; each is comparable to a mid-size base-game system.

### G. Government Affairs (policy card deck) — *Size L · Rewrite*
- Rework the 37 `government_affairs` cards to Spanish policy space: land reform, church-state separation, Catalan statute, military reform (Azaña's), public order law, education (lay schools), labor (jurados mixtos).
- Preserve the card/action-economy structure (`is-card`, `month_actions`, timers, `view-if` gating) — that framework is reusable.
- **Depends on:** B, F.

### H. Event Content (the bulk) — *Size XL · Rewrite*
- The 378 event scenes are the largest single body of work. They must be **replaced**, not translated, because they encode specific German event chains.
- Build a **new event corpus** organized around the Spanish timeline: 1931 constituent Cortes & constitution; 1932 Sanjurjada & Catalan statute; 1933 election & Casas Viejas; 1934 October revolution; 1935 corruption scandals (Straperlo) & CEDA crisis; 1936 Popular Front & the slide to July.
- Reuse **structural templates** from the base game: yearly turn events (`1931.scene.dry` pattern), election events, coalition-formation events, party-congress events, coup/civil-war trigger events. The *shapes* port; the *content* does not.
- **Strong candidate for phased delivery:** ship a playable spine (yearly events + elections + end-state) first, then flesh out optional/flavor event chains.
- **Depends on:** B–G.

### I. Advisors / Cabinet — *Size M · Rewrite*
- Replace all 28 advisors (named German socialists) with Spanish figures: Largo Caballero, Prieto, Besteiro, Negrín, De los Ríos, Araquistáin, Zugazagoitia, etc., each with an advice/action card and stat effects.
- Preserve the advisor-card and "pinned cabinet" framework.

### J. Quality Displays & UI Text — *Size M · Partial rewrite*
- Rewrite the 23 `qdisplay` files. Some are generic (`confidence`, `dissent`, `militancy`, `loyalty`) and only need label tweaks; several are German-named (`schleicher_*`, `hindenburg_*`, `cvp_dnvp_balance`, `nazi_funds`) and need replacement with Spanish analogues (e.g. `army_conspiracy`, `cnt_militancy`, `catalan_relations`).
- Audit `status.scene.dry` / `status_right.scene.dry` for hard-coded German labels.

### K. Assets: Images & Music — *Size L · Replace*
- Source ~**385** period-appropriate, **license-clean** Spanish images (party posters, figures, photographs) to replace `out/html/img`, respecting the existing `credits_images.txt` model. Public-domain / CC sources and clear attribution required.
- Curate a Spanish/republican music set to replace `out/html/music` (e.g. *Himno de Riego*, *A las Barricadas*, UGT/PSOE anthems) with attention to licensing.
- Achievements: the `img/achievement/*` set and achievement definitions are German-themed and need Spanish redesign.
- **Note:** assets are the most license-sensitive area; flag for human review, don't auto-generate historical claims of provenance.

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
- **Decision needed:** standalone build vs. mod via the existing `mod_loader`?
- **Decision needed:** end at the coup (mirror base game) or continue an epilogue into the war's first weeks?

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
