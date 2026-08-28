import { STATUS_DEFINITIONS } from '../statuses'
import type { BestiaryCategory, CombatCondition, CombatEffect, CombatTag, DamageType, ItemId, Magnitude, MonsterId, SpecialAttackDefinition, StatusId, TraitDefinition } from '../../types'

export interface MonsterDefinition {
  id: MonsterId
  bestiaryCategory: BestiaryCategory
  name: string
  subtitle: string
  maxHealth: number
  attackDamage: number
  attackIntervalMs: number
  color: string
  image?: string
  traits: TraitDefinition[]
  resistances?: Partial<Record<DamageType, number>>
  damageImmunities?: DamageType[]
  statusImmunities?: StatusId[]
  statusTagImmunities?: CombatTag[]
  loot: { itemId: ItemId; min: number; max: number; chance: number }[]
  actionSequence: { id: string; name: string; kind: 'basic' | 'special'; specialAttackId?: string }[]
  specialAttacks: Record<string, SpecialAttackDefinition>
}

const basic = (id: string) => ({ id, name: 'Basic', kind: 'basic' as const })
const special = (id: string, specialAttackId: string, name: string) => ({ id, name, kind: 'special' as const, specialAttackId })
const lifeEssenceDrop = { itemId: 'life-essence' as const, min: 1, max: 3, chance: 1 }
const directDamage = (damageType: DamageType, value: number): CombatEffect => ({ type: 'deal-damage', target: 'opponent', damageType, magnitude: { type: 'flat', value }, tags: ['direct'] })
const gainBarrier = (magnitude: Magnitude): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude, mode: 'add', tags: ['barrier'] })
const apply = (statusId: 'thorn-wound' | 'haste', target: 'self' | 'opponent', durationMs?: number | null): CombatEffect => ({ type: 'apply-status', target, statusId, durationMs, tags: [target === 'self' ? 'buff' : 'debuff'] })
const delay = (amountMs: number): CombatEffect => ({ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct'] })

const barkskin: TraitDefinition = { id: 'thornling-barkskin', name: 'Barkskin', description: 'Basic Attack damage received is reduced by 15%.', modifiers: [{ key: 'damage-taken-percent', value: -0.15, sourceTags: ['basic-attack'] }] }
const rootedShell: TraitDefinition = { id: 'stone-rooted-shell', name: 'Rooted Shell', description: 'Starts with Barrier equal to 15% max HP.', rules: [{ id: 'stone-rooted-shell-start', event: 'on-combat-start', effects: [gainBarrier({ type: 'source-max-health-percent', value: 0.15 })], oncePerEncounter: true }] }
const ancientGrowth: TraitDefinition = { id: 'grove-sentinel-ancient-growth', name: 'Ancient Growth', description: 'At 40% HP, gains a large Barrier once.', rules: [{ id: 'grove-sentinel-ancient-growth-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 40 }, effects: [gainBarrier({ type: 'flat', value: 80 })], oncePerEncounter: true }] }
const livingCore: TraitDefinition = { id: 'forest-heart-living-core', name: 'Living Core', description: 'At 50% HP, gains 15% attack speed once.', rules: [{ id: 'forest-heart-living-core-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, effects: [apply('haste', 'self', null)], oncePerEncounter: true }] }

export const MONSTERS: Record<MonsterId, MonsterDefinition> = {
  'forest-wisp': { id: 'forest-wisp', bestiaryCategory: 'monster', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth', maxHealth: 44, attackDamage: 5, attackIntervalMs: 2800, color: '#aa9aff', traits: [{ id: 'forest-wisp-flicker', name: 'Flicker', description: 'Arc Spark is telegraphed before it lands.' }], actionSequence: [basic('basic-1'), basic('basic-2'), special('arc-spark-step', 'arc-spark', 'Arc Spark')], specialAttacks: { 'arc-spark': { id: 'arc-spark', name: 'Arc Spark', telegraphMs: 2000, description: 'A bright spark for 12 damage.', effects: [directDamage('arcane', 12)], tags: ['special', 'magic'], interruptible: true } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  thornling: { id: 'thornling', bestiaryCategory: 'monster', name: 'Thornling', subtitle: 'A knot of spite and briars', maxHealth: 64, attackDamage: 8, attackIntervalMs: 2500, color: '#cb7899', traits: [barkskin], actionSequence: [basic('basic-1'), basic('basic-2'), special('thorn-lash-step', 'thorn-lash', 'Thorn Lash')], specialAttacks: { 'thorn-lash': { id: 'thorn-lash', name: 'Thorn Lash', telegraphMs: 1800, description: '10 damage and a delayed Thorn Wound.', effects: [directDamage('physical', 10), apply('thorn-wound', 'opponent')], tags: ['special', 'debuff'], interruptible: true } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  'stone-root': { id: 'stone-root', bestiaryCategory: 'monster', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat', maxHealth: 92, attackDamage: 11, attackIntervalMs: 3200, color: '#b28f79', traits: [rootedShell], actionSequence: [basic('basic-1'), basic('basic-2'), basic('basic-3'), special('root-slam-step', 'root-slam', 'Root Slam')], specialAttacks: { 'root-slam': { id: 'root-slam', name: 'Root Slam', telegraphMs: 2500, description: '18 damage and 700ms Basic Attack delay.', effects: [directDamage('physical', 18), delay(700)], tags: ['special', 'control'], interruptible: true } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 3, chance: 1 }] },
  'grove-sentinel': { id: 'grove-sentinel', bestiaryCategory: 'boss', name: 'Grove Sentinel', subtitle: 'Dungeon boss - guardian of the inner grove', maxHealth: 360, attackDamage: 15, attackIntervalMs: 2600, color: '#d39b59', traits: [ancientGrowth], actionSequence: [basic('basic-1'), basic('basic-2'), special('root-crush-step', 'root-crush', 'Root Crush'), basic('basic-3'), special('verdant-guard-step', 'verdant-guard', 'Verdant Guard')], specialAttacks: { 'root-crush': { id: 'root-crush', name: 'Root Crush', telegraphMs: 2000, description: '20 damage.', effects: [directDamage('physical', 20)], tags: ['special', 'direct'], interruptible: true }, 'verdant-guard': { id: 'verdant-guard', name: 'Verdant Guard', telegraphMs: 2500, description: 'Gain 60 Barrier.', effects: [gainBarrier({ type: 'flat', value: 60 })], tags: ['special', 'barrier'], interruptible: true } }, loot: [{ itemId: 'grove-bark', min: 2, max: 3, chance: 1 }, { itemId: 'wisp-essence', min: 4, max: 6, chance: 1 }] },
  'forest-heart': { id: 'forest-heart', bestiaryCategory: 'special-boss', name: 'Forest Heart', subtitle: 'Main boss - the pulse beneath the roots', maxHealth: 600, attackDamage: 20, attackIntervalMs: 2400, color: '#e06c8b', traits: [livingCore], actionSequence: [basic('basic-1'), special('heart-pulse-step', 'heart-pulse', 'Heart Pulse'), basic('basic-2'), basic('basic-3'), special('root-prison-step', 'root-prison', 'Root Prison'), basic('basic-4'), special('sap-step', 'rejuvenating-sap', 'Rejuvenating Sap')], specialAttacks: { 'heart-pulse': { id: 'heart-pulse', name: 'Heart Pulse', telegraphMs: 2000, description: '24 damage.', effects: [directDamage('physical', 24)], tags: ['special', 'direct'], interruptible: true }, 'root-prison': { id: 'root-prison', name: 'Root Prison', telegraphMs: 2000, description: '16 damage and 1 second Basic Attack delay.', effects: [directDamage('physical', 16), delay(1000)], tags: ['special', 'control'], interruptible: true }, 'rejuvenating-sap': { id: 'rejuvenating-sap', name: 'Rejuvenating Sap', telegraphMs: 3000, description: 'Heal 60 HP.', effects: [heal(60)], tags: ['special', 'hot'], interruptible: true } }, loot: [{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }] },
}

Object.values(MONSTERS).forEach((monster) => { if (!monster.loot.some((drop) => drop.itemId === 'life-essence')) monster.loot.push(lifeEssenceDrop) })
export const isBossMonster = (monster: MonsterDefinition) => monster.bestiaryCategory !== 'monster'
export const WHISPERING_WOODS_MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[]

export const validateMonsterDefinitions = () => {
  const errors: string[] = []
  const validateCondition = (owner: string, condition: CombatCondition | undefined): void => {
    if (!condition) return
    if ((condition.type === 'self-hp-below-percent' || condition.type === 'target-hp-below-percent') && (!Number.isFinite(condition.percent) || condition.percent < 0 || condition.percent > 100)) errors.push(`${owner}: invalid HP threshold`)
    if (condition.type === 'status-stack-at-least' && (!Number.isFinite(condition.stacks) || condition.stacks < 1)) errors.push(`${owner}: invalid status stack threshold`)
    if (condition.type === 'all' || condition.type === 'any') condition.conditions.forEach((entry) => validateCondition(owner, entry))
    if (condition.type === 'not') validateCondition(owner, condition.condition)
  }
  const validateEffects = (owner: string, effects: CombatEffect[]) => effects.forEach((effect) => {
    if ('magnitude' in effect) {
      const magnitude = effect.magnitude
      if ('value' in magnitude && !Number.isFinite(magnitude.value)) errors.push(`${owner}: non-finite magnitude`)
      if (magnitude.type === 'school-level' && (!Number.isFinite(magnitude.base) || !Number.isFinite(magnitude.perLevel))) errors.push(`${owner}: non-finite school magnitude`)
    }
    if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${owner}: unknown status ${effect.statusId}`)
  })
  Object.entries(MONSTERS).forEach(([key, monster]) => {
    if (key !== monster.id || !Number.isFinite(monster.maxHealth) || monster.maxHealth <= 0 || !Number.isFinite(monster.attackDamage) || !Number.isFinite(monster.attackIntervalMs) || monster.attackIntervalMs <= 0) errors.push(`${monster.id}: invalid combat numbers`)
    const traitIds = monster.traits.map((trait) => trait.id)
    if (new Set(traitIds).size !== traitIds.length) errors.push(`${monster.id}: duplicate trait id`)
    const ruleIds = monster.traits.flatMap((trait) => trait.rules ?? []).map((rule) => rule.id)
    if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${monster.id}: duplicate trigger rule id`)
    monster.actionSequence.forEach((step) => { if (step.kind === 'special' && (!step.specialAttackId || !monster.specialAttacks[step.specialAttackId])) errors.push(`${monster.id}: missing special reference`) })
    Object.entries(monster.specialAttacks).forEach(([key, specialAttack]) => { if (key !== specialAttack.id) errors.push(`${monster.id}/${key}: key/id mismatch`); if (specialAttack.telegraphMs < 0 || !Number.isFinite(specialAttack.telegraphMs)) errors.push(`${monster.id}/${specialAttack.id}: invalid telegraph`); validateEffects(`${monster.id}/${specialAttack.id}`, specialAttack.effects) })
    monster.traits.forEach((trait) => trait.rules?.forEach((rule) => { validateCondition(`${monster.id}/${trait.id}/${rule.id}`, rule.condition); validateEffects(`${monster.id}/${trait.id}/${rule.id}`, rule.effects) }))
    Object.entries(monster.resistances ?? {}).forEach(([damageType, resistance]) => { if (!Number.isFinite(resistance) || resistance < -1 || resistance > 0.9) errors.push(`${monster.id}: invalid ${damageType} resistance`) })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-monsters] ${errors.join('; ')}`)
  return errors
}

validateMonsterDefinitions()
