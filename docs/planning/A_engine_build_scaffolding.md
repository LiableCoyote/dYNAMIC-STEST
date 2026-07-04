# Area A — Engine, Build & Project Scaffolding (Detailed Plan)

> Expands **Area A** of [`../spanish_republic_conversion_design.md`](../spanish_republic_conversion_design.md).
> **Size: S · Type: Reuse.** This is the foundation layer: it unblocks every other area but writes almost no game content.
> **Decisions locked:** standalone total-conversion (own repo/build, not a `mod_loader` mod); game ends at the July 1936 coup.

---

## 0. Objective & Scope

**Goal:** stand up a clean, buildable, deployable project shell for the Spanish-Republic total conversion — renamed, reproducibly built, smoke-tested — *before* any historical content is written. When this area is done, a developer can run one command, get a playable (if placeholder) build, and CI publishes it.

**In scope**
1. Repo/package identity: rename from `social_democracy` → new id; update every metadata string.
2. Reproducible **local build + smoke-test loop**.
3. **CI recipe** (GitHub Pages deploy) adapted to the standalone repo and its branch model.
4. **Naming conventions** (the canonical rename map — every file/string that carries the old identity).
5. **Asset-path strategy** (folder layout, namespacing, placeholder policy, credits/licensing scaffolding).

**Explicitly out of scope** (belongs to later areas)
- Any change to game *content*, state variables, elections, or historical logic (Areas B–M).
- Sourcing real Spanish assets (Area K) — this area only defines *where they go* and ships placeholders.
- Removing German flavor text (Area L) — this area only renames *identity/metadata*, not scene prose.

**Definition of done:** `npm install && npm run dendrynexus make-html -- --pretty` builds with zero errors; the smoke test passes; a push to the default branch deploys a page whose title, `#game-title`, start menu, and mod-info read the new name; no user-visible string still says "Social Democracy: An Alternate History" or "Dynamic Social Democracy" in the *shell/metadata* (scene prose excluded).

---

## 1. Current-State Findings (build architecture, as discovered)

These are verified against the repo and are the factual basis for the plan.

### 1.1 Build pipeline
- Engine: **dendrynexus** (Dendry fork), installed from `github:originn0/dendrynexus` (see `package.json` → `dependencies`). Not a registry package.
- Source of truth for content: **`source/`** — `info.dry` (metadata) + `scenes/**` + `qdisplays/**`.
- Build command: **`dendrynexus make-html`** (README: "run in this folder"). CI runs `npm run dendrynexus make-html -- --pretty`.
- **Generated (gitignored):** `out/game.json`, `out/html/core.js`, `out/html/jquery-1.11.1.min.js` (copied from `node_modules`). See `.gitignore`.
- CI additionally copies `out/game.json` → `out/html/` before deploy.

### 1.2 The static shell (committed, hand-maintained — NOT generated)
Tracked under `out/html/`:
```
index.html      game.js      game.css
d3.v7.min.js    d3-parliament.js    d3-linegraph.js
favicon.ico     img/         music/
```
- `game.js` (~11 KB) is the author's **custom UI glue** (`main = function(dendryUI){…}`), not compiled content.
- `index.html` references the generated `core.js` **and** the committed `game.js`. It carries the human-visible title.
- **Open verification (do first):** confirm whether `make-html` overwrites `index.html`/`game.js` or preserves the committed shell. The gitignore pattern (ignores `core.js`, tracks `index.html`+`game.js`) strongly implies the shell is preserved — but confirm on a scratch build so we know whether title edits belong in a template or in the committed file.

### 1.3 Where the project identity lives (rename surface)
| # | File | String(s) carrying old identity |
|---|---|---|
| 1 | `package.json` | `name: social_democracy_alternate_history`; `repository.url`, `bugs.url`, `homepage` → `originn0/dynamic_social_democracy`; `author`, `description` |
| 2 | `source/info.dry` | `title: Social Democracy: An Alternate History`; `author`; **`ifid`** (must be regenerated — see §4.3) |
| 3 | `out/html/index.html` | `<title>Dynamic Social Democracy</title>`; `<h1 id="game-title">Dynamic Social Democracy: An Alternate History</h1>`; `ifiction:ifid` meta |
| 4 | `source/scenes/root.scene.dry` | start-menu heading `= Social Democracy: An Alternate History`; `@modinfo` "Last Updated" date labels |
| 5 | `source/scenes/modinfo.scene.dry` | full mod-info prose (`= Dynamic Social Democracy`, description, FAQ, paths, changelog, discord, credits) |
| 6 | `README.md`, `LICENSE`, `credits_images.txt`, `credits_music.txt`, `changes.txt` | project name, attribution, changelog history |

