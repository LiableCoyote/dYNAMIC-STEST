# Plan: Area I — Advisors / Cabinet

## Context

Area G finished the `government_affairs/` policy-card deck; the game plays end-to-end April
1931 → July 1936 with real Spanish content on every confirmed-reachable government-affairs
path. **Area I (advisors) is the next content area** — the design doc sequences it G → I → H,
and it has the strongest dependency pull of anything remaining:

- **The dropped WTB/public-works economic plan.** G-2 deleted roughly half of
  `economic_policy.scene.dry` because it was permanently unreachable dead code: the
  `wtb_adopted` flag it gated on is set nowhere, because the advisor chain that sets it
  (Woytinsky/Baade/Leipart) is unconverted German content. Area I revives it.
- **The 4 kept-alive `prussian_affairs*` files.** G-5 could not delete them because three
  unconverted advisors (`rosenfeld`, `severing`, `braun`) still `go-to` them. Area I converts
  those advisors and repoints the links, letting the dead German Prussia cards finally retire.

Of the 28 files in `source/scenes/advisors/`, **27 are still fully German** (only
`cabinet.scene.dry` was converted, by Area G, and is the reference template). The true surface
is a bit larger than the folder: it also includes the recruit roster in
`party_affairs/shuffle_leadership.scene.dry`, the `*_advisor` declaration block in
`root.scene.dry`, and — per the two locked decisions below — one Area-G file
(`economic_policy.scene.dry`) and Area F's Catalan subsystem.

**Three scope decisions are locked (confirmed with the user):**
1. **Reimagine the Prussia-coupled advisors around Catalonia** — not merely retire them. Braun,
   Rosenfeld, Severing, and the embedded Prussia-election blocks in Sender/Seydewitz get
   rebuilt around Area F's live `catalan_autonomy` / Generalitat subsystem
   (`government_affairs/catalan_affairs.scene.dry`), and their `prussian_affairs*` `go-to`s are
   repointed so those 4 German files can be deleted.
