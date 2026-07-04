# Plan: Area B remnants + Area C (Election & Demographic Engine)

> **Session handoff (Areas B & C are essentially complete).** New session: read
> [`../../CLAUDE.md`](../../CLAUDE.md) first, then the **Execution status** section just
> below for the exact state. In short: all of Area B and the Area C *engine* are done and
> verified; the only remaining C items (C-2/C-5/C-8's live-game parts) are blocked on
> Area H content that doesn't exist yet. **The recommended next work is Area H (the content
> spine, which unblocks playability) or Area D (PSOE factions) — not more of this plan.**
> This document stays as the record of B/C work + the still-valid ground rules (§0) that
> the whole conversion follows.

**Audience: a Sonnet-class executor.** Follow steps literally and in order. Do not infer scope beyond what is written. After **every** numbered stage, run the verification for that stage before moving on. If a build fails, you introduced a JS syntax error in a `{! ... !}` block — fix it before continuing.

Prerequisite reading (read these first, in full):
- `docs/planning/B_state_schema.md` — the German→Spanish variable contract. **This is authoritative.**
- `docs/spanish_republic_conversion_design.md` §B and §C.
- Already-done Area B work is committed: the electoral schema core in `source/scenes/root.scene.dry`, the generic math in `source/scenes/election_algorithm.scene.dry`, ministries, and the difficulty/mode blocks.

## Execution status (updated as stages land)

**✅ DONE — B-3, B-4, B-5, B-6, B-7, and the display-facing part of B-8.**
- B-3/B-4/B-5: Cortes composition, adjustmentFactors, government/coalition flags all renamed to the Spanish schema in `root.scene.dry`; provisional-government cast set (Alcalá-Zamora); `next_election_year/month` fixed to June 1931 (was still Dec 1928); `next_election_*_prussia` → `_catalonia`.
- B-6: the three challenge-mode scenes (joever/hitler/unemployed_mode) deleted — they hardcoded the old class/party keys and sat off the normal play path.
- B-7: `library.scene.dry` fully rewritten — `@figures` (seat chart + Cortes table), `@curr_gov`, `@cabinet` (ministries), `@election_projections` (vote list + per-class breakdown table), `@paramilitaries` (fixed an active NaN-writing bug).
- B-8 (display side): `status.scene.dry` fully rewritten — status head, `@paramilitaries` (fixed an active **crash** bug — `.toFixed()` on now-undefined vars), `@politics` "Inter-party Relations", `@polls`. `status_right.scene.dry` confirmed orphaned (zero incoming references anywhere) — left untouched.
- **Verified at every stage:** `npm run build && npm run smoke` green; final pass added headless-Chromium confirmation of no JS errors on the start menu.
- **Explicitly left as documented content debt** (Area D/E/F/H, not B/C): `@government`/`@weimar_timeline`/`@demographics`/`@parties` prose in `library.scene.dry`; `@emergency` and the "Party Leadership"/"Industrial Backing" sections in `status.scene.dry`; the "Distribution of Power" streetfighting block (its vars were never initialized even in the original game — dormant, not a regression); `status_right.scene.dry` in full (orphaned Papen/Schleicher camarilla screen).
- B-9 (qdisplay renames): **not yet done as a dedicated pass** — the generic qdisplays (`confidence`, `dissent`, `strength`, `militancy`, `loyalty`, `relationships`, etc.) are reused correctly throughout; the German-named ones (`hindenburg_angry`, `schleicher_spd*`, `nazi_funds`, `cvp_dnvp_balance`, `camarilla_strength`) are still referenced by their old qdisplay *names* at a couple of call sites (e.g. `[+ president_angry : hindenburg_angry +]`) even though the underlying `Q.*` variable is already renamed — functionally harmless (the qdisplay is just a value→label formatter), but a real rename is still open.

