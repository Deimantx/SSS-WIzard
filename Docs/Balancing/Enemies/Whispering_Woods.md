# Whispering Woods enemies

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Monster ID | Name | Role | HP | Basic damage | Basic attack time | Defense | Crit chance | Crit damage | Block chance | Resistances | Status immunities | XP reward |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| forest-wisp | Forest Wisp | monster | 44 | 5 | 2800 ms (2.8 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| thornling | Thornling | monster | 64 | 8 | 2500 ms (2.5 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| stone-root | Stone Root | monster | 92 | 11 | 3200 ms (3.2 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| grove-sentinel | Grove Sentinel | monster | 360 | 15 | 2600 ms (2.6 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| forest-heart | Forest Heart | boss | 600 | 20 | 2400 ms (2.4 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |

## Forest Wisp (forest-wisp)

A curious lantern of the undergrowth

### Traits

- forest-wisp-flicker: After Arc Spark resolves, gains Haste for 3 seconds.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| arc-spark | Arc Spark | 2000 ms (2 s) | special, magic, arcane, direct | A bright Arcane spark lashes the target. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 2.4<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
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
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| wisp-essence | 1 | 2 | 1 | 100% (runtime fraction 1) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Thornling (thornling)

A knot of spite and briars

### Traits

- thornling-barkskin: Basic Attack damage received is reduced by 15%.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| thorn-lash | Thorn Lash | 1800 ms (1.8 s) | special, physical, debuff | A thorned lash cuts the target and leaves a lingering Thorn Wound. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.25<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "thorn-wound",<br>    "durationMs": 6000,<br>    "periodicEffects": [<br>      {<br>        "type": "deal-damage",<br>        "target": "self",<br>        "components": [<br>          {<br>            "damageType": "physical",<br>            "magnitude": {<br>              "type": "source-basic-damage-percent",<br>              "value": 0.375<br>            }<br>          }<br>        ],<br>        "tags": [<br>          "dot",<br>          "physical"<br>        ]<br>      }<br>    ],<br>    "tags": [<br>      "debuff",<br>      "dot",<br>      "physical"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
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
        "id": "thorn-lash-step",
        "type": "action",
        "actionId": "thorn-lash"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| wisp-essence | 1 | 2 | 1 | 100% (runtime fraction 1) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Stone Root (stone-root)

The forest floor given a heartbeat

### Traits

- stone-rooted-shell: Starts with Barrier equal to 15% max HP.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| root-slam | Root Slam | 2500 ms (2.5 s) | special, physical, control | A crushing root strike disrupts the Player's Basic Attack rhythm. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.65<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "modify-action-timer",<br>    "target": "opponent",<br>    "action": "basic-attack",<br>    "amountMs": 700<br>  }<br>] |

### Action patterns

~~~json
{
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
        "id": "basic-3",
        "type": "basic"
      },
      {
        "id": "root-slam-step",
        "type": "action",
        "actionId": "root-slam"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| wisp-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Grove Sentinel (grove-sentinel)

An ancient guardian of the inner grove

### Traits

- grove-sentinel-ancient-growth: At 40% HP, gains a large Barrier once.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| root-crush | Root Crush | 2000 ms (2 s) | special, physical, direct | The guardian brings its roots down with crushing force. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.35<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| verdant-guard | Verdant Guard | 2500 ms (2.5 s) | special, barrier | The guardian gathers living energy into a protective Barrier. | [<br>  {<br>    "type": "gain-barrier",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.16666666666666666<br>    },<br>    "mode": "add",<br>    "durationMs": null,<br>    "tags": [<br>      "barrier"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
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
        "id": "root-crush-step",
        "type": "action",
        "actionId": "root-crush"
      },
      {
        "id": "basic-3",
        "type": "basic"
      },
      {
        "id": "verdant-guard-step",
        "type": "action",
        "actionId": "verdant-guard"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| grove-bark | 2 | 3 | 1 | 100% (runtime fraction 1) |
| wisp-essence | 4 | 6 | 1 | 100% (runtime fraction 1) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Forest Heart (forest-heart)

The pulse beneath the roots

### Traits

- forest-heart-living-core: At 50% HP, gains 15% Action speed once.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| heart-pulse | Heart Pulse | 2000 ms (2 s) | special, physical, direct | The Forest Heart releases a crushing pulse through the roots. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.2<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| root-prison | Root Prison | 2000 ms (2 s) | special, physical, control | Roots crush the target and delay the Player's next Basic Attack. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 0.8<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "modify-action-timer",<br>    "target": "opponent",<br>    "action": "basic-attack",<br>    "amountMs": 1000<br>  }<br>] |
| rejuvenating-sap | Rejuvenating Sap | 3000 ms (3 s) | special, heal, direct | The Heart draws restorative sap inward to recover Health. | [<br>  {<br>    "type": "heal",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.1<br>    },<br>    "tags": [<br>      "heal",<br>      "direct"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
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
        "id": "basic-4",
        "type": "basic"
      },
      {
        "id": "root-prison-step",
        "type": "action",
        "actionId": "root-prison"
      },
      {
        "id": "basic-5",
        "type": "basic"
      },
      {
        "id": "basic-6",
        "type": "basic"
      },
      {
        "id": "basic-7",
        "type": "basic"
      },
      {
        "id": "sap-step",
        "type": "action",
        "actionId": "rejuvenating-sap"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| heartseed | 1 | 1 | 1 | 100% (runtime fraction 1) |
| heartseed-necklace | 1 | 1 | 0.05 | 5% (runtime fraction 0.05) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |
