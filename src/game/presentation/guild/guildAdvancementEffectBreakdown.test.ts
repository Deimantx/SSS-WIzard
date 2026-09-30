import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { GUILD_SKILL_NODES } from '../../content/guild/guildSkills'
import { getGuildAdvancementEffectBreakdown } from './guildAdvancementEffectBreakdown'
import { getGuildProgressionBonuses } from '../../systems/guild/guildSelectors'

describe('Guild Advancement effect breakdown', () => {
  it('scales a ranked percentage from authored effect values', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['scholarship-measured-inquiry'] = 2
    const result = getGuildAdvancementEffectBreakdown(state, 'scholarship-measured-inquiry')!
    expect(result.perRank).toBe('+0.75% Research speed / rank')
    expect(result.currentEffect).toBe('+1.5% Research speed')
    expect(result.nextEffect).toBe('+2.25% Research speed')
    expect(result.maximumEffect).toBe('+3% Research speed')
    expect(getGuildProgressionBonuses(state).researchSpeedMultiplier).toBe(1.015)
  })

  it('keeps each multi-effect rank value separate and agrees with runtime', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['scholarship-structured-methodology'] = 3
    const result = getGuildAdvancementEffectBreakdown(state, 'scholarship-structured-methodology')!
    expect(result.perRank).toBe('+0.5% Research speed / rank\n+0.5% Research XP / rank')
    expect(result.currentEffect).toBe('+1.5% Research speed\n+1.5% Research XP')
    expect(getGuildProgressionBonuses(state)).toMatchObject({ researchSpeedMultiplier: 1.015, researchXpMultiplier: 1.015 })
  })

  it('formats flat effects and negative reductions from authored values', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['major-expanded-quarters'] = 1
    state.progress.guildSkillNodeRanks['service-efficient-delivery'] = 2
    expect(getGuildAdvancementEffectBreakdown(state, 'major-expanded-quarters')?.maximumEffect).toBe('+1 Acolyte capacity')
    expect(getGuildAdvancementEffectBreakdown(state, 'service-efficient-delivery')?.currentEffect).toBe('-2% Supply and Delivery target reduction')
  })

  it('shows one-time Majors as inactive at rank zero and separates their multi-effects', () => {
    const state = createInitialState()
    const contractor = getGuildAdvancementEffectBreakdown(state, 'major-favored-contractor')!
    expect(contractor.currentEffect).toBe('Not active')
    expect(contractor.nextEffect).toBe('+1 Commission Board choice')
    expect(contractor.maximumEffect).toBe('+1 Commission Board choice')
    state.progress.guildSkillNodeRanks['major-arcane-efficiency'] = 1
    expect(getGuildAdvancementEffectBreakdown(state, 'major-arcane-efficiency')?.currentEffect).toBe('+2% Research speed\n+2% Transmutation speed')
  })

  it('provides rank rows and maximum state without parsing descriptions', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['scholarship-measured-inquiry'] = GUILD_SKILL_NODES['scholarship-measured-inquiry'].maxRank
    const result = getGuildAdvancementEffectBreakdown(state, 'scholarship-measured-inquiry')!
    expect(result.rankRows).toHaveLength(4)
    expect(result.rankRows.every((row) => row.active)).toBe(true)
    expect(result.nextEffect).toBe('Maximum rank reached')
  })

  it.each([
    ['transmutation-resonance-handling', 'transmutationOutputChance', 0.01, '+1% Extra-output chance'],
    ['transmutation-stable-catalysis', 'transmutationResonanceCostMultiplier', 0.99, '-1% Transmutation Resonance cost reduction'],
    ['tower-flux-reservoir-methods', 'arcaneFluxCapacityMultiplier', 1.02, '+2% Arcane Flux capacity'],
    ['service-efficient-delivery', 'deliveryQuantityMultiplier', 0.99, '-1% Supply and Delivery target reduction'],
    ['service-registry-stewardship', 'registryQuantityMultiplier', 0.95, '-5% Consumptive Registry quantity reduction'],
    ['service-project-logistics', 'projectMaterialMultiplier', 0.98, '-2% Effective Project material reduction'],
    ['major-favored-contractor', 'commissionChoiceBonus', 1, '+1 Commission Board choice'],
    ['major-expanded-quarters', 'bonusAcolytes', 1, '+1 Acolyte capacity'],
    ['major-arcane-efficiency', 'transmutationSpeedMultiplier', 1.02, '+2% Research speed\n+2% Transmutation speed'],
    ['major-grand-standing', 'guildReputationMultiplier', 1.03, '+3% Guild Reputation\n+3% Arcane Flux production'],
  ] as const)('keeps %s presentation tied to its runtime selector effect', (id, selector, runtimeExpected, displayExpected) => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks[id] = 1
    const breakdown = getGuildAdvancementEffectBreakdown(state, id)!
    expect(breakdown.currentEffect).not.toBe('Not active')
    const runtimeValue = getGuildProgressionBonuses(state)[selector]
    expect(runtimeValue).toBe(runtimeExpected)
    expect(breakdown.currentEffect).toBe(displayExpected)
    expect(breakdown.maximumEffect).toContain(GUILD_SKILL_NODES[id].effectValues?.[0].label)
  })
})
