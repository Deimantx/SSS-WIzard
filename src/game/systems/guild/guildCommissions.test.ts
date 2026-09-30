import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { contributeGuildCommissionSupply, debugCompleteActiveGuildCommission, generateGuildCommissionChoices, recordGuildCommissionProgressBatch } from './guildCommissions'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { advanceArcaneFlux } from '../channeling/channelingRuntime'
import { RESONANCE_TYPES } from '../../content/resonance/resonance'
import { validateV2RoundTrip } from '../../../persistence/v2/saveRoundTrip'
import { serializeGameStateV1 } from '../../../persistence/v2/saveSerializer'

const guildState = () => {
  const state = createInitialState()
  state.progress.guildUnlocked = true
  state.progress.guildRank = 'initiate'
  state.progress.tutorialStage = 'first-kill'
  state.progress.discoveredItems = ['life-essence']
  return state
}

describe('Arcane Guild commissions', () => {
  it('generates three semantically distinct early offers across work categories', () => {
    const state = guildState()
    const offers = generateGuildCommissionChoices(state)
    expect(offers).toHaveLength(3)
    expect(offers.filter((offer) => offer.category === 'supply')).toHaveLength(1)
    expect(new Set(offers.map((offer) => offer.category)).size).toBeGreaterThanOrEqual(2)
    const signatures = offers.map((offer) => JSON.stringify(offer.objectives.map(({ kind, ...identity }) => ({ kind, ...identity }))))
    expect(new Set(signatures).size).toBe(signatures.length)
    expect(offers[0]?.templateId).toBe('supply-life-essence')
  })

  it('uses one Life Essence objective identity regardless of its rolled target quantity', () => {
    const state = guildState()
    const supply = generateGuildCommissionChoices(state, { templateId: 'supply-life-essence', quality: 'routine' })[0]
    expect(supply?.objectives).toEqual([{ kind: 'item-supply', itemId: 'life-essence', target: 10, progress: 0 }])
    expect(generateGuildCommissionChoices(state).filter((offer) => offer.objectives.some((objective) => objective.kind === 'item-supply' && objective.itemId === 'life-essence'))).toHaveLength(1)
  })

  it('counts produced output and completed research cycles in their matching objectives', () => {
    const state = guildState()
    state.resonance.fire = 20
    state.progress.arcaneGuild.activeCommission = {
      id: 'production', templateId: 'produce-fire-fragments', category: 'production', quality: 'routine',
      objectives: [{ kind: 'production', itemId: 'fire-fragment', target: 2, progress: 0 }], reputationReward: 10, advancementPointReward: 0,
    }
    expect(completeTransmutationCycle(state, TRANSMUTATION_RECIPES['fire-fragment'], { mode: 'live', random: () => 1 })).toBe(true)
    expect(state.progress.arcaneGuild.activeCommission?.objectives[0]?.progress).toBe(1)
    recordGuildCommissionProgressBatch(state, [{ category: 'production', itemId: 'fire-fragment', amount: 1 }])
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)

    state.progress.arcaneGuild.activeCommission = {
      id: 'research', templateId: 'study-research-cycles', category: 'research', quality: 'routine',
      objectives: [{ kind: 'research', schoolId: 'fire', target: 2, progress: 0 }], reputationReward: 10, advancementPointReward: 0,
    }
    recordGuildCommissionProgressBatch(state, [{ category: 'research', schoolId: 'fire', amount: 1 }, { category: 'research', schoolId: 'water', amount: 1 }])
    expect(state.progress.arcaneGuild.activeCommission?.objectives[0]?.progress).toBe(1)
    recordGuildCommissionProgressBatch(state, [{ category: 'research', schoolId: 'fire', amount: 1 }])
    expect(state.progress.arcaneGuild.completedCommissions).toBe(2)
  })

  it('tracks actual generated Arcane Flux rather than elapsed time', () => {
    const state = guildState()
    state.activities.channeling.acolytesAssigned = 1
    state.tower.resources.arcaneFlux = 0
    state.progress.arcaneGuild.activeCommission = {
      id: 'flux', templateId: 'channel-arcane-flux', category: 'channeling', quality: 'routine',
      objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 2, progress: 0 }], reputationReward: 10, advancementPointReward: 0,
    }
    advanceArcaneFlux(state, 1000)
    expect(state.progress.arcaneGuild.activeCommission).toBeNull()
    expect(state.progress.arcaneGuild.completedCommissions).toBe(1)
  })

  it('completes developer fixtures through normal objective paths without awarding Commission AP twice', () => {
    const state = guildState()
    state.inventory['life-essence'] = 4
    state.progress.guildSkillNodeRanks['service-faculty-letters'] = 4
    state.progress.arcaneGuild.completedProjectIds.push('restore-arcane-archive')
    state.progress.arcaneGuild.activeCommission = {
      id: 'debug-mixed', templateId: 'special-ember-supply', category: 'mixed', quality: 'routine',
      objectives: [
        { kind: 'item-supply', itemId: 'life-essence', target: 4, progress: 0 },
        { kind: 'channeling', metric: 'arcane-flux', target: 20, progress: 0 },
      ], reputationReward: 100, advancementPointReward: 1,
    }
    expect(debugCompleteActiveGuildCommission(state)).toBe(true)
    expect(state.progress.arcaneGuild.activeCommission).toBeNull()
    expect(state.progress.guildPointsEarned).toBe(0)
    expect(state.progress.guildReputation).toBe(100)
  })

  it('consumes explicit Resonance contribution and persists every mixed objective exactly', () => {
    const state = guildState()
    state.resonance.earth = 150
    state.progress.arcaneGuild.activeCommission = {
      id: 'mixed', templateId: 'special-earth-reserves', category: 'mixed', quality: 'special',
      objectives: [
        { kind: 'resonance-supply', resonanceType: 'earth', target: 80, progress: 0 },
        { kind: 'transmutation', target: 2, progress: 1 },
      ],
      reputationReward: 100, advancementPointReward: 0,
    }
    expect(contributeGuildCommissionSupply(state, 0, 25)).toBe(true)
    expect(state.resonance.earth).toBe(125)
    expect(state.progress.arcaneGuild.activeCommission?.objectives[0]?.progress).toBe(25)
    expect(RESONANCE_TYPES).toContain('earth')
    const expected = structuredClone(state.progress.arcaneGuild.activeCommission)
    const result = validateV2RoundTrip(JSON.stringify(serializeGameStateV1(state)), state)
    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.state?.progress.arcaneGuild.activeCommission).toEqual(expected)
  })

  it('filters Prismatic output until the item becomes obtainable', () => {
    const state = guildState()
    expect(generateGuildCommissionChoices(state, { templateId: 'produce-prismatic-fragments' })).toEqual([])
  })
})
