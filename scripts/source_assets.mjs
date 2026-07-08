#!/usr/bin/env node
// Area K sourcing pipeline: resolves a named figure's lead portrait via the
// Spanish/English Wikipedia pageimages API, verifies its license via the Commons
// imageinfo API, and — only for redistributable licenses — downloads it and
// records real provenance to out/html/credits_images.txt.
//
// Usage:
//   node scripts/source_assets.mjs --manifest scripts/asset_manifest.json [--dry-run] [--only=slug1,slug2]
//
// The manifest is a JSON array of { slug, figure, target, category } entries.
// "target" is relative to out/html/, e.g. "img/es/leaders/besteiro.jpg".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Node's built-in fetch (undici) does NOT read HTTP_PROXY/HTTPS_PROXY env vars
// unless launched with --use-env-proxy (this repo's egress goes through a
// proxy — see CLAUDE.md's environment section). Re-exec once under that flag
// so `node scripts/source_assets.mjs ...` works without callers remembering it.
if (!process.env.__SOURCE_ASSETS_REEXECED) {
  const result = spawnSync(
    process.execPath,
    ['--use-env-proxy', '--no-warnings', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, __SOURCE_ASSETS_REEXECED: '1' } }
  );
  process.exit(result.status ?? 1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_HTML = path.join(REPO_ROOT, 'out', 'html');
const CREDITS_PATH = path.join(OUT_HTML, 'credits_images.txt');
const CREDITS_SECTION_HEADER = '## Spanish Republic conversion — assets';

const USER_AGENT = 'SocialDemocracySpanishRepublicConversion/1.0 (github.com/LiableCoyote/dYNAMIC-STEST; asset-sourcing script; contact via repo issues)';

// Licenses we accept for redistribution. Anything else is rejected — no credits
// line, no download. CC-BY-SA share-alike is accepted but flagged in the report
// for human review (it obligates downstream reuse terms).
const ACCEPTED_LICENSE_PATTERNS = [
  /^public domain$/i,
  /^pd[- ]/i,
  /^cc0/i,
  /^cc[- ]by([- ]4\.0|[- ]3\.0|[- ]2\.5|[- ]2\.0)?$/i,
  /^cc[- ]by[- ]sa/i,
  /^attribution/i,
];

function isAcceptedLicense(shortName) {
  if (!shortName) return false;
  return ACCEPTED_LICENSE_PATTERNS.some((re) => re.test(shortName.trim()));
}

function isShareAlike(shortName) {
  return /sa/i.test(shortName || '') && /cc/i.test(shortName || '');
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Resolves a figure name to a Commons file name via Wikipedia's pageimages API.
// Tries Spanish Wikipedia first (better coverage for Spanish historical figures),
// falls back to English.
async function resolveLeadImage(figureName) {
  for (const lang of ['es', 'en']) {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(figureName)}&prop=pageimages&piprop=original|name&redirects=1&format=json`;
    const data = await fetchJson(url);
    const pages = data?.query?.pages;
    if (!pages) continue;
    const page = Object.values(pages)[0];
    if (page && page.original && page.pageimage) {
      return { lang, fileName: page.pageimage, originalUrl: page.original.source };
    }
  }
  return null;
}

// Fetches Commons imageinfo/extmetadata for a file name (e.g. "Foo_Bar.jpg").
async function fetchImageInfo(fileName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
  const data = await fetchJson(url);
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const em = info.extmetadata || {};
  const strip = (v) => (v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    url: info.url,
    licenseShortName: em.LicenseShortName?.value || null,
    license: em.License?.value || null,
    artist: strip(em.Artist?.value),
    licenseUrl: em.LicenseUrl?.value || null,
    dateTimeOriginal: em.DateTimeOriginal?.value || null,
    descriptionUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
  };
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

function readManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

function ensureCreditsFile() {
  if (!fs.existsSync(CREDITS_PATH)) {
    fs.writeFileSync(CREDITS_PATH, '# Image credits\n\n');
  }
  let content = fs.readFileSync(CREDITS_PATH, 'utf8');
  if (!content.includes(CREDITS_SECTION_HEADER)) {
    content += `\n${CREDITS_SECTION_HEADER}\n\n`;
    content += 'file | source | license | attribution | accessed\n';
    content += '---- | ------ | ------- | ----------- | --------\n';
    fs.writeFileSync(CREDITS_PATH, content);
  }
}

function alreadyCredited(targetRel) {
  if (!fs.existsSync(CREDITS_PATH)) return false;
  const content = fs.readFileSync(CREDITS_PATH, 'utf8');
  return content.includes(targetRel + ' |') || content.includes(targetRel + '|');
}

function appendCredit({ targetRel, descriptionUrl, licenseShortName, artist, accessedDate }) {
  ensureCreditsFile();
  const line = `${targetRel} | ${descriptionUrl} | ${licenseShortName} | ${artist || 'see source'} | ${accessedDate}\n`;
  fs.appendFileSync(CREDITS_PATH, line);
}

async function processEntry(entry, { dryRun }) {
  const { slug, figure, target } = entry;
  const targetPath = path.join(OUT_HTML, target);
  const targetRel = target;

  if (fs.existsSync(targetPath) && alreadyCredited(targetRel)) {
    return { slug, figure, status: 'skip-exists' };
  }

  let lead;
  try {
    lead = await resolveLeadImage(figure);
  } catch (e) {
    return { slug, figure, status: 'error', detail: `resolve failed: ${e.message}` };
  }
  if (!lead) {
    return { slug, figure, status: 'no-image', detail: 'no lead image found on es/en Wikipedia' };
  }

  let info;
  try {
    info = await fetchImageInfo(lead.fileName);
  } catch (e) {
    return { slug, figure, status: 'error', detail: `imageinfo failed: ${e.message}` };
  }
  if (!info || !info.url) {
    return { slug, figure, status: 'no-metadata', detail: `File:${lead.fileName} has no imageinfo` };
  }
  if (!isAcceptedLicense(info.licenseShortName)) {
    return {
      slug, figure, status: 'rejected-license',
      detail: `File:${lead.fileName} license "${info.licenseShortName}" not redistributable`,
      candidateUrl: info.descriptionUrl,
    };
  }

  const result = {
    slug, figure, status: dryRun ? 'would-download' : 'downloaded',
    fileName: lead.fileName,
    wikiLang: lead.lang,
    license: info.licenseShortName,
    shareAlike: isShareAlike(info.licenseShortName),
    artist: info.artist,
    sourceUrl: info.descriptionUrl,
    downloadUrl: info.url,
    target: targetRel,
  };

  if (!dryRun) {
    try {
      const bytes = await downloadFile(info.url, targetPath);
      result.bytes = bytes;
      appendCredit({
        targetRel,
        descriptionUrl: info.descriptionUrl,
        licenseShortName: info.licenseShortName,
        artist: info.artist,
        accessedDate: new Date().toISOString().slice(0, 10),
      });
    } catch (e) {
      return { slug, figure, status: 'error', detail: `download failed: ${e.message}` };
    }
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const manifestArg = args.find((a) => a.startsWith('--manifest='));
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.split('=')[1].split(',')) : null;

  if (!manifestArg) {
    console.error('Usage: node scripts/source_assets.mjs --manifest=<path.json> [--dry-run] [--only=slug1,slug2]');
    process.exit(1);
  }
  const manifestPath = path.resolve(REPO_ROOT, manifestArg.split('=')[1]);
  const entries = readManifest(manifestPath).filter((e) => !only || only.has(e.slug));

  console.log(`Sourcing ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}${dryRun ? ' (DRY RUN — no downloads, no credits written)' : ''}...\n`);

  const results = [];
  for (const entry of entries) {
    process.stdout.write(`  ${entry.slug} (${entry.figure})... `);
    const r = await processEntry(entry, { dryRun });
    results.push(r);
    console.log(r.status + (r.detail ? ` — ${r.detail}` : '') + (r.license ? ` [${r.license}]` : ''));
    // Be a polite API citizen.
    await new Promise((res) => setTimeout(res, 200));
  }

  const byStatus = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  console.log('\nSummary:', JSON.stringify(byStatus, null, 2));

  const shareAlike = results.filter((r) => r.shareAlike);
  if (shareAlike.length) {
    console.log('\nCC BY-SA (share-alike) items — flag for human review:');
    for (const r of shareAlike) console.log(`  ${r.slug}: ${r.sourceUrl}`);
  }

  const needsAttention = results.filter((r) => ['no-image', 'no-metadata', 'rejected-license', 'error'].includes(r.status));
  if (needsAttention.length) {
    console.log('\nNeeds human sourcing (no redistributable image found):');
    for (const r of needsAttention) console.log(`  ${r.slug} (${r.figure}): ${r.status} — ${r.detail || ''}`);
  }

  // Write a machine-readable report alongside the manifest for K-2/K-3 review sheets.
  const reportPath = manifestPath.replace(/\.json$/, '.report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nReport written to ${path.relative(REPO_ROOT, reportPath)}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
