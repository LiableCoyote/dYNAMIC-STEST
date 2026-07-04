# Area B — State Schema Reference (German → Spanish contract)

This is the **canonical variable contract** for the Spanish Republic conversion. Every later area (C–M) codes against the names/semantics defined here. Strategy: **Hybrid clean-slate** (see `../../` design docs) — rename electoral party/class keys and engine-displayed proper nouns to Spanish; keep semantically-generic names; defer German-person plot vars to the content rewrite.

Status legend: ✅ done · 🔲 pending · ⏸ deferred (dies with content in Area H) · ♻ reused as-is.

---

## 1. Party keys (`Q.parties`, `Q.parties_graph`) — 1:1 rename
Renaming these re-keys every concatenated access (`Q[party+'_r']`, `Q[c+'_'+party]`, `adjustmentFactors_<party>`, …) plus all hardcoded `<party>_*` families.

| old | new | Spanish party | role |
|---|---|---|---|
| spd | `psoe` | PSOE (player) | mass socialist party |
| kpd | `pce` | PCE | communist rival (left) |
| z | `ceda` | CEDA / Acción Popular | Catholic authoritarian right — grows over time |
| ddp | `izq_rep` | Republican Left (Azaña) | left-republican ally |
| dvp | `radical` | Radical Party (Lerroux) | centre → CEDA's partner |
| dnvp | `monarchist` | Renovación / Carlist / agrarian | anti-republican right |
| nsdap | `falange` | Falange + military conspiracy | existential end-boss — starts ~0 |
| other | `other` | ERC / Lliga / PNV + minor | regionalists & splinters |

Affected families (rename everywhere in **surviving engine scenes only**): `<party>_r`, `old_<party>_r`, `<party>_votes`, `previous_<party>_last_election_votes(_prussia)`, `adjustmentFactors_<party>(_votes/_prussia)`, `<party>_relation`, `<party>_leader/_ideology`, `<party>_in_government`, `industrial_<party>_backing`, `<class>_<party>(_old/_normalized/_display)`.

**Excised German splinter machinery** (do NOT port): `cnblp, wp, csvd, aspd, dnef, dsu, nvf`; the `.filter` party mergers; `nsdap_split` and its flags (`csvd_formed, aspd_other, aspd_kvp, right_dnef, left_dnef, dsu_exist, nvf_exist, sa_force`); splinter `*_formed` flags. Spanish realignments (PSOE/PCE→JSU, CNT dissidence) are designed in C/E.

## 2. Class keys (`Q.classes`) — 1:1 rename
| old | new | group |
|---|---|---|
| workers | `industrial` | urban/industrial workers (UGT/CNT base) |
| rural | `landless` | agricultural day-laborers (braceros) |
| old_middle | `smallholder` | peasant proprietors / tenant farmers |
| new_middle | `urban_middle` | salaried middle class, professionals |
| unemployed | `unemployed` | (kept) |
| catholics | `catholic` | practicing-Catholic cross-cutting bloc |

C may later add a 7th class (`regional_nationalist`) or split rural — additive, C owns it.

## 3. Baseline class→party matrix (proposed June-1931 weights; C calibrates)
Relative weights (normalized by the algorithm; need not sum to 100).

| class \ party | psoe | pce | ceda | izq_rep | radical | monarchist | falange | other |
|---|---|---|---|---|---|---|---|---|
| industrial | 45 | 8 | 5 | 10 | 12 | 2 | 0 | 18 |
| landless | 40 | 6 | 8 | 8 | 14 | 6 | 0 | 18 |
| smallholder | 10 | 1 | 30 | 8 | 20 | 12 | 0 | 19 |
| urban_middle | 12 | 1 | 12 | 25 | 25 | 5 | 1 | 19 |
| unemployed | 35 | 10 | 6 | 8 | 12 | 3 | 1 | 25 |
| catholic | 6 | 0 | 45 | 5 | 10 | 15 | 1 | 18 |

`_spd_old` snapshot row → `_psoe_old`. **CNT-abstention caveat:** the `other`/turnout share in `industrial`/`landless` is modulated by anarchist electoral stance (participate 1931/36 vs abstain 1933) — mechanic in C/F; B declares the slots.

