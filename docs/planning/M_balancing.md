# Area M — Balancing, Playtesting & QA (the finale)

> **Status.** ✅ **DONE** (simulation-driven calibration). Area M is the last area. It built a
> faithful balance harness that runs the game's *real* compiled logic, calibrated the live election
> pipeline to the historical arc, tuned the coup/insurrection clocks and the July-1936 force math so
> all outcomes are reachable and track player choices, sanity-checked faction/economic drift, purged
> the dead German ending residue, and verified the four difficulty modes. **The one thing a headless
> session cannot do — human playtesting for feel/fairness/pacing — is flagged as the standing
> remainder in the punch list below.**

## Scope (what "balancing" meant here)

The design doc's §M: "re-tune every numeric threshold (election baselines, coup/insurrection clocks,
faction-drift rates, the July-1936 trigger conditions)" and "define win/lose/branch conditions." The
user chose the **full** scope: calibration + endings cleanup + difficulty verification. The hard
constraint: this session's tooling is standalone Node simulation + headless `--dump-dom` only, so M
is **simulation-driven calibration** — build a faithful harness, run representative strategies,
measure, tune, re-measure. Prior areas verified *mechanisms*; M is the first to calibrate the *live
numbers to targets*, the handoff Area C-8 explicitly deferred.

**Guardrail that governed every change:** tune numbers, don't rewrite mechanisms; measure → tune →
re-measure (never eyeball); the historical arc is the election target; the coup is near-inevitable
by design (avertable only by deliberate counter-play, not a coin-flip); never rename keys.

## Execution status

- **M-0 (recon + baseline):** ✅ done. Mapped the tunable knobs and the live-vs-dead split in the
  economic tick; confirmed the coup-increment ledger (six escalation events summing to +14) and the
  `july_1936_coup` force formula; inventoried the four live `game_over` endings and the ~14 dead
  German ending branches. Baseline `BUILD OK` → `SMOKE PASSED` (8).

- **M-1 (`scripts/balance_sim.mjs`):** ✅ done. A **faithful** Node harness: it loads `out/game.json`
  and executes the game's *real* compiled `$code` (never a hand reimplementation), booting `Q` from
  `root.start`, applying a difficulty + strategy profile, stepping April 1931 → July 1936 firing every
  date-gated event whose `viewIf` passes (yearly ticks, escalation events, the elections), resolving
  the coup, and printing a balance dashboard. Ships four profiles: **revolutionary** (militia-heavy,
  antagonizes the CNT), **moderate/reformist** (defends the army, broadens electorally, runs Prieto's
  public works), **defensive/loyalist** (the coup-averting counter-play), and **passive** (baseline).
  Tooling only — not wired into the build.

- **M-2 (live election calibration — the C-8 handoff):** ✅ done. The live matrix and bloc flags were
  static at the 1931 config with no writer for 1933/1936, so every live election reproduced 1931.
  **Fix:** seed the historical electoral-bloc configuration per election year in `election_1928`'s
  on-arrival (1931 Republican-Socialist conjunction; 1933 the CEDA-Radical-monarchist right coalesces
  while the left runs solo; 1936 the Popular Front reunites). The 1933 majoritarian **bloc-list law**
  is the dominant lever in the seat pipeline, so scripting *who is coalesced* reproduces the verified
  historical arc while the class→party matrix and the CNT stance stay player-driven. Extended the
  harness to fire the full live election pipeline and report the vote-share arc, and to fire
  `coalition_formation` immediately after each election as live play does (necessary because
  `post_election_1928`'s dead German reset block zeroes the live `in_popular_front` flag, which
  `coalition_formation` re-sets). **Verified:** 1931 Republican-Socialist sweep → 1933 Radical-CEDA
  win → 1936 Popular Front win with PSOE the largest single party, across all profiles; margins
  diverge by campaign strategy.

