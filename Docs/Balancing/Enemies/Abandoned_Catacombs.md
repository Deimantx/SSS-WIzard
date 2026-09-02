# Abandoned Catacombs enemies

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Monster ID | Name | Role | HP | Basic damage | Basic attack time | Defense | Crit chance | Crit damage | Block chance | Resistances | Status immunities | XP reward |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| restless-skeleton | Restless Skeleton | monster | 180 | 15 | 2700 ms (2.7 s) | 10 | 0.05 | 1.5 | 0 | {<br>  "physical": 0.25<br>} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| grave-wraith | Grave Wraith | monster | 160 | 14 | 2400 ms (2.4 s) | 10 | 0.05 | 1.5 | 0 | {<br>  "physical": 0.5,<br>  "fire": -0.25,<br>  "water": -0.25,<br>  "earth": -0.25,<br>  "air": -0.25<br>} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| fallen-acolyte | Fallen Acolyte | monster | 220 | 16 | 2600 ms (2.6 s) | 10 | 0.05 | 1.5 | 0 | {} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |
| archmage-edrin-shade | Archmage Edrin's Shade | boss | 1300 | 20 | 2500 ms (2.5 s) | 10 | 0.05 | 1.5 | 0 | {<br>  "fire": 0.15,<br>  "water": 0.15,<br>  "earth": 0.15,<br>  "air": 0.15<br>} | [NOT DEFINED IN RUNTIME] | [NOT DEFINED IN RUNTIME] |

## Restless Skeleton (restless-skeleton)

Bones animated by the last command they heard

### Traits

- restless-skeleton-brittle-bones: Physical damage is reduced by 25%.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| bone-cleaver | Bone Cleaver | 2200 ms (2.2 s) | special, physical, melee, direct | A heavy cleaver blow splits through the target. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.85<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |

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
        "id": "bone-cleaver-step",
        "type": "action",
        "actionId": "bone-cleaver"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| ossuary-remnant | 1 | 1 | 0.55 | 55.00000000000001% (runtime fraction 0.55) |
| graveglass-shard | 1 | 1 | 0.15 | 15% (runtime fraction 0.15) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Grave Wraith (grave-wraith)

A cold memory refusing to fade

### Traits

- grave-wraith-ethereal-form: Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| chilling-touch | Chilling Touch | 1800 ms (1.8 s) | special, water, magic, debuff | A cold touch damages the target and leaves it Chilled. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "water",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.3<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "chilled",<br>    "tags": [<br>      "debuff"<br>    ]<br>  }<br>] |
| fade | Fade | 1700 ms (1.7 s) | special, buff | The Grave Wraith slips into Spectral Fade. | [<br>  {<br>    "type": "apply-status",<br>    "target": "self",<br>    "statusId": "spectral-fade",<br>    "durationMs": 5000,<br>    "tags": [<br>      "buff"<br>    ]<br>  }<br>] |

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
        "id": "chilling-touch-step",
        "type": "action",
        "actionId": "chilling-touch"
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
        "id": "fade-step",
        "type": "action",
        "actionId": "fade"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| soul-residue | 1 | 1 | 0.5 | 50% (runtime fraction 0.5) |
| graveglass-shard | 1 | 1 | 0.3 | 30% (runtime fraction 0.3) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Fallen Acolyte (fallen-acolyte)

A ritualist still serving a forgotten master

### Traits

