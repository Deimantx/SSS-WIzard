# Whispering Woods equipment

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Equipment ID | Name | Slot | Hands | Stats | Combat modifiers | Combat rules | Origin relation | Recipe ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ember-staff | Ember Staff | weapon | 2 | {<br>  "basicDamage": 4,<br>  "maxMana": 10,<br>  "spellPower": 20<br>} | [<br>  {<br>    "key": "spell-damage-percent",<br>    "value": 0.2,<br>    "sourceKinds": [<br>      "spell"<br>    ],<br>    "damageTypes": [<br>      "fire"<br>    ]<br>  }<br>] | [] | whispering-woods | ember-staff |
| wispwood-wand | Wispwood Wand | weapon | 1 | {<br>  "basicDamage": 2,<br>  "maxMana": 5,<br>  "spellPower": 10<br>} | [] | [] | whispering-woods | wispwood-wand |
| tide-focus | Tide Focus | offhand | [NOT DEFINED IN RUNTIME] | {<br>  "maxMana": 15,<br>  "spellPower": 10<br>} | [<br>  {<br>    "key": "barrier-power-percent",<br>    "value": 0.2,<br>    "sourceKinds": [<br>      "spell"<br>    ],<br>    "damageTypes": [<br>      "water"<br>    ]<br>  }<br>] | [] | whispering-woods | tide-focus |
| stoneweave-robe | Stoneweave Robe | armor | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 20<br>} | [<br>  {<br>    "key": "barrier-received-flat",<br>    "value": 10<br>  }<br>] | [] | whispering-woods | stoneweave-robe |
| windthread-charm | Windthread Charm | amulet | [NOT DEFINED IN RUNTIME] | {<br>  "maxFocus": 10,<br>  "spellPower": 10<br>} | [<br>  {<br>    "key": "spell-damage-percent",<br>    "value": 0.1,<br>    "sourceKinds": [<br>      "spell"<br>    ],<br>    "damageTypes": [<br>      "air"<br>    ]<br>  }<br>] | [] | whispering-woods | windthread-charm |
| wispveil-hood | Wispveil Hood | helmet | [NOT DEFINED IN RUNTIME] | {<br>  "maxMana": 15,<br>  "manaRegen": 1<br>} | [] | [] | whispering-woods | wispveil-hood |
| grovekeeper-mantle | Grovekeeper Mantle | cape | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 15,<br>  "resistances": {<br>    "physical": 0.03<br>  }<br>} | [] | [] | whispering-woods | grovekeeper-mantle |
| wispbound-ring | Wispbound Ring | ring | [NOT DEFINED IN RUNTIME] | {<br>  "manaRegen": 1,<br>  "maxMana": 10<br>} | [] | [] | whispering-woods | wispbound-ring |
| heartseed-necklace | Heartseed Necklace | amulet | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 20<br>} | [<br>  {<br>    "key": "healing-done-percent",<br>    "value": 0.05<br>  }<br>] | [<br>  {<br>    "id": "living-seed",<br>    "event": "on-hp-threshold",<br>    "condition": {<br>      "type": "self-hp-below-percent",<br>      "percent": 30<br>    },<br>    "oncePerEncounter": true,<br>    "effects": [<br>      {<br>        "type": "gain-barrier",<br>        "target": "self",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 20<br>        }<br>      }<br>    ],<br>    "ui": {<br>      "name": "Living Seed"<br>    }<br>  }<br>] | whispering-woods | [NOT DEFINED IN RUNTIME] |

Boss relic membership is documented separately in [Boss Relics](./Boss_Relics.md); the item remains in its authored dungeon set here.
