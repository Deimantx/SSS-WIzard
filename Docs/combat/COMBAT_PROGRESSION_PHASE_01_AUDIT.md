# Combat Progression Phase 01 Audit

## Scope and result

Runtime inventory was read from `COMBAT_LOCATION_ORDER` and `COMBAT_LOCATIONS` in `src/game/content/combat-locations`. The repository contains exactly 33 unique authored runtime locations (the expected 33 is correct), 220 monsters overall, and no missing location IDs. Existing encounter classes are 13 `combat-zone`, 8 `elite-zone`, 3 `hunting-ground`, and 9 `dungeon`.

The requested 20/5/5 shape is not representable by the existing content without changing encounter semantics: only three locations have Hunter's Order ground content, while four dungeons beyond the five-tier spine have authored sequences, unique bosses, and progression requirements. Relabeling two dungeons as Hunting Grounds would make the count fit while breaking their authored role. Phase 01 therefore establishes a typed target-tier model for all locations, retains IDs and runtime behavior, and records the content gap rather than silently fabricating/reclassifying locations. The model exposes four combat-zone slots per tier and the five dungeon gates. Hunting-ground slots exist only for the three authored grounds; T4/T5 are deliberately empty. This is a migration boundary, not completion of the requested 20/5/5 content audit.

## Location inventory and mapping

“Theme” reports `primaryElement` where authored, otherwise the roster is mixed. Normal enemy IDs are listed in roster order; boss is shown separately. Current unlocks are summarized from the central unlock condition. Target type/tier come from `progression` metadata. Target tier is a Phase 01 recommendation; it does not rewrite current unlock conditions.

