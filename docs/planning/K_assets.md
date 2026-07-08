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

> **Session handoff.** 🟡 **IN PROGRESS.** Detailed execution plan for **Area K**
> (image assets). Converts the German portrait/poster imagery to license-clean Spanish imagery by
> sourcing public-domain / CC files from Wikimedia Commons with recorded provenance, repointing
> every `card-image:`/`set-bg:`/`<img>` reference onto the `img/es/` scheme, and gating everything
> behind a credits requirement and a broken-path build check. **Prerequisite (blocking):** the
> environment network policy must allow outbound HTTPS to `commons.wikimedia.org`,
> `upload.wikimedia.org`, and `*.wikipedia.org` — verify with the K-0 probe before doing anything
> else; if it still 403s, **stop and report** (do not proceed with fabricated/placeholder-only
> art unless the user re-scopes).

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
