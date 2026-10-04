import type { MonsterId } from '../../../types'
import type { MonsterDefinition } from '../monsterTypes'

export const HUNTERS_ORDER_MONSTERS: Partial<Record<MonsterId, MonsterDefinition>> = {
  "ashen-tracker": {
    "id": "ashen-tracker",
    "bestiaryCategory": "monster",
    "name": "Ashen Tracker",
    "subtitle": "A lean scavenger that follows old battle trails, opening with a burst of speed before raking its quarry.",
    "maxHealth": 590,
    "basicAttackDamage": 20.40960451977401,
    "basicAttackTimeMs": 1750,
    "defense": 15,
    "color": "#b98b64",
    "ui": {
      "portraitIcon": "wolf",
      "bestiary": {
        "roleTags": [
          "Fast Pursuit",
          "Bleed"
        ]
      }
    },
    "hunter": {
      "family": "Gloamridge Predators",
      "alignment": "Wild",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [
      "ashen-tracker-pursuit"
    ],
    "resonanceYield": {
      "fire": 20,
      "air": 32
    },
    "actions": {
      "trail-rake": {
        "id": "trail-rake",
        "name": "Trail Rake",
        "description": "A fast rake that leaves a bleeding wound.",
        "actionTimeMs": 1350,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "fire",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.15
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "bleeding",
            "durationMs": 6000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "fire",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.3666666666666667
                    }
                  }
                ],
                "tags": [
                  "dot",
                  "fire"
                ]
              }
            ],
            "tags": [
              "debuff",
              "dot",
              "fire"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "debuff",
          "fire"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "trail-rake-1",
            "type": "action",
            "actionId": "trail-rake"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "trail-rake-2",
            "type": "action",
            "actionId": "trail-rake"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "fire-fragment",
        "category": "material",
        "baseChance": 0.16,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "fire",
    "basicAttackElement": "fire"
  },
  "gloamfang-stalker": {
    "id": "gloamfang-stalker",
    "bestiaryCategory": "monster",
    "name": "Gloamfang Stalker",
    "subtitle": "A night hunter that vanishes into the ridge shadow before committing to a punishing pounce.",
    "maxHealth": 650,
    "basicAttackDamage": 22.478091528724438,
    "basicAttackTimeMs": 1900,
    "defense": 16,
    "color": "#8f87a8",
    "ui": {
      "portraitIcon": "claw",
      "bestiary": {
        "roleTags": [
          "Ambush",
          "Evasion",
          "Vulnerable Quarry"
        ]
      }
    },
    "hunter": {
      "family": "Gloamridge Predators",
      "alignment": "Wild",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [
      "gloamfang-shadowstep"
    ],
    "resonanceYield": {
      "air": 40
    },
    "actions": {
      "shadow-pounce": {
        "id": "shadow-pounce",
        "name": "Shadow Pounce",
        "description": "Marks the quarry as Vulnerable before striking hard and delaying its next cast.",
        "actionTimeMs": 1650,
        "effects": [
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "vulnerable",
            "durationMs": 6500,
            "tags": [
              "debuff"
            ]
          },
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.65
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 450
          }
        ],
        "tags": [
          "special",
          "melee",
          "control",
          "debuff",
          "air"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "shadow-pounce-1",
            "type": "action",
            "actionId": "shadow-pounce"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "shadow-pounce-2",
            "type": "action",
            "actionId": "shadow-pounce"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "air-fragment",
        "category": "material",
        "baseChance": 0.14,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "runehorn-brute": {
    "id": "runehorn-brute",
    "bestiaryCategory": "monster",
    "name": "Runehorn Brute",
    "subtitle": "A plated grazer that braces behind rune-lit armor, then charges to slow its quarry.",
    "maxHealth": 820,
    "basicAttackDamage": 24.63845925044616,
    "basicAttackTimeMs": 2300,
    "defense": 28,
    "color": "#9a9670",
    "ui": {
      "portraitIcon": "stone",
      "bestiary": {
        "roleTags": [
          "Armored",
          "Fortified",
          "Charge"
        ]
      }
    },
    "hunter": {
      "family": "Runebeasts",
      "alignment": "Leymarked",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [
      "runehorn-leyplate"
    ],
    "resonanceYield": {
      "earth": 48
    },
    "actions": {
      "leyplate-guard": {
        "id": "leyplate-guard",
        "name": "Leyplate Guard",
        "description": "Raises a brief Fortified stance.",
        "actionTimeMs": 1500,
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "fortified",
            "durationMs": 6500,
            "tags": [
              "buff"
            ]
          }
        ],
        "tags": [
          "special",
          "buff"
        ]
      },
      "rune-charge": {
        "id": "rune-charge",
        "name": "Rune Charge",
        "description": "A heavy horn charge that chills the quarry.",
        "actionTimeMs": 2200,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.6
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "chilled",
            "durationMs": 4500,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "control",
          "earth"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "leyplate-guard-step",
            "type": "action",
            "actionId": "leyplate-guard"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "rune-charge-1",
            "type": "action",
            "actionId": "rune-charge"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "rune-charge-2",
            "type": "action",
            "actionId": "rune-charge"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "earth-fragment",
        "category": "material",
        "baseChance": 0.18,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "veilwing-harrier": {
    "id": "veilwing-harrier",
    "bestiaryCategory": "monster",
    "name": "Veilwing Harrier",
    "subtitle": "A swift ridge flier that cuts through the air and breaks a caster’s rhythm.",
    "maxHealth": 640,
    "basicAttackDamage": 27.156523686305732,
    "basicAttackTimeMs": 1650,
    "defense": 14,
    "color": "#7896aa",
    "ui": {
      "portraitIcon": "wolf",
      "bestiary": {
        "roleTags": [
          "Fast",
          "Disruption",
          "Air-aligned"
        ]
      }
    },
    "hunter": {
      "family": "Gloamridge Predators",
      "alignment": "Wild",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [],
    "resonanceYield": {
      "air": 46
    },
    "actions": {
      "razor-gale": {
        "id": "razor-gale",
        "name": "Razor Gale",
        "description": "A cutting gust strikes the quarry and delays its current action.",
        "actionTimeMs": 1150,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.2
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 450
          }
        ],
        "tags": [
          "special",
          "control",
          "air"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "razor-gale-1",
            "type": "action",
            "actionId": "razor-gale"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "razor-gale-2",
            "type": "action",
            "actionId": "razor-gale"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "air-fragment",
        "category": "material",
        "baseChance": 0.18,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "cinderback-mauler": {
    "id": "cinderback-mauler",
    "bestiaryCategory": "monster",
    "name": "Cinderback Mauler",
    "subtitle": "An ember-scarred bruiser that answers every opening with a burning impact.",
    "maxHealth": 760,
    "basicAttackDamage": 34.1521151008362,
    "basicAttackTimeMs": 2100,
    "defense": 21,
    "color": "#a9664e",
    "ui": {
      "portraitIcon": "bear",
      "bestiary": {
        "roleTags": [
          "Bruiser",
          "Burning",
          "Heavy Strike"
        ]
      }
    },
    "hunter": {
      "family": "Runebeasts",
      "alignment": "Embermarked",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [],
    "resonanceYield": {
      "fire": 52
    },
    "actions": {
      "cinder-slam": {
        "id": "cinder-slam",
        "name": "Cinder Slam",
        "description": "A heavy blow scorches the quarry with lingering Fire damage.",
        "actionTimeMs": 2050,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "fire",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.55
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "burning",
            "durationMs": 7000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "fire",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.16428571428571426
                    }
                  }
                ],
                "tags": [
                  "dot",
                  "fire"
                ]
              }
            ],
            "tags": [
              "debuff",
              "dot",
              "fire"
            ]
          }
        ],
        "tags": [
          "special",
          "fire",
          "melee",
          "debuff"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "cinder-slam-1",
            "type": "action",
            "actionId": "cinder-slam"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "cinder-slam-2",
            "type": "action",
            "actionId": "cinder-slam"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "fire-fragment",
        "category": "material",
        "baseChance": 0.2,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "fire",
    "basicAttackElement": "fire"
  },
  "gloomroot-hexer": {
    "id": "gloomroot-hexer",
    "bestiaryCategory": "monster",
    "name": "Gloomroot Hexer",
    "subtitle": "A ley-twisted mystic that binds its quarry with a curse before raising a ward.",
    "maxHealth": 700,
    "basicAttackDamage": 42.11590296495957,
    "basicAttackTimeMs": 2000,
    "defense": 18,
    "color": "#677c68",
    "ui": {
      "portraitIcon": "mage",
      "bestiary": {
        "roleTags": [
          "Hexer",
          "Control",
          "Leymarked"
        ]
      }
    },
    "hunter": {
      "family": "Gloamridge Mystics",
      "alignment": "Leymarked",
      "contractTier": "routine",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [],
    "resonanceYield": {
      "earth": 50
    },
    "actions": {
      "root-hex": {
        "id": "root-hex",
        "name": "Root Hex",
        "description": "A ley-charged strike leaves the quarry Cursed.",
        "actionTimeMs": 1700,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.15
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "cursed",
            "durationMs": 7500,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "arcane",
          "debuff"
        ]
      },
      "ley-barrier": {
        "id": "ley-barrier",
        "name": "Ley Barrier",
        "description": "The Hexer braces behind a Fortified ward.",
        "actionTimeMs": 1550,
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "fortified",
            "durationMs": 6500,
            "tags": [
              "buff"
            ]
          }
        ],
        "tags": [
          "special",
          "buff"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "root-hex-1",
            "type": "action",
            "actionId": "root-hex"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "ley-barrier-1",
            "type": "action",
            "actionId": "ley-barrier"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "root-hex-2",
            "type": "action",
            "actionId": "root-hex"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "earth-fragment",
        "category": "material",
        "baseChance": 0.18,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "nightglass-alpha": {
    "id": "nightglass-alpha",
    "bestiaryCategory": "monster",
    "name": "Nightglass Alpha",
    "subtitle": "A prestigious ridge predator that marks its quarry before striking with precise, punishing pounces.",
    "maxHealth": 1000,
    "basicAttackDamage": 40.12957317073171,
    "basicAttackTimeMs": 1950,
    "defense": 28,
    "color": "#8e6c86",
    "ui": {
      "portraitIcon": "claw",
      "bestiary": {
        "roleTags": [
          "Elite Quarry",
          "Mark and Pounce",
          "Control",
          "Nightglass"
        ]
      }
    },
    "hunter": {
      "family": "Gloamridge Predators",
      "alignment": "Nightglass",
      "contractTier": "prestigious",
      "minimumRank": "master-hunter",
      "exclusive": true,
      "contractRequired": true,
      "huntingGroundId": "hunters-ground"
    },
    "traitIds": [],
    "resonanceYield": {
      "arcane": 100,
      "air": 80
    },
    "actions": {
      "shadow-mark": {
        "id": "shadow-mark",
        "name": "Shadow Mark",
        "description": "Curses and exposes its quarry to the Alpha’s follow-up.",
        "actionTimeMs": 1750,
        "effects": [
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "cursed",
            "durationMs": 12000,
            "tags": [
              "debuff"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "vulnerable",
            "durationMs": 12000,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "debuff"
        ]
      },
      "alpha-pounce": {
        "id": "alpha-pounce",
        "name": "Alpha Pounce",
        "description": "A crushing leap that hits harder while the quarry is Vulnerable.",
        "actionTimeMs": 1900,
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 2.15
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 700
          }
        ],
        "tags": [
          "special",
          "melee",
          "control",
          "arcane"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "shadow-mark-step",
            "type": "action",
            "actionId": "shadow-mark"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "alpha-pounce-step-1",
            "type": "action",
            "actionId": "alpha-pounce"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "alpha-pounce-step-2",
            "type": "action",
            "actionId": "alpha-pounce"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [
      {
        "itemId": "prismatic-fragment",
        "category": "material",
        "baseChance": 0.12,
        "quantity": { "min": 1, "max": 2 }
      }
    ],
    "primaryAffinity": "arcane",
    "basicAttackElement": "arcane"
  }
} satisfies Partial<Record<MonsterId, MonsterDefinition>>;

export const HUNTER_EXCLUSIVE_MONSTER_IDS: readonly MonsterId[] = Object.values(HUNTERS_ORDER_MONSTERS).flatMap((monster) => monster.hunter?.exclusive ? [monster.id] : [])
export const HUNTER_REGULAR_MONSTER_IDS: readonly MonsterId[] = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => HUNTERS_ORDER_MONSTERS[id]?.bestiaryCategory === 'monster')