- fallen-acolyte-grave-channeling: Below 50% HP, healing done is increased by 50%.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| grave-bolt | Grave Bolt | 1500 ms (1.5 s) | special, arcane, magic, direct | A focused Arcane bolt tears through the target. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.5<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| soul-drain | Soul Drain | 2200 ms (2.2 s) | special, arcane, magic, heal, direct | Arcane force tears at the target and restores the caster's Health. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.125<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "heal",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.09<br>    },<br>    "tags": [<br>      "heal",<br>      "direct"<br>    ]<br>  }<br>] |
| death-ward | Death Ward | 2000 ms (2 s) | special, barrier | A deathly ward gathers a protective Barrier around the caster. | [<br>  {<br>    "type": "gain-barrier",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.205<br>    },<br>    "mode": "add",<br>    "durationMs": null,<br>    "tags": [<br>      "barrier"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
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
        "id": "soul-drain-step",
        "type": "action",
        "actionId": "soul-drain"
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
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| graveglass-shard | 1 | 1 | 0.35 | 35% (runtime fraction 0.35) |
| soul-residue | 1 | 1 | 0.3 | 30% (runtime fraction 0.3) |
| ossuary-remnant | 1 | 1 | 0.2 | 20% (runtime fraction 0.2) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |

## Archmage Edrin's Shade (archmage-edrin-shade)

The last spell of a wizard who would not rest

### Traits

- archmage-edrin-arcane-remnant: Resists Fire, Water, Earth, and Air damage by 15%.
- archmage-edrin-unbound-spirit: At 50% HP, gains Haste and shifts to the Unbound Pattern once.

### Actions

| Action ID | Name | Action time | Tags | Description | Exact effects |
| --- | --- | --- | --- | --- | --- |
| gravefire | Gravefire | 1800 ms (1.8 s) | special, fire, magic, debuff | Flame erupts across the target and leaves it Burning. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "fire",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.4<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "burning",<br>    "durationMs": 5000,<br>    "periodicEffects": [<br>      {<br>        "type": "deal-damage",<br>        "target": "self",<br>        "components": [<br>          {<br>            "damageType": "fire",<br>            "magnitude": {<br>              "type": "source-basic-damage-percent",<br>              "value": 0.25<br>            }<br>          }<br>        ],<br>        "tags": [<br>          "dot",<br>          "fire"<br>        ]<br>      }<br>    ],<br>    "tags": [<br>      "debuff",<br>      "dot",<br>      "fire"<br>    ]<br>  }<br>] |
| frostbind | Frostbind | 2000 ms (2 s) | special, water, magic, debuff | A freezing surge damages the target and leaves it Chilled. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "water",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.2<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "chilled",<br>    "tags": [<br>      "debuff"<br>    ]<br>  }<br>] |
| arcane-ward | Arcane Ward | 2200 ms (2.2 s) | special, arcane, barrier | Edrin shapes an Arcane ward into a protective Barrier. | [<br>  {<br>    "type": "gain-barrier",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.054<br>    },<br>    "mode": "add",<br>    "durationMs": null,<br>    "tags": [<br>      "barrier"<br>    ]<br>  }<br>] |
| soul-drain | Soul Drain | 2400 ms (2.4 s) | special, arcane, magic, heal, direct | Arcane force tears at the target and restores the caster's Health. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 1.2<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "heal",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "source-max-health-percent",<br>      "value": 0.023<br>    },<br>    "tags": [<br>      "heal",<br>      "direct"<br>    ]<br>  }<br>] |
| final-incantation | Final Incantation | 4500 ms (4.5 s) | special, arcane, magic, direct | Edrin unleashes a devastating Arcane incantation. | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "arcane",<br>        "magnitude": {<br>          "type": "source-basic-damage-percent",<br>          "value": 3.5<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |

### Action patterns

~~~json
{
  "default": {
    "id": "default",
    "steps": [
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
        "id": "arcane-ward-step",
        "type": "action",
        "actionId": "arcane-ward"
      },
      {
        "id": "basic-2",
        "type": "basic"
      },
      {
        "id": "soul-drain-step",
        "type": "action",
        "actionId": "soul-drain"
      }
    ]
  },
  "unbound": {
    "id": "unbound",
    "steps": [
      {
        "id": "basic-1",
        "type": "basic"
      },
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
        "id": "soul-drain-step",
        "type": "action",
        "actionId": "soul-drain"
      },
      {
        "id": "basic-2",
        "type": "basic"
      },
      {
        "id": "final-incantation-step",
        "type": "action",
        "actionId": "final-incantation"
      }
    ]
  }
}
~~~

### Loot

| Item ID | Min | Max | Chance (runtime fraction) | Chance (%) |
| --- | --- | --- | --- | --- |
| graveglass-shard | 2 | 4 | 1 | 100% (runtime fraction 1) |
| soul-residue | 2 | 3 | 1 | 100% (runtime fraction 1) |
| edrin-remnant | 1 | 1 | 0.35 | 35% (runtime fraction 0.35) |
| edrins-signet | 1 | 1 | 0.05 | 5% (runtime fraction 0.05) |
| life-essence | 1 | 3 | 1 | 100% (runtime fraction 1) |
