# Combat Progression Phase 01B Audit

## Result

Phase 01B finalizes the runtime T1–T5 combat map before numerical combat balancing. The stable inventory remains 33 locations and 220 monsters (190 normal enemies and 30 bosses). Progression metadata now resolves to exactly **20 Combat Zones, 5 Hunting Grounds, 5 primary Dungeons, and 3 Special Locations**. Encounter mechanics remain separately authored: locations that use elite affixes still have runtime `type: 'elite-zone'` even when their progression category is Combat Zone.

No HP, Defense, damage, attack speed, cooldown, status magnitude/duration, Threat, XP, loot, Resonance yield/rate, TTK, or kills/hour values were changed.

## Final T1–T5 Matrix

| Tier | Fire | Earth | Air | Water | Hunting Ground | Primary Dungeon |
|---|---|---|---|---|---|---|
| T1 | Emberfall Basin | Stonewake Hollow | Galecrest Heights | Tideglass Caverns | Gloamridge | Abandoned Catacombs |
| T2 | Cinderwild Expanse | Whispering Woods | Skybreak Cliffs | Brineveil Marsh | Mistclaw Highlands | Fractured Approach |
| T3 | Ashen Watch | Rootscar Hollow | Runeblight Expanse | Flooded Reliquary | Cinderhex Barrens | Crossroads of Ruin |
| T4 | Starfallen Observatory | Graveglass Hollow | Stormvault Gallery | Hall of Unbound Names | Cinder Sepulcher | The Broken Meridian |
| T5 | Pyrehold Bastion | Vault of the Black Sigil | Scalding Rift | Abyssal Reservoir | Sunken Bell Grounds | The Black Gate |

Each tier has four elemental Combat Zone slots, one per element. T1–T4 keep strong lane support from their authored rosters and bosses. T5 Earth has three Earth normals and an Earth boss. T5 Air is a thematic hybrid: Scalding Rift has one Air normal, a Fire boss, steam/pressure combat, a Haste effect, and the Frenzied affix; it does not meet the recommended 60–80% roster target. The existing T5 content has no stronger Air candidate without changing a primary dungeon sequence or inventing new content, so this lane assignment is retained as the least disruptive fit and explicitly flagged for review before Phase 02. Names and themes remain intact. No resource-generation or Resonance definitions changed. Existing enemy affinities and boss kits remain authoritative; Runeblight is presented as an Air lane while Arcane enemies and its Arcane boss remain real content.

## Three Special Locations

- **Howling Den** — early optional elite encounter and Corrupted Greatbear milestone; kept as the Hunter’s Order bridge.
- **Stormspire Monastery** — retains its unique sequence and Abbot Ninth Gale boss.
- **Nullstone Archive** — retains its unique sequence, Closed Index boss, and Arcane identity.

The former Cinder Sepulcher and Temple of the Sunken Bell boss fights were moved into primary dungeon sequences. Their location IDs and four normal enemies each remain; the same entries now serve as T4 and T5 Hunting Grounds.

## Changed Location Report

“Old role” and “new role” below refer to progression category; the runtime encounter type is preserved except for the two Hunting Ground conversions. All roster moves are enumerated in the next section. Tier gates are outer requirements. Existing local requirements remain on the primary Dungeons and Specials. Legacy branch unlocks on core Combat Zones above T1 are superseded by their primary dungeon tier gate so all four lanes are available when the tier opens. Hunting Ground access is exactly tier availability plus its authored Hunter standing.

