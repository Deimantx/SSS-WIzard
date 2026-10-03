import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const elementalScarLocations = {
    "fractured-approach":  {
                               "id":  "fractured-approach",
                               "name":  "Fractured Approach",
                               "type":  "dungeon",
                               "progressionOrder":  9,
                               "encounterMode":  "sequence",
                               "firstClearUnlockPreview":  [
                                                               {
                                                                   "id":  "summoning",
                                                                   "label":  "Summoning"
                                                               },
                                                               {
                                                                   "id":  "flooded-reliquary",
                                                                   "label":  "Flooded Reliquary"
                                                               },
                                                               {
                                                                   "id":  "ashen-watch",
                                                                   "label":  "Ashen Watch"
                                                               },
                                                               {
                                                                   "id":  "rootscar-hollow",
                                                                   "label":  "Rootscar Hollow"
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
    "flooded-reliquary":  {
                              "id":  "flooded-reliquary",
                              "name":  "Flooded Reliquary",
                              "type":  "combat-zone",
                              "progressionOrder":  10,
                              "encounterMode":  "targeted",
                              "targetMetadata":  {
                                                     "drowned-acolyte":  {
                                                                             "difficulty":  "easy",
                                                                             "order":  1
                                                                         },
                                                     "reliquary-slime":  {
                                                                             "difficulty":  "easy",
                                                                             "order":  2
                                                                         },
                                                     "mist-wraith":  {
                                                                         "difficulty":  "standard",
                                                                         "order":  3
                                                                     },
                                                     "rune-leech":  {
                                                                        "difficulty":  "standard",
                                                                        "order":  4
                                                                    },
                                                     "tidefang-serpent":  {
                                                                              "difficulty":  "standard",
                                                                              "order":  5
                                                                          },
                                                     "brinebound-sentinel":  {
                                                                                 "difficulty":  "hard",
                                                                                 "order":  6
                                                                             },
                                                     "abyssal-archivist":  {
                                                                               "difficulty":  "apex",
                                                                               "order":  7
                                                                           }
                                                 },
                              "monsterPool":  [
                                                  "drowned-acolyte",
                                                  "reliquary-slime",
                                                  "mist-wraith",
                                                  "rune-leech",
                                                  "tidefang-serpent",
                                                  "brinebound-sentinel",
                                                  "abyssal-archivist"
                                              ],
                              "bossId":  "drowned-keeper",
                              "threatRequired":  20000,
                              "encounterDelayMs":  5000,
                              "sequence":  null,
                              "unlock":  {
                                             "type":  "boss-kill",
                                             "bossId":  "corrupted-elemental-gatekeeper"
                                         }
                          },
    "ashen-watch":  {
                        "id":  "ashen-watch",
                        "name":  "Ashen Watch",
                        "type":  "combat-zone",
                        "progressionOrder":  11,
                        "encounterMode":  "targeted",
                        "targetMetadata":  {
                                               "cinder-hound":  {
                                                                    "difficulty":  "easy",
                                                                    "order":  1
                                                                },
                                               "ash-cultist":  {
                                                                   "difficulty":  "easy",
                                                                   "order":  2
                                                               },
                                               "fire-elemental":  {
                                                                      "difficulty":  "standard",
                                                                      "order":  3
                                                                  },
                                               "lava-eel":  {
                                                                "difficulty":  "standard",
                                                                "order":  4
                                                            },
                                               "emberwing-harrier":  {
                                                                         "difficulty":  "standard",
                                                                         "order":  5
                                                                     },
                                               "charred-warden":  {
                                                                      "difficulty":  "hard",
                                                                      "order":  6
                                                                  },
                                               "pyre-colossus":  {
                                                                     "difficulty":  "apex",
                                                                     "order":  7
                                                                 }
                                           },
                        "monsterPool":  [
                                            "cinder-hound",
                                            "ash-cultist",
                                            "fire-elemental",
                                            "lava-eel",
                                            "emberwing-harrier",
                                            "charred-warden",
                                            "pyre-colossus"
                                        ],
                        "bossId":  "flamebound-revenant",
                        "threatRequired":  20000,
                        "encounterDelayMs":  5000,
                        "sequence":  null,
                        "unlock":  {
                                       "type":  "boss-kill",
                                       "bossId":  "corrupted-elemental-gatekeeper"
                                   }
                    },
    "rootscar-hollow":  {
                            "id":  "rootscar-hollow",
                            "name":  "Rootscar Hollow",
                            "type":  "combat-zone",
                            "progressionOrder":  12,
                            "encounterMode":  "targeted",
                            "targetMetadata":  {
                                                   "thorn-maw":  {
                                                                     "difficulty":  "easy",
                                                                     "order":  1
                                                                 },
                                                   "rootbound-stalker":  {
                                                                             "difficulty":  "easy",
                                                                             "order":  2
                                                                         },
                                                   "briar-sprite":  {
                                                                        "difficulty":  "standard",
                                                                        "order":  3
                                                                    },
                                                   "moss-carapace":  {
                                                                         "difficulty":  "standard",
                                                                         "order":  4
                                                                     },
                                                   "sporeback-brute":  {
                                                                           "difficulty":  "standard",
                                                                           "order":  5
                                                                       },
                                                   "vinebound-reaver":  {
                                                                            "difficulty":  "hard",
                                                                            "order":  6
                                                                        },
                                                   "scarwood-behemoth":  {
                                                                             "difficulty":  "apex",
                                                                             "order":  7
                                                                         }
                                               },
                            "monsterPool":  [
                                                "thorn-maw",
                                                "rootbound-stalker",
                                                "briar-sprite",
                                                "moss-carapace",
                                                "sporeback-brute",
                                                "vinebound-reaver",
                                                "scarwood-behemoth"
                                            ],
                            "bossId":  "rootscar-ancient",
                            "threatRequired":  20000,
                            "encounterDelayMs":  5000,
                            "sequence":  null,
                            "unlock":  {
                                           "type":  "boss-kill",
                                           "bossId":  "corrupted-elemental-gatekeeper"
                                       }
                        },
    "crossroads-of-ruin":  {
                               "id":  "crossroads-of-ruin",
                               "name":  "Crossroads of Ruin",
                               "type":  "dungeon",
                               "progressionOrder":  13,
                               "encounterMode":  "sequence",
                               "firstClearUnlockPreview":  [
                                                               {
                                                                   "id":  "shattered-meridian",
                                                                   "label":  "Shattered Meridian"
                                                               },
                                                               {
                                                                   "id":  "world-tier-3",
                                                                   "label":  "World Tier 3"
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
                           }
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
