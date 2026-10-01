import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const firstFrontierLocations = {
    "stonewake-hollow":  {
                             "id":  "stonewake-hollow",
                             "regionId":  "first-frontier",
                             "name":  "Stonewake Hollow",
                             "type":  "combat-zone",
                             "order":  1,
                             "encounterMode":  "targeted",
                             "description":  "An Earth frontier of barriers and heavy, deliberate attacks.",
                             "primaryElement":  "earth",
                             "targetMetadata":  {
                                                    "stonewake-gravel-wisp":  {
                                                                                  "difficulty":  "easy",
                                                                                  "order":  1
                                                                              },
                                                    "stonewake-rootback-crawler":  {
                                                                                       "difficulty":  "easy",
                                                                                       "order":  2
                                                                                   },
                                                    "stonewake-shardhide-golem":  {
                                                                                      "difficulty":  "standard",
                                                                                      "order":  3
                                                                                  },
                                                    "stonewake-stonebound-warden":  {
                                                                                        "difficulty":  "hard",
                                                                                        "order":  4
                                                                                    }
                                                },
                             "unlock":  {
                                            "type":  "any",
                                            "conditions":  [
                                                               {
                                                                   "type":  "starter-advantage",
                                                                   "targetElement":  "earth"
                                                               },
                                                               {
                                                                   "type":  "chronicle-event",
                                                                   "eventId":  "elemental-tutorial-zones-opened"
                                                               }
                                                           ]
                                        },
                             "monsterPool":  [
                                                 "stonewake-gravel-wisp",
                                                 "stonewake-rootback-crawler",
                                                 "stonewake-shardhide-golem",
                                                 "stonewake-stonebound-warden"
                                             ],
                             "bossId":  "heartstone-colossus",
                             "threatRequired":  600,
                             "encounterDelayMs":  2500,
                             "sequence":  null
                         },
    "galecrest-heights":  {
                              "id":  "galecrest-heights",
                              "regionId":  "first-frontier",
                              "name":  "Galecrest Heights",
                              "type":  "combat-zone",
                              "order":  2,
                              "encounterMode":  "targeted",
                              "description":  "An Air frontier of haste and multi-hit pressure.",
                              "primaryElement":  "air",
                              "targetMetadata":  {
                                                     "galecrest-zephyr-wisp":  {
                                                                                   "difficulty":  "easy",
                                                                                   "order":  1
                                                                               },
                                                     "galecrest-gale-imp":  {
                                                                                "difficulty":  "easy",
                                                                                "order":  2
                                                                            },
                                                     "galecrest-razorwing":  {
                                                                                 "difficulty":  "standard",
                                                                                 "order":  3
                                                                             },
                                                     "galecrest-stormcaller-adept":  {
                                                                                         "difficulty":  "hard",
                                                                                         "order":  4
                                                                                     }
                                                 },
                              "unlock":  {
                                             "type":  "any",
                                             "conditions":  [
                                                                {
                                                                    "type":  "starter-advantage",
                                                                    "targetElement":  "air"
                                                                },
                                                                {
                                                                    "type":  "chronicle-event",
                                                                    "eventId":  "elemental-tutorial-zones-opened"
                                                                }
                                                            ]
                                         },
                              "monsterPool":  [
                                                  "galecrest-zephyr-wisp",
                                                  "galecrest-gale-imp",
                                                  "galecrest-razorwing",
                                                  "galecrest-stormcaller-adept"
                                              ],
                              "bossId":  "tempest-roc",
                              "threatRequired":  600,
                              "encounterDelayMs":  2500,
                              "sequence":  null
                          },
    "tideglass-caverns":  {
                              "id":  "tideglass-caverns",
                              "regionId":  "first-frontier",
                              "name":  "Tideglass Caverns",
                              "type":  "combat-zone",
                              "order":  3,
                              "encounterMode":  "targeted",
                              "description":  "A Water frontier of barriers, healing, and dragging currents.",
                              "primaryElement":  "water",
                              "targetMetadata":  {
                                                     "tideglass-tide-wisp":  {
                                                                                 "difficulty":  "easy",
                                                                                 "order":  1
                                                                             },
                                                     "tideglass-reef-crawler":  {
                                                                                    "difficulty":  "easy",
                                                                                    "order":  2
                                                                                },
                                                     "tideglass-current-serpent":  {
                                                                                       "difficulty":  "standard",
                                                                                       "order":  3
                                                                                   },
                                                     "tideglass-drowned-channeler":  {
                                                                                         "difficulty":  "hard",
                                                                                         "order":  4
                                                                                     }
                                                 },
                              "unlock":  {
                                             "type":  "any",
                                             "conditions":  [
                                                                {
                                                                    "type":  "starter-advantage",
                                                                    "targetElement":  "water"
                                                                },
                                                                {
                                                                    "type":  "chronicle-event",
                                                                    "eventId":  "elemental-tutorial-zones-opened"
                                                                }
                                                            ]
                                         },
                              "monsterPool":  [
                                                  "tideglass-tide-wisp",
                                                  "tideglass-reef-crawler",
                                                  "tideglass-current-serpent",
                                                  "tideglass-drowned-channeler"
                                              ],
                              "bossId":  "deepwater-oracle",
                              "threatRequired":  600,
                              "encounterDelayMs":  2500,
                              "sequence":  null
                          },
    "emberfall-basin":  {
                            "id":  "emberfall-basin",
                            "regionId":  "first-frontier",
                            "name":  "Emberfall Basin",
                            "type":  "combat-zone",
                            "order":  4,
                            "encounterMode":  "targeted",
                            "description":  "A Fire frontier of direct strikes and lingering burns.",
                            "primaryElement":  "fire",
                            "targetMetadata":  {
                                                   "emberfall-ember-wisp":  {
                                                                                "difficulty":  "easy",
                                                                                "order":  1
                                                                            },
                                                   "emberfall-ashling":  {
                                                                             "difficulty":  "easy",
                                                                             "order":  2
                                                                         },
                                                   "emberfall-flame-hound":  {
                                                                                 "difficulty":  "standard",
                                                                                 "order":  3
                                                                             },
                                                   "emberfall-ashen-adept":  {
                                                                                 "difficulty":  "hard",
                                                                                 "order":  4
                                                                             }
                                               },
                            "unlock":  {
                                           "type":  "any",
                                           "conditions":  [
                                                              {
                                                                  "type":  "starter-advantage",
                                                                  "targetElement":  "fire"
                                                              },
                                                              {
                                                                  "type":  "chronicle-event",
                                                                  "eventId":  "elemental-tutorial-zones-opened"
                                                              }
                                                          ]
                                       },
                            "monsterPool":  [
                                                "emberfall-ember-wisp",
                                                "emberfall-ashling",
                                                "emberfall-flame-hound",
                                                "emberfall-ashen-adept"
                                            ],
                            "bossId":  "pyre-guardian",
                            "threatRequired":  600,
                            "encounterDelayMs":  2500,
                            "sequence":  null
                        },
    "whispering-woods":  {
                             "id":  "whispering-woods",
                             "regionId":  "first-frontier",
                             "name":  "Whispering Woods",
                             "type":  "combat-zone",
                             "order":  5,
                             "encounterMode":  "targeted",
                             "description":  "A mixed-target forest where elemental affinities shape each encounter.",
                             "unlock":  {
                                            "type":  "any",
                                            "conditions":  [
                                                               {
                                                                   "type":  "chronicle-event",
                                                                   "eventId":  "first-elemental-tutorial-boss-defeated"
                                                               },
                                                               {
                                                                   "type":  "boss-kill",
                                                                   "bossId":  "forest-heart",
                                                                   "count":  1
                                                               }
                                                           ]
                                        },
                             "targetMetadata":  {
                                                    "forest-wisp":  {
                                                                        "difficulty":  "easy",
                                                                        "order":  1
                                                                    },
                                                    "thornling":  {
                                                                      "difficulty":  "easy",
                                                                      "order":  2
                                                                  },
                                                    "dewbound-sprite":  {
                                                                            "difficulty":  "standard",
                                                                            "order":  3
                                                                        },
                                                    "cinder-moth":  {
                                                                        "difficulty":  "standard",
                                                                        "order":  4
                                                                    },
                                                    "stone-root":  {
                                                                       "difficulty":  "standard",
                                                                       "order":  5
                                                                   },
                                                    "grove-sentinel":  {
                                                                           "difficulty":  "hard",
                                                                           "order":  6
                                                                       },
                                                    "tempest-stag":  {
                                                                         "difficulty":  "apex",
                                                                         "order":  7
                                                                     }
                                                },
                             "monsterPool":  [
                                                 "forest-wisp",
                                                 "thornling",
                                                 "dewbound-sprite",
                                                 "cinder-moth",
                                                 "stone-root",
                                                 "grove-sentinel",
                                                 "tempest-stag"
                                             ],
                             "bossId":  "forest-heart",
                             "threatRequired":  5000,
                             "encounterDelayMs":  5000,
                             "sequence":  null
                         },
    "howling-den":  {
                        "id":  "howling-den",
                        "regionId":  "first-frontier",
                        "name":  "Howling Den",
                        "type":  "elite-zone",
                        "order":  6,
                        "encounterMode":  "targeted",
                        "description":  "An elite hunting ground where every normal foe gains Haste once at half Health.",
                        "zoneAffixId":  "frenzied",
                        "unlock":  {
                                       "type":  "boss-kill",
                                       "bossId":  "forest-heart",
                                       "count":  1
                                   },
                        "targetMetadata":  {
                                               "cavefang-wolf":  {
                                                                     "difficulty":  "standard",
                                                                     "order":  1
                                                                 },
                                               "razorclaw-lynx":  {
                                                                      "difficulty":  "standard",
                                                                      "order":  2
                                                                  },
                                               "corrupted-dire-wolf":  {
                                                                           "difficulty":  "hard",
                                                                           "order":  3
                                                                       },
                                               "bonehide-boar":  {
                                                                     "difficulty":  "hard",
                                                                     "order":  4
                                                                 },
                                               "moonblind-jackal":  {
                                                                        "difficulty":  "hard",
                                                                        "order":  5
                                                                    },
                                               "den-stalker":  {
                                                                   "difficulty":  "apex",
                                                                   "order":  6
                                                               }
                                           },
                        "monsterPool":  [
                                            "cavefang-wolf",
                                            "razorclaw-lynx",
                                            "corrupted-dire-wolf",
                                            "bonehide-boar",
                                            "moonblind-jackal",
                                            "den-stalker"
                                        ],
                        "bossId":  "corrupted-greatbear",
                        "threatRequired":  10000,
                        "encounterDelayMs":  5000,
                        "sequence":  null
                    },
    "hunters-ground":  {
                           "id":  "hunters-ground",
                           "regionId":  "first-frontier",
                           "name":  "Gloamridge",
                           "type":  "hunting-ground",
                           "order":  7,
                           "encounterMode":  "targeted",
                           "description":  "A bossless ridge of deterministic Hunterâ€™s Order quarry contracts.",
                           "unlock":  {
                                          "type":  "boss-kill",
                                          "bossId":  "corrupted-greatbear",
                                          "count":  1
                                      },
                           "targetMetadata":  {
                                                  "ashen-tracker":  {
                                                                        "difficulty":  "standard",
                                                                        "order":  1
                                                                    },
                                                  "gloamfang-stalker":  {
                                                                            "difficulty":  "standard",
                                                                            "order":  2
                                                                        },
                                                  "runehorn-brute":  {
                                                                         "difficulty":  "hard",
                                                                         "order":  3
                                                                     },
                                                  "veilwing-harrier":  {
                                                                           "difficulty":  "standard",
                                                                           "order":  4
                                                                       },
                                                  "cinderback-mauler":  {
                                                                            "difficulty":  "hard",
                                                                            "order":  5
                                                                        },
                                                  "gloomroot-hexer":  {
                                                                          "difficulty":  "hard",
                                                                          "order":  6
                                                                      },
                                                  "nightglass-alpha":  {
                                                                           "difficulty":  "hard",
                                                                           "order":  7
                                                                       }
                                              },
                           "monsterPool":  [
                                               "ashen-tracker",
                                               "gloamfang-stalker",
                                               "runehorn-brute",
                                               "veilwing-harrier",
                                               "cinderback-mauler",
                                               "gloomroot-hexer",
                                               "nightglass-alpha"
                                           ],
                           "bossId":  null,
                           "threatRequired":  null,
                           "encounterDelayMs":  5000,
                           "sequence":  null
                       },
    "abandoned-catacombs":  {
                                "id":  "abandoned-catacombs",
                                "regionId":  "first-frontier",
                                "name":  "Abandoned Catacombs",
                                "type":  "dungeon",
                                "order":  8,
                                "encounterMode":  "sequence",
                                "description":  "A fixed sequence through the old crypts, ending at Archmage Edrinâ€™s Shade.",
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
                                                                    "id":  "elemental-scar",
                                                                    "label":  "Elemental Scar"
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
                            }
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
