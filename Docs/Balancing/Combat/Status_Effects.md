# Status effects

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

All rows come from STATUS_DEFINITIONS. Durations and periodic intervals are milliseconds. Modifier values use exact runtime fractions.

| Status ID | Name | Classification | Tags | Default duration | Stacking | Cleanse | Dispel | Prevents action | Modifiers | Periodic | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| burning | Burning | debuff | debuff, dot, fire | 5000 ms (5 s) | {<br>  "mode": "refresh"<br>} | true | false | false | [] | 1000 ms (1 s)<br>[<br>  {<br>    "type": "deal-damage",<br>    "target": "self",<br>    "components": [<br>      {<br>        "damageType": "fire",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 5<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "dot",<br>      "fire"<br>    ]<br>  }<br>] | [] |
| quickening | Quickening | buff | buff, air | 6000 ms (6 s) | {<br>  "mode": "refresh"<br>} | false | true | false | [<br>  {<br>    "key": "basic-attack-speed-percent",<br>    "value": 0.25<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| haste | Haste | buff | buff | indefinite (null) | {<br>  "mode": "refresh"<br>} | false | true | false | [<br>  {<br>    "key": "action-speed-percent",<br>    "value": 0.15<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| spectral-fade | Spectral Fade | buff | buff | 5000 ms (5 s) | {<br>  "mode": "strongest"<br>} | false | true | false | [<br>  {<br>    "key": "damage-taken-percent",<br>    "value": -0.25<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| thorn-wound | Thorn Wound | debuff | debuff, dot | 6000 ms (6 s) | {<br>  "mode": "refresh"<br>} | true | false | false | [] | 2000 ms (2 s)<br>[<br>  {<br>    "type": "deal-damage",<br>    "target": "self",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 3<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "dot",<br>      "physical"<br>    ]<br>  }<br>] | [] |
| bleeding | Bleeding | debuff | debuff, dot, physical | 8000 ms (8 s) | {<br>  "mode": "refresh"<br>} | true | false | false | [] | 2000 ms (2 s)<br>[<br>  {<br>    "type": "deal-damage",<br>    "target": "self",<br>    "components": [<br>      {<br>        "damageType": "physical",<br>        "magnitude": {<br>          "type": "flat",<br>          "value": 4<br>        }<br>      }<br>    ],<br>    "tags": [<br>      "dot",<br>      "physical"<br>    ]<br>  }<br>] | [] |
| chilled | Chilled | debuff | debuff, control, water | 5000 ms (5 s) | {<br>  "mode": "strongest"<br>} | true | false | false | [<br>  {<br>    "key": "basic-attack-speed-percent",<br>    "value": -0.2<br>  },<br>  {<br>    "key": "action-speed-percent",<br>    "value": -0.2<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| regeneration | Regeneration | buff | buff, hot, water | 6000 ms (6 s) | {<br>  "mode": "refresh"<br>} | false | true | false | [] | 1000 ms (1 s)<br>[<br>  {<br>    "type": "heal",<br>    "target": "self",<br>    "magnitude": {<br>      "type": "flat",<br>      "value": 5<br>    },<br>    "tags": [<br>      "heal",<br>      "hot"<br>    ]<br>  }<br>] | [] |
| fortified | Fortified | buff | buff, earth | 8000 ms (8 s) | {<br>  "mode": "strongest"<br>} | false | true | false | [<br>  {<br>    "key": "damage-taken-percent",<br>    "value": -0.15<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| shock | Shock | debuff | debuff, air | 8000 ms (8 s) | {<br>  "mode": "stacks",<br>  "maxStacks": 5<br>} | true | false | false | [<br>  {<br>    "key": "damage-taken-percent",<br>    "value": 0.04,<br>    "damageTypes": [<br>      "air"<br>    ],<br>    "perStack": true<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| staggered | Staggered | debuff | debuff, control, earth | 1000 ms (1 s) | {<br>  "mode": "refresh"<br>} | true | false | false | [] | [NOT DEFINED IN RUNTIME] | [] |
| vulnerable | Vulnerable | debuff | debuff | 6000 ms (6 s) | {<br>  "mode": "strongest"<br>} | true | false | false | [<br>  {<br>    "key": "damage-taken-percent",<br>    "value": 0.15<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| purified | Purified | buff | buff, water | 4000 ms (4 s) | {<br>  "mode": "refresh"<br>} | false | true | false | [<br>  {<br>    "key": "status-duration-received-percent",<br>    "value": -0.5,<br>    "statusTags": [<br>      "debuff"<br>    ]<br>  }<br>] | [NOT DEFINED IN RUNTIME] | [] |
| stunned | Stunned | debuff | debuff, control | 3000 ms (3 s) | {<br>  "mode": "refresh"<br>} | true | false | true | [] | [NOT DEFINED IN RUNTIME] | [] |

## Status authoring notes

Status IDs are stable references used by spells, monster actions, traits, equipment, saves, and telemetry. Application-time overrides are runtime mechanics and are not a second status registry.
