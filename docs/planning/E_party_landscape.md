# Plan: Area E — Political Landscape (Parties, Leaders & Relations)

> **Session handoff.** ✅ **Executed and verified.** E-1 through E-6 are all done, including
> the two scope-boundary calls E-3 had to make mid-execution (see "Execution status" below).
> Build + smoke green throughout; full verification sweep (grep, compiled-output scan,
> headless load, standalone-Node behavioral spot-check) passed. See "Execution status" for
> exact commits/findings.

## Execution status

**✅ DONE — E-1 through E-6.**
- **E-1:** `inter_party_relationships.scene.dry` fully rebuilt around the real Spanish party
  geometry (Republican Left/Radical Party/CEDA/PCE/monarchists/Falange), branching on the
  live national coalition-state flags (`in_republican_socialist`, `in_radical_ceda`,
  `in_popular_front`, `in_workers_alliance`) instead of hardcoded German chancellor-name
  checks. The `wacky_weimar` easter-egg (DNVP "wholesome"/Harzburg-Front apparatus + the
  German-splinter parliament-SVG block) was stripped rather than ported.
- **E-2:** `enemies.scene.dry` rebuilt around Spanish opponents (the combined anti-Republican
  extremes, the authoritarian right, the Falange alone, the PCE alone, the republican
  parties). Also fixed a `view-if: year <= 1930` that made the card permanently unreachable
  in a game starting in 1931 (same bug class as Area D's `neorevisionism.scene.dry` find) →
  widened to `year <= 1933`.
- **E-3:** the 7 generic party-ops cards (`campaigning`, `media`, `fundraising`,
  `party_organizations`, `rally`, `international_relations`, `crisis_program`) had the
  rename maps applied and German prose de-Germanized. Two files turned out more entangled
  with the militia subsystem than the plan anticipated — see "Findings during execution."
- **E-4:** `library.scene.dry`'s `@demographics` (six German class paragraphs → the six live
  Spanish class-matrix rows, dropping "Jews" — no Spanish equivalent) and `@parties` (full
  German splinter-party roster → the eight Spanish parties) rewritten. `@government` and
  `@weimar_timeline` deliberately left untouched (Area H/L timeline debt, per the plan).
- **E-5:** `peoples_party.scene.dry` + `peoples_party_campaigning.scene.dry` reframed as the
  PSOE *obrerismo*-vs-broadening debate (Prietista/anti-fascist-mobilization vs.
  Caballerista/Besteirista), mechanic unchanged. Achievement id (`volkspartei`) kept — its
  display text is Area K/L's job.
- **E-6:** full verification sweep run (see "Verification performed" below); `CLAUDE.md` and
  the design doc's §E updated; this file's status banner flipped to ✅.

**Findings during execution (scope calls made, not pre-decided in the plan):**
1. **`rally.scene.dry`'s SA-disruption/police-protection subplot** (`sa_force`, `rb_strength`,
   `prussia_leader`, `prussian_police_*`) turned out to be far more entangled with the
   paramilitary/militia subsystem than the plan anticipated — this card wasn't on the
   deferred-paramilitary list, but its disruption mechanic clearly is one. All of its gating
   vars are uninitialized in the Spanish schema (confirmed via `root.scene.dry` grep), so the
   subplot is **already dead code** (never fires) — left untouched with an inline `#`-comment
   flagging it as Area F debt, rather than silently deleted or redesigned.
