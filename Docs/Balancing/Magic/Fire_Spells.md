# Fire spells

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

**School ID:** fire  
**Tagline:** Momentum and direct damage  
**Fragment ID:** fire-fragment

| Spell ID | Name | Type | Unlock level | Mana cost | Cooldown | Effects |
| --- | --- | --- | --- | --- | --- | --- |
| fire-bolt | Fire Bolt | damage | 2 | 12 | 3500 ms (3.5 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "fire",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.6<br>        }<br>      }<br>    ],<br>    "school": "fire",<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| ignite | Ignite | dot | 8 | 18 | 9000 ms (9 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "fire",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.1<br>        }<br>      }<br>    ],<br>    "school": "fire",<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "burning",<br>    "durationMs": 6000,<br>    "periodicEffects": [<br>      {<br>        "type": "deal-damage",<br>        "target": "self",<br>        "components": [<br>          {<br>            "damageType": "fire",<br>            "magnitude": {<br>              "type": "spell-power",<br>              "coefficient": 0.16666666666666666<br>            }<br>          }<br>        ],<br>        "tags": [<br>          "dot",<br>          "fire"<br>        ]<br>      }<br>    ],<br>    "tags": [<br>      "debuff",<br>      "dot",<br>      "fire"<br>    ]<br>  }<br>] |
| fireball | Fireball | damage | 16 | 28 | 10000 ms (10 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "fire",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 1<br>        }<br>      }<br>    ],<br>    "school": "fire",<br>    "tags": [<br>      "direct"<br>    ]<br>  },<br>  {<br>    "type": "apply-status",<br>    "target": "opponent",<br>    "statusId": "burning",<br>    "durationMs": 10000,<br>    "periodicEffects": [<br>      {<br>        "type": "deal-damage",<br>        "target": "self",<br>        "components": [<br>          {<br>            "damageType": "fire",<br>            "magnitude": {<br>              "type": "spell-power",<br>              "coefficient": 0.020000000000000004<br>            }<br>          }<br>        ],<br>        "tags": [<br>          "dot",<br>          "fire"<br>        ]<br>      }<br>    ],<br>    "tags": [<br>      "debuff",<br>      "dot",<br>      "fire"<br>    ]<br>  }<br>] |
