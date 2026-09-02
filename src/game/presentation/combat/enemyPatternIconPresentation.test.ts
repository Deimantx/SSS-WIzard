import { describe, expect, it } from 'vitest'
import { applyStatus, delayBasicAttack, flatDirectDamage, gainBarrier, flatHeal } from '../../content/monsters/monsterTypes'
import type { CombatActionDefinition } from '../../systems/combat/combatTypes'
import { classifyEnemyActionPatternIcon } from './enemyPatternIconPresentation'

const action = (effects: CombatActionDefinition['effects']): CombatActionDefinition => ({ id: 'synthetic', name: 'Synthetic Action', description: 'Test action', actionTimeMs: 1000, effects })

describe('classifyEnemyActionPatternIcon', () => {
  it('classifies universal effect categories without content IDs', () => {
    expect(classifyEnemyActionPatternIcon(action([flatDirectDamage('physical', 10)]))).toBe('direct-damage')
    expect(classifyEnemyActionPatternIcon(action([applyStatus('thorn-wound', 'opponent')]))).toBe('dot-damage')
    expect(classifyEnemyActionPatternIcon(action([gainBarrier({ type: 'flat', value: 30 })]))).toBe('barrier')
    expect(classifyEnemyActionPatternIcon(action([flatHeal(20)]))).toBe('heal')
    expect(classifyEnemyActionPatternIcon(action([delayBasicAttack(500)]))).toBe('control')
    expect(classifyEnemyActionPatternIcon(action([applyStatus('vulnerable', 'opponent')]))).toBe('debuff')
  })

  it('uses the obvious primary effect for mixed actions', () => {
    expect(classifyEnemyActionPatternIcon(action([gainBarrier({ type: 'flat', value: 30 }), applyStatus('haste', 'self')]))).toBe('barrier')
    expect(classifyEnemyActionPatternIcon(action([flatHeal(20), applyStatus('haste', 'self')]))).toBe('heal')
    expect(classifyEnemyActionPatternIcon(action([flatDirectDamage('physical', 10), delayBasicAttack(500)]))).toBe('direct-damage')
    expect(classifyEnemyActionPatternIcon(action([{ type: 'remove-status', target: 'opponent', statusId: 'burning' }, { type: 'set-action-pattern', target: 'self', patternId: 'alternate' }]))).toBe('multi-effect')
  })
})
