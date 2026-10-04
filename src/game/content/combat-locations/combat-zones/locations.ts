import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const combatZoneLocations = {
  "stonewake-hollow": {
                             "id":  "stonewake-hollow",
                             "name":  "Stonewake Hollow",
                             "type":  "combat-zone",
                             "progressionOrder":  1,
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
  "galecrest-heights": {
                              "id":  "galecrest-heights",
                              "name":  "Galecrest Heights",
                              "type":  "combat-zone",
                              "progressionOrder":  2,
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
  "tideglass-caverns": {
                              "id":  "tideglass-caverns",
                              "name":  "Tideglass Caverns",
                              "type":  "combat-zone",
                              "progressionOrder":  3,
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
  "emberfall-basin": {
                            "id":  "emberfall-basin",
                            "name":  "Emberfall Basin",
                            "type":  "combat-zone",
                            "progressionOrder":  4,
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
  "whispering-woods": {
                             "id":  "whispering-woods",
                             "name":  "Whispering Woods",
                             "type":  "combat-zone",
                             "progressionOrder":  5,
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
  "flooded-reliquary": {
                              "id":  "flooded-reliquary",
                              "name":  "Flooded Reliquary",
                              "type":  "combat-zone",
                              "progressionOrder":  14,
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
  "ashen-watch": {
                        "id":  "ashen-watch",
                        "name":  "Ashen Watch",
                        "type":  "combat-zone",
                        "progressionOrder":  15,
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
  "rootscar-hollow": {
                            "id":  "rootscar-hollow",
                            "name":  "Rootscar Hollow",
                            "type":  "combat-zone",
                            "progressionOrder":  16,
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
  "stormvault-gallery": {
                               "id":  "stormvault-gallery",
                               "name":  "Stormvault Gallery",
                               "type":  "combat-zone",
                               "progressionOrder":  21,
                               "encounterMode":  "targeted",
                               "targetMetadata":  {
                                                      "volt-wisp":  {
                                                                        "difficulty":  "easy",
                                                                        "order":  1
                                                                    },
                                                      "gale-scribe":  {
                                                                          "difficulty":  "easy",
                                                                          "order":  2
                                                                      },
                                                      "charged-seeker":  {
                                                                             "difficulty":  "standard",
                                                                             "order":  3
                                                                         },
                                                      "thundercoil-serpent":  {
                                                                                  "difficulty":  "standard",
                                                                                  "order":  4
                                                                              },
                                                      "static-armor":  {
                                                                           "difficulty":  "hard",
                                                                           "order":  5
                                                                       },
                                                      "stormbound-curator":  {
                                                                                 "difficulty":  "hard",
                                                                                 "order":  6
                                                                             },
                                                      "tempest-engine":  {
                                                                             "difficulty":  "apex",
                                                                             "order":  7
                                                                         }
                                                  },
                               "monsterPool":  [
                                                   "volt-wisp",
                                                   "gale-scribe",
                                                   "charged-seeker",
                                                   "thundercoil-serpent",
                                                   "static-armor",
                                                   "stormbound-curator",
                                                   "tempest-engine"
                                               ],
                               "bossId":  "storm-archivist",
                               "threatRequired":  30000,
                               "encounterDelayMs":  5000,
                               "sequence":  null,
                               "unlock":  {
                                              "type":  "boss-kill",
                                              "bossId":  "crossroads-keeper"
                                          }
                           },
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
