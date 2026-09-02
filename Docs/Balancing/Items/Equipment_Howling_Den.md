# Howling Den equipment

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Equipment ID | Name | Slot | Hands | Stats | Combat modifiers | Combat rules | Origin relation | Recipe ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fangbound-dagger | Fangbound Dagger | weapon | 1 | {<br>  "basicDamage": 8,<br>  "basicAttackSpeedPct": 0.08,<br>  "critChance": 0.05<br>} | [] | [] | howling-den | fangbound-dagger |
| fangbound-buckler | Fangbound Buckler | offhand | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 30,<br>  "blockChance": 0.15,<br>  "resistances": {<br>    "physical": 0.03<br>  }<br>} | [] | [] | howling-den | fangbound-buckler |
| corrupted-howlstaff | Corrupted Howlstaff | weapon | 2 | {<br>  "spellPower": 30,<br>  "cooldownRecoveryPct": 0.1,<br>  "statusDurationPct": 0.1<br>} | [] | [] | howling-den | corrupted-howlstaff |
| razorclaw-circlet | Razorclaw Circlet | helmet | [NOT DEFINED IN RUNTIME] | {<br>  "critChance": 0.02,<br>  "critDamage": 0.15,<br>  "basicAttackSpeedPct": 0.05<br>} | [] | [] | howling-den | razorclaw-circlet |
| predator-hide-mantle | Predator-Hide Mantle | cape | [NOT DEFINED IN RUNTIME] | {<br>  "resistances": {<br>    "physical": 0.05<br>  }<br>} | [<br>  {<br>    "key": "status-duration-received-percent",<br>    "value": -0.1,<br>    "statusTags": [<br>      "debuff"<br>    ]<br>  }<br>] | [] | howling-den | predator-hide-mantle |
| greatbear-vestment | Greatbear Vestment | armor | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 40,<br>  "defense": 10,<br>  "resistances": {<br>    "physical": 0.1<br>  }<br>} | [] | [] | howling-den | greatbear-vestment |
| howling-signet | Howling Signet | ring | [NOT DEFINED IN RUNTIME] | {<br>  "maxMana": 20,<br>  "maxHealth": 10<br>} | [] | [<br>  {<br>    "id": "predators-feast",<br>    "event": "on-kill",<br>    "effects": [<br>      {<br>        "type": "heal",<br>        "target": "self",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 25<br>        }<br>      }<br>    ],<br>    "ui": {<br>      "name": "Predator's Feast"<br>    }<br>  }<br>] | howling-den | howling-signet |
| greatbear-heartstone | Greatbear Heartstone | amulet | [NOT DEFINED IN RUNTIME] | {<br>  "maxHealth": 25,<br>  "resistances": {<br>    "fire": 0.05,<br>    "water": 0.05,<br>    "earth": 0.05,<br>    "air": 0.05<br>  }<br>} | [] | [<br>  {<br>    "id": "unyielding",<br>    "event": "on-hp-threshold",<br>    "condition": {<br>      "type": "self-hp-below-percent",<br>      "percent": 35<br>    },<br>    "oncePerEncounter": true,<br>    "effects": [<br>      {<br>        "type": "gain-barrier",<br>        "target": "self",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 40<br>        }<br>      }<br>    ],<br>    "ui": {<br>      "name": "Unyielding"<br>    }<br>  }<br>] | howling-den | [NOT DEFINED IN RUNTIME] |

Boss relic membership is documented separately in [Boss Relics](./Boss_Relics.md); the item remains in its authored dungeon set here.
