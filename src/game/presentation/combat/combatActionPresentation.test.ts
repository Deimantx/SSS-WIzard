import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { buildCombatActionPresentation, formatCombatEffect, getCombatEffectPresentationTone } from './combatActionPresentation'

describe('combat action presentation', () => {
  it('keeps action effects structured for semantic UI rendering', () => {
    const presentation = buildCombatActionPresentation(MONSTERS['stone-root'].actions['root-slam'])
    expect(presentation.effects[0]).toMatchObject({ kind: 'damage', value: '18', damageType: 'physical', targetLabel: 'Player' })
    expect(presentation.effects[1]).toMatchObject({ kind: 'control', value: '+0.7s', targetLabel: 'Player', timeLabel: '0.7s' })
    expect(presentation.effects.map((effect) => effect.tone)).toEqual(['damage', 'control'])
  })

  it('classifies multi-effect actions from effect data and tags', () => {
    const source = { actor: 'enemy' as const, kind: 'action' as const }
    expect(getCombatEffectPresentationTone({ type: 'deal-damage', target: 'opponent', damageType: 'fire', magnitude: { type: 'flat', value: 4 }, tags: ['dot', 'fire'] })).toBe('dot')
    const presentation = [
      formatCombatEffect({ type: 'deal-damage', target: 'opponent', damageType: 'arcane', magnitude: { type: 'flat', value: 10 }, tags: ['direct'] }, source),
      formatCombatEffect({ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 6 }, tags: ['heal'] }, source),
      formatCombatEffect({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 8 }, tags: ['barrier'] }, source),
      formatCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['control'] }, source),
      formatCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'burning' }, source),
    ]
    expect(presentation.map((effect) => effect.tone)).toEqual(['damage', 'heal', 'barrier', 'control', 'dot'])
    expect(presentation[4]).toMatchObject({ damageType: 'fire' })
  })
})