### 1.4 Asset referencing
- Images: referenced as **`img/…`** via `card-image:` (113 uses) and inline `<img>`/`background` HTML inside scene prose. Assets live directly at `out/html/img/**` (subdirs: `img/` root, `img/achievement/`, `img/portraits/`).
- Audio: referenced as **`music/…`** via the `audio:` directive, two forms:
  - `audio: music/1930_1933/anthem.mp3`
  - `audio: shuffle music/a.mp3 music/b.mp3` (playlist)
  - Subdirs today: `music/{1928_1930,1928_1933,1930_1933,communist}`.
- **No separate asset-source directory** — assets are committed into the served root (`out/html/`). The build does not copy them from elsewhere.
- **Reusable Spanish asset already present:** `music/communist/A_las_barricadas.ogg` and `music/communist/workers_of_vienna_normalized.mp3`.

---

## 2. Deliverable 1 — Build & Smoke-Test Recipe

### 2.1 Local build loop
```bash
# one-time
npm install            # installs dendrynexus from GitHub + parliament-svg

# each build
npm run dendrynexus make-html -- --pretty   # source/ -> out/game.json + out/html/core.js
cp out/game.json out/html/                   # mirror CI step so local == deployed

# serve for manual play-test (any static server; engine is client-side)
npx http-server out/html -p 8080   # or: python3 -m http.server 8080 -d out/html
```
Add convenience scripts to `package.json`:
```json
"scripts": {
  "dendrynexus": "dendrynexus",
  "build": "dendrynexus make-html -- --pretty && cp out/game.json out/html/",
  "serve": "http-server out/html -p 8080",
  "smoke": "node scripts/smoke.js"
}
```

### 2.2 Smoke test (define a real gate, not "it built")
A build "succeeds" only if the compiled `out/game.json` is coherent and the start path is reachable. `scripts/smoke.js` should assert, at minimum:
1. `make-html` exit code 0 and `out/game.json` exists and is valid JSON.
2. `game.json` contains a `root` scene and the scenes referenced by `root.start` resolve (no dangling `go-to`/`@` targets among the compiled scene ids).
3. Metadata sanity: title/ifid in `game.json` match `source/info.dry` (guards against a stale build).
4. (Once §3 rename lands) grep the built `out/html/index.html` + `game.json` for banned legacy identity strings ("An Alternate History", old repo slug) and fail if present.

This makes the smoke test double as a **rename regression guard** and a **broken-link guard** — the two failure modes most likely during a large conversion. Keep it dependency-light (Node built-ins only) so CI needs no extra install.

### 2.3 Verification tasks (resolve the §1.2 unknown first)
- Do a throwaway `make-html` on a clean checkout; diff `out/html/index.html` and `out/html/game.js` before/after. If unchanged → shell is authoritative, edit it directly. If regenerated → locate dendrynexus' HTML template and move identity edits there. Record the answer in this doc.

---

## 3. Deliverable 2 — CI Recipe (standalone repo)

Adapt `.github/workflows/build.yaml`. Current workflow: on push to `main`, Node 16, `npm install`, build, copy `game.json`, deploy to Pages.

Planned changes:
1. **Node version:** bump `16` → an actively-supported LTS (20) unless a scratch build proves dendrynexus/parliament-svg pin Node 16. Verify before changing; note the result here.
2. **Build parity:** replace the inline build+copy steps with `npm run build` (§2.1) so local and CI are identical.
3. **Add the smoke gate:** run `npm run smoke` after build, before the Pages upload — CI must fail on a broken/renamed-wrong build, not silently deploy it.
4. **Branch model:** deploy trigger stays `push: branches: ["main"]`. Development happens on the feature branch per repo policy; `main` deploys. Add a **build-only (no-deploy) job** triggered on `pull_request` / feature-branch pushes so scaffolding is validated before it reaches `main`. (Pages deploy stays `main`-only to avoid clobbering the live URL.)
5. **New standalone repo hygiene:** confirm Pages is enabled and `homepage` in `package.json` points at the new Pages URL (§4).