## 4. Relations (`<party>_relation`) — rename to new keys
`z_relation→ceda_relation`, `kpd→pce`, `ddp→izq_rep`, `dvp→radical`, `dnvp→monarchist`, `nsdap→falange`; `lvp_relation` dropped; `hindenburg_relation→president_relation`. Update `relationships`/`confidence` qdisplay call sites in `status*`.

## 5. Factions — names KEPT, values re-baselined (semantics = Area D)
`factions = ['left','center','labor','reformist','neorevisionist','social_patriot']` and `*_strength`/`*_dissent` unchanged. Working gloss (D finalizes): left≈Caballerista, reformist≈Prietista, center≈Besteirista, labor≈UGT, neorevisionist/social_patriot≈latent currents.

## 6. Paramilitaries & state forces — rename slots, keep structure
| old | new | Spanish |
|---|---|---|
| rb_* (Reichsbanner) | `ugt_militia_*` | socialist/UGT militia (player) |
| rfb_* (communist) | `cnt_militia_*` | anarchist CNT militia |
| sa_* | `falange_militia_*` | Falange militia |
| sh_* (Stahlhelm) | `requetes_*` | Carlist Requetés |
| interior_police_* | `guardia_civil_*` | Guardia Civil |
| prussian_police_* | `asalto_*` | Assault Guards |
| reichswehr_* | `army_*` | Spanish Army (`army_loyalty` = coup-clock input) |

Structure preserved: `_strength/_militancy/_banned/_loyalty/_force`. Area F refines.

## 7. President & region
- **President:** reuse `president`/`president_ideology`/`chancellor`; `president="Alcalá-Zamora"`. `hindenburg_relation→president_relation`. Camarilla/conspiracy actors (`schleicher/papen/meissner/oskar_*`, `hindenburg_*_r`) ⏸ deferred → Spanish conspiracy (Mola/Sanjurjo/Franco/Gil-Robles) designed in E/F; left defined-but-inert so status renders.
- **Region:** `_prussia` universe → `_catalonia` (Generalitat/ERC). `spd_prussia→psoe_catalonia`, `prussia_leader→catalonia_leader` ("Macià"). B renames slots the surviving election/status engine touches; full regional mechanics (Basque statute, Oct-1934) = Area F.

## 8. National opinion — KEPT, re-baselined ♻
`nationalism`, `socialism`, `pro_republic`, `emergency_rule` (highest blast radius — names kept to avoid 230-file churn). Re-baseline values for 1931.

## 9. New Spanish axes — DECLARE inert (mechanics = Area F)
New: `anarchist_strength`, `anarchist_militancy`, `anarchist_electoral_stance`, `anarchist_insurrection`, `catalan_autonomy`, `basque_autonomy`, `clerical_conflict`, `church_relation`, `africa_army`; `army_loyalty` (from renamed `reichswehr_loyalty`).
Reused ♻: `land_reform` (already exists!), `coup_progress` (July-1936 clock), `capital_strike_progress`, `budget`, `works_program`.

## 10. Mode flags & time — names KEPT, re-baselined
`difficulty/historical_mode/dynamic_mode/old_demographics` names unchanged; override blocks re-baselined to Spanish relations + a "historical-1936 / dynamic" framing. Time: `year=1931, month=4`; `next_election_*` → June-1931 constituent election. `reichstag_size→cortes_size` (value in C; slot here).

## 11. ⏸ Deferred German-plot vars — DO NOT build on these
Referenced almost only by content deleted in H; they vanish with it: `hindenburg_*` (camarilla/refs), `schleicher_*`, `bruning_*`, `papen_*`, `goerdeler_*`, `stegerwald_*`, `treviranus_*`, per-advisor booleans (`wels_advisor`…), `wtb_*`, `panzerkreuzer_*`, `young_plan_*`, `blutmai`, `mefo_bills`, `schwarze_null`, `march_on_berlin_*`, `marburg_*`, `nazi_*`, region tags (`_bavaria/_saxony/_thuringia/_wurttemberg/_lippe`). New content authors: use the Spanish schema above, not these.