**✅ DONE — C-1 (calendar) and C-3 (1933 bloc-list law).**
- C-1: `events/election_1928.scene.dry`'s `on-departure` no longer auto-reschedules +4 years/+48 months; it now follows the real calendar (1931 constituent → 1933 → 1936 → no further scheduled election, heading to the July-1936 coup end-state). Scene retitled "Cortes Elections".
- C-3: replaced `@post_election_1928`'s ~90-line German-narrative-conditioned adjustment-factor derivation (gated on Weimar plot flags like `dnvp_leader === "Hugenberg"` that nothing in the Spanish game sets, so it was silently inert) with a generic bloc-bonus/solo-penalty computation driven by new `Q.<party>_in_bloc` flags (`root.scene.dry`) and the already-declared `Q.bloc_bonus`/`Q.solo_penalty`.
- **Important finding, verified by standalone simulation (not just build/smoke):** the pre-existing seat-redistribution algorithm was already written generically (loops over `Q.parties`, reads via string concatenation) and needed no changes to its core math — it "just worked" once fed Spanish keys. But making *every* party carry a non-1.0 adjustment factor meant the final "renormalize to 100%" step — which was nested inside `if (new_party_sum > 0)` — would never run. Fixed by hoisting it out unconditionally. Simulation confirms the correct historical direction: bloc parties (PSOE/IR/Radicals) go from ~57% combined votes to ~81% combined seats; solo parties are squeezed; total still sums to ~100%.
- **Verification-harness fix (applies to all future stages):** discovered `dendrynexus make-html` can print `Error:` lines and still exit 0, which let a real syntax bug slip past `npm run smoke` (smoke validates `out/game.json`, which isn't regenerated on a failed compile — it silently re-validated a stale prior build). Added `scripts/build.js`, which scans dendrynexus's output for `Error:` regardless of its exit code and fails loudly before copying `game.json`. `npm run build` now uses this wrapper. Verified against both a real failure and a clean build.

**✅ DONE — C-4 (CNT abstention mechanic).**
- Added to `election_algorithm.scene.dry` (the generic engine, not the narrative-heavy election handler): `Q.anarchist_electoral_stance` (1 = participate, 0 = abstain) modulates effective turnout among the `industrial`/`landless` classes, proportional to `Q.anarchist_strength`. Additive to the existing class-weighted algorithm.
- Verified by standalone simulation: switching to abstention shifts results in the historically correct direction (PSOE/PCE/IR down, CEDA/Monarchist up), total still sums to 100%. Magnitude (a `0.3` coefficient) is a deliberate placeholder — full calibration is explicitly C-8's job, per the plan's own "don't over-fit before calibration" guidance.

**✅ DONE — C-6 (historical-preset calibration harness) and C-7 (yearly economic tick).**
- C-6: rebuilt `election_simulation.scene.dry` (a standalone dev harness, zero references from any other scene — confirmed safe) with three scenarios, `@1931`/`@1933`/`@1936`, each setting its own class×party matrix, `Q.<party>_in_bloc` flags, and CNT stance. **Verified end-to-end by simulation** (matrix → CNT abstention → bloc-bonus seat allocation): 1931 Republican-Socialist bloc wins 63.1% of seats; 1933 flips to a Radical-CEDA majority at 55.1% (Republican-Socialist collapses to 38.0%, driven by disunity + CNT abstention); 1936 Popular Front reclaims 57.5%. The mechanism reproduces the correct historical arc for the right reasons.
- C-7: fixed a **real reachability bug** — `events/1931.scene.dry`'s `view-if` required `month = 1`, but the game now starts in April 1931 (`month = 4`), so it could never fire. Retimed to month 4 and retitled to the Republic's proclamation. De-Germanized `1932`–`1934` (removed NSDAP references, the fabricated German presidential-election line, and a dead `president == "Hindenburg"` check; added real 1932/1933/1934 beats — the Catalan Statute, the Nov-1933 election, CEDA's rising pressure). Repurposed the now-permanently-unreachable `1929`→`1935` (Bienio Negro aftermath) and `1930`→`1936` (Popular Front election, swapped German anthem audio cues for the already-present CNT anthem "A las barricadas"). All six years' `view-if`s verified reachable in sequence from the April-1931 start. `1934_end.scene.dry` (gated on `hindenburg_dead`, never set) left as genuine content debt.

**C-8 (calibration) — mechanism-verification done; full live-game tuning coupled to Area H.** The C-6 harness *is* the calibration exercise the plan calls for, and it confirms the mechanism (matrix + bloc-list law + CNT abstention) produces the right swings for the right reasons. What C-8 cannot yet do: calibrate the *live* `election_1928.scene.dry` pipeline against a matrix that actually drifts 1931→1933→1936 during play, because that drift is driven by narrative events (party-relation shifts, campaign effects) that don't exist until Area H writes them — the same dependency that bounds C-2/C-5. The root.scene.dry baseline matrix (Area B) already matches the C-6 harness's `@1931` scenario, so the live game's starting point is consistent with the verified arc.

**🔲 NOT STARTED / RESCOPED — C-2, C-5.**
- **C-2 rescoped:** `events/election_1928.scene.dry` is 4217 lines / 213 scenes. Only `@post_election_1928` (~230 lines) is the mechanical seat-allocation core, now handled by C-1/C-3/C-4 above. The remaining ~200 scenes (coalition-formation menus, party-specific boycott options like `@spd_boycott`/`@center_boycott`, government-formation flavor text) are **narrative content**, not engine — they reference old party names/behaviors in prose and menu labels, not in load-bearing math. Renaming/redesigning them requires Spanish political-landscape content that Areas D/E haven't produced yet (per the master design doc's own dependency order: content areas depend on B/C, not the reverse). Recommend: leave this content as documented debt for Area H (consistent with the boundary held throughout B), and treat "rename the file / its 213 scene IDs" as **not worth doing** — Dendry scene IDs don't need to be human-meaningful, and renaming them is high-risk (213 internal cross-references) for zero functional benefit.
- **C-5 investigated and deferred:** `post_event.scene.dry` (5208 lines) contains a ~150-line coalition-*possibility* calculator (`Q.weimar_coalition`, `Q.grand_coalition`, `Q.bourgeois_coalition`, `Q.center_right_coalition`, `Q.far_right_coalition`, `Q.cordon_sanitaire`, `Q.schleicher_right/left_coalition`, etc. — 17+ named metrics, plus `_prussia` variants) that reads old party keys (`Q.spd_r`, `Q.z_r`, `Q.dvp_r`, ...) and is gated on splinter flags (`lvp_formed`, `kvp_formed`) that are always false now, so it silently computes `NaN` rather than crashing. **Verified its only consumers**: `main.scene.dry` (deep Stresemann/DVP/DNVP narrative prose) and ~20-34 `events/*.scene.dry` files per metric (`cvp_formed`, `dnf_formed`, `schleicher_cabinet_*`, `papen_cabinet_*`, etc.) — all untouched Weimar content, not engine. A `weimar_coalition` hit in `game_over.scene.dry`/`credits.scene.dry` turned out to be false positives (an achievement key and an image filename, unrelated variables). Since both the producer and every real consumer are Area H content, rewriting this into a curated Spanish 5-metric set now (per the plan's original C-5 sketch) would produce values nothing reads yet — deferred to whenever Area H rewrites the government-formation events that would consume it.

---

## 0. Ground rules (memorize before editing)

**Party key map** (old → new): `spd→psoe`, `kpd→pce`, `z→ceda`, `ddp→izq_rep`, `dvp→radical`, `dnvp→monarchist`, `nsdap→falange`, `other→other` (**keep `other`; never rename it**).

**Class key map:** `workers→industrial`, `old_middle→smallholder`, `new_middle→urban_middle`, `rural→landless`, `unemployed→unemployed`, `catholics→catholic`.

**Region suffix:** `_prussia → _catalonia`. **President:** `hindenburg_* → president_*`.

**EXCISE (delete, do NOT port) these German splinter parties and their variables/branches everywhere you meet them:** `sapd, aspd, dnf, dnef, kvp, lvp, cvp, bvp, wp, cnblp, csvd, dsu, nvf, fkp, rdp`, and the control flags `nsdap_split, dsu_exist, nvf_exist, csvd_formed, aspd_other, aspd_kvp, right_dnef, left_dnef, sa_force`, and the `*_formed` splinter flags. When a line is gated `[? if <splinter>_formed: ... ?]` or `if (Q.<splinter>...)`, delete the whole conditional/branch.

**The concatenation trap:** the engine reads party/class data as `Q[party + '_r']`, `Q[c + '_' + party]`. Because `Q.parties`/`Q.classes` already hold Spanish keys, those concatenated reads *auto-follow*. Only **hardcoded** references (`Q.spd_r`, `Q.z_relation`, `Q.workers_spd`) need manual renaming. **But** an undefined `Q.*` becomes `NaN` in arithmetic — so every Spanish-keyed variable the engine reads must be initialized in `root.scene.dry`. When you rename a hardcoded init, keep it initialized.

**Find/replace safety:** never blanket-replace bare `z`, `dvp`, etc. Always anchor on a suffix (`z_relation`, `spd_r`, `_prussia`) or use word boundaries. Do not touch the reused generic vars (`land_reform`, `coup_progress`, `capital_strike_progress`, `budget`, `works_program`, the `left/center/labor/reformist/neorevisionist/social_patriot` factions, `pro_republic/nationalism/socialism`).

**Do NOT edit** `events/*` (except the election/post-event/yearly-tick engine scenes named below), `advisors/*`, `government_affairs/*`, `party_affairs/*` — those are content, replaced in Areas G/H/I.

**Verification harness (run after each stage):**
```
npm run build && npm run smoke
```
Both must be green. Additional per-stage greps/checks are given inline.

---

## PART 1 — Area B remnants

### B-3 · Cortes composition & previous-vote init  (`root.scene.dry`, approx lines 355–500)
The block currently defines German Reichstag %: `Q.spd_r`, `old_spd_r`, `previous_spd_last_election_votes`, `spd_votes`, and `_prussia` variants, for all 8 base parties **plus** splinter parties.

Do:
1. Rename all 8 base-party families to Spanish keys: `<party>_r`, `old_<party>_r`, `<party>_votes`, `previous_<party>_last_election_votes`, and each `_prussia` variant → `_catalonia`.
2. **Delete** every splinter-party line (`sapd_r`, `dnf_r`, `dnef_r`, `kvp_r`, `lvp_r`, `bvp_r`, `wp_r`, `cnblp_r`, `csvd_r`, `dsu_r`, `nvf_r`, `true_other_r`, plus their `old_*`, `*_votes`, `previous_*`, `_prussia` variants). Keep the plain `other_*` family.
3. Set **June-1931 constituent-election placeholder values** (parliament %, need not be exact — Area C calibrates):
   `psoe_r 25, pce_r 1, ceda_r 5, izq_rep_r 13, radical_r 19, monarchist_r 8, falange_r 0, other_r 29`. Set `old_*_r` equal to these and `previous_*_last_election_votes` equal to these at game start. Set `*_votes` equal to `*_r`.
4. For `_catalonia`: set the same distribution but skewed to regionalists (higher `other_catalonia`, i.e. ERC/Lliga). Placeholder is fine.
5. Leave `reichstag_size`/`landtag_size` as-is here — they are renamed in **C-1**.

Verify: `grep -nE '\b(spd|kpd|dnvp|nsdap|ddp|dvp|sapd|dnf|kvp|lvp|bvp)_r\b' root.scene.dry` returns nothing. Build + smoke green.

### B-4 · adjustmentFactors init  (`root.scene.dry`, approx lines 501–555)
Rename `Q.adjustmentFactors_<party>`, `Q.adjustmentFactors_votes_<party>`, `Q.adjustmentFactors_<party>_prussia` to Spanish keys (all `= 1.0`, except `other = 0.75` and `other_prussia`→`other_catalonia = 0.7`). Delete splinter entries. (These are consumed by C-2; keep them defined so lookups don't return `NaN`.)

Verify: `grep -nE 'adjustmentFactors_(spd|kpd|z|ddp|dvp|dnvp|nsdap|sapd|dnf|kvp|lvp|dnef)\b' root.scene.dry` → nothing.

### B-5 · Government & coalition flags  (`root.scene.dry`, approx lines 557–615)
1. Rename `<party>_in_government` → Spanish keys (`psoe_in_government`, etc.). Delete splinter ones. Set a plausible April-1931 provisional-government state: `psoe_in_government = 1`, `izq_rep_in_government = 1`, `radical_in_government = 1`, others `0`.
2. Rename coalition flags to Spanish coalitions (both national and `_catalonia`):
   - `in_weimar_coalition → in_republican_socialist` (the 1931–33 governing bloc)
   - `in_right_coalition → in_radical_ceda` (the 1933–35 bloc)
   - `in_popular_front → in_popular_front` (keep — the 1936 bloc)
   - `in_left_front → in_workers_alliance`
   - `in_grand_coalition`, `in_center_right_coalition`, `in_social_catholic_coalition`, `in_social_liberal_coalition`, `in_spd_majority`, `in_minority_government`, `in_emergency_government` → keep the generic ones; rename `spd`→`psoe`; drop any with no Spanish analogue.
   Initialize `in_republican_socialist = 1` (national) and set the `_catalonia` set to a plausible ERC-led default.
3. Rename the SPD-government "goal" block (`welfare_goal_spd`, etc.) `spd`→`psoe` **only if** the surviving engine reads them; otherwise these are content (H) — leave them, they're harmless.

Verify: build + smoke; `grep -n 'spd_in_government\|in_weimar_coalition' root.scene.dry` → nothing.

### B-6 · Challenge-mode recompute blocks  (`root.scene.dry`, approx lines 1330–1560) — LOW PRIORITY / OPTIONAL
The `@joever_mode`, `@hitler_mode`, `@unemployed_mode` scenes hardcode the old matrix (`workers_spd = 0`, etc.) then recompute. Either:
- **(preferred, minimal)** rewrite each to use generic loops over `Q.classes`/`Q.parties` so they auto-follow Spanish keys, renaming the few hardcoded cells; or
- **(acceptable)** delete these three challenge scenes and their menu entries (they are niche, off the normal play path).
Do NOT leave them referencing old keys. If out of time, delete them.

### B-7 · Display: parliament composition + seat chart  (`library.scene.dry`)
1. **Composition readout** (approx lines 78–101): replace the German party spans with the 8 Spanish parties; delete all splinter `[? if <splinter>_formed ... ?]` conditionals. Use this display table:

| party | abbrev | tooltip (full name) | colour |
|---|---|---|---|
| psoe | PSOE | Spanish Socialist Workers' Party | `#c00000` |
| pce | PCE | Communist Party of Spain | `#8a0303` |
| ceda | CEDA | Spanish Confederation of the Autonomous Right | `#0087DC` |
| izq_rep | IR | Republican Left | `#7B2D8E` |
| radical | PRR | Radical Republican Party | `#E8B23A` |
| monarchist | Mon. | Monarchists (Renovación / Carlists) | `#2E3B6E` |
| falange | FE | Falange Española | `#14322a` |
| other | Others | Regionalists & minor parties (ERC, Lliga, PNV…) | `#888888` |

   Pattern per line: `<span class="tooltip-text" title="<full name>" style="color: <colour>;">**<abbrev>**</span>: [+ <party>_r +]%`.
2. **Seat chart `@figures`** (approx lines 638–859): each party has a `data.push({id, legend, name, seats: Math.round(Q.<party>_r * Q.cortes_size)})`. Replace with the 8 Spanish parties; delete splinter pushes; set `id` to a stable slug per party (e.g. `psoe`, `ceda`) and pick matching colours (the `id` keys an external colour map — set colours inline if the external map is unavailable). Use `Q.cortes_size` (defined in C-1).
3. **SPD/coalition status line** (approx 103–104): `spd_*`→`psoe_*`; coalition names → the B-5 Spanish coalitions.
4. **Ministerial displays** (party colour blocks further down): update to Spanish party colours/abbrevs; the minister *values* are already Spanish (Area B stage 2).

Verify: `grep -nE '\b(spd|kpd|nsdap|dnvp|dvp|ddp)_r\b|Nazis|Reichstag' library.scene.dry` → nothing (except intentional history notes). Build + smoke.

### B-8 · Display: status screens  (`status.scene.dry`, `status_right.scene.dry`)
Update the faction/relation/paramilitary/loyalty display blocks (agent-located ~lines 243–316 in `status.scene.dry`) to the renamed vars:
- `relationships` qdisplay call sites → the Spanish `<party>_relation` set (`ceda_relation`, `pce_relation`, `izq_rep_relation`, `radical_relation`, `monarchist_relation`, `falange_relation`) and `president_relation`.
- `militancy` qdisplay → `ugt_militia_militancy`, `cnt_militia_militancy`, `falange_militia_militancy`, `requetes_militancy`.
- `loyalty` qdisplay → `guardia_civil_loyalty`, `asalto_loyalty`, `army_loyalty`.
- Any paramilitary strength readouts → `ugt_militia_strength`, etc.
- Delete display of deferred camarilla vars (`schleicher_*`, `hindenburg_*_r`) unless you have a Spanish analogue; otherwise leave a placeholder.

Verify: headless render check (Area A pattern): serve `out/html`, load with headless Chromium, drive to the status screen if reachable, assert the DOM contains no literal `undefined`/`NaN` in the faction/relation/militia rows.

### B-9 · Qdisplays  (`source/qdisplays/*.qdisplay.dry`)
- **Keep unchanged** (generic): `confidence, dissent, strength, militancy, loyalty, taxation, coalition_dissent, boycott_efficacy, month, relationships`.
- **Rename/retarget**: `hindenburg_angry`/`hindenburg_angry_bruning`/`hindenburg_unity`/`hindenburg_hitler` → a `president_*` analogue or fold into `confidence`; `schleicher_spd*`, `nazi_funds`, `cvp_dnvp_balance`, `camarilla_strength`, `schleicher_popularity` → **defer** (the Spanish conspiracy/camarilla is Area E/F): either delete their call sites or leave the qdisplay file unused. Update `status*` call sites accordingly (coordinate with B-8).

---

## PART 2 — Area C (Election & Demographic Engine)

### C-1 · Calendar & constants
1. Rename `Q.reichstag_size` → `Q.cortes_size`. Value: the Republican Cortes was unicameral, ~470 deputies → `Q.cortes_size = 4.70` (each 1% ≈ 4.7 seats). Update every `Math.round(Q[party+'_r'] * Q.reichstag_size)` in `library.scene.dry` and elsewhere to `cortes_size`. Grep the whole `source/` tree for `reichstag_size`.
2. Rename `Q.landtag_size` → `Q.catalonia_size`. Catalan Parliament (1932) = 85 seats → `0.85`.
3. **Election calendar** (`root.scene.dry` `next_election_*` init + `set_next_election_time*.scene.dry` + the election-event `view-if`/`on-departure`): Spain's Cortes elections were **June 1931 (constituent), 19 Nov 1933, 16 Feb 1936**. Game starts April 1931. Set `next_election_year=1931, next_election_month=6`. Replace the Weimar `+4 years / +48 months` auto-reschedule with these fixed historical dates (drive by a small lookup: after 1931 → 1933; after 1933 → 1936; after 1936 the game is heading to the July-1936 coup end-state).

### C-2 · Rename & rebuild the election handler  (`events/election_1928.scene.dry`, 316 KB — the biggest single task)
1. Rename the file/scene to a Spanish election handler (e.g. `events/election_1931.scene.dry`, scene id `election_1931`) and fix all `go-to`/`set-jump` references to it (grep for `election_1928`).
2. In its post-processing: rename all `<party>_*` to Spanish keys; **delete** the German-specific blocks: the splinter seat-splitting (`cnblp_r/wp_r/csvd_r/aspd_r`, `true_other_r` computation), the `dnef` merger block, the `nsdap_split` handling.
3. Keep the *shape* of: adjustment-factor application, threshold application (`electoral_threshold`, gated by `constitutional_reform`), and the seat re-normalization to 100%. Retune to 8 Spanish parties.
4. Build the three historical elections as views of one handler driven by the calendar (C-1): 1931, 1933, 1936. Each sets the pre-election matrix context (or relies on the running dynamic matrix) and runs `election_algorithm`, then post-processes into `<party>_r`.

### C-3 · The 1933 majoritarian bloc-list law  (KEY SPANISH MECHANIC)
Spain's 1933 law rewarded coalitions and punished a divided left — this is *why* the left lost 1933 despite similar vote share and *why* the Popular Front formed for 1936. Implement in the seat-allocation step:
- Represent each party's coalition membership (from B-5 flags / a per-election `coalition_bloc` assignment).
- Apply a **seat bonus to the largest bloc in each constituency tier** and a penalty to parties running alone: e.g. `effective_seats = base_seats * (1 + bloc_bonus)` for coalesced parties, `* (1 - solo_penalty)` for isolated ones, then renormalize to `cortes_size`.
- Expose tunables `Q.bloc_bonus` and `Q.solo_penalty` (init in `root.scene.dry`, e.g. `0.35` / `0.25`). This *replaces* the German wasted-vote adjustmentFactors as the dominant seat-distortion mechanic; keep adjustmentFactors as a secondary per-party knob.

### C-4 · CNT abstention mechanic
`Q.anarchist_electoral_stance` (1 = participate, as 1931/1936; 0 = abstain, as 1933) modulates the left's turnout among `industrial` + `landless`:
- In `election_algorithm.scene.dry` (or a pre-processing step), when `stance = 0`, scale down `industrial`/`landless` support for `psoe`, `pce`, `izq_rep` by a factor (e.g. `× (1 - Q.anarchist_strength/200)`) and add the difference to abstention (reduce those classes' effective weight for that election). When `stance = 1`, no penalty (optionally a small bonus).
- Drive `anarchist_electoral_stance` from narrative/events (Area F/H) — default it per the historical calendar for now (1931→1, 1933→0, 1936→1).

### C-5 · Demographic recompute & coalition flags  (`post_event.scene.dry`)
1. The party-support demographic block (agent-located ~lines 3464–3717) sets per-class vote shares for extra parties — rename to Spanish keys; delete splinter entries.
2. The coalition-possibility computation (`weimar_coalition`, `grand_coalition`, `left_coalition`, `right_coalition`, `center_right_coalition`, `far_right_coalition`, `bourgeois_coalition`, …) → rebuild for Spain: `republican_socialist` (PSOE+IR+Radicals, 1931), `radical_ceda` (1933), `popular_front` (PSOE+PCE+IR+regionalists, 1936), `national_bloc` (CEDA+monarchists+agrarians), `workers_alliance` (PSOE+PCE+CNT sympathy). Base each flag on the post-election `<party>_r` sums crossing a majority threshold.

### C-6 · Historical presets  (`election_simulation.scene.dry`)
Rebuild the three preset matrices and arrays (currently 1928/1930/1932 at lines ~20–232) as **1931 / 1933 / 1936**, using Spanish class×party weights that reproduce the arc: **1931** left/republican sweep; **1933** right (CEDA+Radical) victory (with `anarchist_electoral_stance = 0`); **1936** Popular Front win. This scene is the **calibration harness** for C-8.

### C-7 · Yearly economic tick  (`events/1929–1934.scene.dry`) — coordinate with Area H
Rename to `events/1931–1936.scene.dry`; re-source the Spanish economic trajectory (`economic_growth`, `unemployed`, `inflation`) and the `works_program` recovery driver. The *variables* are state (Area B/C); the *narrative* is Area H. At minimum rename the files and retarget the year `view-if`s so the calendar advances 1931→1936 and lands on the July-1936 end-state.

### C-8 · Calibration
Using `election_simulation` (C-6), iterate the class weights (`root.scene.dry`) and the class×party matrix until simulated 1931/1933/1936 seat outcomes approximate history (PSOE largest 1931; CEDA/Radicals win 1933; Popular Front wins 1936). Adjust `bloc_bonus`/`solo_penalty` (C-3) and the CNT stance factor (C-4) to reproduce the 1933→1936 swing at roughly constant vote share. Do not over-fit; "plausible and in the right direction" is the bar.

---

## Ordering & milestones
1. **B-3 → B-4 → B-5** (make the engine's data model complete on Spanish keys).
2. **B-7 → B-8 → B-9** (display propagation) → **verify the status & parliament screens render with no `undefined`/`NaN`**. This is the "Area B complete" checkpoint.
3. **C-1 → C-2 → C-5** (rename/rebuild the election path end-to-end).
4. **C-3 → C-4** (the two defining Spanish mechanics).
5. **C-6 → C-8** (presets + calibration).
6. **C-7** with/after Area H. **B-6** anytime (or delete).

**Playable-spine milestone (end of Part 2):** start game (April 1931) → June-1931 election renders a plausible Cortes → advance through 1933 and 1936 elections → reach the July-1936 coup trigger via `coup_progress`. Content is placeholder until Area H, but the electoral simulation loop is fully playable.

## Verification additions (extend `scripts/smoke.js`)
- Assert no legacy party `_r`/`_relation`/`_in_government` keys (`spd_r`, `z_relation`, `nsdap_r`, `dnvp_r`, …) remain in the engine scenes (`root`, `library`, `status`, `status_right`, `post_event`, the election handler).
- Assert `Q.cortes_size` is defined and `reichstag_size` is gone.
- Keep the existing schema guard (arrays/axes present, legacy arrays absent).
- Headless render: parliament + status screens contain no `undefined`/`NaN`.

## Pitfalls recap (Sonnet, re-read before each stage)
- Keep `other`; never rename it. Keep generic vars (`land_reform`, `coup_progress`, factions, `pro_republic`).
- Every renamed hardcoded init must stay initialized (undefined → `NaN`).
- Anchor find/replace on suffixes (`_r`, `_relation`, `_votes`, `_prussia`), never bare party letters.
- Delete splinter branches entirely; don't try to map them.
- Build + smoke after every stage; a failed build = a JS syntax error you just wrote.
