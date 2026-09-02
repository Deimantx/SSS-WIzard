# Howling Den enemies

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Monster ID | Name | Role | HP | Basic damage | Basic attack time | Defense | Crit chance | Crit damage | Block chance | Resistances | Status immunities | XP reward |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cavefang-wolf | Cavefang Wolf | monster | 115 | 12 | 2200 ms (2.2 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| razorclaw-lynx | Razorclaw Lynx | monster | 130 | 11 | 1900 ms (1.9 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| corrupted-dire-wolf | Corrupted Dire Wolf | monster | 160 | 14 | 2300 ms (2.3 s) | 10 | 0.05 | 1.5 | 0 | {<br>  "fire": 0.1,<br>  "water": 0.1,<br>  "earth": 0.1,<br>  "air": 0.1<br>} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| corrupted-greatbear | Corrupted Greatbear | boss | 900 | 22 | 2800 ms (2.8 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |

## Cavefang Wolf (cavefang-wolf)

A patient predator that waits for weakness

### Traits

- cavefang-wolf-predator-instinct: Deals 25% more damage while the target is at or below 35% HP.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| pounce | Pounce | 1400 ms (1.4 s) | special, physical, melee, control | The predator lunges at the target and delays the Player's Basic Attack. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.5<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "modify-action-timer",<br>    "target": "opponent",<br>    "action": "basic-attack",<br>    "amountMs": 500<br>  }<br>] |

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
        "id": "pounce-step",
        "type": "action",
        "actionId": "pounce"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| predator-fang | 1 | 1 | 0.55 | 55.00000000000001% (runtime fraction 0.55) |
| predator-hide | 1 | 1 | 0.3 | 30% (runtime fraction 0.3) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Razorclaw Lynx (razorclaw-lynx)

A blur of claws and hungry momentum

### Traits

- razorclaw-lynx-relentless-hunter: Deals 20% more damage to Bleeding targets.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| rending-claws | Rending Claws | 1300 ms (1.3 s) | special, physical, melee, debuff | Raking claws cut the target and leave a lingering Bleeding wound. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.25<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "bleeding",<br>    "durationMs": 8000,<br>    "periodicEffects": [<br>      {<br>        "type": "deal-damage",<br>        "target": "self",<br>        "components": [<br>          {<br>            "damageType": "physical",<br>            "magnitude": {<br>              "type": "source-basic-damage-percent",<br>              "value": 0.3625<br>            }<br>          }<br>        ],<br>        "tags": [<br>          "dot",<br>          "physical"<br>        ]<br>      }<br>    ],<br>    "tags": [<br>      "debuff",<br>      "dot",<br>      "physical"<br>    ]<br>  }<br>] |

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
        "id": "rending-claws-step",
        "type": "action",
        "actionId": "rending-claws"
      },
      {
        "id": "basic-2",
        "type": "basic"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| predator-fang | 1 | 1 | 0.45 | 45% (runtime fraction 0.45) |
| predator-hide | 1 | 1 | 0.45 | 45% (runtime fraction 0.45) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Corrupted Dire Wolf (corrupted-dire-wolf)

A beast split between fang and sorcery

### Traits

- corrupted-dire-wolf-arcane-corruption: Corruption grants 10% resistance to Fire, Water, Earth, and Air.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| arcane-bite | Arcane Bite | 1600 ms (1.6 s) | special, physical, arcane, melee, direct | A corrupted bite tears through both body and warding. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 0.7<br>        }<br>      },<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 0.7<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| corrupted-howl | Corrupted Howl | 1800 ms (1.8 s) | special, buff | The howl fills the Corrupted Dire Wolf with Haste. | [<br>  {<br>    "type": "apply-status",<br>    "target": "self",<br>    "statusId": "haste",<br>    "durationMs": 6000,<br>    "tags": [<br>      "buff"<br>    ]<br>  }<br>] |

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
        "id": "arcane-bite-step",
        "type": "action",
        "actionId": "arcane-bite"
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
        "id": "corrupted-howl-step",
        "type": "action",
        "actionId": "corrupted-howl"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| corrupted-beast-essence | 1 | 1 | 0.35 | 35% (runtime fraction 0.35) |
| predator-hide | 1 | 1 | 0.3 | 30% (runtime fraction 0.3) |
| predator-fang | 1 | 1 | 0.25 | 25% (runtime fraction 0.25) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Corrupted Greatbear (corrupted-greatbear)

A mountain of fur warped by hungry magic

### Traits

- corrupted-greatbear-thick-hide: Basic Attack damage received is reduced by 20%.
- corrupted-greatbear-unstable-corruption: At 50% HP, gains Haste and shifts to the Corrupted Pattern once.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| crushing-maul | Crushing Maul | 1800 ms (1.8 s) | special, physical, melee, direct | A brutal maul strike crashes into the target. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.55<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| groundbreaker | Groundbreaker | 2500 ms (2.5 s) | special, physical, control | The Greatbear shakes the ground and delays the Player's Basic Attack. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.2<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "modify-action-timer",<br>    "target": "opponent",<br>    "action": "basic-attack",<br>    "amountMs": 1200<br>  }<br>] |
| corrupted-roar | Corrupted Roar | 2200 ms (2.2 s) | special, debuff | Makes the target Vulnerable. | [<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "vulnerable",<br>    "tags": [<br>      "debuff"<br>    ]<br>  }<br>] |
| arcane-rampage | Arcane Rampage | 3500 ms (3.5 s) | special, magic, arcane, direct | A heavy Arcane strike empowered by unstable corruption. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 2<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |

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
      }
    ]
  },
  "corrupted": {
    "id": "corrupted",
    "steps": [
      {
        "id": "basic-1",
        "type": "basic"
      },
      {
        "id": "corrupted-roar-step",
        "type": "action",
        "actionId": "corrupted-roar"
      },
      {
        "id": "crushing-maul-step",
        "type": "action",
        "actionId": "crushing-maul"
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
        "id": "arcane-rampage-step",
        "type": "action",
        "actionId": "arcane-rampage"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| predator-hide | 2 | 4 | 1 | 100% (runtime fraction 1) |
| corrupted-beast-essence | 1 | 2 | 1 | 100% (runtime fraction 1) |
| greatbear-core | 1 | 1 | 0.35 | 35% (runtime fraction 0.35) |
| greatbear-heartstone | 1 | 1 | 0.05 | 5% (runtime fraction 0.05) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |
