import type { MonsterDefinition } from '../../content/monsters'
import { DEFAULT_COMBAT_SPEED_MULTIPLIER, DEFAULT_ENEMY_CRIT_CHANCE, DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, DEFAULT_ENEMY_DEFENSE, MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { formatNumber } from '../../utils'
import type { DamageType } from '../../types'
import type { CombatStats } from '../../systems/combat/combatStats'
import { getDefenseReductionFromRating } from '../../systems/combat/combatStats'

export type EnemyCombatStatGroup = 'core' | 'defense' | 'optional' | 'resistance'

export interface EnemyCombatStatRow {
  id: string
  label: string
  value: string
  description: string
  group: EnemyCombatStatGroup
}

export type EnemyCombatStatValues = Pick<CombatStats, 'maxHealth' | 'basicAttackDamage' | 'basicAttackSpeedMultiplier' | 'basicAttackIntervalMs' | 'critChance' | 'critDamageMultiplier' | 'defense' | 'defenseReduction' | 'blockChance' | 'resistances' | 'healingDoneBonus' | 'barrierPowerBonus' | 'damageOverTimeBonus' | 'statusDurationBonus'>

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']

const percentage = (value: number) => `${Math.round(value * 100)}%`
const pretty = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
export const formatResistanceEffect = (value: number) => `${Math.round(Math.abs(value) * 100)}% ${value < 0 ? 'Weakness' : 'Resistance'}`

/** Converts an effective Basic Attack interval into the scan-friendly live rate. */
export const getBasicAttacksPerSecond = (basicAttackIntervalMs: number) => 1000 / Math.max(1, Number.isFinite(basicAttackIntervalMs) ? basicAttackIntervalMs : 1)
export const formatBasicAttackRate = (basicAttackIntervalMs: number) => `${getBasicAttacksPerSecond(basicAttackIntervalMs).toFixed(2)}/s`
export const formatBasicAttackTime = (basicAttackIntervalMs: number) => `${(Math.max(0, basicAttackIntervalMs) / 1000).toFixed(2)}s`

/** Pure authored-stat snapshot used by the permanent Bestiary dossier. */
export const getMonsterDossierCombatStats = (monster: MonsterDefinition): EnemyCombatStatValues => {
  const defense = Math.max(0, Number.isFinite(monster.defense) ? monster.defense as number : DEFAULT_ENEMY_DEFENSE)
  const critChance = Math.min(MAX_CRIT_CHANCE, Math.max(0, Number.isFinite(monster.critChance) ? monster.critChance as number : DEFAULT_ENEMY_CRIT_CHANCE))
  const critDamageMultiplier = Math.min(MAX_CRIT_DAMAGE_MULTIPLIER, Math.max(MIN_CRIT_DAMAGE_MULTIPLIER, Number.isFinite(monster.critDamage) ? monster.critDamage as number : DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER))
  const resistances = Object.fromEntries(DAMAGE_TYPES.map((type) => [type, Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, monster.resistances?.[type] ?? 0))])) as Partial<Record<DamageType, number>>
  return {
    maxHealth: monster.maxHealth,
    basicAttackDamage: monster.basicAttackDamage,
    basicAttackSpeedMultiplier: DEFAULT_COMBAT_SPEED_MULTIPLIER,
    basicAttackIntervalMs: monster.basicAttackTimeMs,
    critChance,
    critDamageMultiplier,
    defense,
    defenseReduction: getDefenseReductionFromRating(defense),
    blockChance: Math.min(MAX_BLOCK_CHANCE, Math.max(0, monster.blockChance ?? 0)),
    resistances,
    healingDoneBonus: 0,
    barrierPowerBonus: 0,
    damageOverTimeBonus: 0,
    statusDurationBonus: 0,
  }
}

/** Canonical order, labels, rounding and descriptions for Enemy Intel and Bestiary. */
export const buildEnemyCombatStatRows = (stats: EnemyCombatStatValues): EnemyCombatStatRow[] => {
  const rows: EnemyCombatStatRow[] = [
    { id: 'max-health', label: 'Max Health', value: formatNumber(stats.maxHealth), description: 'Maximum Health for this enemy.', group: 'core' },
    { id: 'basic-attack-damage', label: 'Basic Attack Damage', value: formatNumber(stats.basicAttackDamage), description: 'Raw damage of the enemy Basic Attack before mitigation.', group: 'core' },
    { id: 'basic-attack-speed', label: 'Basic Attack Speed', value: formatBasicAttackRate(stats.basicAttackIntervalMs), description: `Current Basic Attack Time: ${formatBasicAttackTime(stats.basicAttackIntervalMs)}.`, group: 'core' },
    { id: 'defense', label: 'Defense', value: formatNumber(stats.defense), description: 'A rating that reduces Direct Hit damage with diminishing returns. Damage over Time ignores Defense.', group: 'defense' },
    { id: 'damage-reduction', label: 'Damage Reduction', value: `${(stats.defenseReduction * 100).toFixed(1)}%`, description: 'Current Direct Hit reduction produced by Defense. Capped at 80%. Damage over Time ignores Defense.', group: 'defense' },
    { id: 'crit-chance', label: 'Crit Chance', value: percentage(stats.critChance), description: 'Chance for a direct enemy hit to critically strike.', group: 'defense' },
    { id: 'crit-damage', label: 'Crit Damage', value: percentage(stats.critDamageMultiplier), description: 'Multiplier applied to a critical direct hit.', group: 'defense' },
  ]
  if (stats.blockChance > 0) rows.push({ id: 'block-chance', label: 'Block Chance', value: percentage(stats.blockChance), description: 'Chance for a Direct Hit to be Blocked. A successful Block reduces that hit by 50%. Damage over Time cannot be Blocked.', group: 'optional' })
  if (stats.healingDoneBonus !== 0) rows.push({ id: 'healing-done', label: 'Healing Done', value: percentage(stats.healingDoneBonus), description: "Bonus applied to this enemy's healing effects.", group: 'optional' })
  if (stats.barrierPowerBonus !== 0) rows.push({ id: 'barrier-power', label: 'Barrier Power', value: percentage(stats.barrierPowerBonus), description: 'Bonus applied to this enemy’s Barrier effects.', group: 'optional' })
  if (stats.damageOverTimeBonus !== 0) rows.push({ id: 'damage-over-time', label: 'Damage over Time', value: percentage(stats.damageOverTimeBonus), description: 'Bonus applied only to this enemy’s periodic damage effects.', group: 'optional' })
  if (stats.statusDurationBonus !== 0) rows.push({ id: 'status-duration', label: 'Status Duration', value: percentage(stats.statusDurationBonus), description: 'Bonus to this enemy’s outgoing status duration.', group: 'optional' })
  Object.entries(stats.resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).forEach(([type, value]) => rows.push({ id: `resistance-${type}`, label: `${pretty(type)} Resistance`, value: percentage(value ?? 0), description: `Reduces incoming ${pretty(type)} damage. Ordinary Resistance is capped at ${Math.round(MAX_RESISTANCE * 100)}%; negative values increase damage taken.`, group: 'resistance' }))
  return rows
}

export const buildMonsterDossierCombatStatRows = (monster: MonsterDefinition) => buildEnemyCombatStatRows(getMonsterDossierCombatStats(monster))
