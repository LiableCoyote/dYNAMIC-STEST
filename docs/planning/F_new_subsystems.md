# Plan: Area F — The Four New Spain-Specific Subsystems

> **Session handoff.** 🔲 **APPROVED — NOT YET STARTED.** This is the detailed, deliberately
> redundant execution plan for Area F, the largest area yet (four net-new subsystems, built
> partly on broken substrate inherited from Areas B/C). No F-stage has been executed yet.
> When execution begins, add an "Execution status" section at the top (mirroring
> `E_party_landscape.md`) tracking exactly what's done, and flip the banner to ✅ as F-6 lands.

> **Audience: a Sonnet-class executor working cold.** This is the largest, least-precedented
> area yet — four net-new subsystems with no German base-game analogue, built partly on a
> **broken substrate** left by Areas B/C. Read `CLAUDE.md`, `docs/planning/B_state_schema.md`,
> and `docs/planning/E_party_landscape.md` (for the house style) before touching anything.
> `npm run build && npm run smoke` after **every file**, trusting only `BUILD OK`/`SMOKE
> PASSED`. This plan repeats its guardrails on purpose — the failure mode here is silent
> `NaN` production, not a compile error, and no single re-read will stick.

---

## Context

Areas A–E rebuilt the **engine and the German base-game's own systems** (state schema,
election math, PSOE factions, the party landscape) by **reweighting existing structure**.
Area F is different in kind: Spain 1931–36 has **four major political dynamics with no
Weimar equivalent at all** — anarcho-syndicalism (CNT-FAI), regional autonomy (Catalonia's
Generalitat, Basque nationalism), the agrarian/land question (latifundios, braceros, the
IRA), and the church–military–Africa axis that produces the July 1936 coup. `B_state_schema.md`
deliberately **declared inert placeholder variables** for all four (`anarchist_*`,
`catalan_autonomy`, `basque_autonomy`, `church_relation`, `clerical_conflict`, `africa_army`)
and left their *mechanics* explicitly to "Area F."

Three research passes (this session) turned up something the design doc didn't anticipate:
**Area F is not building on clean ground.** Areas B/C's own rename work is incomplete in ways
that directly undercut Area F's job — a tick-level force computation in `post_event.scene.dry`
has been silently producing `NaN` every turn since Area B (feeding a permanently-dead card
gate), a live/reachable HUD panel in `status.scene.dry` renders garbage today, the *only*
writer of the generic `land_reform` var updates class variables that don't exist in the
Spanish schema (so land reform currently has **zero** effect on the real demographic model),
and one government-affairs card can never appear because its gate string was never updated.
None of this is Area F's fault, but Area F's new mechanics would silently break again if
built naively on top of it.

**Area F's job:** design and build first-increment mechanics for all four subsystems —
right-sized like Areas D/E's actual scope (rewrite/create a handful of coherent files per
subsystem, not the whole event corpus) — while fixing the narrow slice of inherited breakage
that's cheap, high-leverage, and would otherwise sabotage the new work. Everything larger
(the ~180-line dead coalition-taxonomy block, the 53-file `coup_progress` event chain, the
72-file `reichswehr_*→army_*` rename) is **flagged, not fixed** — that's Area H/C-remnant
scale, the same content-debt boundary Areas D and E held throughout.

---

## The six guardrails (memorize; they recur in every stage)

1. **Build discipline.** `npm run build && npm run smoke` after every file. Never raw
   `dendrynexus make-html`. Trust only a `BUILD OK` immediately followed by `SMOKE PASSED`.
2. **The concatenation trap + `NaN` silence.** `undefined op= x` silently produces `NaN`, no
   error. Every var this plan tells you to write **already exists** in `root.scene.dry` unless
   explicitly marked "**F declares this**" — verify with `grep` before writing, same as
   Area E.
3. **Do not fix the three flagged engine-scale items** (§"Out of scope" below) even though
   you will trip over them constantly while reading nearby files. Route around them; do not
   silently expand scope into Area C/H's territory.
