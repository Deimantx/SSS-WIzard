/** MVP provisional balance. Keep tuning values here rather than in UI components. */
export const BALANCE = {
  tickMs: 100,
  player: { maxHealth: 100, healthRegenPerSecond: 1, outOfCombatRegenMultiplier: 5, basicAttackDamage: 8, basicAttackIntervalMs: 2200 },
  mana: { startingMana: 50, maxMana: 100 },
  channeling: { baseNaturalRegenPerSecond: 5, echoFocusCost: 10, echoManaPerSecond: 5, maxEchoes: 5, discoveryEchoMultiplier: 1.1, stableLeylineRegenBonus: 1, stableLeylineThreshold: 2500, echoResonanceDurationMs: 120000, deepReservoirThreshold: 225, deepReservoirCapacityBonus: 25 },
  focus: { startingMax: 100, forestHeartBonus: 10, guildApprenticeBonus: 10 },
  research: { maxPreparedSlots: 4, maxEchoes: 5, echoFocusCost: 10, manaCostPerItem: 5, durationPerItemMs: 5000, matchingXp: 12, nonMatchingXp: 8 },
  transmutation: { echoFocusCost: 10, maxEchoes: 5 },
  dungeon: { encounterDelayMs: 5000, whisperingWoodsThreatRequired: 20 },
  mainBoss: { startingMagicLevelCap: 10, firstBossMagicLevelCap: 20 },
} as const
export const SCHOOL_LEVEL_XP = (level: number) => level * 20