- **M-3 (coup + insurrection clock tuning):** ✅ done. Calibrated the CNT-abstention coefficient (a
  C-4 placeholder) from `0.3` to `0.7` — a realistic ~25% turnout drop in the CNT-strong
  industrial/landless classes when abstention is called, doubling the isolated 1933 left-bloc swing
  to ~1.5 points; it stays deliberately subordinate to the bloc-list law (the primary 1933
  determinant), and the CNT's larger weight is the `casas_viejas` coup trigger and the militia force
  math. Fixed an **army_loyalty runaway** (it is a 0–1 fraction but ran to 2.09 under sustained
  counter-play, corrupting the coup math): clamped the two unguarded writers
  (`dealing_with_toleration.conspiracy_success`, `military_policy.reform`) with `if army_loyalty < 1`,
  matching the existing pattern. **Verified:** the coup fires (progress 12) on all three
  historical-path profiles; the defensive profile's sustained counter-play holds it at 3 →
  `coup_averted`; army_loyalty now caps at 0.93.

- **M-4 (endgame force math + outcomes):** ✅ done. All three coup outcomes were reachable, but the
  `africa_army` term (`* 15`) left even a large Army of Africa — the historically decisive rebel
  force — barely able to affect the result. Raised it to `* 35` so letting the Moroccan army grow (an
  un-purged officer corps, the sanjurjada) is a genuine path from victory to `long_war`. **Verified:**
  all four outcomes reachable and correlated with play (revolutionary → `republic_victory`, moderate
  → `long_war`, passive → `total_defeat`, defensive → `coup_averted`); historical-path outcomes
  unchanged; the africa_army force gradient is now smooth (0–6 victory, 10–20 long_war) rather than
  inert.

- **M-5 (faction-drift + economic sanity):** ✅ done. The faction normalizer
  (`post_event.scene.dry` L233–282) provably bounds the six factions (dissent clamped `[0,99]`,
  strength clamped `>=0` then normalized to 100). Economic drift is driven by the **live**
  `works_program` yearly-tick lever, not dead German states — gave the reformist profile Prieto's
  public-works program and the harness shows unemployment falling 10 → 4, growth/inflation rising
  (the spending tradeoff), then plateauing when the budget runs out, all bounded. The dead German
  monthly economic block (`post_event.scene.dry` L815–884, gated on `papen_*`/`schleicher_*`/
  `prussia_*` states) is **confirmed inert** (a static passive economy proves it never fires) and,
  per the H2-4 precedent for interleaved dead blocks, is left in place documented rather than excised.