| Location | Old role / tier / element | New role / tier / element | Roster, boss, unlock, Hunter, and save notes |
|---|---|---|---|
| Whispering Woods | Combat Zone / T2 / mixed | Combat Zone / T2 / Earth | Thorn Maw and Rootbound Stalker move in; Tempest Stag moves out. Forest Heart retained. T1 Catacombs clear gates T2. |
| Brineveil Marsh | Combat Zone / T2 / mixed | Combat Zone / T2 / Water | No roster or boss move. Moonwake Leviathan retained. T2 tier gate replaces its old Forest Heart branch condition. |
| Cinderwild Expanse | Combat Zone / T2 / mixed | Combat Zone / T2 / Fire | No roster or boss move. Furnace Maw retained. T2 tier gate replaces its old Catacombs boss condition. |
| Skybreak Cliffs | Combat Zone / T2 / mixed | Combat Zone / T2 / Air | No roster or boss move. Tempest Sovereign retained. T2 tier gate removes its self-tier gatekeeper dependency. |
| Flooded Reliquary | Combat Zone / T3 / mixed | Combat Zone / T3 / Water | No roster or boss move. Drowned Keeper retained. T3 opens after Fractured Approach. |
| Ashen Watch | Combat Zone / T3 / mixed | Combat Zone / T3 / Fire | No roster or boss move. Flamebound Revenant retained. T3 opens after Fractured Approach. |
| Rootscar Hollow | Combat Zone / T3 / mixed | Combat Zone / T3 / Earth | Thorn Maw and Rootbound Stalker move out; Leybound Husk and Prism Stalker move in. RootsCar Ancient retained. |
| Runeblight Expanse | Combat Zone / T3 / Arcane | Combat Zone / T3 / Air | Tempest Stag and four Air-affinity enemies move in; Emberglyph Adept and Frostscript Adept move out. Unmade Magister remains as the Arcane boss; Arcane normal content remains in the game. |
| Stormvault Gallery | Combat Zone / T4 / mixed | Combat Zone / T4 / Air | Bound Echo and Whisper Archivist move in; Graveglass Shade and Bone Shardling move out. Storm Archivist retained. |
| Graveglass Hollow | Combat Zone with Elite encounter mechanics / T4 / mixed | Combat Zone / T4 / Earth | Sigil Guardian, Vault Devourer, and Sealbound Custodian move in. Elite Affix and Graveglass Behemoth retained. |
| Starfallen Observatory | Combat Zone with Elite encounter mechanics / T4 / mixed | Combat Zone / T4 / Fire | Emberglyph Adept, Black Seal Parasite, and Voidseal Arbiter move in. Fallen Astromancer and elite mechanics retained. |
| Hall of Unbound Names | Combat Zone with Elite encounter mechanics / T4 / mixed | Combat Zone / T4 / Water | Frostscript Adept and Steamvein Marauder move in. Unspoken Prelate and elite mechanics retained. |
| Pyrehold Bastion | Combat Zone with Elite encounter mechanics / T5 / mixed | Combat Zone / T5 / Fire | Inkbound Specter moves in. Pyrehold Castellan and elite mechanics retained. |
| Vault of the Black Sigil | Combat Zone with Elite encounter mechanics / T5 / mixed | Combat Zone / T5 / Earth | Depthbound Knight and Pressure Wraith move in; Sigil Warden and the defensive Black Sigil identity support the Earth lane. Elite Affix retained. |
| Scalding Rift | Combat Zone with Elite encounter mechanics / T5 / mixed | Combat Zone / T5 / Air (hybrid; weak roster support) | Stormcurrent Hunter moves in; Boilborn Slime, Pressure Eel, and Redsteam Reaver move out. Steam Tyrant and the Frenzied affix retained. Air is supported by Stormcurrent's Air attacks/Haste and tempo effects, but the roster does not meet the recommended primary-affinity target. |
| Abyssal Reservoir | Combat Zone with Elite encounter mechanics / T5 / mixed | Combat Zone / T5 / Water | Boilborn Slime, Pressure Eel, and Redsteam Reaver move in; Depthbound Knight, Pressure Wraith, and Stormcurrent Hunter move out. Drowned Regent and elite mechanics retained. |
| Cinder Sepulcher | Special sequence dungeon / T5 / mixed | Hunting Ground / T4 / mixed | Same four normal enemies, targeted bossless encounter, always-open local condition. Requires Broken Meridian (tier) plus Veteran I (17,500 reputation). Sepulcher Flamekeeper is now a Broken Meridian sequence boss. ID retained. |
| Temple of the Sunken Bell (displayed as Sunken Bell Grounds) | Special sequence dungeon / T5 / mixed | Hunting Ground / T5 / mixed | Same four normal enemies, targeted bossless encounter, always-open local condition. Requires Broken Meridian (tier) plus Master Hunter I (32,500 reputation). Deep Bell Saint is now a Black Gate sequence boss. ID retained. |
| Fractured Approach | Primary Dungeon / T2 | Primary Dungeon / T2 | Existing sequence and Corrupted Elemental Gatekeeper retained. Existing local boss requirement retained. |
| Crossroads of Ruin | Primary Dungeon / T3 | Primary Dungeon / T3 | Existing sequence and three-boss local requirement retained. |
| The Broken Meridian | Primary Dungeon / T4 | Primary Dungeon / T4 | Existing sequence retained; Sepulcher Flamekeeper is appended as an intermediate boss before Meridian Splitter. Existing local requirements retained. |
| The Black Gate | Primary Dungeon / T5 | Primary Dungeon / T5 | Existing sequence retained; Deep Bell Saint is appended as an intermediate boss before Black Gatekeeper. Existing local requirements retained. |

