import type { ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreNodeType, ArcaneCoreResolvedEffects, ArcaneCoreRingIndex, EquipmentStats } from '../../types'
import type { CombatCondition, CombatEffect, CombatModifier, CombatTrigger, CombatTriggerRule } from '../../systems/combat/combatTypes'
import { ARCANE_CORE_NODE_ANGLE_STEP, ARCANE_CORE_RING_OFFSETS, normalizeAngle } from './arcaneCoreRings'
import { ARCANE_CORE_MAJOR_COST_BY_RING, ARCANE_CORE_STANDARD_RANK_COST_BY_RING } from './arcaneCoreBalance'

export type ArcaneCoreEffectResolver = (rank: number) => ArcaneCoreResolvedEffects
export type ArcaneCoreNodeDraft = Omit<ArcaneCoreNodeDefinition, 'branchId' | 'ring' | 'angleDeg'>

export const modifier = (key: CombatModifier['key'], value: number, condition?: CombatCondition, actor: CombatModifier['actor'] = 'player'): CombatModifier => ({ key, value, actor, ...(condition ? { condition } : {}) })
export const effect = (value: CombatEffect) => value
export const rule = (id: string, event: CombatTrigger, effects: CombatEffect[], condition?: CombatCondition, options: Pick<CombatTriggerRule, 'cooldownMs' | 'oncePerEncounter' | 'priority' | 'ui'> = {}): CombatTriggerRule => ({ id, event, effects, ...(condition ? { condition } : {}), ...options })

export const rankValues = <T>(rank: number, values: readonly T[]) => values[Math.max(1, Math.min(values.length, Math.floor(rank))) - 1]
export const resolve = (resolver?: ArcaneCoreEffectResolver): ArcaneCoreEffectResolver => resolver ?? (() => ({}))
export const linearStat = (key: keyof EquipmentStats, perRank: number): ArcaneCoreEffectResolver => (rank) => ({ stats: { [key]: perRank * rank } as EquipmentStats })
export const fixedEffects = (effects: ArcaneCoreResolvedEffects): ArcaneCoreEffectResolver => () => effects
export const rankedModifier = (key: CombatModifier['key'], perRank: number, condition?: CombatCondition, actor: CombatModifier['actor'] = 'player'): ArcaneCoreEffectResolver => (rank) => ({ modifiers: [modifier(key, perRank * rank, condition, actor)] })

const node = (nodeType: ArcaneCoreNodeType, id: string, name: string, description: string, maxRank: number, rankCost: number, resolveEffects?: ArcaneCoreEffectResolver): ArcaneCoreNodeDraft => ({ id, name, description, nodeType, maxRank, rankCost, resolveEffects: resolve(resolveEffects) })

export const minor = (id: string, name: string, description: string, resolver?: ArcaneCoreEffectResolver) => node('minor', id, name, description, 5, 1, resolver)
export const perk = (id: string, name: string, description: string, resolver?: ArcaneCoreEffectResolver) => node('perk', id, name, description, 5, 1, resolver)
export const major = (id: string, name: string, description: string, resolver?: ArcaneCoreEffectResolver) => node('major', id, name, description, 1, 3, resolver)

export const createRing = (branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex, drafts: ArcaneCoreNodeDraft[]): ArcaneCoreNodeDefinition[] => {
  const offsetDeg = ARCANE_CORE_RING_OFFSETS[ring]
  let standardIndex = 0
  return drafts.map((draft) => {
    if (draft.nodeType === 'major') return { ...draft, branchId, ring, angleDeg: normalizeAngle(offsetDeg), rankCost: ARCANE_CORE_MAJOR_COST_BY_RING[ring] }
    standardIndex += 1
    return { ...draft, branchId, ring, angleDeg: normalizeAngle(offsetDeg + standardIndex * ARCANE_CORE_NODE_ANGLE_STEP), rankCost: ARCANE_CORE_STANDARD_RANK_COST_BY_RING[ring] }
  })
}
