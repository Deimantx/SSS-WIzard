import type { MonsterId } from '../../../types'
import type { MonsterDefinition } from '../monsterTypes'

export const HOWLING_DEN_MONSTERS = {
  "cavefang-wolf": {
    "id": "cavefang-wolf",
    "bestiaryCategory": "monster",
    "name": "Cavefang Wolf",
    "subtitle": "A patient predator that waits for weakness",
    "maxHealth": 350,
    "basicAttackDamage": 25.212477396021697,
    "basicAttackTimeMs": 2200,
    "defense": 16,
    "color": "#b8a0a0",
    "ui": {
      "portraitIcon": "wolf"
    },
    "traitIds": [
      "cavefang-wolf-predator-instinct"
    ],
    "resonanceYield": {
      "air": 28
    },
    "actions": {
      "pounce": {
        "id": "pounce",
        "name": "Pounce",
        "actionTimeMs": 1400,
        "description": "The Wolf lunges through the Wizard's concentration and disrupts the current Spell cast.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.5
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
            "amountMs": 400
          }
        ],
        "tags": [
          "special",
          "melee",
          "control",
          "air"
        ]
      },
      "predator-howl": {
        "id": "predator-howl",
        "name": "Predator's Howl",
        "actionTimeMs": 1600,
        "description": "A hunting howl accelerates the Wolf's assault.",
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "haste",
            "durationMs": 16000,
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
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "pounce-step",
            "type": "action",
            "actionId": "pounce"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "predator-howl-step",
            "type": "action",
            "actionId": "predator-howl"
          },
          {
            "id": "basic-4",
            "type": "basic"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "razorclaw-lynx": {
    "id": "razorclaw-lynx",
    "bestiaryCategory": "monster",
    "name": "Razorclaw Lynx",
    "subtitle": "A blur of claws and hungry momentum",
    "maxHealth": 360,
    "basicAttackDamage": 24.551687763713076,
    "basicAttackTimeMs": 1900,
    "defense": 16,
    "color": "#c18b73",
    "ui": {
      "portraitIcon": "claw"
    },
    "traitIds": [
      "razorclaw-lynx-relentless-hunter"
    ],
    "resonanceYield": {
      "air": 32
    },
    "actions": {
      "rending-claws": {
        "id": "rending-claws",
        "name": "Rending Claws",
        "actionTimeMs": 1300,
        "description": "Raking claws cut the target and leave a lingering Bleeding wound.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.25
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
            "durationMs": 8000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "air",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.3625
                    }
                  }
                ],
                "tags": [
                  "dot",
                  "air"
                ]
              }
            ],
            "tags": [
              "debuff",
              "dot",
              "air"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "debuff",
          "air"
        ]
      },
      "blood-scent": {
        "id": "blood-scent",
        "name": "Blood Scent",
        "actionTimeMs": 1200,
        "description": "The Lynx catches the scent of blood and quickens its assault.",
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "haste",
            "durationMs": 5000,
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
            "id": "rending-claws-step-1",
            "type": "action",
            "actionId": "rending-claws"
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
            "id": "blood-scent-step",
            "type": "action",
            "actionId": "blood-scent"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "rending-claws-step-2",
            "type": "action",
            "actionId": "rending-claws"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "corrupted-dire-wolf": {
    "id": "corrupted-dire-wolf",
    "bestiaryCategory": "monster",
    "name": "Corrupted Dire Wolf",
    "subtitle": "A beast split between fang and sorcery",
    "maxHealth": 420,
    "basicAttackDamage": 30.316750342309447,
    "basicAttackTimeMs": 2300,
    "defense": 13,
    "color": "#7e6c9f",
    "ui": {
      "portraitIcon": "wolf"
    },
    "traitIds": [
      "corrupted-dire-wolf-arcane-corruption"
    ],
    "resonanceYield": {
      "air": 25,
      "earth": 20
    },
    "resistances": {
      "fire": 0.1,
      "water": 0.1,
      "earth": 0.1,
      "air": 0.1
    },
    "actions": {
      "arcane-bite": {
        "id": "arcane-bite",
        "name": "Arcane Bite",
        "actionTimeMs": 1600,
        "description": "A corrupted bite tears through both body and warding.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.65
                }
              },
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.65
                }
              }
            ],
            "tags": [
              "direct"
            ]
          }
        ],
        "tags": [
          "special",
          "arcane",
          "melee",
          "direct"
        ]
      },
      "corrupted-howl": {
        "id": "corrupted-howl",
        "name": "Corrupted Howl",
        "actionTimeMs": 1800,
        "description": "The howl fills the Corrupted Dire Wolf with Haste.",
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "haste",
            "durationMs": 6000,
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
      "corrupting-fang": {
        "id": "corrupting-fang",
        "name": "Corrupting Fang",
        "actionTimeMs": 1900,
        "description": "A corrupted bite leaves unstable Arcane residue in the wound.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.9
                }
              },
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.6
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
            "statusId": "corruption",
            "stacks": 1,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "arcane",
          "melee",
          "debuff",
          "direct"
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
            "id": "arcane-bite-step-1",
            "type": "action",
            "actionId": "arcane-bite"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "corrupted-howl-step",
            "type": "action",
            "actionId": "corrupted-howl"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "corrupting-fang-step",
            "type": "action",
            "actionId": "corrupting-fang"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "arcane-bite-step-2",
            "type": "action",
            "actionId": "arcane-bite"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "primaryAffinity": "arcane",
    "basicAttackElement": "arcane"
  },
  "bonehide-boar": {
    "id": "bonehide-boar",
    "bestiaryCategory": "monster",
    "name": "Bonehide Boar",
    "subtitle": "A slow armored bruiser that turns every charge into a wall of force",
    "maxHealth": 470,
    "basicAttackDamage": 37.94680851063829,
    "basicAttackTimeMs": 2900,
    "defense": 28,
    "color": "#9a8066",
    "ui": {
      "portraitIcon": "bear"
    },
    "traitIds": [],
    "actions": {
      "tusk-charge": {
        "id": "tusk-charge",
        "name": "Tusk Charge",
        "actionTimeMs": 2300,
        "description": "A brutal Earth charge delays the Wizard's current action.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.45
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
            "amountMs": 500
          }
        ],
        "tags": [
          "special",
          "melee",
          "control",
          "direct",
          "earth"
        ]
      },
      "bristle-guard": {
        "id": "bristle-guard",
        "name": "Bristle Guard",
        "actionTimeMs": 2000,
        "description": "The Boar hardens its hide and becomes Fortified.",
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "fortified",
            "durationMs": 8000,
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
            "id": "tusk-charge-step-1",
            "type": "action",
            "actionId": "tusk-charge"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "bristle-guard-step",
            "type": "action",
            "actionId": "bristle-guard"
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
            "id": "tusk-charge-step-2",
            "type": "action",
            "actionId": "tusk-charge"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "resonanceYield": {
      "earth": 36
    },
    "loot": [],
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "moonblind-jackal": {
    "id": "moonblind-jackal",
    "bestiaryCategory": "monster",
    "name": "Moonblind Jackal",
    "subtitle": "A fast debuff predator that hunts by scent and curse",
    "maxHealth": 340,
    "basicAttackDamage": 41.21456582633053,
    "basicAttackTimeMs": 1900,
    "defense": 15,
    "color": "#8c829d",
    "ui": {
      "portraitIcon": "wolf"
    },
    "traitIds": [],
    "actions": {
      "moonbite": {
        "id": "moonbite",
        "name": "Moonbite",
        "actionTimeMs": 1700,
        "description": "Arcane damage leaves the Wizard Cursed.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.1
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
            "durationMs": 7000,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "arcane",
          "melee",
          "debuff",
          "direct"
        ]
      },
      "blood-trail": {
        "id": "blood-trail",
        "name": "Blood Trail",
        "actionTimeMs": 1800,
        "description": "Fire damage opens a lingering wounded burn.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "fire",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.9
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
            "durationMs": 8000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "fire",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.15
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
          "debuff",
          "direct"
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
            "id": "moonbite-step-1",
            "type": "action",
            "actionId": "moonbite"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "blood-trail-step",
            "type": "action",
            "actionId": "blood-trail"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "moonbite-step-2",
            "type": "action",
            "actionId": "moonbite"
          },
          {
            "id": "basic-4",
            "type": "basic"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "resonanceYield": {
      "air": 38,
      "fire": 12
    },
    "loot": [],
    "primaryAffinity": "arcane",
    "basicAttackElement": "arcane"
  },
  "den-stalker": {
    "id": "den-stalker",
    "bestiaryCategory": "monster",
    "name": "Den Stalker",
    "subtitle": "An ambush predator that sets up a fragile target for the killing bite",
    "maxHealth": 400,
    "basicAttackDamage": 46.82783018867924,
    "basicAttackTimeMs": 2200,
    "defense": 18,
    "color": "#5e526e",
    "ui": {
      "portraitIcon": "claw"
    },
    "traitIds": [],
    "actions": {
      "shadow-pounce": {
        "id": "shadow-pounce",
        "name": "Shadow Pounce",
        "actionTimeMs": 1800,
        "description": "An Arcane strike leaves the Wizard Fragile.",
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
            "type": "apply-status",
            "target": "opponent",
            "statusId": "fragile",
            "durationMs": 6000,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "debuff",
          "direct",
          "air"
        ]
      },
      "vanish": {
        "id": "vanish",
        "name": "Vanish",
        "actionTimeMs": 1500,
        "description": "The Stalker slips into Spectral Fade.",
        "effects": [
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "spectral-fade",
            "durationMs": 5000,
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
      "execution-bite": {
        "id": "execution-bite",
        "name": "Execution Bite",
        "actionTimeMs": 2100,
        "description": "A devastating bite that deals extra damage to Fragile targets.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
                "magnitude": {
                  "type": "opponent-status-stack-scaled",
                  "statusId": "fragile",
                  "base": {
                    "type": "source-basic-damage-percent",
                    "value": 1.3
                  },
                  "perStack": 0.5,
                  "maxStacks": 1
                }
              }
            ],
            "tags": [
              "special",
              "melee",
              "direct",
              "air"
            ]
          }
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "vanish-step",
            "type": "action",
            "actionId": "vanish"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "shadow-pounce-step-1",
            "type": "action",
            "actionId": "shadow-pounce"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "execution-bite-step",
            "type": "action",
            "actionId": "execution-bite"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "shadow-pounce-step-2",
            "type": "action",
            "actionId": "shadow-pounce"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "resonanceYield": {
      "air": 32,
      "earth": 18
    },
    "loot": [],
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "corrupted-greatbear": {
    "id": "corrupted-greatbear",
    "bestiaryCategory": "boss",
    "name": "Corrupted Greatbear",
    "subtitle": "A mountain of fur warped by hungry magic",
    "maxHealth": 2400,
    "basicAttackDamage": 17.924242424242426,
    "basicAttackTimeMs": 2800,
    "defense": 30,
    "color": "#554240",
    "ui": {
      "portraitIcon": "bear",
      "bestiary": {
        "roleTags": [
          "Earth",
          "Arcane",
          "Stacking Debuff",
          "Ramping Damage",
          "Control",
          "2 Phases"
        ],
        "phaseLabels": {
          "default": "Thick Hide",
          "corrupted": "Corrupted"
        },
        "phaseOrder": [
          "default",
          "corrupted"
        ]
      }
    },
    "traitIds": [
      "corrupted-greatbear-thick-hide",
      "corrupted-greatbear-unstable-corruption"
    ],
    "resonanceYield": {
      "earth": 110,
      "air": 30
    },
    "actions": {
      "crushing-maul": {
        "id": "crushing-maul",
        "name": "Crushing Maul",
        "actionTimeMs": 2200,
        "description": "A brutal maul strike crashes into the target.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.55
                }
              }
            ],
            "tags": [
              "direct"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "direct",
          "earth"
        ]
      },
      "groundbreaker": {
        "id": "groundbreaker",
        "name": "Groundbreaker",
        "actionTimeMs": 2500,
        "description": "The Greatbear shatters the ground, disrupting the Wizard's current Spell cast.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
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
            "type": "apply-status",
            "target": "opponent",
            "statusId": "tremored",
            "durationMs": 2200,
            "tags": [
              "debuff"
            ]
          },
          {
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 1000
          }
        ],
        "tags": [
          "special",
          "control",
          "earth"
        ]
      },
      "corrupted-roar": {
        "id": "corrupted-roar",
        "name": "Corrupted Roar",
        "actionTimeMs": 2200,
        "description": "Makes the target Vulnerable and adds 1 Corruption.",
        "effects": [
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "vulnerable",
            "durationMs": 10000,
            "tags": [
              "debuff"
            ]
          },
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "corruption",
            "durationMs": 30000,
            "stacks": 1,
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
      "savage-rampage": {
        "id": "savage-rampage",
        "name": "Savage Rampage",
        "actionTimeMs": 3000,
        "description": "A heavy Earth strike empowered by Corruption.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "opponent-status-stack-scaled",
                  "statusId": "corruption",
                  "base": {
                    "type": "source-basic-damage-percent",
                    "value": 2
                  },
                  "perStack": 0.12,
                  "maxStacks": 5
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
            "statusId": "corruption",
            "durationMs": 30000,
            "stacks": 1,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "debuff",
          "direct",
          "earth"
        ]
      },
      "corrupting-maul": {
        "id": "corrupting-maul",
        "name": "Corrupting Maul",
        "actionTimeMs": 2800,
        "description": "Earth and Arcane impacts crash together as the corruption surges.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.9
                }
              },
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.7
                }
              }
            ],
            "tags": [
              "special",
              "direct",
              "earth",
              "arcane"
            ]
          }
        ],
        "tags": [
          "special",
          "earth",
          "arcane",
          "melee",
          "direct"
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
            "id": "crushing-maul-step",
            "type": "action",
            "actionId": "crushing-maul"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "groundbreaker-step",
            "type": "action",
            "actionId": "groundbreaker"
          },
          {
            "id": "basic-4",
            "type": "basic"
          }
        ]
      },
      "corrupted": {
        "id": "corrupted",
        "steps": [
          {
            "id": "corrupted-roar-step",
            "type": "action",
            "actionId": "corrupted-roar"
          },
          {
            "id": "crushing-maul-step-1",
            "type": "action",
            "actionId": "crushing-maul"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "savage-rampage-step-1",
            "type": "action",
            "actionId": "savage-rampage"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "corrupting-maul-step",
            "type": "action",
            "actionId": "corrupting-maul"
          },
          {
            "id": "savage-rampage-step-2",
            "type": "action",
            "actionId": "savage-rampage"
          },
          {
            "id": "basic-3",
            "type": "basic"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  }
} satisfies Partial<Record<MonsterId, MonsterDefinition>>;
