import type { ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreNodeType, ArcaneCoreResolvedEffects, ArcaneCoreRingIndex, EquipmentStats } from '../../types'
import type { CombatCondition, CombatEffect, CombatModifier, CombatTrigger, CombatTriggerRule } from '../../systems/combat/combatTypes'

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

export interface ArcaneCoreRingLayoutOptions {
  offsetDeg?: number
  majorAngleDeg?: number
}

export const createRing = (branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex, drafts: ArcaneCoreNodeDraft[], options: ArcaneCoreRingLayoutOptions = {}): ArcaneCoreNodeDefinition[] => {
  const offsetDeg = options.offsetDeg ?? (ring % 2 === 0 ? 20 : 0)
  const majorAngleDeg = options.majorAngleDeg ?? 0
  const standard = drafts.filter((draft) => draft.nodeType !== 'major')
  const major = drafts.filter((draft) => draft.nodeType === 'major')
  // Leave a deliberate crown gap at 12 o'clock for the Major. The remaining
  // sockets are evenly spaced around the rest of the orbital band.
  return [...standard.map((draft, index) => ({ ...draft, branchId, ring, angleDeg: offsetDeg + 35 + index * 40 })), ...major.map((draft) => ({ ...draft, branchId, ring, angleDeg: majorAngleDeg }))]
}
