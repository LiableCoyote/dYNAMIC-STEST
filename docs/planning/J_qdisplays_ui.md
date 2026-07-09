# Area J — Quality Displays & UI Text

> **Status.** ✅ **DONE.** The qdisplay set and the status/conspiracy UI screens are now free of
> German content on every confirmed-live path. Every remaining qdisplay is generic or Spanish; the
> German presidential "camarilla" is now the Spanish 1936 military conspiracy; the Politics and
> Polls tabs read the live Spanish party/demographic model. One narrative-prose residue in the
> library (`@government`/`@weimar_timeline`) is flagged for a content follow-up, out of J's lane.

## What a qdisplay is (the mechanism)

A **qdisplay** is a range→label formatter, one file per id at `source/qdisplays/<id>.qdisplay.dry`
(band syntax: `(min..max) output`, half-open, HTML allowed; a leading blank line + a single `#`
comment line is the working header format — two comment lines or no leading blank make the parser
reject the first band with "Invalid property definition"). It is invoked from scenes as
`[+ VARIABLE : qdisplay_id +]`. The concatenation trap that auto-renamed *variables* does **not**
touch qdisplay ids — they are hardcoded string literals in the call sites — so German-named ids
persisted even after their variables became Spanish. Qdisplays compile into a top-level `qdisplays`
map in `out/game.json`; there is no central list file (the id is the filename stem).

## The "83 files" correction

