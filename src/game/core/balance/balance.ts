/** MVP provisional balance. Keep tuning values here rather than in UI components. */
export const BALANCE = {
  tickMs: 100,
  player: { maxHealth: 100, healthRegenPerSecond: 1, healthRegenIntervalMs: 1000, outOfCombatRegenMultiplier: 2, baseSpellPower: 50, baseDefense: 5, baseCritChance: 0.05, baseCritDamage: 1.5 },
  mana: { startingMana: 100, maxMana: 100, baseRegenPerSecond: 10 },
  acolytes: { startingCount: 5 },
  channeling: { baseArcaneFluxCapacity: 500, baseFluxPerAcolytePerSecond: 2, harmonicWorkforceAcolytes: 3, discoveryEchoMultiplier: 1.1, stableLeylineThreshold: 2500, echoResonanceDurationMs: 120000, deepReservoirThreshold: 1500, deepReservoirCapacityBonus: 250 },
  research: { maxPreparedSlots: 4, arcaneFluxPerItem: 5, durationPerItemMs: 10000, matchingXp: 12, nonMatchingXp: 8 },
  transmutation: {},
  dungeon: { encounterDelayMs: 5000, whisperingWoodsThreatRequired: 5000 },
  schoolProgression: { startingCap: 20, tutorialCompleteCap: 40 },
} as const
