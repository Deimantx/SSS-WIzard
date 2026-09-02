import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { buildCombatActionPresentation, formatCombatEffect, getCombatEffectPresentationTone, resolveMonsterBaseMagnitudePreview } from './combatActionPresentation'

describe('combat action presentation', () => {
  it('keeps action effects structured for semantic UI rendering', () => {
    const presentation = buildCombatActionPresentation(MONSTERS['stone-root'].actions['root-slam'], { actor: 'enemy', kind: 'action', sourceMonsterId: 'stone-root' }, { monster: MONSTERS['stone-root'] })
    expect(presentation.effects[0]).toMatchObject({ kind: 'damage', value: '18.2', basePreview: '18.2', scalingLabel: '165% Basic Attack Damage', damageType: 'physical', targetLabel: 'Player' })
    expect(presentation.effects[1]).toMatchObject({ kind: 'control', value: '+0.7s', targetLabel: 'Player', timeLabel: '0.7s' })
    expect(presentation.effects.map((effect) => effect.tone)).toEqual(['damage', 'control'])
  })

  it('classifies multi-effect actions from effect data and tags', () => {
    const source = { actor: 'enemy' as const, kind: 'action' as const }
    expect(getCombatEffectPresentationTone({ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 4 } }], tags: ['dot', 'fire'] })).toBe('dot')
    const presentation = [
      formatCombatEffect({ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'arcane', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] }, source),
      formatCombatEffect({ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 6 }, tags: ['heal'] }, source),
      formatCombatEffect({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 8 }, tags: ['barrier'] }, source),
      formatCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['control'] }, source),
      formatCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'burning' }, source),
    ]
    expect(presentation.map((effect) => effect.tone)).toEqual(['damage', 'heal', 'barrier', 'control', 'dot'])
    expect(presentation[4]).toMatchObject({ damageType: 'fire' })
  })

  it('previews Monster scaling and exposes total DoT output separately from its tick value', () => {
    const thorn = buildCombatActionPresentation(MONSTERS.thornling.actions['thorn-lash'], { actor: 'enemy', kind: 'action', sourceMonsterId: 'thornling' }, { monster: MONSTERS.thornling })
    expect(thorn.effects[0]).toMatchObject({ value: '10', basePreview: '10', scalingLabel: '125% Basic Attack Damage' })
    expect(thorn.effects[1]).toMatchObject({ value: '3 / 2.0s', totalBasePreview: '9 Physical', scalingLabel: '112.5% Basic Attack Damage' })
    expect(resolveMonsterBaseMagnitudePreview(MONSTERS['forest-heart'], { type: 'target-max-health-percent', value: 0.5 })).toBeNull()
  })
})
