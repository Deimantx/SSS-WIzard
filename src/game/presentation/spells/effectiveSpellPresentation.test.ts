import { describe, expect, it } from 'vitest'
import { SPELLS } from '../../content/spells/spells'
import { createInitialState } from '../../../store/initialState'
import { getEffectiveSpellCooldown, getEffectiveSpellDirectDamagePreview, getEffectiveSpellStatusDurationPreview } from './effectiveSpellPresentation'
import type { CombatEffect } from '../../systems/combat/combatTypes'

describe('effective Spell presentation with V6 Artifacts', () => {
  it('uses Rank 0 baseline stats only while an Artifact is equipped', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    const effect = SPELLS.ignite.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    expect(getEffectiveSpellStatusDurationPreview(state, 'ignite', effect).changed).toBe(false)
    expect(getEffectiveSpellCooldown(state, 'fire-bolt').effective).toBe(3_500)
  })

  it('applies an authored Minor rank to the equipped Artifact read model', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { minorRanks: { 'flame-impact': 10 } }
    const direct = SPELLS['fire-bolt'].effects[0] as Extract<CombatEffect, { type: 'deal-damage' }>
    const preview = getEffectiveSpellDirectDamagePreview(state, 'fire-bolt', direct, direct.components[0])
    expect(preview.effective).toBeGreaterThan(preview.base)
  })
})
