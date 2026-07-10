#!/usr/bin/env node
// Area M balance-simulation harness.
//
// Runs the game's REAL compiled logic (the $code fragments in out/game.json) —
// not a hand reimplementation — to measure balance. It initializes Q from
// root.start's on-arrival, applies a difficulty + strategy profile, steps the
// calendar April 1931 -> July 1936 firing every date-gated event whose viewIf
// is satisfied, resolves the July-1936 coup, and prints a balance dashboard.
//
// Usage:
//   node scripts/balance_sim.mjs [--profile=moderate|revolutionary|passive] [--difficulty=normal|easy|hard|dynamic] [--verbose]
//   node scripts/balance_sim.mjs --all      # every profile x difficulty, summary table
//
// This is tooling only — not wired into the build.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = JSON.parse(fs.readFileSync(path.join(REPO, 'out', 'game.json'), 'utf8'));
const S = game.scenes;

// --- run a scene's compiled $code against a Q object -----------------------
function onArrivalCode(id) {
  const sc = S[id];
  if (!sc || !sc.onArrival) return '';
  return sc.onArrival.map((x) => x.$code || '').join('\n');
}
function viewIfCode(id) {
  const sc = S[id];
  return sc && sc.viewIf ? (sc.viewIf.$code || 'return true;') : 'return true;';
}
function runOnArrival(Q, id) {
  const code = onArrivalCode(id);
  if (!code.trim()) return;
  try { new Function('Q', code)(Q); }
  catch (e) { if (process.env.SIM_DEBUG) console.error(`onArrival ${id}: ${e.message}`); }
}
function viewIf(Q, id) {
  try { return !!new Function('Q', viewIfCode(id))(Q); }
  catch (e) { return false; }
}

// --- difficulty start blocks (root.1928_*) ---------------------------------
const DIFFICULTY = {
  normal: 'root.1928_main',
  easy: 'root.1928_easy',
  hard: 'root.1928_hard',
  dynamic: 'root.1928_mod_mode',
};

// --- strategy profiles -----------------------------------------------------
// A profile decides, each month, which card on-arrivals fire (by scene id) and
// may nudge a few player-controlled inputs. Kept deliberately small: the point
// is to exercise the balance knobs, not replay Dendry's card-draw RNG.
const PROFILES = {
  // Revolutionary left: builds the UGT militia, antagonizes the CNT toward
  // abstention, cooperates with the PCE, does little to keep the army loyal.
  revolutionary: {
    monthly(Q, month) {
      Q.ugt_militia_strength += 25;
      if (Q.ugt_militia_militancy < 0.9) Q.ugt_militia_militancy += 0.012;
      // antagonize the CNT toward insurrection/abstention (trips casas_viejas)
      if ((Q.anarchist_militancy || 0) < 0.9) Q.anarchist_militancy = (Q.anarchist_militancy || 0) + 0.03;
      if (month % 4 === 0) Q.pce_relation = (Q.pce_relation || 0) + 2;
    },
  },
  // Reformist moderate: defends the Republic, keeps the army as loyal as it can,
  // works with the Republican left, avoids provoking the CNT.
  moderate: {
    monthly(Q, month) {
      if (Q.army_loyalty < 0.5) Q.army_loyalty += 0.004;
      if (month % 3 === 0) { Q.izq_rep_relation = (Q.izq_rep_relation || 0) + 2; Q.pro_republic = (Q.pro_republic || 0) + 1; }
      Q.ugt_militia_strength += 8;
    },
  },
  // Passive baseline: takes no actions; measures the raw drift + event clock.
  passive: { monthly() {} },
};

// --- the calendar loop -----------------------------------------------------
// Date-gated events fired by viewIf each month (respecting max-visits=1).
const YEARLY = ['1931', '1932', '1933', '1934', '1935', '1936'];
const ESCALATION = [
  'sanjurjada_1932', 'casas_viejas', 'asturias_rising',
  'popular_front_victory_shock', 'spring_1936_breakdown', 'calvo_sotelo_assassination',
];
// The historical coalition arc (republican-socialist -> radical-CEDA -> popular
// front) sets the in_* flags that gate the 1934/1936 escalation events. The
// escalation chain depends on this narrative path; the harness follows the
// historical timeline so the coup clock can be measured. Keyed by {year,month}.
const COALITION_TIMELINE = [
  { year: 1931, month: 4, scene: 'coalition_formation.rs_1931_confirm' },
  { year: 1933, month: 12, scene: 'coalition_formation.radical_ceda_accept' },
  { year: 1936, month: 2, scene: 'coalition_formation.pf_join' },
];

