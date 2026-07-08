# Area K — Asset Manifest

Authoritative list of every non-achievement image reference in `source/scenes/`, tiered per the
plan. Built by scanning all `.dry` files for `img/...` path literals (209 distinct total; 127 are
`img/achievement/*`, deferred; **82 in scope for Area K**).

Legend: **T1** = named-figure portrait (source from Wikimedia by name) · **T2** = topical/poster/
event (source a Spanish-subject equivalent where a clean PD image exists, else placeholder) ·
**T3** = era-neutral texture/UI (leave as-is) · **OUT** = out of scope (retired card, or the
flagged `status.scene.dry`/`status_right.scene.dry` "camarilla" panel debt — reachability
unresolved since H2, not part of the advisor/policy-card system Area K targets).

## Tier 1 — named-figure portraits → `img/es/leaders/<slug>.jpg`

| Current path | Referencing scene(s) | Spanish figure | Target slug |
|---|---|---|---|
| `img/portraits/WelsOtto.jpg` | advisors/wels, shuffle_leadership | Julián Besteiro | `besteiro` |
| `img/portraits/WelsRudolf.jpg` | shuffle_leadership (dup path) | Julián Besteiro | `besteiro` (same file) |
| `img/portraits/MüllerHermann.jpg` | advisors/muller, shuffle_leadership | Andrés Saborit | `saborit` |
| `img/portraits/HilferdingRudolf.jpg` | advisors/hilferding, fiscal_policy, economic_democracy, shuffle_leadership | Juan Negrín | `negrin` |
| `img/portraits/WoytinskyWladimir.jpg` | advisors/woytinsky, shuffle_leadership | Trifón Gómez | `trifon_gomez` |
| `img/portraits/BaadeFritz.jpg` | advisors/baade, agricultural_policy, shuffle_leadership | Lucio Martínez Gil | `martinez_gil` |
| `img/portraits/LeipartTheodor.jpg` | advisors/leipart, shuffle_leadership | Francisco Largo Caballero | `largo_caballero` |
| `img/portraits/WissellRudolf.jpg` | advisors/wissell, labor_affairs, labor_rights, shuffle_leadership | Manuel Cordero | `cordero` |
| `img/portraits/AufhäuserSiegfried.jpg` | advisors/aufhauser, shuffle_leadership | Anastasio de Gracia | `de_gracia` |
| `img/portraits/RadbruchGustav.jpg` | advisors/radbruch, judiciary, constitutional_reform, shuffle_leadership | Fernando de los Ríos | `de_los_rios` |
| `img/portraits/HirschfeldMagnus.jpg` | advisors/hirschfeld, shuffle_leadership | Gregorio Marañón | `maranon` |
| `img/hirschfeld.jpg` | homosexual_rights (card's own image) | Gregorio Marañón | `maranon` (same file) |
| `img/portraits/BreitscheidRudolf.jpg` | advisors/breitscheid, shuffle_leadership | Rodolfo Llopis | `llopis` |
| `img/portraits/LeberJulius.jpg` | advisors/leber, shuffle_leadership | Juan-Simeón Vidarte | `vidarte` |
| `img/portraits/StampferFriedrich.jpg` | advisors/stampfer, shuffle_leadership | Julián Zugazagoitia | `zugazagoitia` |
| `img/portraits/JuchaczMarie.jpg` | advisors/juchacz, shuffle_leadership | Julia Álvarez Resano | `alvarez_resano` |
| `img/portraits/MierendorffCarlo.jpg` | advisors/mierendorff, shuffle_leadership | Ramón González Peña | `gonzalez_pena` |
| `img/portraits/SchumacherKurt.jpg` | advisors/schumacher, shuffle_leadership | Amaro del Rosal | `del_rosal` |
| `img/portraits/BraunOtto.jpg` | advisors/braun, shuffle_leadership | Rafael Vidiella | `vidiella` |
| `img/portraits/SeveringCarl.jpg` | advisors/severing, police, shuffle_leadership | Ángel Galarza | `galarza` |
| `img/portraits/RosenfeldKurt.jpg` | advisors/rosenfeld, shuffle_leadership | Luis Araquistáin | `araquistain` |
| `img/portraits/SenderToni.jpg` | advisors/sender, shuffle_leadership | Margarita Nelken | `nelken` |
| `img/portraits/SeydewitzMax.jpg` | advisors/seydewitz, shuffle_leadership | Santiago Carrillo | `carrillo` |
| `img/portraits/SiemsenAnna.jpg` | advisors/siemsen, shuffle_leadership | María Lejárraga | `lejarraga` |
| `img/portraits/LeviPaul.jpg` | advisors/levi, shuffle_leadership | Julio Álvarez del Vayo | `alvarez_del_vayo` |
| `img/portraits/PfülfAntonie.jpg` | advisors/pfulf, shuffle_leadership | Matilde de la Torre | `de_la_torre` |
| `img/portraits/wirth.jpg` | advisors/wirth, shuffle_leadership | Toribio Echevarría | `echevarria` |
| `img/portraits/SchmidtRobert.jpg` | economic_policy, main.scene.dry (`@eco`), advisors/economic_policy_pinned | Indalecio Prieto | `prieto` |
| `img/portraits/EinsteinAlbert.jpg` | education_science | Blas Cabrera (JAE physicist) | `blas_cabrera` |
| `img/portraits/BrüningHeinrich.jpg` | dealing_with_toleration (+2 retired variants) | Manuel Azaña | `azana` |

29 target files (WelsOtto/WelsRudolf share one; hirschfeld.jpg/HirschfeldMagnus.jpg share one) →
**28 distinct figures** (recount at K-2 execution time; the plan's original estimate of 27 was off
by one).

**K-2 result:** 25/28 sourced with a redistributable-license Commons photo + recorded provenance
(see `K_assets.md`'s K-2 status). **3 have no free lead image on es/en Wikipedia and fall back to
`img/placeholder.jpg` at K-4:** `martinez_gil` (Lucio Martínez Gil), `vidarte` (Juan-Simeón
Vidarte), `alvarez_resano` (Julia Álvarez Resano).

## Tier 2 — topical/poster/event → `img/es/{events,parties}/<slug>.*` (source if clean PD exists, else placeholder)

| Current path | Referencing scene(s) | Spanish-subject target |
|---|---|---|
| `img/reichstag_1.jpg` | war_guilt (Comisión de Responsabilidades) | Palacio de las Cortes (building) |
| `img/reichstag_2.jpg` | main.scene.dry (`@govt` deck icon) | Palacio de las Cortes (building) |
| `img/muller_cabinet.jpg` | advisors/cabinet, shuffle_cabinet (retired), coalition_affairs | A Council-of-Ministers / Cortes chamber photo |
| `img/iron_front.png` | party_affairs/iron_front, confronting_nazis (now "Alianza Obrera") | Alianza Obrera poster/image |
| `img/reichsbanner.jpg` | party_affairs/reichsbanner (now "UGT Militia") | UGT militia image |
| `img/vorwarts_2.jpg` | shuffle_leadership, shuffle_leadership_pinned | *El Socialista* masthead or PSOE HQ (Casa del Pueblo, Madrid) |
| `img/Vorwaerts_nr_1.png` | main.scene.dry (party-affairs deck icon, decorative) | *El Socialista* masthead |
| `img/Mann_der_Arbeit.jpg` | party_organizations | UGT/Casa del Pueblo image |
| `img/Reichstagsfraktion_der_SPD.jpg` | party_disunity | PSOE Cortes parliamentary-group photo |
| `img/arbeiterbew.jpg` | ideology (Questions of Ideology) | PSOE/UGT rally or congress photo |
| `img/blutmai_2.jpg` | streetfighting | 1934 Asturias rising or Casas Viejas photo |
| `img/sangerbund.jpg` | media | *El Socialista* newsroom/press image |
| `img/poster_0.jpg` | peoples_party, catalan_affairs | Republican/Catalan-statute poster |
| `img/poster_1.png` | cnt_relations, enemies | CNT-FAI or PSOE poster |
| `img/poster_2.jpg` | fundraising, religious_policy | Republican poster |
| `img/weimar_coalition_2.jpg` | inter_party_relationships | Cortes chamber / coalition photo |
| `img/weimar_coalition_3.jpg` | weimar_rally (live, "Republican Coordination" — Area F) | Cortes/rally photo |
| `img/bankrun.jpg` | crisis_program (Economic Crisis) | keep if generic-looking; else a Spanish bank-run/depression photo |
| `img/international.jpg` | international_relations | Labour and Socialist International congress photo, or keep generic |
| `img/protest.jpg` | rubicon_filler | generic protest photo — likely fine to keep (confirm not overtly German) |

19 items; several will likely resolve to "keep, it's generic enough" on inspection (guardrail: only
replace what's actually identifiable as German).

**K-3 result:** visual inspection (not just filename guessing) confirmed `reichstag_1.jpg`,
`reichstag_2.jpg`, `blutmai_2.jpg`, and `protest.jpg` are unmistakably German (Reichstag eagle
crest, German banner text, German shop signage, the Berlin Cathedral) and sourced replacements for
all four: `img/es/events/cortes_exterior.jpg`, `img/es/events/casas_viejas.jpg`,
`img/es/events/asturias_1934.jpg` (period photos, verified on-subject), plus a bonus find,
`img/es/events/popular_front_rally.png` (the actual 17 Feb 1936 *La Voz* front page). `international.jpg`
was inspected and confirmed *not* German-specific (the 1864 First International emblem — PSOE/UGT
are genuinely descended from it) — reclassified to Tier 3, kept as-is. **The other 15 Tier-2 items
remain unsourced** (`muller_cabinet`, `iron_front`, `reichsbanner`, `vorwarts_2`/`Vorwaerts_nr_1`,
`Mann_der_Arbeit`, `Reichstagsfraktion_der_SPD`, `arbeiterbew`, `sangerbund`, `poster_0/1/2`,
`weimar_coalition_2/3`, `bankrun`) — Wikipedia-pageimage lookup doesn't cleanly resolve
posters/mastheads/named-cabinet-group-photos; these fall back to `img/placeholder.jpg` at K-4,
flagged for a future manual Commons-browsing pass.

## Tier 3 — era-neutral, leave as-is (no sourcing, no repoint)

`img/paper.jpg`, `img/map_2.jpg`, `img/black.jpg`, `img/hourglass.jpg`, `img/flags.jpg`,
`img/street.jpg`, `img/steady.png`, `img/arrowup.png`, `img/arrowdown.png`,
`img/placeholder.jpg`, `img/portraits/placeholder.jpg`.

## Out of scope

- **`img/achievement/*`** (127 files, 381 `<img>` refs in `game_over.scene.dry`) — deferred per
  plan to a dedicated achievements follow-up.
- **`status.scene.dry` / `status_right.scene.dry`'s "camarilla" portrait panel**
  (`SchleicherKurt.jpg`, `PapenFranz.jpg`, `Meissner.jpg`, `Treviranus.jpg`, `bredow.jpg`,
  `bumke.jpg`, `goerdeler.jpg`, `goring.jpg`, `hammerstein.jpg`, `hindenburger.jpg`,
  `hitler2.jpg`, `oskar.jpg`, `schleicher_cooler.jpg`, `seeckt.jpg`, `stegerwald.jpg`,
  `strasser.jpg`, `capitalism.jpg`, `dnvp_monarchy.jpg`, `beauty_of_labor.jpg`) — this whole panel
  is flagged in `H2_bulk_cleanup.md` as substantially unconverted German content of **unresolved
  reachability** (needs interactive browser testing this tooling can't do). Area K does not touch
  it; consistent with every prior area's precedent of leaving it untouched rather than guessing.
- **`img/portraits/schleicher.jpg`** — only referenced by `red_general.scene.dry`, retired
  (`view-if: 0`, Area G-5). Dead, no work needed.
- **`img/Rothe_Wahlen_1903.jpg`** — only referenced via a commented-out `#face-image:` in
  `election_1928.scene.dry`. Inert.
- **`credits.scene.dry`** — a catalog/credits page listing asset filenames; updates itself
  naturally once `credits_images.txt` is populated (K-5); not a card needing a portrait swap.
