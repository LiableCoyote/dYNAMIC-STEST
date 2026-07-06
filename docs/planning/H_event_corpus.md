# Plan: Area H — Phase 1: The Playable Spine

> **Session handoff.** ✅ **Executed and verified.** H-0 through H-6 are all done. The game is
> now end-to-end playable: April 1931 boot → three elections (each running the real Area-C vote
> math, a Spanish results screen, and a coalition-formation choice that actually changes the
> government) → the escalation chain → the July-1936 coup trigger and resolver → one of four
> Spanish endings. Build + smoke green throughout; a standalone-Node end-to-end simulation drives
> the whole arc and asserts no `NaN` in any live var. See "Execution status" for exact findings,
> what was deliberately left as debt, and a few real deviations from this plan's original text
> (discovered mid-execution, not blind adherence).

## Execution status

**✅ DONE — H-0 through H-6.**

- **H-0 (recon):** confirmed clean baseline build+smoke. The single biggest correction to this
  plan's own premise: `election_1928.scene.dry`'s `@post_election_1928` is **not** simply "a
  ~150-sub-scene German coalition-formation tree" to route around. Its `on-arrival`
  (~1100 lines) is the **live, correct Area-C bloc-bonus seat math** (concatenation-based, auto-
  follows Spanish party keys) and had to be preserved byte-for-byte except one bug fix
  (`nsdap_r` → `falange_r` in its `on-departure`). Only the `on-display` chart, the "Election
  results" prose table, and everything from `@achievement_check_e`/`@coalition_menu` onward
  (~2200 lines of German coalition-choice branches) is the actually-dead part. This changed the
  execution approach from "create a new file and repoint `set-jump`" to "surgically replace two
  sections in place, leave the German coalition-menu tree orphaned-not-deleted."
- **H-1 (the coalition-formation writer — the linchpin):** new `events/coalition_formation.scene.dry`.
  Branches on the election year and offers the historically-grounded, agency-preserving choices
  the plan called for: confirm the Republican-Socialist coalition under Azaña (1931, two minor
  flavor variants); accept opposition or attempt a doomed left coalition in the *bienio negro*
  (1933 — the "defy" branch sets `republican_socialist_failed` and still ends up in
  `in_radical_ceda`, at a cost, modeling the real futility of clinging to power without a
  majority); the real Prieto (join cabinet) vs. Caballero (support from outside) split over the
  1936 Popular Front. Every branch writes exactly one of
  `in_republican_socialist`/`in_radical_ceda`/`in_popular_front` (clearing the other two),
  `psoe_in_government`/`psoe_toleration`, `chancellor`/`chancellor_party`, and the load-bearing
  ministry vars, using the exact party-label strings `library.scene.dry`'s Cabinet display
  already recognizes ("PSOE"/"IR"/"Radical"/"CEDA"/"Monarchist"/"Falange"/"ERC"/"DLR"/"PRRS").
- **H-2 (Spanish election-results presentation):** in `election_1928.scene.dry`, replaced the
  dead German parliament-seat chart (`on-display`) with a Spanish version adapted directly from
  `library.scene.dry`'s `@figures` idiom (same `Q.cortes_size`, same 8-party color/name map), and
  replaced the German "Election results" prose table with a lean Spanish vote/seat table plus the
  election-history line graph. Repointed the results screen's `go-to` from the dead
  `@achievement_check_e` to the new `@coalition_formation`. The old German
  `@achievement_check_e`→`@coalition_menu` tree (~2200 lines, ~22 coalition branches, the
  ministries sub-scenes) is flagged inline as orphaned dead code, not deleted.
