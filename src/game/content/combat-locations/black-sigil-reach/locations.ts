import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const blackSigilReachLocations = {
    "hall-of-unbound-names":  {
                                  "id":  "hall-of-unbound-names",
                                  "name":  "Hall of Unbound Names",
                                  "type":  "elite-zone",
                                  "progressionOrder":  18,
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
    "vault-of-the-black-sigil":  {
                                     "id":  "vault-of-the-black-sigil",
                                     "name":  "Vault of the Black Sigil",
                                     "type":  "elite-zone",
                                     "progressionOrder":  19,
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
    "black-gate":  {
                       "id":  "black-gate",
                       "name":  "The Black Gate",
                       "type":  "dungeon",
                       "progressionOrder":  20,
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
                   }
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