| # | Current ID | Current name | Current type | Theme | Current unlock | Enemies (count; IDs) | Boss | Target tier / type / role | Action and notes |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `stonewake-hollow` | Stonewake Hollow | combat-zone | earth | Starter advantage or tutorial zones event | 4: stonewake-gravel-wisp, stonewake-rootback-crawler, stonewake-shardhide-golem, stonewake-stonebound-warden | heartstone-colossus | T1 / combat-zone / standard | Keep; Earth opening lane. |
| 2 | `galecrest-heights` | Galecrest Heights | combat-zone | air | Starter advantage or tutorial zones event | 4: galecrest-zephyr-wisp, galecrest-gale-imp, galecrest-razorwing, galecrest-stormcaller-adept | tempest-roc | T1 / combat-zone / standard | Keep; Air opening lane. |
| 3 | `tideglass-caverns` | Tideglass Caverns | combat-zone | water | Starter advantage or tutorial zones event | 4: tideglass-tide-wisp, tideglass-reef-crawler, tideglass-current-serpent, tideglass-drowned-channeler | deepwater-oracle | T1 / combat-zone / standard | Keep; Water opening lane. |
| 4 | `emberfall-basin` | Emberfall Basin | combat-zone | fire | Starter advantage or tutorial zones event | 4: emberfall-ember-wisp, emberfall-ashling, emberfall-flame-hound, emberfall-ashen-adept | pyre-guardian | T1 / combat-zone / standard | Keep; Fire opening lane. |
| 5 | `whispering-woods` | Whispering Woods | combat-zone | mixed | First tutorial boss event or Forest Heart kill | 7: forest-wisp, thornling, dewbound-sprite, cinder-moth, stone-root, grove-sentinel, tempest-stag | forest-heart | T2 / combat-zone / standard | Keep; mixed roster and forest milestone. Chronicle/tutorial dependency. |
| 6 | `brineveil-marsh` | Brineveil Marsh | combat-zone | mixed | Forest Heart kill | 7: mirefin-lurker, brinefang-eel, tidebloom-warden, fenwater-hexer, saltglass-crab, runesunk-oracle, mistwing-skimmer | moonwake-leviathan | T2 / combat-zone / standard | Keep; expansion combat area; boss unlock anchor. |
| 7 | `howling-den` | Howling Den | elite-zone | mixed | Forest Heart kill | 6: cavefang-wolf, razorclaw-lynx, corrupted-dire-wolf, bonehide-boar, moonblind-jackal, den-stalker | corrupted-greatbear | T1 / special / special | Keep outside lane matrix; unique boss unlocks Hunting Order and other branches. |
| 8 | `mistclaw-highlands` | Mistclaw Highlands | hunting-ground | mixed | Corrupted Greatbear kill | 7: mistclaw-lynx, stormhorn-elk, razorwing-kite, riverhide-boar, cloudwater-serpent, runemark-stag, slateback-yak | none | T2 / hunting-ground / hunting | Keep; Hunter's Order authored ground. |
| 9 | `hunters-ground` | Gloamridge | hunting-ground | mixed | Corrupted Greatbear kill | 7: ashen-tracker, gloamfang-stalker, runehorn-brute, veilwing-harrier, cinderback-mauler, gloomroot-hexer, nightglass-alpha | none | T1 / hunting-ground / hunting | Keep; default Hunter's Order ground and save-stable ID. |
| 10 | `abandoned-catacombs` | Abandoned Catacombs | dungeon | mixed | Corrupted Greatbear kill | 3: restless-skeleton, grave-wraith, fallen-acolyte | archmage-edrin-shade | T1 / dungeon / dungeon | Keep; tutorial sequence. First-clear unlocks Black Portal/Dark Portal, World Tier 2, Cinderwild, Fractured Approach, and school-cap increase. Proposed T2 gate. |
| 11 | `cinderwild-expanse` | Cinderwild Expanse | combat-zone | mixed | Archmage Edrin's Shade kill | 7: ashclaw-jackal, emberhide-ram, cinderwing-hawk, magma-tick, pyrebark-treant, stormsmoke-imp, sootbound-augur | furnace-maw | T2 / combat-zone / standard | Keep; expansion zone. |
| 12 | `fractured-approach` | Fractured Approach | dungeon | mixed | Archmage Edrin's Shade kill | 4: warded-husk, rift-wolf, arcane-scavenger, withered-watcher | corrupted-elemental-gatekeeper | T2 / dungeon / dungeon | Keep; first elemental gatekeeper. First-clear unlocks Summoning and four elemental areas. Proposed T3 gate. |
| 13 | `skybreak-cliffs` | Skybreak Cliffs | combat-zone | mixed | Corrupted Elemental Gatekeeper kill | 7: razorwind-raptor, galehorn-ibex, cloudmaw-drake, stormfeather-harrier, whistling-wraith, raincoil-serpent, cindercrest-roc | tempest-sovereign | T2 / combat-zone / standard | Keep; boss unlock anchor for Stormspire Monastery. |
| 14 | `flooded-reliquary` | Flooded Reliquary | combat-zone | mixed | Corrupted Elemental Gatekeeper kill | 7: drowned-acolyte, reliquary-slime, mist-wraith, rune-leech, tidefang-serpent, brinebound-sentinel, abyssal-archivist | drowned-keeper | T3 / combat-zone / standard | Keep; boss is a Crossroads progression prerequisite. |
| 15 | `ashen-watch` | Ashen Watch | combat-zone | mixed | Corrupted Elemental Gatekeeper kill | 7: cinder-hound, ash-cultist, fire-elemental, lava-eel, emberwing-harrier, charred-warden, pyre-colossus | flamebound-revenant | T3 / combat-zone / standard | Keep; boss is a Crossroads progression prerequisite. |
| 16 | `rootscar-hollow` | Rootscar Hollow | combat-zone | mixed | Corrupted Elemental Gatekeeper kill | 7: thorn-maw, rootbound-stalker, briar-sprite, moss-carapace, sporeback-brute, vinebound-reaver, scarwood-behemoth | rootscar-ancient | T3 / combat-zone / standard | Keep; boss is a Crossroads progression prerequisite. |
| 17 | `crossroads-of-ruin` | Crossroads of Ruin | dungeon | mixed | Drowned Keeper, Flamebound Revenant, and Rootscar Ancient kills | 4: remnant-marauder, arcane-binder, broken-construct, rift-archer | crossroads-keeper | T3 / dungeon / dungeon | Keep; first-clear unlocks World Tier 3, Crystals, and next branch areas. Proposed T4 gate. |
| 18 | `runeblight-expanse` | Runeblight Expanse | combat-zone | arcane | Crossroads Keeper kill | 7: leybound-husk, prism-stalker, runic-parasite, echo-knight, aether-maw, frostscript-adept, emberglyph-adept | unmade-magister | T3 / combat-zone / standard | Keep; Arcane roster/theme is authored, so `arcane` is valid metadata. |
| 19 | `graveglass-hollow` | Graveglass Hollow | elite-zone | mixed | Crossroads Keeper kill | 7: graveglass-shade, bone-shardling, silent-mourner, crypt-guardian, epitaph-weaver, tombglass-reaver, ossuary-oracle | graveglass-behemoth | T4 / combat-zone / standard | Keep; preserve elite encounter mechanics; boss gates Broken Meridian. |
| 20 | `cinderhex-barrens` | Cinderhex Barrens | hunting-ground | mixed | Unmade Magister kill | 7: hexjaw-hyena, runehide-scavenger, glasshorn-beast, ashmane-lion, emberback-rhino, dustshell-tortoise, galeclaw-vulture | none | T3 / hunting-ground / hunting | Keep; Hunter's Order ground; unlocked through Arcane branch. |
| 21 | `stormvault-gallery` | Stormvault Gallery | combat-zone | mixed | Crossroads Keeper kill | 7: volt-wisp, gale-scribe, charged-seeker, thundercoil-serpent, static-armor, stormbound-curator, tempest-engine | storm-archivist | T4 / combat-zone / standard | Keep; boss gates Broken Meridian. |
| 22 | `starfallen-observatory` | Starfallen Observatory | elite-zone | mixed | Crossroads Keeper kill | 7: starbound-eye, astral-husk, orbiting-fragment, lenskeeper-remnant, comet-wraith, voidglass-custodian, zenith-horror | fallen-astromancer | T4 / combat-zone / standard | Keep; preserve elite encounter mechanics; boss gates Broken Meridian. |
| 23 | `broken-meridian` | The Broken Meridian | dungeon | mixed | Graveglass Behemoth, Storm Archivist, and Fallen Astromancer kills | 4: meridian-warden, fractured-channeler, arc-surge-horror, linebreaker-shade | meridian-splitter | T4 / dungeon / dungeon | Keep; first-clear unlocks World Tier 4 and Crystals. Proposed T5 gate. |
| 24 | `hall-of-unbound-names` | Hall of Unbound Names | elite-zone | mixed | Meridian Splitter kill | 7: name-eater, bound-echo, hollow-liturgist, whisper-archivist, nameless-cantor, oathless-confessor, unwritten-hierophant | unspoken-prelate | T4 / combat-zone / standard | Keep; preserve elite encounter mechanics; boss gates Black Gate. |
| 25 | `vault-of-the-black-sigil` | Vault of the Black Sigil | elite-zone | mixed | Meridian Splitter kill | 7: black-seal-parasite, inkbound-specter, sigil-guardian, vault-devourer, sealbound-custodian, blackscript-colossus, voidseal-arbiter | sigil-warden | T5 / combat-zone / standard | Keep; preserve elite encounter mechanics; boss gates Black Gate. |
| 26 | `black-gate` | The Black Gate | dungeon | mixed | Unspoken Prelate and Sigil Warden kills | 4: gatebound-remnant, black-rift-stalker, portalbound-acolyte, sealbreaker-construct | black-gatekeeper | T5 / dungeon / dungeon | Keep; World Tier 5 first-clear milestone. |
| 27 | `pyrehold-bastion` | Pyrehold Bastion | elite-zone | mixed | Furnace Maw kill | 7: furnace-guard, molten-penitent, ashen-duelist, brandkeeper, cinder-apostle, steamvein-marauder, smokeveil-assassin | pyrehold-castellan | T5 / combat-zone / standard | Keep; later boss branch; retain zone affix. |
| 28 | `abyssal-reservoir` | Abyssal Reservoir | elite-zone | mixed | Moonwake Leviathan kill | 7: depthbound-knight, pressure-wraith, brine-hulk, glassfin-horror, undertow-priest, nullwater-scribe, stormcurrent-hunter | drowned-regent | T5 / combat-zone / standard | Keep; later boss branch; retain zone affix. |
| 29 | `scalding-rift` | Scalding Rift | elite-zone | mixed | Pyrehold Castellan and Drowned Regent kills | 7: scaldspawn, furnace-serpent, redsteam-reaver, boilborn-slime, pressure-eel, vaporbound-siren, brineforged-brute | steam-tyrant | T5 / combat-zone / standard | Keep; convergence branch; retain zone affix. |
| 30 | `cinder-sepulcher` | Cinder Sepulcher | dungeon | mixed | Pyrehold Castellan kill | 4: emberbound-dead, furnace-acolyte, basalt-guardian, ashen-archivist | sepulcher-flamekeeper | T5 / special / special | SPECIAL_KEEP; extra dungeon with unique sequence and boss. |
| 31 | `temple-of-the-sunken-bell` | Temple of the Sunken Bell | dungeon | mixed | Drowned Regent kill | 4: bell-drowned-monk, tidal-reliquary-guard, coralbound-sentinel, squall-priest | deep-bell-saint | T5 / special / special | SPECIAL_KEEP; extra dungeon with unique sequence and boss. |
| 32 | `stormspire-monastery` | Stormspire Monastery | dungeon | mixed | Tempest Sovereign kill | 4: zephyr-disciple, skychain-sentinel, stonebell-keeper, rainveil-monk | abbot-ninth-gale | T5 / special / special | SPECIAL_KEEP; extra dungeon with unique sequence and boss. |
| 33 | `nullstone-archive` | Nullstone Archive | dungeon | arcane | Steam Tyrant and Unmade Magister kills | 4: null-scribe, obsidian-custodian, runeplate-golem, emberseal-keeper | closed-index | T5 / special / special | SPECIAL_KEEP; extra dungeon with unique sequence and boss; Arcane is present. |

