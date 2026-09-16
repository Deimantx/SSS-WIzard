import type { ArcaneCoreNodeDefinition, ArcaneCoreNodeType, ArcaneCoreSpecialEffect, EquipmentStats } from '../../types'
import type { CombatCondition, CombatEffect, CombatModifier, CombatTrigger, CombatTriggerRule } from '../../systems/combat/combatTypes'

export type ArcaneCoreNodeDraft = Omit<ArcaneCoreNodeDefinition, 'branchId' | 'laneId' | 'order' | 'x' | 'y' | 'prerequisites' | 'prerequisiteMode'>

export const modifier = (key: CombatModifier['key'], value: number, condition?: CombatCondition, actor: CombatModifier['actor'] = 'player'): CombatModifier => ({ key, value, actor, ...(condition ? { condition } : {}) })
export const effect = (value: CombatEffect) => value
export const rule = (id: string, event: CombatTrigger, effects: CombatEffect[], condition?: CombatCondition, options: Pick<CombatTriggerRule, 'cooldownMs' | 'oncePerEncounter' | 'priority' | 'ui'> = {}): CombatTriggerRule => ({ id, event, effects, ...(condition ? { condition } : {}), ...options })

const node = (nodeType: ArcaneCoreNodeType, id: string, name: string, description: string, extras: { stats?: EquipmentStats; modifiers?: CombatModifier[]; rules?: CombatTriggerRule[]; special?: ArcaneCoreSpecialEffect[] } = {}): ArcaneCoreNodeDraft => ({ id, name, description, nodeType, cost: 1, ...extras })

export const minor = (id: string, name: string, description: string, stats?: EquipmentStats, modifiers?: CombatModifier[]) => node('minor', id, name, description, { ...(stats ? { stats } : {}), ...(modifiers ? { modifiers } : {}) })
export const perk = (id: string, name: string, description: string, modifiers?: CombatModifier[], rules?: CombatTriggerRule[], special?: ArcaneCoreSpecialEffect[]) => node('perk', id, name, description, { ...(modifiers ? { modifiers } : {}), ...(rules ? { rules } : {}), ...(special ? { special } : {}) })
export const major = (id: string, name: string, description: string, stats?: EquipmentStats, modifiers?: CombatModifier[], rules?: CombatTriggerRule[], special?: ArcaneCoreSpecialEffect[]) => node('major', id, name, description, { ...(stats ? { stats } : {}), ...(modifiers ? { modifiers } : {}), ...(rules ? { rules } : {}), ...(special ? { special } : {}) })

export const lane = (branchId: ArcaneCoreNodeDefinition['branchId'], laneId: string, laneIndex: number, drafts: ArcaneCoreNodeDraft[]): ArcaneCoreNodeDefinition[] => drafts.map((draft, index) => ({
  ...draft,
  branchId,
  laneId,
  order: index + 1,
  x: index,
  y: laneIndex,
  prerequisites: index === 0 ? [] : [drafts[index - 1].id],
  prerequisiteMode: 'all',
}))
