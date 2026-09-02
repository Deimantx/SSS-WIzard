# Water spells

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

**School ID:** water  
**Tagline:** Recovery and protection  
**Fragment ID:** water-fragment

| Spell ID | Name | Type | Unlock level | Mana cost | Cooldown | Effects |
| --- | --- | --- | --- | --- | --- | --- |
| water-ward | Water Ward | barrier | 2 | 15 | 8000 ms (8 s) | [<br>  {<br>    "type": "gain-barrier",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "spell-power",<br>      "coefficient": 0.7<br>    },<br>    "mode": "replace",<br>    "durationMs": 9000,<br>    "tags": [<br>      "barrier"<br>    ]<br>  }<br>] |
| flow-mend | Flow Mend | heal | 8 | 18 | 10000 ms (10 s) | [<br>  {<br>    "type": "heal",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "spell-power",<br>      "coefficient": 0.8<br>    },<br>    "tags": [<br>      "heal",<br>      "direct",<br>      "water"<br>    ]<br>  }<br>] |
| frostbite | Frostbite | damage | 16 | 22 | 10000 ms (10 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "water",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.65<br>        }<br>      }<br>    ],<br>    "school": "water",<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "chilled",<br>    "tags": [<br>      "debuff",<br>      "control"<br>    ]<br>  }<br>] |
