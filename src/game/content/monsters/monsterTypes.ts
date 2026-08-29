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

export const basic = (id: string): ActionStep => ({ id, type: 'basic' })
export const action = (id: string, actionId: string): ActionStep => ({ id, type: 'action', actionId })
export const lifeEssenceDrop = { itemId: 'life-essence' as const, min: 1, max: 3, chance: 1 }
export const withLifeEssence = (drops: MonsterDefinition['loot']): MonsterDefinition['loot'] => [...drops, lifeEssenceDrop]

export const directDamage = (damageType: DamageType, value: number, tags: CombatTag[] = ['direct']): CombatEffect => ({ type: 'deal-damage', target: 'opponent', damageType, magnitude: { type: 'flat', value }, tags })
export const gainBarrier = (magnitude: Magnitude): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude, mode: 'add', durationMs: null, tags: ['barrier'] })
export const applyStatus = (statusId: StatusId, target: 'self' | 'opponent', durationMs?: number | null): CombatEffect => ({ type: 'apply-status', target, statusId, durationMs, tags: [target === 'self' ? 'buff' : 'debuff'] })
export const delayBasicAttack = (amountMs: number): CombatEffect => ({ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs })
export const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct'] })
