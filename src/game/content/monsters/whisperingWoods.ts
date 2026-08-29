import { STATUS_DEFINITIONS } from '../statuses'
import { getTraitDefinition, getTraitDefinitions, validateTraitDefinitions } from '../traits'
import type { ActionPattern, ActionStep, BestiaryCategory, CombatActionDefinition, CombatEffect, CombatTag, DamageType, ItemId, Magnitude, MonsterId, StatusId, TraitId } from '../../types'

export interface MonsterDefinition {
  id: MonsterId
  bestiaryCategory: BestiaryCategory
  name: string
  subtitle: string
  maxHealth: number
  basicAttackDamage: number
  actionIntervalMs: number
  color: string
  image?: string
  traitIds: TraitId[]
  resistances?: Partial<Record<DamageType, number>>
  damageImmunities?: DamageType[]
  statusImmunities?: StatusId[]
  statusTagImmunities?: CombatTag[]
  loot: { itemId: ItemId; min: number; max: number; chance: number }[]
  actions: Record<string, CombatActionDefinition>
  actionPatterns: Record<string, ActionPattern>
  defaultActionPatternId: string
}

// Monster-specific Actions stay with monster content. If an identical Action
// is genuinely shared later, extract the CombatActionDefinition as data under
// content/actions/sharedActions.ts; the runtime remains universal.
const basic = (id: string): ActionStep => ({ id, type: 'basic' })
const action = (id: string, actionId: string): ActionStep => ({ id, type: 'action', actionId })
const lifeEssenceDrop = { itemId: 'life-essence' as const, min: 1, max: 3, chance: 1 }
const directDamage = (damageType: DamageType, value: number): CombatEffect => ({ type: 'deal-damage', target: 'opponent', damageType, magnitude: { type: 'flat', value }, tags: ['direct'] })
const gainBarrier = (magnitude: Magnitude): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude, mode: 'add', durationMs: null, tags: ['barrier'] })
const apply = (statusId: 'thorn-wound' | 'haste', target: 'self' | 'opponent', durationMs?: number | null): CombatEffect => ({ type: 'apply-status', target, statusId, durationMs, tags: [target === 'self' ? 'buff' : 'debuff'] })
const delay = (amountMs: number): CombatEffect => ({ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct'] })

const withTraits = (traitIds: TraitId[]) => ({ traitIds })
const COMBAT_TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', 'physical', 'arcane', 'fire', 'water', 'earth', 'air']

export const MONSTERS: Record<MonsterId, MonsterDefinition> = {
  'forest-wisp': { id: 'forest-wisp', bestiaryCategory: 'monster', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth', maxHealth: 44, basicAttackDamage: 5, actionIntervalMs: 2800, color: '#aa9aff', ...withTraits(['forest-wisp-flicker']), actions: { 'arc-spark': { id: 'arc-spark', name: 'Arc Spark', telegraphMs: 2000, description: 'A bright spark for 12 damage.', effects: [directDamage('arcane', 12)], tags: ['special', 'magic', 'arcane', 'direct'], interruptible: true } }, actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('arc-spark-step', 'arc-spark')] } }, defaultActionPatternId: 'default', loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  thornling: { id: 'thornling', bestiaryCategory: 'monster', name: 'Thornling', subtitle: 'A knot of spite and briars', maxHealth: 64, basicAttackDamage: 8, actionIntervalMs: 2500, color: '#cb7899', ...withTraits(['thornling-barkskin']), actions: { 'thorn-lash': { id: 'thorn-lash', name: 'Thorn Lash', telegraphMs: 1800, description: '10 damage and a delayed Thorn Wound.', effects: [directDamage('physical', 10), apply('thorn-wound', 'opponent')], tags: ['special', 'physical', 'debuff'], interruptible: true } }, actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('thorn-lash-step', 'thorn-lash')] } }, defaultActionPatternId: 'default', loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  'stone-root': { id: 'stone-root', bestiaryCategory: 'monster', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat', maxHealth: 92, basicAttackDamage: 11, actionIntervalMs: 3200, color: '#b28f79', ...withTraits(['stone-rooted-shell']), actions: { 'root-slam': { id: 'root-slam', name: 'Root Slam', telegraphMs: 2500, description: '18 damage and 700ms Basic Attack delay.', effects: [directDamage('physical', 18), delay(700)], tags: ['special', 'physical', 'control'], interruptible: true } }, actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), basic('basic-3'), action('root-slam-step', 'root-slam')] } }, defaultActionPatternId: 'default', loot: [{ itemId: 'wisp-essence', min: 1, max: 3, chance: 1 }] },
  'grove-sentinel': { id: 'grove-sentinel', bestiaryCategory: 'boss', name: 'Grove Sentinel', subtitle: 'Dungeon boss - guardian of the inner grove', maxHealth: 360, basicAttackDamage: 15, actionIntervalMs: 2600, color: '#d39b59', ...withTraits(['grove-sentinel-ancient-growth']), actions: { 'root-crush': { id: 'root-crush', name: 'Root Crush', telegraphMs: 2000, description: '20 damage.', effects: [directDamage('physical', 20)], tags: ['special', 'physical', 'direct'], interruptible: true }, 'verdant-guard': { id: 'verdant-guard', name: 'Verdant Guard', telegraphMs: 2500, description: 'Gain 60 Barrier.', effects: [gainBarrier({ type: 'flat', value: 60 })], tags: ['special', 'barrier'], interruptible: true } }, actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('root-crush-step', 'root-crush'), basic('basic-3'), action('verdant-guard-step', 'verdant-guard')] } }, defaultActionPatternId: 'default', loot: [{ itemId: 'grove-bark', min: 2, max: 3, chance: 1 }, { itemId: 'wisp-essence', min: 4, max: 6, chance: 1 }] },
  'forest-heart': { id: 'forest-heart', bestiaryCategory: 'special-boss', name: 'Forest Heart', subtitle: 'Main boss - the pulse beneath the roots', maxHealth: 600, basicAttackDamage: 20, actionIntervalMs: 2400, color: '#e06c8b', ...withTraits(['forest-heart-living-core']), actions: { 'heart-pulse': { id: 'heart-pulse', name: 'Heart Pulse', telegraphMs: 2000, description: '24 damage.', effects: [directDamage('physical', 24)], tags: ['special', 'physical', 'direct'], interruptible: true }, 'root-prison': { id: 'root-prison', name: 'Root Prison', telegraphMs: 2000, description: '16 damage and 1 second Basic Attack delay.', effects: [directDamage('physical', 16), delay(1000)], tags: ['special', 'physical', 'control'], interruptible: true }, 'rejuvenating-sap': { id: 'rejuvenating-sap', name: 'Rejuvenating Sap', telegraphMs: 3000, description: 'Heal 60 HP.', effects: [heal(60)], tags: ['special', 'heal', 'direct'], interruptible: true } }, actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('heart-pulse-step', 'heart-pulse'), basic('basic-2'), basic('basic-3'), action('root-prison-step', 'root-prison'), basic('basic-4'), action('sap-step', 'rejuvenating-sap')] } }, defaultActionPatternId: 'default', loot: [{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }] },
}

