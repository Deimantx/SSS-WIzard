# Global combat values

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

Snapshot: 056705bee442836821b12edf1b1929aebded8f0e. Runtime values are shown as authored; percentage-like fields remain their exact runtime fractions.

## BALANCE

| ID / path | Runtime value |
| --- | --- |
| BALANCE.player.maxHealth | 100 |
| BALANCE.player.healthRegenPerSecond | 1 |
| BALANCE.player.outOfCombatRegenMultiplier | 5 |
| BALANCE.player.basicAttackDamage | 8 |
| BALANCE.player.basicAttackIntervalMs | 2200 |
| BALANCE.player.baseSpellPower | 100 |
| BALANCE.player.baseDefense | 10 |
| BALANCE.player.baseCritChance | 0.05 |
| BALANCE.player.baseCritDamage | 1.5 |
| BALANCE.mana.startingMana | 50 |
| BALANCE.mana.maxMana | 100 |
| BALANCE.channeling.baseNaturalRegenPerSecond | 5 |
| BALANCE.channeling.echoFocusCost | 10 |
| BALANCE.channeling.echoManaPerSecond | 5 |
| BALANCE.channeling.maxEchoes | 5 |
| BALANCE.channeling.discoveryEchoMultiplier | 1.1 |
| BALANCE.channeling.stableLeylineRegenBonus | 1 |
| BALANCE.channeling.stableLeylineThreshold | 2500 |
| BALANCE.channeling.echoResonanceDurationMs | 120000 |
| BALANCE.channeling.deepReservoirThreshold | 225 |
| BALANCE.channeling.deepReservoirCapacityBonus | 25 |
| BALANCE.focus.startingMax | 100 |
| BALANCE.focus.forestHeartBonus | 10 |
| BALANCE.focus.guildApprenticeBonus | 10 |
| BALANCE.research.maxPreparedSlots | 4 |
| BALANCE.research.maxEchoes | 5 |
| BALANCE.research.echoFocusCost | 10 |
| BALANCE.research.manaCostPerItem | 5 |
| BALANCE.research.durationPerItemMs | 5000 |
| BALANCE.research.matchingXp | 12 |
| BALANCE.research.nonMatchingXp | 8 |
| BALANCE.transmutation.echoFocusCost | 10 |
| BALANCE.transmutation.maxEchoes | 5 |
| BALANCE.dungeon.encounterDelayMs | 5000 |
| BALANCE.dungeon.whisperingWoodsThreatRequired | 20 |
| BALANCE.schoolProgression.startingCap | 20 |
| BALANCE.schoolProgression.tutorialCompleteCap | 40 |

## Combat bounds and defaults

| ID | Runtime value | Meaning |
| --- | --- | --- |
| MIN_RESISTANCE | -1 | Canonical lower bound for ordinary resistance |
| MAX_RESISTANCE | 0.75 | Canonical upper bound for ordinary resistance |
| DEFAULT_ENEMY_DEFENSE | 10 | Enemy defense fallback |
| DEFAULT_ENEMY_CRIT_CHANCE | 0.05 | Enemy crit chance fallback; runtime fraction |
| DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER | 1.5 | Enemy crit multiplier fallback |
| DEFAULT_COMBAT_SPEED_MULTIPLIER | 1 | Default action-speed multiplier |
| DEFENSE_K | 100 | Defense reduction curve constant |
| MAX_DEFENSE_REDUCTION | 0.8 | Defense reduction cap; runtime fraction |
| MAX_BLOCK_CHANCE | 0.75 | Block chance cap; runtime fraction |
| BLOCK_DAMAGE_REDUCTION | 0.5 | Blocked damage reduction; runtime fraction |
| MAX_CRIT_CHANCE | 1 | Crit chance cap; runtime fraction |
| MIN_CRIT_DAMAGE_MULTIPLIER | 1 | Crit multiplier lower bound |
| MAX_CRIT_DAMAGE_MULTIPLIER | 5 | Crit multiplier cap |

## Action timing bounds

| ID | Runtime value | Unit |
| --- | --- | --- |
| MIN_ACTION_TIME_MS | 100 | ms |
| MIN_ACTION_RATE | 0.1 | multiplier/rate |
| MAX_ACTION_RATE | 10 | multiplier/rate |
| MAX_ACTION_WORK_MS | 86400000 | ms |