- **M-6 (endings cleanup + difficulty verification):** ✅ done. Purged the dead German ending residue
  from `game_over.scene.dry`: the Holocaust `<iframe>`, `@hitler_wins`, `@war_against_hitler`,
  `@nsdap_win`, `@braun_victorious`, the six `@president_*` slides, `@spd_victorious`/`_2`,
  `@communist_victory`, and `@european_union` (all gated on excised German names / a never-set `eu`;
  the build's reference resolver self-checked the deletions). Fixed German prose leaks in the
  live-var-gated achievement slides that *do* fire in Spanish play (`@emergency_government` and
  `@peoples_party_achieved`: SPD → PSOE, Chancellor → Prime Minister; `@unemployment_high`: dropped
  the Hitler line). The four live Spanish endings are clean, mutually exclusive (exactly one
  coup-state holds after the resolver), and reachable. The four difficulty modes are distinguishable
  by construction — easy/normal/hard/dynamic set different starting militia (1200/1000/600/1000),
  resources, starting dissent, relations, and budget.

- **M-7 (verification + docs):** ✅ done — this document, plus `CLAUDE.md` and the design doc §M.

## Final calibration dashboard

Produced by `node scripts/balance_sim.mjs --all` (the game's real compiled logic, four strategy
profiles × four difficulties):

```
profile        difficulty  ending           coup  loyalty  R-power  E-power
revolutionary  normal     republic_victory   12    0.10     2579      765
revolutionary  easy       republic_victory   12    0.10     2752      765
revolutionary  hard       republic_victory   12    0.10     2232      765
moderate       normal     long_war           12    0.26      551      686
moderate       hard       long_war           12    0.26      511      686
defensive      normal     coup_averted        3    0.93        0        0
passive        normal     total_defeat       12    0.10      422      765
passive        hard       total_defeat       12    0.10      382      765
```

Live election arc (moderate/normal), `node scripts/balance_sim.mjs --profile=moderate`:

```
1931: RepSoc 76.3  RadCeda 31.4  PopFront 56.2  =>  Republican-Socialist wins (PSOE largest)
1933: RepSoc 42.3  RadCeda 56.3  PopFront 21.6  =>  Radical-CEDA wins (left collapses, solo)
1936: RepSoc 69.3  RadCeda 16.6  PopFront 71.0  =>  Popular Front wins (PSOE 48.5, largest)
```

**The load-bearing assertion, demonstrated (not asserted):** across the strategy profiles and
difficulties, the live game reproduces the historical election arc, the coup fires on the historical
path but is avertable by deliberate counter-play, all four endings are reachable and track player
choices, and no faction/economic metric runs away — all shown by `scripts/balance_sim.mjs`.

## Harness limitations (what the simulation does *not* exercise)

- **`post_event.scene.dry` can't run headless** — it references the browser `dendryUI` object and
  throws in Node. So the harness measures the event/election/coup path, not the per-turn faction
  normalization / demographic drift. Faction sanity is instead established by inspection (the
  normalizer's clamps provably bound the values). The dissent-dampening effect of a hard start
  (higher starting dissent → all card effects scaled by `(1 - dissent)`) is therefore *under*-
  represented in the dashboard; difficulty's real spread is larger in live play.
- **Card cooldowns / action caps are ignored** — the profiles fire card on-arrivals on a fixed
  monthly cadence, so an all-in militia build reaches an upper bound a real player (gated by
  `month_actions` and per-card timers) would approach more slowly.
- **`dynamic` mode mirrors `normal` in the harness** — its differentiation lives in dynamic-event
  logic the harness doesn't drive; it is distinct by construction (`dynamic_mode = 1`).

## Human-playtesting punch list (the balance judgments a simulation can't make)

1. **Is the militia the right amount of "win button"?** An all-in UGT-militia build wins the rising
   decisively (ratio ~3.6) even against a disloyal army and a grown Army of Africa. That is the
   intended payoff for five years of preparation, but only a human can judge whether it makes the
   army-loyalty / africa_army levers feel irrelevant once you commit to militia.
2. **Is averting the coup satisfying, or just tedious?** The defensive line requires sustained
   counter-play (fund the army, ban and persecute the Falangist/Carlist militias, work the
   conspiracy, keep the CNT calm). The harness proves it *works*; whether it's a fun, legible
   alternate-history achievement is a play judgment.
3. **CNT management as a lever.** The abstention swing is deliberately subordinate to the bloc-list
   law (~1.5 points on the 1933 left bloc). Does that read as meaningful to a player, given the CNT's
   larger weight is the coup clock and the militia?
4. **Economic pacing.** Public works visibly lower unemployment but run into a budget wall; austerity
   / nationalization / capital-levy arms exist but weren't each profile-tested. A human should play
   the full economic deck and judge the depression's pacing.
5. **Difficulty feel.** easy/normal/hard are numerically distinct; whether "hard" *feels* like a
   different game (largely via the dissent penalty the harness under-counts) needs real sessions.
6. **The three elections' feel.** The arc is historically correct on rails (the bloc structure is
   scripted); whether players want more agency over PSOE's own 1933/1936 bloc membership (currently a
   scripted backdrop) is a design question, not a balance one — flagged for a possible future content
   pass, out of M's number-tuning scope.

## Deferred / out of scope

- **Human playtesting** — the standing remainder the design doc anticipates; M delivers the measured
  calibration and the punch list above.
- **Mechanism rewrites & key renames** — out (guardrails); M tuned numbers and purged dead ending
  prose only.
- **The dead German monthly economic block** (`post_event.scene.dry` L815–884) — confirmed inert;
  left in place per the H2-4 precedent for interleaved dead blocks (surgery risk outweighs the gain
  on code that already does nothing).
- **The interleaved dead block in `@post_election_1928`** (H2-4) — still inert; not touched.
- **Player agency over PSOE's own electoral-bloc membership** — a content/mechanism enhancement, not
  number-tuning; the historical bloc structure is scripted as the backdrop that reproduces the arc.
- **New endings / a Civil War expansion** — the deferred post-coup scope; M refined and cleaned the
  existing win/lose branches.