---

## 4. Deliverable 3 — Naming Conventions & Rename Map

### 4.1 Canonical names (proposal — confirm before executing)
| Field | Value |
|---|---|
| Display title | **Social Democracy: The Spanish Republic** |
| Short title (tab/`<title>`) | **Spanish Republic** |
| Package id (`package.json` `name`) | `social_democracy_spanish_republic` |
| Repo slug | `<owner>/social-democracy-spanish-republic` |
| Internal codename (dirs/branches/docs) | `srep` (short, greppable, unambiguous vs. `sd`) |

> These are proposals so the plan is executable; a one-time confirmation of the exact public name is the only human decision blocking this area.

### 4.2 Rename map (exact edits, by file — from §1.3)
Execute as a single reviewable commit. **Do not** blind global-replace across the whole tree — scene prose that says "Social Democracy" as a political term must survive; only identity/metadata strings change.
1. `package.json`: `name`, `description`, `author` (credit original + conversion author), `repository.url`, `bugs.url`, `homepage`, and add the `scripts` from §2.1.
2. `source/info.dry`: `title`, `author`, `ifid` (regenerate — §4.3).
3. `out/html/index.html`: `<title>`, `#game-title` `<h1>`, `ifiction:ifid` meta (match new `info.dry`).
4. `source/scenes/root.scene.dry`: start-menu heading; leave `@modinfo` label plumbing, update its text in step 5.
5. `source/scenes/modinfo.scene.dry`: rewrite mod-info to describe the Spanish conversion (short, since full flavor is Area L); fix Discord/source links.
6. `README.md`: new title, build instructions (point at §2.1), standalone-not-a-mod note.
7. `LICENSE` / credits: **preserve upstream attribution** to Autumn Chen (original) and the Dynamic Social Democracy authors; add conversion authorship. This is an MIT-licensed derivative — attribution is a license obligation, not optional.
8. `changes.txt`: start a fresh changelog section for the conversion; keep prior history for provenance.

### 4.3 IFID handling (don't copy it)
The `ifid` (`7FCDF039-…`) uniquely identifies the *original* work in the IF archive. A standalone derivative needs a **new UUID** in both `source/info.dry` and the `index.html` `ifiction:ifid` meta. Generate once (`uuidgen`), record it here, keep the two in sync (the §2.2 smoke test checks this).

### 4.4 Conventions to carry forward (so later areas stay consistent)
- **Quality/variable names:** the `snake_case` `Q.*` convention (root.scene.dry) stays. New Spanish variables follow it (`cnt_strength`, `catalan_autonomy`). Documented in Area B, referenced here so scaffolding doesn't invent a competing style.
- **Scene ids / filenames:** keep the existing `foo.scene.dry` / `foo.qdisplay.dry` pattern and lowercase-underscore ids.
- **No model-identifier / internal tokens** in committed files (per repo policy).

---

## 5. Asset-Path Strategy

### 5.1 Layout decision
Keep the **existing convention**: assets committed under `out/html/{img,music}` and referenced by relative `img/…` / `music/…` paths. Rationale: it's what the engine + 113 `card-image:` refs + `audio:` refs already expect; changing it would ripple into every scene for zero benefit. Standalone build gives us a clean `out/html/` to curate.

### 5.2 Namespacing & period folders
- **Images:** keep `img/` (root), `img/portraits/`, `img/achievement/`. Introduce Spanish-content subfolders to avoid mixing eras during the long asset swap: `img/es/` (or per-topic `img/parties/`, `img/leaders/`, `img/events/`). Decide one scheme in this area and document it so Areas E/H/I/K file assets consistently.
- **Music:** current folders are era-named (`1928_1930`…). Re-key to the Spanish timeline: `music/1931_1933/`, `music/1933_1936/`, `music/anarchist/`, `music/republican/`. Keep `music/communist/` (reuse `A_las_barricadas`, `workers_of_vienna`).

