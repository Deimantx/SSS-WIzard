# Player base stats

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

| Balance ID | Runtime value | Unit / note |
| --- | --- | --- |
| BALANCE.player.maxHealth | 100 | runtime value |
| BALANCE.player.healthRegenPerSecond | 1 | runtime value |
| BALANCE.player.outOfCombatRegenMultiplier | 5 | runtime value |
| BALANCE.player.basicAttackDamage | 8 | runtime value |
| BALANCE.player.basicAttackIntervalMs | 2200 | ms |
| BALANCE.player.baseSpellPower | 100 | runtime value |
| BALANCE.player.baseDefense | 10 | runtime value |
| BALANCE.player.baseCritChance | 0.05 | runtime value; see combat formula |
| BALANCE.player.baseCritDamage | 1.5 | runtime value; see combat formula |

Player save state also persists current, derived, and compatibility fields. Derived runtime values should be inspected through the combat/equipment read models rather than copied into this authored-base table.
