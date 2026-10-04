import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'

export const huntingGroundLocations = {
  "hunters-ground": {
                           "id":  "hunters-ground",
                           "name":  "Gloamridge",
                           "type":  "hunting-ground",
                           "progressionOrder":  9,
                           "encounterMode":  "targeted",
                           "description":  "A bossless ridge of deterministic Hunter’s Order quarry contracts.",
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
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>
