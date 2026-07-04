#!/usr/bin/env node
/*
 * Wrapper around `dendrynexus make-html`.
 *
 * dendrynexus prints "Error: ..." lines to stderr on scene parse failures
 * (e.g. a bad go-to target, invalid property syntax) but still exits 0 --
 * `npm run build && npm run smoke` would then happily copy a stale or
 * partially-broken game.json and report success. This wrapper fails the
 * build (non-zero exit, no copy) whenever an "Error:" line appears in the
 * compiler's output, regardless of its own exit code.
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const result = spawnSync('npx', ['dendrynexus', 'make-html', '--pretty'], {
  cwd: ROOT,
  encoding: 'utf8',
});

const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');

const errorLines = combined.split('\n').filter((l) => /(^|\s)Error:/.test(l));

if (result.status !== 0) {
  console.error(`\nBUILD FAILED: dendrynexus exited with code ${result.status}`);
  process.exit(result.status || 1);
}

if (errorLines.length > 0) {
  console.error(`\nBUILD FAILED: dendrynexus reported ${errorLines.length} error(s) despite exiting 0:`);
  for (const line of errorLines) console.error(`  ${line.trim()}`);
  process.exit(1);
}

// Only mirror game.json into the served directory once the compile is clean.
fs.copyFileSync(path.join(ROOT, 'out', 'game.json'), path.join(ROOT, 'out', 'html', 'game.json'));
console.log('\nBUILD OK (no errors, game.json copied to out/html/)');
