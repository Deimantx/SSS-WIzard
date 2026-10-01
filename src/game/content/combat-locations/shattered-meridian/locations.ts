import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const shatteredMeridianLocations = {
    "graveglass-hollow":  {
                              "id":  "graveglass-hollow",
                              "regionId":  "shattered-meridian",
                              "name":  "Graveglass Hollow",
                              "type":  "elite-zone",
                              "order":  1,
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
    "stormvault-gallery":  {
                               "id":  "stormvault-gallery",
                               "regionId":  "shattered-meridian",
                               "name":  "Stormvault Gallery",
                               "type":  "combat-zone",
                               "order":  2,
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
    "starfallen-observatory":  {
                                   "id":  "starfallen-observatory",
                                   "regionId":  "shattered-meridian",
                                   "name":  "Starfallen Observatory",
                                   "type":  "elite-zone",
                                   "order":  3,
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
    "broken-meridian":  {
                            "id":  "broken-meridian",
                            "regionId":  "shattered-meridian",
                            "name":  "The Broken Meridian",
                            "type":  "dungeon",
                            "order":  4,
                            "encounterMode":  "sequence",
                            "firstClearUnlockPreview":  [
                                                            {
                                                                "id":  "black-sigil-reach",
                                                                "label":  "Black Sigil Reach"
                                                            },
                                                            {
                                                                "id":  "world-tier-4",
                                                                "label":  "World Tier 4"
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
                        }
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
