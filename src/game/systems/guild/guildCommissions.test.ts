import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { acceptGuildCommission, deliverGuildCommissionItems, generateGuildCommissionChoices, recordGuildCommissionProgressBatch } from './guildCommissions'
import { registerArcaneRegistryEntry } from './arcaneRegistry'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'

describe('Arcane Guild services', () => {
  it('generates only accessible noncombat work orders', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    const offers = generateGuildCommissionChoices(state)
    expect(offers.length).toBeGreaterThan(0)
    expect(offers.every((offer) => offer.category === 'delivery')).toBe(true)
    expect(offers.every((offer) => !('monsterId' in offer))).toBe(true)
  })

  it('keeps Production item-specific and counts actual replicated output quantity', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    state.progress.transmutation.arrays['replication-array'].level = 10
    state.resonance.fire = 10
    state.progress.arcaneGuild.activeCommission = { id: 'produce-fire', templateId: 'produce-fire-fragments', category: 'production', quality: 'routine', itemId: 'fire-fragment', target: 2, progress: 0, reputationReward: 10, advancementPointReward: 0 }
    expect(completeTransmutationCycle(state, TRANSMUTATION_RECIPES['fire-fragment'], { mode: 'live', random: () => 0 })).toBe(true)
    expect(state.inventory['fire-fragment']).toBe(2)
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)

    state.progress.arcaneGuild.activeCommission = { id: 'produce-fire-again', templateId: 'produce-fire-fragments', category: 'production', quality: 'routine', itemId: 'fire-fragment', target: 12, progress: 0, reputationReward: 10, advancementPointReward: 0 }
    recordGuildCommissionProgressBatch(state, [{ category: 'production', amount: 6, itemId: 'water-fragment' }])
    expect(state.progress.arcaneGuild.activeCommission?.progress).toBe(0)
  })

  it('advances Mixed Production, Transmutation, and Research components independently in one cycle', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    state.progress.arcaneGuild.activeCommission = {
      id: 'mixed-progress', templateId: 'mixed-ember-study', category: 'mixed', quality: 'routine', target: 14, progress: 0, reputationReward: 10, advancementPointReward: 0,
      components: [
        { category: 'production', itemId: 'fire-fragment', target: 8, progress: 0 },
        { category: 'transmutation', target: 4, progress: 0 },
        { category: 'research', target: 2, progress: 0 },
      ],
    }
    recordGuildCommissionProgressBatch(state, [
      { category: 'transmutation', amount: 1 },
      { category: 'production', amount: 3, itemId: 'fire-fragment' },
    ])
    expect(state.progress.arcaneGuild.activeCommission?.components).toEqual([
      { category: 'production', itemId: 'fire-fragment', target: 8, progress: 3 },
      { category: 'transmutation', target: 4, progress: 1 },
      { category: 'research', target: 2, progress: 0 },
    ])
    expect(state.progress.arcaneGuild.activeCommission?.progress).toBe(4)
    recordGuildCommissionProgressBatch(state, [{ category: 'research', amount: 2 }, { category: 'transmutation', amount: 3 }, { category: 'production', amount: 5, itemId: 'fire-fragment' }])
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)
    expect(state.progress.arcaneGuild.activeCommission).toBeNull()
  })

  it('completes a delivery commission, grants Reputation, and refreshes the board', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
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
