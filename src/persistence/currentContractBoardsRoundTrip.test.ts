import { beforeEach, describe, expect, it } from 'vitest'
import { getArcaneRegistryEntries } from '../game/systems/guild/arcaneRegistry'
import { generateGuildCommissionChoices } from '../game/systems/guild/guildCommissions'
import { acceptHunterContract, generateHunterContractChoices, getHunterContractChoiceCount } from '../game/systems/huntersOrder/huntersOrderRuntime'
import { createInitialState } from '../store/initialState'
import type { GameState } from '../game/types'
import { serializeGameState } from './profileSaveManager'
import { getAuthoritativeSaveSnapshot, validateSerializedSave } from './saveIntegrity'
import { loadPersistedGameStateV1 } from './v2/saveLoader'
import { parsePersistedGameStateV1 } from './v2/saveSchema'
import { persistedGameStatesEqual } from './v2/saveRoundTrip'

const unlockedHunterState = () => {
  const state = createInitialState()
  state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
  state.progress.huntersOrder.reputation = 32_500
  state.progress.huntersOrder.rankId = 'master-hunter'
  state.progress.huntersOrder.rngState = 73_194_621
  return state
}

const roundTrip = (state: GameState) => validateSerializedSave(JSON.stringify(serializeGameState(state)), state)

describe('current Hunter and Guild board save integrity', () => {
  beforeEach(() => localStorage.clear())

  it('preserves a normal Hunter board and RNG during current-version validation', () => {
    const state = unlockedHunterState()
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    const offers = structuredClone(state.progress.huntersOrder.availableContracts)
    const rngState = state.progress.huntersOrder.rngState

    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.report.classification).toBe('MATCH')
    expect(result.state?.progress.huntersOrder.availableContracts).toEqual(offers)
    expect(result.state?.progress.huntersOrder.rngState).toBe(rngState)
  })

  it('preserves an accepted normal Contract and its two remaining offers', () => {
    const state = unlockedHunterState()
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    const accepted = state.progress.huntersOrder.availableContracts[0]!
    expect(acceptHunterContract(state, accepted.id)).toBe(true)
    const offers = structuredClone(state.progress.huntersOrder.availableContracts)
    const active = structuredClone(state.progress.huntersOrder.activeContract)
    const rngState = state.progress.huntersOrder.rngState

    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.state?.progress.huntersOrder.activeContract).toEqual(active)
    expect(result.state?.progress.huntersOrder.availableContracts).toEqual(offers)
    expect(result.state?.progress.huntersOrder.rngState).toBe(rngState)
  })

  it('round-trips an accepted prestigious Nightglass monster Contract with an empty offer board', () => {
    const state = unlockedHunterState()
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state, { archetype: 'monster', tier: 'prestigious', monsterId: 'nightglass-alpha' })
    expect(state.progress.huntersOrder.availableContracts).toHaveLength(1)
    const nightglass = state.progress.huntersOrder.availableContracts[0]!
    expect(nightglass.targetSpec).toEqual({ type: 'monster', monsterId: 'nightglass-alpha' })
    expect(acceptHunterContract(state, nightglass.id)).toBe(true)
    expect(state.progress.huntersOrder.activeContract).not.toBeNull()
    expect(state.progress.huntersOrder.availableContracts).toEqual([])
    const active = structuredClone(state.progress.huntersOrder.activeContract)
    const rngState = state.progress.huntersOrder.rngState

    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.report.classification).toBe('MATCH')
    expect(result.state?.progress.huntersOrder.activeContract).toEqual(active)
    expect(result.state?.progress.huntersOrder.availableContracts).toEqual([])
    expect(result.state?.progress.huntersOrder.rngState).toBe(rngState)
  })

  it('preserves a five-offer Contract Portfolio board without truncation', () => {
    const state = unlockedHunterState()
    state.progress.huntersOrder.purchasedUpgrades['contract-portfolio'] = 2
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    const offers = structuredClone(state.progress.huntersOrder.availableContracts)
    const rngState = state.progress.huntersOrder.rngState

    expect(getHunterContractChoiceCount(state)).toBe(5)
    expect(offers).toHaveLength(5)
    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.state?.progress.huntersOrder.availableContracts).toEqual(offers)
    expect(result.state?.progress.huntersOrder.rngState).toBe(rngState)
  })

  it('preserves an active Guild Commission with an intentionally empty board and unchanged RNG', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.tutorialStage = 'complete'
    state.progress.discoveredItems = getArcaneRegistryEntries().map(({ item }) => item.id)
    const [commission] = generateGuildCommissionChoices(state)
    expect(commission).toBeTruthy()
    state.progress.arcaneGuild.activeCommission = commission!
    state.progress.arcaneGuild.availableCommissions = []
    state.progress.arcaneGuild.rngState = 91_024_683
    const active = structuredClone(state.progress.arcaneGuild.activeCommission)

    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.state?.progress.arcaneGuild.activeCommission).toEqual(active)
    expect(result.state?.progress.arcaneGuild.availableCommissions).toEqual([])
    expect(result.state?.progress.arcaneGuild.rngState).toBe(91_024_683)
  })

  it('preserves the full upgraded Arcane Guild offer capacity', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.tutorialStage = 'complete'
    state.progress.discoveredItems = getArcaneRegistryEntries().map(({ item }) => item.id)
    state.progress.guildSkillNodeRanks['major-favored-contractor'] = 1
    state.progress.arcaneGuild.rngState = 81_275_641
    state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
    const offers = structuredClone(state.progress.arcaneGuild.availableCommissions)

    expect(offers.length).toBeGreaterThan(3)
    const result = roundTrip(state)

    expect(result.ok, result.error ?? '').toBe(true)
    expect(result.state?.progress.arcaneGuild.availableCommissions).toEqual(offers)
    expect(result.state?.progress.arcaneGuild.rngState).toBe(state.progress.arcaneGuild.rngState)
  })

  it('preserves an empty board as saved and does not generate contracts during load', () => {
    const current = unlockedHunterState()
    const currentRaw = serializeGameState(current) as unknown as Record<string, any>
    currentRaw.progress.huntersOrder.availableContracts = []
    const loaded = loadPersistedGameStateV1(parsePersistedGameStateV1(JSON.stringify(currentRaw)))
    expect(loaded.progress.huntersOrder.availableContracts).toEqual([])
    expect(loaded.progress.huntersOrder.rngState).toBe(current.progress.huntersOrder.rngState)
  })

  it('is identity-safe for Hunter and Guild state after save, load, and save', () => {
    const state = unlockedHunterState()
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.tutorialStage = 'complete'
    state.progress.discoveredItems = getArcaneRegistryEntries().map(({ item }) => item.id)
    state.progress.guildSkillNodeRanks['major-favored-contractor'] = 1
    state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
    const first = serializeGameState(state)
    const loaded = loadPersistedGameStateV1(parsePersistedGameStateV1(JSON.stringify(first)))
    const second = serializeGameState(loaded, first.savedAt)
    expect(persistedGameStatesEqual(second, first)).toBe(true)
    expect(getAuthoritativeSaveSnapshot(loaded)).toEqual(getAuthoritativeSaveSnapshot(state))
  })
})
