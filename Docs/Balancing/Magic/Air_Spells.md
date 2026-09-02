# Air spells

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

**School ID:** air  
**Tagline:** Speed and disruption  
**Fragment ID:** air-fragment

| Spell ID | Name | Type | Unlock level | Mana cost | Cooldown | Effects |
| --- | --- | --- | --- | --- | --- | --- |
| air-lance | Air Lance | damage | 2 | 14 | 6000 ms (6 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "air",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.6<br>        }<br>      }<br>    ],<br>    "school": "air",<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| quickening | Quickening | buff | 8 | 16 | 12000 ms (12 s) | [<br>  {<br>    "type": "apply-status",<br>    "target": "self",<br>    "statusId": "quickening",<br>    "tags": [<br>      "buff"<br>    ]<br>  }<br>] |
| shock-spark | Shock Spark | damage | 16 | 18 | 8000 ms (8 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "air",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.45<br>        }<br>      }<br>    ],<br>    "school": "air",<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "shock",<br>    "stacks": 1,<br>    "tags": [<br>      "debuff"<br>    ]<br>  }<br>] |
