import { MONSTERS } from '../../content/monsters'
import { BALANCE } from '../../core/balance/balance'
import { DEFAULT_COMBAT_SPEED_MULTIPLIER, DEFAULT_ENEMY_CRIT_CHANCE, DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, DEFAULT_ENEMY_DEFENSE, DEFENSE_K, MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_DEFENSE_REDUCTION, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { getEquipmentStats, type EquipmentStatsState } from '../../core/equipment/equipmentStats'
import { getPlayerManaCapacityBreakdown, getPlayerManaRegenBreakdown } from '../mana/playerMana'
import { getSpellPower } from '../spells/spellPower'
import type { EquipmentStats, GameState } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatSource, DamageType } from './combatTypes'
import { getCombatModifiers, getResistance, type CombatModifierState } from './modifiers'
import { getActiveEncounterWorldTier, resolveWorldTierEnemyProfile } from '../world-tier/worldTierRuntime'

export { BLOCK_DAMAGE_REDUCTION, DEFAULT_COMBAT_SPEED_MULTIPLIER, DEFAULT_ENEMY_CRIT_CHANCE, DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, DEFAULT_ENEMY_DEFENSE, DEFENSE_K, MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_DEFENSE_REDUCTION, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']

export interface CommonCombatStats {
  maxHealth: number
  healthRegen: number
  maxMana: number
  manaRegen: number
  spellPower: number
  critChance: number
  critDamageMultiplier: number
  damageOverTimeBonus: number
  statusDurationBonus: number
  defense: number
  defenseReduction: number
  resistances: Partial<Record<DamageType, number>>
  cooldownRecovery: number
  healingDoneBonus: number
  barrierPowerBonus: number
  manaCostReduction: number
}

export interface PlayerCombatStats extends CommonCombatStats {}
export interface EnemyCombatStats extends CommonCombatStats {
  basicAttackDamage: number
  basicAttackSpeedMultiplier: number
  basicAttackIntervalMs: number
  blockChance: number
}
export type CombatStats = PlayerCombatStats | EnemyCombatStats

export type PlayerSheetState = Pick<GameState, 'player' | 'progress' | 'activities' | 'equipment' | 'artifactProgress' | 'crystals'> & Partial<Pick<GameState, 'debug' | 'arcaneCore'>>

const finite = (value: number | undefined, fallback = 0) => Number.isFinite(value) ? value as number : fallback
const clampPercent = (value: number, min: number, max: number) => Math.min(max, Math.max(min, finite(value)))
const clampSpeed = (value: number) => Math.min(10, Math.max(0.1, finite(value, DEFAULT_COMBAT_SPEED_MULTIPLIER)))

export const getDefenseReductionFromRating = (defense: number) => {
  const rating = Math.max(0, finite(defense))
  return Math.min(MAX_DEFENSE_REDUCTION, rating / (rating + DEFENSE_K))
}

const playerEquipmentStat = (state: EquipmentStatsState, key: keyof EquipmentStats) => finite(getEquipmentStats(state)[key] as number | undefined)
const playerBaseMaxHealth = (state: PlayerSheetState) => {
  const equipment = getEquipmentStats(state)
  return (finite(state.player.baseMaxHealth, BALANCE.player.maxHealth) + finite(equipment.maxHealth)) * (1 + finite(equipment.maxHealthPct))
}
const getPlayerSheetStats = (state: PlayerSheetState): PlayerCombatStats => {
  const equipment = getEquipmentStats(state)
  const defense = Math.max(0, BALANCE.player.baseDefense + finite(equipment.defense))
  return {
    maxHealth: playerBaseMaxHealth(state),
    healthRegen: BALANCE.player.healthRegenPerSecond + playerEquipmentStat(state, 'healthRegen'),
    maxMana: getPlayerManaCapacityBreakdown(state).total,
    manaRegen: getPlayerManaRegenBreakdown(state).total,
    spellPower: getSpellPower(state),
    critChance: clampPercent(BALANCE.player.baseCritChance + finite(equipment.critChance), 0, MAX_CRIT_CHANCE),
    critDamageMultiplier: clampPercent(BALANCE.player.baseCritDamage + finite(equipment.critDamage), MIN_CRIT_DAMAGE_MULTIPLIER, MAX_CRIT_DAMAGE_MULTIPLIER),
    damageOverTimeBonus: finite(equipment.damageOverTimePct),
    statusDurationBonus: finite(equipment.statusDurationPct),
    defense,
    defenseReduction: getDefenseReductionFromRating(defense),
    resistances: Object.fromEntries(DAMAGE_TYPES.map((type) => [type, clampPercent(finite(equipment.resistances?.[type]), MIN_RESISTANCE, MAX_RESISTANCE)])) as Partial<Record<DamageType, number>>,
    cooldownRecovery: Math.max(0, 1 + finite(equipment.cooldownRecoveryPct)),
    healingDoneBonus: finite(equipment.healingDonePct),
    barrierPowerBonus: finite(equipment.barrierPowerPct),
    manaCostReduction: clampPercent(finite(equipment.manaCostReductionPct), 0, 0.8),
  }
}

const getPlayerRuntimeStats = (state: GameState): PlayerCombatStats => {
  const sheet = getPlayerSheetStats(state)
  const defense = getDefense(state, 'player')
  return {
    ...sheet,
    maxHealth: sheet.maxHealth,
    maxMana: state.player.maxMana,
    healthRegen: sheet.healthRegen + getCombatModifiers(state, 'player', 'health-regen-flat'),
    critChance: getCritChance(state, 'player'),
    critDamageMultiplier: getCritDamageMultiplier(state, 'player'),
    damageOverTimeBonus: getDamageOverTimeBonus(state, 'player'),
    statusDurationBonus: getStatusDurationBonus(state, 'player'),
    defense,
    defenseReduction: getDefenseReduction(state, 'player'),
    resistances: Object.fromEntries(DAMAGE_TYPES.map((type) => [type, getResistance(state, 'player', type)])) as Partial<Record<DamageType, number>>,
    cooldownRecovery: getCooldownRecoveryMultiplier(state, 'player'),
    healingDoneBonus: getHealingDoneBonus(state, 'player'),
    barrierPowerBonus: getBarrierPowerBonus(state, 'player'),
  }
}

const getEnemyBase = (state: GameState) => state.combat.enemyId ? MONSTERS[state.combat.enemyId] : undefined

export const DEFAULT_ENEMY_BASIC_ATTACK_INTERVAL_MS = 2_200

const getEnemyStats = (state: GameState): EnemyCombatStats => {
  const monster = getEnemyBase(state)
  const basicAttackSpeedMultiplier = getBasicAttackSpeedMultiplier(state, 'enemy')
  const defense = getDefense(state, 'enemy')
  return {
    maxHealth: state.combat.enemyMaxHp || monster?.maxHealth || 0,
    healthRegen: 0,
    maxMana: 0,
    manaRegen: 0,
    spellPower: 0,
    basicAttackDamage: monster ? resolveWorldTierEnemyProfile(monster.id, getActiveEncounterWorldTier(state)).basicAttackDamage : 0,
    basicAttackSpeedMultiplier,
    basicAttackIntervalMs: (monster?.basicAttackTimeMs ?? DEFAULT_ENEMY_BASIC_ATTACK_INTERVAL_MS) / basicAttackSpeedMultiplier,
    critChance: getCritChance(state, 'enemy'),
    critDamageMultiplier: getCritDamageMultiplier(state, 'enemy'),
    damageOverTimeBonus: getDamageOverTimeBonus(state, 'enemy'),
    statusDurationBonus: getStatusDurationBonus(state, 'enemy'),
    defense,
    defenseReduction: getDefenseReduction(state, 'enemy'),
    blockChance: getBlockChance(state, 'enemy'),
    resistances: Object.fromEntries(DAMAGE_TYPES.map((type) => [type, getResistance(state, 'enemy', type)])) as Partial<Record<DamageType, number>>,
    cooldownRecovery: getCooldownRecoveryMultiplier(state, 'enemy'),
    healingDoneBonus: getHealingDoneBonus(state, 'enemy'),
    barrierPowerBonus: getBarrierPowerBonus(state, 'enemy'),
    manaCostReduction: 0,
  }
}

export const getPlayerSheetCombatStats = getPlayerSheetStats
export const getPlayerCombatStats = getPlayerRuntimeStats
export const getEnemyCombatStats = getEnemyStats
export const getCombatStats = (state: GameState, actor: CombatActor) => actor === 'player' ? getPlayerCombatStats(state) : getEnemyCombatStats(state)

export const getDefense = (state: GameState, actor: CombatActor) => {
  const base = actor === 'player' ? BALANCE.player.baseDefense : getEnemyBase(state) ? resolveWorldTierEnemyProfile(getEnemyBase(state)!.id, getActiveEncounterWorldTier(state)).defense : DEFAULT_ENEMY_DEFENSE
  const flat = getCombatModifiers(state, actor, 'defense-flat')
  const percent = getCombatModifiers(state, actor, 'defense-percent')
  return Math.max(0, (base + flat) * (1 + percent))
}

export const getDefenseReduction = (state: GameState, actor: CombatActor) => getDefenseReductionFromRating(getDefense(state, actor))

export const getCritChance = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  const base = actor === 'player' ? BALANCE.player.baseCritChance : (getEnemyBase(state)?.critChance ?? DEFAULT_ENEMY_CRIT_CHANCE)
  return clampPercent(base + getCombatModifiers(state, actor, 'crit-chance', { source, sourceTags: source?.tags }) + (source?.spellCritChanceBonus ?? 0), 0, MAX_CRIT_CHANCE)
}

