import { describe, expect, it } from 'vitest'
import { applyCombatV2Profile, scaledBarrier, scaledDirectDamage, scaledDot, scaledHeal } from './monsterTypes'
import { MONSTERS } from './index'

describe('Monster action authoring helpers', () => {
  it('authors direct damage from Basic Attack Damage', () => {
    expect(scaledDirectDamage('arcane', 2.4)).toMatchObject({
      type: 'deal-damage',
      target: 'opponent',
      components: [{ damageType: 'arcane', magnitude: { type: 'source-basic-damage-percent', value: 2.4 } }],
    })
  })

  it('authors healing and Barrier from Max Health', () => {
    expect(scaledHeal(0.1)).toMatchObject({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.1 } })
    expect(scaledBarrier(0.2)).toMatchObject({ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.2 } })
  })

  it('authors DoT coefficients as total output split by the Status interval', () => {
    const effect = scaledDot('thorn-wound', 'physical', 1.125, 6000)
    expect(effect).toMatchObject({ type: 'apply-status', target: 'opponent', statusId: 'thorn-wound', durationMs: 6000 })
    expect(effect.type === 'apply-status' ? effect.periodicEffects?.[0] : undefined).toMatchObject({
      type: 'deal-damage',
      components: [{ damageType: 'physical', magnitude: { type: 'source-basic-damage-percent', value: 0.375 } }],
    })
  })

  it('applies Combat V2 profiles without mutating authored monster content', () => {
    const original = structuredClone(MONSTERS['forest-wisp'])
    const before = structuredClone(original)
    const profiled = applyCombatV2Profile(original, 'air', 300)
    expect(original).toEqual(before)
    expect(profiled.primaryAffinity).toBe('air')
    expect(profiled.basicAttackElement).toBe('air')
    expect(profiled.actions['arc-spark'].effects[0]).toMatchObject({ components: [{ damageType: 'arcane' }] })
  })
})
