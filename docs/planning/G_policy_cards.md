# Plan: Area G — Policy-Card Content

> **Session handoff.** 🟡 **IN PROGRESS.** This is the detailed execution plan for
> **Area G** — converting the `government_affairs/` policy-card deck from Weimar German content
> into Second-Spanish-Republic content. Areas B/E/F/H built the engine, the party landscape, the
> four new subsystems, and the playable spine; they touched exactly **4** of the 38
> `government_affairs` cards (`military_policy`, `agricultural_policy`, `catalan_affairs`,
> `religious_policy`). The other ~20 live-but-German policy cards still gate on the dead flag
> `spd_in_government` (or a German minister-party string) and write phantom pre-rename variables —
> so they never appear, and would show German prose and silently write `NaN` if they did. Area G
> makes the Government Affairs deck real. **Two scope decisions were assumed at plan time** (the
> clarifying-question tool failed): (1) **rich, faithful Spanish rewrites** matching real 1931–36
> policy and figures, consistent with Areas D/E/F; (2) **reimagine the cards with a genuine
> Spanish analogue, retire the ones without.** Adjust these at approval if desired.

> **Audience: a Sonnet-class executor working cold.** Read `CLAUDE.md`,
> `docs/planning/B_state_schema.md`, and **`docs/planning/F_new_subsystems.md`** (F's
> `agricultural_policy.scene.dry` conversion is the exact template for this whole area) before
> touching anything. `npm run build && npm run smoke` after **every file**, trusting only
> `BUILD OK` immediately followed by `SMOKE PASSED`. The dominant failure mode here is **not a
> compile error** — it is a silently-`NaN`-writing effect line (an `undefined += x` on a phantom
> German var) and a card that leaks German prose because its gate was flipped live before its body
> was translated. The guardrails below repeat on purpose.

## Execution status

- **G-0 (recon + manifest):** ✅ done. Baseline `npm run build && npm run smoke` confirmed clean
  (`BUILD OK` → `SMOKE PASSED`) before any edits. Re-grep of the dead-flag signature against
  `government_affairs/` reproduced the plan's inventory exactly: 25 hits (the 23-card conversion
  pool + the 4 `prussian_affairs*` dead/superseded, with `domestic_enemies` also hit — see finding
  below), directory listing confirmed 38 `.scene.dry` files + the stray `blank_4.scene_alt.dry`
  (39 total). `@eco` (`main.scene.dry:2630-2636`) confirmed `view-if: 0`. The pinned Cabinet gate
  (`advisors/cabinet.scene.dry:5`) confirmed dead (`in_spd_majority or …chancellor_party = "SPD"…`,
  none true in Spanish play).
  - **Correction to the plan's scope table found during recon:** `domestic_enemies.scene.dry` is
    **not** actually inert. Its own header comment ("`# this is not a card...`") only means it's
    not drawn by the `#govt_affairs` tag directly (`is-card:`/`tags:`/`new-page:` are all
    commented out) — but `government_affairs/police.scene.dry` (a live G-4 target once its gate is
    fixed) menu-links straight into it: `- @domestic_enemies: Investigate or ban our domestic
    enemies.` and `- @deport_hitler` (police.scene.dry:18-19). Once `police`'s gate goes live,
    both `domestic_enemies` and `deport_hitler` become reachable through it regardless of their
    own headers. **Folded into G-4/G-5:** `domestic_enemies` will be reimagined alongside `police`
    (banning Falangist squads / Carlist Requetés / CNT-FAI direct-action cells, reusing Area F's
    live `falange_relation`/`monarchist_relation`/`anarchist_strength`/`anarchist_militancy`/
    `anarchist_insurrection`/`army_loyalty`/`coup_progress` axes instead of the dead SA/Stahlhelm/
    RFB `*_banned` machinery); `deport_hitler` has no Spanish analogue and will be retired
    (`view-if: 0` + inline flag) with its menu line removed from both `police` and
    `domestic_enemies`, per the plan's existing G-5 disposition for it.

