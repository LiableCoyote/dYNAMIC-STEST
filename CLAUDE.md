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
10. `docs/planning/I_advisors.md` — Area I (advisors), done. Same live-status pattern; the 28 advisor cards + the recruit roster are real Spanish figures, the public-works economic plan is revived, and the last German Prussia machinery is gone.
11. `docs/planning/K_assets.md` — Area K (image assets), functionally done, pending human art review. Same live-status pattern; 25/28 named-figure portraits + 8 topical/event images sourced from Wikimedia Commons with verified provenance, every live card-image/set-bg reference repointed, two new build-time guards (broken-path, credits-completeness) added to `smoke.js`.
12. `docs/planning/J_qdisplays_ui.md` — Area J (quality displays & UI text), done. Same live-status pattern; the qdisplay set is now 12 files (all generic/Spanish, zero German names), the status "Politics"/"Polls" tabs read the live Spanish party/demographic model, and the German presidential "camarilla" is now the Spanish 1936 military conspiracy.
13. `docs/planning/L_localization.md` — Area L (localization / naming / flavor consistency), done. Same live-status pattern; the library's German constitutional/history prose is now Spanish, the German "Mod Info" page is a Spanish "About", five dead retired German cards are deleted, and party colours are harmonized to one palette.
14. `docs/planning/A_engine_build_scaffolding.md` — build/CI/naming/asset scaffolding (Area A, done).
15. `docs/planning/M_balancing.md` — Area M (balancing), done. The simulation-driven calibration
    pass: the `scripts/balance_sim.mjs` harness, the live election-arc calibration, the
    coup/insurrection/force tuning, the endings cleanup, and the human-playtesting punch list.
