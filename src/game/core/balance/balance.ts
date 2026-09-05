/** MVP provisional balance. Keep tuning values here rather than in UI components. */
export const BALANCE = {
  tickMs: 100,
  player: { maxHealth: 100, healthRegenPerSecond: 1, outOfCombatRegenMultiplier: 2, basicAttackDamage: 5, basicAttackIntervalMs: 2200, baseSpellPower: 50, baseDefense: 5, baseCritChance: 0.05, baseCritDamage: 1.5 },
  mana: { startingMana: 0, maxMana: 100 },
  channeling: { baseNaturalRegenPerSecond: 0, echoFocusCost: 10, echoManaPerSecond: 5, maxEchoes: 5, discoveryEchoMultiplier: 1.1, stableLeylineRegenBonus: 1, stableLeylineThreshold: 2500, echoResonanceDurationMs: 120000, deepReservoirThreshold: 225, deepReservoirCapacityBonus: 25 },
  focus: { startingMax: 100, forestHeartBonus: 10, guildApprenticeBonus: 10 },
  research: { maxPreparedSlots: 4, maxEchoes: 5, echoFocusCost: 10, manaCostPerItem: 30, durationPerItemMs: 10000, matchingXp: 12, nonMatchingXp: 8 },
  transmutation: { echoFocusCost: 10, maxEchoes: 5 },
  dungeon: { encounterDelayMs: 5000, whisperingWoodsThreatRequired: 20 },
  schoolProgression: { startingCap: 20, tutorialCompleteCap: 40 },
} as const
