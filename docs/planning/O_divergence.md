# Area O — Divergence: "The Two Spains"

> **Status.** ✅ **Core done (D-1…D-5), shipped.** The game has been re-spined away from the
> inherited Weimar "survive-the-coalitions-until-the-putsch" frame. Three interlocking new mechanics
> — **Dual Power**, **the Party Line**, and **Polarization** — now drive a set of **branching
> endgames**. The historical election arc is untouched; the harness confirms every ending is
> reachable and correlates with strategy, with zero NaN. D-6 (this doc + deploy) closes the core;
> deeper card trade-dynamics / line-gating are the natural next content pass (see *Deferred*).

## Why

Mechanically the conversion was still the base game: react to events, manage relations/dissent, and
ride a **linear `coup_progress` clock** to one July-1936 force-math outcome. This area makes the game
about *Spain* — the collapse of the centre into two camps, the PSOE's reform-vs-revolution schism,
and power that lay as much in the street and the countryside as in the Cortes.

## The three mechanics (all reuse existing state)

### Dual Power — `movement_power` / `institutional_power` (D-1)
Two headline resources, **derived at read time** (no post_event dependency, so the harness sees the
same numbers) as a readable ~0–100 index:
- **Poder Popular** (`movement_power`): `(ugt+cnt militia)/50 + dues·2 + works_councils·3 +
  radicalization·2 + nationalization·4 + anarchist_strength·0.2 + movement_power_bonus`.
- **Poder Institucional** (`institutional_power`): `psoe_in_government·15 + army_loyalty·30 +
  asalto_loyalty·15 + guardia_civil_loyalty·10 + budget + democratization·2 + welfare +
  institutional_power_bonus`.
- Computed in `status.scene.dry` (Status page) and `status_right.scene.dry` (the Two Spains board);
  **the same formula is mirrored in the crisis resolver** (`events/july_1936_coup`) and
  `scripts/balance_sim.mjs`. Cards move the `*_bonus` accumulators. Balanced at start (≈42 / ≈40).

### The Party Line — `party_line` (D-2)
`0` = reformist/Prietista … `100` = revolutionary/Caballerista. Steered at the existing **"Questions
of Ideology"** congress card (class struggle +20, centrist +5, labor −8, reform −20, socpat −25) and
nudged by the Prieto–Caballero rift event toward the stronger faction. Shown on the Status page and
the Two Spains board via the `party_line` qdisplay; clamped [0,100]. It sets the **win condition**
(below).

### Polarization — "Las dos Españas" — `polarization` / `balance_of_power` (D-3)
Replaces the linear coup clock as the framing. `polarization` (0 consensus … 100 rupture) is derived
from the confrontation signals (`coup_progress·3.5 + clerical_conflict·2 + radicalization·1.5 +
anarchist_insurrection·8 + polarization_bonus − democratization·1.5`); `balance_of_power` (50 even) is
the left/Popular-Front bloc vs the National/military bloc, from the same force components the coup
resolver uses. `coup_progress` is **subsumed** as a polarization input (still shown as the military-
conspiracy sub-signal). The **Conspiracy tab** (`status_right`) is repurposed into the **"Las dos
Españas"** board (polarization + balance + the two powers + party line, with the conspiracy as its
military dimension); the tab is retitled in `out/html/index.html`. Calibrated: start polarization 0 /
balance 58; historical endpoint polarization 85 / balance 46.

### Branching endgames (D-4)
The July-1936 resolver (`events/july_1936_coup.scene.dry`, `@resolve`) branches on **party line ×
dual power**, not force math alone:
- **La Revolución** (`workers_revolution`) — the rising is beaten **and** `party_line ≥ 60` **and**
  `movement_power ≥ institutional_power`: the armed workers' movement makes a revolution rather than
  restoring the old Republic.
- **La República / republic_victory** — the rising is beaten on a reformist/institutional footing.
- **La Guerra Civil / long_war** — forces roughly matched.
- **El Golpe Legal** (`legal_coup`) — the rising wins **and** `party_line ≤ 40` **and**
  `movement_power < 35`: a reformist party with no movement to fall back on is overrun in a swift,
  near-legal takeover.
- **La Derrota / total_defeat** — the rising wins outright.
- **La República Consolidada** — the coup never fires (`@no_hitler`), reframed by polarization:
  `polarization < 45` → the centre held (the hard reformist win); else an uneasy survival.

New `game_over` slides for La Revolución and El Golpe Legal; `@no_hitler` reframed; the two new
ending flags init in `root.scene.dry`.

## Verification (D-5)

`scripts/balance_sim.mjs` (extended: the profiles now carry a party line — revolutionary Caballerista,
moderate/defensive Prietista):

```
revolutionary  -> workers_revolution   (all difficulties)
moderate       -> long_war             (total_defeat on hard)
defensive      -> coup_averted / Consolidada
passive        -> total_defeat
```

Direct resolver tests confirm every branch fires with the right inputs (revolutionary-win →
workers_revolution, reformist-win → republic_victory, reformist-no-movement-loss → legal_coup,
overwhelmed → total_defeat). **The historical election arc is unchanged** (1931 Republican-Socialist
→ 1933 Radical-CEDA → 1936 Popular Front — party_line and dual-power are orthogonal to the election
matrix) and there is zero NaN. `BUILD OK` → `SMOKE PASSED` (8) and a clean headless load throughout.

## Files touched
- `source/scenes/root.scene.dry` — new state (movement/institutional power + bonuses, party_line,
  polarization + balance + bonus, the two new ending flags).
- `source/scenes/status.scene.dry` — derive + display the two powers and party line (Two Spains block).
- `source/scenes/status_right.scene.dry` — reframed into the "Las dos Españas" board.
- `source/scenes/party_affairs/ideology.scene.dry` — the congress card steers party_line.
- `source/scenes/events/prieto_caballero_rift.scene.dry` — nudges party_line.
- `source/scenes/events/july_1936_coup.scene.dry` — the branching crisis resolver.
- `source/scenes/game_over.scene.dry` — La Revolución / El Golpe Legal slides + reframed Consolidada.
- `source/qdisplays/{party_line,polarization}.qdisplay.dry` — new labels.
- `out/html/index.html` — Conspiracy tab → "Las dos Españas".
- `scripts/balance_sim.mjs` — party line on profiles + the new endings.

## Deferred / next
- **Card trade-dynamics & line-gating** — the `*_bonus` accumulators are wired but few cards push
  them yet; the natural next pass is to have cards explicitly *trade* institutional↔movement power
  (a general strike spends legitimacy for the street; a coalition does the reverse) and to `view-if`-
  gate revolutionary/reformist-only cards on `party_line`. High value, additive, non-breaking.
- **El Golpe Legal as a mid-game path** — currently a July-resolver branch; a fuller version would let
  the CEDA consolidate power *before* July 1936 (the Dollfuss path) via the election/coalition engine.
- The old M-calibration's coup numbers still feed polarization; they were left as-is (they produce a
  sensible polarization curve). Achievements gallery, music, and the 3 fallback-card images unchanged.
