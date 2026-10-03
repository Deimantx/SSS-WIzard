import type { MonsterId } from '../../../types'
import type { MonsterDefinition } from '../monsterTypes'

export const WHISPERING_WOODS_MONSTERS = {
  "forest-wisp": {
    "id": "forest-wisp",
    "bestiaryCategory": "monster",
    "name": "Forest Wisp",
    "subtitle": "A curious lantern of the undergrowth",
    "maxHealth": 200,
    "basicAttackDamage": 12.272727272727272,
    "basicAttackTimeMs": 2800,
    "defense": 8,
    "color": "#aa9aff",
    "ui": {
      "portraitIcon": "wisp"
    },
    "traitIds": [
      "forest-wisp-flicker"
    ],
    "actions": {
      "arc-spark": {
        "id": "arc-spark",
        "name": "Arc Spark",
        "actionTimeMs": 2000,
        "description": "A bright Arcane spark lashes the target.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "arcane",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 2.2
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
          "magic",
          "arcane",
          "direct"
        ]
      },
      "flicker": {
        "id": "flicker",
        "name": "Flicker",
        "actionTimeMs": 1200,
        "description": "The Wisp flickers forward, accelerating its action cadence.",
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
          "buff",
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
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "arc-spark-step",
            "type": "action",
            "actionId": "arc-spark"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "flicker-step",
            "type": "action",
            "actionId": "flicker"
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
    "resonanceYield": {
      "air": 10
    },
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "thornling": {
    "id": "thornling",
    "bestiaryCategory": "monster",
    "name": "Thornling",
    "subtitle": "A knot of spite and briars",
    "maxHealth": 240,
    "basicAttackDamage": 11.57852564102564,
    "basicAttackTimeMs": 2500,
    "defense": 12,
    "color": "#cb7899",
    "ui": {
      "portraitIcon": "plant"
    },
    "traitIds": [
      "thornling-barkskin"
    ],
    "actions": {
      "thorn-lash": {
        "id": "thorn-lash",
        "name": "Thorn Lash",
        "actionTimeMs": 1800,
        "description": "A thorned lash cuts the target and leaves a lingering Thorn Wound.",
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
            "statusId": "thorn-wound",
            "durationMs": 6000,
            "periodicEffects": [
              {
                "type": "deal-damage",
                "target": "self",
                "components": [
                  {
                    "damageType": "earth",
                    "magnitude": {
                      "type": "source-basic-damage-percent",
                      "value": 0.39999999999999997
                    }
                  }
                ],
                "tags": [
                  "dot",
                  "earth"
                ]
              }
            ],
            "tags": [
              "debuff",
              "dot",
              "earth"
            ]
          }
        ],
        "tags": [
          "special",
          "melee",
          "debuff",
          "earth"
        ]
      },
      "spore-burst": {
        "id": "spore-burst",
        "name": "Spore Burst",
        "actionTimeMs": 2200,
        "description": "A burst of barbed spores tears open existing Thorn Wounds.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.65
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "detonate-status",
            "target": "opponent",
            "statusId": "thorn-wound",
            "multiplier": 0.5,
            "consume": false
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
            "id": "thorn-lash-step-1",
            "type": "action",
            "actionId": "thorn-lash"
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
            "id": "spore-burst-step",
            "type": "action",
            "actionId": "spore-burst"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "thorn-lash-step-2",
            "type": "action",
            "actionId": "thorn-lash"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "resonanceYield": {
      "earth": 12
    },
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "dewbound-sprite": {
    "id": "dewbound-sprite",
    "bestiaryCategory": "monster",
    "name": "Dewbound Sprite",
    "subtitle": "A cool mote of rainwater that refuses to fade",
    "maxHealth": 260,
    "basicAttackDamage": 14.51166253101737,
    "basicAttackTimeMs": 2700,
    "defense": 10,
    "color": "#77c9d7",
    "ui": {
      "portraitIcon": "wisp"
    },
    "traitIds": [],
    "actions": {
      "mist-lance": {
        "id": "mist-lance",
        "name": "Mist Lance",
        "actionTimeMs": 2100,
        "description": "A concentrated lance of mist chills the Wizard.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "water",
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
            "statusId": "chilled",
            "durationMs": 5000,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "water",
          "direct",
          "debuff"
        ]
      },
      "healing-dew": {
        "id": "healing-dew",
        "name": "Healing Dew",
        "actionTimeMs": 2400,
        "description": "The Sprite gathers dew and restores its vitality.",
        "effects": [
          {
            "type": "heal",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.08
            },
            "tags": [
              "heal",
              "direct"
            ]
          }
        ],
        "tags": [
          "special",
          "heal"
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
            "id": "mist-lance-step-1",
            "type": "action",
            "actionId": "mist-lance"
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
            "id": "healing-dew-step",
            "type": "action",
            "actionId": "healing-dew"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "mist-lance-step-2",
            "type": "action",
            "actionId": "mist-lance"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "resonanceYield": {
      "water": 18
    },
    "primaryAffinity": "water",
    "basicAttackElement": "water"
  },
  "cinder-moth": {
    "id": "cinder-moth",
    "bestiaryCategory": "monster",
    "name": "Cinder Moth",
    "subtitle": "A smoldering wingbeat wrapped in ash",
    "maxHealth": 250,
    "basicAttackDamage": 16.441165048543688,
    "basicAttackTimeMs": 2400,
    "defense": 9,
    "color": "#e19a5d",
    "ui": {
      "portraitIcon": "plant"
    },
    "traitIds": [],
    "actions": {
      "ember-dust": {
        "id": "ember-dust",
        "name": "Ember Dust",
        "actionTimeMs": 1900,
        "description": "Scorching dust clings to the Wizard and burns over time.",
        "effects": [
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
          "debuff"
        ]
      },
      "flame-flutter": {
        "id": "flame-flutter",
        "name": "Flame Flutter",
        "actionTimeMs": 1800,
        "description": "The Moth beats its wings faster through a veil of flame.",
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
          "fire",
          "buff"
        ]
      },
      "cinder-dive": {
        "id": "cinder-dive",
        "name": "Cinder Dive",
        "actionTimeMs": 2100,
        "description": "The Moth dives through the Wizard in a burst of cinders.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "fire",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.3
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
          "fire",
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
            "id": "ember-dust-step",
            "type": "action",
            "actionId": "ember-dust"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "flame-flutter-step",
            "type": "action",
            "actionId": "flame-flutter"
          },
          {
            "id": "cinder-dive-step",
            "type": "action",
            "actionId": "cinder-dive"
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
    "resonanceYield": {
      "fire": 20
    },
    "primaryAffinity": "fire",
    "basicAttackElement": "fire"
  },
  "stone-root": {
    "id": "stone-root",
    "bestiaryCategory": "monster",
    "name": "Stone Root",
    "subtitle": "The forest floor given a heartbeat",
    "maxHealth": 280,
    "basicAttackDamage": 23.252747252747255,
    "basicAttackTimeMs": 3200,
    "defense": 12,
    "color": "#b28f79",
    "ui": {
      "portraitIcon": "stone"
    },
    "traitIds": [
      "stone-rooted-shell"
    ],
    "actions": {
      "root-slam": {
        "id": "root-slam",
        "name": "Root Slam",
        "actionTimeMs": 2500,
        "description": "A crushing root strike disrupts the Wizard's current Spell cast.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
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
            "amountMs": 600
          }
        ],
        "tags": [
          "special",
          "control",
          "earth"
        ]
      },
      "stone-shell": {
        "id": "stone-shell",
        "name": "Stone Shell",
        "actionTimeMs": 2400,
        "description": "Stone plates lock together into a temporary protective Barrier.",
        "effects": [
          {
            "type": "gain-barrier",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.12
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
            "id": "root-slam-step",
            "type": "action",
            "actionId": "root-slam"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "stone-shell-step",
            "type": "action",
            "actionId": "stone-shell"
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
    "resonanceYield": {
      "earth": 20
    },
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "grove-sentinel": {
    "id": "grove-sentinel",
    "bestiaryCategory": "monster",
    "name": "Grove Sentinel",
    "subtitle": "An ancient guardian of the inner grove",
    "maxHealth": 320,
    "basicAttackDamage": 20.596875000000004,
    "basicAttackTimeMs": 2600,
    "defense": 20,
    "color": "#d39b59",
    "ui": {
      "portraitIcon": "guardian"
    },
    "traitIds": [
      "grove-sentinel-ancient-growth"
    ],
    "actions": {
      "root-crush": {
        "id": "root-crush",
        "name": "Root Crush",
        "actionTimeMs": 2000,
        "description": "The guardian brings its roots down with crushing force.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 1.35
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
          "direct",
          "earth"
        ]
      },
      "verdant-guard": {
        "id": "verdant-guard",
        "name": "Verdant Guard",
        "actionTimeMs": 2500,
        "description": "The guardian gathers living energy into a protective Barrier.",
        "effects": [
          {
            "type": "gain-barrier",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.16666666666666666
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
      },
      "shield-burst": {
        "id": "shield-burst",
        "name": "Shield Burst",
        "actionTimeMs": 2200,
        "description": "Deals Earth damage plus damage equal to 50% of the Sentinel's remaining Barrier, then consumes that Barrier.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-basic-damage-percent",
                  "value": 0.75
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
                "magnitude": {
                  "type": "source-current-barrier-percent",
                  "value": 0.5
                }
              }
            ],
            "tags": [
              "direct"
            ]
          },
          {
            "type": "consume-barrier",
            "target": "self",
            "mode": "all"
          }
        ],
        "tags": [
          "special",
          "earth",
          "barrier",
          "direct"
        ]
      },
      "rejuvenate": {
        "id": "rejuvenate",
        "name": "Rejuvenate",
        "actionTimeMs": 2600,
        "description": "The Sentinel draws vitality from the grove and restores Health.",
        "effects": [
          {
            "type": "heal",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.08
            },
            "tags": [
              "heal",
              "direct"
            ]
          }
        ],
        "tags": [
          "special",
          "heal"
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
            "id": "verdant-guard-step",
            "type": "action",
            "actionId": "verdant-guard"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "root-crush-step-1",
            "type": "action",
            "actionId": "root-crush"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "shield-burst-step",
            "type": "action",
            "actionId": "shield-burst"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "rejuvenate-step",
            "type": "action",
            "actionId": "rejuvenate"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "resonanceYield": {
      "earth": 45
    },
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  },
  "tempest-stag": {
    "id": "tempest-stag",
    "bestiaryCategory": "monster",
    "name": "Tempest Stag",
    "subtitle": "A storm-crowned antlered force of the high grove",
    "maxHealth": 460,
    "basicAttackDamage": 16.61197703035275,
    "basicAttackTimeMs": 2250,
    "defense": 18,
    "color": "#8bb8e8",
    "ui": {
      "portraitIcon": "guardian"
    },
    "traitIds": [],
    "actions": {
      "static-antlers": {
        "id": "static-antlers",
        "name": "Static Antlers",
        "actionTimeMs": 2000,
        "description": "Lightning forks from the antlers and leaves Shock behind.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
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
            "statusId": "shock",
            "stacks": 2,
            "tags": [
              "debuff"
            ]
          }
        ],
        "tags": [
          "special",
          "air",
          "direct",
          "debuff"
        ]
      },
      "gale-charge": {
        "id": "gale-charge",
        "name": "Gale Charge",
        "actionTimeMs": 1900,
        "description": "A rushing gale delays the Wizard's current action.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
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
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 500
          }
        ],
        "tags": [
          "special",
          "air",
          "direct",
          "control"
        ]
      },
      "storm-rush": {
        "id": "storm-rush",
        "name": "Storm Rush",
        "actionTimeMs": 2100,
        "description": "The Stag crashes through the arena in a storm-charged rush.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "air",
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
          "air",
          "direct"
        ]
      }
    },
    "actionPatterns": {
      "default": {
        "id": "default",
        "steps": [
          {
            "id": "static-antlers-step-1",
            "type": "action",
            "actionId": "static-antlers"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "gale-charge-step",
            "type": "action",
            "actionId": "gale-charge"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "static-antlers-step-2",
            "type": "action",
            "actionId": "static-antlers"
          },
          {
            "id": "storm-rush-step",
            "type": "action",
            "actionId": "storm-rush"
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
    "resonanceYield": {
      "air": 50,
      "earth": 15
    },
    "primaryAffinity": "air",
    "basicAttackElement": "air"
  },
  "forest-heart": {
    "id": "forest-heart",
    "bestiaryCategory": "boss",
    "name": "Forest Heart",
    "subtitle": "The pulse beneath the roots",
    "maxHealth": 900,
    "basicAttackDamage": 17.515151515151516,
    "basicAttackTimeMs": 2400,
    "defense": 30,
    "color": "#e06c8b",
    "ui": {
      "portraitIcon": "boss",
      "bestiary": {
        "roleTags": [
          "Sustain",
          "Healing",
          "Barrier",
          "Control",
          "2 Phases"
        ],
        "phaseLabels": {
          "default": "Default",
          "overgrown": "Overgrown"
        },
        "phaseOrder": [
          "default",
          "overgrown"
        ]
      }
    },
    "traitIds": [
      "forest-heart-living-core"
    ],
    "actions": {
      "heart-pulse": {
        "id": "heart-pulse",
        "name": "Heart Pulse",
        "actionTimeMs": 2000,
        "description": "The Forest Heart releases a crushing pulse through the roots.",
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
          }
        ],
        "tags": [
          "special",
          "direct",
          "earth"
        ]
      },
      "root-prison": {
        "id": "root-prison",
        "name": "Root Prison",
        "actionTimeMs": 2000,
        "description": "Living roots crush the Wizard and disrupt the current Spell cast.",
        "effects": [
          {
            "type": "deal-damage",
            "target": "opponent",
            "components": [
              {
                "damageType": "earth",
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
            "type": "modify-action-timer",
            "target": "opponent",
            "action": "current",
            "amountMs": 900
          }
        ],
        "tags": [
          "special",
          "control",
          "earth"
        ]
      },
      "overgrowth": {
        "id": "overgrowth",
        "name": "Overgrowth",
        "actionTimeMs": 2800,
        "description": "The Heart thickens its living shell behind a heavy living Barrier.",
        "effects": [
          {
            "type": "gain-barrier",
            "target": "self",
            "magnitude": {
              "type": "source-max-health-percent",
              "value": 0.14
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
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "basic-2",
            "type": "basic"
          },
          {
            "id": "heart-pulse-step",
            "type": "action",
            "actionId": "heart-pulse"
          },
          {
            "id": "basic-3",
            "type": "basic"
          },
          {
            "id": "root-prison-step",
            "type": "action",
            "actionId": "root-prison"
          },
          {
            "id": "basic-4",
            "type": "basic"
          },
          {
            "id": "basic-5",
            "type": "basic"
          }
        ]
      },
      "overgrown": {
        "id": "overgrown",
        "steps": [
          {
            "id": "heart-pulse-step-1",
            "type": "action",
            "actionId": "heart-pulse"
          },
          {
            "id": "root-prison-step-1",
            "type": "action",
            "actionId": "root-prison"
          },
          {
            "id": "basic-1",
            "type": "basic"
          },
          {
            "id": "overgrowth-step",
            "type": "action",
            "actionId": "overgrowth"
          },
          {
            "id": "heart-pulse-step-2",
            "type": "action",
            "actionId": "heart-pulse"
          },
          {
            "id": "root-prison-step-2",
            "type": "action",
            "actionId": "root-prison"
          },
          {
            "id": "basic-2",
            "type": "basic"
          }
        ]
      }
    },
    "defaultActionPatternId": "default",
    "loot": [],
    "resonanceYield": {
      "earth": 80
    },
    "primaryAffinity": "earth",
    "basicAttackElement": "earth"
  }
} satisfies Partial<Record<MonsterId, MonsterDefinition>>;

export const WHISPERING_WOODS_MONSTER_IDS = [
  'forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth',
  'stone-root', 'grove-sentinel', 'tempest-stag', 'forest-heart',
] as const satisfies readonly MonsterId[];
