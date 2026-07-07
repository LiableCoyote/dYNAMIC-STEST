# Plan: Area H — Phase 2: The Bulk Cleanup

> **Session handoff.** 🔲 **APPROVED — NOT YET STARTED.** This is the detailed, deliberately
> redundant execution plan for **Area H Phase 2** — the deferred bulk cleanup that Phase 1
> (`H_event_corpus.md`) explicitly left behind. Phase 1 made the game **end-to-end playable**
> (April 1931 → three elections → July-1936 coup → four Spanish endings) without deleting
> anything; it routed *around* the dead German corpus and neutralized the NaN-producing engine
> blocks in place. Phase 2 is the **demolition and tidy-up pass**: physically delete the ~200
> dead German scene files, mop up the `reichswehr_*` residue, convert the one remaining
> reachable German screen (`ending_slides.scene.dry`), and optionally excise the small dead
> block still interleaved in the live election math. **None of this changes gameplay** — it is
> pure cleanup. The whole point is that the game plays *identically* before and after, only with
> ~200 fewer dead files and no German residue on any reachable path. When execution begins, add
> an "Execution status" section at the top (mirroring `F_new_subsystems.md` / `H_event_corpus.md`)
> and flip the banner to ✅ as the final stage lands.

> **Audience: a Sonnet-class executor working cold.** Read `CLAUDE.md`,
> `docs/planning/B_state_schema.md`, and `docs/planning/H_event_corpus.md` (Phase 1 — especially
> its "Execution status" and "New findings" sections; several Phase-2 items were discovered
> there) before touching anything. `npm run build && npm run smoke` after **every batch**,
> trusting only `BUILD OK` immediately followed by `SMOKE PASSED`. The guardrails repeat on
> purpose — the failure mode in a deletion pass is a *silently* removed live scene or a
> live→dead reference that breaks the compile, and the second is far safer than the first
> because the compiler catches it loudly.

---

## Context

Phase 1 left the repository in a deliberate state: **the spine is live, and the ~200 dead German
files are still on disk, harmless.** They never fire (pre-1931 date gates, dead-flag gates, German
chancellor-name gates that no Spanish value ever matches), so they cost nothing at runtime — but
they clutter the tree, inflate every grep, and keep German prose one `view-if` typo away from a
player's screen. Phase 1's content-debt boundary said "route around, don't delete" precisely so
that deletion could happen later as one focused, separately-verified pass, when the live keep-set
was fully known. That time is now.

**The single most important fact for this whole phase:** `npm run build` (via `dendrynexus`'s
`getFullyQualifiedId`, `compiler.js:105-116`) **hard-errors** on *any* unresolved scene-id
reference — `go-to`, `set-jump`, `call`, a menu option `- @some_id`, or a check-success/failure
target. Verified in Phase 1 (deleting `coalition_formation`'s target before creating it produced
`Error: Couldn't find an id matching "coalition_formation"`). This makes deletion **self-checking**:
you cannot silently orphan a live reference — the build will name the exact surviving file that
still points at whatever you deleted. Deletion in this project is therefore a *build-driven* loop,
not a leap of faith.

**What Phase 2 owns:** the four deferred items listed at the bottom of `H_event_corpus.md`'s
"Deferred" section —
1. bulk deletion of the ~200 dead German files (the Brüning/Papen/Schleicher chancellor sim, the
   party-merger/splinter corpus, the `_prussia` collapse chain, the presidential-election chain,
   the SA/SH ban chain, the Austria/foreign chains, the old German coup/civil-war chain);
2. the `reichswehr_*→army_*` residue (which, per recon below, is *far* smaller than the "72-file
   rename" the Phase-1 doc feared — most of those 72 files are *in* the delete set);
3. `ending_slides.scene.dry`'s conversion (the one still-reachable German screen);
4. the small dead block interleaved inside `@post_election_1928`'s live seat math (optional; see
   H2-4 for the risk/reward call).