### 5.3 Placeholder policy (unblock content before real assets exist)
- Ship a single committed **`img/placeholder.jpg`** (already exists in repo) as the default `card-image` for scaffolding and any not-yet-arted scene, so builds are never broken by a missing image.
- Add a smoke-test check (optional, §2.2 extension): warn on `card-image:`/`audio:` paths that don't resolve to a file under `out/html/`, so broken asset links surface at build time, not at play time.

### 5.4 Legacy-asset disposition
- **Do not** delete the German image/music set in this area. Content that still references them isn't rewritten until Areas H/K; deleting now would break the build. Track the German→Spanish asset swap in Area K. This area only: (a) creates the new folder structure, (b) adds placeholders, (c) documents the convention.

### 5.5 Credits / licensing scaffolding
- Preserve `credits_images.txt` / `credits_music.txt` structure. Add a **"Spanish Republic conversion — assets"** section at the top for new attributions, with columns: file, source, license, attribution/URL.
- Establish the rule now (enforced in Area K): **no asset lands in `out/html/` without a corresponding credits line** stating a license that permits redistribution. Flag this as human-review-gated; scaffolding must not fabricate provenance.

---

## 6. Task Checklist (ordered, each a discrete Claude Code task)

1. **Verify shell regeneration** (§2.3): scratch `make-html`, diff `index.html`/`game.js`; record whether the shell is authoritative or templated. *(blocks 3, 6)*
2. **Verify toolchain pins** (§3.1): confirm min Node version for dendrynexus/parliament-svg. *(blocks 5)*
3. **Add build/serve/smoke scripts** to `package.json` (§2.1).
4. **Write `scripts/smoke.js`** (§2.2): build-coherence + link + metadata + banned-string checks.
5. **Adapt CI** (§3): parity build, add smoke gate, add build-only PR job, keep `main`-only deploy.
6. **Execute the rename map** (§4.2) in one commit, incl. new IFID (§4.3) and `package.json` scripts/urls.
7. **Create asset folder structure + placeholders + credits sections** (§5). No legacy deletion.
8. **Full green run:** `npm install && npm run build && npm run smoke && npm run serve`, manually load the start menu, confirm new identity end-to-end. Update this doc's verification blanks (§1.2, §3.1, §4.3) with recorded answers.

**Suggested commit sequence:** (1–2 verification, no commit) → 3–4 tooling → 5 CI → 6 rename → 7 assets → 8 validation. Small, reviewable commits; each keeps the build green.

---

## 7. Acceptance Criteria

- [ ] `npm install` succeeds on the CI Node version from a clean checkout.
- [ ] `npm run build` produces `out/game.json` + `out/html/core.js` with zero errors.
- [ ] `npm run smoke` passes: valid `game.json`, reachable `root.start`, no dangling scene targets, ifid consistency, no banned legacy identity strings in shell/metadata.
- [ ] Served build shows the new title (`<title>`, `#game-title`), start-menu heading, and mod-info text.
- [ ] CI: feature-branch/PR push runs build+smoke (no deploy); `main` push builds, smokes, and deploys to the new Pages URL.
- [ ] New IFID present and consistent across `info.dry` + `index.html`; upstream attribution preserved in LICENSE/credits.
- [ ] Asset folder scheme + placeholder + credits sections exist and are documented; no legacy asset deleted; build has no broken `card-image:`/`audio:` refs introduced by scaffolding.

---

## 8. Risks & Open Questions (Area A-specific)

- **Shell regeneration unknown (§1.2/§2.3):** if `make-html` *does* overwrite `index.html`, identity edits must move into the engine's HTML template; resolve in task 1 before task 6.
- **Toolchain drift:** dendrynexus is an unpinned GitHub dependency; a Node bump could break it. Verify (task 2) before changing CI Node; if fragile, pin the dendrynexus commit in `package.json` for reproducibility.
- **Over-eager rename:** global find/replace would corrupt scene prose using "social democracy" as a political term. Rename map (§4.2) is deliberately file-scoped — enforce that.
- **Attribution obligation:** MIT derivative — dropping upstream credit is a license violation, not a style choice. Preserve it (§4.2 step 7).
- **Decision to confirm (only human blocker):** the canonical public name/package id/repo slug (§4.1). Everything else in Area A is executable without further input.
