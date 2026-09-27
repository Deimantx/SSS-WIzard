import type { EquipmentStats } from '../../types'

export type SigilStatId =
  | 'spellPower' | 'spellPowerPct' | 'maxHealth' | 'maxHealthPct' | 'maxMana' | 'maxManaPct'
  | 'critChance' | 'critDamage' | 'cooldownRecoveryPct' | 'healingDonePct' | 'barrierPowerPct'
  | 'damageOverTimePct' | 'manaCostReductionPct' | 'statusDurationPct'

export interface SigilStatDefinition {
  id: SigilStatId
  label: string
  mainBase: number
  mainPerRank: number
  secondaryMin: number
  secondaryMax: number
}

const percent = (value: number) => value / 100

export const SIGIL_STAT_DEFINITIONS: Record<SigilStatId, SigilStatDefinition> = {
  spellPower: { id: 'spellPower', label: 'Spell Power', mainBase: 5, mainPerRank: 1, secondaryMin: 2, secondaryMax: 5 },
  spellPowerPct: { id: 'spellPowerPct', label: 'Spell Power %', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  maxHealth: { id: 'maxHealth', label: 'Max Health', mainBase: 30, mainPerRank: 6, secondaryMin: 12, secondaryMax: 30 },
  maxHealthPct: { id: 'maxHealthPct', label: 'Max Health %', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  maxMana: { id: 'maxMana', label: 'Max Mana', mainBase: 10, mainPerRank: 2, secondaryMin: 4, secondaryMax: 10 },
  maxManaPct: { id: 'maxManaPct', label: 'Max Mana %', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  critChance: { id: 'critChance', label: 'Critical Rate', mainBase: percent(1.5), mainPerRank: percent(.3), secondaryMin: percent(1), secondaryMax: percent(2) },
  critDamage: { id: 'critDamage', label: 'Critical Damage', mainBase: percent(3), mainPerRank: percent(.6), secondaryMin: percent(2), secondaryMax: percent(4) },
  cooldownRecoveryPct: { id: 'cooldownRecoveryPct', label: 'Cooldown Recovery', mainBase: percent(1.5), mainPerRank: percent(.3), secondaryMin: percent(1), secondaryMax: percent(2) },
  healingDonePct: { id: 'healingDonePct', label: 'Healing Done', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  barrierPowerPct: { id: 'barrierPowerPct', label: 'Barrier Power', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  damageOverTimePct: { id: 'damageOverTimePct', label: 'Damage over Time', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
  manaCostReductionPct: { id: 'manaCostReductionPct', label: 'Mana Cost Reduction', mainBase: percent(1.5), mainPerRank: percent(.3), secondaryMin: percent(.75), secondaryMax: percent(1.5) },
  statusDurationPct: { id: 'statusDurationPct', label: 'Status Duration', mainBase: percent(2), mainPerRank: percent(.4), secondaryMin: percent(1.5), secondaryMax: percent(3) },
}

export const SIGIL_MAIN_STAT_POOLS: Record<number, readonly SigilStatId[]> = {
  1: ['spellPower'],
  2: ['spellPowerPct', 'maxHealthPct', 'maxManaPct', 'cooldownRecoveryPct', 'manaCostReductionPct'],
  3: ['maxHealth'],
  4: ['critChance', 'critDamage', 'healingDonePct', 'barrierPowerPct', 'damageOverTimePct'],
  5: ['maxMana'],
  6: ['spellPowerPct', 'cooldownRecoveryPct', 'healingDonePct', 'barrierPowerPct', 'damageOverTimePct', 'statusDurationPct'],
}

export const SIGIL_SECONDARY_STAT_IDS = Object.keys(SIGIL_STAT_DEFINITIONS) as SigilStatId[]

export const resolveSigilMainStat = (statId: SigilStatId, rank: number, tierMultiplier: number): number => {
  const definition = SIGIL_STAT_DEFINITIONS[statId]
  return (definition.mainBase + definition.mainPerRank * Math.max(0, rank)) * tierMultiplier
}

export const resolveSigilSecondaryRoll = (statId: SigilStatId, quality01: number, tierMultiplier: number): number => {
  const definition = SIGIL_STAT_DEFINITIONS[statId]
  const safeQuality = Math.min(1, Math.max(0, Number.isFinite(quality01) ? quality01 : 0))
  return (definition.secondaryMin + (definition.secondaryMax - definition.secondaryMin) * safeQuality) * tierMultiplier
}

export const resolveSigilStats = (sigil: { mainStatId: SigilStatId; rank: number; tier: number; secondaries: Array<{ statId: SigilStatId; rolls: Array<{ quality01: number; rank: number }> }> }, tierMultiplier: (tier: number) => { mainStatMultiplier: number; secondaryRollMultiplier: number }): EquipmentStats => {
  const multipliers = tierMultiplier(sigil.tier)
  const total: EquipmentStats = { [sigil.mainStatId]: resolveSigilMainStat(sigil.mainStatId, sigil.rank, multipliers.mainStatMultiplier) } as EquipmentStats
  sigil.secondaries.forEach((secondary) => {
    total[secondary.statId] = (total[secondary.statId] ?? 0) + secondary.rolls.reduce((sum, roll) => sum + resolveSigilSecondaryRoll(secondary.statId, roll.quality01, multipliers.secondaryRollMultiplier), 0)
  })
  return total
}
