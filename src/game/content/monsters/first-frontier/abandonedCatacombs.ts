import type { MonsterId } from '../../../types'
import type { MonsterDefinition } from '../monsterTypes'

export const ABANDONED_CATACOMBS_MONSTERS = {
  "restless-skeleton": {
    "id": "restless-skeleton",
    "bestiaryCategory": "monster",
    "name": "Restless Skeleton",
    "subtitle": "Bones animated by the last command they heard",
    "maxHealth": 680,
    "basicAttackDamage": 43.6764705882353,
    "basicAttackTimeMs": 2700,
    "defense": 30,
    "color": "#c9c3ae",
    "ui": {
      "portraitIcon": "skeleton"
    },
    "traitIds": [],
    "actions": {
      "bone-cleaver": {
        "id": "bone-cleaver",
        "name": "Bone Cleaver",
        "actionTimeMs": 2200,
        "description": "A heavy cleaver blow splits through the target.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.85
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
      "bone-rattle": {
        "id": "bone-rattle",
        "name": "Bone Rattle",
        "actionTimeMs": 1900,
        "description": "A violent clatter of cursed bones leaves the Wizard Fragile.",
        "effects": [
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
          "debuff",
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
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "bone-cleaver-step",
            "type": "action",
            "actionId": "bone-cleaver"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "bone-rattle-step",
            "type": "action",
            "actionId": "bone-rattle"
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
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "grave-wraith": {
    "id": "grave-wraith",
    "bestiaryCategory": "monster",
    "name": "Grave Wraith",
    "subtitle": "A cold memory refusing to fade",
    "maxHealth": 600,
    "basicAttackDamage": 58.59375,
    "basicAttackTimeMs": 2400,
    "defense": 20,
    "color": "#8d9dc9",
    "ui": {
      "portraitIcon": "ghost"
    },
    "traitIds": [],
    "actions": {
      "chilling-touch": {
        "id": "chilling-touch",
        "name": "Chilling Touch",
        "actionTimeMs": 1800,
        "description": "A cold touch damages the target and leaves it Chilled.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "water",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.3
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
            "durationMs": 10000,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "water",
          "magic",
          "debuff"
        ]
      },
      "frost-reap": {
        "id": "frost-reap",
        "name": "Frost Reap",
        "actionTimeMs": 2100,
        "description": "Reaps the target with spectral frost. Deals 50% more damage while the target is Chilled.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "water",
                "magnitude": {
                  "type": "opponent-status-stack-scaled",
                  "statusId": "chilled",
                  "base": {
                    "type": "source-basic-damage-percent",
                    "value": 1.25
                  },
                  "perStack": 0.5,
                  "maxStacks": 1
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
          "water",
          "magic",
          "direct"
        ]
      },
      "fade": {
        "id": "fade",
        "name": "Fade",
        "actionTimeMs": 1700,
        "description": "The Grave Wraith slips into Spectral Fade.",
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
            "id": "chilling-touch-step-1",
            "type": "action",
            "actionId": "chilling-touch"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "fade-step",
            "type": "action",
            "actionId": "fade"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "frost-reap-step",
            "type": "action",
            "actionId": "frost-reap"
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
    "primaryAffinity": "water",
    "basicAttackElement": "water"
  },
  "fallen-acolyte": {
    "id": "fallen-acolyte",
    "bestiaryCategory": "monster",
    "name": "Fallen Acolyte",
    "subtitle": "A ritualist still serving a forgotten master",
    "maxHealth": 550,
    "basicAttackDamage": 87.40994854202401,
    "basicAttackTimeMs": 2600,
    "defense": 18,
    "color": "#9b7eaa",
    "ui": {
      "portraitIcon": "mage"
    },
    "traitIds": [
      "fallen-acolyte-grave-channeling"
    ],
    "actions": {
      "grave-bolt": {
        "id": "grave-bolt",
        "name": "Grave Bolt",
        "actionTimeMs": 1500,
        "description": "A concentrated Arcane bolt tears through the target.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.45
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
          "magic",
          "direct"
        ]
      },
      "grave-curse": {
        "id": "grave-curse",
        "name": "Grave Curse",
        "actionTimeMs": 1700,
        "description": "A funerary curse weakens the Wizard's damage and recovery.",
        "effects": [
          {
            "type": "apply-status",
            "target": "opponent",
            "statusId": "cursed",
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
      "soul-drain": {
        "id": "soul-drain",
        "name": "Soul Drain",
        "actionTimeMs": 2200,
        "description": "Drains Arcane energy and restores Health. Both effects are 40% stronger while the target is Cursed.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "opponent-status-stack-scaled",
                  "statusId": "cursed",
                  "base": {
                    "type": "source-basic-damage-percent",
                    "value": 1.1
                  },
                  "perStack": 0.4,
                  "maxStacks": 1
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "heal",
            "target": "self",
            "magnitude": {
              "type": "opponent-status-stack-scaled",
              "statusId": "cursed",
              "base": {
                "type": "source-max-health-percent",
                "value": 0.07
              },
              "perStack": 0.4,
              "maxStacks": 1
            },
            "tags": [
              "heal",
              "direct"
            ]
          }
        ],
        "tags": [
          "special",
          "arcane",
          "magic",
          "heal",
          "direct"
        ]
      },
      "death-ward": {
        "id": "death-ward",
        "name": "Death Ward",
        "actionTimeMs": 2000,
        "description": "A deathly ward gathers a protective Barrier around the caster.",
        "effects": [
          {
            "type": "gain-barrier",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.18
            },
            "mode": "add",
            "durationMs": null,
            "tags": [
              "barrier"
            ]
          }
        ],
        "tags": [
          "special",
          "barrier"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "grave-bolt-step",
            "type": "action",
            "actionId": "grave-bolt"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "grave-curse-step",
            "type": "action",
            "actionId": "grave-curse"
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
            "id": "soul-drain-step",
            "type": "action",
            "actionId": "soul-drain"
          },
          {
            "id": "death-ward-step",
            "type": "action",
            "actionId": "death-ward"
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
    "primaryAffinity": "arcane",
    "basicAttackElement": "arcane"
  },
  "archmage-edrin-shade": {
    "id": "archmage-edrin-shade",
    "bestiaryCategory": "boss",
    "name": "Archmage Edrin's Shade",
    "subtitle": "The last spell of a wizard who would not rest",
    "maxHealth": 6000,
    "basicAttackDamage": 17.536231884057973,
    "basicAttackTimeMs": 2500,
    "defense": 45,
    "color": "#70619b",
    "ui": {
      "portraitIcon": "mage",
      "bestiary": {
        "roleTags": [
          "Magic",
          "Lifesteal",
          "Control",
          "Soft Enrage",
          "2 Phases"
        ],
        "phaseLabels": {
          "default": "Gravefire",
          "unbound-opening": "Unbound Opening",
          "unbound": "Unbound"
        },
        "phaseOrder": [
          "default",
          "unbound-opening",
          "unbound"
        ]
      }
    },
    "traitIds": [
      "archmage-edrin-arcane-remnant",
      "archmage-edrin-unbound-spirit"
    ],
    "resonanceYield": {
      "fire": 40,
      "water": 40,
      "earth": 40,
      "air": 40
    },
    "actions": {
      "gravefire": {
        "id": "gravefire",
        "name": "Gravefire",
        "actionTimeMs": 1800,
        "description": "Flame erupts across the target and leaves it Burning.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "fire",
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
            "statusId": "burning",
            "durationMs": 5000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "fire",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.2
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
          "magic",
          "debuff"
        ]
      },
      "frostbind": {
        "id": "frostbind",
        "name": "Frostbind",
        "actionTimeMs": 2000,
        "description": "A freezing surge damages the target and leaves it Chilled.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "water",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.05
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
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "water",
          "magic",
          "debuff"
        ]
      },
      "soul-drain": {
        "id": "soul-drain",
        "name": "Soul Drain",
        "actionTimeMs": 2400,
        "description": "Arcane force tears at the target and restores Health equal to the actual Health damage dealt.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.5
                }
              }
            ],
            "tags": [
              "direct"
            ],
            "lifeStealPercent": 1
          }
        ],
        "tags": [
          "special",
          "arcane",
          "magic",
          "heal",
          "direct"
        ]
      },
      "arcane-disruption": {
        "id": "arcane-disruption",
        "name": "Arcane Disruption",
        "actionTimeMs": 3000,
        "description": "Edrin fractures the Wizard's flow of Mana and recovery.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.8
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
            "statusId": "arcane-disruption",
            "durationMs": 12000,
            "tags": [
              "debuff"
            ]
          },
          {
            "type": "set-action-pattern",
            "target": "self",
            "patternId": "unbound"
          }
        ],
        "tags": [
          "special",
          "arcane",
          "magic",
          "debuff",
          "direct"
        ]
      },
      "final-incantation": {
        "id": "final-incantation",
        "name": "Final Incantation",
        "actionTimeMs": 3500,
        "description": "Each resolved cast permanently increases later Final Incantations by 10% for the encounter.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-status-stack-scaled",
                  "statusId": "final-incantation-empowerment",
                  "base": {
                    "type": "source-basic-damage-percent",
                    "value": 2
                  },
                  "perStack": 0.1
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "apply-status",
            "target": "self",
            "statusId": "final-incantation-empowerment",
            "stacks": 1
          }
        ],
        "tags": [
          "special",
          "arcane",
          "magic",
          "direct"
        ]
      },
      "arcane-ward": {
        "id": "arcane-ward",
        "name": "Arcane Ward",
        "actionTimeMs": 1800,
        "description": "Raises an Arcane Barrier equal to 15% of maximum Health.",
        "effects": [
          {
            "type": "gain-barrier",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.15
            },
            "mode": "add",
            "durationMs": null,
            "tags": [
              "barrier"
            ]
          }
        ],
        "tags": [
          "special",
          "barrier",
          "arcane"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "arcane-ward-step",
            "type": "action",
            "actionId": "arcane-ward"
          },
          {
            "id": "gravefire-step",
            "type": "action",
            "actionId": "gravefire"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "frostbind-step",
            "type": "action",
            "actionId": "frostbind"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "gravefire-step-2",
            "type": "action",
            "actionId": "gravefire"
          },
          {
            "id": "soul-drain-step-1",
            "type": "action",
            "actionId": "soul-drain"
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
            "id": "frostbind-step-2",
            "type": "action",
            "actionId": "frostbind"
          },
          {
            "id": "soul-drain-step-2",
            "type": "action",
            "actionId": "soul-drain"
          }
        ]
      },
      "unbound-opening": {
        "id": "unbound-opening",
        "steps": [
          {
            "id": "arcane-ward-step",
            "type": "action",
            "actionId": "arcane-ward"
          },
          {
            "id": "arcane-disruption-step",
            "type": "action",
            "actionId": "arcane-disruption"
          }
        ]
      },
      "unbound": {
        "id": "unbound",
        "steps": [
          {
            "id": "gravefire-step",
            "type": "action",
            "actionId": "gravefire"
          },
          {
            "id": "frostbind-step",
            "type": "action",
            "actionId": "frostbind"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "soul-drain-step",
            "type": "action",
            "actionId": "soul-drain"
          },
          {
            "id": "final-incantation-step",
            "type": "action",
            "actionId": "final-incantation"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "soul-drain-step-2",
            "type": "action",
            "actionId": "soul-drain"
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
    "primaryAffinity": "arcane",
    "basicAttackElement": "arcane"
  }
} satisfies Partial<Record<MonsterId, MonsterDefinition>>;