16. `docs/planning/N_content_depth.md` — Area N (content depth), done. 11 new historically-grounded
    mid-game events (1931–1936) populating the sparse middle years; the M calibration is untouched
    (harness-verified arc + coup outcomes).

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
- **Area I (advisors):** ✅ done — all 28 advisor cards (+ the `shuffle_leadership` recruit roster + the two structural pinned cards) are now real Second-Republic PSOE figures. Mapped the German socialists onto Spanish counterparts preserving the faction tags and the 3-advisor cap (starters: Besteiro/Saborit/Negrín; plus Largo Caballero, Prieto-era figures, Fernando de los Ríos→justice, Gregorio Marañón→rights/science, Zugazagoitia→*El Socialista*, González Peña→Alianza Obrera, Santiago Carrillo→Socialist Youth, etc.). **Revived the public-works economic plan** (the WTB arm G-2 deleted as dead code): the labor economist's `@plan` branch now sets `wtb_adopted`/`economic_plan = 1`, and `economic_policy.scene.dry`'s public-works arm (Prieto's hydraulic/infrastructure works) was rebuilt — verified end-to-end (crisis_program → adopt → economic_policy arm → `@eco` deck). **Reimagined the Prussia-coupled advisors around Catalonia** (Braun→Vidiella/Generalitat, Severing→Galarza, Rosenfeld→Araquistáin, +the Sender/Seydewitz Prussia blocks), repointed their `go-to`s to `catalan_affairs`, and **deleted the 4 `prussian_affairs*` files** G-5 had kept alive solely for these references. Advisor variable *keys* and scene *filenames* kept as opaque German identifiers (renaming would ripple across the roster + `post_event` faction bookkeeping for zero gain — same call as Area B/scene-IDs). **Found and fixed 4 more previously-uninitialized-variable bugs** (`workers_aid`, `kpd_cooperation_seen`, `month_activities`→`month_actions` ×3, plus a `moderate_economic_plan`-var typo). Verified via dead-flag grep, a compiled-output scan, headless load, and a Node sim exercising all 95 advisor `on-arrival` lines (zero NaN) + a hire-from-roster round-trip. **Out of scope, left per precedent:** advisor `card-image` portraits still point at German figures (Area K); a harmless dead JS string-check in `easy_discard.scene.dry`.
- **Area K (assets):** 🟡 functionally done, pending human art review — 25 of 28 Tier-1
  named-figure portraits + 8 Tier-2 topical/event images sourced from Wikimedia Commons
  with machine-verified provenance (`scripts/source_assets.mjs`, resolves a figure's lead
  image via the Wikipedia pageimages API, or — via K-7's Commons-search extension — a
  free-text Commons File-namespace search for subjects with no Wikipedia article; verifies
  license via Commons `imageinfo` either way); every live `card-image:`/`set-bg:` reference
  across 71 scene files repointed from German paths onto `img/es/` or the shared placeholder
  — zero broken paths, zero known German-identifiable imagery on any live card. Visual
  inspection (not just filename-matching) caught and replaced the worst offenders: the
  Reichstag chamber and building, a 1929 Berlin street-fighting photo, and a Berlin rally at
  the Lustgarten/Cathedral, swapped for the Congreso de los Diputados facade and real period
  photos of Casas Viejas (1933) and the Asturias rising (1934); K-7 then found real
  period-photo replacements for the Council-of-Ministers card (a genuine 1931
  Constituent-election press photo of Alcalá-Zamora/Besteiro/Largo Caballero/Azaña), the
  party HQ and masthead cards (the actual 1908 Casa del Pueblo de Madrid building, the
  actual 1886 first issue of *El Socialista*, and Pablo Iglesias addressing a crowd at its
  inauguration). The actual 17 Feb 1936 *La Voz* Popular-Front-victory front page is sourced
  but still not wired to any card. Two `smoke.js` guards (broken-image-path,
  credits-completeness) make both failure modes permanent regressions — both were proven to
  actually fire before being trusted. **Left for a human:** identity/subject sign-off on the
  29 sourced files; 5 CC BY-SA (share-alike) sources needing a license-obligation check; 3
  named figures confirmed to have zero free image anywhere on Wikimedia (not just no
  Wikipedia article — K-7 directly Commons-searched and found nothing); ~11 topical/poster
  items (posters, militia photography, a parliamentary-group photo, bank-crisis photography)
  that stayed empty after a genuine Commons search — likely a real Spanish copyright-term
  constraint for 1930s-era named-artist work, not a search gap; one portrait (`vidiella`) is
  a group photo, not a solo shot. Achievements (the 123-icon `game_over` gallery) and music
  remain deferred, as planned. Full punch list in `K_assets.md`'s K-6/K-7 status entries.
  **Polish Pass P (post-M, after first live playtesting):** the 23 cards that still fell back to the
  gray `img/placeholder.jpg` are all retired — 5 new sourced images (José Antonio, Marcelino Domingo,
  Macià, Masquelet, the 1933 women-voting photo) plus thematically-matched existing art (Asturias→
  Alianza Obrera, Casas Viejas→CNT, the Casa del Pueblo/Pablo Iglesias→the 3 no-free-photo figures);
  `grep -rl img/placeholder.jpg source/scenes/` is now empty. Plus a light flavor pass (enabled 9
  commented card subtitles, added 3). See `K_assets.md`'s "Polish Pass P" entry.
- **Area J (qdisplay/UI):** ✅ done — the qdisplay set is now 12 files, all generic or Spanish,
  zero German names (renamed `hindenburg_angry`→`president_approval`, added `coup_readiness`,
  deleted 11 dead/orphaned German defs). **Reachability of the two H2-flagged screens was fully
  determined** from the hardcoded `index.html` tab bar: the "Emergency Status" tab is `display:none`
  and dead (deleted `status.scene.dry`'s `@emergency` sub-scene + its button); the "Politics",
  "Polls", and "Scheming" tabs are all live/visible. Converted the live German content accordingly:
  the Politics tab's German-splinter "Party Leadership"/"Industrial Backing" rosters → a Spanish
  7-party roster; the Polls tab's German demographic table → the live Spanish class×party matrix
  (`<class>_<party>_display`, computed by `post_event.scene.dry:175`'s concatenation loop); and the
  whole "Scheming" camarilla → the **Spanish 1936 military conspiracy** (Mola/Sanjurjo/Franco/Goded/
  Queipo + Calvo Sotelo/Falange/Requetés), driven by live Area-F coup vars (`coup_progress` via the
  new `coup_readiness` display, `africa_army`, `army_loyalty`), retitled "Conspiracy". Corrected the
  stale "83 files" figure (`hindenburg_angry` was 2 live qdisplay call-sites, not 83). **Found but
  out of scope, flagged in `J_qdisplays_ui.md`:** `library.scene.dry`'s `@government`/
  `@weimar_timeline` are still German narrative prose (a content-area task, not J's qdisplay/UI
  lane); the Conspiracy page's general portraits are text-only pending an Area-K asset pass.
- **Area L (localization/naming/flavor):** ✅ done — the final German-string cleanup. Converted the
  library's last live German prose (`@government` → the 1931 Spanish Constitution's system;
  `@weimar_timeline` → a PSOE road-to-the-Republic timeline); rewrote the German "Mod Info" root-menu
  page (a 484-line Weimar-mod FAQ/party-paths-flowchart/changelog) into a compact Spanish "About"
  page keeping Autumn Chen's attribution; `git rm`'d the five `view-if: 0` retired German cards
  (`red_general`, `deport_hitler`, `shuffle_cabinet`, the two dead toleration variants); and
  harmonized party colours to the status-HUD palette (a span-text-keyed transform that only recolours
  exact party-name spans, so the UGT's shared `#700000` and generic spans stay put — 162 spans across
  37 files, plus clearing the last NSDAP-brown `#7A3C00` from live fascism references). Language
  policy is English-with-Spanish-nouns (already settled; L applied it, did not translate). **Every
  German token that remains is intentional** — kept var/scene-ID keys, dead JS blocks, legitimate
  foreign-country references (`foreign_policy`/`labor_rights`), or base-game attribution — enumerated
  in `L_localization.md`'s ledger.
- **Area M (balancing):** ✅ done — the finale, simulation-driven calibration. Built
  `scripts/balance_sim.mjs`, a **faithful** Node harness that runs the game's *real* compiled
  `$code` (boot→3 elections→escalations→coup→ending) across four strategy profiles × four
  difficulties. **Calibrated the live election arc** (the C-8 handoff): seeded the historical
  electoral-bloc configuration per election year in `election_1928` on-arrival so the verified arc
  (1931 Republican-Socialist sweep → 1933 Radical-CEDA → 1936 Popular Front, PSOE largest) plays out
  live — the bloc-list law is the dominant seat lever, the matrix + CNT stance stay player-driven.
  **Tuned the clocks/force math:** the CNT-abstention coefficient 0.3→0.7 (a visible-but-subordinate
  1933 lever); clamped an army_loyalty runaway (a 0–1 fraction that hit 2.09, corrupting the coup
  math) in two unguarded writers; strengthened the Army-of-Africa force term 15x→35x so a grown
  Moroccan army is a real path to defeat. **Verified** all four coup outcomes reachable and
  correlated with play (revolutionary→republic_victory, moderate→long_war, passive→total_defeat,
  defensive→coup_averted), coup fires on the historical path (progress 12) but averts under sustained
  counter-play (3), no faction/economic metric runs away. **Endings cleanup:** purged the dead German
  ending residue from `game_over.scene.dry` (Holocaust `<iframe>`, `@nsdap_win`, `@braun_victorious`,
  the six `@president_*`, `@spd_victorious`/`_2`, `@communist_victory`, `@european_union`) and fixed
  SPD→PSOE / Hitler prose leaks in the live-var-gated achievement slides. **Found but left per
  precedent:** the dead German monthly economic block (`post_event.scene.dry` L815–884) is confirmed
  inert, left documented (H2-4 precedent); `post_event` can't run headless (`dendryUI`), so the
  harness under-counts difficulty's dissent-dampening — flagged in `M_balancing.md`'s punch list
  along with the human-playtesting judgments a simulation can't make.

- **Area N (content depth):** ✅ done — a post-M content pass adding **11 new mid-game events**
  (`events/` 15 → 26) to populate the sparse 1931–1935 middle years: the convent burnings, the 1931
  Constitution fight, the Catalan Statute, the Agrarian Reform Law, the Falange's founding, women's
  suffrage, the Catalan revolt + the October repression, the Straperlo scandal, the Prieto–Caballero
  rift, and Azaña's move to the presidency. All choiceless narrative beats (the proven
  `sanjurjada`/`casas_viejas` pattern) with reactive `[? if … ?]` prose and `on-arrival` effects on
  existing state axes only — **no new mechanics/vars, and the M calibration is untouched** (the
  harness confirms the historical election arc and all four coup outcomes unchanged, coup still
  avertable, zero NaN). Details in `docs/planning/N_content_depth.md`.

## How to continue (recommended next step)

**All areas A–M are complete.** The game is end-to-end playable, the dead German corpus is gone,
the Government Affairs policy-card deck is real Spanish content, the advisor roster is real Spanish
figures, the bulk of the imagery matches the words, the qdisplay/UI layer is on Spanish content, the
final German-string cleanup is done, **and the balancing pass is calibrated** (April 1931 → three
elections reproducing the historical arc → July 1936 coup → one of four Spanish endings, tree ~75%
smaller with no known German content on any confirmed-reachable path — text, image, or UI; the
election/coup/force numbers calibrated by simulation via `scripts/balance_sim.mjs`). **What remains
is human judgment, not engineering:**

1. **Human playtesting** (see `M_balancing.md`'s punch list) — the feel/fairness/pacing judgments a
   headless simulation cannot make: is the militia the right amount of "win button," does averting
   the coup feel satisfying, does "hard" feel like a different game, is the depression's economic
   pacing right. The measured calibration is done; actual play sessions are the standing remainder.
2. **Area K's human-review punch list** (see `K_assets.md`'s K-6/K-7 entries) — sign off on the
   sourced files' identity/subject match, decide on the CC BY-SA share-alike sources, and optionally
   hand-source the items still on the placeholder (including the Conspiracy page's general portraits,
   which Area J left text-only) via Commons-category browsing.
3. **The interleaved dead block in `@post_election_1928`** (`H2_bulk_cleanup.md`'s H2-4) and **the
   dead German monthly economic block** (`post_event.scene.dry` L815–884, `M_balancing.md`) —
   both confirmed inert and deliberately left alone; only worth touching for the careful
   numerical-equivalence-guarded surgery the plans describe.
4. **`coalition_affairs.scene.dry`'s dropped election-trigger branch** (`G_policy_cards.md`'s
   G-5 finding) — `set_next_election_time.scene.dry` is silently inert (guards on a
   never-initialized `time_to_election`); flagged for whoever next touches the election-
   timing engine, not fixed by Area G since it's out of scope.
5. **Optional content enhancement** — give the player agency over PSOE's *own* electoral-bloc
   membership in 1933/1936 (currently a scripted historical backdrop that reproduces the arc). A
   content/mechanism task, not number-tuning; flagged in `M_balancing.md`.

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
