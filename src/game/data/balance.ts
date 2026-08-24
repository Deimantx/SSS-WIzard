/** MVP provisional balance. Keep tuning values here rather than in UI components. */
export const BALANCE = {
  tickMs: 100,
  player: { maxHealth: 100, healthRegenPerSecond: 1, outOfCombatRegenMultiplier: 5, basicAttackDamage: 8, basicAttackIntervalMs: 2200 },
  mana: { startingMana: 50, maxMana: 100, passiveRegenPerSecond: 1, manualChannelAmount: 15, manualChannelCooldownMs: 1000, autoChannelFocus: 15, autoChannelManaPerSecond: 4 },
  focus: { startingMax: 100, forestHeartBonus: 10, guildApprenticeBonus: 10 },
  condense: { focusCost: 20, manaCost: 15, durationMs: 6000 },
  research: { focusCost: 25, manaCostPerItem: 5, durationPerItemMs: 5000, xpPerFragment: 10, matchingXp: 12, nonMatchingXp: 8 },
  transmutation: { focusCost: 20, durationMs: 8000 },
  dungeon: { encounterDelayMs: 5000, whisperingWoodsThreatRequired: 20 },
  mainBoss: { startingMagicLevelCap: 10, firstBossMagicLevelCap: 20 },
} as const
export const SCHOOL_LEVEL_XP = (level: number) => level * 20
