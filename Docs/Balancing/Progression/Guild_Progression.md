# Guild progression

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Request ID | Name | Kind | Item ID | Target amount | Reward / metadata |
| --- | --- | --- | --- | --- | --- |
| arcane-supply | Arcane Supply | donation | fire-fragment | 20 | {<br>  "id": "arcane-supply",<br>  "name": "Arcane Supply",<br>  "description": "Donate Fire Fragments to light the guild hearth.",<br>  "kind": "donation",<br>  "itemId": "fire-fragment",<br>  "target": 20,<br>  "reputation": 50<br>} |
| clear-the-woods | Clear the Woods | kills | [NOT DEFINED IN RUNTIME] | 30 | {<br>  "id": "clear-the-woods",<br>  "name": "Clear the Woods",<br>  "description": "Defeat normal monsters in Whispering Woods.",<br>  "kind": "kills",<br>  "target": 30,<br>  "reputation": 50<br>} |
| sentinel-breaker | Sentinel Breaker | monster-kills | [NOT DEFINED IN RUNTIME] | 2 | {<br>  "id": "sentinel-breaker",<br>  "name": "Sentinel Breaker",<br>  "description": "Defeat Grove Sentinel twice.",<br>  "kind": "monster-kills",<br>  "target": 2,<br>  "reputation": 75<br>} |

Guild ranks, unlock flags, reputation, and request progress are persisted progression state. Their mutation remains in the Guild store actions.