- **G-1 (labor & fiscal bloc):** ✅ done. Converted `labor_affairs.scene.dry`,
  `labor_rights.scene.dry`, `fiscal_policy.scene.dry` — all three gates flipped from dead
  `spd_in_government=1 and *_minister_party="SPD"` to live `labor_minister_party ==
  "PSOE"` / `finance_minister_party == "PSOE"`. Reframed: `labor_affairs` as a Catalan
  textile lockout the new *jurados mixtos* (mixed arbitration boards) must resolve;
  `labor_rights` as the eight-hour-day enforcement + Asturian mine/factory safety +
  unemployment-relief sub-flow (explicitly noting in the prose that Spain never had
  Germany's insurance system — a patchwork of municipal relief committees instead);
  `fiscal_policy` as Prieto's tax/tariff balancing act, with the tariff branch reframed
  around smallholder wheat/olive growers vs. Catalan export industry rather than the
  original reparations-era diplomacy. All demographic writes retargeted to the live
  class matrix (`industrial_psoe`, `smallholder_psoe`, `urban_middle_psoe`,
  `unemployed_psoe`, `industrial_pce`, etc.); all relations retargeted
  (`radical_relation`, `izq_rep_relation`, `ceda_relation`, `pce_relation`,
  `monarchist_relation`); excised-splinter party-internal knobs (`dvp_right`,
  `ddp_cohesion`, `lvp_*`, `*_ideology` chains beyond the two that still exist —
  `ceda_ideology`/`radical_ideology`) and the dead German goal-tracking scaffolding
  (`labor_goal_spd`, `goal_spd_cancel*`, `pro_labor`, `finance_goal_completed`, etc. —
  confirmed via `post_event.scene.dry:3843-4043` to be entirely gated behind the
  never-true `Q.spd_in_government`, i.e. already-inert content debt per
  `BC_election_engine_execution_plan.md:105`'s "leave them, they're harmless" call) were
  dropped rather than carried forward or renamed.
  - **Two real pre-existing bugs found and fixed** (both silent-NaN traps predating
    Area G): `Q.labor_rights_timer` was listed in the `Q.timers`/`Q.rubicon_timers`
    decrement arrays but was **never initialized**, so its `<= 0` gate could never
    resolve true; and `strike_term_seen` (the once-per-parliamentary-term gate on
    `labor_affairs`, reset every election in `events/election_1928.scene.dry:1198`) was
    also never initialized at game start. Both now initialized in `root.scene.dry`
    alongside `labor_affairs_seen`/`working_hours`/`workers_safety` (also newly
    declared, both previously-uninitialized write targets).
  - **Verify:** `BUILD OK` → `SMOKE PASSED` after each of the three files; a standalone
    Node check (seeding real `Q.*` literals from `root.scene.dry`) confirmed all three
    gates resolve true under the initial Republican-Socialist cabinet and every one of
    the 18 branches across the three cards writes only pre-existing keys with zero NaN;
    grep confirmed zero remaining `spd_in_government`/`_minister_party=="SPD"`/`_spd`/
    `_ddp`/`_dvp`/`_lvp`/`_kvp`/`_dnvp`/`_nsdap` tokens in the three files.

- **G-2 (Economic Policy flagship + `@eco`):** ✅ done. Converted
  `economic_policy.scene.dry` (279 → 232 lines) and `economic_democracy.scene.dry`, then
  flipped `main.scene.dry:2630`'s `@eco` deck from `view-if: 0` to `view-if: economic_plan
  > 0`, matching the card's own gate.
  - **Key recon finding that reshaped this stage:** the WTB/Lautenbach public-works arm
    (`@economic_plan_dilemma`, `@lautenbach_continuation`, `@lautenbach_wtb`, `@wtb_2`,
    `@wtb_2_deficit`, `@wtb_continuation`, `@implement_wtb_no_deficit`,
    `@implement_wtb_deficit` — roughly half the original file) was **already permanently
    unreachable before Area G touched it**: it's gated on `wtb_adopted`/
    `lautenbach_adopted`, and a full-codebase grep confirmed neither is ever set to 1
    anywhere (only read/compared) — dead machinery orphaned by an unconverted advisor
    path (Area I: Woytinsky/Baade/Aufhauser/Sender/Schumacher). Per the plan's own
    "drop deferred German-plot machinery with no Spanish home" guidance, this whole arm
    was deleted rather than reframed — it could never have fired regardless of gate
    fixes. The two genuinely-reachable arms — the **left/nationalization plan**
    (`nationalization_adopted`, set by the already-Area-E/D-converted
    `party_affairs/crisis_program.scene.dry`'s `adopt_left` branch) and the **moderate
    Prietista job-creation plan** (`moderate_plan_adopted`, same file's `adopt_moderate`
    branch) — were fully converted: demographic writes retargeted to the class matrix,
    relations retargeted to `radical_relation`/`izq_rep_relation`/`ceda_relation`/
    `pce_relation`, `reichswehr_*`/`schleicher_spd`/`z_leader == "Kaiser"`/
    `kpd_leader == "Conciliators"` German-plot conditionals dropped, `hindenburg_angry`→
    `president_angry`, the Reichsbanner-strength unlock on the confrontational
    `empower_workers` branch retargeted to Area F's live `ugt_militia_militancy`. The
    `austerity` submenu's `industrial_levy` branch (originally gated on
    `young_plan_ratified`, also confirmed dead the same way) was reframed as a standalone
    "special levy on capital" always available once black_thursday_seen, dropping the
    dead gate rather than porting it. `economic_democracy.scene.dry`'s gate fixed to
    `psoe_in_government and (economic_minister_party == "PSOE" or finance_minister_party
    == "PSOE") and labor_minister_party == "PSOE"`; its works-councils progression
    reframed as Spanish factory committees (*comités de fábrica*); dropped the dead
    `cvp_economy_accepted`/`kpd_leader`/`kpd_ultimatum_timer` conditionals.
  - **Four more previously-uninitialized write targets found and declared** (same class
    of bug as G-1's two): `works_councils`, `government_salaries_cut`, `industrial_levy`,
    `economic_democracy`, and `cooperatives` were all read/written across these two files
    (and, for `works_councils`, also referenced from the already-converted
    `agricultural_policy.scene.dry`) but never initialized in `root.scene.dry`. All five
    now declared alongside the G-1 additions.
  - **Verify:** `BUILD OK` → `SMOKE PASSED` (scene count dropped 823 → 815 confirming the
    8 dead WTB sub-scenes were removed cleanly with no dangling `go-to` targets); a
    standalone Node check confirmed both cards' gates resolve true under the initial
    cabinet, the `@eco` deck gate is false pre-plan-adoption and true post-adoption, and
    all 11 exercised branches (moderate + left/nationalize + economic-democracy paths)
    write only pre-existing keys with zero NaN; grep confirmed zero German-signature
    tokens (`_spd`, `wtb_`, `lautenbach`, `reichswehr`, `schleicher`, `Germany`,
    `Weimar`, `Brüning`, `Reichsbank`) remain in either file.

- **G-3 (rights & justice bloc):** ✅ done. Converted `judiciary.scene.dry`,
  `constitutional_reform.scene.dry`, `womens_rights.scene.dry`, `homosexual_rights.scene.dry`.
  `judiciary` reframed around the Tribunal de Garantías Constitucionales purging
  monarchist-holdover judges (gate → `justice_minister_party == "PSOE"`).
  `constitutional_reform` reframed around two real, mechanically-apt 1931-36 debates
  instead of the original's Bonn-Basic-Law-inspired ideas (its own header comment
  admitted as much: *"based on the bundesrepublik basic law... not sure if it's totally
  realistic"*): tempering the 1931 electoral law's *premio de mayoría* (directly relevant
  given Area C's own election engine already models that law) and curbing President
  Alcalá-Zamora's Article 81 dissolution power (a real, historically-loaded 1935-36
  controversy — the Cortes stripped him of the presidency in April 1936 partly over this).
  The anachronistic third branch (a West German "constructive vote of no confidence",
  invented decades after this era in either setting) was dropped rather than forced into
  a Spanish frame; so was the `bundesrepublik`/`Adenauer` German easter-egg ending.
  `womens_rights` kept its four-branch structure (workplace, family law, welfare,
  liberalization) but grounded the intro in the real 1931 suffrage fight (Prieto's
  opposition, women getting the vote in the Constitution) and reframed the abortion
  branch as general family-planning liberalization contested by the CEDA rather than the
  Center Party. `homosexual_rights` reframed around real Second Republic legal history —
  the 1932 Penal Code's actual (quiet) decriminalization of private acts, threatened by
  the incoming 1933 Ley de Vagos y Maleantes (vagrancy law) — dropping the Röhm-scandal
  `heuchelei` achievement/branch entirely (no Spanish equivalent).
  - **A load-bearing new mechanic:** both `womens_rights` and `homosexual_rights`
    originally gated their most contested branches on `progressive_coalition >= 50`, a
    var computed in `events/election_1928.scene.dry` — but that computation
    (`spd_r + kpd_r + ddp_r/lvp_r + sapd_r`) sums three permanently-dead/excised vars
    (`kpd_r`, `ddp_r`/`lvp_r`, `sapd_r` were never live Spanish keys), making it **always
    NaN**, and `NaN >= 50` is always false. This is the same "interleaved dead block"
    `H2_bulk_cleanup.md`'s H2-4 already found and deliberately left alone rather than
    risk surgery on load-bearing election math. Rather than depend on a value that can
    never resolve true (which would have silently dead-ended both cards' best content),
    both files now compute their own self-contained `progressive_support` in a local
    on-arrival JS block (`psoe_r + pce_r + izq_rep_r*0.5`, threshold 30 — initial value
    ≈32.5, so reachable from turn one) instead of reading the broken engine-level
    `progressive_coalition`. `election_1928.scene.dry` itself was not touched.
  - **One more pre-existing bug found and fixed:** `constitutional_reform_timer` was in
    the `Q.timers`/`Q.rubicon_timers` arrays but never initialized (same bug class as
    G-1's `labor_rights_timer`). Also newly declared: `progressive_support`,
    `abortion_rights`, `womens_work`, `family_law`, `homosexual_rights`,
    `repealed_1928_code`, `resisted_vagrancy_law`, `trans_rights` — all read/written by
    these cards but absent from `root.scene.dry`.
  - **Verify:** `BUILD OK` → `SMOKE PASSED` after each file (scene count 815 → 810,
    the `@heuchelei` sub-scene and three now-redundant menu branches removed cleanly, no
    dangling `go-to` targets); a standalone Node check confirmed all four gates resolve
    true under realistic seeded state (including both `reform_support` JS-block formulas
    in `constitutional_reform` and the new `progressive_support` formula), all 15
    exercised branches write only pre-existing keys with zero NaN; grep confirmed zero
    German-signature tokens in all four files.

---

## Context

The player reaches policy cards through the **Government Affairs deck** — `@govt` in
`main.scene.dry:2597`, gated `view-if: time >= 6`, whose body is the single tag-expansion line
`- #govt_affairs`. Any scene tagged `govt_affairs` with a passing `view-if:` is automatically
eligible; there is **no queue and no registration** — a card is live the instant its `view-if`
passes. That is the crux of Area G: **every remaining card is kept off the deck only by its own
dead gate.** The moment you flip `spd_in_government → psoe_in_government`, the card goes live on
`@govt` — so **the gate fix and the body conversion must land together, per card, in the same
commit**, or German content leaks to the player.

Three surfacing routes exist for a card, and Area G must treat them as one unit:
1. **`@govt` deck** (`#govt_affairs`, gate `time >= 6` — live). The primary route.
2. **The pinned Cabinet card** (`advisors/cabinet.scene.dry`, body `- #cabinet`) — dual-surfaces
   any `tags: govt_affairs, cabinet` card. **Its gate is currently dead** (`in_spd_majority or
   (in_emergency_government and chancellor_party = "SPD") or (in_left_front and chancellor_party =
   "SPD")` — none true in Spanish play), so this route never fires today. A one-line gate fix
   (G-5) revives it; its one line of German prose ("With an SPD chancellor…") needs a reword.
3. **The dedicated `@eco` Economic Policy deck** (`main.scene.dry:2630`, `view-if: 0` — hard-off,
   flagged in Area H pending this area). Re-enabled in G-2 once `economic_policy` is converted.

**Timers are already handled.** Every existing `government_affairs` card's `<name>_timer` is
already registered in **both** `Q.timers` and `Q.rubicon_timers` (`root.scene.dry:659-709`) and
initialized to 0 (`:752-772`), and decremented by the two loops in `post_event.scene.dry:828-832`
and `:1029-1035`. Since Area G converts **existing** cards (keeping their timer names), **no timer
registration work is needed** — unless you split a card into a new file with a new timer, in which
case register it in both arrays (the F-2 lesson).

---

## The gate-conversion rule (the central mechanical insight)

The initial April-1931 cabinet (`root.scene.dry:572-587`) assigns portfolios thus: **PSOE holds
justice (De los Ríos), labor (Largo Caballero), and finance (Prieto)**; the others are IR
(war/Azaña), Radical (foreign/Lerroux), DLR (interior/Maura), ERC (economy), PRRS
(agriculture/Domingo); and **PSOE never holds the chancellorship** (Alcalá-Zamora → Azaña →
Lerroux). So each card's dead gate converts by this rule:

| Dead German gate | Portfolio holder | Convert to |
|---|---|---|
| `justice_minister_party == "SPD"` | PSOE | `justice_minister_party == "PSOE"` (faithful, reachable 1931–33) |
| `labor_minister_party == "SPD"` | PSOE | `labor_minister_party == "PSOE"` |
| `finance_minister_party == "SPD"` | PSOE | `finance_minister_party == "PSOE"` |
| `economic_minister_party == "SPD" or finance_minister_party == "SPD"` | ERC / PSOE | `finance_minister_party == "PSOE"` (drop the ERC disjunct, or keep as `economic_minister_party == "PSOE"` future-proofing) |
| `interior_minister_party == "SPD"` (police) | DLR | `psoe_in_government` (PSOE never holds interior initially) |
| `chancellor_party == "SPD"` (womens/homosexual/shuffle/education) | — | drop the clause; gate on `psoe_in_government` |
| bare `spd_in_government` | — | `psoe_in_government` |
| `spd_toleration` (the 3 toleration cards) | — | `psoe_toleration` (live: set by `coalition_formation`'s 1936 Caballerista branch) |
| dead coalition disjuncts `in_weimar_coalition` / `in_grand_coalition` / `in_left_front` | — | replace with `in_republican_socialist` / `in_popular_front` (live) or drop |

Preserve **live cross-dependency gates** unchanged (e.g. `judicial_reform >= 2`, `neorevisionism`,
`democratization`, `coalition_dissent >= 1`, `land_reform` — all live Spanish/generic vars).

**Effect-line retargeting** (the F `agricultural_policy` template, `F_new_subsystems.md:39-46`):
every demographic write must move from a phantom German cell to a **live class-matrix cell**
(`root.scene.dry:293-345`, the `Q.classes × Q.parties` grid). Class rename:
`workers→industrial`, `new_middle→urban_middle`, `old_middle→smallholder`, `rural→landless`,
`unemployed→unemployed`, `catholics→catholic`. Party rename: `spd→psoe`, `nsdap→falange`,
`z→ceda`, `ddp→izq_rep`, `dvp→radical`, `dnvp→monarchist`, `kpd→pce`, `other→other`. So
`workers_spd += 3*(1-dissent)` → `industrial_psoe += 3*(1-dissent)`; `new_middle_nsdap` →
`urban_middle_falange`; etc. **Drop** excised-splinter references entirely (`lvp_*`, `bvp_*`,
`*_cohesion`, `*_left`/`*_right` party-internal knobs). Retarget relations
`z_relation→ceda_relation`, `dvp_relation→radical_relation`, `ddp_*→izq_rep_*`,
`kpd_relation→pce_relation`; `hindenburg_angry→president_angry`. **Drop or reframe** deferred
German-plot machinery with no Spanish home (`wtb_*`, `lautenbach_*`, `young_plan_*`,
`nationalize_budget`, `in_left_front`, `kpd_coalition_dissent`).

**The NaN rule:** every var a converted line *writes* must already be initialized in
`root.scene.dry`, or `undefined += x` silently yields `NaN` (and any later `.toFixed()` on it
throws). `grep` each write-target in `root.scene.dry` before trusting it; the 48 class-matrix
cells and all the scalars below already exist. Only declare a genuinely-new var (the F-0 idiom)
if a reimagined card needs one.

**Live vars cards may freely use** (all in `root.scene.dry`): the 48 `<class>_<party>` cells;
`budget`, `unemployed`, `inflation`, `economic_growth`, `works_program`, `land_reform`,
`rural_policy`, `capital_strike_progress`, `coup_progress`; faction `*_strength`/`*_dissent`
(`left/center/labor/reformist/neorevisionist/social_patriot`); relations
`izq_rep_relation`/`pce_relation`/`radical_relation`/`ceda_relation`/`monarchist_relation`/`falange_relation`;
`pro_republic`, `nationalism`, `socialism`, `radicalization`, `democratization`, `president_angry`,
`coalition_dissent`, `dissent`; government flags `psoe_in_government`, `psoe_toleration`,
`in_republican_socialist`, `in_radical_ceda`, `in_popular_front`; the Area-F subsystem axes
(`church_relation`, `clerical_conflict`, `catalan_autonomy`, `basque_autonomy`, `anarchist_*`,
`africa_army`, `army_loyalty`, militia strengths).

---

## Scope: what Area G owns vs. defers

**The 38-file `government_affairs/` inventory splits into:**

- **Already Spanish — DO NOT TOUCH (4):** `military_policy`, `agricultural_policy`,
  `catalan_affairs`, `religious_policy` (Area F).
- **Dead/superseded — retire or delete, no conversion (11):** the 4 `prussian_affairs*` (already
  flagged superseded by F-4, gate on never-initialized `*_prussia` coalition vars); the 7
  `blank*` "Missing Report" Schleicher fillers (gate on dead `chancellor == "Schleicher" and
  schleicher_spd_influence >= N`); **plus the stray `blank_4.scene_alt.dry`** (extension
  `.scene_alt.dry`, invisible to `*.scene.dry` tooling — do not forget it).
- **Live-but-German — Area G's conversion pool (23):**
  - **PSOE-portfolio cards** (gate → `_minister_party == "PSOE"`): `judiciary`, `labor_affairs`,
    `labor_rights`, `fiscal_policy`, `economic_policy`, `economic_democracy`.
  - **`psoe_in_government`-gated cards**: `social_welfare`, `police`, `womens_rights`,
    `homosexual_rights`, `constitutional_reform`, `education_science`, `coalition_affairs`,
    `shuffle_cabinet`, `war_guilt`.
  - **Toleration trio** (`spd_toleration → psoe_toleration`): `dealing_with_toleration`,
    `dealing_with_toleration_right`, `dealing_with_toleration_cvp`.
  - **Specials** (reimagine-or-retire): `foreign_policy`, `red_general`, `deport_hitler`,
    `rubicon_filler`.
  - **Non-card**: `domestic_enemies.scene.dry` — its `is-card: true` is commented out, it has no
    `tags:` line and never touches its own timer (header says "this is not a card"). **Confirm and
    leave** — not a conversion target.

**Area G does NOT own:** `advisors/*` (Area I) — except the single one-line gate fix to
`advisors/cabinet.scene.dry` to revive the pinned Cabinet surface (a display-binding fix in the
Area-F-touched-`status.scene.dry` precedent, flagged as such); `qdisplays` (Area J); assets
(Area K); the `main.scene.dry` flavor-trigger block (deferred German cosmetic content). Area G
touches `main.scene.dry` **only** to re-enable the `@eco` deck (one `view-if` line).

---

## The six guardrails (memorize; they recur in every stage)

1. **Gate + body convert together.** Never flip a card's `view-if` to a live Spanish gate in one
   commit and translate the body in another — the card goes live on `@govt` the instant the gate
   passes. One card = one atomic conversion = one `build`+`smoke`.
2. **Build discipline.** `npm run build && npm run smoke` after every file; trust only `BUILD OK`
   then `SMOKE PASSED`. (`build.js` already forces recompilation — the H2 fix.)
3. **The NaN rule + the class matrix.** Every effect-line LHS must be a pre-existing Spanish key
   (`grep` `root.scene.dry`). Demographic writes go to the live `<class>_<party>` cells, never to
   phantom `workers_spd`/`new_middle_nsdap`. The `*(1-dissent)` multiplier stays on demographic
   writes.
4. **Do not touch the flagged/out-of-scope files.** The 4 Area-F cards, the advisor roster
   (Area I) beyond the one cabinet gate fix, qdisplays (Area J).
5. **`.dry` syntax.** Bare `//` only inside `{! ... !}`; `#`-prefixed lines are valid content
   comments; a stray `//` between header properties is a hard compile error.
6. **Verify by exercising.** A card "works" only when a standalone Node check confirms (a) its
   gate resolves true under the right live government state so it can appear, and (b) every branch
   writes only pre-existing keys with no `NaN`. Never claim a card works because it compiled.

---

## Stage order and why

**G-0 (recon + manifest) → G-1 (labor & fiscal) → G-2 (the Economic Policy flagship + `@eco`) →
G-3 (rights & justice) → G-4 (security & coalition + toleration) → G-5 (reimaginings, retirements,
cleanup, cabinet-surface fix) → G-6 (verify + docs).**

- **G-1 first:** the labor/fiscal cards sit on PSOE-held portfolios (labor = Largo Caballero,
  finance = Prieto) — the cleanest gate conversions and the clearest real-history content, a
  low-risk warm-up that establishes the per-card conversion rhythm.
- **G-2 next, alone:** `economic_policy` is the flagship (279 lines, 21 `@` sub-scenes, three
  strategy arms) and the most numerically load-bearing card in the folder; it earns its own stage,
  and finishing it is what lets the `@eco` deck be re-enabled.
- **G-3/G-4 middle:** the rights/justice and security/coalition blocs — rich but mechanically
  routine once G-1 sets the pattern.
- **G-5 late:** the reimaginings and retirements are the judgment-heavy, lowest-uniformity work;
  do them once the mechanical rhythm is second nature. Fold in the cabinet-surface gate fix and
  the dead-filler cleanup here.
- **G-6 last:** the full sweep + the behavioral sim + docs.

This is a large area (~20 conversions + a 279-line flagship); it is **stageable and pausable** —
each stage is an independent, verified, committable unit. Commit per card or per small group.

---

## Stage details

### G-0 · Recon + baseline + the conversion manifest

Confirm a clean `npm run build && npm run smoke`. Re-grep the dead-flag signature across
`government_affairs/` to lock the scope list and catch anything this plan missed:
`grep -rlE 'spd_in_government|spd_toleration|_minister_party *== *"SPD"|chancellor_party *== *"SPD"'`.
Write down, per card, its gate-conversion target (the table above) and its
convert / reimagine / retire disposition. Confirm `domestic_enemies.scene.dry` is a non-card.
Confirm the `@eco` deck (`main.scene.dry:2630`) is `view-if: 0` and the pinned Cabinet gate
(`advisors/cabinet.scene.dry:5`) is dead. **Verify:** build+smoke green (no edits yet); commit
this plan to `docs/planning/G_policy_cards.md` with the pending banner.

### G-1 · The labor & fiscal bloc

`labor_affairs`, `labor_rights`, `fiscal_policy` (all PSOE-held portfolios — the faithful,
reachable set). Reframe around real 1931–33 PSOE ministerial policy:
- **`labor_affairs`** (Largo Caballero, Labour Minister): the *jurados mixtos* (mixed arbitration
  boards), the eight-hour day, the *términos municipales* law, rural labour contracts. Gate →
  `labor_minister_party == "PSOE" and labor_affairs_timer = 0 and strike_term_seen = 0`.
- **`labor_rights`** (follow-on, gated on `labor_affairs_seen`): collective bargaining, the right
  to strike, UGT vs CNT tension (ties to Area F's anarchist axis).
- **`fiscal_policy`** (Prieto, Finance Minister): tax reform, the budget, the gold reserves. Gate
  → `finance_minister_party == "PSOE"`.
Retarget every demographic effect line to the class matrix (`industrial_psoe`, `unemployed_psoe`,
`smallholder_psoe`, `landless_psoe`, …) and every relation to Spanish parties; keep
`budget`/`unemployed`/`inflation`/`economic_growth`/`works_program`/`coalition_dissent`.
**Verify:** build+smoke after each file; a Node check that each gate passes under the initial
Republican-Socialist cabinet and every branch writes only pre-existing keys, no `NaN`.

### G-2 · The Economic Policy flagship + re-enable `@eco`

`economic_policy.scene.dry` (279 lines, 21 `@` sub-scenes) + `economic_democracy.scene.dry`.
Reframe the three strategy arms onto Spanish equivalents:
- **WTB/Lautenbach public-works arm** → Prieto's/Largo Caballero's public-works and hydraulic/
  infrastructure program (reuse the live `works_program` counter).
- **Nationalization/socialization arm** → the collectivization & works-council debate (the
  Caballerista left vs Prietista pragmatism — ties to Area D factions), reusing
  `capital_strike_progress`/`coup_progress` as the "provoke the right" checks.
- **Moderate/austerity arm** → orthodox budget-balancing under Prieto.
Retarget all `new_middle_spd`/`workers_spd`/`old_middle_spd`/`rural_spd`/`*_nsdap` writes to
`urban_middle_psoe`/`industrial_psoe`/`smallholder_psoe`/`landless_psoe`/`*_falange`; drop the
`wtb_*`/`lautenbach_*`/`young_plan_*`/`nationalize_budget` machinery (replace derived-budget
`on-arrival` seeds with plain `budget` math, or declare a minimal Spanish counter in
`root.scene.dry` only if a branch genuinely needs one — the F-0 idiom). Fix the card's own gate
(`finance_minister_party == "PSOE" ... and economic_plan > 0`). Then **flip the `@eco` deck**
(`main.scene.dry:2632`) from `view-if: 0` to the same live gate, and update the explanatory
comment above it. **Verify:** build+smoke; a **standalone Node economic simulation** — seed real
`Q` start values, run each strategy arm's `on-arrival`, assert the live economic scalars move in
the right direction (works program lowers `unemployed`, raises `inflation`/`economic_growth`;
nationalization raises `capital_strike_progress`/`coup_progress`) with zero `NaN`; confirm the
`@eco` deck now surfaces the card and no German token remains in the compiled scene.

### G-3 · The rights & justice bloc

`judiciary`, `constitutional_reform`, `womens_rights`, `homosexual_rights` — the richest real
1931–36 content in the folder:
- **`judiciary`** (De los Ríos, Justice): the *Tribunal de Garantías Constitucionales*, purging
  monarchist judges, jury reform. Gate → `justice_minister_party == "PSOE"`.
- **`constitutional_reform`**: the 1931 Constitution itself — **Article 26** (Church/religious
  orders, ties to F's `religious_policy`), regional autonomy (ties to F's `catalan_affairs`),
  property/nationalization clauses. Keep the live `judicial_reform >= 4` / `neorevisionism` gates;
  swap the dead German coalition disjuncts for `in_republican_socialist`/`in_popular_front`.
- **`womens_rights`**: the 1931 women's-suffrage debate — **Clara Campoamor vs Victoria Kent**, a
  genuine PSOE/republican internal split (a real, load-bearing choice, not flavor). Gate → drop
  `chancellor_party == "SPD"`, use `psoe_in_government`.
- **`homosexual_rights`**: the 1932 Penal Code (the vagrancy-law provisions). Gate →
  `psoe_in_government and homosexual_rights < 3`; drop the German `progressive_coalition`/`cvp_*`
  clauses.
Retarget effects to the class matrix + Spanish relations + `democratization`/`pro_republic`.
**Verify:** build+smoke per file; Node gate+NaN check.

### G-4 · Internal security, coalition management, and toleration

- **`police`** ("Internal Security" — the Assault Guard vs the Civil Guard, public order, the *Ley
  de Defensa de la República*; ties to F's Casas Viejas). Gate → `psoe_in_government` (interior is
  DLR, not PSOE).
- **`social_welfare`**: unemployment relief, pensions, the eight-hour day's welfare corollaries.
  Gate → `psoe_in_government`.
- **`coalition_affairs`** (managing the coalition when `coalition_dissent >= 1`): retarget to the
  live Spanish partners (IR/Radical in 1931–33; IR/PCE in the Popular Front) and the live
  `in_republican_socialist`/`in_popular_front` flags.
- **The toleration trio** (`dealing_with_toleration`, `_right`, `_cvp`): reframe as the **1936
  Caballerista confidence-and-supply mechanic** — when PSOE supports the Popular Front government
  from outside (`psoe_toleration = 1`, set by `coalition_formation`'s `pf_tolerate` branch), the
  government being tolerated is Azaña's IR-led cabinet (gate `chancellor_party == "IR"`, not
  `"Z"`). If the three variants collapse to one Spanish card, retire the other two (`view-if: 0` +
  flag) rather than porting all three.
- Confirm `domestic_enemies` is a non-card; leave it, or mark it inert with a one-line flag.
**Verify:** build+smoke; Node check that the toleration card gates true under a simulated
`psoe_toleration = 1` Popular-Front state.

### G-5 · Reimaginings, retirements, cleanup, and the cabinet surface

- **`war_guilt` → the Responsibilities Commission**: Spain was neutral in WWI, so reimagine as the
  Republic's real *Responsabilidades* process — the parliamentary inquiry into the **Annual
  disaster (1921)** and the culpability of the monarchy and the Primo de Rivera dictatorship. Keep
  the timer/tag; new Spanish body; gate `psoe_in_government`.
- **`foreign_policy` → non-intervention & the League**: reframe Versailles/reparations/Austria as
  Spain's 1931–36 foreign relations — the League of Nations, relations with Portugal (Sanjurjo's
  exile after the 1932 rising), France, and the rising German/Italian threat. Drop
  `reparations_*`/`reichskonkordat`/Dollfuß machinery; retarget effects to live vars. Gate →
  `psoe_in_government` (foreign is Radical initially; the card can note PSOE's influence on
  foreign policy from within the coalition).
- **`education_science` → the secular-school program**: Marcelino Domingo and the mass
  school-building drive, the *Misiones Pedagógicas*, university reform (ties to F's
  `religious_policy` on secular vs religious education). Gate → drop `chancellor_party == "SPD"`
  and the dead `prussia_leader` clause; use `psoe_in_government`.
- **`shuffle_cabinet`**: with `coalition_formation` (Area H) now driving all government changes,
  a manual cabinet-shuffle card is largely redundant. **Recommend retire** (`view-if: 0` + flag);
  or a light Spanish "reshuffle within the coalition" if desired. (H2 already neutralized its dead
  route into the deleted German ministries tree.)
- **Retire (no Spanish analogue, `view-if: 0` + inline flag, the F `response_to_antisemitism`
  idiom):** `red_general` (entirely about Schleicher), `deport_hitler` (no analogue that
  `military_policy` doesn't already cover). Leave `rubicon_filler` as-is (its `rubicon` gate is
  off in normal Spanish play) or lightly de-German its generic filler prose.
- **Dead-filler cleanup:** the 7 `blank*` "Missing Report" cards + the stray `blank_4.scene_alt.dry`
  are confirmed dead (Schleicher gates). Either delete them (consistent with H2's deletion pass —
  they're surfaced by tag only, so deletion just shrinks the pool and cannot dangle a reference)
  or mark them `view-if: 0` + flag. **Recommend delete.** The 4 `prussian_affairs*` are already
  flagged superseded — leave as-is (or delete alongside).
- **Revive the pinned Cabinet surface:** fix `advisors/cabinet.scene.dry:5`'s dead gate to a live
  equivalent (e.g. `psoe_in_government and (justice_minister_party == "PSOE" or labor_minister_party
  == "PSOE" or finance_minister_party == "PSOE")`) and reword its one German line ("With an SPD
  chancellor and SPD cabinet members…"). Flag inline as an Area-G display-binding fix into an
  Area-I file, matching F's precedent of touching `status.scene.dry`.
**Verify:** build+smoke after each; grep confirms retired cards carry `view-if: 0`; the compiled
`@govt`/`@eco`/`#cabinet` surfaces resolve.

### G-6 · Verification sweep + docs

- **Dead-flag grep sweep** over `government_affairs/` + the two touched files: zero
  `spd_in_government` / `spd_toleration` / `_minister_party == "SPD"` / `chancellor_party == "SPD"`
  on any live (non-retired) card.
- **Compiled-output German-token scan** (`out/game.json`) across every converted scene-id:
  zero `Germany|Weimar|Reichstag|NSDAP|Hindenburg|Schleicher|Brüning|WTB|Young Plan|Versailles`.
- **Headless Chromium `--dump-dom` load**: no `Uncaught`/`ReferenceError`/`TypeError`.
- **Standalone Node behavioral simulation** (the signature bar): seed real `Q` start values from
  `root.scene.dry`; for each converted card, drive its `on-arrival` and every reachable
  branch/`choose-if`; assert (a) every effect-line LHS is a pre-existing key (no `NaN` written),
  and (b) the card's gate resolves true under the correct live government state (initial
  Republican-Socialist cabinet for the PSOE-portfolio cards; `psoe_toleration = 1` Popular Front
  for the toleration card) so it can actually surface. Directional spot-checks (a labor card
  raises `industrial_psoe`, lowers `industrial_ceda`/`falange`; a public-works economic choice
  lowers `unemployed`).
- **Docs:** write `docs/planning/G_policy_cards.md`'s Execution-status section (per-stage, files
  touched, gate/effect retargets, bugs found, out-of-scope flags — the F/H2 house style). Update
  `CLAUDE.md` (reading list + status-at-a-glance → Area G done; how-to-continue → Areas I/J/K/L/M)
  and the design doc's §G.

---

## Verification (standing protocol — never claim a card works without exercising it)

1. `BUILD OK` immediately followed by `SMOKE PASSED` after **every file**.
2. The **per-card Node check**: gate resolves true under the right live government state; every
   branch writes only pre-existing Spanish keys; zero `NaN`.
3. **Dead-flag + German-token grep** over owned files → zero unexpected hits on live cards.
4. **Compiled-output scan** of `out/game.json` across converted scene-ids → no German residue.
5. **Headless Chromium load** → no JS errors.
6. The **load-bearing assertion**: after Area G, opening the Government Affairs deck (`time >= 6`,
   PSOE in government) surfaces Spanish policy cards and the Economic Policy deck is reachable — no
   card shows German prose, none writes `NaN`.

---

## Deferred / out of scope for Area G

- `advisors/*` beyond the one `cabinet.scene.dry` gate/line fix (Area I); `qdisplays` (Area J);
  assets/`card-image`s (Area K); localization (Area L); balancing (Area M).
- The `main.scene.dry` flavor-trigger block and any deep German cosmetic prose outside the policy
  cards themselves.
- Any card reimagining the user declines at approval (e.g. if `foreign_policy`/`war_guilt` are to
  be retired rather than rebuilt, or the depth is set to "lean mechanical").
- New economic/labor *subsystems* beyond faithful card conversion — Area M / a later content pass.
