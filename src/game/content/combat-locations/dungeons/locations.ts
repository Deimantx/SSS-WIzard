import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const dungeonLocations = {
  "abandoned-catacombs": {
                                "id":  "abandoned-catacombs",
                                "name":  "Abandoned Catacombs",
                                "type":  "dungeon",
                                "progressionOrder":  10,
                                "encounterMode":  "sequence",
                                "description":  "A fixed sequence through the old crypts, ending at Archmage Edrin’s Shade.",
                                "unlock":  {
                                               "type":  "boss-kill",
                                               "bossId":  "corrupted-greatbear",
                                               "count":  1
                                           },
                                "firstClearUnlockPreview":  [
                                                                {
                                                                    "id":  "black-portal-shard",
                                                                    "label":  "Black Portal Shard"
                                                                },
                                                                {
                                                                    "id":  "dark-portal",
                                                                    "label":  "Dark Portal"
                                                                },
                                                                {
                                                                    "id":  "world-tier-2",
                                                                    "label":  "World Tier 2"
                                                                },
                                                                {
                                                                    "id":  "combat-tier-2-zones",
                                                                    "label":  "Combat Tier 2: Fire, Earth, Air and Water Zones"
                                                                },
                                                                {
                                                                    "id":  "tier-2-hunting-ground",
                                                                    "label":  "Mistclaw Highlands requires Hunter’s Order Warden I"
                                                                },
                                                                {
                                                                    "id":  "fractured-approach",
                                                                    "label":  "Fractured Approach"
                                                                },
                                                                {
                                                                    "id":  "magic-school-cap",
                                                                    "label":  "Magic School Cap Increase"
                                                                }
                                                            ],
                                "monsterPool":  [
                                                    "restless-skeleton",
                                                    "grave-wraith",
                                                    "fallen-acolyte"
                                                ],
                                "bossId":  "archmage-edrin-shade",
                                "threatRequired":  30,
                                "encounterDelayMs":  5000,
                                "sequence":  [
                                                 "restless-skeleton",
                                                 "grave-wraith",
                                                 "fallen-acolyte"
                                             ],
                                "completesTutorial":  true
                            },
  "fractured-approach": {
                               "id":  "fractured-approach",
                               "name":  "Fractured Approach",
                               "type":  "dungeon",
                               "progressionOrder":  12,
                               "encounterMode":  "sequence",
                               "firstClearUnlockPreview":  [
                                                               {
                                                                   "id":  "summoning",
                                                                   "label":  "Summoning"
                                                               },
                                                               {
                                                                   "id":  "combat-tier-3-zones",
                                                                   "label":  "Combat Tier 3: Fire, Earth, Air and Water Zones"
                                                               },
                                                               {
                                                                   "id":  "world-tier-3",
                                                                   "label":  "World Tier 3"
                                                               },
                                                               {
                                                                   "id":  "tier-3-hunting-ground",
                                                                   "label":  "Cinderhex Barrens requires Hunter’s Order Warden I"
                                                               }
                                                           ],
                               "monsterPool":  [
                                                   "warded-husk",
                                                   "rift-wolf",
                                                   "arcane-scavenger",
                                                   "withered-watcher"
                                               ],
                               "bossId":  "corrupted-elemental-gatekeeper",
                               "threatRequired":  35,
                               "encounterDelayMs":  5000,
                               "sequence":  [
                                                "rift-wolf",
                                                "arcane-scavenger",
                                                "withered-watcher",
                                                "warded-husk"
                                            ],
                               "unlock":  {
                                              "type":  "boss-kill",
                                              "bossId":  "archmage-edrin-shade"
                                          }
                           },
  "crossroads-of-ruin": {
                               "id":  "crossroads-of-ruin",
                               "name":  "Crossroads of Ruin",
                               "type":  "dungeon",
                               "progressionOrder":  17,
                               "encounterMode":  "sequence",
                               "firstClearUnlockPreview":  [
                                                                {
                                                                    "id":  "combat-tier-4-zones",
                                                                    "label":  "Combat Tier 4: Fire, Earth, Air and Water Zones"
                                                                },
                                                                {
                                                                    "id":  "world-tier-3",
                                                                    "label":  "World Tier 3"
                                                                },
                                                                {
                                                                    "id":  "tier-4-hunting-ground",
                                                                    "label":  "Cinder Sepulcher requires Hunter’s Order Veteran I"
                                                                }
                                                           ],
                               "monsterPool":  [
                                                   "remnant-marauder",
                                                   "arcane-binder",
                                                   "broken-construct",
                                                   "rift-archer"
                                               ],
                               "bossId":  "crossroads-keeper",
                               "threatRequired":  45,
                               "encounterDelayMs":  5000,
                               "sequence":  [
                                                "arcane-binder",
                                                "rift-archer",
                                                "remnant-marauder",
                                                "broken-construct"
                                            ],
                               "unlock":  {
                                              "type":  "all-boss-kills",
                                              "bossIds":  [
                                                              "drowned-keeper",
                                                              "flamebound-revenant",
                                                              "rootscar-ancient"
                                                          ]
                                          }
                           },
  "broken-meridian": {
                            "id":  "broken-meridian",
                            "name":  "The Broken Meridian",
                            "type":  "dungeon",
                            "progressionOrder":  23,
                            "encounterMode":  "sequence",
                            "firstClearUnlockPreview":  [
                                                            {
                                                                "id":  "combat-tier-5-zones",
                                                                "label":  "Combat Tier 5: Fire, Earth, Air and Water Zones"
                                                            },
                                                            {
                                                                "id":  "world-tier-4",
                                                                "label":  "World Tier 4"
                                                            },
                                                            {
                                                                "id":  "tier-5-hunting-ground",
                                                                "label":  "Sunken Bell Grounds requires Hunter’s Order Master Hunter I"
                                                            },
                                                            {
                                                                "id":  "crystals",
                                                                "label":  "Crystals"
                                                            }
                                                        ],
                            "monsterPool":  [
                                                "meridian-warden",
                                                "fractured-channeler",
                                                "arc-surge-horror",
                                                "linebreaker-shade"
                                            ],
                            "bossId":  "meridian-splitter",
                            "threatRequired":  55,
                            "encounterDelayMs":  5000,
                            "sequence":  [
                                             "meridian-warden",
                                             "fractured-channeler",
                                             "arc-surge-horror",
                                             "linebreaker-shade"
                                         ],
                            "unlock":  {
                                           "type":  "all-boss-kills",
                                           "bossIds":  [
                                                           "graveglass-behemoth",
                                                           "storm-archivist",
                                                           "fallen-astromancer"
                                                       ]
                                       }
                        },
  "black-gate": {
                       "id":  "black-gate",
                       "name":  "The Black Gate",
                       "type":  "dungeon",
                       "progressionOrder":  26,
                       "encounterMode":  "sequence",
                       "firstClearUnlockPreview":  [
                                                       {
                                                           "id":  "world-tier-5",
                                                           "label":  "World Tier 5"
                                                       }
                                                   ],
                       "monsterPool":  [
                                           "gatebound-remnant",
                                           "black-rift-stalker",
                                           "portalbound-acolyte",
                                           "sealbreaker-construct"
                                       ],
                       "bossId":  "black-gatekeeper",
                       "threatRequired":  0,
                       "encounterDelayMs":  5000,
                       "sequence":  [
                                        "gatebound-remnant",
                                        "black-rift-stalker",
                                        "portalbound-acolyte",
                                        "sealbreaker-construct"
                                    ],
                       "unlock":  {
                                      "type":  "all-boss-kills",
                                      "bossIds":  [
                                                      "unspoken-prelate",
                                                      "sigil-warden"
                                                  ]
                                  }
                   },
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
