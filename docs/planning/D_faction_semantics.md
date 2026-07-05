# Plan: Area D — PSOE Faction Semantics

> **Session handoff.** ✅ **Executed and verified.** D-2 through D-5 are done (D-1, the
> optional value re-tune, was skipped — the German starting values were already
> plausible for 1931 PSOE per the rationale below, and final balance is Area M's job
> anyway). Build + smoke green throughout; the plan's full grep-sweep verification
> passed. See "Execution status" for exact commits/findings.

## Execution status

**✅ DONE — D-2, D-3, D-4, D-5.**
- **D-2:** `party_affairs/ideology.scene.dry` rewritten — intro + all five ideology options (Caballerista/Besteirista/UGT/Prietista/national-unity current) now describe PSOE currents. Fixed live-bug #3 (dangling `z_relation`/`dvp_relation`/`ddp_relation`/`kpd_relation` → `ceda_relation`/`radical_relation`/`izq_rep_relation`/`pce_relation`; dropped the German bourgeois-party drift vars `lvp_relation`, `ddp_cohesion`, `*_right`, `*_left` with no Spanish equivalent).
- **D-3:** faction-description prose rewritten in `library.scene.dry` `@factions`, `status.scene.dry` "Internal Factions of the PSOE", and `party_affairs/shuffle_leadership.scene.dry` (intro + tooltip readout only — its 28 embedded advisor add/remove cards were **not** touched, per the D/I boundary). Found and fixed a dangling `spd_prussia` reference (→ `psoe_catalonia`) in `library.scene.dry` in passing. Added a missing `social_patriot` readout line to `status.scene.dry` for parity with the other five factions.
- **D-4:** fixed live-bug #1 (`party_disunity.scene.dry` `@enforce_unity`'s dangling `workers_spd`/`new_middle_spd`/`unemployed_spd` → `industrial_psoe`/`urban_middle_psoe`/`unemployed_psoe`) and live-bug #2 (`neorevisionism.scene.dry`'s `view-if` gated on renamed-away `nsdap_r`/`nsdap_normalized`, meaning the card could **never** appear — retargeted to `ceda_r >= 20 or coup_progress >= 3 or radicalization >= 3`). Both scenes' prose rewritten to the Spanish framing (anti-fascist mobilization vs. CEDA/monarchist threat; Caballerista/Besteirista/UGT/Prietista naming in disunity messages).
- **D-5:** the two discoverable currents' prose reframings applied throughout D-2–D-4. Added an inline `#`-comment in `ideology.scene.dry` (Dendry's valid content-area comment syntax — not `//`) noting that `social_patriot`'s unlock trigger (`events/schleicher_23.scene.dry`) is Area H's job to redesign; `neorevisionism.scene.dry`'s own trigger was fixed directly (live-bug #2), so it needed no such note.

