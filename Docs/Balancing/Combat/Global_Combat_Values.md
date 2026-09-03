# Global combat values

## Core settings

| Stable setting ID | Designer label | Value |
| --- | --- | --- |
| mana.startingMana | Starting Mana | 50 |
| mana.maxMana | Max Mana | 100 |
| channeling.baseNaturalRegenPerSecond | Base Natural Regen Per Second | 5 |
| channeling.echoFocusCost | Echo Focus Cost | 10 |
| channeling.echoManaPerSecond | Echo Mana Per Second | 5 |
| channeling.maxEchoes | Max Echoes | 5 |
| channeling.discoveryEchoMultiplier | Discovery Echo Multiplier | 1.1 |
| channeling.stableLeylineRegenBonus | Stable Leyline Regen Bonus | 1 |
| channeling.stableLeylineThreshold | Stable Leyline Threshold | 2500 |
| channeling.echoResonanceDurationMs | Echo Resonance Duration | 2 min |
| channeling.deepReservoirThreshold | Deep Reservoir Threshold | 225 |
| channeling.deepReservoirCapacityBonus | Deep Reservoir Capacity Bonus | 25 |
| focus.startingMax | Starting Max | 100 |
| focus.forestHeartBonus | Forest Heart Bonus | 10 |
| focus.guildApprenticeBonus | Guild Apprentice Bonus | 10 |
| research.maxPreparedSlots | Max Prepared Slots | 4 |
| research.maxEchoes | Max Echoes | 5 |
| research.echoFocusCost | Echo Focus Cost | 10 |
| research.manaCostPerItem | Mana Cost Per Item | 5 |
| research.durationPerItemMs | Duration Per Item | 5 s |
| research.matchingXp | Matching XP | 12 |
| research.nonMatchingXp | Non Matching XP | 8 |
| transmutation.echoFocusCost | Echo Focus Cost | 10 |
| transmutation.maxEchoes | Max Echoes | 5 |
| dungeon.encounterDelayMs | Encounter Delay | 5 s |
| dungeon.whisperingWoodsThreatRequired | Whispering Woods Threat Required | 20 |
| schoolProgression.startingCap | Starting Cap | 20 |
| schoolProgression.tutorialCompleteCap | Tutorial Complete Cap | 40 |

## Combat bounds and defaults

| Rule | Value | Meaning |
| --- | --- | --- |
| min resistance | -100% | Lowest ordinary resistance value |
| max resistance | +75% | Highest ordinary resistance before immunity |
| default enemy Defense | 10 | Fallback Defense for an enemy without an override |
| default enemy Critical Strike chance | 5% | Fallback chance |
| default enemy Critical Strike damage | 1.5x | Fallback multiplier |
| default combat speed | 1x | Normal action speed |
| Defense curve constant | 100 | Constant in the Defense reduction formula |
| maximum Defense reduction | 80% | Reduction cap |
| maximum Block chance | 75% | Block chance cap |
| Block damage reduction | 50% | Damage removed by a successful Block |
| maximum Critical Strike chance | 100% | Critical Strike chance cap |
| minimum Critical Strike damage | 1x | Multiplier floor |
| maximum Critical Strike damage | 5x | Multiplier cap |

## Action timing limits

| Setting | Value |
| --- | --- |
| MIN ACTION TIME MS | 100 ms |
| MIN ACTION RATE | 0.1 |
| MAX ACTION RATE | 10 |
| MAX ACTION WORK MS | 1440 min |