Inventory count: **33 current locations found; 33 mapped; 0 unmapped; no duplicate IDs.** The table's “target” reflects the new metadata: 20 combat-zone slots, 3 authored Hunting Grounds, 5 dungeon gates, and 5 special locations. Thus it explicitly identifies a two-ground shortfall and two excess special dungeons compared with the requested 20/5/5/3 target. The content audit does not claim the quota is satisfied.

## Proposed T1-T5 matrix

| Tier | Four target combat-zone slots (authored theme) | Hunting Ground | Dungeon gate |
|---|---|---|---|
| T1 | Stonewake Hollow (Earth); Galecrest Heights (Air); Tideglass Caverns (Water); Emberfall Basin (Fire) | Gloamridge | Abandoned Catacombs |
| T2 | Whispering Woods (mixed); Brineveil Marsh (mixed); Cinderwild Expanse (mixed); Skybreak Cliffs (mixed) | Mistclaw Highlands | Fractured Approach |
| T3 | Flooded Reliquary (mixed); Ashen Watch (mixed); Rootscar Hollow (mixed); Runeblight Expanse (Arcane) | Cinderhex Barrens | Crossroads of Ruin |
| T4 | Stormvault Gallery (mixed); Graveglass Hollow (mixed); Starfallen Observatory (mixed); Hall of Unbound Names (mixed) | **Unfilled** | The Broken Meridian |
| T5 | Vault of the Black Sigil (mixed); Pyrehold Bastion (mixed); Abyssal Reservoir (mixed); Scalding Rift (mixed) | **Unfilled** | The Black Gate |

