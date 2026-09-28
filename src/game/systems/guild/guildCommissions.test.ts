import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { acceptGuildCommission, deliverGuildCommissionItems, generateGuildCommissionChoices } from './guildCommissions'
import { registerArcaneRegistryEntry } from './arcaneRegistry'

describe('Arcane Guild services', () => {
  it('generates only accessible noncombat work orders', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    const offers = generateGuildCommissionChoices(state)
    expect(offers).toHaveLength(3)
    expect(offers.every((offer) => offer.category === 'delivery')).toBe(true)
    expect(offers.every((offer) => !('monsterId' in offer))).toBe(true)
  })

  it('completes a delivery commission, grants Reputation, and refreshes the board', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
    const offer = state.progress.arcaneGuild.availableCommissions[0]
    state.inventory['life-essence'] = offer.target
    expect(acceptGuildCommission(state, offer.id)).toBe(true)
    expect(deliverGuildCommissionItems(state, 'max')).toBe(true)
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)
    expect(state.progress.guildReputation).toBeGreaterThan(0)
    expect(state.progress.arcaneGuild.freeRefreshes).toBe(1)
  })

  it('safely consumes common entries and awards Registry Set rewards only at completion', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.inventory['fire-fragment'] = 2
    expect(registerArcaneRegistryEntry(state, 'fire-fragment')).toBe(true)
    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.progress.arcaneRegistry.completedSetIds).not.toContain('ember-fundamentals')
    state.inventory['ember-staff'] = 1
    expect(registerArcaneRegistryEntry(state, 'ember-staff')).toBe(true)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.progress.arcaneRegistry.completedSetIds).toContain('ember-fundamentals')
    expect(state.progress.guildPointsEarned).toBeGreaterThan(0)
  })
})
