import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { acceptGuildCommission, deliverGuildCommissionItems, generateGuildCommissionChoices, recordGuildCommissionProgressBatch, refreshGuildCommissionChoices } from './guildCommissions'
import { registerArcaneRegistryEntry } from './arcaneRegistry'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { BALANCE } from '../../core/balance/balance'
import { GUILD_COMMISSION_TEMPLATES } from '../../content/guild/guildRequests'
import { contributeGuildCommissionChainDelivery, recordGuildCommissionChainProgress, startGuildCommissionChain } from './guildCommissionChains'

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

  it('generates seeded boards deterministically and keeps objective complexity aligned to quality', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.tutorialStage = 'complete'
    state.progress.discoveredItems = ['life-essence', 'fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment']
    state.progress.arcaneGuild.rngState = 12345
    const same = structuredClone(state)
    const offers = generateGuildCommissionChoices(state)
    expect(offers).toEqual(generateGuildCommissionChoices(same))
    for (const offer of offers) {
      if (offer.quality === 'routine') expect(offer.components).toBeUndefined()
      if (offer.quality === 'special') expect(offer.components).toHaveLength(2)
      if (offer.quality === 'prestigious') expect(offer.components?.length).toBeGreaterThanOrEqual(3)
    }
    expect(offers.every((offer) => offer.quality !== 'prestigious' || state.progress.guildRank === 'magister')).toBe(true)
  })

  it('keeps Life Essence quantity variants distinct and avoids identical generated offers', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    const offers = generateGuildCommissionChoices(state)
    const variants = GUILD_COMMISSION_TEMPLATES.filter((template) => template.id.startsWith('deliver-life-essence-')).map((template) => template.id)
    expect(offers.map((offer) => offer.templateId).sort()).toEqual(variants.sort())
    const signatures = offers.map((offer) => JSON.stringify({ category: offer.category, itemId: offer.itemId, quality: offer.quality, target: offer.target, components: offer.components }))
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('applies delivery efficiency to Mixed Delivery only', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.tutorialStage = 'complete'
    state.progress.discoveredItems = ['life-essence', 'fire-fragment']
    state.progress.guildSkillNodeRanks['major-efficient-procurement'] = 1
    const offers = generateGuildCommissionChoices(state, { quality: 'special', templateId: 'mixed-materials-research' })
    expect(offers[0]?.components).toEqual([
      { category: 'delivery', itemId: 'life-essence', target: 11, progress: 0 },
      { category: 'research', itemId: undefined, target: 3, progress: 0 },
    ])
    const production = generateGuildCommissionChoices(state, { quality: 'special', templateId: 'mixed-output-research' })[0]
    expect(production?.components?.find((component) => component.category === 'production')?.target).toBe(12)
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

  it('matches Prismatic Chain Production to Water Fragment and counts replicated output', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    expect(startGuildCommissionChain(state, 'prismatic-synthesis')).toBe(true)
    state.inventory['prismatic-fragment'] = 5
    expect(contributeGuildCommissionChainDelivery(state, 'max')).toBe(true)
    expect(recordGuildCommissionChainProgress(state, 'production', 2, 'fire-fragment')).toBe(false)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 1, stageProgress: 0 })
    state.progress.transmutation.arrays['replication-array'].level = 10
    state.resonance.water = 10
    expect(completeTransmutationCycle(state, TRANSMUTATION_RECIPES['water-fragment'], { mode: 'live', random: () => 0 })).toBe(true)
    expect(state.inventory['water-fragment']).toBe(2)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 1, stageProgress: 2 })
    expect(recordGuildCommissionChainProgress(state, 'production', 10, 'water-fragment')).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 2, stageProgress: 0 })
    expect(recordGuildCommissionChainProgress(state, 'transmutation', 6)).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 3, stageProgress: 0 })
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

  it('supports item delivery as an independent Mixed Commission component', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    state.inventory['life-essence'] = 12
    state.progress.arcaneGuild.activeCommission = { id: 'mixed-delivery-research', templateId: 'mixed-materials-research', category: 'mixed', quality: 'special', target: 15, progress: 0, reputationReward: 100, advancementPointReward: 0, components: [{ category: 'delivery', itemId: 'life-essence', target: 12, progress: 0 }, { category: 'research', target: 3, progress: 0 }] }
    expect(deliverGuildCommissionItems(state, 'max')).toBe(true)
    expect(state.progress.arcaneGuild.activeCommission?.components?.[0].progress).toBe(12)
    expect(state.progress.arcaneGuild.activeCommission?.progress).toBe(12)
    recordGuildCommissionProgressBatch(state, [{ category: 'research', amount: 3 }])
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)
    expect(state.progress.arcaneGuild.activeCommission).toBeNull()
  })

  it('keeps the active Commission when refreshing and honors the capped free refresh balance', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.discoveredItems = ['life-essence']
    state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
    const offer = state.progress.arcaneGuild.availableCommissions[0]
    state.inventory['life-essence'] = offer.target
    acceptGuildCommission(state, offer.id)
    state.progress.arcaneGuild.freeRefreshes = BALANCE.arcaneGuild.maxFreeRefreshes
    expect(refreshGuildCommissionChoices(state)).toBe(true)
    expect(state.progress.arcaneGuild.freeRefreshes).toBe(BALANCE.arcaneGuild.maxFreeRefreshes - 1)
    expect(state.progress.arcaneGuild.activeCommission).not.toBeNull()
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
