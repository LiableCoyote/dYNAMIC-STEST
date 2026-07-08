# CLAUDE.md — orientation for this repo

## What this project is

This repo is a **total conversion** of *Social Democracy: An Alternate History* (a
Dendry interactive-fiction political sim set in **Weimar Germany**, playing the SPD)
into **Social Democracy: The Spanish Republic** — the same engine and systems, re-set
in the **Second Spanish Republic (1931–1936)**, playing the **PSOE**, ending at the
**July 1936 military coup / start of the Civil War**.

It is a **standalone build**, not a mod. Decisions already locked: standalone (not a
`mod_loader` mod); game ends at the July-1936 coup (a Civil War epilogue is deferred).

## Read these first (in order)

1. `docs/spanish_republic_conversion_design.md` — the master feasibility + area breakdown (Areas A–M).
2. `docs/planning/B_state_schema.md` — **the authoritative German→Spanish variable contract.** All code follows this.
3. `docs/planning/BC_election_engine_execution_plan.md` — the detailed, stage-by-stage plan for Area B remnants + Area C, **with a live "Execution status" section at the top** tracking exactly what's done.
4. `docs/planning/D_faction_semantics.md` — Area D (PSOE faction semantics), done. Has the same live-status pattern.
5. `docs/planning/E_party_landscape.md` — Area E (party landscape: relations, roster, enemies/people's-party cards), done. Same live-status pattern.
6. `docs/planning/F_new_subsystems.md` — Area F (the four new Spain-specific subsystems), done. Same live-status pattern; also documents several inherited engine-scale bugs found and flagged, not fixed.
7. `docs/planning/H_event_corpus.md` — Area H Phase 1 (the playable spine), done. Same live-status pattern; the game is now end-to-end playable April 1931 → July 1936.
8. `docs/planning/H2_bulk_cleanup.md` — Area H Phase 2 (the bulk cleanup), done. Same live-status pattern; the ~371-file dead German corpus is deleted, the tree is ~75% smaller.
9. `docs/planning/G_policy_cards.md` — Area G (policy-card content), done. Same live-status pattern; the `government_affairs/` deck is now real Spanish policy content end to end.
10. `docs/planning/A_engine_build_scaffolding.md` — build/CI/naming/asset scaffolding (Area A, done).

## Build & verify (do this after every change)

```bash
npm install          # once; installs dendrynexus (from GitHub) + parliament-svg
npm run build        # compiles source/ -> out/game.json + out/html/core.js, mirrors game.json into out/html/
npm run smoke        # source-schema + compiled-scene-graph regression guard
npm run serve        # serves out/html at http://localhost:8080
```

**CRITICAL GOTCHA:** `dendrynexus make-html` can print `Error:` lines to stderr on a
parse failure **and still exit 0**. `npm run build` therefore goes through
`scripts/build.js`, which scans the compiler output for `Error:` and fails loudly
(no `game.json` copy) regardless of exit code. **Always use `npm run build`, never raw
`dendrynexus make-html`** — and note that `npm run smoke` reads `out/game.json`, so if
a build silently failed, smoke would re-validate a *stale* build and falsely pass.
Run `build` then `smoke`, and trust the `BUILD OK` / `BUILD FAILED` line.

**SECOND GOTCHA (found in Area H Phase 2):** `dendrynexus make-html` also skips
recompilation whenever `out/game.json`'s mtime is ≥ the newest mtime among the files
still in `source/` — a check that's blind to **deletions** (`git rm` never touches a
surviving file's mtime), so a stale `game.json` that still contains a just-deleted
scene can look "up to date" and get silently reused. `scripts/build.js` now always
passes `--force` to close this; if you ever invoke `dendrynexus` directly, pass
`--force`/`-f` yourself.

Headless render check (no Playwright in-project; use the pre-installed Chromium):
```bash
npx --yes http-server out/html -p 8099 -c-1 &
/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless=new --no-sandbox --disable-gpu \
  --virtual-time-budget=4000 --dump-dom http://127.0.0.1:8099/ > /tmp/dom.html 2>/tmp/chrome.err
grep -iE "Uncaught|ReferenceError|TypeError" /tmp/chrome.err   # expect none
```
`--dump-dom` only captures the static start menu (deep nav needs scripted clicks we
can't do here), so for correctness beyond "it loads," **write a standalone Node
simulation** of the JS logic — that's how the election math was verified. Never claim a
mechanic works without exercising it.

## The engine & its critical trap

- Game state is ~726 `Q.*` variables initialized in `source/scenes/root.scene.dry`'s
  `@start` `on-arrival` block. Everything reads/writes these.
- **The concatenation trap:** the election engine reads party/class data by string
  concatenation — `Q[party + '_r']`, `Q[c + '_' + party]`. Because `Q.parties` /
  `Q.classes` hold Spanish keys, concatenated reads auto-follow; only **hardcoded**
  refs (`Q.spd_r`, `Q.z_relation`) need manual renaming. But an undefined `Q.*` becomes
  `NaN` in arithmetic (or **throws** if you call `.toFixed()` on it), so every renamed
  var the engine reads must stay initialized in `root.scene.dry`.
- **`.dry` syntax:** bare `//` comments are only valid **inside** a `{! ... !}` JS block.
  A `//` line sitting between header properties (`title:`, `on-arrival:`, …) is a hard
  compile error. (This bit us once — see the build gotcha above for why it slipped past smoke.)

## Rename maps (from B_state_schema.md — memorize)

- **Parties:** `spd→psoe`, `kpd→pce`, `z→ceda`, `ddp→izq_rep`, `dvp→radical`, `dnvp→monarchist`, `nsdap→falange`, `other→other` (**keep `other`**).
- **Classes:** `workers→industrial`, `old_middle→smallholder`, `new_middle→urban_middle`, `rural→landless`, `unemployed→unemployed`, `catholics→catholic`.
- **Region:** `_prussia → _catalonia`. **President:** `hindenburg_* → president_*`.
- **Kept generic (do NOT rename):** factions (`left/center/labor/reformist/neorevisionist/social_patriot`), `pro_republic/nationalism/socialism`, `coup_progress`, `land_reform`, `budget`, `works_program`, `rural_policy` (Area F declared this — it was read by 5 files but never initialized, a latent base-game bug).
- **Area F's new-subsystem vars** (declared by Area B as inert, wired by Area F): `anarchist_strength/militancy/electoral_stance/insurrection` (CNT-FAI); `catalan_autonomy`, `basque_autonomy` (regional); `church_relation`, `clerical_conflict` (church); `africa_army` (military/coup). All six now have live writers+readers.
- **Excised German splinters (deleted, never ported):** `sapd, aspd, dnf, dnef, kvp, lvp, cvp, bvp, wp, cnblp, csvd, dsu, nvf, fkp, rdp` and their control flags (`nsdap_split`, `dsu_exist`, etc.).

## The content-debt boundary (important working principle)

Areas B and C rebuild the **engine** (state schema, election math, HUD/library display,
yearly ticks). They deliberately do **not** rewrite deep **narrative content** — the
378 `events/*`, `advisors/*`, `government_affairs/*`, `party_affairs/*` scenes, plus
prose sections like the library's `@government`/`@weimar_timeline`/`@parties` and the
status screen's `@emergency`/"Party Leadership". That content is slated for
**Areas D/E/F/G/H/I** and is documented as debt where left in place. When you touch a
file, fix the *engine/display* bindings and leave German narrative prose alone unless
you're doing the content area that owns it. Renaming Dendry **scene IDs** (e.g. the 213
sub-scenes in `election_1928.scene.dry`) is **not worth doing** — IDs needn't be
human-meaningful and renaming them is high-risk for zero functional gain.

Before assuming a German-looking var/scene is dead, **trace its consumers** (ripgrep).
Several "dead" blocks turned out to be reachable (e.g. the yearly-tick events fire on
date, not narrative flags); others were genuinely inert. Verify, don't guess.

## Status at a glance (details in the execution plan's status section)

- **Area A (scaffolding):** ✅ done — renamed project, new IFID, build/CI/smoke, asset dirs.
- **Area B (state schema):** ✅ done — `root.scene.dry` fully on Spanish keys; ministries; difficulty/mode blocks; Cortes composition; adjustmentFactors; government/coalition flags; challenge modes deleted; `library.scene.dry` + `status.scene.dry` display fully rebuilt (fixed two real bugs: a `.toFixed()`-on-undefined crash and a NaN-writing block). B-9 (qdisplay *file* renames) is the only cosmetic remnant.
- **Area C (election engine):** ✅ engine done — calendar (1931→1933→1936→coup); the **1933 bloc-list law** (C-3); the **CNT abstention mechanic** (C-4); the `election_simulation.scene.dry` calibration harness (C-6) — verified by simulation to reproduce the historical arc (1931 left bloc 63% → 1933 Radical-CEDA 55% → 1936 Popular Front 57%); yearly economic ticks retargeted (C-7). C-2/C-5/C-8's remaining parts are **coupled to Area H content** (matrix drift needs narrative events that don't exist yet) and are documented as such.
- **Area D (PSOE factions):** ✅ done — the six faction slots (`left/center/labor/reformist/neorevisionist/social_patriot`) now read as Caballerista/Besteirista/UGT/Prietista/anti-fascist-mobilization/national-unity-current; the ideology deck, faction-disunity card, faction-discovery card, and all faction-description display prose rewritten. Faction variable *keys* deliberately kept generic (same call as Area B) so the ~19 faction-reading advisor scenes keep working untouched — only Area D's *content* changed. Fixed two more reachable Area-B-rename bugs along the way. **Found but explicitly out of scope:** ~16 other `party_affairs/*` files (`campaigning`, `crisis_program`, `enemies`, `rally`, `reichsbanner`, etc.) have the same class of dangling renamed-var bug — flagged in `D_faction_semantics.md` for whoever picks up Area E.
- **Area E (party landscape):** ✅ done — the non-player parties now read as PSOE's real Second Republic landscape: Republican Left, Radical Party, CEDA, PCE, monarchists, Falange. `inter_party_relationships.scene.dry` fully rebuilt around live coalition-state flags (replacing the German chancellor-name-check branching); `enemies.scene.dry` rebuilt around Spanish opponents (also fixed a permanently-unreachable-card bug, same class as Area D's find); the 7 generic party-ops cards (`campaigning`, `media`, `fundraising`, `party_organizations`, `rally`, `international_relations`, `crisis_program`) had rename maps applied; `library.scene.dry`'s `@demographics` + `@parties` rewritten to the Spanish roster; the People's Party cards reframed as the PSOE *obrerismo*-vs-broadening debate. Verified via grep sweeps, a compiled-output scan, headless load, and a standalone Node behavioral spot-check (12 branches, zero NaN writes). **Found but explicitly out of scope:** `rally.scene.dry`'s SA-disruption/police-protection subplot is dead code entangled with the militia subsystem (Area F debt, left in place with an inline flag); a `hindenburg_angry` qdisplay-id residue in `library.scene.dry`'s `@curr_gov` is one of 83 call-sites of the same Area J qdisplay-rename debt already flagged in the design doc.
- **Area F (four new subsystems):** ✅ done — all six of Area B's declared-inert axes (`anarchist_*`, `catalan_autonomy`, `basque_autonomy`, `church_relation`, `clerical_conflict`, `africa_army`) now have live writers+readers. Rehabbed the 6 dead militia `party_affairs` cards (`reichsbanner`→UGT Militia, `iron_front`→Alianza Obrera, `streetfighting`, `confronting_nazis`, `weimar_rally`→Republican Coordination, `response_to_antisemitism` retired) plus `rally.scene.dry`'s dead subplot and `status.scene.dry`'s broken "Distribution of Power" panel, all onto the live militia vars; added `party_affairs/cnt_relations.scene.dry` + `events/casas_viejas.scene.dry` (anarchism); rewrote `government_affairs/agricultural_policy.scene.dry` (agrarian — fixed a real bug where land reform had zero effect on the live demographic model); added `government_affairs/catalan_affairs.scene.dry` (regional autonomy, replacing 4 permanently-dead `prussian_affairs*` cards, flagged not ported); rewrote `government_affairs/military_policy.scene.dry` + added `government_affairs/religious_policy.scene.dry` + `events/sanjurjada_1932.scene.dry` (church-military-Africa/the coup). **Found but explicitly out of scope, flagged in `F_new_subsystems.md`:** `post_event.scene.dry`'s force-computation and coalition-taxonomy blocks have been silently producing NaN since Area B (Area C-remnant/H); the 53-file `coup_progress` event chain including the coup trigger itself (Area H); the 72-file `reichswehr_*→army_*` rename beyond the one file F touched (Area B-remnant/H); a dead demographic-breakdown block in `status.scene.dry`'s `@polls` (Area B/C-remnant).
- **Area H Phase 1 (the playable spine):** ✅ done — **the game is now end-to-end playable, April 1931 → July 1936.** Built the three gaps that were blocking this: (1) `events/coalition_formation.scene.dry` (new) — the coalition-formation writer, the linchpin Area F/C left waiting; after each of the three elections it now actually changes the government (Republican-Socialist → Radical-CEDA *bienio negro* → Popular Front, with the real Prieto/Caballero split modeled as a genuine choice), writing `chancellor`/ministries/the coalition flags every time. (2) `election_1928.scene.dry`'s post-election flow rebuilt: the live Area-C seat math (preserved intact) now leads into a Spanish results screen (H-2). (3) The July-1936 endgame: 4 new escalation events (`asturias_rising`, `popular_front_victory_shock`, `spring_1936_breakdown`, `calvo_sotelo_assassination`) plus `events/july_1936_coup.scene.dry` (trigger + resolver, computing forces entirely from live militia/army vars) sets one of `republic_victory`/`long_war`/`total_defeat`; `game_over.scene.dry`'s endings were fixed to match — including the single highest-visibility bug found in this pass, `@no_hitler` firing on *every* Spanish playthrough regardless of outcome (its condition was trivially always true), now repurposed as the coup-averted ending. Also: fixed the turn-1 opening prose (epigraph, difficulty screen, dropped the obsolete Mod Loader paragraph); neutralized `post_event.scene.dry`'s two engine-scale dead blocks Area F flagged (force computation, coalition taxonomy) that had been producing `NaN` every turn since Area B. Verified with a standalone Node **end-to-end playthrough simulation** (boot → 3 elections → escalation chain → coup → ending, zero unexpected `NaN`).
- **Area H Phase 2 (the bulk cleanup):** ✅ done — **371 dead German scene files physically deleted** (493 → 122 total scene files; `events/` 386 → 15). Deleted the entire dead corpus (the Prussia chain, the Brüning/Papen/Schleicher chancellor sim, the party-splinter corpus, the presidential-election chain, the Austria/foreign chain, the old German coup/civil-war chain, and the ~2200-line dead German coalition-menu tree that Phase 1 had left orphaned-but-kept inside `election_1928.scene.dry`) via a build-driven loop — `dendrynexus`'s reference resolution hard-errors on any dangling `go-to`/`call`/menu-choice target, so deletion was self-checking. **Found and fixed a real, previously-hidden build bug along the way:** `dendrynexus make-html` was silently skipping recompilation after deletions (its staleness check only looks at *surviving* files' mtimes, which `git rm` never touches) — `npm run build` was reporting `BUILD OK` without having recompiled anything; `scripts/build.js` now always passes `--force`. Converted the one remaining reachable German screen, `ending_slides.scene.dry`, to four Spanish epilogue slides. Found and closed 7 more "reachable-but-German" events beyond Phase 1 H-3's 9 (genuinely live gates, 100% unconverted content — `left_split`, `centrist_leaders_resign`, `reformist_leaders_resign`, `unions_declare_independence`+2, `groko_prussia_collapse`, `return_to_normalcy`), plus one live Area-G card (`shuffle_cabinet.scene.dry`) that had no gate at all and routed straight into the now-deleted German ministries tree. The interleaved dead block inside `@post_election_1928`'s live seat math was deliberately left deferred (its inertness was more thoroughly re-verified, but surgery on code interleaved with the load-bearing election math isn't worth the risk for a few fewer inert `NaN`s). Verified throughout with the H-6 end-to-end regression simulation, re-run after **every single deletion batch** — its output is byte-identical before and after the whole phase, proving the game plays exactly the same. **Found but explicitly out of scope, flagged in `H2_bulk_cleanup.md`:** `status.scene.dry`'s `@emergency` sub-scene (Government/Party Leadership/Industrial Backing display) is substantially unconverted German content, same class as the already-flagged `@polls`; `status_right.scene.dry` contains a large unconverted German "camarilla" panel whose reachability could not be conclusively determined without interactive browser testing (this session's tooling is `--dump-dom`-only) — left untouched rather than risk deleting/editing a possibly-live scene.
- **Area G (policy-card content):** ✅ done — the `government_affairs/` deck (38 files) is now real Spanish content end to end. Converted 20 live-but-German cards across six stages (G-0 recon → G-5 reimaginings/cleanup): `labor_affairs`/`labor_rights`/`fiscal_policy` (the *jurados mixtos*, the eight-hour day, Prieto's tax/tariff policy); the `economic_policy` flagship (279→232 lines — recon found its WTB/Lautenbach public-works arm, roughly half the file, was already permanently unreachable dead code orphaned by an unconverted Area I advisor path, so it was deleted rather than reframed; the two genuinely-reachable arms, left-nationalization and the moderate Prietista plan, were fully converted) + `economic_democracy`, then re-enabled the `@eco` deck Area H had left gated off pending this; `judiciary`/`constitutional_reform` (reframed around the 1931 electoral law's *premio de mayoría* and curbing Alcalá-Zamora's Article 81 dissolution power, not the original's anachronistic Bonn-Basic-Law borrowings)/`womens_rights`/`homosexual_rights`; `police`/`domestic_enemies` (an unusually clean fit onto Area F's pre-built Falangist-militia/Requetés/CNT-FAI ban system)/`social_welfare`/`coalition_affairs`/the toleration trio (collapsed 3→1 card, reframed as the real 1936 Caballerista confidence-and-supply arrangement); `war_guilt`→the Comisión de Responsabilidades (the 1921 Annual disaster inquiry), `foreign_policy` (the hardest card in the pool — trimmed from 16 to 4 sub-branches after recon found most of the original was either non-portable Versailles/Vatican/Austria content or redundant with already-converted party-level content), `education_science`→Marcelino Domingo's real school-building program. Retired 4 cards with no Spanish analogue (`deport_hitler`, `red_general`, `shuffle_cabinet`, plus one toleration variant) and deleted 7 dead `blank*` filler files + a stray mis-extensioned duplicate; revived the pinned Cabinet advisor card's dead gate. **Found and fixed 26 previously-uninitialized-variable bugs** (same silent-NaN class as Area B's original finds) along the way — see `G_policy_cards.md`'s per-stage status for the full list. **Found but explicitly out of scope, flagged in `G_policy_cards.md`:** `coalition_affairs.scene.dry`'s dropped `bring_down`/election-trigger branch called a utility scene (`set_next_election_time`) that turns out to be silently inert (guards on a never-initialized `time_to_election`); the 4 `prussian_affairs*` files were kept rather than deleted as originally planned, since three out-of-scope Area I advisor files still reference them.
- **Areas I–M:** 🔲 not started. **I** = advisors (the `economic_policy`/`crisis_program` advisor chain that sets `wtb_adopted`/`lautenbach_adopted` is still unconverted — Area G's recon confirmed this is why half of `economic_policy.scene.dry` was dead code); **J** = qdisplay/UI (already has flagged findings waiting: the `nsdap_r`-class dead qdisplay ids and the `hindenburg_angry` id used across 83 files); **K** = assets (every converted Area G/D/E/F card still points at German `card-image` portraits — none renamed, per established precedent of leaving asset paths for this pass); **L** = localization; **M** = balancing.

## How to continue (recommended next step)

**The game is end-to-end playable, the dead German corpus is gone, and the Government
Affairs policy-card deck is real Spanish content** (April 1931 → three elections → July
1936 coup → one of four Spanish endings, tree ~75% smaller with no known German content
on any confirmed-reachable path, including now the ~20 `government_affairs` cards Area G
converted). What remains is Areas I–M and a few flagged loose ends:

1. **Area I (advisors)** — the natural next area. Area G's recon confirmed a concrete
   reason to prioritize this: the `economic_policy.scene.dry` flagship's WTB/public-works
   arm was found to be permanently dead code because the advisor chain that's supposed to
   set `wtb_adopted`/`lautenbach_adopted` (`advisors/woytinsky.scene.dry`,
   `baade.scene.dry`, `aufhauser.scene.dry`, `sender.scene.dry`, `schumacher.scene.dry`)
   is still unconverted German content. Converting it would both finish Area I's own
   scope and potentially revive that dead arm of the (already-converted) economic-policy
   card as new content.
2. **Two reachability-uncertain screens flagged in `H2_bulk_cleanup.md`:**
   `status.scene.dry`'s `@emergency` sub-scene and `status_right.scene.dry` both contain
   substantial unconverted German content. `status_right.scene.dry` in particular needs
   someone with interactive browser access (this session could only `--dump-dom` a static
   page) to determine whether it's actually reachable before deciding whether to convert,
   gate, or delete it.
3. **The interleaved dead block in `@post_election_1928`** (`H2_bulk_cleanup.md`'s H2-4) —
   confirmed inert but deliberately left alone; only worth touching if someone wants to do
   the careful numerical-equivalence-guarded surgery the plan describes.
4. **`coalition_affairs.scene.dry`'s dropped election-trigger branch** (`G_policy_cards.md`'s
   G-5 finding) — `set_next_election_time.scene.dry` is silently inert (guards on a
   never-initialized `time_to_election`); flagged for whoever next touches the election-
   timing engine, not fixed by Area G since it's out of scope.
5. **Areas J–M** (qdisplay/UI, assets, localization, balancing) — not started; J already
   has flagged findings waiting (the `nsdap_r`-class dead qdisplay ids, the
   `hindenburg_angry` id across 83 files).

**Working rules for whoever continues:** follow `B_state_schema.md` as law; `build`
+ `smoke` after every change and never trust a green smoke without a preceding
`BUILD OK`; **if you ever delete files, remember `dendrynexus` needs `--force` to
recompile — `scripts/build.js` already does this, but raw `dendrynexus` invocations
won't**; verify mechanics with a standalone simulation, not just "it compiles"; keep the
content-debt boundary; commit in small, verified stages with descriptive messages; keep
the execution-plan status sections current.

## Git / workflow

Work happens on the branch `claude/dynamic-social-democracy-feasibility-k9y82t`.
Commit and push in small stages (`git push -u origin <branch>`). Do not open a PR
unless explicitly asked. Do not put model identifiers in commits/PRs/code.
