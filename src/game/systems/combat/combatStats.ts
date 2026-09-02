import { MONSTERS } from '../../content/monsters'
import { BALANCE } from '../../core/balance/balance'
import { DEFENSE_K, MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_DEFENSE_REDUCTION, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../engine/channelingEngine'
import { getFocusCapacityBreakdown } from '../focus/focusCapacity'
import { getSpellPower } from '../spells/spellPower'
import type { EquipmentStats, GameState } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatSource, DamageType } from './combatTypes'
import { getCombatModifiers, getResistance } from './modifiers'

export { BLOCK_DAMAGE_REDUCTION, DEFENSE_K, MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_DEFENSE_REDUCTION, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']

export interface CombatStats {
  maxHealth: number
  maxMana: number
  manaRegen: number
  maxFocus: number
  spellPower: number
  basicAttackDamage: number
  basicAttackSpeedMultiplier: number
  basicAttackIntervalMs: number
  critChance: number
  critDamageMultiplier: number
  damageOverTimeBonus: number
  statusDurationBonus: number
  defense: number
  defenseReduction: number
  blockChance: number
  resistances: Partial<Record<DamageType, number>>
  cooldownRecovery: number
  healingDoneBonus: number
  barrierPowerBonus: number
  manaCostReduction: number
  focusEfficiency: number
}

const finite = (value: number | undefined, fallback = 0) => Number.isFinite(value) ? value as number : fallback
const clampPercent = (value: number, min: number, max: number) => Math.min(max, Math.max(min, finite(value)))
const clampSpeed = (value: number) => Math.min(10, Math.max(0.1, finite(value, 1)))

export const getDefenseReductionFromRating = (defense: number) => {
  const rating = Math.max(0, finite(defense))
  return Math.min(MAX_DEFENSE_REDUCTION, rating / (rating + DEFENSE_K))
}

const playerEquipmentStat = (state: Pick<GameState, 'equipment'>, key: keyof EquipmentStats) => finite(getEquipmentStats(state)[key] as number | undefined)
const playerBaseMaxHealth = (state: GameState) => finite(state.player.baseMaxHealth, BALANCE.player.maxHealth) + playerEquipmentStat(state, 'maxHealth')
const getPlayerSheetStats = (state: GameState): CombatStats => {
  const equipment = getEquipmentStats(state)
  const basicAttackSpeedMultiplier = clampSpeed(1 + finite(equipment.basicAttackSpeedPct))
  const defense = Math.max(0, BALANCE.player.baseDefense + finite(equipment.defense))
  return {
    maxHealth: playerBaseMaxHealth(state),
    maxMana: getManaCapacityBreakdown(state).total,
    manaRegen: getManaRegenBreakdown(state).total,
    maxFocus: getFocusCapacityBreakdown(state).total,
    spellPower: getSpellPower(state),
    basicAttackDamage: BALANCE.player.basicAttackDamage + finite(equipment.basicDamage),
    basicAttackSpeedMultiplier,
    basicAttackIntervalMs: BALANCE.player.basicAttackIntervalMs / basicAttackSpeedMultiplier,
    critChance: clampPercent(BALANCE.player.baseCritChance + finite(equipment.critChance), 0, MAX_CRIT_CHANCE),
    critDamageMultiplier: clampPercent(BALANCE.player.baseCritDamage + finite(equipment.critDamage), MIN_CRIT_DAMAGE_MULTIPLIER, MAX_CRIT_DAMAGE_MULTIPLIER),
    damageOverTimeBonus: finite(equipment.damageOverTimePct),
    statusDurationBonus: finite(equipment.statusDurationPct),
    defense,
    defenseReduction: getDefenseReductionFromRating(defense),
    blockChance: clampPercent(finite(equipment.blockChance), 0, MAX_BLOCK_CHANCE),
    resistances: Object.fromEntries(DAMAGE_TYPES.map((type) => [type, clampPercent(finite(equipment.resistances?.[type]), MIN_RESISTANCE, MAX_RESISTANCE)])) as Partial<Record<DamageType, number>>,
    cooldownRecovery: Math.max(0, 1 + finite(equipment.cooldownRecoveryPct)),
    healingDoneBonus: finite(equipment.healingDonePct),
    barrierPowerBonus: finite(equipment.barrierPowerPct),
    manaCostReduction: clampPercent(finite(equipment.manaCostReductionPct), 0, 0.8),
    focusEfficiency: clampPercent(finite(equipment.focusEfficiencyPct), 0, 0.8),
  }
}

const getPlayerRuntimeStats = (state: GameState): CombatStats => {
  const sheet = getPlayerSheetStats(state)
  const basicAttackSpeedMultiplier = getBasicAttackSpeedMultiplier(state, 'player')
  const defense = getDefense(state, 'player')
  return {
    ...sheet,
    maxHealth: sheet.maxHealth,
    maxMana: state.player.maxMana,
    maxFocus: state.player.maxFocus,
    basicAttackSpeedMultiplier,
    basicAttackIntervalMs: BALANCE.player.basicAttackIntervalMs / basicAttackSpeedMultiplier,
    critChance: getCritChance(state, 'player'),
    critDamageMultiplier: getCritDamageMultiplier(state, 'player'),
    damageOverTimeBonus: getDamageOverTimeBonus(state, 'player'),
    statusDurationBonus: getStatusDurationBonus(state, 'player'),
    defense,
    defenseReduction: getDefenseReduction(state, 'player'),
    blockChance: getBlockChance(state, 'player'),
    resistances: Object.fromEntries(DAMAGE_TYPES.map((type) => [type, getResistance(state, 'player', type)])) as Partial<Record<DamageType, number>>,
    cooldownRecovery: getCooldownRecoveryMultiplier(state, 'player'),
    healingDoneBonus: getHealingDoneBonus(state, 'player'),
    barrierPowerBonus: getBarrierPowerBonus(state, 'player'),
  }
}

const getEnemyBase = (state: GameState) => state.combat.enemyId ? MONSTERS[state.combat.enemyId] : undefined

const getEnemyStats = (state: GameState): CombatStats => {
  const monster = getEnemyBase(state)
  const basicAttackSpeedMultiplier = getBasicAttackSpeedMultiplier(state, 'enemy')
  const defense = getDefense(state, 'enemy')
  return {
    maxHealth: state.combat.enemyMaxHp || monster?.maxHealth || 0,
    maxMana: 0,
    manaRegen: 0,
    maxFocus: 0,
    spellPower: 0,
    basicAttackDamage: monster?.basicAttackDamage ?? 0,
    basicAttackSpeedMultiplier,
    basicAttackIntervalMs: (monster?.basicAttackTimeMs ?? BALANCE.player.basicAttackIntervalMs) / basicAttackSpeedMultiplier,
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
    focusEfficiency: 0,
  }
}

export const getPlayerSheetCombatStats = getPlayerSheetStats
export const getPlayerCombatStats = getPlayerRuntimeStats
export const getEnemyCombatStats = getEnemyStats
export const getCombatStats = (state: GameState, actor: CombatActor) => actor === 'player' ? getPlayerCombatStats(state) : getEnemyCombatStats(state)

export const getDefense = (state: GameState, actor: CombatActor) => {
  const base = actor === 'player' ? BALANCE.player.baseDefense : (getEnemyBase(state)?.defense ?? 10)
  return Math.max(0, base + getCombatModifiers(state, actor, 'defense-flat'))
}

export const getDefenseReduction = (state: GameState, actor: CombatActor) => getDefenseReductionFromRating(getDefense(state, actor))

export const getCritChance = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  const base = actor === 'player' ? BALANCE.player.baseCritChance : (getEnemyBase(state)?.critChance ?? 0.05)
  return clampPercent(base + getCombatModifiers(state, actor, 'crit-chance', { source, sourceTags: source?.tags }), 0, MAX_CRIT_CHANCE)
}

