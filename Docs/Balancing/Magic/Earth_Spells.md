# Earth spells

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

**School ID:** earth  
**Tagline:** Wards and endurance  
**Fragment ID:** earth-fragment

| Spell ID | Name | Type | Unlock level | Mana cost | Cooldown | Effects |
| --- | --- | --- | --- | --- | --- | --- |
| earth-spike | Earth Spike | damage | 2 | 18 | 5000 ms (5 s) | [<br>  {<br>    "type": "deal-damage",<br>    "target": "opponent",<br>    "components": [<br>      {<br>        "damageType": "earth",<br>        "magnitude": {<br>          "type": "spell-power",<br>          "coefficient": 0.85<br>        }<br>      }<br>    ],<br>    "school": "earth",<br>    "tags": [<br>      "direct"<br>    ]<br>  }<br>] |
| stoneguard | Stoneguard | barrier | 8 | 22 | 18000 ms (18 s) | [<br>  {<br>    "type": "gain-barrier",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "spell-power",<br>      "coefficient": 1.3<br>    },<br>    "mode": "replace",<br>    "durationMs": 9000,<br>    "tags": [<br>      "barrier"<br>    ]<br>  }<br>] |
| fortify | Fortify | buff | 16 | 20 | 18000 ms (18 s) | [<br>  {<br>    "type": "apply-status",<br>    "target": "self",<br>    "statusId": "fortified",<br>    "tags": [<br>      "buff"<br>    ]<br>  }<br>] |
