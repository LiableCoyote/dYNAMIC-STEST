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
6. `docs/planning/A_engine_build_scaffolding.md` — build/CI/naming/asset scaffolding (Area A, done).

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
- **Kept generic (do NOT rename):** factions (`left/center/labor/reformist/neorevisionist/social_patriot`), `pro_republic/nationalism/socialism`, `coup_progress`, `land_reform`, `budget`, `works_program`.
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
- **Areas F–M:** 🔲 not started. **F** = the four net-new subsystems (anarchism, regional autonomy, agrarian, church/army-Africa) — also owns the paramilitary/militia cards (`reichsbanner`, `iron_front`, `streetfighting`, `confronting_nazis`, `weimar_rally`, `response_to_antisemitism`, plus `rally.scene.dry`'s dead disruption subplot) that Areas D and E both found and deferred; **G** = policy-card content; **H** = the event corpus (the bulk); **I** = advisors; **J** = qdisplay/UI (already has two flagged findings waiting: the `nsdap_r`-class dead qdisplay ids and the `hindenburg_angry` id used across 83 files); **K** = assets; **L** = localization; **M** = balancing.

## How to continue (recommended next step)

The **electoral engine is mechanically complete and playable in isolation**, and the
**player-party internals (factions, ideology, and the surrounding party landscape) now
have PSOE identity**, but the game is **not end-to-end playable** yet — it still boots
into Weimar narrative content, and the bulk of `events/*`, `advisors/*`, and
`government_affairs/*` still reference pre-rename variables and German figures. Two
sensible next moves:

1. **Start the content spine (Area H)** — this is what unblocks actual playability and
   what C-2/C-5/C-8 are waiting on. Begin with the game's opening flow and the yearly
   turn loop so a player can get from April 1931 → the three elections → July 1936.
2. **Area F (the four new subsystems)** — anarchism/CNT, regional autonomy, agrarian
   reform, and church/army-Africa are the areas with least base-game leverage, so they
   benefit from early, focused design attention. It's also the natural place to pick up
   the paramilitary/militia cards Areas D and E both found and deferred.

**Working rules for whoever continues:** follow `B_state_schema.md` as law; `build`
+ `smoke` after every change and never trust a green smoke without a preceding
`BUILD OK`; verify mechanics with a standalone simulation, not just "it compiles";
keep the content-debt boundary; commit in small, verified stages with descriptive
messages; keep the execution-plan status section current.

## Git / workflow

Work happens on the branch `claude/dynamic-social-democracy-feasibility-k9y82t`.
Commit and push in small stages (`git push -u origin <branch>`). Do not open a PR
unless explicitly asked. Do not put model identifiers in commits/PRs/code.
