# Auto-Cast and Focus

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

Auto-Cast is a runtime activity that consumes Focus when a spell is enabled. The table shows the authored rank cost helper and the spell's current auto-cast condition.

| Spell ID | Name | School | Rank-I Focus cost | Rank-II Focus cost | Rank-III Focus cost | Auto-cast condition |
| --- | --- | --- | --- | --- | --- | --- |
| fire-bolt | Fire Bolt | fire | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| ignite | Ignite | fire | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| fireball | Fireball | fire | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| water-ward | Water Ward | water | 10 | 20 | 30 | {<br>  "type": "barrier-below",<br>  "value": 10<br>} |
| flow-mend | Flow Mend | water | 10 | 20 | 30 | {<br>  "type": "health-below",<br>  "percent": 70<br>} |
| frostbite | Frostbite | water | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| earth-spike | Earth Spike | earth | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| stoneguard | Stoneguard | earth | 10 | 20 | 30 | {<br>  "type": "barrier-below",<br>  "value": 10<br>} |
| fortify | Fortify | earth | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| air-lance | Air Lance | air | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| quickening | Quickening | air | 10 | 20 | 30 | {<br>  "type": "always"<br>} |
| shock-spark | Shock Spark | air | 10 | 20 | 30 | {<br>  "type": "always"<br>} |

| Rank | Focus cost |
| --- | --- |
| 1 | 10 |
| 2 | 20 |
| 3 | 30 |
| 4 | 40 |
| 5 | 50 |
| 6 | 60 |
| 7 | 70 |
| 8 | 80 |

Auto-Cast enablement, current assignment, and starvation state are live profile state. Use the Schools/Spells Dev Tools and Focus Dev Tools to test them.