**What Phase 2 does NOT own** (leave strictly alone): the `advisors/` directory (Area I — 28 files,
only 1 even mentions a German-military var; they draw via the `#advisor` tag and are Area I's
rewrite); the `government_affairs/` cards Areas B/E/F/H didn't touch (Area G — e.g.
`economic_policy.scene.dry`, gated off in Phase 1 pending Area G); the `qdisplays` (Area J); assets
(Area K). Phase 2 is **`events/` + a handful of top-level support scenes**, nothing else.

---

## The keep-list (SACRED — never delete anything here)

This is the exhaustive live set. Everything in `events/` **not** on this list is a deletion
candidate; everything on it must survive Phase 2 untouched (except where a stage below says to edit
it). Re-derive and confirm it in H2-0 before deleting a single file.

**Live `events/` files:**
- **The election engine flow:** `election_1928.scene.dry` (the live Cortes election — keeps its
  filename per the scene-ID policy; H-1/H-2 rebuilt its post-election flow).
- **The coalition writer:** `coalition_formation.scene.dry` (H-1).
- **The yearly economic ticks:** `1931`, `1932`, `1933`, `1934`, `1935`, `1936` (`.scene.dry`) —
  date-driven, Spanish (Area C). **Note:** `1934_end.scene.dry` was **retired** in H-3
  (`view-if: 0`, a dead Weimar victory-check) — it is a *deletion candidate*, not a keeper.
- **The escalation chain + coup (H-4):** `sanjurjada_1932`, `casas_viejas`, `asturias_rising`,
  `popular_front_victory_shock`, `spring_1936_breakdown`, `calvo_sotelo_assassination`,
  `july_1936_coup` (`.scene.dry`).
- **Area F anchors already covered above** (`sanjurjada_1932`, `casas_viejas`).

**Live top-level scenes (in `source/scenes/`, not `events/`):** `root`, `main`, `post_event`,
`game_over`, `library`, `status`, `status_right`, `election_algorithm`, `election_simulation`,
`set_next_election_time`, `set_next_election_time_2`, `credits`, `modinfo`, `return`,
`cancel_advisor_action`, `easy_discard`, and **`ending_slides`** (kept but *rewritten* in H2-3).

**Deletion candidates among top-level scenes** (verify in H2-0): `mod_loader.scene.dry` (standalone
build, not a mod — CLAUDE.md), `set_next_election_time_prussia.scene.dry` (Prussia is gone; but see
the warning below — it is `call:`ed by ~10 dead files that must be deleted in the same batch).

> **Judgement rule for the whole phase:** when unsure whether a file is dead, **do not delete it.**
> A dead file left on disk is harmless (it never fires); a wrongly-deleted live file breaks the
> game and may not be caught by the compiler if nothing references it by id. The cost of caution
> here is asymmetric — err toward keeping.

---

## The six guardrails (memorize; they recur in every stage)

1. **Build is the safety net; use it as one.** `npm run build && npm run smoke` after **every
   deletion batch**, never once at the end. A `Couldn't find an id matching "X" in "Y"` error is
   not a failure — it is the compiler *doing your dependency analysis for you*: file `Y` (still on
   disk) references deleted `X`. Resolve it (delete `Y` too if `Y` is also dead, or de-reference
   `X` inside `Y` if `Y` is a keeper with a dead branch), then rebuild. Loop until `BUILD OK`.