- **H-3 (mid-game hygiene):** retired `events/1934_end.scene.dry` (a `hindenburg_dead`
  Weimar-victory-check with no Spanish equivalent). Traced all 9 "reachable-but-German" events
  this plan flagged (`banking_crisis`, `capital_strike`, `popular_front_dispute`,
  `kpd_goals`/`kpd_goals_2`/`kpd_ultimatum`, `cabinet_reshuffled`,
  `vote_of_no_confidence`/`_joever`) and found **all 9 were already unreachable** — every one
  gates on `spd_in_government` (never set truthy in Spanish play; only `psoe_in_government` is)
  or a ministry-party string comparison against a German party letter ("SPD"/"Z"/"KPD") that no
  Spanish ministry label ever matches. This plan's own grep heuristic (live var OR'd with a
  German token) produced false positives here — the German token half of each gate is what's
  actually load-bearing and always false. All 9 got explicit `view-if: 0` + a comment anyway
  (documenting *why*, not just flagging), rather than leaving them to rely on that dead-var chain
  never accidentally becoming live. Fixed the turn-1 opening prose (the epigraph, now an Azaña
  quote from the 1931 Constituent Cortes; dropped the now-inapplicable Mod Loader paragraph,
  since this is a standalone build per `CLAUDE.md`; the visible `= 1928` difficulty-screen
  header → `= 1931`; the two "mod mode" difficulty options' subtitles no longer call this a
  mod). Found and fixed one real bug in `main.scene.dry`'s hub decks: the Economic Policy deck's
  gate (`spd_in_government`/minister-party `== "SPD"`) could never pass — but **deliberately did
  not** retarget it onto the Spanish equivalents, since `government_affairs/economic_policy.scene.dry`
  is itself still 100% unconverted German content (part of Area G's ~37-card backlog). Making the
  gate pass would have surfaced that content to the player, which is worse than the deck not
  appearing at all — left explicitly `view-if: 0` with a comment for whoever picks up Area G.
- **H-4 (the July-1936 endgame):** four new escalation events
  (`events/asturias_rising.scene.dry` — October 1934, the largest single bump;
  `events/popular_front_victory_shock.scene.dry` — Feb/Mar 1936; `events/spring_1936_breakdown.scene.dry`
  — Apr-Jun 1936; `events/calvo_sotelo_assassination.scene.dry` — July 1936) that, together with
  the already-live Sanjurjada/Casas Viejas events, push `coup_progress` past the July-1936
  threshold across ordinary playthroughs (an end-to-end sim confirmed 12-14 reached even on a
  fully passive path taking no confrontational cards). New `events/july_1936_coup.scene.dry`
  is the trigger + resolver in one scene: forks its framing on `army_loyalty`/`africa_army` (a
  clean sweep vs. the historical divergence — succeeding in some regions, failing in Madrid/
  Barcelona), offers three response choices (appeal to the army, arm the UGT/CNT militias,
  general strike), then computes `total_power` vs. `enemy_power` entirely from live
  militia/army/Guardia Civil vars and sets exactly one of
  `republic_victory`/`long_war`/`total_defeat`. Fixed the single highest-visibility German-
  content bug found in the whole of Area H: `game_over.scene.dry`'s `@no_hitler` ending's
  condition (chancellor/president never "Hitler"/"Göring", chancellor_party never "NSDAP") was
  **trivially always true** in Spanish play, so it fired on *every single playthrough*
  regardless of outcome — the terminal screen every player sees. Repurposed it as "The Republic
  Endures" (the coup-averted/stable-government ending), gated on no coup outcome being set.
  Rewrote `@civil_war_won`/`@civil_war_lost`/`@long_war` (already gated on the live
  `republic_victory`/`total_defeat`/`long_war` flags, confirming this plan's own "rename-only"
  prediction) to Spanish prose. `events/game_over_1934.scene.dry` (the old German date-hard-stop,
  orphaned by H-3's retirement of its only entry point) is flagged as superseded.
  `ending_slides.scene.dry` (the optional "View ending slides" deep-dive screen, reachable
  whenever `not total_defeat`) is deliberately **not** rewritten — its German
  president/Mussolini/Austria flavor content is out of Phase-1 scope; flagged below as known
  reachable debt for a later pass.
- **H-5 (neutralize dead `post_event.scene.dry` blocks):** guarded off (`if (false) { ... }`,
  not deleted) **Block A** (the German paramilitary force-share model, ~290-376) and **Block B**
  (the ~25-var German coalition-percentage taxonomy plus its `_prussia` duplicate, ~4883-5097) —
  both have been silently producing `NaN` every turn since Area B. Traced every consumer of
  both blocks' outputs: all confirmed-dead German scenes, except `status.scene.dry`, which read
  Block A's outputs for a "Distribution of Power" sentence that — independent of this guard —
  always rendered as a dangling fragment (its own gate, `streetfighting_joever`, is also always
  false). Fixed in the same pass: added the same live-var force computation Area F already used
  for the `@paramilitaries` panel to `status.scene.dry`'s top-level `on-arrival`, so the
  Party-section line now reads correctly every time. Verified via a standalone Node simulation
  running a full `root.scene.dry` boot + one `post_event` turn tick: confirmed neither block's
  outputs are ever written (proving the guard is inert) and that no live var anywhere in the
  game comes out `NaN`.
- **H-6 (verification sweep + docs):** the headline check — a standalone Node **end-to-end
  playthrough simulation** driving boot → the 1931/1933/1936 elections (each running the real
  compiled `election_algorithm` + `post_election_1928` math) → H-1's coalition writer (asserting
  the government actually transitions Republican-Socialist → Radical-CEDA → Popular Front, PM
  Alcalá-Zamora → Azaña → Lerroux) → the escalation chain → the July-1936 coup trigger and
  resolver → a single, correctly-resolved ending, with **zero unexpected `NaN`** anywhere in `Q`
  across the whole run. German-token grep sweep across every new/touched Area H file and a
  compiled-`game.json` scan across all new scene IDs → zero player-visible German content (two
  harmless false positives: a code comment citing "Weimar" by name in a doc-comment, and the
  kept scene id `@no_hitler`, which is a scene identifier string, not displayed prose — matches
  the project's "scene IDs are not renamed" policy). Headless Chromium load → no
  `Uncaught`/`ReferenceError`/`TypeError`. `CLAUDE.md` and this doc updated.

**New findings from execution, not anticipated by the plan text:**
1. **`@post_election_1928`'s scale and composition** (H-0, above) — the plan's own research
   pass mischaracterized it; corrected before any edits were made.
2. **All 9 of the plan's "reachable-but-German" H-3 events were already dead**, via a different
   mechanism (a `spd_in_government`/ministry-string trap) than the plan's grep heuristic assumed.
   Gated off anyway, with the real reason documented, rather than leaving the false-safety net in
   place.
3. **`main.scene.dry`'s Economic Policy hub-deck gate** was similarly dead, but here fixing the
   gate the way the plan literally suggested ("so the pinned Government/Economic decks appear
   correctly") would have been actively harmful, since the deck's content is unconverted Area-G
   debt. Left off on purpose — a case where the plan's literal instruction had to be overridden
   by what was actually found.
4. **A second, smaller dead-German block interleaved inside `@post_election_1928`'s live math**
   (hardcoded `bvp_r`/`z_minus_bvp_r`/`weimar_coalition`/`grand_coalition`/etc., computed from
   old party letters never touched by the Spanish rename since they were never written via
   concatenation) — produces `NaN` on every election, distinct from post_event.scene.dry's
   Block A/B. Confirmed no live consumer (same "dead output" pattern). **Not neutralized in
   Phase 1** — it's interleaved with the live bloc-bonus math H-1/H-2 had to preserve intact, and
   untangling it safely is a more surgical job than this stage's mandate. Flagged here for
   whoever next touches `election_1928.scene.dry`.
5. **`ending_slides.scene.dry`** (game_over.scene.dry's optional "View ending slides" link) is
   reachable whenever `not total_defeat` (i.e., most endings) and is still 100% unconverted
   German/Austria/Mussolini flavor content. Out of Phase-1 scope (a much larger rewrite than the
   primary `#endings` scan this stage fixed) — flagged for a later pass.

**Deferred / explicitly out of scope for Phase 1 (unchanged from the plan's original list):**
bulk deletion of the ~196 dead German files; the 72-file `reichswehr_*→army_*` mass rename; a
full Spanish rewrite of `post_event.scene.dry` Block B (only needed for an electoral-takeover
ending path this phase doesn't add); a Spanish mid-term government-collapse mechanic (H-1's three
elections drive the three governments, which is enough for the spine); the full
`main.scene.dry` flavor-trigger rewrite and the deep per-year demographic-drift matrix
(`post_event.scene.dry` ~1683-2248); deep flavor event chains (Area G / a later Area H phase);
`ending_slides.scene.dry`'s full conversion (new, see finding 5 above).

---

> **Audience: a Sonnet-class executor working cold.** Read `CLAUDE.md`,
> `docs/planning/B_state_schema.md`, and `docs/planning/F_new_subsystems.md` before touching
> anything. `npm run build && npm run smoke` after **every file**, trusting only
> `BUILD OK`/`SMOKE PASSED`. The guardrails repeat on purpose — the failure mode here is a
> silently-frozen game state or German prose leaking to the player, neither of which the
> compiler catches.

---

## Context

Areas A–F rebuilt the engine, the state schema, the election math, the PSOE's internals, the
party landscape, and the four new subsystems. But the game is **still not end-to-end
playable**, and three research passes pinpointed exactly why:

1. **The government is frozen.** The Spanish coalition flags `in_republican_socialist`,
   `in_radical_ceda`, `in_popular_front` are **written nowhere outside `root.scene.dry`'s init**
   (verified: `in_republican_socialist =` and `in_radical_ceda =` appear only at
   `root.scene.dry:502/504`; `in_popular_front` is written only by **German** scenes that set
   `chancellor = "Breitscheid"` and German ministries). They are *read* by ~158 files (the HUD,
   `military_policy.scene.dry`, advisors) but never *set* with Spanish content. **The game can
   never legally leave its April-1931 Republican-Socialist starting state** — no Radical-CEDA
   *bienio negro*, no Popular Front.
2. **The election dumps the player into a German government.** `events/election_1928.scene.dry`'s
   header + `on-departure` are already Spanish (Area C retargeted the calendar: 1931→1933→1936),
   and its `@election_algorithm` runs the correct Spanish vote math — but it `set-jump`s into
   `post_election_1928`, a ~150-sub-scene German coalition-formation tree
   (`chancellor = "Noske"/"Breitscheid"/"Brüning"`, DNEF/DSU/Z ministries, `hindenburg_angry = 70`).
   So the player computes a Spanish result (Popular Front 57%) and is then offered *Weimar*
   governments.
3. **The game never ends.** The calendar runs to 1936 but nothing terminates at the July-1936
   coup. The German coup climax (`events/march_on_berlin.scene.dry`) gates on dead vars
   (`far_right_force`, which `post_event.scene.dry` has produced as `NaN` every turn since
   Area B) and routes to German civil-war/ending scenes. Area F left a one-paragraph spec for
   this endgame (in `F_new_subsystems.md`); Phase 1 builds it.

**What already works (verified — build on it, don't rebuild it):** the boot chain
(`root.scene.dry @start` init is fully Spanish), the difficulty scenes, the monthly turn clock
(`post_event.scene.dry:990-1004`), the action economy (`month_actions`), the class-matrix
normalization loop (`post_event.scene.dry:5082-5109`, auto-follows Spanish keys via
concatenation), the `#event` auto-draw (any `tags: event` scene whose `view-if` passes is
surfaced — no queue wiring needed), the election scene's date-gated `view-if` + self-rescheduling
`on-departure`, and **6 of 7 yearly ticks** (`1931`–`1936` are already Spanish; only `1934_end`
is dead German).

**Area H Phase 1's job:** fill exactly the three gaps above — write the Spanish coalition
formation, present Spanish election results, build the July-1936 endgame — plus gate off the
handful of reachable-but-German mid-game events so nothing Weimar leaks to the player. That is
the **minimum viable playable spine** the design doc calls the first milestone.

---

## The six guardrails (memorize; they recur in every stage)

1. **Build discipline.** `npm run build && npm run smoke` after every file. Never raw
   `dendrynexus make-html`. Trust only `BUILD OK` immediately followed by `SMOKE PASSED`.
2. **The concatenation trap + `NaN` silence.** The engine auto-follows Spanish keys for
   *concatenated* reads (`Q[party+'_r']`); only **hardcoded** refs are stale. `undefined op= x`
   silently yields `NaN`, no error. Every var you write must already exist in `root.scene.dry`
   unless the plan says "**H declares this**" — `grep` before writing.
3. **New scenes read LIVE vars only.** The endgame resolver, coalition writer, and any new
   escalation event must read the live Spanish militia/army/party vars
   (`ugt_militia_*`, `army_*`, `africa_army`, `psoe_r`, the `in_*` coalition flags) — **never**
   the dead German aggregates (`far_right_force`, `reichswehr_loyalty`, `far_right_coalition`,
   `sa_strength`). This is how Phase 1 sidesteps the 72-file `reichswehr_*→army_*` rename: write
   fresh against live vars instead of renaming dead German scenes.
4. **Scene IDs are not renamed** (CLAUDE.md policy). `election_1928.scene.dry` keeps its
   filename even though it's the Spanish Cortes election. New scenes get Spanish filenames; when
   you must repoint a `set-jump`/`go-to`, edit the *reference*, not the target's ID.
5. **`.dry` syntax.** Bare `//` only inside `{! ... !}`. `#`-prefixed lines are valid content
   comments. A stray `//` between header properties is a hard compile error.
6. **Content-debt boundary + verify-by-exercising.** Do not touch the ~196 dead German files
   (they never fire — pre-1931 date gates or dead flags), the advisor roster (Area I), or deep
   flavor chains. Where you gate off a reachable-but-German event, leave an inline flag. And
   **never claim the spine works without exercising it** — a standalone Node simulation of the
   turn/election/coalition/coup transitions is the bar (that's how B/C/D/E/F were verified).

---

## What's already live vs. what's broken (the map)

### Already Spanish — leave alone / verify only
- Boot + init: `root.scene.dry @start` (Spanish). Turn clock, action economy, class
  normalization, `#event` draw: engine-generic, work.
- Election engine: `election_algorithm.scene.dry`, `election_simulation.scene.dry`; the
  `election_1928.scene.dry` **header (lines 1-6)** + **on-departure (7-27, the 1931→1933→1936
  calendar advance)**.
- Yearly ticks `1931`–`1936` (Spanish prose). Area F anchors `sanjurjada_1932.scene.dry`,
  `casas_viejas.scene.dry`. Area F/E cards that nudge `coup_progress` (`military_policy`,
  `agricultural_policy`, `confronting_nazis`, `crisis_program`, `streetfighting`,
  `catalan_affairs`).

### The three spine gaps (Phase 1 builds these)
- **G1 — coalition formation writer** (nothing writes the 3 flags). Highest priority.
- **G2 — Spanish election-results presentation** (`post_election_1928` body is German).
- **G3 — July-1936 endgame** (no coup trigger, no Spanish resolver, no Spanish endings).

### Reachable-but-German (gate off / minimally rewrite so it doesn't leak — H-3)
Live-var-gated German events that *will* surface Weimar prose mid-game (verified gates read
`in_popular_front`/`budget`/`coalition_dissent`, which are live): `banking_crisis.scene.dry`,
`capital_strike.scene.dry`, `popular_front_dispute.scene.dry` (Zentrum ministers →
irrelevant in Spain), `kpd_goals.scene.dry`/`kpd_goals_2.scene.dry`/`kpd_ultimatum.scene.dry`
(KPD → PCE), `cabinet_reshuffled.scene.dry`, `vote_of_no_confidence.scene.dry`/
`vote_of_no_confidence_joever.scene.dry`. (Note: `cabinet_reshuffled` and `vote_of_no_confidence`
are the German *government-change* mechanism — Phase 1 replaces their function with H-1's
election-driven transitions and simply gates them off; a Spanish mid-term-collapse mechanic is
deferred.)

### Dead German — DO NOT TOUCH in Phase 1 (deferred bulk work)
The ~122-file Brüning/Papen/Schleicher chancellor simulation, the ~74-file party-merger/splinter
corpus, the `_prussia` collapse chain, `prussia_election_1928`, the presidential-election chain,
the SA/SH ban-unban chain — all gated on pre-1931 dates or dead German flags/chancellor names, so
they **never fire**. Harmless cruft. Bulk deletion is deferred (see "Deferred").

### Known dead engine blocks (Phase 1 neutralizes, does not rewrite — H-5)
`post_event.scene.dry` **Block A** (force computation, ~lines 290-372) and **Block B**
(coalition taxonomy, ~lines 4890-5080) produce `NaN` every turn on dead German vars. Nothing
*live* reads their outputs once the new endgame computes forces inline (guardrail #3). Phase 1
**neutralizes** them (guards them off so they stop churning `NaN`) rather than rewriting —
a full Spanish rewrite of Block B is only needed if a future phase adds an electoral-takeover
path, which Phase 1's coup is not.

---

## Stage order and why

**H-0 (recon) → H-1 (coalition writer) → H-2 (results presentation) → H-3 (mid-game hygiene) →
H-4 (July-1936 endgame) → H-5 (neutralize dead blocks) → H-6 (verify + docs).**

- **H-1 first and foremost:** the coalition writer is the linchpin — until the government can
  change, nothing else about the political arc matters. Everything downstream (H-2's results
  screen leads into it; H-4's coup escalation is shaped by which coalition is in power) depends
  on it existing.
- **H-2 with/after H-1:** they share the post-election flow (results → coalition choice); build
  the writer first so the results screen has something to route into.
- **H-3 before H-4:** clear the German mid-game noise so a playthrough test of the endgame isn't
  polluted by Weimar events firing.
- **H-4 (endgame) after the arc works:** its escalation events and coup timing are tuned against
  a game that actually transitions 1931→1933→1936, so build that first.
- **H-5 neutralize + H-6 verify last:** cleanup and the full end-to-end playthrough simulation.

---

## Stage details

### H-0 · Recon + baseline + the dead-event inventory

Confirm a clean `npm run build && npm run smoke`. Produce three grep-based lists to diff against
later: (a) **already-Spanish leave-alone** events, (b) the **reachable-but-German** set for H-3
(grep `events/` for `view-if` clauses referencing live vars `in_popular_front|budget|
coalition_dissent|economic_growth|unemployed` combined with German tokens `chancellor ==
"Brüning|Papen|Schleicher"|kpd_|nsdap_|z_relation|hindenburg`), (c) the **dead-never-fires** set
(pre-1931 `year =` gates + dead-flag gates) — for the deferred bulk pass, not touched now. Read
`events/election_1928.scene.dry`'s top (lines 1-40) and its `set-jump`/`post_election_1928` entry
to confirm the exact routing H-1/H-2 will repoint. **Verify:** build+smoke.

### H-1 · The coalition-formation writer (the linchpin)

Create a new Spanish scene (e.g. `events/coalition_formation.scene.dry`, or rewrite
`post_election_1928`'s Spanish-entry sub-scene in place) that runs **after** the election
algorithm computes the vote, reads the result (`psoe_r`, `ceda_r`, `izq_rep_r`, `radical_r`,
`pce_r`, and the bloc totals), and **writes** the government state:

- Sets exactly one of `in_republican_socialist` / `in_radical_ceda` / `in_popular_front`
  (clearing the other two), `psoe_in_government` (or `psoe_toleration`), `chancellor` (the PM),
  `chancellor_party`, and the Spanish ministry-party vars (`agriculture_minister_party` etc.,
  which already hold Spanish values like `'PRRS'`/`'IR'` in root — set them per the coalition).
- Offers the player **historically-grounded coalition choices**, defaulting to the historical
  outcome but allowing agency:
  - **June 1931 (Constituent Cortes, left bloc ~63%):** confirm/continue the
    **Republican-Socialist** coalition; PM Azaña (from Oct 1931); `in_republican_socialist = 1`,
    `psoe_in_government = 1`.
  - **Nov 1933 (Radical-CEDA, ~55%):** the *bienio negro* — PSOE goes into **opposition**; PM
    Lerroux; `in_radical_ceda = 1`, `psoe_in_government = 0`. (Player agency: accept opposition
    vs. attempt a doomed left coalition.)
  - **Feb 1936 (Popular Front, ~57%):** `in_popular_front = 1`; PM Azaña→Casares Quiroga. Model
    the **real Prieto-vs-Caballero split**: PSOE *supports* the Popular Front but famously
    declines cabinet seats — offer `psoe_in_government` (Prietista: join) vs. `psoe_toleration`
    (Caballerista: support from outside). This is a genuine, load-bearing Spanish choice.
- **Repoint the election's routing** (`election_1928.scene.dry`'s `set-jump`/`go-to` that
  currently targets `post_election_1928`) to this new flow. The German `post_election_1928`
  sub-tree is then left dead (never reached) — flag it inline, do not delete in Phase 1.

**Verify:** build+smoke; **standalone Node check** — simulate the three elections with
representative vote splits, assert each writes exactly one coalition flag (others cleared),
sets a Spanish PM/ministries, no `NaN`, and `psoe_in_government`/`psoe_toleration` resolve to
0/1 (the 1936 Prieto/Caballero branch toggles correctly).

### H-2 · Spanish election-results presentation

The results screen the player sees between the algorithm and H-1's coalition choice — replaces
`post_election_1928`'s German results prose. Show the Spanish seat/vote outcome (reuse the live
`psoe_r`/`ceda_r`/etc. and the parliament-SVG idiom already in `library.scene.dry`'s `@figures`),
name the winning bloc, and lead into H-1. Keep it lean — one results scene routing into the
coalition choice. **Verify:** build+smoke; headless load (no JS errors); confirm the compiled
results scene shows Spanish party names/seat counts, no German tokens.

### H-3 · Mid-game hygiene (gate the German noise + opening prose)

- **Retire `events/1934_end.scene.dry`** (gated on `hindenburg_dead`, a Weimar victory-check —
  dead and Nazi-framed): `view-if: 0` + inline flag, matching Area F's retirement of
  `response_to_antisemitism.scene.dry`.
- **Gate off the reachable-but-German events** from H-0's list (b): `banking_crisis`,
  `capital_strike`, `popular_front_dispute`, `kpd_goals`/`kpd_goals_2`/`kpd_ultimatum`,
  `cabinet_reshuffled`, `vote_of_no_confidence`/`_joever`. For each, either add a `view-if: 0`
  retirement flag (fastest, safe) **or**, if the event's *mechanic* is worth keeping (e.g. a
  generic banking crisis), do a light Spanish rewrite. Default to gating off in Phase 1;
  Spanish rewrites of the good ones are a Phase-2/Area-G call. Leave an inline flag on each.
- **Fix the turn-1 opening prose** the player actually sees: `root.scene.dry`'s intro epigraph
  (~lines 1179-1187, still "the German Republic") and the visible `= 1928` header in the
  difficulty scenes → Spanish (1931 framing). Fix `main.scene.dry`'s hub-deck `view-if` gates
  that still reference German coalition flags (`spd_in_government` → `psoe_in_government`, etc.)
  so the pinned Government/Economic decks appear correctly. **Do not** attempt the full
  `main.scene.dry` flavor-trigger rewrite (its huge German flavor block is cosmetic and
  non-blocking — deferred).

**Verify:** build+smoke after each file; grep the gated events confirm `view-if: 0`; headless
load; confirm no German tokens in the turn-1 prose path.

### H-4 · The July-1936 endgame

Four pieces (model structures on the named templates; write all effects against **live** vars):

1. **Escalation events** to make `coup_progress >= 10` reachable by July 1936. Current wired
   Spanish increments (Sanjurjada +2, Casas Viejas +1, plus card nudges) total only ~3 — budget
   **4-6 new date/state-gated events, each +1 to +3**, e.g.: the **October 1934 Asturias rising**
   (the big one — a UGT/Socialist-led insurrection crushed by the Army of Africa; large
   `coup_progress`/`africa_army` bump, shifts the arc); a **Feb-1936 Popular Front victory shock**
   (the right's reaction to losing — model on the German "+4 on a left-president win"); the
   **spring-1936 breakdown** (church burnings, land seizures, street violence — reads
   `clerical_conflict`/`anarchist_militancy`); the **Calvo Sotelo assassination (July 1936)** as
   the final trigger-arming event. Each a `tags: event`, date+state `view-if`, `max-visits: 1`,
   modest increment — same shape as `sanjurjada_1932.scene.dry`.
2. **The coup trigger** — new `events/july_1936_coup.scene.dry` (or similar), modeled on
   `march_on_berlin.scene.dry`'s structure but: `view-if: year = 1936 and month >= 7 and
   (coup_progress >= 10 or army_loyalty <= 0.1)`; `tags: event`. Reads `army_loyalty`/`africa_army`
   to fork between a swift takeover (low loyalty, high Africanista) and a botched/partial rising —
   the historical divergence that produced the Civil War. Routes to piece 3.
3. **The Spanish civil-war resolver** — new scene modeled on `civil_war.scene.dry`'s force-tally
   structure, but computing `total_power` (Republic: `ugt_militia_*` + `cnt_militia_*` if allied
   + loyal `army_*` + `asalto_*` + general strike from the worker share) vs `enemy_power`
   (`falange_militia_*` + `requetes_*` + `africa_army` + disloyal `army_*` + `guardia_civil_*`
   share) **entirely inline from live vars** (the F-1 `status.scene.dry` idiom). Sets the generic
   outcome flags the endings already key on: `republic_victory` / `long_war` / `total_defeat`.
   Player gets 2-3 choices (appeal to the loyal army, arm the militias/CNT, general strike)
   before resolution. Routes to `game_over`.
4. **Spanish endings** — in `game_over.scene.dry` / `ending_slides.scene.dry`, add the four
   Spanish outcomes keyed on the generic flags (which already exist and port cleanly — the German
   `@civil_war_won`/`@long_war`/`@total_defeat` branches are rename-only): **coup averted**
   (`coup_progress` never hit 10 / rising beaten fast → the Republic endures), **failed coup →
   civil war won** (`republic_victory`), **coup succeeds / long war** (`total_defeat` vs
   `long_war`, on high `africa_army` + low `army_loyalty`), **stable Popular Front** (no coup,
   `pro_republic` high). Rewrite the *reachable* German ending branches to Spanish prose; leave
   the deep German-president/Nazi/monarchist ending branches (dead, never reached) flagged for a
   later pass. Also retarget or replace `events/game_over_1934.scene.dry` (German date-hard-stop)
   — Spain's hard stop is the July-1936 coup, which pieces 2-3 now provide.

**Verify:** build+smoke after each file; **standalone Node simulation** driving the whole coup
path — seed a late-1936 state, fire the escalation events, assert `coup_progress` reaches ≥10 by
July 1936, the trigger fires, the resolver computes non-`NaN` forces from live vars and sets
exactly one outcome flag, and each of the four endings is reachable under the right flag
combination. This is the spine's payoff — exercise it, don't just compile it.

### H-5 · Neutralize the dead `post_event.scene.dry` blocks

Guard **Block A** (force computation ~290-372) and **Block B** (coalition taxonomy ~4890-5080)
so they stop producing `NaN` every turn — the cleanest is to wrap each in a condition that's
false in Spanish play (or delete the block if grep confirms no *live* scene reads its outputs
after H-4). Before touching either, `grep` every consumer of their outputs (`far_right_force`,
`democracy_force`, `far_right_coalition`, etc.) and confirm each remaining reader is either a
dead German scene (fine) or has been repointed by H-4. Do **not** rewrite them to Spanish — a
Spanish Block B is only needed for an electoral-takeover path Phase 1 doesn't build.
**Verify:** build+smoke; a turn-tick Node check confirming no `NaN` is written into live vars
during a normal turn after the guard.

### H-6 · Verification sweep + docs

- **End-to-end playthrough simulation** (the headline verification): a standalone Node script
  that drives a full game — boot → April 1931 → the three elections (each running the algorithm,
  the results screen, and H-1's coalition writer, asserting the government transitions
  Republican-Socialist → Radical-CEDA → Popular Front) → the escalation events → the July-1936
  coup → one of the four endings. Assert no `NaN` in any coalition/coup/force var across the
  whole run. This proves the spine is traversable.
- Grep sweep: no German tokens on the critical path (the new coalition/results/endgame scenes +
  the turn-1 prose); the gated German events all carry `view-if: 0` + a flag.
- Compiled-output scan (`out/game.json`) across the new/rewritten scene ids for banned German
  tokens; headless Chromium load (no `Uncaught`/`ReferenceError`/`TypeError`).
- Write `docs/planning/H_event_corpus.md`'s "Execution status" section (matching the
  A/B/BC/D/E/F house style) documenting what Phase 1 did, the deferred Phase-2 work, and any
  new findings. Update `CLAUDE.md` (reading list, status-at-a-glance → Area H Phase 1 done, the
  game is now end-to-end playable; how-to-continue → Area G / Area H Phase 2 / Area I) and the
  design doc's §H.

---

## Verification (per `CLAUDE.md` — never claim a mechanic works without exercising it)

1. Build+smoke green after every file, trusting only a preceding `BUILD OK`.
2. The **three targeted Node checks** (H-1 coalition transitions, H-4 coup path, H-5 no-NaN tick)
   plus **H-6's full end-to-end playthrough simulation** — the latter is the definitive proof
   the spine is traversable April 1931 → July 1936.
3. German-token grep over the critical-path scenes → zero unexpected hits.
4. Compiled-output scan + headless load → no German residue on the path, no JS errors.
5. The "government actually changes" assertion is the load-bearing one: after each election, the
   active `in_*` coalition flag must differ from the prior state (Republican-Socialist →
   Radical-CEDA → Popular Front). If it doesn't, H-1 is broken regardless of what compiles.

---

## Deferred / open (state at approval) — Area H Phase 2 and beyond

- **Bulk deletion of the ~196 dead German files** (Brüning/Papen/Schleicher chancellor sim,
  party-merger/splinter corpus, `_prussia` collapse chain, presidential-election chain, SA/SH
  ban chain). They never fire, so they're harmless cruft; deleting is cleanup, not spine work,
  and is risky (trace live-var consumers first). Deferred.
- **The 72-file `reichswehr_*→army_*` mass rename.** Phase 1 sidesteps it by writing the new
  endgame against live `army_*` vars; the 72 dead German consumers are on the deletion list
  above. Deferred (do only if a kept scene needs it).
- **A full Spanish rewrite of `post_event.scene.dry` Block B** (coalition taxonomy) — only needed
  if a later phase adds an electoral-far-right-takeover ending path. Deferred.
- **A Spanish mid-term government-collapse mechanic** (the Spanish analogue of
  `vote_of_no_confidence`/`cabinet_reshuffled`, which Phase 1 gates off) — deferred; Phase 1's
  three elections drive the three governments, which is enough for the spine.
- **The full `main.scene.dry` flavor-trigger rewrite** and the deep per-year demographic-drift
  matrix writes in `post_event.scene.dry` (~1683-2248) — cosmetic/non-blocking German content,
  deferred (matches Area C's documented C-2/C-5/C-8 deferral).
- **Deep flavor event chains** (foreign policy, the good crisis events worth Spanish rewrites) —
  Area G / a later Area H phase.
