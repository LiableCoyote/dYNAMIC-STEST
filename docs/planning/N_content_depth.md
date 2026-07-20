# Area N — Content Depth: Mid-Game Event Corpus

> **Status.** ✅ **DONE** (two batches). The sparse middle years now have historical texture.
> Nineteen new date-gated events populate 1931–1936 alongside the existing coup-escalation chain,
> taking the `events/` corpus from 15 → 34 files. Every one is a pure-narrative beat (the proven
> `sanjurjada`/`casas_viejas` pattern) with reactive `[? if … ?]` prose and `on-arrival` effects on
> existing state axes only. **The M calibration is untouched:** the harness confirms the historical
> election arc and all four coup outcomes are unchanged, coup stays avertable, zero NaN.

## Scope

First live play flagged the mid-game as thin — of 15 event files, 6 were yearly ticks, 2 engine
scaffolding, and only ~7 were narrative beats, all in the July-1936 coup chain. This pass adds a
curated set of real Second-Republic events so 1931–1935 feel populated, the biggest lever for "feel,"
**without new mechanics/variables and without re-tuning the M election/coup numbers.**

**Design decision (execution note):** the plan floated player-choice branches, but every *existing*
event is choiceless narrative, and an event choice sub-scene with no continue-path is a dead-end the
compiler can't catch and headless testing can't click-verify. So all 11 are **choiceless**, with
agency living where it already does (the policy/party cards), and responsiveness delivered through
**reactive prose** keyed on player state (`church_relation`, `catalan_autonomy`, `land_reform`,
`left_strength` vs `reformist_strength`, `coup_progress`, `in_republican_socialist`). This is safer
and consistent with the corpus.

## Execution status

- **N-0 (recon + variable audit):** ✅ done. Confirmed the event pattern; audited all 26 target vars
  against `root.scene.dry` init (all present — no NaN risk); locked gates/priorities; baseline
  `BUILD OK` → `SMOKE PASSED` (8) + clean `balance_sim --all`.
- **N-1 (1931):** ✅ `convent_burnings_1931` (May 1931 anticlerical riots), `constitution_1931` (the
  Article 26/44 fight + the Alcalá-Zamora/Azaña crisis).
- **N-2 (1932):** ✅ `catalan_statute_1932` (the Statute of Núria), `agrarian_reform_law_1932`.
- **N-3 (1933):** ✅ `falange_founding_1933` (José Antonio; seeds the falangist militia),
  `womens_vote_1933` (the Campoamor/Kent franchise fight).
- **N-4 (1934–35):** ✅ `catalan_revolt_1934` (Companys' Catalan State, crushed),
  `october_repression_1934` (the ~30,000 prisoners; the Popular Front forged in jail),
  `straperlo_1935` (the Radicals' collapse), `prieto_caballero_rift` (the PSOE fracture).
- **N-5 (1936):** ✅ `azana_presidency_1936` (Azaña kicked upstairs as the crisis peaks).
- **N-6 (verify + deploy + docs):** ✅ this document; harness extended to fire all 11; headless clean;
  `main` fast-forwarded so it deploys live; `CLAUDE.md` updated.

## Event roster (gate → key effects)

| Event | Gate | Key state effects |
|---|---|---|
| `convent_burnings_1931` | 1931, May–Aug | church_relation−, clerical_conflict+, catholic_psoe−, coup+1 |
| `constitution_1931` | 1931, Nov+ | democratization+, church_relation−, izq_rep_relation+, reformist_dissent+ |
| `catalan_statute_1932` | 1932, Sep+ | catalan_autonomy+, monarchist_relation−, army_loyalty− |
| `agrarian_reform_law_1932` | 1932, Sep+ | land_reform+, landless_psoe+, monarchist_relation−, budget− |
| `falange_founding_1933` | 1933, Oct+ | falange_militia_strength+15, falange_relation−, radicalization+ |
| `womens_vote_1933` | 1933, May–Oct | democratization+, catholic_ceda+, reformist_dissent+ |
| `catalan_revolt_1934` | 1934, Oct+, in_radical_ceda | catalan_autonomy−, army_loyalty−, left_dissent+, coup+1 |
| `october_repression_1934` | 1934, Nov+, in_radical_ceda | left_dissent+5, radicalization+2, pce_relation+, pro_republic− |
| `straperlo_1935` | 1935, Sep+ | radical_relation−15, ceda_relation−, pro_republic− |
| `prieto_caballero_rift` | 1935, May–Aug | left_dissent+, reformist_dissent+, radicalization+ |
| `azana_presidency_1936` | 1936, Apr–Jun, in_popular_front | president="Azaña", izq_rep_relation+, coup+1 |
| `jesuits_dissolved_1932` | 1932, Jan–May | church_relation−, clerical_conflict+, democratization+ |
| `misiones_pedagogicas` | 1932, Jun+ | democratization+, pro_republic+, urban_middle_psoe+ |
| `ceda_founded_1933` | 1933, Mar–Aug | ceda_relation−, catholic_ceda+, radicalization+ |
| `ceda_enters_government_1934` | 1934, Sep–Oct, in_radical_ceda | left_dissent+4, coup+1, pro_republic− |
| `franco_chief_of_staff_1935` | 1935, May+ | coup+1, army_loyalty−, africa_army+ |
| `popular_front_pact_1936` | 1936, Jan | izq_rep_relation+, pce_relation+, left_dissent− |
| `prisoner_amnesty_1936` | 1936, Feb–Apr, in_popular_front | left_dissent−, pro_republic+, radicalization− |
| `land_seizures_1936` | 1936, Mar–Jun, in_popular_front | land_reform+, landless_psoe+, coup+1 |

**Batch 2 note:** the second batch (the CEDA's rise, the Jesuit dissolution, the Pedagogical
Missions, Franco's promotion, and the 1936 pact/amnesty/land-seizure arc) takes the corpus to 34;
the harness confirms the arc and all four coup outcomes still hold (coup 18 on the historical path,
still avertable at 3, zero NaN).

## Verification

- `BUILD OK` → `SMOKE PASSED` (8) after every batch; the compiler self-checks scene wiring.
- `scripts/balance_sim.mjs --all` after every batch and at the end: the arc (1931 Republican-Socialist
  75.7 → 1933 Radical-CEDA 57 → 1936 Popular Front 70.5) and all four coup outcomes
  (revolutionary→republic_victory, moderate→long_war, defensive→coup_averted, passive→total_defeat)
  are exactly as the M dashboard; new events add coup +3 total on the historical path (12→15, still
  fires) while the defensive line still averts (coup 2); zero NaN.
- Headless Chromium load clean.

## Deferred / out of scope (unchanged from the plan)
- New mechanics/variables; re-tuning the M calibration; new art sourcing; the achievements gallery,
  music, and the 3 generic-fallback card images.
- **Player-choice event branches** — deliberately not used (dead-end risk / corpus consistency);
  a future pass could add them with in-browser click-testing to verify the continue-paths.
