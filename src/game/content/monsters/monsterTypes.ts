import type { ActionPattern, ActionStep, BestiaryCategory, CombatActionDefinition, CombatEffect, CombatTag, DamageType, ItemId, Magnitude, MonsterId, StatusId, TraitId } from '../../types'
import { periodicDamageStatus } from '../statuses/periodicDamageStatus'

export type MonsterPortraitIcon = 'wisp' | 'plant' | 'stone' | 'guardian' | 'wolf' | 'claw' | 'bear' | 'skeleton' | 'ghost' | 'mage' | 'boss'

export interface MonsterDefinition {
  id: MonsterId
  bestiaryCategory: BestiaryCategory
  name: string
  subtitle: string
  maxHealth: number
  basicAttackDamage: number
  /** Base amount of time required for one Basic Attack Pattern step. */
  basicAttackTimeMs: number
  /** Optional RPG stat overrides. Runtime defaults live in combatStats. */
  defense?: number
  critChance?: number
  critDamage?: number
  blockChance?: number
  color: string
  image?: string
  ui?: { portraitIcon?: MonsterPortraitIcon }
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

/** Default Monster authoring: damage scales from Basic Attack Damage. */
export const scaledDirectDamage = (damageType: DamageType, coefficient: number, tags: CombatTag[] = ['direct']): CombatEffect => ({ type: 'deal-damage', target: 'opponent', damageType, magnitude: { type: 'source-basic-damage-percent', value: coefficient }, tags })
/** Explicit escape hatch for intentionally fixed Monster damage. */
export const flatDirectDamage = (damageType: DamageType, value: number, tags: CombatTag[] = ['direct']): CombatEffect => ({ type: 'deal-damage', target: 'opponent', damageType, magnitude: { type: 'flat', value }, tags })
export const gainBarrier = (magnitude: Magnitude): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude, mode: 'add', durationMs: null, tags: ['barrier'] })
/** Default Monster authoring: healing scales from the source Monster's Max Health. */
export const scaledHeal = (maxHealthCoefficient: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: maxHealthCoefficient }, tags: ['heal', 'direct'] })
/** Default Monster authoring: Barrier scales from the source Monster's Max Health. */
export const scaledBarrier = (maxHealthCoefficient: number): CombatEffect => gainBarrier({ type: 'source-max-health-percent', value: maxHealthCoefficient })
export const applyStatus = (statusId: StatusId, target: 'self' | 'opponent', durationMs?: number | null): CombatEffect => ({ type: 'apply-status', target, statusId, durationMs, tags: [target === 'self' ? 'buff' : 'debuff'] })
export const delayBasicAttack = (amountMs: number): CombatEffect => ({ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs })
/** Explicit escape hatch for intentionally fixed Monster healing. */
export const flatHeal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct'] })
/** Default Monster authoring: DoT coefficient is the total output over its duration. */
export const scaledDot = (statusId: StatusId, damageType: DamageType, totalBasicDamageCoefficient: number, durationMs: number): CombatEffect => periodicDamageStatus({ statusId, durationMs, damageType, totalMagnitude: { type: 'source-basic-damage-percent', value: totalBasicDamageCoefficient } })