**Verification performed (not just "it compiles"):**
- `npm run build && npm run smoke` green after every file.
- Full grep sweep (see §Verification below) against all 4 D-owned files: **zero** German faction/ideology terms and **zero** dangling matrix/relation vars remain, other than the intentional Area-H comment, asset `card-image:` filenames (Area K's job), the kept-generic `nazi_urgency`/`neorevisionis*` keys, and the explicitly-out-of-scope advisor cards embedded in `shuffle_leadership.scene.dry`.

**⚠️ Related finding, explicitly out of Area D's scope:** the same grep sweep, run more broadly, shows **~16 other `party_affairs/*.dry` files** — `campaigning`, `crisis_program`, `enemies`, `fundraising`, `inter_party_relationships`, `international_relations`, `iron_front`, `media`, `party_organizations`, `peoples_party`, `peoples_party_campaigning`, `rally`, `reichsbanner`, `streetfighting`, `weimar_rally`, `confronting_nazis` — are riddled with the same class of dangling vars (`workers_spd`, `z_relation`, `dvp_relation`, `ddp_left`, etc.) left by the Area B renames. **These were never in Area D's scope** (the plan named exactly 4 files + 2 display sections). This is a much larger party-affairs content pass — properly **Area E** (party landscape) or a dedicated content-debt sweep, not a silent scope expansion of D. Flagged here for whoever picks up that area next.

---

## Context

The game models the player party's internals as **six factions** — `Q.factions = ['left','center','labor','reformist','neorevisionist','social_patriot']`, each with `Q.<faction>_strength` and `Q.<faction>_dissent`. Area B deliberately **kept these variable names generic and working** but did **not** remap their *meaning* to the PSOE (documented in `docs/planning/B_state_schema.md` §5: "names KEPT, values re-baselined; semantics = Area D"). So the machinery ran, but a faction labelled "left" wasn't yet explicitly Caballerista, the ideology deck still argued about Kautsky and Bernstein, and the faction-description prose still referenced the USPD, the ADGB, and Schleicher.

**Area D's job:** give the six faction slots their PSOE identity — rewrite the ideology deck, the faction-description prose, and the faction-discovery/disunity cards — **without renaming the faction variable keys**, so the ~19 advisor scenes and the events that read `left_strength`/`center_dissent`/etc. keep working untouched. Intended outcome: the faction system *reads* as PSOE's real factional geometry (Caballerista / Prietista / Besteirista / UGT) end-to-end, and two reachable bugs left by the Area B renames are fixed.

## The pivotal decision (held from Area B): keep faction keys generic

**Did NOT rename `left_strength` → `caballerista_strength`, etc.** Reasons: (1) 19 of ~28 `advisors/*.scene.dry` and dozens of `events/*` read these keys — those files are Area I/H content not yet rewritten, and renaming now would break live wiring for zero functional gain; (2) it matches the Area B "hybrid" strategy (only electoral party/class keys were renamed; faction/opinion names stayed generic). The faction keys are **internal slots**; D changed only their *displayed identity and content*.

## The faction mapping (German SPD current → PSOE current, as displayed)

| key (unchanged) | old identity | **new PSOE identity** | gloss |
|---|---|---|---|
| `left` | class-struggle radicals (USPD heirs) | **Caballerista** (Largo Caballero) | revolutionary left; worker alliance with the PCE; "Spanish Lenin"; drove Oct-1934 & the 1936 JSU |
| `center` | Kautsky/Hilferding "centre Marxists" | **Besteirista** (Julián Besteiro) | orthodox Marxists; oppose *both* bourgeois collaboration *and* premature revolution |
| `labor` | ADGB free trade unions | **UGT** | the union bloc; material gains for organized workers, public works |
| `reformist` | Bernstein reformists | **Prietista** (Indalecio Prieto) | pragmatic "governmental" socialists; defend the Republic; collaborate with the republicans (Republican Left) |
| `neorevisionist` | Neu-Beginnen "new revisionists" (discoverable) | **anti-fascist mobilization current** (discoverable) | a mass anti-fascist / worker-alliance impulse that emerges in response to the CEDA/monarchist threat |
| `social_patriot` | "socialism + patriotism", Schleicher's puppets (dormant, event-unlocked) | **national unity current** (dormant) | weakest analogue — Spain's socialists had no real patriotic-socialist wing; kept minimal, still dormant |

## Scope: what Area D owned vs. deferred

**D owned (rewritten):**
- `source/scenes/party_affairs/ideology.scene.dry` — the ideology-choice deck.
- `source/scenes/party_affairs/neorevisionism.scene.dry` — the discoverable-faction card.
- `source/scenes/party_affairs/party_disunity.scene.dry` — the faction-conflict card.
- `source/scenes/party_affairs/shuffle_leadership.scene.dry` — the faction-strength readout + descriptions only (its advisor-add/remove *lists* are mechanical and stayed untouched).
- `source/scenes/library.scene.dry` `@factions` and `source/scenes/status.scene.dry` "Internal Factions of the PSOE".
- `source/scenes/root.scene.dry` faction init — **left as-is** (D-1 skipped; see rationale below).

**D did NOT own (left as documented debt):**
- The **28 `advisors/*.scene.dry`** scenes (German figures) — **Area I**.
- The **trigger events** for the secret faction-split flags (`left_split`, `centrists_resign`, `reformists_resigned`, `unions_independent`) and the `social_patriot` unlock (`events/schleicher_23.scene.dry`) — **Area H**.
- Faction key renames — explicitly not done.
- The ~16 other `party_affairs/*` files with dangling vars (see "related finding" above) — **Area E** or a dedicated debt sweep.

## Live bugs fixed (reachable in play — Area B renames had left these dangling)

1. **`party_disunity.scene.dry` `@enforce_unity`** wrote to `workers_spd`/`new_middle_spd`/`unemployed_spd` (renamed away in Area B) → fixed to `industrial_psoe`/`urban_middle_psoe`/`unemployed_psoe`.
2. **`neorevisionism.scene.dry` `view-if`** gated on `nsdap_r >= 10 or nsdap_normalized >= 0.15` (both renamed to `falange_*`), so the card could **never** appear → retargeted to `ceda_r >= 20 or coup_progress >= 3 or radicalization >= 3` (the Falange stays electorally tiny in Spain, so gating on it alone would reproduce the same dead-card problem; gating on the broader right-authoritarian threat is the correct Spanish equivalent).
3. **`ideology.scene.dry` `on-departure`** effects touched renamed/removed relation vars — fixed per the rename map, and the German bourgeois-party internal-drift vars (`ddp_cohesion`, `*_left`, `*_right`, `lvp_relation`) were dropped (no Spanish equivalent; would be Area E's to reintroduce if ever needed).

## D-1 rationale (skipped)

The existing German start values (`left 15/center 30/labor 25/reformist 25/neorevisionist 5/social_patriot 0`) are already plausible for 1931 PSOE — moderate-dominant, revolutionary-left present-but-weakest (Largo Caballero hadn't radicalized yet in 1931). Final balance is Area M's job regardless, so no re-tune was made.

## Verification

- `npm run build && npm run smoke` green after every file.
- Grep sweep for German faction/ideology terms in the 4 D-owned files:
  `grep -rniE "Kautsky|Bernstein|USPD|ADGB|Schleicher|Mierendorff|Nazi|NSDAP|SPD\b|reichsbanner" source/scenes/party_affairs/ideology.scene.dry source/scenes/party_affairs/neorevisionism.scene.dry source/scenes/party_affairs/party_disunity.scene.dry source/scenes/party_affairs/shuffle_leadership.scene.dry`
  → only the intentional Area-H comment, asset filenames, kept-generic keys, and the explicitly-out-of-scope advisor cards.
- Grep sweep for dangling matrix/relation vars in the same files → none.
- No standalone simulation needed — Area D changed no math; faction strength/dissent deltas are unchanged from the base game.