Object.values(MONSTERS).forEach((monster) => { if (!monster.loot.some((drop) => drop.itemId === 'life-essence')) monster.loot.push(lifeEssenceDrop) })
export const isBossMonster = (monster: MonsterDefinition) => monster.bestiaryCategory !== 'monster'
export const WHISPERING_WOODS_MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[]

export const validateMonsterDefinitions = () => {
  const errors: string[] = []
  const validateCondition = (owner: string, condition: import('../../types').CombatCondition | undefined): void => {
    if (!condition) return
    if (condition.type === 'event-action-is' && !condition.actionId.trim()) errors.push(`${owner}: action id is required`)
    if (condition.type === 'event-action-has-tag' && !COMBAT_TAGS.includes(condition.tag)) errors.push(`${owner}: invalid action tag`)
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
    if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
  })
  Object.entries(MONSTERS).forEach(([key, monster]) => {
    if (key !== monster.id || !Number.isFinite(monster.maxHealth) || monster.maxHealth <= 0 || !Number.isFinite(monster.basicAttackDamage) || monster.basicAttackDamage < 0 || !Number.isFinite(monster.actionIntervalMs) || monster.actionIntervalMs < 100) errors.push(`${monster.id}: invalid combat numbers`)
    const traitIds = monster.traitIds
    if (new Set(traitIds).size !== traitIds.length) errors.push(`${monster.id}: duplicate trait id`)
    traitIds.forEach((traitId) => { if (!getTraitDefinition(traitId)) errors.push(`${monster.id}: unknown trait ${traitId}`) })
    if (!monster.actionPatterns[monster.defaultActionPatternId]) errors.push(`${monster.id}: missing default action pattern`)
    Object.entries(monster.actions).forEach(([key, authoredAction]) => { if (key !== authoredAction.id) errors.push(`${monster.id}/${key}: key/id mismatch`); if (!authoredAction.name.trim() || !authoredAction.description.trim()) errors.push(`${monster.id}/${authoredAction.id}: name and description are required`); if (authoredAction.telegraphMs < 0 || !Number.isFinite(authoredAction.telegraphMs)) errors.push(`${monster.id}/${authoredAction.id}: invalid telegraph`); if (authoredAction.recoveryMs !== undefined && (!Number.isFinite(authoredAction.recoveryMs) || authoredAction.recoveryMs < 100)) errors.push(`${monster.id}/${authoredAction.id}: invalid recovery`); validateEffects(`${monster.id}/${authoredAction.id}`, authoredAction.effects); authoredAction.effects.forEach((effect) => { if (effect.type === 'set-action-pattern' && effect.target === 'self' && !monster.actionPatterns[effect.patternId]) errors.push(`${monster.id}/${authoredAction.id}: missing action pattern ${effect.patternId}`) }) })
    Object.entries(monster.actionPatterns).forEach(([key, pattern]) => { if (key !== pattern.id) errors.push(`${monster.id}/${key}: pattern key/id mismatch`); if (pattern.steps.length === 0) errors.push(`${monster.id}/${pattern.id}: empty pattern`); const stepIds = pattern.steps.map((step) => step.id); if (new Set(stepIds).size !== stepIds.length) errors.push(`${monster.id}/${pattern.id}: duplicate step id`); pattern.steps.forEach((step) => { const stepType: string = step.type; const actionId = 'actionId' in step ? step.actionId : undefined; if (!step.id.trim()) errors.push(`${monster.id}/${pattern.id}: step id is required`); if (stepType !== 'basic' && stepType !== 'action') errors.push(`${monster.id}/${pattern.id}/${step.id}: invalid step type`); if (stepType === 'action' && (!actionId || !monster.actions[actionId])) errors.push(`${monster.id}/${pattern.id}: missing action reference ${actionId ?? ''}`) }) })
    getTraitDefinitions(monster.traitIds).forEach((trait) => trait.rules?.forEach((rule) => {
      validateCondition(`${monster.id}/${trait.id}/${rule.id}`, rule.condition)
      rule.effects.forEach((effect) => {
        if (effect.type === 'set-action-pattern' && effect.target === 'self' && !monster.actionPatterns[effect.patternId]) errors.push(`${monster.id}/${trait.id}/${rule.id}: missing action pattern ${effect.patternId}`)
      })
    }))
    Object.entries(monster.resistances ?? {}).forEach(([damageType, resistance]) => { if (!Number.isFinite(resistance) || resistance < -1 || resistance > 0.9) errors.push(`${monster.id}: invalid ${damageType} resistance`) })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-monsters] ${errors.join('; ')}`)
  return errors
}

validateTraitDefinitions()
validateMonsterDefinitions()