2. **`party_organizations.scene.dry`'s `@rb`/`@youth`** and **`international_relations.scene.dry`'s
   `@austria`** reach into the same militia space, but their target vars (`rb_strength`,
   `rb_militancy`) have an obvious live replacement already provisioned in `root.scene.dry`
   (`ugt_militia_strength`, `ugt_militia_militancy` — with a comment there noting "the full
   Spanish militia landscape is refined in Area F"). Swapped these three options onto the live
   vars — a variable-target fix using pre-existing keys, not new subsystem design, so it stayed
   in scope.
3. **`crisis_program.scene.dry`** turned out to be a much more detailed German economic-policy
   narrative (Hilferding/Woytinsky/Tarnow/Baade/ADGB) than "generic party-ops" implied. Rather
   than invent Spanish economists or defer the whole file, reframed the debate onto the
   already-established PSOE faction voices from Area D (Besteiro/Besteiristas, the UGT,
   Caballeristas, Prietistas) — preserves the same mechanic/effects, adds no new lore.
4. **One qdisplay-id residue found, not fixed:** `library.scene.dry`'s `@curr_gov` (Area B's
   section, not E's) reads `[+ president_angry : hindenburg_angry +]` — `hindenburg_angry` is
   a *qdisplay formatting id*, not a state variable, and the same id is used across **83**
   `events/`, `government_affairs/`, `status.scene.dry`, `main.scene.dry`, and `root.scene.dry`
   call sites. This is squarely the Area J qdisplay-rename debt the design doc already flags
   (`schleicher_*`/`hindenburg_*` qdisplays need Spanish analogues) — out of scope for E,
   flagged here rather than silently expanded into.

**Verification performed (not just "it compiles"):**
- `npm run build && npm run smoke` green after every file.
- Dangling-var grep sweep across all 12 E-owned files → **zero** unexpected hits (the one hit,
  the qdisplay-id above, is documented debt, not a dangling state var).
- German-term grep sweep → zero unexpected hits (only the asset filename `weimar_coalition_2.jpg`
  [Area K job], the `volkspartei` achievement id [Area K/L job], and the intentionally-untouched
  `rally.scene.dry` paramilitary subplot, all flagged inline).
- Compiled-output check: scanned `out/game.json` across all 12 E-owned top-level scene ids
  (118 sub-scenes) for banned German terms → the same accounted-for exceptions, zero
  unexpected residue.
- Headless Chromium load (`--dump-dom`) → no `Uncaught`/`ReferenceError`/`TypeError`.
- **Standalone Node behavioral spot-check** on the two highest-traffic cards
  (`inter_party_relationships`, `enemies`): seeded `Q` with the real Spanish start values from
  `root.scene.dry`, ran all 12 reachable effect branches, asserted no `NaN` writes (every LHS
  target pre-exists) and that relations move in the intended direction. All 12 passed.

> **Audience: a Sonnet-class executor working cold.** This plan is deliberately
> **redundant** — the same few guardrails are repeated in every stage on purpose, because
> the failure modes here are silent (a mistyped variable becomes `NaN`, not a crash) and a
> fresh agent will not have the tribal knowledge. **Do not treat the repetition as filler;
> it is the safety rail.** Read `CLAUDE.md` and `docs/planning/B_state_schema.md` before you
> touch anything, then follow the stages **in order**, running `npm run build && npm run
> smoke` after **every** file and trusting only the `BUILD OK` / `SMOKE PASSED` lines.

---

## The five guardrails (memorize; they recur in every stage)

1. **Build discipline.** After every single file edit: `npm run build && npm run smoke`.
   Never run raw `dendrynexus make-html` (it prints `Error:` and still exits 0 — see
   `CLAUDE.md`). `smoke` reads the *compiled* `out/game.json`, so a silently-failed build
   makes smoke re-validate a **stale** file and falsely pass. **A green smoke is only
   trustworthy if it was immediately preceded by `BUILD OK`.**
2. **The concatenation trap.** The engine reads party/class data by string concatenation
   (`Q[party + '_r']`, `Q[c + '_' + party]`). Since `Q.parties`/`Q.classes` already hold
   **Spanish** keys, those reads auto-follow. Only **hardcoded** refs (`workers_spd`,
   `z_relation`) are stale. An undefined `Q.*` becomes **`NaN`** in arithmetic (or **throws**
   on `.toFixed()`), and `undefined -= 5` silently creates a `NaN` variable — **no error, the
   mechanic just quietly dies.** That is exactly the bug class Area E is cleaning up.
3. **Do NOT invent variable keys, and do NOT rename existing ones.** Every Spanish target
   variable this plan tells you to write **already exists and is initialized** in
   `source/scenes/root.scene.dry` (Area B built them). Your job is to point stale German refs
   at the **already-existing** Spanish keys — never to coin a new key. If a German var has
   **no** Spanish equivalent (the drift/splinter vars listed below), **drop it**, exactly as
   Area D did. When unsure a target exists, `grep` it in `root.scene.dry` first.
4. **`.dry` comment syntax.** Bare `//` comments are legal **only inside** a `{! ... !}` JS
   block. A `#`-prefixed line **is** a valid content-area comment (used throughout the repo).
   A stray `//` between header properties is a hard compile error that can slip past a stale
   smoke — so build immediately after adding any comment.
5. **Hold the content-debt boundary.** Area E owns the **party landscape** (relations, the
   party roster, the enemies/people's-party cards, and the generic party-operations cards).
   It does **not** own advisors (Area I), events (Area H), policy cards (Area G), or the
   new militia/anarchism/agrarian/church-army subsystems (Area F). Where you find debt that
   belongs to another area, **flag it in this doc — do not silently fix it.** (This is the
   same discipline Area D held when it surfaced these very files.)

---

## Context (why this area exists)

Area B renamed the electoral party/class **keys** (`spd→psoe`, `z→ceda`, `workers→industrial`,
…) and re-baselined the state, but deliberately left **deep party-affairs prose and its
hardcoded variable references** as documented debt. Area D then rewrote the PSOE's *internal*
factions and, during its verification sweep, discovered that **~16 `party_affairs/*.dry` files
still reference pre-rename German variables** (`workers_spd`, `z_relation`, `dvp_relation`,
`ddp_left`, `nsdap_r`, `hindenburg_angry`, …). Because those names no longer exist, the cards
that use them are **silently broken**: relation changes write to `NaN`, demographic shifts
vanish, and a `view-if` gated on a renamed var can make a card **permanently unreachable** (the
exact Area-D `neorevisionism.scene.dry` bug). On top of the broken wiring, the *content* still
describes the **Weimar party system** — the Center Party, the DDP/DVP liberals, the DNVP, the
Nazis — not the **Second Republic's**: Republican Left, the Radicals, the CEDA, the PCE, the
monarchists, the Falange.

**Area E's job:** give the non-player parties their **Spanish identity** and **fix the dangling
references** across the party-landscape cards and displays, so that the "who do we ally with /
campaign as / fight" layer reads and behaves as the Second Republic — the Republican–Socialist
coalition, the Radical–CEDA *bienio negro*, the road to the Popular Front, and the accreting
monarchist/military conspiracy. **Intended outcome:** every party-landscape surface a player can
reach describes Spanish parties, every relation/demographic effect writes to a **live** Spanish
variable, and the residual German splinter machinery is stripped rather than half-ported.

---

## The party mapping (German → PSOE-era Spanish; this is the Area B contract — do not deviate)

| German key | **Spanish key (already in root)** | party | relation var (already in root) |
|---|---|---|---|
| `spd` | `psoe` | **PSOE** — the player | — |
| `kpd` | `pce` | **PCE** — Communists (Díaz) | `pce_relation` (25) |
| `z` | `ceda` | **CEDA** — Catholic authoritarian right (Gil-Robles) | `ceda_relation` (15) |
| `ddp` | `izq_rep` | **Republican Left** (Azaña) — the natural ally | `izq_rep_relation` (62) |
| `dvp` | `radical` | **Radical Party** (Lerroux) — wary centre | `radical_relation` (35) |
| `dnvp` | `monarchist` | **Monarchists** (Renovación Española / Carlists) | `monarchist_relation` (5) |
| `nsdap` | `falange` | **Falange** (Primo de Rivera) — tiny, violent | `falange_relation` (0) |
| `other` | `other` | small/regional lists (**kept**) | — |

**Leaders / ideology vars that exist** (use these, don't invent): `pce_leader` ("Díaz"),
`ceda_leader` ("Gil-Robles"), `ceda_ideology` ("Right"), `radical_ideology` ("Moderate"),
`falange_leader` ("Primo de Rivera"), `president_ideology` ("Alcalá-Zamora"),
`president_relation`, `church_relation`, `catalonia_leader` ("Macià").

### Relation-var rename map (hardcoded refs — fix these literally)

`z_relation → ceda_relation` · `ddp_relation → izq_rep_relation` · `dvp_relation → radical_relation`
· `kpd_relation → pce_relation` · `dnvp_relation → monarchist_relation` · `nsdap_relation → falange_relation`.

### Class×party matrix rename map (`<class>_<party>` — fix these literally)

Classes: `workers→industrial`, `old_middle→smallholder`, `new_middle→urban_middle`,
`rural→landless`, `unemployed→unemployed`, `catholics→catholic`. So e.g.
`workers_spd → industrial_psoe`, `rural_spd → landless_psoe`, `new_middle_spd → urban_middle_psoe`,
`old_middle_spd → smallholder_psoe`, `catholics_spd → catholic_psoe`, `unemployed_spd → unemployed_psoe`;
cross-party the same way (`workers_kpd → industrial_pce`, `workers_z → industrial_ceda`,
`new_middle_dvp → urban_middle_radical`, `workers_nsdap → industrial_falange`,
`workers_ddp → industrial_izq_rep`). **Verify each target with `grep` in `root.scene.dry` before
writing it** — the six PSOE cells and the common cross-party cells are all initialized there.

### Dead German-only vars — **DROP, do not port** (no Spanish equivalent, mirror Area D)

- Bourgeois-party **internal drift**: `ddp_left`, `dvp_left`, `lvp_left`, `ddp_right`,
  `dvp_right`, `lvp_right`, `ddp_cohesion`, `cvp_left`.
- **Splinter/merge machinery & name toggles**: `lvp_relation`, `lvp_formed`, `cvp_formed`,
  `dvp_exist`, `dnvp_leader`, `z_party_name`, `ddp_name`, `dnf_formed`, `dnef_formed`,
  `kvp_formed`, `sapd_formed`, `dnvp_split`, `stresemann_dead`, `saxony_nsdap`,
  `harzburg_front_seen`, `blutmai`, `wacky_weimar`, and the whole `_dnvp`/`_dvp`/`_ddp`/`_lvp`
  class-matrix swap logic in the wacky blocks.
- **Presidential/German-specific**: `hindenburg_angry`, `hindenburg_angry_base`. (A Spanish
  `president_relation`/`president_angry` exists; only re-target if the surrounding line has a
  genuine Spanish analogue — otherwise drop the German line. Don't force a mapping.)

If dropping a var would leave an option with **zero** effect, either delete that option or give
it the nearest *sensible* Spanish effect from the live vars above — note which you did inline.

---

## Scope: what Area E owns vs. defers

**E OWNS — rewrite content + fix all dangling vars (build+smoke after each):**

1. `source/scenes/party_affairs/inter_party_relationships.scene.dry` — **the core file** (434
   lines). Rebuild around the Spanish party geometry; **strip the entire `wacky_weimar`
   easter-egg** (the DNVP/NSDAP "wholesome"/Harzburg/anti-Liberal-Front blocks, ~lines 167–428,
   plus the `on-display` parliament-SVG that lists `sapd/rdp/kvp/dnef/dsu/nvf/…`). It is joke
   content built entirely on dead splinter vars; porting it is negative value.
2. `source/scenes/party_affairs/enemies.scene.dry` — "Choosing our enemies." Rebuild the option
   set around Spanish opponents (see design notes below).
3. `source/scenes/party_affairs/peoples_party.scene.dry` **+** `peoples_party_campaigning.scene.dry`
   — **reframe & keep** as the PSOE *obrerismo*-vs-broadening debate (decision below; low
   priority — if time-boxed, at minimum fix its dangling vars so it can't misbehave).
4. **Generic party-operations cards** — same dangling-var class, no distinct subsystem, so they
   ride along with E: `campaigning.scene.dry`, `rally.scene.dry`, `media.scene.dry`,
   `fundraising.scene.dry`, `party_organizations.scene.dry`, `crisis_program.scene.dry`,
   `international_relations.scene.dry`. For these, **de-Germanize prose + apply the rename maps**;
   they need far less structural surgery than files 1–3.
5. **Display surfaces:** the `@parties` roster in `source/scenes/library.scene.dry` (lines
   ~336–385, still fully German) and the party references inside the `@classes` demographic
   descriptions (`SPD/KPD/DDP/DNVP/Nazis/Jews` at ~195–205). Rewrite to the Spanish roster.
   *(The `@paramilitaries` block right below `@parties` is already Spanish — leave it; it
   confirms militia display is Area F, not E.)*

**E DEFERS — document, do NOT touch (flag any new debt you find):**

- **Paramilitary / street-politics cards** — `reichsbanner`, `iron_front`, `streetfighting`,
  `confronting_nazis`, `weimar_rally`, `response_to_antisemitism`. These are an **anti-fascist
  militia subsystem** (UGT militia vs. Falange/requeté/CNT violence — the live vars are
  `ugt_militia_strength`, `requetes_strength`, `falange_militia_strength`, `cnt_militia_strength`).
  That is **new design**, not a rename, and it belongs with **Area F** (church–military–Africa
  + anarchism). Leave them German; F owns them.
- **Advisors (Area I), split-trigger/coalition events (Area H), policy cards (Area G).** Cards in
  scope may *reference* faction keys (`left_strength`, …) — those keys are correct and stay
  (Area D's call); only the *identities* in advisor/event files are wrong, and that's I's/H's job.
- **Faction key renames, class/party key renames** — already done in B/D; **do not re-do.**

---

## Per-file design notes (the content, not just the plumbing)

### `inter_party_relationships.scene.dry` (core rebuild)

Replace the Weimar-coalition framing with the Republic's. The player (PSOE) is the largest
workers' party but cannot govern alone; the real 1931–36 relationships are:

- **@izq_rep — Republican Left (Azaña).** The natural ally; the **Republican–Socialist
  coalition** governed the *primer bienio* (1931–33). Warmest baseline (`izq_rep_relation` 62).
  Effects: raise `izq_rep_relation`; the reformist/Prietista wing approves, the Caballerista
  left is cool on republican collaboration (`reformist_dissent -=`, `left_dissent +=` small).
- **@radical — Radical Party (Lerroux).** The wary centre; drifts right into the **Radical–CEDA
  governments** of the *bienio negro* (1933–35). Improving ties is possible but alienates the
  left and the PCE. Effects on `radical_relation`; note the Radicals' rightward/`ceda`-ward tilt.
- **@ceda — CEDA (Gil-Robles).** The Catholic authoritarian right; the antagonist. Outreach is
  costly and splits the party hard (this is closest to the old "Center" slot mechanically but is
  a **rival**, not a partner). Effects on `ceda_relation`; large `left_dissent +=`.
- **@pce — PCE.** History of hostility softening toward the **Workers' Alliance / Popular Front**
  (esp. after Oct 1934). Mirror the old KPD structure (the "social-fascism" line → the PCE's
  pre-Popular-Front sectarianism, then rapprochement). Effects on `pce_relation`,
  `communist_coalition`; reformists uneasy.
- **@monarchist — Renovación Española / Carlists.** Not a coalition partner in any real sense;
  contact is essentially intelligence on the **conspiracy**. Keep minimal; a small
  `monarchist_relation` nudge. (Do **not** rebuild the DNVP "People's Conservative/Christian
  Social" leader-toggle machinery — drop it.)
- **@falange — Falange.** Tiny, violent, no legitimate outreach; either drop the option or make
  it a clearly-bad flavor choice. (Strip the entire Strasser/`wacky_weimar` apparatus.)
- **@psoe_alone** (rename `@spd_alone`) — stand alone this turn. Keep.

Keep the card scaffolding (`is-card`, `inter_party_relationships_timer = 6`, `month_actions += 1`,
`resources` costs, `*(1 - dissent)` scaling, `@easy_discard`). Rip out every `ddp_name`/
`z_party_name`/`lvp_formed`/`cvp_formed`/`dvp_exist`/`stresemann_dead` conditional and the whole
`@dnvp_wholesome`/`@nsdap_wholesome*`/parliament-SVG apparatus.

### `enemies.scene.dry`

Rebuild the "who are our main opponents" options for Spain: **the authoritarian right** (CEDA +
monarchists + Falange), **the CEDA alone**, **the anarchist/CNT challenge on the left** *or* **the
PCE** (pick per the workers'-competition framing), and **stand pat**. Apply the matrix rename map
to every `workers_*`/`unemployed_*` line (`workers_kpd → industrial_pce`,
`workers_nsdap → industrial_falange`, `workers_z → industrial_ceda`, etc.); fix `kpd_relation →
pce_relation`, `z_relation → ceda_relation`, `dvp_relation → radical_relation`, `ddp_relation →
izq_rep_relation`; **drop** `dvp_left/ddp_left/ddp_cohesion/lvp_left/dvp_right/ddp_right/lvp_right`
and the `dnvp_ideology`/`dnf` toggles. Preserve the faction `*_strength`/`*_dissent` deltas and
the `nazi_urgency` slider (kept-generic threat var).

### `peoples_party.scene.dry` + `peoples_party_campaigning.scene.dry` (reframe & keep — low priority)

Real PSOE tension: **obrerismo** (a pure workers' party) vs. broadening to the **braceros/landless,
smallholders, and urban middle** to build a governing majority. Keep the mechanic (`peoples_party`
flag, `peoples_party_support`, the class-share campaign sub-options, the `volkspartei` achievement
— rename the achievement's *display text* only, not the id unless Area K/L is doing achievements).
Apply the matrix rename map to **every** `workers_spd/rural_spd/new_middle_spd/old_middle_spd/
catholics_spd/unemployed_spd` line (they are all over both files); fix the relation vars; **drop**
`hindenburg_angry`/`hindenburg_angry_base` and the `ddp_left/dvp_left/ddp_cohesion/lvp_left` drift
lines; re-target `kpd_relation → pce_relation`. Rewrite the "Prussian Concordat"/Catholic-appeal
prose to a Spanish frame (the PSOE's fraught relationship with political Catholicism). **If
time-boxed:** at absolute minimum fix the dangling vars so the card is inert-safe, and leave a
`#`-comment stating whether the prose reframe is finished.

### Display: `library.scene.dry` `@parties` + `@classes`

Rewrite the `@parties` roster to the eight Spanish parties (PSOE self-description; PCE; CEDA;
Republican Left; Radical; monarchists; Falange; "Other/regional"), each with a one-paragraph
identity and a `Current relations: [+ <party>_relation : relationships +]` line using the **live**
relation vars. Delete every `[? if lvp_formed …]`, `[? if cvp_formed …]`, `dnef/dnf/kvp/sapd/bvp`
conditional block. In `@classes`, swap the party references in the demographic paragraphs to the
Spanish roster (industrial workers split PSOE/PCE/CNT-abstention; landless braceros; smallholders;
urban middle → Republican Left/Radical; Catholic bloc → CEDA). The German history prose in
`@government`/`@weimar_timeline` is **not** Area E — leave it (it's Area H/L timeline debt).

---

## Stages (build + smoke after EACH; commit in small verified stages)

- **E-0 · Recon & baseline.** `grep` the exact dangling-var inventory so you can diff against it
  at the end: `grep -rnE "workers_spd|new_middle_spd|old_middle_spd|rural_spd|unemployed_spd|catholics_spd|_spd\b|z_relation|dvp_relation|ddp_relation|lvp_relation|kpd_relation|dnvp_relation|nsdap_relation|ddp_left|dvp_left|lvp_left|ddp_right|dvp_right|ddp_cohesion|hindenburg|ddp_name|z_party_name|lvp_formed|cvp_formed|dvp_exist|wacky_weimar|nsdap_r\b|nsdap_normalized" source/scenes/party_affairs/ source/scenes/library.scene.dry`. Confirm a clean `npm run build && npm run smoke` on the current tree first.
- **E-1 · `inter_party_relationships.scene.dry`** — core rebuild + strip `wacky_weimar`. Biggest
  file; do it first while attention is freshest. Build + smoke. Commit.
- **E-2 · `enemies.scene.dry`** — rebuild options + rename maps. Build + smoke. Commit.
- **E-3 · Generic party-operations cards** — `campaigning`, `rally`, `media`, `fundraising`,
  `party_organizations`, `crisis_program`, `international_relations`. Mostly rename-map + prose
  de-Germanization. Build + smoke **after each file** (they're independent; don't batch blindly).
  Commit (may group as one commit once all green).
- **E-4 · `library.scene.dry` `@parties` + `@classes`** — party roster & demographic prose.
  Build + smoke. Commit.
- **E-5 · People's Party (`peoples_party` + `peoples_party_campaigning`)** — reframe & keep, or
  minimum-safe if time-boxed. Build + smoke. Commit.
- **E-6 · Verification sweep + docs.** Re-run the E-0 grep (expect **zero** hits in E-owned files,
  except intentional `#`-comments and the explicitly-deferred paramilitary files). Update
  `CLAUDE.md` status-at-a-glance, `docs/spanish_republic_conversion_design.md` §E (✅ + any
  residual 🔲), and add an "Execution status" section to **this** file (mirroring
  `D_faction_semantics.md`). Commit.

---

## Verification (per `CLAUDE.md` — "never claim a mechanic works without exercising it")

1. **Build+smoke green after every file**, and green at the end with a preceding `BUILD OK`.
2. **Dangling-var grep** (E-0 pattern) over E-owned files → **zero** hits. The six deferred
   paramilitary files **will** still hit — that's expected and documented, not a failure.
3. **German-term grep** over E-owned files:
   `grep -rniE "Weimar|Reichstag|NSDAP|\bSPD\b|\bKPD\b|\bDNVP\b|\bDDP\b|\bDVP\b|Stresemann|Hindenburg|Schleicher|Center Party|Volkspartei|Prussia" <E-owned files>`
   → only intentional residue (e.g. a `#`-comment, or an in-scope decision you noted).
4. **Compiled-output check** (the stale-build guard): after the final `npm run build`, scan
   `out/game.json` for the banned party tokens under the E-owned scene ids
   (`inter_party_relationships`, `enemies`, `peoples_party`, `campaigning`, `rally`, `media`,
   `fundraising`, `party_organizations`, `crisis_program`, `international_relations`, and the
   `library` `@parties`/`@classes` sub-scenes) → zero hits. A quick Node script over
   `out/game.json` (as Area D did over its 84 sub-scenes) is the reliable way.
5. **Headless load** (per `CLAUDE.md`): serve `out/html`, `--dump-dom` the start menu, and
   `grep -iE "Uncaught|ReferenceError|TypeError"` the chrome stderr → none. (`--dump-dom` only
   reaches the static menu; deep card nav isn't scriptable here — rely on #4 for card content.)
6. **Behavioral spot-check (the important one).** Area E changes *relation/demographic effects*,
   so a stale-var bug is invisible to "it compiles." For at least the two highest-traffic cards
   (`inter_party_relationships`, `enemies`), write a **standalone Node snippet** that loads the
   card's `on-arrival` effect expressions against a seeded `Q` (Spanish start values from
   `root.scene.dry`) and asserts every left-hand-side target is a **pre-existing key** (no new
   `NaN` vars created) and relations move in the intended direction. This is how B/C/D caught
   silent breakage; do not skip it for the two core cards.

---

## Decisions taken (flagged for override at approval)

- **Paramilitary/street cards → deferred to Area F.** They're a militia subsystem (live vars
  already exist: `ugt_militia_strength`, `requetes_strength`, `falange_militia_strength`,
  `cnt_militia_strength`), i.e. **new design**, not a rename. Bounding E to party-relations keeps
  it a clean "Rewrite," matching the design doc's own A–M subsystem split. *(Override → fold the
  6 files into E-3 if you want the full sweep in one area.)*
- **People's Party → reframe & keep** (PSOE obrerismo-vs-broadening), marked low-priority with a
  minimum-safe fallback. *(Override → "leave dormant" or "delete + clean up
  `peoples_party_support`/achievement refs.")*
- **`wacky_weimar` easter-egg → stripped**, not ported. ~260 lines of German joke content on dead
  splinter vars; negative value to translate. *(Override → keep dormant behind its `= 0` gate.)*

## Deferred / open (state at approval)

- **Area F** owns the 6 paramilitary/militia cards and any anarchism/agrarian/church-army design
  those cards imply. Area E only removes them from its own grep-clean target set.
- **Areas G/H/I** own policy cards, events (incl. coalition-formation & the CEDA "who governs"
  crisis that this landscape sets up), and advisors respectively.
- The German **history/timeline prose** in `library.scene.dry` `@government`/`@weimar_timeline`
  is timeline debt (Area H/L), **not** Area E — left in place on purpose.
