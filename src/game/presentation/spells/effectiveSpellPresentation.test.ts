import { describe, expect, it } from 'vitest'
import { SPELLS } from '../../content/spells/spells'
import { createInitialState } from '../../../store/initialState'
import { buildSpellEffectTooltipModel } from './spellEffectTooltipModel'
import {
  getEffectiveSpellCooldown,
  getEffectiveSpellDirectDamagePreview,
  getEffectiveSpellDotPreview,
  getEffectiveSpellStatusDurationPreview,
} from './effectiveSpellPresentation'
import type { CombatEffect } from '../../systems/combat/combatTypes'

const row = (model: ReturnType<typeof buildSpellEffectTooltipModel>, label: string) => model.rows.find((entry) => entry.label === label)
const artifact = (level: number, allocatedNodeIds: string[] = []) => ({ level, allocatedNodeIds, attunedNodeIds: [] })

describe('effective Spell presentation', () => {
  it('keeps Ignite at its authored duration without an active duration provider', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = artifact(4)

    const preview = getEffectiveSpellStatusDurationPreview(state, 'ignite', SPELLS.ignite.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>)
    expect(preview).toMatchObject({ base: 6_000, effective: 6_000, changed: false })
    expect(row(buildSpellEffectTooltipModel(state, 'ignite', 1), 'Duration')?.value).toBe('6.0s')
  })

  it('applies Lingering Flame only while Ember Staff is equipped and the node is allocated', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = artifact(4, ['cinder-memory', 'lingering-flame'])
    const effect = SPELLS.ignite.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>

    expect(getEffectiveSpellStatusDurationPreview(state, 'ignite', effect).effective).toBe(6_600)
    expect(row(buildSpellEffectTooltipModel(state, 'ignite', 1), 'Duration')?.value).toBe('6.6s')
    expect(row(buildSpellEffectTooltipModel(state, 'ignite', 1), 'Status Duration')?.value).toBe('+10%')

    state.artifactProgress['ember-staff'].allocatedNodeIds = []
    expect(getEffectiveSpellStatusDurationPreview(state, 'ignite', effect).effective).toBe(6_000)
    state.artifactProgress['ember-staff'].allocatedNodeIds = ['lingering-flame']
    state.equipment.weapon = null
    expect(getEffectiveSpellStatusDurationPreview(state, 'ignite', effect).effective).toBe(6_000)
  })

  it('uses Artifact level Spell Power and separates direct damage from DOT modifiers', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = artifact(1, ['arcane-kindling'])
    const direct = SPELLS['fire-bolt'].effects[0] as Extract<CombatEffect, { type: 'deal-damage' }>
    const lowLevel = getEffectiveSpellDirectDamagePreview(state, 'fire-bolt', direct, direct.components[0])
    state.artifactProgress['ember-staff'].level = 4
    const highLevel = getEffectiveSpellDirectDamagePreview(state, 'fire-bolt', direct, direct.components[0])
    expect(highLevel.base).toBeGreaterThan(lowLevel.base)
    expect(highLevel.effective / highLevel.base).toBeCloseTo(1.05)

    state.artifactProgress['ember-staff'].allocatedNodeIds = ['cinder-memory']
    const igniteStatus = SPELLS.ignite.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    const periodic = igniteStatus.periodicEffects?.[0]
    if (!periodic || periodic.type !== 'deal-damage') throw new Error('Expected Ignite periodic damage')
    const dot = getEffectiveSpellDotPreview(state, 'ignite', igniteStatus, periodic, periodic.components[0], 6_000)
    if (!dot) throw new Error('Expected DOT preview')
    expect(dot.damagePerTick.effective / dot.damagePerTick.base).toBeCloseTo(1.1)
    expect(getEffectiveSpellDirectDamagePreview(state, 'ignite', SPELLS.ignite.effects[0] as Extract<CombatEffect, { type: 'deal-damage' }>, (SPELLS.ignite.effects[0] as Extract<CombatEffect, { type: 'deal-damage' }>).components[0]).effective).toBeCloseTo(dot.damagePerTick.base * 0.6)
  })

  it('uses canonical cooldown recovery and returns to base after unequipping', () => {
    const state = createInitialState()
    const base = getEffectiveSpellCooldown(state, 'fire-bolt')
    state.equipment.earring = 'wispglass-earring'
    const equipped = getEffectiveSpellCooldown(state, 'fire-bolt')
    expect(base.effective).toBe(5_000)
    expect(equipped.effective).toBeCloseTo(5_000 / 1.03)
    state.equipment.earring = null
    expect(getEffectiveSpellCooldown(state, 'fire-bolt').effective).toBe(base.effective)
  })

  it('keeps target-dependent Artifact bonuses conditional in generic Spell output', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = artifact(4, ['heartfed-embers'])
    const effect = SPELLS['fire-bolt'].effects[0] as Extract<CombatEffect, { type: 'deal-damage' }>
    const preview = getEffectiveSpellDirectDamagePreview(state, 'fire-bolt', effect, effect.components[0])
    expect(preview.effective).toBe(preview.base)
    expect(preview.conditionalModifiers).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'spell-damage-percent', value: 0.1 })]))
  })
})