Only T1 has four single-element authored zones. T2-T5 rosters mostly lack an authored `primaryElement`, and Arcane is not one of the four core elemental lanes. The metadata records the tier slots without pretending that mixed content satisfies Fire/Earth/Air/Water lane coverage. Elemental lane authoring is a content decision for the next progression-content pass.

### Special / out-of-band decisions

- `howling-den` — **SPECIAL_KEEP**. Unique Greatbear boss; unlock anchor for Gloamridge/Mistclaw, Catacombs and combat branches. It is a distinct elite encounter, not a redundant normal zone.
- `cinder-sepulcher` — **SPECIAL_KEEP**. Separate authored dungeon sequence and boss; no evidence it is redundant.
- `temple-of-the-sunken-bell` — **SPECIAL_KEEP**. Separate authored dungeon sequence and boss; Drowned Regent branch.
- `stormspire-monastery` — **SPECIAL_KEEP**. Separate authored dungeon sequence and boss; Tempest Sovereign branch.
- `nullstone-archive` — **SPECIAL_KEEP**. Separate authored dungeon sequence, boss, and multi-boss prerequisite.

There are five special candidates under the safe mapping, not three. The two additional Hunting Grounds needed to reduce this to the requested three specials do not exist in current Hunter's Order definitions. Do not convert existing dungeons into grounds or retire unique content to force the count.

## Unlock model and dependencies