Prior docs (E/G/I, CLAUDE.md) flagged "the `hindenburg_angry` id used across 83 files." That figure
is a **stale pre-H2-cleanup snapshot**. Today `hindenburg_angry` as a *qdisplay call-site*
(`[+ … : hindenburg_angry +]`) resolved to exactly **2** live sites; the ~100 other occurrences
are `Q.hindenburg_angry` state-variable arithmetic inside dead German blocks in
`post_event.scene.dry`/`main.scene.dry` (not qdisplay calls, not in J's scope). "`nsdap_r`-class
dead qdisplay ids" was CLAUDE.md shorthand for the dead-German qdisplay *call-sites* in the
camarilla panels — they were removed by converting those panels, not by a separate hunt.

## Execution status

- **J-0 (recon + reachability determination):** ✅ done. Inventory: 22 qdisplay files (design doc's
  "23" was off by one). Split into three buckets — generic keepers (10), the misnamed-but-live
  `hindenburg_angry`, three zero-ref dead defs, and seven German orphans in the camarilla panels.
  **Reachability was fully determined** (H2 had left it "uncertain"): the status tab bar is
  hardcoded in `out/html/index.html`. `Main` (`status`), `Politics` (`status.politics`), `Defense`
  (`status.paramilitaries`), `Polls` (`status.polls`), and `Conspiracy`/ex-"Scheming"
  (`status_right`) are all **live and visible**; only the `Emergency Status` tab
  (`status.emergency`) is `style="display:none"` and is never un-hidden by `game.js`, so
  `status.emergency` is **dead**. This turned "convert-if-live" from a gamble into a clear map: the
  German rosters on the Politics tab, the Polls demographic table, and the whole Scheming panel are
  player-visible bugs; only `@emergency` is dead. Baseline `BUILD OK` → `SMOKE PASSED` (8).

- **J-1 (safe qdisplay wins):** ✅ done. `git mv hindenburg_angry.qdisplay.dry →
  president_approval.qdisplay.dry` and repointed its 2 live call-sites (`status.scene.dry:53`,
  `library.scene.dry:92`); labels were already generic so no display change. `git rm`'d the three
  zero-ref dead defs (`hindenburg_angry_bruning`, `hindenburg_unity`, `cvp_dnvp_balance`).

- **J-2 (Emergency tab + Politics roster):** ✅ done. Deleted the dead `@emergency` sub-scene and
  removed its `display:none` tab button from `index.html`. On the **live** Politics tab, the "Party
  Leadership" and "Industrial Backing" panels were German-splinter conditional soup
  (DNEF/CVP/DDP/DVP/KPD/DNVP/NSDAP, `industrial_*_backing`) gated on German formation flags never
  set in Spanish play — so they rendered blank on a live tab. Replaced both with a single Spanish
  "Party Leadership" roster (the 7 real parties + ideology + leader), mirroring `library`'s
  `@parties`; dropped the "Industrial Backing" header (no Spanish analog var — that was a
  splinter-only mechanic).

- **J-3 (Scheming → the conspiracy):** ✅ done. Rewrote `status_right.scene.dry` (a live visible
  tab) from the German presidential camarilla (Hindenburg / Papen / Schleicher / Meissner / Oskar,
  reading dead German influence vars) into the **1936 military conspiracy**, driven entirely by
  live Area-F coup vars: `coup_progress` (via a new `coup_readiness` qdisplay calibrated to the
  coup's own `>= 10` trigger — dormant/stirring/advanced/imminent/breaking), `africa_army`, and
  `army_loyalty`/`army_strength` (existing `loyalty` display). The plotters (Mola "El Director",
  Sanjurjo, Franco, Goded, Queipo de Llano) and the civilian front (Calvo Sotelo, the Falange, the
  Carlist Requetés) are static Spanish text — no per-plotter influence var exists and inventing one
  is out of scope. Retitled page + sidebar tab from "Scheming" to "Conspiracy". Verified by Node
  sim (coup_readiness resolves dormant→breaking across `coup_progress` 0..13; zero German residue;
  Mola/Sanjurjo/Franco present). **Portrait note:** no Spanish general portraits exist under
  `img/es/leaders/` (Area K sourced PSOE figures, not the generals), so the panel is text-only —
  flagged for a future Area-K asset pass rather than shipping a wall of placeholders.

- **J-4 (Polls demographic block):** ✅ done. The Polls tab's "Detailed results for each
  demographic" table read German-keyed `*_display` vars (`workers_spd_display`, …) that are never
  computed — `post_event.scene.dry:175` builds the matrix by concatenation
  (`Q[c+'_'+party+'_display']`) over the Spanish class/party keys, producing `industrial_psoe_display`
  etc. (the live matrix already used by `library`'s `@demographics`). Rewrote the six rows over the
  Spanish class model (industrial / urban middle / smallholders / landless / unemployed / catholics)
  × the seven Spanish parties + others, reading the live vars. `status.scene.dry` is now free of
  German splinter refs and party markup.

- **J-5 (qdisplay cleanup):** ✅ done. With every panel converted, the seven German orphans plus
  `camarilla_strength` (unused after J-3 chose static plotter text) were all at zero call-sites —
  `git rm`'d all eight. Stripped the "reichswehr" comment from `loyalty.qdisplay.dry`. The set is
  now **12 files, all generic or Spanish, zero German names**: boycott_efficacy, coalition_dissent,
  confidence, coup_readiness, dissent, loyalty, militancy, month, president_approval, relationships,
  strength, taxation.

- **J-6 (verification + docs):** ✅ done — this document, plus `CLAUDE.md` and the design doc §J.
  Final sweep: zero German qdisplay ids referenced anywhere in scenes; zero German party markup on
  the status screens; compiled `game.json` carries 0 German-named qdisplays; headless Chromium load
  clean throughout.

## Found but out of scope (flagged, not done)

- **`library.scene.dry`'s `@government` and `@weimar_timeline`** are still German **narrative
  prose** — a Weimar-constitution explainer ("The German Republic… Reichstag… Prussia…") and a
  1918–1933 German history timeline. The design doc scopes Area J's label audit to
  `status`/`status_right`, and CLAUDE.md's content-debt boundary explicitly assigns these library
  prose sections to content areas. They are player-visible and should be converted (the Spanish
  1931 Constitution's system; a 1931–1936 Republic timeline) as a dedicated content follow-up —
  closer to Area E/H work than a qdisplay/UI pass. Recommended as the natural next step.
- **General portraits for the Conspiracy page** — Mola/Sanjurjo/Franco/Goded/Queipo/Calvo Sotelo
  have no sourced `img/es/leaders/` portrait; the panel is text-only pending an Area-K asset pass.
- **The dead `Q.hindenburg_angry`/`hindenburg_angry_bruning` arithmetic** in `post_event.scene.dry`
  (the ~100 non-qdisplay occurrences) is inert German computation inside already-dead blocks —
  same class as the other flagged `post_event` dead code (F/H), not J's concern.