The four T1 zones and the other unchanged locations retain their authored role, tier, roster, boss, and local unlock behavior: Gloamridge, Howling Den, Mistclaw Highlands, Abandoned Catacombs, Cinderhex Barrens, Stormspire Monastery, and Nullstone Archive. T2–T5 lane metadata is assigned centrally in `combatProgression.ts`; only the roster edits above are made to support those lanes.

## Enemy Moves

All rows below are normal-enemy roster transfers. These are identity-preserving moves; no monster or drop definition was deleted. The T5 Scalding/Abyssal transfers increase the Water pool; Scalding remains a documented Air thematic hybrid rather than a roster-majority Air lane.

| Enemy ID | Old location | New location | Reason |
|---|---|---|---|
| `thorn-maw` | Rootscar Hollow | Whispering Woods | Earth lane |
| `rootbound-stalker` | Rootscar Hollow | Whispering Woods | Earth lane |
| `leybound-husk` | Runeblight Expanse | Rootscar Hollow | Earth lane |
| `prism-stalker` | Runeblight Expanse | Rootscar Hollow | Earth lane |
| `tempest-stag` | Whispering Woods | Runeblight Expanse | Air lane |
| `volt-wisp` | Stormvault Gallery | Runeblight Expanse | Air lane |
| `gale-scribe` | Stormvault Gallery | Runeblight Expanse | Air lane |
| `charged-seeker` | Stormvault Gallery | Runeblight Expanse | Air lane |
| `thundercoil-serpent` | Stormvault Gallery | Runeblight Expanse | Air lane |
| `bound-echo` | Hall of Unbound Names | Stormvault Gallery | Air lane |
| `whisper-archivist` | Hall of Unbound Names | Stormvault Gallery | Air lane |
| `graveglass-shade` | Graveglass Hollow | Stormvault Gallery | Air lane |
| `bone-shardling` | Graveglass Hollow | Stormvault Gallery | Air lane |
| `sigil-guardian` | Vault of the Black Sigil | Graveglass Hollow | Earth lane |
| `vault-devourer` | Vault of the Black Sigil | Graveglass Hollow | Earth lane |
| `sealbound-custodian` | Vault of the Black Sigil | Graveglass Hollow | Earth lane |
| `emberglyph-adept` | Runeblight Expanse | Starfallen Observatory | Fire lane |
| `black-seal-parasite` | Vault of the Black Sigil | Starfallen Observatory | Fire lane |
| `voidseal-arbiter` | Vault of the Black Sigil | Starfallen Observatory | Fire lane |
| `frostscript-adept` | Runeblight Expanse | Hall of Unbound Names | Water lane |
| `steamvein-marauder` | Pyrehold Bastion | Hall of Unbound Names | Water lane |
| `inkbound-specter` | Vault of the Black Sigil | Pyrehold Bastion | Fire lane |
| `depthbound-knight` | Abyssal Reservoir | Vault of the Black Sigil | Earth lane support |
| `pressure-wraith` | Abyssal Reservoir | Vault of the Black Sigil | Earth lane support |
| `stormcurrent-hunter` | Abyssal Reservoir | Scalding Rift | Air/tempo support |
| `boilborn-slime` | Scalding Rift | Abyssal Reservoir | Water lane support |
| `pressure-eel` | Scalding Rift | Abyssal Reservoir | Water lane support |
| `redsteam-reaver` | Scalding Rift | Abyssal Reservoir | Water lane support |