export const getCritDamageMultiplier = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  const base = actor === 'player' ? BALANCE.player.baseCritDamage : (getEnemyBase(state)?.critDamage ?? DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER)
  return clampPercent(base + getCombatModifiers(state, actor, 'crit-damage', { source, sourceTags: source?.tags }) + (source?.spellCritDamageBonus ?? 0), MIN_CRIT_DAMAGE_MULTIPLIER, MAX_CRIT_DAMAGE_MULTIPLIER)
}

export const getBlockChance = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  if (actor === 'player') return 0
  const base = getEnemyBase(state)?.blockChance ?? 0
  return clampPercent(base + getCombatModifiers(state, actor, 'block-chance', { source, sourceTags: source?.tags }), 0, MAX_BLOCK_CHANCE)
}

export const getBasicAttackSpeedMultiplier = (state: GameState, actor: CombatActor) => actor === 'enemy' ? clampSpeed(1 + getCombatModifiers(state, actor, 'basic-attack-speed-percent', { sourceTags: ['basic-attack'] })) : 1

export const getDamageOverTimeBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'damage-over-time-percent', { source, sourceTags: source?.tags })
export const getStatusDurationBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'status-duration-dealt-percent', { source, sourceTags: source?.tags })
export const getHealingDoneBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'healing-done-percent', { source, sourceTags: source?.tags })
export const getBarrierPowerBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'barrier-power-percent', { source, sourceTags: source?.tags })
export const getCooldownRecoveryMultiplier = (state: CombatModifierState, actor: CombatActor = 'player') => Math.max(0, Math.min(10, 1 + getCombatModifiers(state, actor, 'cooldown-recovery-percent')))

export const getEffectiveManaCost = (state: EquipmentStatsState, baseManaCost: number) => Math.max(1, Math.ceil(Math.max(0, baseManaCost) * (1 - clampPercent(playerEquipmentStat(state, 'manaCostReductionPct'), 0, 0.8))))
