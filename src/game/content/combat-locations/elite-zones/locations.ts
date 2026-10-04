import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const eliteZoneLocations = {
  "howling-den": {
                        "id":  "howling-den",
                        "name":  "Howling Den",
                        "type":  "elite-zone",
                        "progressionOrder":  7,
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
  "graveglass-hollow": {
                              "id":  "graveglass-hollow",
                              "name":  "Graveglass Hollow",
                              "type":  "elite-zone",
                              "progressionOrder":  19,
                              "encounterMode":  "targeted",
                              "zoneAffixId":  "warded",
                              "targetMetadata":  {
                                                     "graveglass-shade":  {
                                                                              "difficulty":  "standard",
                                                                              "order":  1
                                                                          },
                                                     "bone-shardling":  {
                                                                            "difficulty":  "standard",
                                                                            "order":  2
                                                                        },
                                                     "silent-mourner":  {
                                                                            "difficulty":  "hard",
                                                                            "order":  3
                                                                        },
                                                     "crypt-guardian":  {
                                                                            "difficulty":  "hard",
                                                                            "order":  4
                                                                        },
                                                     "epitaph-weaver":  {
                                                                            "difficulty":  "hard",
                                                                            "order":  5
                                                                        },
                                                     "tombglass-reaver":  {
                                                                              "difficulty":  "apex",
                                                                              "order":  6
                                                                          },
                                                     "ossuary-oracle":  {
                                                                            "difficulty":  "apex",
                                                                            "order":  7
                                                                        }
                                                 },
                              "monsterPool":  [
                                                  "graveglass-shade",
                                                  "bone-shardling",
                                                  "silent-mourner",
                                                  "crypt-guardian",
                                                  "epitaph-weaver",
                                                  "tombglass-reaver",
                                                  "ossuary-oracle"
                                              ],
                              "bossId":  "graveglass-behemoth",
                              "threatRequired":  30000,
                              "encounterDelayMs":  5000,
                              "sequence":  null,
                              "unlock":  {
                                             "type":  "boss-kill",
                                             "bossId":  "crossroads-keeper"
                                         }
                          },
  "starfallen-observatory": {
                                   "id":  "starfallen-observatory",
                                   "name":  "Starfallen Observatory",
                                   "type":  "elite-zone",
                                   "progressionOrder":  22,
                                   "encounterMode":  "targeted",
                                   "zoneAffixId":  "relentless",
                                   "targetMetadata":  {
                                                          "starbound-eye":  {
                                                                                "difficulty":  "standard",
                                                                                "order":  1
                                                                            },
                                                          "astral-husk":  {
                                                                              "difficulty":  "standard",
                                                                              "order":  2
                                                                          },
                                                          "orbiting-fragment":  {
                                                                                    "difficulty":  "hard",
                                                                                    "order":  3
                                                                                },
                                                          "lenskeeper-remnant":  {
                                                                                     "difficulty":  "hard",
                                                                                     "order":  4
                                                                                 },
                                                          "comet-wraith":  {
                                                                               "difficulty":  "hard",
                                                                               "order":  5
                                                                           },
                                                          "voidglass-custodian":  {
                                                                                      "difficulty":  "apex",
                                                                                      "order":  6
                                                                                  },
                                                          "zenith-horror":  {
                                                                                "difficulty":  "apex",
                                                                                "order":  7
                                                                            }
                                                      },
                                   "monsterPool":  [
                                                       "starbound-eye",
                                                       "astral-husk",
                                                       "orbiting-fragment",
                                                       "lenskeeper-remnant",
                                                       "comet-wraith",
                                                       "voidglass-custodian",
                                                       "zenith-horror"
                                                   ],
                                   "bossId":  "fallen-astromancer",
                                   "threatRequired":  30000,
                                   "encounterDelayMs":  5000,
                                   "sequence":  null,
                                   "unlock":  {
                                                  "type":  "boss-kill",
                                                  "bossId":  "crossroads-keeper"
                                              }
                               },
  "hall-of-unbound-names": {
                                  "id":  "hall-of-unbound-names",
                                  "name":  "Hall of Unbound Names",
                                  "type":  "elite-zone",
                                  "progressionOrder":  24,
                                  "encounterMode":  "targeted",
                                  "zoneAffixId":  "vicious",
                                  "targetMetadata":  {
                                                         "name-eater":  {
                                                                            "difficulty":  "standard",
                                                                            "order":  1
                                                                        },
                                                         "bound-echo":  {
                                                                            "difficulty":  "standard",
                                                                            "order":  2
                                                                        },
                                                         "hollow-liturgist":  {
                                                                                  "difficulty":  "hard",
                                                                                  "order":  3
                                                                              },
                                                         "whisper-archivist":  {
                                                                                   "difficulty":  "hard",
                                                                                   "order":  4
                                                                               },
                                                         "nameless-cantor":  {
                                                                                 "difficulty":  "hard",
                                                                                 "order":  5
                                                                             },
                                                         "oathless-confessor":  {
                                                                                    "difficulty":  "apex",
                                                                                    "order":  6
                                                                                },
                                                         "unwritten-hierophant":  {
                                                                                      "difficulty":  "apex",
                                                                                      "order":  7
                                                                                  }
                                                     },
                                  "monsterPool":  [
                                                      "name-eater",
                                                      "bound-echo",
                                                      "hollow-liturgist",
                                                      "whisper-archivist",
                                                      "nameless-cantor",
                                                      "oathless-confessor",
                                                      "unwritten-hierophant"
                                                  ],
                                  "bossId":  "unspoken-prelate",
                                  "threatRequired":  40000,
                                  "encounterDelayMs":  5000,
                                  "sequence":  null,
                                  "unlock":  {
                                                 "type":  "boss-kill",
                                                 "bossId":  "meridian-splitter"
                                             }
                              },
  "vault-of-the-black-sigil": {
                                     "id":  "vault-of-the-black-sigil",
                                     "name":  "Vault of the Black Sigil",
                                     "type":  "elite-zone",
                                     "progressionOrder":  25,
                                     "encounterMode":  "targeted",
                                     "zoneAffixId":  "armored",
                                     "targetMetadata":  {
                                                            "black-seal-parasite":  {
                                                                                        "difficulty":  "standard",
                                                                                        "order":  1
                                                                                    },
                                                            "inkbound-specter":  {
                                                                                     "difficulty":  "standard",
                                                                                     "order":  2
                                                                                 },
                                                            "sigil-guardian":  {
                                                                                   "difficulty":  "hard",
                                                                                   "order":  3
                                                                               },
                                                            "vault-devourer":  {
                                                                                   "difficulty":  "hard",
                                                                                   "order":  4
                                                                               },
                                                            "sealbound-custodian":  {
                                                                                        "difficulty":  "hard",
                                                                                        "order":  5
                                                                                    },
                                                            "blackscript-colossus":  {
                                                                                         "difficulty":  "apex",
                                                                                         "order":  6
                                                                                     },
                                                            "voidseal-arbiter":  {
                                                                                     "difficulty":  "apex",
                                                                                     "order":  7
                                                                                 }
                                                        },
                                     "monsterPool":  [
                                                         "black-seal-parasite",
                                                         "inkbound-specter",
                                                         "sigil-guardian",
                                                         "vault-devourer",
                                                         "sealbound-custodian",
                                                         "blackscript-colossus",
                                                         "voidseal-arbiter"
                                                     ],
                                     "bossId":  "sigil-warden",
                                     "threatRequired":  40000,
                                     "encounterDelayMs":  5000,
                                     "sequence":  null,
                                     "unlock":  {
                                                    "type":  "boss-kill",
                                                    "bossId":  "meridian-splitter"
                                                }
                                 },
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