2. **The H-6 end-to-end simulation is the regression oracle.** Phase 1's H-6 wrote a standalone
   Node script that drives boot → 3 elections → escalation → coup → ending and asserts the exact
   government transitions and zero unexpected `NaN`. **Re-run an equivalent script after every
   batch.** Its output must be *identical* before and after every deletion. If a deletion changes
   what it prints, you removed something live — revert and investigate. (Rebuild it from
   `H_event_corpus.md`'s H-6 description; it reads the compiled `out/game.json` and executes
   scenes' compiled `onArrival.$code` against a `Q` object — see that doc for the harness shape.)
3. **The keep-list is sacred (above).** Never delete a keeper. When in doubt, don't delete.
4. **Commit in small, labelled batches.** Delete a coherent dead *chain* (e.g. "the Schleicher
   chancellor sim", "the `_prussia` collapse chain") per commit, not 200 files in one. A bad delete
   must be `git`-bisectable and revertable without unwinding the whole phase.
5. **`.dry` syntax + the scene-ID policy still hold.** Bare `//` only inside `{! !}`; `#`-prefixed
   lines are valid content comments. Do **not** rename scene *IDs* of files you keep (the
   `election_1928` filename stays). Deletion removes whole files; it never renames a survivor's id.
6. **Stay in lane.** `events/` + the handful of named top-level support scenes only. Do **not**
   touch `advisors/` (Area I), the untouched `government_affairs/` cards (Area G), `qdisplays`
   (Area J), or assets (Area K). If a deletion batch's build error points at an Area-I/G/J file,
   that file has a *dead branch* referencing the corpus — gate the branch (`view-if: 0` / remove
   the dead `go-to`), don't rewrite or delete the Area-I/G/J file.

---

## What recon already established (so you can trust the scope)

Run these yourself in H2-0 to confirm, but Phase-2 planning already found:

- **Totals:** 493 `.scene.dry` files — 386 in `events/`, 38 `government_affairs/`, 28 `advisors/`,
  22 `party_affairs/`, 19 top-level. The live `events/` keep-list above is ~15 files, so the
  `events/` deletion candidate pool is **~370** — but many are small and some may turn out to be
  reachable, so the real deleted count will land around the "~196–200" the design doc estimated
  once you exclude anything the build proves is still referenced.
- **The `reichswehr_*→army_*` "72-file rename" is mostly a non-event.** ~74 files touch
  `reichswehr_`, but 24 use **only** `reichswehr_minister`/`_minister_party` (the *kept*
  War-ministry slot — root.scene.dry sets `reichswehr_minister_party = 'IR'`; do **not** rename
  these). Of the ~50 that use the real German-military vars (`reichswehr_loyalty`/`_strength`/
  `_militancy`/`_street`/`_spd`/`_goal`), all but ~7 are **in the delete set** — deletion removes
  them for free. The ~7 survivors (`military_policy` [already renamed by F-5], `game_over`,
  `civil_war`, `election_1928`, `main`, `post_event`, `status`) hold their `reichswehr_` refs in
  **dead blocks** (post_event's already-`if(false)`-guarded A/B; election_1928's dead German
  display; game_over's dead German ending branches; `civil_war.scene.dry` is itself the *old
  German* civil-war resolver, superseded by `july_1936_coup` and a deletion candidate). So the
  rename shrinks to: delete `civil_war.scene.dry`, and in the 3–4 genuine survivors, delete the
  dead block that holds the ref (H2-2). No mass 72-file rename is needed.
- **The `_prussia` election-timer subgraph is connected.** `set_next_election_time_prussia.scene.dry`
  is `call:`ed by ~10 files (`dealing_with_toleration*`, `dnf_collapse*`, `prussia_reichsexekution*`,
  `banking_crisis`, `austrian_customs_union`, `weimar_prussia_collapse`, `kpd_ultimatum_prussia`, …)
  — all dead. Delete the whole subgraph in one batch. **`banking_crisis.scene.dry` is one of the 10
  H-3 `view-if: 0`-retired files** and still `call:`s the prussia timer — a concrete example of why
  the retired-but-not-deleted files (10 of them) are the natural *first* deletion batch.
- **The H-3 retired set (10 files, `view-if: 0`) is safe to delete first.** Nothing live routes to
  them; they were kept only to honor Phase 1's incremental content-debt boundary.
- **`ending_slides.scene.dry`** is reachable from exactly one live edge: `game_over.scene.dry:375`,
  the optional `- @ending_slides: View ending slides.` menu choice. 371 lines, ~20 `view-if`
  branches, all German/Austria/Mussolini flavor. This is the one real content rewrite (H2-3).

---

## Stage order and why

**H2-0 (recon + manifest) → H2-1 (delete the corpus, build-driven) → H2-2 (reichswehr residue) →
H2-3 (ending_slides) → H2-4 (interleaved dead block — optional) → H2-5 (verify + docs).**

- **H2-0 first, and it produces an artifact:** the keep-list and the delete manifest, written down,
  so deletion is executing a reviewed list rather than improvising per-file.
- **H2-1 is the bulk and comes early:** once the corpus is gone, every subsequent grep (for
  `reichswehr_`, for German tokens, for dead references) returns a tiny, tractable result set. Doing
  H2-2/H2-3 *after* deletion means you're only ever looking at survivors.
- **H2-2 after H2-1:** the reichswehr residue is *defined as* "what's left after deletion," so it
  can't be scoped until deletion is done.
- **H2-3 (ending_slides) any time after H2-1**, but it's independent content work — slot it late.
- **H2-4 last and optional:** it's the riskiest (surgery on live math) and lowest-value (the block
  writes to vars no live scene reads). Do it only with the numerical-equivalence guard below, or
  leave it deferred with a clear flag.
- **H2-5 verify + docs last:** the full regression proof (the H-6 sim, unchanged output) plus the
  status-doc updates.

---

## Stage details

### H2-0 · Recon + the deletion manifest

Confirm a clean `npm run build && npm run smoke` baseline. Then **write down** (in scratch, or as a
checklist in this doc's eventual Execution-status section) two lists:

- **The keep-list** — re-derive the section above from the actual tree; confirm every named file
  exists and every live event is accounted for. This is the allow-list deletion must never touch.
- **The delete manifest** — group the deletion candidates into *coherent dead chains* so they can be
  deleted (and committed) as reviewable batches, e.g.:
  1. **The 10 H-3-retired `view-if: 0` files** (`grep -rl '^view-if: 0' source/scenes/events/`) —
     the warm-up batch.
  2. **The `_prussia` chain** (`prussia_*`, `*_prussia`, `set_next_election_time_prussia` +
     everything that `call:`s it).
  3. **The chancellor sim** (`bruning_*`, `papen_*`, `schleicher_*`, `goerdeler_*`, `cabinet_*`,
     `emergency_decree*`, `vote_of_no_confidence*`).
  4. **The party-merger/splinter corpus** (`dnvp_*`, `dvp_*`, `ddp_*`, `lvp_*`, `kvp_*`, `cvp_*`,
     `dnf_*`, `dnef_*`, `dsu_*`, `nvf_*`, `sapd_*`, `kpd_*`, `nazi_*`, `hitler_*`, `harzburg_*`,
     `rohm_*`, `boxheim_*`, `stennes_*`, `strasser_*`).
  5. **The presidential-election chain** (`presidential_election_*`, `hindenburg_*`,
     `death_of_hindenburg*`, `hindenburg_explode*`).
  6. **The Austria / foreign-policy chain** (`austria*`, `austrian_*`, `customs_union`,
     `lausanne_*`, `kellogg_*`, `hoover_*`, `young_plan*`, `locarno*`, `rhineland*`).
  7. **The old German coup/civil-war chain** (`march_on_berlin`, `civil_war`, `prussian_coup*`,
     `hitler_takes_power*`, `hitler_chancellor`, `*_reichsexekution*`, `altona*`).
  8. **Everything else** the build proves unreferenced (a final sweep).

  Do **not** delete anything in H2-0 — just produce the manifest and cross-check it against the
  keep-list (no file may appear on both). **Verify:** build+smoke still green (no changes yet); the
  H-6 regression sim runs and its output is captured as the *golden baseline* to diff against.

### H2-1 · Delete the dead corpus (the build-driven loop)

For each batch in the manifest, in order:

1. `git rm` the batch's files.
2. `npm run build`.
3. If `BUILD OK` → `npm run smoke` → re-run the H-6 regression sim → confirm its output is
   **byte-identical** to the golden baseline → commit the batch with a descriptive message
   (`Area H2-1: delete the <chain name> (<N> files)`).
4. If build errors `Couldn't find an id matching "X" in "Y"`:
   - If `Y` is **also a dead file** (on the manifest, or trivially dead by the same gates) → add `Y`
     to this batch and rebuild. You've just discovered a chain edge — good.
   - If `Y` is a **keeper** (on the keep-list, or an Area-G/I/J file) → `Y` has a *dead branch*
     pointing into the corpus. **Do not delete `Y`.** Instead, neutralize the dead reference inside
     `Y`: if it's a whole dead scene/option, gate it (`view-if: 0` + inline flag, the H-3 idiom) or
     remove the dead `go-to`/`- @X` line; if it's `X` in a `go-to: A if cond; X` list, drop the dead
     clause. Rebuild. (Expect a few of these — e.g. `game_over.scene.dry` and `election_1928.scene.dry`
     have dead German ending/coalition branches that may still name deleted scenes.)

**The regression sim in step 3 is the load-bearing check** — the compiler proves *references*
resolve, but only the sim proves you didn't delete a file the live path actually visits at runtime
via a mechanism the compiler doesn't trace as "reachable" (e.g. a `#tag` auto-draw the sim
exercises). If its output ever drifts, the last batch removed something live.

**Note on `#tag` pools:** deleting `tags: event` / `tags: govt_affairs` / `tags: party_affairs` /
`tags: advisor` files simply shrinks the corresponding auto-draw pool — this is *safe* and produces
no build error (the pool is looked up by tag, not by id). The compiler only errors on explicit id
references. So the vast majority of the corpus deletes cleanly; the build errors you *do* hit are
the valuable ones that map the live↔dead boundary.

**Verify (per batch):** `BUILD OK` → `SMOKE PASSED` → H-6 sim output unchanged → commit.

### H2-2 · The `reichswehr_*` residue

After H2-1, `grep -rl "reichswehr_" source/scenes/` returns only survivors. For each:
- If it uses **only** `reichswehr_minister` / `reichswehr_minister_party` → **leave it.** That is the
  intentional kept War-ministry slot (root.scene.dry's comment: "the war ministry reuses the
  reichswehr_minister slot"). Renaming it to `war_minister_*` is a cosmetic, cross-file, zero-gain
  change out of Phase 2's scope — note it as Area-J/L polish if you like, don't do it here.
- If it uses the real German-military vars (`reichswehr_loyalty`/`_strength`/`_militancy`/etc.) →
  that reference sits in a **dead block** inside a live file (post_event's A/B are already
  `if(false)`-guarded from H-5; election_1928's is the dead German results display; game_over's are
  dead German ending branches). Delete or `if(false)`-guard the dead block (matching H-5's idiom),
  so the survivor no longer names a German-military var at all. Do **not** rename to `army_*` — the
  block is dead; renaming dead code to read live `army_*` vars would be *worse* (it might make dead
  code compute something). Excise, don't rename.
- `civil_war.scene.dry` (the old German civil-war resolver, full of `reichswehr_`/`sa_`/`sh_`/`rfb_`)
  should already be **deleted** in H2-1 (it's superseded by `july_1936_coup`; confirm nothing live
  routes to it — `game_over`'s reference to "civil_war" is the `this.achieve('civil_war')`
  achievement *string*, not a scene `go-to`, so it's safe).

**Verify:** build+smoke; `grep -rn "reichswehr_loyalty\|reichswehr_strength\|reichswehr_militancy"
source/scenes/` returns **zero** hits outside `advisors/` (Area I) and the untouched
`government_affairs/` cards (Area G); H-6 sim unchanged.

### H2-3 · Convert `ending_slides.scene.dry` to Spanish

The optional "View ending slides" epilogue (reached from `game_over.scene.dry:375`). Currently 371
lines of German/Austria/Mussolini flavor keyed on `weimar_win`/`left_win`/`return_to_normalcy`/
`austria_defeat`/`sdapo_win` etc. Rewrite it around the **four Spanish outcomes** the live endgame
actually produces (the same flags `game_over.scene.dry`'s `@no_hitler`/`@civil_war_won`/
`@civil_war_lost`/`@long_war` were repointed onto in H-4):
- **Coup averted / the Republic endures** (`not republic_victory and not long_war and not
  total_defeat`),
- **Rising failed / Republic wins the war** (`republic_victory`),
- **Long civil war** (`long_war`),
- **Coup succeeds / Republic falls** (`total_defeat`).

Two acceptable depths, executor's call by appetite:
- **Minimal (recommended floor):** collapse the scene to four short Spanish epilogue slides, one per
  outcome, each a paragraph on Spain 1936→ (the Civil War's course, the Republic's fate). Delete all
  Weimar/Austria/Mussolini branches. This *must* be done at minimum — a reachable German screen is
  exactly the leak Phase 2 exists to close.
- **Fuller:** additionally fold in a few live Spanish state reads (`in_popular_front`/`psoe_in_government`/
  `pro_republic`/`coup_progress`) for flavor variation, matching the `@no_hitler` ending's
  conditional prose.

Keep the scene's `on-arrival` DOM-styling boilerplate (the `tools_wrapper`/`max-width` bits) intact —
it's engine-generic. Only the `view-if` gating and the prose change. **Verify:** build+smoke;
headless load (no JS errors); grep the compiled scene for German tokens (Weimar/Austria/Mussolini/
Hitler/NSDAP) → zero; manually confirm each of the four outcome flags routes to a Spanish slide.

### H2-4 · (Optional) Excise the interleaved dead block in `@post_election_1928`

`H_event_corpus.md`'s H-6 finding #4: inside `election_1928.scene.dry`'s `@post_election_1928`
`on-arrival` (the live Area-C bloc-bonus seat math), a **second, smaller dead-German block**
computes `bvp_votes`/`bvp_r`/`z_minus_bvp_*`/`str_change_bvp`/`str_votes_change_z` (~lines 508–570)
and the dynamic `reichstag_size` table (~1269–1296) from hardcoded German party vars. It produces
`NaN` on every election but no live scene reads its outputs (the Spanish display uses the static
`Q.cortes_size`, per H-2). It's interleaved with the **live** per-party concatenation loops (the
`for (var party of Q.parties)` blocks at ~257/266/270/305/331/336/442/466/476 — these auto-follow
the Spanish keys and **must survive byte-for-byte**).

**This is the riskiest, lowest-value stage. Two honest options:**
- **Recommended: leave it deferred, flagged.** It's harmless (NaN into unread vars), and it's woven
  through the one piece of math the entire election arc depends on. The downside of touching it
  (accidentally perturbing `psoe_r`/`ceda_r`/…) dwarfs the upside (a few fewer NaN in unread vars).
  If you leave it, note it explicitly in the Execution-status section as knowingly-deferred, and
  stop here.
- **If you do it:** do **not** delete interleaved lines. Instead wrap the *contiguous* dead
  sub-runs in `if (false) { … }` (the H-5 idiom) so the live loops between them are untouched, and
  guard it with a **numerical-equivalence proof**: a Node script that runs `@post_election_1928`'s
  compiled `onArrival` on a fixed seed `Q` **before and after** the change and asserts
  `psoe_r`/`pce_r`/`ceda_r`/`izq_rep_r`/`radical_r`/`monarchist_r`/`falange_r`/`other_r` and the
  bloc totals are **identical to the last decimal**. If any differs, revert — you cut into live
  math. Only the `bvp_*`/`z_minus_bvp_*`/`str_*_bvp`/`str_votes_change_z`/`reichstag_size` outputs
  may change (all confirmed unread).

**Verify:** build+smoke; the numerical-equivalence Node check (if attempted); the H-6 end-to-end sim
unchanged.

### H2-5 · Verification sweep + docs

- **The regression proof (headline):** the H-6 end-to-end playthrough sim — boot → 3 elections
  (asserting the government transitions Republican-Socialist → Radical-CEDA → Popular Front, the
  Spanish PMs, the bloc math) → escalation → July-1936 coup → one correctly-resolved ending, zero
  unexpected `NaN` — produces output **identical** to the golden baseline captured in H2-0. This is
  the whole phase's thesis: *the game plays exactly the same, with ~200 fewer files.*
- **Scale check:** `find source/scenes -name '*.scene.dry' | wc -l` down by ~200; the `events/`
  count down to the keep-list plus whatever proved reachable.
- **German-token sweep:** `grep -riE "weimar|reichstag\b|reichswehr_(loyalty|strength|militancy)|hindenburg|schleicher|brüning|nsdap\b" source/scenes/`
  returns only the accounted-for survivors (Area-I advisors, Area-G cards, the kept
  `reichswehr_minister` slot, kept scene-id strings) — zero on any *reachable Spanish path*.
- **Compiled-output + headless:** scan `out/game.json` for German residue on the live scene ids;
  headless Chromium `--dump-dom` load → no `Uncaught`/`ReferenceError`/`TypeError`.
- **Docs:** add this file's "Execution status" section (what was deleted, by chain, with counts; the
  reichswehr residue resolved; ending_slides converted; H2-4's outcome); flip the banner to ✅.
  Update `H_event_corpus.md`'s "Deferred" section (strike the four Phase-2 items now done, or note
  H2-4 if left deferred). Update `CLAUDE.md`'s status-at-a-glance (Area H Phase 2 done; the tree is
  now ~200 files lighter with no dead-German residue on any reachable path) and the design doc's §H.

---

## Verification (per `CLAUDE.md` — never claim a mechanic works without exercising it)

1. `BUILD OK` immediately followed by `SMOKE PASSED` after **every batch**, never batched to the end.
2. The **H-6 end-to-end regression sim** re-run after every batch, its output diffed against the
   H2-0 golden baseline — the definitive proof that deletion changed nothing a player experiences.
   *This is the single most important check in the phase.* A green build proves references resolve;
   only the sim proves the live runtime path is intact.
3. The compiler's `Couldn't find an id` errors are treated as **information, not failure** — each one
   maps a live↔dead edge and is resolved deliberately (delete the dead referrer, or gate the dead
   branch in a keeper), never by blindly restoring the deleted file.
4. German-token grep + compiled-output scan + headless load → zero German residue on any reachable
   Spanish path.
5. Small, per-chain commits, so any regression is `git`-bisectable to a single batch.

---

## Deferred / explicitly out of scope for Phase 2

- **`advisors/` (Area I), the untouched `government_affairs/` cards (Area G), `qdisplays` (Area J),
  assets (Area K)** — Phase 2 is `events/` + named support scenes only. If a deletion batch's build
  error points at one of these, gate its *dead branch*; don't rewrite or delete the file.
- **Renaming the kept `reichswehr_minister`/`_minister_party` War-ministry slot** to a Spanish name
  — cosmetic, cross-file, zero functional gain; Area J/L polish, not Phase 2.
- **A full Spanish rewrite of `post_event.scene.dry` Block B** (the coalition taxonomy, already
  `if(false)`-guarded in H-5) — only needed for an electoral-takeover ending path the game doesn't
  have. Stays guarded, not rewritten.
- **H2-4 (the interleaved dead block)** if the executor judges the risk not worth it — leave it
  `NaN`-into-unread-vars and flagged, exactly as Phase 1 left it.
- **New Spanish flavor/event content** (foreign policy, mid-term drama, deeper chains) — that's Area
  G / a genuinely new content area, not cleanup. Phase 2 *removes* dead content; it does not author
  new content beyond H2-3's four epilogue slides.

> After approval: this plan is already committed to `docs/planning/H2_bulk_cleanup.md`. Execute in
> small, verified, per-chain batches; keep this file's Execution-status section current as each
> batch lands; update `CLAUDE.md` + `H_event_corpus.md` + the design doc §H as the phase closes.
