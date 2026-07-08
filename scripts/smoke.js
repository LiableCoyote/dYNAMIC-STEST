#!/usr/bin/env node
/*
 * Smoke test for Social Democracy: The Spanish Republic.
 *
 * A build "passes" only if the compiled game is coherent and the project's
 * identity has been renamed cleanly. This doubles as a rename-regression guard
 * and a broken-scene-link guard -- the two failure modes most likely during the
 * conversion. Node built-ins only (no extra install needed in CI).
 *
 * Run AFTER a build:  npm run build && npm run smoke
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME_JSON = path.join(ROOT, 'out', 'game.json');
const INFO_DRY = path.join(ROOT, 'source', 'info.dry');
const INDEX_HTML = path.join(ROOT, 'out', 'html', 'index.html');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const OUT_HTML = path.join(ROOT, 'out', 'html');
const IMG_ES = path.join(OUT_HTML, 'img', 'es');
const CREDITS_IMAGES = path.join(OUT_HTML, 'credits_images.txt');

const NEW_IFID = '76CDC709-E6BD-46FA-BA29-41E607DBD81A';
const NEW_TITLE = 'Social Democracy: The Spanish Republic';

// Legacy identity strings that must NOT survive, scoped per-file.
// Note: the old title/slug may legitimately appear as *attribution* to the
// parent work (e.g. package.json "description", README), so the old title
// phrase is banned only in title positions, not everywhere. Scene prose still
// legitimately contains Weimar terms until content areas (H/L) are done.
const ID_TOKENS = [ // hard identity -- wrong in any shell/metadata file
  { label: 'old IFID', pattern: /7FCDF039-2B77-4179-B795-CBAFA65253AA/ },
  { label: 'old package name', pattern: /social_democracy_alternate_history/ },
];
const TITLE_PHRASE = { label: 'old title "An Alternate History"', pattern: /An Alternate History/ };
const OLD_SLUG = { label: 'old repo slug', pattern: /originn0\/dynamic_social_democracy/ };

const failures = [];
const notes = [];

function fail(msg) { failures.push(msg); }
function ok(msg) { notes.push(msg); }

function readOrFail(file, label) {
  if (!fs.existsSync(file)) {
    fail(`${label} missing: ${path.relative(ROOT, file)} (did the build run?)`);
    return null;
  }
  return fs.readFileSync(file, 'utf8');
}

// 1. Build produced a valid game.json ------------------------------------
let game = null;
const gameRaw = readOrFail(GAME_JSON, 'compiled game.json');
if (gameRaw) {
  try {
    game = JSON.parse(gameRaw);
    ok('game.json is valid JSON');
  } catch (e) {
    fail(`game.json is not valid JSON: ${e.message}`);
  }
}

// 2. Core scenes exist and go-to / start targets resolve -----------------
if (game && game.scenes) {
  const ids = new Set(Object.keys(game.scenes));
  if (!ids.has('root')) fail('no "root" scene in game.json');
  if (!ids.has('root.start') && !ids.has('start')) {
    fail('neither "root.start" nor "start" scene found (start path unreachable?)');
  } else {
    ok('root/start scenes present');
  }

  // Check that every go-to target references a known scene id.
  // go-to values look like: "sceneId if cond; otherId" -- extract bare ids.
  let dangling = 0;
  const sample = [];
  for (const [id, scene] of Object.entries(game.scenes)) {
    const goTo = scene.goTo || scene.goto;
    if (!Array.isArray(goTo)) continue;
    for (const clause of goTo) {
      const target = clause && (clause.id || clause.target);
      if (!target) continue;
      // relative ids (starting with '.') resolve against the scene; skip those.
      if (target.startsWith('.')) continue;
      if (!ids.has(target)) {
        dangling++;
        if (sample.length < 10) sample.push(`${id} -> ${target}`);
      }
    }
  }
  if (dangling > 0) {
    fail(`${dangling} dangling go-to target(s). Examples:\n    ` + sample.join('\n    '));
  } else {
    ok(`no dangling go-to targets across ${ids.size} scenes`);
  }
} else if (game) {
  fail('game.json has no "scenes" map');
}

// 3. Metadata sanity: title/ifid match source ---------------------------
const info = readOrFail(INFO_DRY, 'source/info.dry');
if (info) {
  if (!info.includes(`ifid: ${NEW_IFID}`)) fail(`source/info.dry ifid is not the new IFID (${NEW_IFID})`);
  if (!info.includes(`title: ${NEW_TITLE}`)) fail(`source/info.dry title is not "${NEW_TITLE}"`);
  else ok('info.dry title/ifid correct');
}
if (game && game.title && !String(game.title).includes('Spanish Republic')) {
  fail(`compiled game title is "${game.title}" -- stale build? expected the new title`);
}

// 4. Rename regression: banned legacy strings in shell/metadata ----------
// Hard identity tokens must not appear in any renamed file.
const shellFiles = [
  ['out/html/index.html', INDEX_HTML],
  ['package.json', PACKAGE_JSON],
  ['source/info.dry', INFO_DRY],
];
for (const [label, file] of shellFiles) {
  const content = readOrFail(file, label);
  if (!content) continue;
  for (const { label: bl, pattern } of ID_TOKENS) {
    if (pattern.test(content)) fail(`${label} still contains ${bl}`);
  }
}
// The old title phrase must not appear in title positions (index.html/info.dry);
// it MAY appear as attribution in package.json description / README.
for (const [label, file] of [['out/html/index.html', INDEX_HTML], ['source/info.dry', INFO_DRY]]) {
  const content = readOrFail(file, label);
  if (content && TITLE_PHRASE.pattern.test(content)) fail(`${label} still contains ${TITLE_PHRASE.label}`);
}
// The old repo slug must not be the project's own URLs.
{
  const pkg = readOrFail(PACKAGE_JSON, 'package.json');
  if (pkg && OLD_SLUG.pattern.test(pkg)) fail(`package.json still points at ${OLD_SLUG.label}`);
}
const idx = readOrFail(INDEX_HTML, 'index.html');
if (idx) {
  if (!idx.includes(NEW_IFID)) fail('index.html does not carry the new IFID meta');
  if (!idx.includes(NEW_TITLE)) fail('index.html <title>/#game-title not updated to the new title');
  else ok('index.html identity updated');
}

// 5. Area B state-schema guard (source-level; runtime Q.* aren't in game.json) ----
// The electoral schema is authored in root.scene.dry's @start on-arrival block.
const ROOT_DRY = path.join(ROOT, 'source', 'scenes', 'root.scene.dry');
const root = readOrFail(ROOT_DRY, 'source/scenes/root.scene.dry');
if (root) {
  // New Spanish party/class arrays must be present...
  const needsPresent = [
    ["Q.parties = ['psoe', 'pce', 'ceda', 'izq_rep', 'radical', 'monarchist', 'falange', 'other']", 'Spanish parties array'],
    ["Q.classes = ['industrial', 'landless', 'smallholder', 'urban_middle', 'unemployed', 'catholic']", 'Spanish classes array'],
    ['Q.anarchist_strength', 'anarchist axis'],
    ['Q.army_loyalty', 'army_loyalty axis'],
    ['Q.catalan_autonomy', 'regional-autonomy axis'],
    ['Q.year = 1931', '1931 start date'],
  ];
  for (const [needle, label] of needsPresent) {
    if (!root.includes(needle)) fail(`root.scene.dry missing ${label}`);
  }
  // ...and the old Weimar electoral array literals must be gone.
  const banned = [
    ["['spd', 'kpd', 'z', 'ddp', 'dvp', 'dnvp', 'nsdap', 'other']", 'legacy Weimar parties array'],
    ["['workers', 'old_middle', 'new_middle', 'rural', 'unemployed', 'catholics']", 'legacy Weimar classes array'],
  ];
  for (const [needle, label] of banned) {
    if (root.includes(needle)) fail(`root.scene.dry still contains ${label}`);
  }
  if (failures.length === 0 || !failures.some(f => f.includes('root.scene.dry'))) ok('root.scene.dry Spanish electoral schema present');
}

// 6. Area K broken-image-path guard (compiled cardImage/setBg must resolve) ----
// A repointed card whose target file was never downloaded is a silent, only-
// visible-in-the-browser failure -- catch it at build time instead.
if (game && game.scenes) {
  let brokenImages = 0;
  const brokenSample = [];
  const resolvedCache = new Map();
  const resolves = (imgPath) => {
    if (resolvedCache.has(imgPath)) return resolvedCache.get(imgPath);
    const ok2 = fs.existsSync(path.join(OUT_HTML, imgPath));
    resolvedCache.set(imgPath, ok2);
    return ok2;
  };
  for (const [id, scene] of Object.entries(game.scenes)) {
    for (const field of ['cardImage', 'setBg']) {
      const imgPath = scene[field];
      if (typeof imgPath !== 'string' || !imgPath) continue;
      if (!resolves(imgPath)) {
        brokenImages++;
        if (brokenSample.length < 10) brokenSample.push(`${id}: ${field} -> ${imgPath}`);
      }
    }
  }
  if (brokenImages > 0) {
    fail(`${brokenImages} broken image path(s) (card-image/set-bg pointing at a nonexistent file). Examples:\n    ` + brokenSample.join('\n    '));
  } else {
    ok(`all compiled card-image/set-bg paths resolve to real files under out/html/`);
  }
}

// 7. Area K credits completeness (every img/es/ asset must be credited) ----
if (fs.existsSync(IMG_ES)) {
  const credits = fs.existsSync(CREDITS_IMAGES) ? fs.readFileSync(CREDITS_IMAGES, 'utf8') : '';
  let uncredited = 0;
  const uncreditedSample = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name === '.gitkeep' || entry.name === 'README.md') continue;
      const rel = path.relative(OUT_HTML, full).split(path.sep).join('/');
      if (!credits.includes(rel + ' |') && !credits.includes(rel + '|')) {
        uncredited++;
        if (uncreditedSample.length < 10) uncreditedSample.push(rel);
      }
    }
  };
  walk(IMG_ES);
  if (uncredited > 0) {
    fail(`${uncredited} img/es/ asset(s) with no credits_images.txt line (no provenance, no commit). Examples:\n    ` + uncreditedSample.join('\n    '));
  } else {
    ok('every img/es/ asset has a credits_images.txt provenance line');
  }
}

// ---- report ------------------------------------------------------------
for (const n of notes) console.log(`  ok  ${n}`);
if (failures.length) {
  console.error(`\nSMOKE FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  x  ${f}`);
  process.exit(1);
}
console.log(`\nSMOKE PASSED (${notes.length} checks)`);
