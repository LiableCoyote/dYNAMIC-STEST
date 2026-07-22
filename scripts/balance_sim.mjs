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
function onDepartureCode(id) {
  const sc = S[id];
  if (!sc || !sc.onDeparture) return '';
  return sc.onDeparture.map((x) => x.$code || '').join('\n');
}
function runOnDeparture(Q, id) {
  const code = onDepartureCode(id);
  if (!code.trim()) return;
  try { new Function('Q', code)(Q); }
  catch (e) { if (process.env.SIM_DEBUG) console.error(`onDeparture ${id}: ${e.message}`); }
}

// Run the full live election pipeline the way the game does: election_1928's
// on-arrival (which now seeds the historical bloc config, M-2) -> election_algorithm
// (class->party vote math + CNT abstention) -> post_election_1928's on-arrival (the
// bloc-list seat adjustment) -> election_1928's on-departure (advance the calendar).
// Returns the final per-party seat shares (<party>_r).
const PARTIES = ['psoe', 'pce', 'ceda', 'izq_rep', 'radical', 'monarchist', 'falange', 'other'];
function runElection(Q) {
  // post_election_1928's dead German block has leftover console.log/console.error
  // debug prints (z_minus_bvp_votes, etc.) -- silence them so the dashboard stays
  // readable. They are harmless (dead code operating on excised German vars).
  const log = console.log, err = console.error;
  if (!process.env.SIM_DEBUG) { console.log = () => {}; console.error = () => {}; }
  runOnArrival(Q, 'election_1928');
  runOnArrival(Q, 'election_algorithm');
  runOnArrival(Q, 'election_1928.post_election_1928');
  console.log = log; console.error = err;
  const r = {}; for (const p of PARTIES) r[p] = Math.round((Q[p + '_r'] || 0) * 10) / 10;
  r.year = Q.year;
  r.repsoc = Math.round((r.psoe + r.izq_rep + r.radical) * 10) / 10;
  r.radceda = Math.round((r.radical + r.ceda) * 10) / 10;
  r.popfront = Math.round((r.psoe + r.pce + r.izq_rep) * 10) / 10;
  r.natbloc = Math.round((r.ceda + r.monarchist + r.falange) * 10) / 10;
  runOnDeparture(Q, 'election_1928');
  return r;
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
      // the Caballerista line (Area O): steer party_line toward revolution
      if ((Q.party_line || 0) < 80) Q.party_line = (Q.party_line || 0) + 1.5;
      // a working-class electoral strategy: campaign among workers + unemployed
      // (real card onArrivals -> moves the class->party matrix that feeds elections)
      if (month % 6 === 0) { runOnArrival(Q, 'campaigning.workers'); runOnArrival(Q, 'campaigning.unemployed'); }
    },
  },
  // Reformist moderate: defends the Republic, keeps the army as loyal as it can,
  // works with the Republican left, avoids provoking the CNT.
  moderate: {
    monthly(Q, month) {
      if (Q.army_loyalty < 0.5) Q.army_loyalty += 0.004;
      if (month % 3 === 0) { Q.izq_rep_relation = (Q.izq_rep_relation || 0) + 2; Q.pro_republic = (Q.pro_republic || 0) + 1; }
      Q.ugt_militia_strength += 8;
      // the Prietista line (Area O): steer party_line toward reform
      if ((Q.party_line || 0) > 15) Q.party_line = (Q.party_line || 0) - 1;
      // adopt the UGT public-works plan early (via the labor-economist advisor path)
      if (month === 2) { Q.wtb_adopted = 1; Q.economic_plan = 1; }
      // a broadening electoral strategy: campaign among the urban middle class and
      // smallholders (the Prietista appeal beyond the industrial base)
      if (month % 6 === 0) { runOnArrival(Q, 'campaigning.new_middle'); runOnArrival(Q, 'campaigning.old_middle'); }
      // Prieto's public-works program: the reformist economic lever (real card;
      // funds hydraulic/infrastructure works -> falling unemployment)
      if (month % 5 === 0 && (Q.budget || 0) >= 2) runOnArrival(Q, 'economic_policy.public_works');
    },
  },
  // Defensive/loyalist: the deliberate coup-averting counter-play. Keeps the army
  // funded and loyal, bans and persecutes the Falangist/Carlist militias to shave
  // the coup clock, works against the conspiracy, and keeps the CNT on-side. This
  // is the hard alternate-history line -- can sustained counter-play hold
  // coup_progress below the trigger?
  defensive: {
    monthly(Q, month) {
      Q.ugt_militia_strength += 12;
      if ((Q.anarchist_militancy || 0) > 0.1) Q.anarchist_militancy -= 0.02; // keep CNT calm
      Q.anarchist_electoral_stance = 1;
      if ((Q.party_line || 0) > 20) Q.party_line = (Q.party_line || 0) - 1; // institutional/reformist
      if (month % 2 === 0) {
        runOnArrival(Q, 'military_policy.increase_funding');       // army_loyalty +0.07
        runOnArrival(Q, 'dealing_with_toleration.conspiracy_success'); // loyalty +0.05, coup -2
      }
      if (month % 3 === 0) {
        runOnArrival(Q, 'domestic_enemies.persecute_falange');    // coup -2 if >=4
        runOnArrival(Q, 'domestic_enemies.persecute_requetes');   // coup -1 if >=4
      }
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
  // Area N mid-game flavor events (date-gated, max-visits 1) -- fired the same way
  // so the harness accounts for any state/coup nudges they add.
  'convent_burnings_1931', 'constitution_1931',
  'catalan_statute_1932', 'agrarian_reform_law_1932',
  'falange_founding_1933', 'womens_vote_1933',
  'catalan_revolt_1934', 'october_repression_1934',
  'straperlo_1935', 'prieto_caballero_rift', 'azana_presidency_1936',
  // second batch
  'jesuits_dissolved_1932', 'misiones_pedagogicas', 'ceda_founded_1933',
  'ceda_enters_government_1934', 'franco_chief_of_staff_1935',
  'popular_front_pact_1936', 'prisoner_amnesty_1936', 'land_seizures_1936',
];
// The historical coalition arc sets the in_* flags that gate the 1934/1936
// escalation events. In live play coalition_formation is reached via go-to
// immediately after post_election_1928 -- crucially, post_election_1928's dead
// German "reset government" block (election_1928.scene.dry:1180) zeroes the live
// Spanish in_popular_front / in_emergency_government / in_minority_government
// flags, and coalition_formation re-sets them in the same interaction. So the
// harness must fire the coalition transition RIGHT AFTER each election, not on a
// separate date, or the reset sticks and gates out spring_1936_breakdown /
// calvo_sotelo_assassination. Keyed by the election year that just resolved; the
// 1936 choice is the Prieto/Caballero split (both set in_popular_front=1).
function postElectionCoalition(profileName, electionYear) {
  if (electionYear <= 1931) return 'coalition_formation.rs_1931_confirm';
  if (electionYear <= 1933) return 'coalition_formation.radical_ceda_accept';
  return profileName === 'revolutionary'
    ? 'coalition_formation.pf_tolerate'   // Caballerista: confidence-and-supply
    : 'coalition_formation.pf_join';      // Prietista: join the cabinet
}

function simulate(profileName, difficultyName) {
  const Q = {};
  runOnArrival(Q, 'root.start');
  if (DIFFICULTY[difficultyName]) runOnArrival(Q, DIFFICULTY[difficultyName]);
  // root.start sets year=1931, month=4. Ensure calendar baseline.
  Q.year = 1931; Q.month = 4;
  const profile = PROFILES[profileName];
  const visited = new Set();
  const snapshots = [];
  const elections = [];

  // step months April 1931 (t=0) through July 1936
  for (let t = 0; t < 64; t++) {
    const total = (1931 * 12 + 3) + t; // months since year 0, starting Apr 1931
    Q.year = Math.floor(total / 12);
    Q.month = (total % 12) + 1;
    Q.time = t + 1;

    // 1. yearly economic/faction tick (once per year, at its January-ish window)
    for (const y of YEARLY) {
      if (Q.year === Number(y) && !visited.has('yr' + y) && viewIf(Q, y)) {
        runOnArrival(Q, y); visited.add('yr' + y);
      }
    }
    // 2. scheduled Cortes election (1931 / 1933 / 1936), then -- as live play does
    //    via post_election_1928's go-to -- the coalition-formation transition,
    //    which re-sets the in_* flags the escalation events gate on.
    if (viewIf(Q, 'election_1928') && (Q.next_election_year || 0) < 9999) {
      const electionYear = Q.next_election_year;
      elections.push(runElection(Q));
      runOnArrival(Q, postElectionCoalition(profileName, electionYear));
    }
    // 3. date-gated escalation events (max-visits 1) -- checked after the election
    //    so they see the freshly-formed coalition's flags this month.
    for (const ev of ESCALATION) {
      if (!visited.has(ev) && viewIf(Q, ev)) { runOnArrival(Q, ev); visited.add(ev); }
    }
    // 4. strategy profile's monthly actions
    profile.monthly(Q, t);

    // snapshot at each July (year boundary marker) for the dashboard
    if (Q.month === 7) snapshots.push(snapshot(Q));

    // 5. coup trigger check (July 1936)
    if (Q.year === 1936 && Q.month >= 7 && ((Q.coup_progress || 0) >= 10 || (Q.army_loyalty || 0) <= 0.1)) {
      Q.army_choices = 3; // simulate the player having tried approaches
      runOnArrival(Q, 'july_1936_coup.resolve');
      break;
    }
  }
  // if we reached July 1936 without triggering, it's the coup-averted ending
  // (Area O: La República Consolidada if de-polarized, else an uneasy survival).
  const ending = Q.workers_revolution ? 'workers_revolution'
    : Q.legal_coup ? 'legal_coup'
    : Q.republic_victory ? 'republic_victory'
    : Q.long_war ? 'long_war'
    : Q.total_defeat ? 'total_defeat'
    : 'coup_averted';
  return { Q, ending, snapshots, elections };
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

function winner(e) {
  const cands = { 'Republican-Socialist': e.repsoc, 'Radical-CEDA': e.radceda, 'Popular Front': e.popfront, 'National Bloc': e.natbloc };
  return Object.entries(cands).sort((a, b) => b[1] - a[1])[0];
}
function reportElections(elections) {
  if (!elections.length) { console.log('elections: (none fired)'); return; }
  for (const e of elections) {
    const [wname, wval] = winner(e);
    console.log(`  ${e.year} election: PSOE ${e.psoe} PCE ${e.pce} CEDA ${e.ceda} IR ${e.izq_rep} PRR ${e.radical} Mon ${e.monarchist} Fal ${e.falange} | blocs RepSoc ${e.repsoc} RadCeda ${e.radceda} PopFront ${e.popfront} NatBloc ${e.natbloc}  => ${wname} (${wval})`);
  }
}

function report(profileName, difficultyName, { Q, ending, snapshots, elections }, verbose) {
  console.log(`\n=== ${profileName} / ${difficultyName} -> ENDING: ${ending.toUpperCase()} ===`);
  reportElections(elections);
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