Progression metadata recommends Abandoned Catacombs clear for T2, Fractured Approach for T3, Crossroads of Ruin for T4, and Broken Meridian for T5. This expresses the desired major-gate chain; **the runtime unlock evaluator still uses each location's existing authored `unlock` tree**, because current first-clear rewards, Chronicle flags, boss kills, and branch unlocks are coupled. The metadata's `requiredDungeonClear` is descriptive/preparatory and is not yet consulted by `isCombatLocationUnlocked`. The four existing starter zones keep their starter-advantage/tutorial unlocks. The three grounds retain existing boss-kill requirements. No Hunter rank numbers are assigned: `src/game/content/hunters-order/hunterGrounds.ts` uses standing IDs (`tracker-1` etc.), not a tier-to-rank contract.

Dependencies found:

- **Combat/runtime**: `combat-locations/worldNavigation.ts`, encounter systems, targeted combat, sequence dungeon handling, elite affix runtime, threat and boss presentation all consume stable IDs and/or the existing encounter `type`.
- **Hunter's Order**: `content/hunters-order/hunterGrounds.ts`, `systems/hunters-order`, navigation intents, contracts, exclusive monster metadata and save data use the three current ground IDs. `hunters-ground` is the default and must remain stable.
- **Dungeons/rewards**: `firstClearUnlockPreview`, dungeon statistics and persistence migration logic use dungeon IDs and bosses. First-clear previews are not the complete unlock model; authored unlock conditions and store actions remain authoritative.
- **Bestiary / content relations**: Bestiary derives monsters from authored rosters; `contentRelations.ts` resolves monster locations and item sources across `COMBAT_LOCATION_ORDER`.
- **Chronicles**: tutorial/event unlock conditions reference elemental starter areas and `hunters-ground`; e.g. `g12-enter-gloamridge` requires entering `hunters-ground`.
- **Arcane Guild**: no location-specific Arcane Guild dependency was found; guild commissions derive available creatures from unlocked location rosters. Arcane combat content exists in Runeblight and Nullstone rosters.
- **Save system**: `combat.locationId`, `autoHuntBossByLocation`, Hunter's Order target IDs, ground contracts, dungeon clear/boss maps and migration helpers persist or normalize IDs. No ID rename or save migration was made.
- **DevTools**: combat encounter and boss controls use `COMBAT_LOCATION_ORDER`; options are data-driven already. No DevTools screen edit was needed.
- **Navigation/UI**: Combat World Navigation reads `COMBAT_LOCATIONS` and current type/unlock view models. Hunter contract navigation selects the contracted ground. Existing categories remain intact.
- **Offline simulation**: location lookup is shared through `COMBAT_LOCATIONS`; no separate location ordering was found in the offline simulation boundary.
- **Tests**: content validation pins total/type counts; combat world navigation, Hunter's Order, structured dungeons, save round-trips/migrations and chronicles have ID-specific coverage.

## Source of truth and migration notes

`src/game/content/combat-locations/combatProgression.ts` now owns the T1-T5 target tier/role assignments. `registry.ts` enriches each runtime location with this metadata, and the shared selectors are exported from `worldNavigation.ts`. Existing `CombatLocationDefinition.type` remains the encounter mechanic discriminator (not a competing progression classification): its `elite-zone` value activates the authored affix system. The metadata classifies seven eligible elite locations as combat-zone slots while preserving their elite combat behavior; Howling Den stays special.

The first migration that applies the tier gates must reconcile unlock conditions rather than simply ANDing `requiredDungeonClear` onto current requirements. It should add focused coverage for gate order/cycles, Hunter rank/standing mapping, every affected Chronicle/guild/save path, and the five special locations. T4/T5 Hunter grounds need authored mixed rosters and Hunter's Order ground entries before they can be exposed. Avoid enemy numerical changes; roster movement is not part of this phase.

No source changes were made to save schemas or stable IDs. Existing persistence tests continue to cover representative serialized combat locations and Hunter contract ground IDs. The metadata is runtime content and does not persist.

## Risks / Phase 02 follow-up

1. Review the suggested element assignments: current mixed rosters do not establish a clean four-element lane at T2-T5.
2. Decide whether the five special locations remain, or author two genuine higher-tier Hunting Grounds and determine which two extra dungeons become special/bonus content.
3. Migrate runtime unlock evaluation to dungeon-clear gates only after reconciling current system unlocks and Chronicle dependencies.
4. Map Hunter's Order standing to T4/T5 grounds from existing rank rules or authored rank changes; this audit intentionally assigns no arbitrary rank numbers.
5. Migrate any UI groupings to metadata in a separate bounded UI change; this phase leaves the current location browser intact.
6. No numerical enemy rebalance, enemy kit redesign, drop/XP/resonance change, or roster movement was performed.
