# Dungeon progression

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Dungeon ID | Name | Threat required | Boss ID | Encounter delay | Unlock condition | Normal pool | Tutorial completion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| whispering-woods | Whispering Woods | 20 | forest-heart | 5000 ms (5 s) | {<br>  "type": "always"<br>} | forest-wisp, thornling, stone-root, grove-sentinel | false |
| howling-den | Howling Den | 25 | corrupted-greatbear | 5000 ms (5 s) | {<br>  "type": "boss-kill",<br>  "bossId": "forest-heart"<br>} | cavefang-wolf, razorclaw-lynx, corrupted-dire-wolf | false |
| abandoned-catacombs | Abandoned Catacombs | 30 | archmage-edrin-shade | 5000 ms (5 s) | {<br>  "type": "boss-kill",<br>  "bossId": "corrupted-greatbear"<br>} | restless-skeleton, grave-wraith, fallen-acolyte | true |

Dungeon descriptions and set relationships are repeated in the per-dungeon documents for human navigation; the registry above is the authoritative ID index.
