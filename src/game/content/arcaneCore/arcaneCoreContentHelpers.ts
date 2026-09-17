import type { CombatCondition } from '../../systems/combat/combatTypes'

export const all = (...conditions: CombatCondition[]): CombatCondition => ({ type: 'all', conditions })
export const aboveHp = (percent: number): CombatCondition => ({ type: 'self-hp-above-percent', percent })
export const belowHp = (percent: number): CombatCondition => ({ type: 'self-hp-below-percent', percent })
export const aboveMana = (percent: number): CombatCondition => ({ type: 'self-mana-above-percent', percent })
export const belowMana = (percent: number): CombatCondition => ({ type: 'self-mana-below-percent', percent })
export const targetAboveHp = (percent: number): CombatCondition => ({ type: 'target-hp-above-percent', percent })
export const targetBelowHp = (percent: number): CombatCondition => ({ type: 'target-hp-below-percent', percent })
export const debuffed = { type: 'target-has-status-tag', tag: 'debuff' } as const
export const selfDebuffed = { type: 'self-has-status-tag', tag: 'debuff' } as const
export const selfControlled = { type: 'self-has-status-tag', tag: 'control' } as const
export const negativeStatuses = (count: number): CombatCondition => ({ type: 'target-negative-status-count-at-least', count })
export const selfNegativeStatuses = (count: number): CombatCondition => ({ type: 'self-negative-status-count-at-least', count })
export const eventStatusTag = (tag: import('../../systems/combat/combatTypes').CombatTag): CombatCondition => ({ type: 'event-status-has-tag', tag })
export const spell = { type: 'source-has-tag', tag: 'spell' } as const
export const directSpellCrit = all(spell, { type: 'source-has-tag', tag: 'direct' }, { type: 'event-is-critical' })