## Boss Moves

| Boss ID | Old location | New location | Reason |
|---|---|---|---|
| `sepulcher-flamekeeper` | Cinder Sepulcher | The Broken Meridian sequence | Convert its former special dungeon to a bossless T4 Hunting Ground while preserving its unique boss in the primary dungeon spine. |
| `deep-bell-saint` | Temple of the Sunken Bell | The Black Gate sequence | Convert its former special dungeon to a bossless T5 Hunting Ground while preserving its unique boss in the primary dungeon spine. |

Both appended bosses count as boss kills and advance the dungeon sequence. Only the final primary boss completes the dungeon. Content Relations and combat audit read models recognize the intermediate boss ownership. No normal enemies were moved into or out of primary dungeon sequences.

## Runtime Unlocks and Hunter’s Order

- T1 is available without a tier clear. T2 opens on Abandoned Catacombs clear; T3 on Fractured Approach clear; T4 on Crossroads of Ruin clear; T5 on The Broken Meridian clear.
- The outer tier gate applies to that tier’s zones, Hunting Ground, and primary Dungeon. Specials keep their authored unlocks and are not mandatory tier progression.
- The four core zones in a tier are not mandatory boss clears. Legacy cross-branch requirements on core zones above T1 are removed to prevent self-tier loops and make the tier’s four lanes available together.
- Primary Dungeon authored local requirements are preserved. This retains the T1 Howling Den unlock path, T3–T5 authored boss checks, first-clear rewards, and system progression.
- Every Hunting Ground also checks Hunter standing via the existing rank registry: Gloamridge Tracker I (0), Mistclaw Highlands Warden I (9,000), Cinderhex Barrens Warden I (9,000), Cinder Sepulcher Veteran I (17,500), and Sunken Bell Grounds Master Hunter I (32,500).
- All five grounds are registered. The T4/T5 grounds each have four valid exclusive contract targets, are bossless, and use targeted encounters; neither uses dungeon sequence behavior. Contract generation continues to filter on actual ground availability and standing.
- The 33 IDs remain stable. Hunter contract ground IDs, selected/last-entered location IDs, Bestiary discovery, boss-clear maps, and Chronicle references remain valid. Save version 66 normalizes active converted-ground saves: an old normal encounter continues as a targeted ground encounter with sequence/Threat state cleared; an active fight against the former local boss is ended safely while its recorded boss kill remains. No ID remapping is needed.

## Validation Coverage

Focused tests cover the 33-ID inventory, exact 20/5/5/3 metadata counts, per-tier four-element lanes, strong T1–T4 lane roster support and the T5 exceptions, five bossless Hunting Grounds and standing thresholds, tier-gate order, sequence-boss ownership, all runtime normal roster uniqueness, Hunter contract eligibility, saved converted-ground encounters, and the Combat navigation categories. Existing location IDs are not removed. Full and focused validation results are recorded in the implementation handoff.

## Source of Truth

Runtime TypeScript remains authoritative: `combatProgression.ts` owns the tier/category/lane matrix, `rosterReassignments.ts` owns explicit enemy transfers, location registries compose final rosters, and Hunter’s Order standing definitions remain centralized. This audit records the approved structure; it is not a generated balance-values mirror.
