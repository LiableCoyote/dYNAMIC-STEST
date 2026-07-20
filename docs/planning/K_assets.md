# Plan: Area K — Assets (Images)

## Context

Areas A–I converted the game's **text** — every advisor, policy card, party, and event now reads
as the Second Spanish Republic. But every card still points at a **German portrait image**: the
Largo Caballero card shows a photo of Theodor Leipart, the Besteiro card shows Otto Wels, and so
on. Area K makes the pictures match the words. Area A already built the scaffolding this plugs
into — the `img/es/{leaders,parties,events}/` folder scheme, a shared `img/placeholder.jpg`, and a
strict credits rule (`out/html/img/es/README.md`: *"Every file must have a credits line stating a
redistributable license, source URL, and attribution. No provenance, no commit."*).

**A hard environment constraint shaped the approach (confirmed during planning):** this session's
egress proxy **blocks outbound web access** — `commons.wikimedia.org` and `*.wikipedia.org` return
`403 policy denial`; only package registries (npm/PyPI/crates/Go) are reachable. So real portrait
sourcing is impossible until the environment's **network policy is changed to allow Wikimedia
egress**. **The user chose "enable egress first, then source"** — so Area K's prerequisite is that
admin change, after which the executor sources real **public-domain / CC** portraits from
Wikimedia Commons with **machine-verified provenance** (recorded from the Commons API, never
fabricated — this satisfies the design doc's "flag for human review, don't auto-generate historical
claims of provenance"). **Achievements are deferred** (the 123-icon `game_over` gallery is its own
follow-up); **music is deferred** (audio sourcing is a separate human pass).

---

> **Session handoff.** 🟡 **DONE, PENDING HUMAN ART REVIEW.** Area K (image assets) is
> functionally complete: no card points at a broken image path, no German-identifiable imagery
> remains on any live card, and every sourced file carries machine-verified Commons provenance.
> K-7 extended the pipeline with a Commons-search fallback (for subjects with no Wikipedia article)
> and sourced 4 more Tier-2 items, bringing the total to 29 of 46 named-figure/topical images
> sourced. What's outstanding is human judgment, not engineering: 5 CC BY-SA (share-alike) sources
> want a license-obligation sanity check, `vidiella`'s portrait is a group photo rather than a solo
> shot, and ~14 items (3 named figures, ~11 topical/poster items) have no free image and stay on
> the shared placeholder after a genuine search — see K-6/K-7 below for the full punch list.

## Execution status

- **K-0 (egress probe + manifest):** ✅ done. Re-probed the network (the user's prior turn enabled
  egress): `es.wikipedia.org`'s `siteinfo` API and `commons.wikimedia.org`'s `imageinfo` API both
  return valid JSON with **no relay failures logged**; a live end-to-end test (resolve Largo
  Caballero's lead image → verify `LicenseShortName: Public domain` → download from
  `upload.wikimedia.org`) succeeded (58,881-byte real JPEG, HTTP 200). The prerequisite is
  satisfied. Built `docs/planning/K_assets_manifest.md`: scanned all `.dry` files for `img/...`
  literals, found **209 distinct paths** (127 `img/achievement/*`, deferred; **82 in Area K's
  scope**), tiered as **29 target files across 27 downloads** (Tier 1, named portraits — two
  filename pairs, `WelsOtto.jpg`/`WelsRudolf.jpg` and `HirschfeldMagnus.jpg`/`hirschfeld.jpg`,
  both collapse to one Spanish figure each), **19 Tier-2** topical/poster items, **11 Tier-3**
  era-neutral textures left untouched. **Also found and flagged as out of scope:** 18 more
  portrait paths (`SchleicherKurt.jpg`, `PapenFranz.jpg`, `Meissner.jpg`, etc.) all belong to
  `status.scene.dry`/`status_right.scene.dry`'s "camarilla" panel — the exact substantially-
  unconverted-German-content-of-unresolved-reachability debt `H2_bulk_cleanup.md` already flagged;
  Area K doesn't touch it, matching every prior area's precedent. Confirmed `red_general.scene.dry`
  (retired) and a commented-out `#face-image:` reference are genuinely dead. **Verify:** `BUILD
  OK` → `SMOKE PASSED` (no source edits yet); manifest covers all 82 in-scope refs; plan + manifest
  committed.

- **K-1 (sourcing pipeline):** ✅ done. `scripts/source_assets.mjs` resolves a figure's lead image
  via the Wikipedia pageimages API (es then en), verifies license via Commons
  `imageinfo`/`extmetadata`, and (outside `--dry-run`) downloads only redistributable licenses
  while recording provenance to `out/html/credits_images.txt`. Two real bugs found and fixed while
  building it: (1) Node's native `fetch` doesn't read `HTTP_PROXY`/`HTTPS_PROXY` without
  `--use-env-proxy` — the script re-execs itself under that flag so plain `node
  scripts/source_assets.mjs ...` works against this environment's egress proxy; (2) the
  `extmetadata` `Artist` field's stripped HTML was concatenating words with no space
  ("AnonymousUnknown author") — fixed by replacing tags with a space before collapsing whitespace.
  **Verify:** `--dry-run` over Largo Caballero/Prieto/Besteiro (`scripts/test_manifest.json`, later
  deleted once superseded by the real manifest) reported a real file + a redistributable license
  each, no download/credits write in dry-run; `BUILD OK` → `SMOKE PASSED` unaffected (tooling
  only).

- **K-2 (named-figure portraits):** ✅ done for the sourceable set. Built the full 28-figure Tier-1
  manifest (`scripts/asset_manifest.json`) and ran the pipeline for real. **25 of 28 resolved** to
  a redistributable-license Commons file (20 Public domain, 4 CC BY-SA, 1 CC BY, 1 Attribution),
  downloaded to `img/es/leaders/` with real provenance in `credits_images.txt`. **3 have no free
  lead image on es/en Wikipedia and remain unsourced:** Lucio Martínez Gil (`martinez_gil`),
  Juan-Simeón Vidarte (`vidarte`), Julia Álvarez Resano (`alvarez_resano`) — these fall back to the
  shared `img/placeholder.jpg` at K-4 repoint time; flagged here for a future human sourcing pass
  (obscure UGT/Socialist-Youth figures, plausibly no free-licensed photo exists at all). Two more
  pipeline bugs found and fixed mid-run: Wikimedia 429-throttles bursty traffic (added
  `Retry-After`-aware exponential backoff to both the API-fetch and file-download paths, and
  slowed the inter-entry delay from 200ms to 1200ms); 5 of the 25 downloads were actually PNGs
  that the manifest had guessed `.jpg` for (`cordero`, `galarza`, `maranon`, `negrin`, `saborit`) —
  would have served with a wrong `Content-Type`, so the pipeline now derives each file's real
  extension from the source URL and self-corrects the target path, and the 5 already-downloaded
  files/manifest entries/credits lines were renamed to match. **5 items are CC BY-SA (share-alike),
  flagged in the pipeline's own output for human review:** `de_gracia`, `gonzalez_pena`, `llopis`,
  `vidiella`, `lejarraga`. **One identity caveat:** `vidiella`'s resolved image is a group photo
  ("Comité Central de Milícies Antifeixistes") rather than a solo portrait — correctly attributed
  and clearly him, but a weaker card image than the rest; candidate for a later manual swap if a
  solo portrait surfaces. **Verify:** 25/28 files exist under `img/es/leaders/` with matching
  `credits_images.txt` lines; `file` confirms every file's real format matches its extension (zero
  mismatches); spot-checked 6 files as valid JPEG/PNG data; `BUILD OK` → `SMOKE PASSED` unaffected
  (not yet wired into `source/scenes/**` — that's K-4).

- **K-3 (topical/poster/event images):** partial — the judgment-heavy tier lived up to its
  billing. First inspected the current German images directly (the `Read` tool renders images)
  rather than guessing from filenames alone: confirmed `reichstag_1.jpg`/`reichstag_2.jpg` are
  unmistakably the Reichstag (eagle crest, "Einigkeit und Recht und Freiheit" banner, the building
  itself), `blutmai_2.jpg`/`protest.jpg` are Berlin street scenes (German shop signage, the Berlin
  Cathedral in the background) — all confirmed German and in need of replacement. Also confirmed
  `international.jpg` (the 1864 First International banner/beehive emblem) is not German-specific
  and historically apt to keep as-is — PSOE/UGT are genuinely First-International-descended.
  **Sourced 4 strong replacements**, each visually verified before committing:
  `img/es/events/cortes_exterior.jpg` (Congreso de los Diputados facade — a modern color photo of
  the actual, correct building; no free period exterior photo surfaced, flagged for a possible
  later swap), `img/es/events/casas_viejas.jpg` (a real period photo of the 1933 Casas Viejas
  aftermath), `img/es/events/asturias_1934.jpg` (a real period photo of arrested workers during the
  1934 Asturias rising), and one unplanned strong find, `img/es/events/popular_front_rally.png` —
  the actual 17 February 1936 front page of *La Voz* ("ESPAÑA VOTA POR LAS IZQUIERDAS"), naming and
  photographing Besteiro, Azaña, Álvarez del Vayo, Araquistáin, Largo Caballero, and Jiménez de
  Asúa as the winning Madrid candidates. **Rejected several bad automated matches caught by visual
  inspection**, not just license-checked blindly: a "Cortes Constituyentes" search resolved to an
  SVG election-results chart, not a photo; a Puerta del Sol search and a Banco de España search
  both resolved to anachronistic modern-day (2010s-era) photos that would visually clash with the
  game's 1930s B&W imagery; a "PSOE" search resolved to a present-day party-congress logo.
  **The remaining ~15 Tier-2 items are not yet sourced** (`muller_cabinet`, `iron_front`,
  `reichsbanner`, `vorwarts_2`/`Vorwaerts_nr_1`, `Mann_der_Arbeit`, `Reichstagsfraktion_der_SPD`,
  `arbeiterbew`, `sangerbund`, `poster_0/1/2`, `weimar_coalition_2/3`, `bankrun`) — mostly
  posters/mastheads/named-cabinet group photos that don't resolve cleanly through a
  Wikipedia-pageimage lookup (Wikipedia doesn't have a dedicated article+lead-image for "a 1930s
  PSOE poster"; that needs a human browsing Commons categories, out of this pipeline's scope).
  These fall back to `img/placeholder.jpg` at K-4 and are flagged here for a future manual sourcing
  pass. **Verify:** 4 files exist under `img/es/events/` with matching `credits_images.txt` lines;
  each was rendered and visually confirmed on-subject and (mostly) period-appropriate before being
  kept; `BUILD OK` → `SMOKE PASSED` unaffected.

- **K-4 (repoint + placeholder fallback):** ✅ done. `scripts/k4_repoint.py` applied the mapping in
  `scripts/k4_repoint_map.txt` across all 71 scene files with a live `card-image:`/`set-bg:`
  reference (98 lines changed): the 26 sourced named-figure cards now point at their
  `img/es/leaders/*` file (including the two duplicate-source cases — WelsOtto/WelsRudolf both
  collapse to `besteiro`, HirschfeldMagnus/`img/hirschfeld.jpg` both collapse to `maranon`);
  `reichstag_1.jpg`/`reichstag_2.jpg` now point at `cortes_exterior.jpg`; `blutmai_2.jpg` (Berlin
  street fighting) now points at `casas_viejas.jpg`; `protest.jpg` (a Berlin Lustgarten/Cathedral
  rally) now points at `asturias_1934.jpg`. Found one map gap while sweeping: `reichsbanner.jpg`
  (the "UGT Militia" card) wasn't in the original K-3 recon list — added it, confirmed by rendering
  it that it's the same Berlin-cathedral rally shot as `protest.jpg`, and routed it to the shared
  placeholder since no dedicated militia photo has been sourced yet. The 3 unsourced Tier-1 figures
  and ~16 unsourced Tier-2 items now point at `img/placeholder.jpg` rather than a broken or
  mismatched path. `international.jpg`, the confirmed-generic Tier-3 textures, and the dead retired
  `red_general.scene.dry` → `schleicher.jpg` reference were left untouched. **Verify:** a standalone
  sweep confirmed all 37 distinct `card-image:`/`set-bg:` paths in `source/scenes/**` (touched and
  untouched) resolve to a real file under `out/html/`; the compiled `game.json` was spot-checked to
  confirm the repointed paths survived the build; headless Chromium load clean (no
  `Uncaught`/`ReferenceError`/`TypeError`); `BUILD OK` → `SMOKE PASSED` (6 checks).

- **K-5 (broken-path guard + credits completeness):** ✅ done. Added two checks to
  `scripts/smoke.js`: one scans every scene's compiled `cardImage`/`setBg` field and fails if the
  path doesn't resolve to a real file under `out/html/`; the other scans every file under
  `out/html/img/es/` and fails if it has no matching provenance line in `credits_images.txt`
  (turning the README's "no provenance, no commit" rule into an enforced check, not just a
  documented one). **Proved both guards actually catch failures before trusting them:** repointed
  `wels.scene.dry` at a nonexistent file and confirmed smoke failed with the exact broken path
  named; added an uncredited file under `img/es/leaders/` and confirmed smoke failed with that
  file named; reverted both and confirmed a clean `SMOKE PASSED` (8 checks). **Verify:** guard
  false-positive/false-negative tested in both directions; headless Chromium load still clean;
  `BUILD OK` → `SMOKE PASSED` (8 checks) on the real, unmodified tree.

- **K-6 (docs + human-review handoff):** this entry. **What Area K shipped:** 25 of 28 Tier-1
  named-figure portraits and 4 Tier-2 topical/event images sourced from Wikimedia Commons with
  machine-verified provenance in `credits_images.txt`; every live `card-image:`/`set-bg:`
  reference across 71 scene files repointed onto `img/es/` or the shared placeholder — zero broken
  paths, zero known German-identifiable imagery left on any live card; two new build-time guards
  (K-5) make both failure modes permanent regressions, not one-time fixes. **What still needs a
  human, in priority order:**
  1. **Identity/subject sign-off** on the 25 sourced portraits and 4 event images — the pipeline
     picked the Wikipedia-designated lead image per figure/subject and this session cross-checked
     filenames and rendered a sample, but no one has done a systematic side-by-side "is this really
     them" pass across all 29 files.
  2. **5 CC BY-SA (share-alike) sources** — `de_gracia`, `gonzalez_pena`, `llopis`, `vidiella`,
     `lejarraga`, plus the Tier-2 `cortes_exterior.jpg` — carry a share-alike obligation on
     downstream reuse; confirm the project's own licensing (MIT code, CC-sourced art) is fine with
     that mix, or swap for a Public Domain alternative if not.
  3. **3 unsourced Tier-1 figures** (Lucio Martínez Gil, Juan-Simeón Vidarte, Julia Álvarez Resano)
     — no free lead image on es/en Wikipedia *or* Commons (K-7 confirmed via direct Commons search,
     zero hits for all three); still on the shared placeholder. These are genuinely likely to have
     no free-licensed photo at all — accept the placeholder as permanent unless a human turns up
     something in an offline/non-Wikimedia archive.
  4. **~11 still-unsourced Tier-2 items** (`iron_front`, `reichsbanner`, `Reichstagsfraktion_der_SPD`,
     `arbeiterbew`, `poster_0/1/2`, `weimar_coalition_2/3`, `bankrun`) — K-7 searched all of these
     via Commons and found nothing usable (mostly irrelevant archive PDFs); posters and militia
     photography in particular are genuinely copyright-constrained for this era (Spain's life+70/80
     term means most named-artist 1930s poster art isn't free yet). Needs a human browsing Commons
     categories directly (e.g. Category:Political posters of Spain) or accepting placeholders as
     permanent for this cluster.
  5. **`vidiella`'s portrait is a group photo**, not a solo shot — correctly attributed and clearly
     him, but weaker than the rest; swap if a solo portrait surfaces.
  6. **Optional cleanup:** the legacy German image files under `img/portraits/`, `img/*.jpg` etc.
     are still present (nothing deletes them) — harmless dead weight now that nothing references
     them, but a `git rm` pass is available once someone wants to reclaim the space.
  **Deferred, unchanged from the original plan:** achievements (the 123-icon `game_over` gallery)
  and music. **Verify:** all of K-0 through K-5's individual verify steps; this document's banner
  reflects the true state (🟡, not ✅, until 1–2 above get a human pass); `CLAUDE.md` and the design
  doc's §K updated to match.

- **K-7 (extend sourcing via Commons search):** ✅ done — pushed past the Wikipedia-pageimage
  ceiling K-6 flagged. Extended `scripts/source_assets.mjs` with `searchCommons(query, limit)` (the
  Commons File-namespace search API) and a `--search=<query>` CLI mode that prints license-checked
  candidates (subject, license, raw image URL, description URL) without downloading — pure
  discovery, so every candidate could be visually inspected (via the `Read` tool, same discipline
  as K-3) before anything was committed. Also added `commonsFile` as an alternative to `figure` in
  manifest entries, so a specific Commons file chosen by search+review downloads through the exact
  same license-gate/provenance/extension-correction machinery as a Wikipedia-pageimage figure —
  one pipeline of record, not a parallel one. Ran ~15 targeted searches across the K-6 punch list
  (named figures, cabinet/parliamentary-group photos, militia/rally photos, posters, mastheads,
  bank-crisis photos) and **found 4 genuinely strong matches**, all visually verified before
  download: `img/es/parties/el_socialista.jpg` (the actual 12 March 1886 first issue of *El
  Socialista*, CC0 — now the `Vorwaerts_nr_1`/main-deck party-affairs icon *and* the `sangerbund`/
  media-card image), `img/es/parties/casa_pueblo.jpg` (a 1908 press photo of the real Casa del
  Pueblo de Madrid building, Public domain — now the `vorwarts_2`/recruit-roster structural-card
  image), `img/es/parties/pablo_iglesias_casa_pueblo.jpg` (Pablo Iglesias addressing a crowd at the
  Casa del Pueblo's inauguration, CC BY 4.0 — now the `Mann_der_Arbeit`/party-organizations image),
  and `img/es/events/figuras_1931_votando.png` (a 1931 press-photo composite of Alcalá-Zamora,
  Besteiro, Largo Caballero, Azaña, and other named figures voting in the Constituent elections,
  Public domain — now the `muller_cabinet` cabinet/coalition-affairs image, used across 3 cards).
  **Confirmed a real gap in the naive repoint approach**: since K-4 had already repointed these 5
  German paths to the shared `img/placeholder.jpg`, the `.dry` files no longer contained the
  *original* German path strings `k4_repoint_map.txt` keys off — re-running `k4_repoint.py`
  wholesale would have found zero matches (and correctly errored) rather than silently doing
  nothing. Fixed by identifying the exact file+line for each of the 8 live `card-image:` references
  (3 for `muller_cabinet`, 2 for `vorwarts_2`, 1 each for `Vorwaerts_nr_1`/`sangerbund`/
  `Mann_der_Arbeit`) from the original pre-K-4 recon and editing each in place directly — the
  repoint map file itself was still updated as documentation of record, but the actual `.dry` edits
  used exact-location `Edit` calls rather than a blind string-replace, since several unrelated
  lines (the 3 unsourced named figures) also currently read the identical `img/placeholder.jpg`
  text and must not be touched. **Also confirmed by direct search that the 3 unsourced Tier-1
  figures genuinely have zero Commons coverage** (0 results each for Martínez Gil, Vidarte, Álvarez
  Resano) — not a search-term problem, there's simply no free-licensed image of them anywhere on
  Wikimedia. The remaining ~11 Tier-2 items (posters, militia photography, the PSOE parliamentary-
  group photo, bank-crisis photography) were searched with 1-2 query variants each and came back
  empty or irrelevant (mostly unrelated archive PDFs matching on stray keywords) — consistent with
  the pre-stated copyright-honesty expectation that named-artist 1930s poster art is unlikely to be
  free yet under Spain's life+70/80 copyright term. **Verify:** all 4 downloaded files spot-checked
  as valid JPEG/PNG with `file`; all 4 credited in `credits_images.txt` with real Commons
  provenance; all 8 live `card-image:` references confirmed pointing at the new files (placeholder
  count dropped from 31 to 23 lines, exactly the expected 8); `BUILD OK` → `SMOKE PASSED` (8
  checks, both K-5 guards green); headless Chromium load clean.

> **Audience: a Sonnet-class executor working cold.** Read `CLAUDE.md`,
> `docs/planning/A_engine_build_scaffolding.md` §5 (the asset-path strategy), and
> `out/html/img/es/README.md` before touching anything. `npm run build && npm run smoke` after
> every change. The dominant failure modes here are **(1) a broken image path** (a repointed card
> pointing at a file that wasn't downloaded → the K-5 smoke guard must catch it), **(2) a license
> that doesn't permit redistribution** (must be filtered out — no credits line, no commit), and
> **(3) a misidentified portrait** (the pipeline picks candidates; a human confirms identity before
> sign-off).

---

## How assets work here (the facts to build on)

- **Images live directly under `out/html/img/**` and are committed to git** (411 files tracked).
  There is **no `source/img/`** and the build does **not** copy images — scenes reference them by
  relative `img/…` paths resolved against `out/html/`. New assets are authored in place under
  `out/html/img/es/`.
- **The `img/es/` scheme (Area A):** `img/es/leaders/` (figure portraits), `img/es/parties/`
  (logos/posters), `img/es/events/` (event illustrations). Currently empty (`.gitkeep` only).
  Target filenames are ASCII slugs, e.g. `img/es/leaders/largo_caballero.jpg` (per the README's own
  example).
- **Reference mechanisms** (in `source/scenes/`): `card-image:` header (103 uncommented uses),
  `set-bg:` (5), inline `<img src="img/…">` (mostly the 381 achievement refs in
  `game_over.scene.dry` — **deferred**), for **205 distinct referenced image paths** total.
- **`credits_images.txt` does not exist yet** — Area K creates it (Area A defined the rule but not
  the file). Every `img/es/` asset gets a line: `file | source-URL | license | author | accessed`.
- **`img/placeholder.jpg` exists** — the license-clean fallback for any figure with no free image.

## The three tiers of imagery (drives the whole plan)

Recon produced the authoritative reference list. It splits into three tiers with different work:

1. **Named-figure portraits (~30 distinct, the bulk).** Each maps 1:1 to a real Spanish person, so
   each is directly sourceable from Wikimedia by name. The full advisor mapping is known — e.g.
   `img/portraits/WelsOtto.jpg`→**Julián Besteiro**, `LeipartTheodor.jpg`→**Largo Caballero**,
   `RadbruchGustav.jpg`→**Fernando de los Ríos**, `HirschfeldMagnus.jpg`→**Gregorio Marañón**,
   `WoytinskyWladimir.jpg`→**Trifón Gómez**, … (28 advisors + a few gov-card portraits like
   `EinsteinAlbert.jpg`→a Spanish scientist such as **Santiago Ramón y Cajal**, and
   `BrüningHeinrich.jpg` on the toleration card → **Manuel Azaña**, the IR premier being tolerated).
   → `img/es/leaders/<slug>.jpg`.
2. **Topical / poster / event images (~20, judgment-heavy).** Map to a Spanish *subject*, not a
   person: `img/reichstag_1.jpg`→the **Cortes** building; `iron_front.png`/`reichsbanner.jpg`→an
   **Alianza Obrera / UGT militia** image; `blutmai_2.jpg`→a Spanish labor-unrest photo (**1934
   Asturias** or **Casas Viejas**); posters (`poster_*`, `Vorwaerts`, `Mann_der_Arbeit`,
   `arbeiterbew`, `Reichstagsfraktion`)→**Republican / PSOE posters**; `weimar_coalition_*`→a
   Cortes/coalition image. Sourced where a clean PD image exists; **placeholder + manifest** the
   rest for human sourcing.
3. **Era-neutral textures (keep as-is, no work).** `paper.jpg`, `map_2.jpg`, `hourglass.jpg`,
   `black.jpg`, `flags.jpg`, `bankrun.jpg`, `protest.jpg`, `international.jpg` etc. are not
   German-specific — a paper texture or an hourglass needs no swap. **Confirm each is generic and
   leave it**; do not source needlessly.

---

## The six guardrails (memorize)

1. **Provenance is recorded, never invented.** Every downloaded file's license/author/source-URL
   comes from the **Commons `imageinfo` `extmetadata`** API response, written verbatim into
   `credits_images.txt`. If the API doesn't return a redistributable license, **the file is not
   used** — fall back to placeholder + manifest the gap. No credits line → no commit.
2. **Redistributable licenses only.** Accept `LicenseShortName` ∈ {`Public domain`, `CC0`,
   `CC BY *`, `CC BY-SA *`} (and PD variants: `PD-old-70`, `PD-US`, `PD-Spain`, `PD-1996`…).
   Reject anything non-free / "fair use" / no-derivatives. Flag CC-BY-SA share-alike for the human
   review note.
3. **Identity is human-confirmed.** The pipeline *proposes* the lead image from each figure's
   Spanish-Wikipedia page; the executor emits a review sheet (figure → chosen file → thumbnail/URL
   → license) for a human to sign off *before* Area K is called done. Obscure figures
   (Echevarría, del Rosal, de Gracia, Vidarte…) may have no free photo → placeholder + flag.
4. **Never break the build.** Repoint a card only once its target file exists (or a placeholder
   does). The **K-5 smoke guard** fails the build on any unresolved `card-image:`/`img src`/
   `set-bg:` path, so a missing download surfaces at build time, not play time.
5. **Keep the Area-A scheme & don't delete legacy yet.** New files under `img/es/…`; German
   originals stay until every reference is repointed and green (optional cleanup at the end).
   Keep the `credits_images.txt` rule. Set a descriptive **User-Agent** on all Wikimedia API/-
   download requests (Wikimedia blocks UA-less traffic).
6. **Stay in scope.** Achievements (the 123-icon `game_over` gallery) and music are **deferred** —
   do not touch them; note them as the next asset sub-area.

---

## Stage order and why

**K-0 (egress probe + manifest) → K-1 (sourcing pipeline) → K-2 (named-figure portraits) → K-3
(topical images) → K-4 (repoint + placeholder fallback) → K-5 (broken-path guard + credits +
verify) → K-6 (docs + human-review handoff).**

- **K-0 gates everything on the network prerequisite** — if the Wikimedia probe still 403s, stop.
- **K-1 builds the reusable engine once** so K-2/K-3 are just "run it over a list."
- **K-2 before K-3** — named portraits are the mechanical, high-confidence bulk; topical images are
  judgment-heavy, do them once the pipeline is proven.
- **K-4 repoints only after files exist**, so the build never dangles.
- **K-5 makes missing-image failures loud and permanent** (the guard stays in CI).

Each stage is independent and committable. Commit per stage (or per small asset batch); keep the
build green.

---

## Stage details

### K-0 · Egress probe + the asset manifest
**First, the blocking prerequisite:** probe the network — `curl -sS --max-time 25
"https://es.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json"` and a
`commons.wikimedia.org` `imageinfo` probe (see the query shape below). If either **403s**, the
network policy hasn't been opened yet — **stop and report to the user**; Area K cannot proceed.
If they succeed, build the **authoritative manifest** at `docs/planning/K_assets_manifest.md`: one
row per distinct referenced image → tier (1 named / 2 topical / 3 neutral-keep) → Spanish subject →
target `img/es/…` slug → which scenes reference it. Confirm a clean `npm run build && npm run
smoke`. **Verify:** probe returns JSON (not 403); manifest covers all ~205 refs; build+smoke green;
commit the manifest + this plan (`docs/planning/K_assets.md`) with the pending banner.

### K-1 · The sourcing pipeline (`scripts/source_assets.mjs`)
Write a Node ESM script (deps from npm only — e.g. built-in `fetch`; no web scraping beyond the
official APIs). For a given `{subject, targetPath}` it:
1. Resolves the figure's lead image — Spanish Wikipedia `action=query&prop=pageimages&piprop=
   original` (or REST `page/summary`), falling back to English Wikipedia.
2. Fetches Commons metadata for that file — `action=query&prop=imageinfo&iiprop=url|extmetadata`
   → reads `LicenseShortName`, `License`, `Artist`, `LicenseUrl`, `DateTimeOriginal`.
3. **Accepts only redistributable licenses** (guardrail 2); else returns "no-free-image".
4. Downloads the original to `targetPath`, resizing/normalizing if a dep is available (optional).
5. Appends a real provenance line to `out/html/credits_images.txt`.
Requirements: descriptive `User-Agent`; `--dry-run` mode (report choices + licenses, download
nothing); idempotent (skip already-sourced); a summary report (sourced / rejected-license /
not-found) for the review sheet. **Verify:** `--dry-run` over 3 well-known figures (Largo
Caballero, Prieto, Besteiro) reports a real file + a redistributable license each; no download in
dry-run; build+smoke unaffected (script is tooling, not wired into build).

### K-2 · Source the named-figure portraits (tier 1 → `img/es/leaders/`)
Run the pipeline over the ~30 named figures from the manifest. Human-review the result (identity +
license) via the emitted review sheet. For any figure with **no free image**, use the placeholder
generator (K-4) and flag it in the manifest. **Verify:** each sourced file exists under
`img/es/leaders/`, has a `credits_images.txt` line with a redistributable license, and the review
sheet is produced; spot-check 5 files open as valid images.

### K-3 · Topical / poster / event images (tier 2 → `img/es/{events,parties}/`)
The judgment set: source Spanish-subject equivalents where a clean PD image exists (the Cortes
building; a Republican/PSOE poster; a 1934-Asturias or Casas-Viejas photo for labor unrest; an
Alianza Obrera / UGT-militia image). Where none is clearly free/identifiable, **placeholder +
manifest** for human sourcing. **Confirm the tier-3 neutral textures are generic and leave them
untouched.** **Verify:** every tier-2 file sourced has a credits line; tier-3 textures unchanged;
build+smoke green.

### K-4 · Repoint references + placeholder fallback
Update every `card-image:`/`set-bg:`/live `<img src>` in `source/scenes/**` from the German path to
its `img/es/…` target (tier 1 & 2) — or leave the neutral tier-3 path. For anything not yet sourced,
point at a **generated per-figure placeholder** (`scripts/make_placeholder.mjs` → an original CC0
SVG/PNG: figure name + faction colour, license-clean, credited as this project's own work) or the
shared `img/placeholder.jpg`. Repoint per card, keeping the build green. (The advisor `card-image:`
lines and the gov/party ones are the bulk; the roster `add_*` `card-image:`s in
`party_affairs/shuffle_leadership.scene.dry` too.) **Verify:** grep shows zero `img/portraits/…`
German paths remaining on live cards (except intentionally-kept neutral textures); build+smoke
green.

### K-5 · Broken-path guard + credits completeness + verification
Extend `scripts/smoke.js` with a check that **fails** on any `card-image:`/`set-bg:`/`<img src=
"img/…">` path in the compiled `out/game.json` (or scanned scenes) that does **not** resolve to a
file under `out/html/`. Add a second check: every `img/es/…` file has a `credits_images.txt` line.
Run a **headless Chromium load** and confirm no image 404s / console errors. **Verify:** the new
smoke checks pass; deliberately breaking one path makes smoke fail (prove the guard works), then
restore; headless load clean.

### K-6 · Docs + human-review handoff
Write `docs/planning/K_assets.md`'s Execution-status section (house style): what was auto-sourced,
per-file licenses, which figures fell back to placeholder and need a human to source real art, and
the CC-BY-SA share-alike items. Flip its banner to ✅ **only after** a human signs off the identity
review sheet (or mark it 🟡 "pending human art review" if not). Update `CLAUDE.md` (reading list +
status-at-a-glance → Area K; how-to-continue → the deferred **achievements** gallery + **music** +
Areas J/L/M) and the design doc's §K. **Verify:** docs updated; manifest + review sheet complete;
final build+smoke+headless green.

---

## Verification (standing protocol)
1. `BUILD OK` → `SMOKE PASSED` after every stage; the K-5 guard makes any missing/renamed image a
   hard build failure.
2. **Provenance completeness:** every file under `img/es/` has a `credits_images.txt` line with a
   redistributable license copied from the Commons API — script-checked in smoke.
3. **Identity review sheet** (figure → file → license → thumbnail/URL) produced for human sign-off;
   no figure finalized on a guessed identity.
4. **Headless Chromium load:** images render, zero 404s / `Uncaught`/`ReferenceError`/`TypeError`.
5. **The load-bearing assertion:** after Area K, opening any advisor/policy card shows a
   license-clean image of the correct Spanish subject (or a clearly-labelled placeholder), every
   referenced path resolves, and every new asset is properly credited.

## Deferred / out of scope for Area K
- **Achievements** — the 123 `img/achievement/*` icons and the 381 `<img>` refs in
  `game_over.scene.dry` (many for achievements retired in Areas H/G/I). A dedicated follow-up:
  audit which achievements are still earnable, then source/redesign those icons.
- **Music** — `out/html/music` (Himno de Riego, A las Barricadas — one track already present); a
  separate human audio-sourcing pass. Manifest the need; do not source here.
- **Deleting the legacy German images** — optional cleanup once all references are repointed and
  green; not required for Area K to be "done."
- **If the egress probe (K-0) still 403s** — Area K cannot run; report to the user rather than
  shipping a placeholder-only build (unless the user re-scopes to the placeholder-only path).

---

## Polish Pass P (post-M art completion) — the 23 placeholders retired

> **Status.** ✅ **DONE.** A post-M pass triggered by first live playtesting ("remove placeholders,
> we need flavor and feel"). Every one of the 23 cards that still fell back to the gray
> `img/placeholder.jpg` now shows in-world art; `grep -rl img/placeholder.jpg source/scenes/` is
> empty. Both smoke guards stay green.

**5 new license-verified Wikimedia images sourced** (via the same `scripts/source_assets.mjs`
pipeline, `commonsFile` entries, visually inspected before use):
- `leaders/jose_antonio.jpg` (José Antonio Primo de Rivera, CC0) → `party_affairs/enemies`.
- `leaders/marcelino_domingo.jpg` (Agriculture minister, PD) → `government_affairs/agricultural_policy`.
- `leaders/macia.jpg` (Francesc Macià, PD) → `government_affairs/catalan_affairs`.
- `leaders/masquelet.png` (Gen. Masquelet, CC BY-SA 4.0 — share-alike, flagged) → `government_affairs/military_policy`.
- `events/elections_1933.jpg` (women voting, 1933, PD) → `party_affairs/inter_party_relationships`.

**Rejected:** `Quema de conventos (1931)` turned out to be an infographic *map*, not a scene photo —
deleted; the Church-question card uses the Congreso fallback instead.

**Remaining placeholder cards routed to thematically-matched existing art** (no new sourcing — reuse):
Asturias-1934 → `iron_front` (Alianza Obrera) + `reichsbanner` (UGT militia); Casas Viejas →
`cnt_relations`; the Popular-Front rally → `confronting_nazis` + `weimar_rally`; 1931 voting →
`peoples_party`; *El Socialista* → `ideology` + `fundraising`; the Casa del Pueblo / Pablo Iglesias →
`party_disunity`, `shuffle_leadership`, and the **3 figures with no free portrait** (Vidarte,
Martínez Gil, Álvarez Resano — the `leber`/`baade`/`juchacz` scenes); the Congreso façade →
`social_welfare`, `religious_policy`, `crisis_program` (generic institutional fallback).

**Light flavor polish (P-3):** enabled 9 written-but-commented card subtitles and added 3 new ones.

**Still for a human:** the `masquelet` CC BY-SA 4.0 share-alike obligation; whether the generic
Congreso fallback on `religious_policy`/`social_welfare`/`crisis_program` is worth replacing with a
hand-sourced church / breadline / bank-run photo (none was freely licensed on Commons at pass time);
the Macià portrait is a decorative 1907 oval, not a Republic-era shot.