export const getCritDamageMultiplier = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  const base = actor === 'player' ? BALANCE.player.baseCritDamage : (getEnemyBase(state)?.critDamage ?? 1.5)
  return clampPercent(base + getCombatModifiers(state, actor, 'crit-damage', { source, sourceTags: source?.tags }), MIN_CRIT_DAMAGE_MULTIPLIER, MAX_CRIT_DAMAGE_MULTIPLIER)
}

export const getBlockChance = (state: GameState, actor: CombatActor, source?: CombatSource) => {
  const base = actor === 'player' ? 0 : (getEnemyBase(state)?.blockChance ?? 0)
  return clampPercent(base + getCombatModifiers(state, actor, 'block-chance', { source, sourceTags: source?.tags }), 0, MAX_BLOCK_CHANCE)
}

export const getBasicAttackSpeedMultiplier = (state: GameState, actor: CombatActor) => clampSpeed(1 + getCombatModifiers(state, actor, 'basic-attack-speed-percent', { sourceTags: ['basic-attack'] }))

export const getBasicAttackIntervalMs = (state: GameState, actor: CombatActor) => {
  const base = actor === 'player' ? BALANCE.player.basicAttackIntervalMs : getEnemyBase(state)?.basicAttackTimeMs ?? BALANCE.player.basicAttackIntervalMs
  return base / getBasicAttackSpeedMultiplier(state, actor)
}

export const getDamageOverTimeBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'damage-over-time-percent', { source, sourceTags: source?.tags })
export const getStatusDurationBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'status-duration-dealt-percent', { source, sourceTags: source?.tags })
export const getHealingDoneBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'healing-done-percent', { source, sourceTags: source?.tags })
export const getBarrierPowerBonus = (state: GameState, actor: CombatActor, source?: CombatSource) => getCombatModifiers(state, actor, 'barrier-power-percent', { source, sourceTags: source?.tags })
export const getCooldownRecoveryMultiplier = (state: GameState, actor: CombatActor = 'player') => Math.max(0, Math.min(10, 1 + getCombatModifiers(state, actor, 'cooldown-recovery-percent')))

export const getEffectiveManaCost = (state: Pick<GameState, 'equipment'>, baseManaCost: number) => Math.max(1, Math.ceil(Math.max(0, baseManaCost) * (1 - clampPercent(playerEquipmentStat(state, 'manaCostReductionPct'), 0, 0.8))))
export const getEffectiveFocusCost = (state: Pick<GameState, 'equipment'>, baseFocusCost: number) => Math.max(1, Math.ceil(Math.max(0, baseFocusCost) * (1 - clampPercent(playerEquipmentStat(state, 'focusEfficiencyPct'), 0, 0.8))))