2. **Revive the WTB/public-works economic arm as part of Area I** — restore the adoption path in
   the economic advisor chain and rebuild the public-works arm of `economic_policy.scene.dry`
   (Prieto's hydraulic/infrastructure program) as live Spanish content.
3. **(House principle, not a fork) Keep the opaque identifiers German.** Advisor scene
   *filenames* (`woytinsky.scene.dry`) and their gate *variable keys* (`woytinsky_advisor`,
   `n_advisors`, the faction tags) are NOT renamed — only displayed `title:`/prose and the
   demographic/relation effect vars change. Renaming the keys would ripple across
   `shuffle_leadership.scene.dry`, `post_event.scene.dry`'s faction bookkeeping, and every
   card's own gate for zero functional gain (same call as "don't rename scene IDs" in CLAUDE.md).

---

> **Session handoff.** 🟡 **IN PROGRESS.** This is the detailed execution plan for
> **Area I** — converting the 28 advisor cards (+ the recruit roster) from Weimar German
> socialists into Second-Spanish-Republic PSOE figures, reviving the public-works economic
> plan, and retiring the last German Prussia machinery via a Catalan reimagining. Depth target:
> **rich, faithful Spanish rewrites**, consistent with Areas D/E/F/G.

## Execution status

- **I-0 (recon + baseline + mapping manifest):** ✅ done. Baseline `npm run build && npm run smoke`
  confirmed clean (`BUILD OK` → `SMOKE PASSED`) before any edits. Confirmed Area F's
  `rural_policy` declaration is present (`root.scene.dry:645`), so `baade` won't NaN. Re-grep
  confirmed 24 advisor files still carry German signatures (`cabinet.scene.dry` correctly absent —
  it's the converted template). **Confirmed the I-2 gap:** `grep` found nothing anywhere sets
  `wtb_adopted = 1`; only `party_affairs/campaigning.scene.dry` and `rally.scene.dry` *read* it, so
  the WTB/public-works plan is currently a permanently-unadoptable dead end — exactly what I-2
  revives. Figure-mapping table locked (see below; refinable per-figure during execution). Plan
  persisted to `docs/planning/I_advisors.md`.

- **I-1 (foundation + the 3 starting advisors):** ✅ done. Converted the three advisors hired at
  game start (live from turn 1): `wels`→**Julián Besteiro** (PSOE/UGT president, the centrist/
  Besteirista figurehead), `muller`→**Andrés Saborit** (veteran Besteirista, the coalition-
  negotiator card), `hilferding`→**Juan Negrín** (physiologist-turned-economist — a nice parallel
  to Hilferding the doctor-turned-economist; carries the ★ `fiscal_policy`/`economic_democracy`
  go-tos). Each card converted together with both its `shuffle_leadership.scene.dry` roster
  entries (the `@add_*` and `@remove_*` pairs) per the atomicity rule, plus the `root.scene.dry:
  1016-1056` declaration comments (keys kept German, comments now track the Spanish figure, with
  a header note explaining why the keys aren't renamed). Retargeted: `muller`'s coalition action
  now raises the live `izq_rep_relation`/`radical_relation` (the real Republican-Socialist
  partners) instead of the German `z`/`ddp`/`dvp`; `hilferding`'s two ministry go-tos re-gated to
  `finance_minister_party == "PSOE"` etc. with the dead `cvp_economy_accepted` clause dropped;
  all `spd_toleration`→`psoe_toleration`, `spd_in_government`→`psoe_in_government`,
  `workers_spd`/`unemployed_spd`→`industrial_psoe`/`unemployed_psoe`. Kept the engine-generic
  `advisor_action_timer`/`emergency_used` machinery and `wels`'s difficulty-gated easter-egg JS
  branches (prose de-Germanized). The `@snap_election` branches (gated `chancellor == "<figure>"`)
  are coherently inert in Spanish play — PSOE never holds the premiership — kept for structural
  parity with the figure name updated. **Verify:** `BUILD OK` → `SMOKE PASSED`; Node check
  confirmed all three cards' gates resolve true from the initial roster, `hilferding`'s ministry
  action-gates pass under the initial cabinet, and every exercised branch writes only pre-existing
  keys with zero NaN.

- **I-2 (economic chain + WTB/public-works revival):** ✅ done — the load-bearing stage.
  Converted the economic-chain advisors: `woytinsky`→**Trifón Gómez** (UGT economic-policy
  advocate), `baade`→**Lucio Martínez Gil** (FNTT landworkers' head, agrarian), `leipart`→
  **Francisco Largo Caballero** (UGT secretary-general), `wissell`→**Manuel Cordero** (labour
  legislation), `aufhauser`→**Anastasio de Gracia** (salaried-worker organizer). Sender/Schumacher
  deferred to their home stages (I-4/I-5) as whole-file conversions rather than split.
  - **The WTB/public-works revival (the cross-file mechanic):** restored the adoption path deleted
    across G-2/H2-1. `woytinsky`'s `@plan` branch (a dead end since H2-1 deleted its setter) now
    sets `wtb_adopted = 1; economic_plan = 1` on arrival, reframed as adopting the UGT public-works
    plan (Prieto's hydraulic/infrastructure program). Rebuilt the **public-works arm** in
    `government_affairs/economic_policy.scene.dry` (deleted by G-2 as dead code) as two new Spanish
    branches — `@public_works` and `@public_works_deficit`, gated `wtb_adopted == 1`, reusing the
    live `works_program` counter (lower `unemployed`, raise `economic_growth`/`inflation`; the
    deficit variant when `budget < 2`). The existing `@eco` deck gate (`economic_plan > 0`, set by
    G-2) and the `economic_policy` view-if already surface the card once any plan is adopted, so no
    `main.scene.dry` change was needed.
  - **Repointed the ★ policy links:** `woytinsky`/`@carry_out_policy` and `wissell`/`@labor_rights_`
    and `baade`/`@agriculture` re-gated to the live Spanish ministers (`finance`/`labor_minister_party
    == "PSOE"`; `baade` follows how `agricultural_policy` itself gates — on `psoe_in_government`,
    since agriculture is a coalition-partner ministry); `aufhauser`'s two branches route into the
    live `crisis_program.support_left`/`support_moderate` sub-scenes. Dropped `leipart`'s dead
    `@schleicher` ("Red General") branch that pointed at the G-5-retired `red_general` card.
  - **Fixed a latent bug:** `aufhauser`'s `moderate_economic_plan` `unavailable-subtitle` referenced
    a nonexistent var `moderate_economic_plan` (should be `moderate_plan_adopted = 1`) — corrected.
  - **Verify:** `BUILD OK` → `SMOKE PASSED`; a standalone Node **economic-path simulation** drove
    the full loop (crisis_program builds `wtb_points` to 160 → Gómez `@depression` → `@plan` gate
    passes → adoption flips `wtb_adopted`/`economic_plan` → `@eco` deck + `economic_policy` both
    surface → the `public_works` arm fires: `unemployed` 20→16, `works_program` 0→1) with zero NaN
    across every branch; grep confirmed zero German-signature tokens (only the asset `card-image`
    path remains, Area K).

- **I-3 (policy-linked advisors):** ✅ done. Converted the eight advisors that route into
  already-converted Area G/F policy cards: `radbruch`→**Fernando de los Ríos** (the real 1931
  Justice Minister → `judiciary`/`constitutional_reform`), `hirschfeld`→**Gregorio Marañón**
  (endocrinologist → `homosexual_rights`/`womens_rights`/`education_science.increase_science`),
  `breitscheid`→**Rodolfo Llopis** (moderate educator-internationalist → `international_relations`/
  `foreign_policy`), `leber`→**Juan-Simeón Vidarte** (PSOE executive, public-order/military watch →
  `military_policy` + the People's-Party broadening chain), `stampfer`→**Julián Zugazagoitia**
  (editor of *El Socialista* → `media` + the editorial-line/PCE-cooperation actions),
  `juchacz`→**Julia Álvarez Resano** (woman deputy → welfare/women's organizing),
  `mierendorff`→**Ramón González Peña** (Asturian miners' leader → the Alianza Obrera / worker-
  militia buildup, `confronting_nazis.iron_front`), `siemsen`→**María Lejárraga** (feminist educator
  → `rally.pacifism` + `education_science.curriculum`/`.structure`).
  - **Gate/link repointing:** all minister/coalition gates moved to the live Spanish forms
    (`justice_minister_party == "PSOE"`, etc.); where a card's own gate had changed in Area G/F,
    the advisor was matched to it (Marañón's `homosexual_rights` action uses G-3's live
    `progressive_support >= 30` computed var, not the dead `progressive_coalition >= 50`;
    Llopis's/`leber`'s/`siemsen`'s foreign/military/education actions gate on `psoe_in_government`,
    matching that those cards are reachable via PSOE's coalition influence rather than a PSOE-held
    ministry; siemsen's education gates dropped the dead `prussia_leader`/`chancellor_party=="SPD"`
    clauses). All demographic writes retargeted to the class matrix; `kpd_relation`→`pce_relation`;
    `Iron Front`/`Reichsbanner` → `Alianza Obrera` / UGT militia (`rb_strength`/`rb_militancy`,
    which are **undeclared** and would have NaN'd, retargeted to Area F's live `ugt_militia_strength`/
    `ugt_militia_militancy`; `nsdap_workers`→`industrial_falange`; `workers_spd_normalized`→the live
    `industrial_psoe_normalized`); dropped `leipart`-style dead German-plot branches where present.
  - **One more pre-existing uninitialized-variable bug found and fixed:** `workers_aid` (written by
    the welfare advisor's mutual-aid action) was never declared — now initialized in `root.scene.dry`.
  - **Verify:** `BUILD OK` → `SMOKE PASSED` (all ~16 `go-to` targets across the eight cards resolve —
    the build hard-errors on a dangling reference); Node check confirmed every effect-bearing branch
    writes only pre-existing keys with zero NaN and the ministry/coalition gates resolve true under
    the initial cabinet; grep confirmed zero German-signature tokens across all eight files.

- **I-4 (Catalonia reimagining + retire `prussian_affairs`):** ✅ done. Reimagined the five
  Prussia-coupled advisors around Area F's live Catalan subsystem, per the locked decision:
  `braun` (Prussia Minister-President)→**Rafael Vidiella** (Catalan socialist leader, the party's
  link to the Generalitat); `severing` (Interior/security)→**Ángel Galarza** (the PSOE figure who
  became Interior Minister); `rosenfeld` (left lawyer, Prussia)→**Luis Araquistáin** (the
  Caballerista theorist); `sender`→**Margarita Nelken** (left woman deputy); `seydewitz` (Socialist
  Youth)→**Santiago Carrillo** (FJS leader).
  - **The reimagining:** each `@prussian_bulwark` branch became a live Catalan-autonomy /
    Generalitat action routing into `government_affairs/catalan_affairs.scene.dry` (Vidiella pushing
    the Statute, Galarza coordinating regional public order, Araquistáin backing autonomy from the
    left) — the sub-scene id renamed `@prussian_bulwark`→`@regional_affairs` within each file. The
    large embedded German Prussia-election blocks (`@new_prussia_election`,
    `@center_right_coalition_prussia`) in `sender`/`seydewitz` were **deleted**, and their
    `@against_toleration` branches (plus `rosenfeld`'s) rebuilt around G-4's live 1936
    `psoe_toleration` withdraw-support mechanic (dropping the dead `in_*_prussia`/`prussia_leader`/
    `prussian_police_*` machinery and German party relations). Braun's two near-identical
    coalition branches collapsed to one, retargeted to the live IR/Radical partners; Carrillo's
    Socialist-Youth militancy retargeted off the undeclared `rb_strength`/`rb_militancy` onto Area
    F's `ugt_militia_*`.
  - **Retired the last German Prussia machinery:** with all three advisor `go-to`s repointed to
    `catalan_affairs` (and the two dead menu lines removed from the already-retired `red_general`),
    **deleted the 4 `prussian_affairs*.scene.dry` files** — G-5 had kept them alive solely because
    these advisors referenced them. The green build proves no dangling `go-to` survived (H2's
    self-checking property). The lone remaining reference is a harmless JS string-equality check in
    `easy_discard.scene.dry` (`card.id == "prussian_affairs_dvp"`), not a scene reference.
  - **One more pre-existing uninitialized-variable bug found and fixed:** `kpd_cooperation_seen`
    (guarded/incremented by the left lawyer's PCE-cooperation action) was never declared — the
    guard read `undefined` and the `+= 1` wrote NaN. Now initialized in `root.scene.dry`.
  - **Verify:** `BUILD OK` → `SMOKE PASSED` (scene count dropped by the 4 deleted files with no
    dangling references); Node check confirmed all reimagined branches (including both `psoe_toleration`
    withdraw-support paths and the Catalan gates) write only pre-existing keys with zero NaN; grep
    confirmed zero German-signature tokens (including `prussia`) across all five files.

- **I-5 (remaining advisors + structural cards + full roster sweep):** ✅ done. Converted the
  last four advisor cards: `levi`→**Julio Álvarez del Vayo** (PSOE-PCE unity), `pfulf`→**Matilde de
  la Torre** (women's rights + broadening), `wirth`→**Toribio Echevarría** (the "troll"/Catholic-
  outreach slot, reframed as a Basque worker-intellectual reaching observant Catholic workers),
  `schumacher`→**Amaro del Rosal** (UGT, workers' militias → the F-converted `reichsbanner`/"UGT
  Militia" card). `crispien` confirmed inert (a declaration with no card or roster entry — comment
  corrected).
  - **The full roster sweep:** `party_affairs/shuffle_leadership.scene.dry`'s ~19 remaining
    `@add_*`/`@remove_*` entries (I-1 had done only the 3 starters) converted to the Spanish figure
    names, descriptions, and action-hint lists via a scripted 131-replacement pass using full-phrase
    matches (never bare surnames, so the German `card-image` filenames — Area K — stayed intact).
    Faction descriptors on the remove lines reframed to the Spanish currents (Centrist→Besteirista,
    Reformist→Prietista, Leftist→Caballerista, Labor→UGT, Neorevisionist→anti-fascist). This closes
    the atomicity gap: every advisor card and its roster entry now show the same Spanish figure.
  - **Structural pinned cards:** `economic_policy_pinned.scene.dry`'s dead German gate
    (`spd_in_government`/`economic_minister_party == "SPD"`…) fixed to the live
    `psoe_in_government and finance_minister_party == "PSOE" and economic_plan > 0 and
    black_thursday_seen`, mirroring the `economic_policy` card. `shuffle_leadership_pinned.scene.dry`
    left as-is (neutral gate).
  - **One more pre-existing uninitialized-variable bug found and fixed:** `month_activities` (a typo
    for `month_actions`, the real monthly-action counter) was written by both pinned cards and the
    reshuffle scene but never declared — three `+= 1` writes that NaN'd every visit. All three
    corrected to `month_actions`.
  - **Verify:** `BUILD OK` → `SMOKE PASSED`; Node check confirmed the four cards' branches and the
    structural gates resolve with zero NaN; grep confirmed zero German names on any player-facing
    roster line (the only surviving German tokens are `card-image` asset filenames and the
    cross-file `reichsbanner` scene-id/var, both correctly left per the asset-path and don't-rename-
    scene-ids rules).

> **Audience: a Sonnet-class executor working cold.** Read `CLAUDE.md`,
> `docs/planning/B_state_schema.md`, `docs/planning/D_faction_semantics.md` (the faction
> semantics these advisors sit inside), and **`advisors/cabinet.scene.dry`** (the one already-
> converted card — your template) before touching anything. `npm run build && npm run smoke`
> after **every file**, trusting only `BUILD OK` immediately followed by `SMOKE PASSED`. As in
> Area G, the dominant failure mode is **not a compile error** — it is a silently-`NaN`-writing
> effect line (an `undefined += x` on a phantom German var) and a card that leaks German prose
> because it went live before its body was translated (see the atomicity rule below).

---

## How advisors work (the machinery to preserve)

- **Surfacing:** each advisor is an `is-pinned-card: true` scene tagged `tags: advisor, <faction>`.
  `main.scene.dry`'s hand scenes include `- #advisor` (lines ~1286 and ~2586), which expands to
  every `advisor`-tagged scene; each card's own `view-if: <name>_advisor = 1` decides whether it
  shows. There is no container deck — the tag include *is* the deck.
- **Action economy (keep as-is, engine-generic):** one global `advisor_action_timer`
  (`root.scene.dry:745`, init 0). Every advisor action sets `advisor_action_timer = 6` on
  arrival and gates on `choose-if: advisor_action_timer <= 0 and …`. `last_advisor_action` /
  `last_cabinet_action` are per-turn flags reset in `post_event.scene.dry:143-144`. **Do not
  touch this machinery — only rewrite content.**
- **Roster / hiring:** `party_affairs/shuffle_leadership.scene.dry` (~700 lines) is the recruit
  menu — add/remove option pairs each doing `X_advisor = 1; n_advisors += 1; <faction stat
  adjustments>`, capped at `n_advisors < 3`. Initial roster (`root.scene.dry:1016-1056`): **3
  start hired — `wels`, `muller`, `hilferding`** (so their cards are live from turn 1); all
  others `= 0`.
- **Passive faction effect:** `post_event.scene.dry:1368-1461+` recomputes per-faction advisor
  counts each turn from the `X_advisor` booleans and the `advisor,<faction>` tags. Because we
  keep both the keys and the tags, **this needs zero changes — confirm only.**

### The atomicity rule (the Area-I analogue of Area G's gate+body rule)
A card leaks German prose the moment it can be reached. Two triggers:
1. **The 3 initially-hired advisors** (`wels`/`muller`/`hilferding`) are live from turn 1 — convert
   them and their roster entries **first/together** (stage I-1).
2. **Every other advisor** is reachable the instant the player hires it from the roster. So convert
   **each advisor's card and its `shuffle_leadership` add/remove entry in the same commit.**
   Never translate the roster name while the card is still German, or vice versa.

---

## Scope: what Area I owns vs. defers

**Owns:**
- All 27 unconverted `advisors/*.scene.dry` cards (everything except `cabinet.scene.dry`).
- The 2 structural pinned cards in the folder: `economic_policy_pinned.scene.dry` (dead German
  gate → live `psoe`/`finance_minister_party == "PSOE"` gate) and `shuffle_leadership_pinned.scene.dry`
  (confirm; its gate is neutral).
- `party_affairs/shuffle_leadership.scene.dry` — the recruit roster's German names/prose (Area D
  deliberately left the add/remove lists for Area I; it only converted the faction-strength readout).
- `root.scene.dry:1016-1056` — the `*_advisor` declaration block (update the `// figure`
  comments; do **not** rename the keys).
- **`government_affairs/economic_policy.scene.dry`** — rebuild the public-works arm (decision 2).
- **The 4 `prussian_affairs*.scene.dry` files** — delete them once the 3 advisor `go-to`s are
  repointed (decision 1).

**Defers (do NOT touch):** the `advisor_action_timer`/`last_*_action` engine machinery;
`post_event.scene.dry`'s faction bookkeeping (confirm-only); qdisplays (Area J); `card-image`
asset paths (Area K); localization (L); balancing (M).

---

## Proposed Spanish figure mapping (starting table — refinable by the executor)

Keep each advisor in its existing **faction tag** (so `shuffle_leadership` stat effects and
`post_event` bookkeeping stay coherent); only the displayed figure + prose change. Names below
are a strong first draft; the executor may adjust for historical fit. **★ = mechanically load-
bearing** (the card `go-to`s a specific converted policy card, or drives the WTB/Catalan wiring),
so the *role* must be preserved even if the name changes.

| File (keep name) | Faction tag | German figure | → Proposed Spanish figure / role |
|---|---|---|---|
| `wels` | centrist | Otto Wels (chairman) | Julián Besteiro — party figurehead |
| `muller` | centrist | Hermann Müller | Andrés Saborit / Manuel Cordero (Besteirista) |
| `hilferding` ★ | centrist | Rudolf Hilferding | ★ finance figure → **fiscal_policy** / **economic_democracy** |
| `crispien` | centrist | Arthur Crispien | Manuel Cordero |
| `sender` ★ | left | Toni Sender | Margarita Nelken — left organizer + women (★ Catalan/toleration branches) |
| `levi` | left | Paul Levi | Julio Álvarez del Vayo — left unity / PCE cooperation |
| `rosenfeld` ★ | left | Kurt Rosenfeld | ★ Catalan-left figure → **catalan_affairs** (Prussia reimagined) |
| `seydewitz` ★ | left | Max Seydewitz | Santiago Carrillo — Socialist Youth (★ Catalan/toleration branch) |
| `pfulf` | centrist-alt | Antonie Pfülf | Matilde de la Torre — women / People's-Party chain |
| `breitscheid` ★ | centrist-alt | Rudolf Breitscheid | ★ foreign figure → **foreign_policy** |
| `severing` ★ | reformist | Carl Severing | ★ public-order/Catalan figure → **police** + **catalan_affairs** |
| `braun` ★ | reformist | Otto Braun (Prussia MP) | ★ regional-autonomy figure → **catalan_affairs** (Prussia reimagined) |
| `juchacz` | reformist | Marie Juchacz | Julia Álvarez Resano — welfare / women |
| `baade` ★ | reformist | Fritz Baade | ★ agrarian → **agricultural_policy** (Ricardo Zabalza, FNTT) |
| `leipart` ★ | labor | Theodor Leipart | ★ UGT federation → economic chain (Trifón Gómez / Anastasio de Gracia) |
| `aufhauser` ★ | labor | Siegfried Aufhäuser | ★ white-collar UGT → **crisis_program** left/moderate branches |
| `woytinsky` ★ | labor | Wladimir Woytinsky | ★ **the public-works economist** → sets `wtb_adopted` (Juan Negrín) |
| `wissell` ★ | labor | Rudolf Wissell | ★ Labor Ministry → **labor_rights** (Francisco Largo Caballero) |
| `mierendorff` ★ | neorevisionist | Carlo Mierendorff | ★ anti-fascist mobilization → **confronting_nazis** / Alianza Obrera |
| `leber` ★ | neorevisionist | Julius Leber | ★ military affairs → **military_policy** |
| `schumacher` ★ | neorevisionist | Kurt Schumacher | ★ mobilization/fundraising → militia buildup |
| `wirth` | neorevisionist | Joseph Wirth | Catholic-republican outreach ("troll" slot) |
| `radbruch` ★ | non-factional | Gustav Radbruch | ★ Justice Ministry → **judiciary** / **constitutional_reform** (Fernando de los Ríos) |
| `hirschfeld` ★ | non-factional | Magnus Hirschfeld | ★ sexology/science → **homosexual_rights** / **womens_rights** (Gregorio Marañón) |
| `stampfer` ★ | non-factional | Friedrich Stampfer | ★ press → **media** (Julián Zugazagoitia, *El Socialista*) |

The economic-chain WTB champion (`woytinsky`) and the Labor-Ministry advisor (`wissell`) both
point at the public-works/labor program; the card *content* should name **Indalecio Prieto** as
the public-works figurehead even though he is not himself an advisor slot.

---

## Effect-line retargeting (same rules as Area G)

Every demographic write moves from a phantom German cell to a live class-matrix cell
(`root.scene.dry:293-345`): `workers_spd→industrial_psoe`, `new_middle_spd→urban_middle_psoe`,
`old_middle_spd→smallholder_psoe`, `rural_spd→landless_psoe`, `unemployed_spd→unemployed_psoe`,
`catholics_spd→catholic_psoe`; `*_nsdap→*_falange`, `*_z→*_ceda`, `*_ddp→*_izq_rep`,
`*_dvp→*_radical`, `*_dnvp→*_monarchist`, `*_kpd→*_pce`, `*_other→*_other`. Relations:
`z_relation→ceda_relation`, `dvp→radical`, `ddp→izq_rep`, `kpd→pce`, `hindenburg_angry→president_angry`.
**Drop** excised-splinter knobs (`dvp_right`, `ddp_cohesion`, `lvp_*`, `reichsbanner`/`rb_*` unless
retargeted to Area F's live militia vars, `nazi_urgency` only if a live consumer exists) and dead
plot machinery (`schleicher_*`, `bruning_*`, `spd_toleration→psoe_toleration`). **The NaN rule:**
every write-target must already exist in `root.scene.dry` — `grep` before trusting; declare a new
var (the F-0 idiom) only when a reimagined branch genuinely needs one.

---

## Stage order and why

**I-0 (recon + mapping manifest) → I-1 (foundation + the 3 starting advisors) → I-2 (the economic
chain + WTB revival) → I-3 (policy-linked advisors) → I-4 (the Catalonia reimagining + retire
`prussian_affairs`) → I-5 (remaining flavor advisors + structural cards) → I-6 (verify + docs).**

- **I-1 first:** the 3 turn-1-live advisors + the roster frame establish the per-advisor rhythm
  and the atomicity discipline on the lowest-risk, highest-visibility cards.
- **I-2 next, alone:** the WTB revival is the one cross-file, mechanically-load-bearing piece
  (advisor + `crisis_program` + `economic_policy` + the `@eco` deck all have to agree); it earns
  its own stage and its own economic simulation.
- **I-3 middle:** the ~8 advisors that just repoint into already-converted Area G/F cards — rich
  but mechanically routine once the pattern is set.
- **I-4:** the judgment-heavy Catalonia reimagining and the `prussian_affairs` deletion — do it
  once the rhythm is second nature; deletion is self-checking (dendrynexus hard-errors on a
  dangling `go-to`, so a green build proves the repoints are complete).
- **I-5:** the remaining flavor/faction advisors + the 2 structural pinned cards.
- **I-6:** full sweep + behavioral sim + docs.

Stageable and pausable — each stage is an independent, verified, committable unit. Commit per
advisor or per small faction group.

---

## Stage details

### I-0 · Recon + baseline + the mapping manifest
Confirm a clean `npm run build && npm run smoke`. Confirm Area F's `rural_policy` declaration
(F-0) is present in `root.scene.dry` (else `baade` NaNs). Re-grep the advisor surface to lock
scope: `grep -rlE 'spd_in_government|_spd\b|prussia|schleicher|bruning|reichsbanner' source/scenes/advisors/`.
Finalize the figure-mapping table (names + faction homes + the ★ load-bearing repoints). Confirm
the WTB wiring: `wtb_concept` is set by `party_affairs/campaigning.scene.dry`/`rally.scene.dry`
(Area E), `wtb_support`/`wtb_points` built by `crisis_program.scene.dry`, and nothing currently
sets `wtb_adopted` (the gap I-2 closes). **Verify:** build+smoke green (no edits); commit this
plan to `docs/planning/I_advisors.md` with the pending banner.

### I-1 · Foundation + the 3 starting advisors
Convert `wels`, `muller`, `hilferding` (live from turn 1) + their `shuffle_leadership` add/remove
entries + the `root.scene.dry:1016-1056` declaration comments, together. Convert the
`shuffle_leadership.scene.dry` menu frame prose (Add/Remove headers, the faction-strength framing).
`hilferding` ★ repoints to `fiscal_policy`/`economic_democracy` (already Area-G-converted) — fix
its gate (`finance_minister_party == "PSOE"`) and drop the dead `cvp_economy_accepted` clause.
**Verify:** build+smoke after each file; a Node check that the 3 cards' gates resolve true from
the initial roster and every branch writes only pre-existing keys, no `NaN`.

### I-2 · The economic chain + WTB/public-works revival
The load-bearing stage. Convert `woytinsky`, `baade`, `aufhauser`, `leipart`, `wissell` (+ the
economic branches of `sender`/`schumacher`). Then close the WTB loop:
- **Restore adoption:** `woytinsky`'s `@plan` branch (currently a dead end — its `go-to` was
  deleted by H2-1) sets `wtb_adopted = 1; economic_plan = 1` on arrival, reframed as adopting
  Prieto's public-works / hydraulic-infrastructure plan. Keep its `choose-if` shape
  (`wtb_points >= 160`, `labor_strength >= center/left_strength`, `black_thursday_seen`).
- **Rebuild the arm:** re-add a public-works arm to `government_affairs/economic_policy.scene.dry`
  gated on `wtb_adopted == 1` (or `economic_plan == 1`), as Spanish content (reuse the live
  `works_program` counter; lower `unemployed`, raise `economic_growth`/`inflation`; deficit
  branches touch `budget`). This is new content, not a revert — G-2 deleted the German version.
- **Confirm the deck:** `main.scene.dry`'s `@eco` gate (`view-if: economic_plan > 0`, set by G-2)
  already surfaces the card once any plan is adopted — verify `economic_plan = 1` reaches it.
- `wissell` ★ → `labor_rights`; `baade` ★ → `agricultural_policy`; `aufhauser` ★ →
  `crisis_program.support_left`/`support_moderate` (repoint, fix gates).
**Verify:** build+smoke; a **standalone Node economic simulation** — seed real `Q`, drive
`crisis_program` support-labor → `woytinsky.@plan` → the new `economic_policy` arm, assert
`wtb_adopted`/`economic_plan` flip, `works_program` rises, `unemployed` falls, zero `NaN`, and the
compiled `@eco` path surfaces with no German token.

### I-3 · The policy-linked advisors
The advisors that `go-to` already-converted Area G/F cards: `radbruch` ★ (→ `judiciary`/
`constitutional_reform`), `hirschfeld` ★ (→ `homosexual_rights`/`womens_rights`), `breitscheid` ★
(→ `foreign_policy`), `leber` ★ (→ `military_policy`), `siemsen` (→ `education_science`/`rally`),
`stampfer` ★ (→ `media`), `juchacz` (→ welfare/women), `mierendorff` ★ (→ `confronting_nazis`/
Area F militia). For each: fix the gate to the live Spanish minister/government var, repoint the
`go-to` if the target id changed, retarget effect lines, rewrite prose. **Verify:** build+smoke
per file; Node gate+NaN check; confirm each `go-to` target exists in `out/game.json`.

### I-4 · The Catalonia reimagining + retire `prussian_affairs`
Reimagine `braun`, `rosenfeld`, `severing` and the embedded Prussia-election blocks in `sender`/
`seydewitz` around Area F's live Catalan subsystem (`catalan_autonomy`, `basque_autonomy`,
`catalonia_leader`, the `*_banned_catalonia` militia flags — see `catalan_affairs.scene.dry`).
The `@prussian_bulwark` branches become Generalitat/Statute-of-Autonomy branches; the dead
`in_*_prussia`/`prussia_leader`/`prussian_police_*` machinery is dropped; the `@against_toleration`
blocks reframe onto G-4's live 1936 `psoe_toleration` mechanic. **Repoint all `prussian_affairs*`
`go-to`s** (in `severing`, `braun`, `rosenfeld`) to `catalan_affairs` or the new inline branches,
then **`git rm` the 4 `prussian_affairs*.scene.dry` files.** **Verify:** build+smoke (a green build
proves no dangling `go-to` survives the deletion — the self-checking property from H2); Node check
the reimagined branches write live `catalan_autonomy`/relation vars, no `NaN`.

### I-5 · Remaining flavor advisors + structural cards
Convert the rest: `levi`, `seydewitz` (non-Prussia branches), `pfulf`, `crispien`, `wirth`,
`schumacher` (remaining branches). Fix `economic_policy_pinned.scene.dry`'s dead German gate to
the live `psoe`/`finance_minister_party == "PSOE"` form (mirror `economic_policy`'s own gate).
Confirm `shuffle_leadership_pinned.scene.dry` is neutral (leave). Watch `wels`'s raw-JS branches
(`currentHands` manipulation, `difficulty`-gated easter eggs) — convert prose, leave the JS shape.
**Verify:** build+smoke after each; grep confirms no live advisor still carries a German gate.

### I-6 · Verification sweep + docs
- **Dead-flag grep** over `advisors/` + `shuffle_leadership.scene.dry`: zero
  `spd_in_government`/`_minister_party == "SPD"`/`prussia`/`schleicher`/`spd_toleration` on any
  live card.
- **Compiled-output German-token scan** (`out/game.json`) across every advisor scene-id: zero
  `Germany|Weimar|Reichstag|NSDAP|Hindenburg|Schleicher|Brüning|SPD|KPD|Reichsbanner|Prussia`.
- **Headless Chromium `--dump-dom` load**: no `Uncaught`/`ReferenceError`/`TypeError`.
- **Standalone Node behavioral simulation** (the signature bar): seed real `Q`; for each advisor,
  drive its `on-arrival` and every reachable branch; assert every effect-line LHS is a pre-existing
  key (no `NaN`) and each gate resolves true under the right hired/government state. Include the
  full I-2 economic path (crisis_program → adopt → economic_policy arm) and a hire-from-roster
  round-trip (`shuffle_leadership` add → card goes live).
- **Docs:** write `docs/planning/I_advisors.md`'s Execution-status section (per-stage, house
  style); flip its banner to ✅; update `CLAUDE.md` (reading list + status-at-a-glance → Area I
  done; how-to-continue → J/K/L/M); update the design doc's §I.

---

## Verification (standing protocol — never claim a card works without exercising it)
1. `BUILD OK` immediately followed by `SMOKE PASSED` after **every file**.
2. Per-card Node check: gate resolves true under the right hired/government state; every branch
   writes only pre-existing Spanish keys; zero `NaN`.
3. The I-2 economic-path simulation (crisis_program → Woytinsky adopt → economic_policy arm →
   `@eco` deck surfaces) — the one genuinely cross-file mechanic.
4. Dead-flag + German-token grep over owned files; compiled-output scan; headless load.
5. The load-bearing assertion: after Area I, opening the advisor pinned strip and the recruit
   roster shows Spanish figures; hiring one surfaces a Spanish card; the public-works economic
   plan is selectable and reaches the (revived) `economic_policy` arm; no card shows German prose
   or writes `NaN`.

---

## Deferred / out of scope for Area I
- The `advisor_action_timer`/`last_*_action` engine machinery and `post_event.scene.dry`'s faction
  bookkeeping (confirm-only — keeping the keys/tags means no edits).
- qdisplays (Area J — already has flagged `nsdap_r`/`hindenburg_angry` debt); `card-image` asset
  paths (Area K); localization (L); balancing (M).
- Any advisor figure-name the user wants changed at approval (the mapping table is a proposal).
- The two H2/G loose ends unrelated to advisors (`status_right.scene.dry` reachability; the
  `@post_election_1928` interleaved dead block; `coalition_affairs`'s inert `set_next_election_time`).
