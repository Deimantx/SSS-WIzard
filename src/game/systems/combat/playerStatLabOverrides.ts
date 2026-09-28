import type { DamageType, ModifierKey } from './combatTypes'

/** Runtime-only overrides authored by the Developer Player Stat Lab. */
export const createDefaultPlayerStatOverrides = () => ({
  maxHealthFlat: 0, maxHealthPercent: 0, healthRegenFlat: 0,
  maxManaFlat: 0, maxManaPercent: 0, manaRegenFlat: 0, manaRegenPercent: 0,
  spellPowerFlat: 0, spellPowerPercent: 0, manaCostReductionPercent: 0,
  modifiers: {} as Partial<Record<ModifierKey, number>>,
  spellDamageByType: {} as Partial<Record<DamageType, number>>,
  resistanceByType: {} as Partial<Record<DamageType, number>>,
})