function simulate(profileName, difficultyName) {
  const Q = {};
  runOnArrival(Q, 'root.start');
  if (DIFFICULTY[difficultyName]) runOnArrival(Q, DIFFICULTY[difficultyName]);
  // root.start sets year=1931, month=4. Ensure calendar baseline.
  Q.year = 1931; Q.month = 4;
  const profile = PROFILES[profileName];
  const visited = new Set();
  const snapshots = [];

  // step months April 1931 (t=0) through July 1936
  for (let t = 0; t < 64; t++) {
    const total = (1931 * 12 + 3) + t; // months since year 0, starting Apr 1931
    Q.year = Math.floor(total / 12);
    Q.month = (total % 12) + 1;
    Q.time = t + 1;

    // 0. historical coalition transitions (unlock the escalation chain)
    for (const c of COALITION_TIMELINE) {
      if (Q.year === c.year && Q.month === c.month && !visited.has(c.scene)) {
        runOnArrival(Q, c.scene); visited.add(c.scene);
      }
    }
    // 1. yearly economic/faction tick (once per year, at its January-ish window)
    for (const y of YEARLY) {
      if (Q.year === Number(y) && !visited.has('yr' + y) && viewIf(Q, y)) {
        runOnArrival(Q, y); visited.add('yr' + y);
      }
    }
    // 2. date-gated escalation events (max-visits 1)
    for (const ev of ESCALATION) {
      if (!visited.has(ev) && viewIf(Q, ev)) { runOnArrival(Q, ev); visited.add(ev); }
    }
    // 3. strategy profile's monthly actions
    profile.monthly(Q, t);

    // snapshot at each July (year boundary marker) for the dashboard
    if (Q.month === 7) snapshots.push(snapshot(Q));

    // 4. coup trigger check (July 1936)
    if (Q.year === 1936 && Q.month >= 7 && ((Q.coup_progress || 0) >= 10 || (Q.army_loyalty || 0) <= 0.1)) {
      Q.army_choices = 3; // simulate the player having tried approaches
      runOnArrival(Q, 'july_1936_coup.resolve');
      break;
    }
  }
  // if we reached July 1936 without triggering, it's the coup-averted ending
  const ending = Q.republic_victory ? 'republic_victory'
    : Q.long_war ? 'long_war'
    : Q.total_defeat ? 'total_defeat'
    : 'coup_averted';
  return { Q, ending, snapshots };
}

function snapshot(Q) {
  const r = (k) => Math.round((Q[k] || 0) * 100) / 100;
  return {
    year: Q.year,
    coup_progress: r('coup_progress'), army_loyalty: r('army_loyalty'), africa_army: r('africa_army'),
    ugt: r('ugt_militia_strength'), anarchist_militancy: r('anarchist_militancy'),
    unemployed: r('unemployed'), budget: r('budget'), inflation: r('inflation'), growth: r('economic_growth'),
    left_s: r('left_strength'), center_s: r('center_strength'), labor_s: r('labor_strength'), reformist_s: r('reformist_strength'),
  };
}

function report(profileName, difficultyName, { Q, ending, snapshots }, verbose) {
  console.log(`\n=== ${profileName} / ${difficultyName} -> ENDING: ${ending.toUpperCase()} ===`);
  console.log(`coup_progress=${Math.round(Q.coup_progress||0)}  army_loyalty=${(Q.army_loyalty||0).toFixed(2)}  africa_army=${Math.round(Q.africa_army||0)}`);
  if (Q.total_power !== undefined)
    console.log(`coup forces: Republic ${Math.round(Q.total_power)} vs Rebels ${Math.round(Q.enemy_power)} (ratio ${(Q.total_power/Q.enemy_power).toFixed(2)})`);
  console.log(`economy: unemployed=${(Q.unemployed||0).toFixed(1)} budget=${Q.budget||0} inflation=${(Q.inflation||0).toFixed(1)} growth=${(Q.economic_growth||0).toFixed(1)}`);
  console.log(`factions (strength): left=${Math.round(Q.left_strength||0)} center=${Math.round(Q.center_strength||0)} labor=${Math.round(Q.labor_strength||0)} reformist=${Math.round(Q.reformist_strength||0)}`);
  // NaN guard
  const nanKeys = ['coup_progress','army_loyalty','africa_army','total_power','enemy_power','unemployed','left_strength']
    .filter((k) => Q[k] !== undefined && Number.isNaN(Number(Q[k])));
  if (nanKeys.length) console.log(`  !! NaN in: ${nanKeys.join(', ')}`);
  if (verbose) for (const s of snapshots) console.log('   ', JSON.stringify(s));
}

// --- CLI -------------------------------------------------------------------
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
if (args.includes('--all')) {
  console.log('profile        difficulty  ending           coup  loyalty  R-power  E-power');
  for (const p of Object.keys(PROFILES)) for (const d of Object.keys(DIFFICULTY)) {
    const res = simulate(p, d); const Q = res.Q;
    console.log(
      `${p.padEnd(14)} ${d.padEnd(10)} ${res.ending.padEnd(16)} ${String(Math.round(Q.coup_progress||0)).padStart(4)}  ${(Q.army_loyalty||0).toFixed(2).padStart(6)}  ${String(Math.round(Q.total_power||0)).padStart(7)}  ${String(Math.round(Q.enemy_power||0)).padStart(7)}`
    );
  }
} else {
  const profile = (args.find((a) => a.startsWith('--profile=')) || '--profile=moderate').split('=')[1];
  const difficulty = (args.find((a) => a.startsWith('--difficulty=')) || '--difficulty=normal').split('=')[1];
  report(profile, difficulty, simulate(profile, difficulty), verbose);
}
