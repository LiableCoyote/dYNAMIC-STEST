# Area L — Localization, Naming & Flavor Consistency

> **Status.** ✅ **DONE.** The last live player-visible German prose is converted, the dead German
> scenes are purged, the "Mod Info" page is a Spanish "About", and the party colours are harmonized
> to one palette. Every German token that remains in the tree is an intentionally-kept
> variable/scene-ID key, a comment, dead code, a legitimate foreign-country reference, or base-game
> attribution — enumerated in the ledger below.

## Scope (what "localization" meant here)

The design doc's §L is "a global pass for tone/terminology: Spanish names, diacritics, party
colours, date formats, and removing residual German strings," plus a language-policy decision that
was **already settled** by every content area — *English narration with Spanish proper nouns*, not a
full translation. So L **applied** that policy; it did not re-translate. The recon-shaping fact: a
raw `weimar|reichstag|prussia|hindenburg|nazi` grep hit ~35 files, but almost all hits were
out-of-scope (kept keys, dead code, or legitimate foreign references). The genuine live residue was
small and concentrated.

## Execution status

- **L-0 (recon + baseline):** ✅ done. Re-confirmed the three out-of-scope buckets (kept keys /
  dead scenes / legit foreign refs) vs the one live centrepiece (the library's German prose).
  Confirmed the five retired cards are `view-if: 0` and only self-referenced; confirmed `modinfo`
  and `credits` are reached from the root menu. Baseline `BUILD OK` → `SMOKE PASSED` (8).

- **L-1 (library prose):** ✅ done. `library.scene.dry`'s `@government` and `@weimar_timeline` were
  the last substantial live German prose (the Library is reachable). Converted, keeping the
  sub-scene IDs: the intro + `@menu` labels → the Spanish Republic; **`@government`** → the 1931
  Spanish Constitution's system (single-chamber Cortes; the *premio de mayoría* majority-bonus
  electoral law; President Alcalá-Zamora elected indirectly by deputies + *compromisarios* with the
  Article 81 twice-per-term dissolution power; a Prime Minister and cabinet responsible to the
  Cortes; Catalan autonomy via the Generalitat, replacing Prussia); **`@weimar_timeline`** → a PSOE
  road-to-the-Republic timeline (PSOE 1879, UGT 1888, the 1909 Tragic Week, the 1917 general
  strike, the 1921 PCE split + the Annual disaster, the Primo de Rivera dictatorship and the UGT's
  accommodation, the 1930 Pact of San Sebastián, and the 14 April 1931 proclamation).

- **L-2 (purge dead cards):** ✅ done. `git rm`'d the five `view-if: 0`, only-self-referenced
  retired German cards: `red_general`, `deport_hitler`, `shuffle_cabinet`,
  `dealing_with_toleration_cvp`, `dealing_with_toleration_right`. The compiler's reference
  resolution self-checked the deletion (no dangling refs; smoke's dangling-go-to guard still green).

- **L-3 (modinfo + credits):** ✅ done. `modinfo.scene.dry` was a 484-line German "Mod Info" page
  live in the root menu (and pushed onto new players before Start): a German FAQ, a 240-line German
  party-paths flowchart (`@paths`, referenced by `game_over`), a changelog, a Discord link, and a
  Weimar-history bibliography + New Order soundtrack credits. Rewrote it as a compact Spanish
  **"About"** page (what the conversion is; the internal-faction/alliance framing; a Credits section
  keeping Autumn Chen's attribution and citing the standard Second-Republic historiography).
  Relabelled the root-menu entries "Mod Info" → "About", and removed the now-dangling
  `@modinfo.paths` link from `game_over`. `credits.scene.dry` (the in-game academic bibliography of
  the original's sources) is legitimate base-game attribution and left as-is per the light-touch
  guardrail.

- **L-4 (consistency sweep):** ✅ done. **Party colours** used two schemes — the deliberately-Spanish
  status HUD (PCE `#8a0303`, CEDA `#0087DC`, Falange `#14322a`, IR `#7B2D8E`, PRR `#E8B23A`) vs the
  content files, which kept leftover German colours (PCE in the old KPD `#700000`, CEDA `#003755`,
  Falange in the literal NSDAP-brown `#7A3C00`, IR `#4a7d3a`, PRR `#d9a441`). Standardized on the
  HUD palette via a **span-text-keyed** transform (rewrites the hex only inside
  `<span style="color:#..">TEXT</span>` spans whose text is *exactly* a party name — so the shared
  `#700000`, which is also the UGT colour, and generic "the right"/"communists" spans are never
  touched): 162 spans across 37 files. Then cleared the last live `#7A3C00` from three files where
  it coloured "Falangists"/"fascism"/"far-right". **Diacritics** were already clean (Areas E/I were
  careful); the `Zamora`/`Leon Trotsky` grep hits were correct-unaccented or dead-block German.

- **L-5 (verification + docs):** ✅ done — this document, plus `CLAUDE.md` and the design doc §L.
  Final sweep confirms zero German prose on the live library/status/modinfo screens; headless load
  clean; `BUILD OK` → `SMOKE PASSED` (8) throughout.

## Ledger — German tokens that legitimately remain (and why)

1. **Kept variable & scene-ID keys** — `reichswehr_*`, `prussia_*`, `hindenburg_angry`,
   `nazi_urgency`, `confronting_nazis`, `iron_front_formed`, `chancellor`, the `_r`/`_relation`
   concatenation keys, scene filenames. Invisible to players and load-bearing; renaming them is the
   high-risk/zero-gain move the content-debt boundary forbids (same call as the 213 election
   sub-scene IDs). **Not touched, by design.**
2. **Dead German JS blocks** — the inert German computation in `post_event.scene.dry`,
   `main.scene.dry`, and `election_1928.scene.dry` (already flagged F/H/H2 debt); the `#7A3C00`
   NSDAP colour there still legitimately colours real NSDAP references in dead code.
3. **Legitimate foreign-country references** — `foreign_policy.scene.dry` ("Nazi Germany watches
   events in Spain"; "Fascist Italy") and `labor_rights.scene.dry` ("Germany's unemployment
   insurance system" as a comparison). Correct 1930s Spanish-perspective content, not residue.
4. **Base-game attribution** — references to *Social Democracy: An Alternate History* and Autumn
   Chen in `modinfo` (the About page), `game_over`, `credits`, `info.dry`, and `package.json`.
   Legitimate credit to the work this is built on; the smoke test already allows the old title in
   attribution positions.

## Deferred / out of scope
- **Variable & scene-ID key renames** — kept (content-debt boundary).
- **A full Spanish translation** — the policy is English-with-Spanish-nouns; a real localization is
  a separate, larger effort the design doc de-prioritizes.
- **A full Spanish bibliography** for `credits.scene.dry` — light-touch only; the academic
  bibliography is legitimate base-game attribution.
- **Area M (balancing)** — the last remaining area: re-tuning election baselines, the
  coup/insurrection clocks, faction-drift rates, and the July-1936 trigger conditions.