4. **F's signature verification is "inert stub → live."** `B_state_schema.md` declared
   `anarchist_insurrection`, `catalan_autonomy`, `basque_autonomy`, `church_relation`,
   `clerical_conflict`, `africa_army` with **zero consumers**. The concrete bar for "this
   stage actually did something" is: the var now has **at least one writer and one reader**,
   verified by a standalone Node check, not just "it compiles."
5. **`.dry` comment syntax.** Bare `//` only inside `{! ... !}`. `#`-prefixed lines are valid
   content-area comments.
6. **Content-debt boundary.** Advisors (Area I), the event corpus (Area H), policy cards
   (Area G) are out of scope. Where a stage's new content would naturally plug into one of
   those (e.g. a coup-trigger event), **stub it and flag the rest**, exactly as F-5 does below.

---

## What's already live (safe to build on) vs. broken (route around)

### Already correctly declared and safe to build on

- **Anarchism:** `anarchist_strength=30`, `anarchist_militancy=0.5`, `anarchist_electoral_stance=1`
  (1=participate, 0=abstain), `anarchist_insurrection=0` (zero consumers — F's to wire).
  `election_algorithm.scene.dry`'s C-4 mechanic already consumes `anarchist_electoral_stance`/
  `anarchist_strength` to modulate turnout — the one anarchist mechanic that runs today.
- **Militia slate (all correctly Spanish-keyed):** `ugt_militia_strength/militancy/banned`,
  `requetes_strength/militancy/banned/banned_catalonia`, `falange_militia_strength/militancy/
  banned/banned_catalonia`, `cnt_militia_strength/militancy/banned/banned_catalonia`,
  `guardia_civil_strength/militancy/loyalty`, `asalto_strength/militancy/loyalty`,
  `army_strength/militancy/loyalty`. Already correctly displayed read-only in
  `library.scene.dry` and `status.scene.dry`'s `@paramilitaries` (top half only — see below).
- **Regional:** the full `_catalonia` family (coalition flags `in_republican_socialist_catalonia`
  etc., vote-share `psoe_r_catalonia` etc., `catalonia_leader="Macià"`, `catalonia_size=0.85`,
  election timers, the three `*_banned_catalonia` militia flags) — already correctly displayed
  in `status.scene.dry`'s main government block. `Q.catalan_autonomy=0` and `Q.basque_autonomy=0`
  both exist (root.scene.dry:230-231) as pure inert scalars, zero consumers.
- **Agrarian:** the class-matrix rows (`landless_psoe/pce/ceda/izq_rep/radical/monarchist/
  falange/other`, `smallholder_*`) are live, correct, and already displayed with good Spanish
  prose (Areas D/E's work) — just disconnected from the land-reform mechanic (see below).
  `Q.agricultural_policy=0`, `Q.land_reform=0` both declared (root.scene.dry:604-605).
- **Church/military:** `church_relation=20`, `clerical_conflict=0`, `africa_army=0`,
  `coup_progress=0`, `capital_strike_progress=0` all declared inert.

### Broken/inherited debt this plan routes around or narrowly fixes

1. **`post_event.scene.dry` lines ~290-316** compute `prussia_force`/`far_right_force`/
   `democracy_force`/`state_force`/`rb_force`/`rfb_force`/`sa_force`/`sh_force`/
   `reichswehr_force` from vars that no longer exist (`prussian_police_*` — live var is
   `asalto_*`; `sh_strength`, `rb_strength`, `rfb_strength`, `reichswehr_strength` — all dead).
   **Silently `NaN` every turn since Area B.** Feeds `party_affairs/streetfighting.scene.dry`'s
   `view-if: far_right_force >= 30` (permanently false → card dead).
2. **Same file, ~lines 4900-5079**: an ~180-line coalition-taxonomy block (national **and**
   the `_prussia`/should-be-`_catalonia` region variant) entirely keyed on dead party letters
   (`spd/kpd/z/ddp/dvp/dnvp/nsdap/lvp/sapd/dnef/dsu/kvp/dnf`). Broken both nationally and
   regionally.
3. **`status.scene.dry` lines 247-271** ("Distribution of Power" panel, directly below the
   already-correct `@paramilitaries` militia readouts) — depends entirely on #1's dead
   outputs. **Live, reachable, currently renders garbage** to the player (e.g. `Prussian
   police: NaN%`). *This one F-1 fixes* — see F-1 below; it does not require touching #1/#2,
   because F-1 replaces the panel with a self-contained computation over the live militia
   vars, the same idiom `@paramilitaries`'s own `on-arrival` block already uses.
4. **`army_strength/militancy/loyalty` are declared but have zero consumers anywhere outside
   `root.scene.dry`.** Meanwhile `reichswehr_loyalty/strength/militancy` — never initialized —
   actually drive ~72 files (the SA/SH ban-unban mechanic, `military_policy.scene.dry`,
   `foreign_policy.scene.dry`, etc.). The Area B rename for this family was declared, never
   executed against consumers. *F-5 fixes this in the one file it rewrites
   (`military_policy.scene.dry`) only* — does not chase the other 71 files.
5. **`government_affairs/agricultural_policy.scene.dry`** — the only writer of `land_reform`
   — writes its demographic effects to phantom `rural_spd`/`rural_nsdap`/`rural_other`
   (nonexistent) instead of the live `landless_psoe`/`smallholder_psoe`/etc. rows. **Land
   reform currently has zero effect on the real demographic model.** *F-3 fixes this — it's
   rewriting this exact file anyway.*
6. **`Q.rural_policy`** is read/written by 5 files (`agricultural_policy.scene.dry`,
   `campaigning.scene.dry`, `peoples_party.scene.dry`, `peoples_party_campaigning.scene.dry`,
   `advisors/baade.scene.dry`) but **never declared anywhere** — a latent bug from the base
   game itself, never fixed. *F-0 declares it* (a cheap, cross-cutting root-schema fix, not
   owned by any one subsystem).
7. **`government_affairs/military_policy.scene.dry`**'s gate checks
   `reichswehr_minister_party = "SPD"`, but `root.scene.dry` sets
   `Q.reichswehr_minister_party = 'IR'` — **never** `"SPD"`/`"PSOE"` — so this card can
   currently never appear. *F-5 fixes this — it's rewriting this file anyway.*

**The three items that are genuinely out of scope for Area F** (flag in the final doc, do
not fix): #1+#2 (the `post_event.scene.dry` force/taxonomy blocks — Area C-remnant/H scale),
the 53-file `coup_progress` event chain including the coup-trigger event itself
`events/march_on_berlin.scene.dry` (Area H — the event corpus is H's whole domain), and the
72-file `reichswehr_*→army_*` rename beyond the one file F-5 touches (Area B-remnant/H).

---

## Scope: what Area F owns vs. defers

**F owns (create/rewrite; build+smoke after each):**

- **F-0 (root-schema prerequisite):** declare `Q.rural_policy` in `root.scene.dry`.
- **F-1 (militia/street-politics foundation):** rewrite the 6 dead `party_affairs/*.scene.dry`
  militia cards (`reichsbanner`, `iron_front`, `streetfighting`, `confronting_nazis`,
  `weimar_rally`, `response_to_antisemitism`) + clean up `rally.scene.dry`'s dead `sa_disrupt`
  subplot (flagged by Area E) + replace `status.scene.dry`'s broken "Distribution of Power"
  panel (lines 247-271) with a self-contained Spanish equivalent.
- **F-2 (anarchism/CNT):** one new CNT-relations/general-strike `party_affairs` card (wires
  `anarchist_electoral_stance` + `anarchist_insurrection`) + one new Casas-Viejas-type
  insurrection stub event.
- **F-3 (agrarian):** rewrite `government_affairs/agricultural_policy.scene.dry` (fixes
  finding #5 + #6 as part of the reframe).
- **F-4 (regional autonomy):** one new Catalonia Statute-of-Autonomy `government_affairs`
  card (built on the live `_catalonia` family + F-1's ban pattern) + minimal Basque wiring
  giving `basque_autonomy` its first writer+reader. The 4 dead `prussian_affairs*.scene.dry`
  files are flagged superseded/dead, not ported.
- **F-5 (church-military-Africa / the coup):** rewrite `government_affairs/military_policy.scene.dry`
  (fixes finding #4 + #7 as part of the reframe) + one new anticlerical-conflict card wiring
  `church_relation`/`clerical_conflict` + one new Sanjurjada-1932 stub event wiring
  `africa_army`/`coup_progress`.
- **F-6:** verification sweep + docs (`CLAUDE.md`, design doc §F, this plan's execution status).

**F defers (document as debt, do NOT touch):**

- `post_event.scene.dry`'s dead force-computation (~290-316) and coalition-taxonomy
  (~4900-5079) blocks — Area C-remnant/H.
- The 53-file `coup_progress` event chain and `events/march_on_berlin.scene.dry` (the coup
  *trigger*) — Area H. F-5 stubs a Sanjurjada *escalation* event; it does not build the
  July-1936 endgame trigger itself.
- The 72-file `reichswehr_*→army_*` rename beyond `military_policy.scene.dry` — Area
  B-remnant/H.
- The 4 `prussian_affairs*.scene.dry` files — superseded by F-4's new Catalonia card, left in
  place with an inline flag (same handling Area E gave `rally.scene.dry`'s dead subplot).
- Advisors (Area I), policy-card content beyond the two rewritten government_affairs files
  (Area G), deep event-chain content for any of the four subsystems (Area H).

---

## Stage order and why

**F-0 → F-1 (militia foundation) → F-2 (anarchism) → F-3 (agrarian) → F-4 (regional) →
F-5 (church-military/coup) → F-6 (verify+docs).**

- **Militia first, as its own foundational stage** (not folded into anarchism): it's a
  rehab of 6 already-dead files (D/E-scale rename/reframe, low design novelty) that
  establishes two things every later stage reuses — the live militia-var wiring pattern and
  the **ban/unban card pattern** (lift the shape from `prussian_affairs.scene.dry`'s
  `@ban_sa`/`@unban_sa`/`@ban_sh`/`@unban_sh`/`@ban_rfb`/`@unban_rfb`, reproduced in full
  below — do not port that file itself, it's superseded per F-4).
- **Anarchism before agrarian:** braceros are contested between the PSOE and the CNT, so
  F-3's land-reform card benefits from F-2's `anarchist_insurrection`/electoral-stance lever
  already existing to reference (a soft dependency, not a hard blocker).
- **Regional after militia:** the Catalonia card reuses F-1's ban pattern for the three
  `*_banned_catalonia` militia flags.
- **Church-military-Africa last:** it culminates in the July-1936 coup (the game's end
  state), so its escalation design can reference whatever `coup_progress`-relevant tension
  the other three stages introduced (agrarian unrest, anarchist insurrection, regional
  separatism).

---

## Stage details

### F-0 · Root-schema prerequisite

Declare `Q.rural_policy = 0;` in `root.scene.dry`, next to `Q.agricultural_policy`/
`Q.land_reform` (~line 604-605), with a one-line comment noting it's read by
`agricultural_policy.scene.dry`/`campaigning.scene.dry`/`peoples_party*`/`advisors/baade.scene.dry`.
Also run the baseline dead-var grep sweep (see Verification) to establish the "before" count.
**Verify:** build+smoke.

### F-1 · Militia/street-politics foundation

Rewrite all 6 files onto the live militia slate, reframing German street-politics as Spanish:
UGT militia vs. Falange militia/Requetés/CNT militia, the 1934 Asturias-adjacent "Alianza
Obrera" framing for cross-left militia cooperation where the German original modeled
Reichsbanner/Iron-Front unity.

- **`reichsbanner.scene.dry` → UGT militia investment card.** Rename all effects onto
  `ugt_militia_strength/militancy`; `women_in_militia` (already declared, zero consumers —
  wire it here) replaces `women_rb`; drop `cvp_leave_reichsbanner`/`z_relation`/`ddp_relation`/
  `lvp_relation` (excised/dead); relation effects go on `ceda_relation`/`izq_rep_relation`.
- **`iron_front.scene.dry` → "Alianza Obrera" coordination card.** Same militia rename;
  `wtb_adopted`/`wtb_implemented`/`wtb_rally` have no Spanish equivalent (drop those branches
  — they're a German economic-policy device, not this stage's job to replace).
- **`streetfighting.scene.dry` → the core UGT-vs-Falange/Requetés violence card.** Gate on a
  **new self-contained comparison** (e.g. `falange_militia_strength * falange_militia_militancy
  + requetes_strength * requetes_militancy` vs. `ugt_militia_strength * ugt_militia_militancy`)
  computed inline — **not** on the dead `far_right_force`. Battle/arm/train/police-train/
  truce branches reframed onto Falange/Requetés/CNT as applicable; `prussia_leader`/
  `prussian_police_training` → `catalonia_leader`/generic Guardia-de-Asalto training.
- **`confronting_nazis.scene.dry` → the "should we form Alianza Obrera" decision card.**
  Gate `nsdap_r >= 10` → `falange_r >= 10` is the wrong fix again (Area D's live-bug #2
  lesson: Falange stays electorally tiny) — gate on the same broader threat composite Area D
  used (`ceda_r >= 20 or coup_progress >= 3 or radicalization >= 3`) or on militia-strength
  ratios instead of vote share. Advisor-boolean refs (`mierendorff_advisor` etc.) are Area I's
  problem — drop them, don't invent Spanish equivalents here.
- **`weimar_rally.scene.dry` → reframe or retire.** Currently gated on three simultaneously-
  dead vars (`rubicon`/`weimar_rally`/`rb_stay`), i.e. **already permanently unreachable**.
  Either give it a real Spanish gate (a Republican-coordination rally reusing the F-1 militia
  vars) or explicitly retire it with a `view-if: 0` + inline comment — do not silently leave
  it half-dead without a note either way.
- **`response_to_antisemitism.scene.dry` → retire or repurpose.** No Spanish equivalent
  subject matter exists (Spain's far right is clerical/monarchist/Africanista, not racial-
  antisemitic in the same register). Recommend: retire with an inline comment pointing to
  F-5's anticlerical-conflict card as the closest Spanish analogue slot, rather than forcing
  an antisemitism narrative that doesn't fit 1930s Spain.
- **`rally.scene.dry`'s `@sa_disrupt` subplot** (already flagged inert by Area E): now that
  F-1 owns live militia vars, replace the dead gate
  (`sa_force > 25 and not sa_banned and not return_to_normalcy`) with a real one
  (`falange_militia_strength * falange_militia_militancy > <threshold> and not
  falange_militia_banned`), and retarget `police_protect`/`rb_protect`/`both_protect` onto
  `asalto_*`/`ugt_militia_*`. This closes Area E's flagged debt.
- **`status.scene.dry` lines 247-271 ("Distribution of Power"):** replace with a
  self-contained block computed in the existing `@paramilitaries` `on-arrival` `{! ... !}`
  (which already does `.toFixed()` conversions for the four live militia readouts) — add a
  "Left/Republican forces" vs. "Authoritarian right forces" vs. "State forces" comparison
  built purely from `ugt_militia_*`, `falange_militia_*`, `requetes_*`, `cnt_militia_*`,
  `guardia_civil_*`, `asalto_*`, `army_*` — **never** reference `prussia_force`/
  `far_right_force`/`democracy_force`/etc. This does not require touching `post_event.scene.dry`.
- **Ban/unban pattern reference** (lift the shape, not the file, from
  `government_affairs/prussian_affairs.scene.dry` lines ~50-93): multiply strength by a
  reduction factor, set a `*_banned` flag, adjust relevant relations, nudge `coup_progress`,
  use a `*_ban_timer` for reapplication cooldown, snapshot `*_coup_progress` to restore on
  unban. Apply this shape wherever F-1's rewrite calls for banning Falange/Requetés/CNT
  militias (using the **already-live** `falange_militia_banned`, `requetes_banned`,
  `cnt_militia_banned`).

**Verify:** build+smoke per file; dead-var grep (German militia terms + old party/class
refs) → zero in all 7 F-1-owned files; compiled-output scan; no standalone simulation
strictly required (rename/reframe, not new math) — but do sanity-check the new
`streetfighting.scene.dry` gate and the `status.scene.dry` force comparison with a quick
Node arithmetic check against seeded start values, since these are genuinely new formulas
(not straight renames).

### F-2 · Anarchism/CNT

One new `party_affairs` card (e.g. `cnt_relations.scene.dry`) giving the player a real
lever: negotiate with the CNT-FAI (affects `anarchist_militancy`), and — the mechanically
important piece — a choice mirroring the real 1931/1933/1936 history that **moves
`anarchist_electoral_stance`** (which `election_algorithm.scene.dry`'s C-4 mechanic already
consumes to modulate turnout). Pair it with one new stub event (e.g.
`events/casas_viejas.scene.dry` or a generically-named insurrection event) that:
reads `anarchist_militancy`/`anarchist_strength`, writes `anarchist_insurrection = 1`,
and nudges `coup_progress`/`radicalization`/relevant class-matrix vars as a consequence —
giving `anarchist_insurrection` its first writer. Keep the event self-contained (a single
`is-card`-style scene or a `frequency`-gated event, matching the base game's existing event
patterns) — do not build a branching insurrection tree; that's Area H's job to expand.

**Verify:** build+smoke; standalone Node behavioral check — seed real start `Q`, exercise
the CNT-relations card's branches (assert no NaN, `anarchist_electoral_stance` toggles
0/1 correctly), and the insurrection stub (assert `anarchist_insurrection` flips 0→1 and
downstream effects resolve without NaN). Confirm `anarchist_insurrection` now has ≥1 writer
(the new event) and ≥1 reader (the event's own gate re-reading it, or a second small hook).

### F-3 · Agrarian/land question

Rewrite `government_affairs/agricultural_policy.scene.dry` in place. Reframe: the IRA
(Instituto de Reforma Agraria, 1932), *bases de asentamiento*, expropriation-with-compensation
of the latifundios, vs. smallholder/landowner backlash. Concretely:

- Retarget every `rural_spd`/`rural_nsdap`/`rural_other`-class write onto the live
  `landless_psoe`/`landless_ceda`/etc. and `smallholder_psoe`/etc. rows — this is the
  concrete fix for finding #5, and it's the single most important thing this stage does
  (it's what makes `land_reform` finally touch the real demographic model).
  `judicial_reform >= 2` gate is a real, generic, kept cross-dependency with the Judiciary
  track — preserve it.
- Fix the `agriculture_minister_party = "SPD"`-class gate strings to match root.scene.dry's
  actual value (`Q.agriculture_minister = 'Domingo'`, party `'PRRS'` — check the exact string
  and gate on it correctly, or gate on `psoe_in_government` instead if that's the more robust
  signal, matching Area E's `spd_in_government→psoe_in_government` fix pattern).
- Drop excised-splinter refs (`lvp_relation`/`lvp_right`); convert `dvp_relation→radical_relation`,
  `z_relation→ceda_relation`, `ddp_*→izq_rep_*`.
- Use the now-declared `Q.rural_policy` (F-0) as the intended gate/counter — decide its exact
  semantics here (e.g. "cumulative land-reform actions taken," incremented alongside
  `land_reform`) since no coherent semantics existed for it before.
- Drop or reframe `hindenburg_angry`/`coup_progress` side effects — the president-anger var
  is deferred German-plot debt; either drop that reference or point it at the live
  `president_angry`/`president_relation` (verify which is the correct live analogue before
  writing).

**Verify:** build+smoke; standalone Node check — assert every effect line's LHS is a
pre-existing key (no `rural_spd`-class phantom left), confirm `land_reform`'s effects now
move `landless_psoe`/`smallholder_psoe` directionally as intended, confirm `rural_policy`
increments without NaN and that its consuming gates (`campaigning.scene.dry`,
`peoples_party*.scene.dry`, `advisors/baade.scene.dry`) resolve to real booleans post-fix
(spot-check at least one).

### F-4 · Regional autonomy (Catalonia/Basque)

Do **not** port any of the 4 `prussian_affairs*.scene.dry` files — they're gated on
undefined vars and permanently dead; leave them in place with an inline `#`-comment flagging
them as superseded-by-F-4-dead-debt (same treatment Area E gave `rally.scene.dry`'s subplot).

Create one new `government_affairs` card (e.g. `catalan_affairs.scene.dry`) modeling the
Generalitat/Statute-of-Autonomy dynamic: options touching `catalan_autonomy` (giving it its
first writer+reader), the existing `in_republican_socialist_catalonia`/`in_radical_ceda_catalonia`/
`in_popular_front_catalonia` coalition flags, `catalonia_leader`, and — reusing F-1's
ban/unban pattern — the three already-live `*_banned_catalonia` militia flags (a
Catalonia-specific militia-ban option distinct from the national one). Keep it right-sized:
2-4 options, not a full autonomy-negotiation tree.

Add **minimal** Basque wiring: `basque_autonomy` currently has zero consumers and no
PNV/Lliga-equivalent vars exist at all — this is genuinely greenfield with no schema to
extend. Recommend a single small card or a couple of options folded into the same new file
(e.g. "Basque autonomy statute" as a secondary action alongside the Catalan one) that gives
`basque_autonomy` its first writer+reader without inventing a parallel full mechanic — full
PNV-relations depth is Area H's to build later if wanted.

**Verify:** build+smoke; standalone Node check — assert `catalan_autonomy`/`basque_autonomy`
LHS targets are the pre-declared vars (no new keys invented), both gain writer+reader;
confirm the 4 dead `prussian_affairs*` files are untouched (diff check) but carry the
flagging comment.

### F-5 · Church–military–Africa axis (the coup)

Rewrite `government_affairs/military_policy.scene.dry` in place:

- Fix finding #7 (the `reichswehr_minister_party = "SPD"` gate that can never be true) —
  check the actual `Q.reichswehr_minister_party` value in root.scene.dry and gate correctly
  (or switch to `psoe_in_government`, matching Area E's fix pattern).
- Fix finding #4 **in this file only** — retarget `reichswehr_loyalty/_strength/_militancy`
  onto the live `army_loyalty/_strength/_militancy`. Do not chase the other ~71 consumer
  files; that's flagged Area H debt.
- Reframe the three cards (fund/cut/reform) around the real 1931-33 stakes: Azaña's military
  reform (officer retirement law, reducing the officer surplus) vs. the Africanista faction
  (Army of Africa veterans — Sanjurjo, Mola, Franco, Goded — who resent it). Wire
  `africa_army` here (giving it its first reader/writer): reform should visibly move
  `africa_army` (officer-corps disloyalty proxy) in the antagonistic direction, same shape as
  the original's `coup_progress`/president-anger effects.

Add one new anticlerical-conflict card (e.g. in `government_affairs` or `party_affairs`,
whichever fits the existing pattern for policy-adjacent debate cards) wiring
`church_relation`/`clerical_conflict` — the 1931 church-burning aftermath, secularization of
education, the fraught PSOE-Church relationship. Give both vars their first writer+reader.

Add one new Sanjurjada-1932 stub event (e.g. `events/sanjurjada_1932.scene.dry`) that reads
`africa_army`/`army_loyalty` and writes `coup_progress` on the **existing escalating-counter
shape** (same pattern the 53-file chain already uses) — a single self-contained scene, not a
branching crisis tree. **Explicitly do not build the July-1936 endgame trigger** — write a
one-paragraph spec (in this plan's docs, not code) of what that trigger needs
(`coup_progress >= 10`-class gate, analogous to `events/march_on_berlin.scene.dry`) and flag
it as Area H's to build.

**Verify:** build+smoke; standalone Node check — confirm `military_policy.scene.dry`'s cards
are now reachable under the live minister/government state; `church_relation`/
`clerical_conflict`/`africa_army` each confirmed writer+reader; the Sanjurjada stub's
`coup_progress` write resolves without NaN and composes sensibly with the counter's existing
0-10 range (don't let one stub event alone push it near the threshold — keep the increment
modest, e.g. +1 to +2, consistent with other single-event nudges seen in the research).

### F-6 · Verification sweep + docs

- Re-run the F-0 dead-var/German-term grep across all F-owned files → zero unexpected hits
  (the flagged out-of-scope items are expected exceptions, same as Area E's `hindenburg_angry`
  qdisplay finding).
- Compiled-output scan of `out/game.json` across all F-owned scene ids for banned German
  militia/military terms.
- Headless Chromium load (`--dump-dom`, check stderr for `Uncaught`/`ReferenceError`/
  `TypeError`).
- Confirm every "F declares this" var from §"What's already live" now has ≥1 writer and ≥1
  reader (the concrete "inert stub → live" bar) — a single consolidated Node script checking
  all six vars at once is cleaner than one per stage.
- Update `CLAUDE.md` (reading list, status-at-a-glance, how-to-continue → recommend Area G or
  H next), `docs/spanish_republic_conversion_design.md` §F (✅ + per-bullet annotations,
  matching D/E's style), and add this plan's own Execution-status section (write it to
  `docs/planning/F_new_subsystems.md`, matching the A/B/BC/D/E house style) documenting:
  what was done, the "Out of scope — flagged engine-scale debt" section (post_event's two
  blocks → C-remnant/H; the 53-file coup chain + `march_on_berlin.scene.dry` → H; the
  72-file `reichswehr_*→army_*` rename → B-remnant/H; the 4 dead `prussian_affairs*` files →
  superseded by F-4), and the July-1936 endgame-trigger spec for Area H to pick up.

---

## Verification (per `CLAUDE.md` — never claim a mechanic works without exercising it)

1. Build+smoke green after every file, trusting only a preceding `BUILD OK`.
2. Dead-var grep sweep per stage (German militia/military/region terms + old party/class
   refs) over F-owned files → zero unexpected hits.
3. Compiled-output scan (`out/game.json`) across all F-owned scene ids for the same banned
   terms.
4. Headless Chromium load → no JS errors.
5. **Standalone Node behavioral checks** for every stage that writes new math or wires a
   previously-inert var (F-1 through F-5) — seed real `Q` start values from `root.scene.dry`,
   exercise each reachable branch, assert (a) no `NaN` writes (every LHS pre-exists), (b) the
   stage's target inert var(s) now have ≥1 writer + ≥1 reader, (c) directional correctness
   where a clear direction is intended (e.g. banning a militia should reduce its effective
   strength).
6. F-6's consolidated final check: all six originally-inert vars (`anarchist_insurrection`,
   `catalan_autonomy`, `basque_autonomy`, `church_relation`, `clerical_conflict`,
   `africa_army`) confirmed live.

---

## Deferred / open (state at approval)

- **Out of scope, flagged for Area C-remnant/H:** `post_event.scene.dry`'s dead force-
  computation (~290-316) and coalition-taxonomy (~4900-5079) blocks.
- **Out of scope, flagged for Area H:** the 53-file `coup_progress` event chain,
  `events/march_on_berlin.scene.dry` (the coup trigger itself), and the July-1936 endgame
  trigger spec F-5 writes but does not implement.
- **Out of scope, flagged for Area B-remnant/H:** the 72-file `reichswehr_*→army_*` rename
  beyond `military_policy.scene.dry`.
- **Superseded, left as dead debt:** the 4 `prussian_affairs*.scene.dry` files (F-4).
  `weimar_rally.scene.dry`/`response_to_antisemitism.scene.dry` may end up retired rather
  than reframed (F-1's call at execution time) — either outcome must leave an inline flag,
  not silent half-conversion.
- **Basque autonomy is intentionally minimal** (F-4) — a full PNV/Lliga/ERC-relations depth
  mirroring Catalonia's is future work (Area H), since zero prior schema exists to extend.
- After approval: commit this plan to `docs/planning/F_new_subsystems.md` (F-6); update
  `CLAUDE.md` + design doc status lines as each stage lands, per the established pattern.
