import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { acceptHunterContract, canHuntMonster, ensureHunterContractChoices, generateHunterContractChoices, recordHunterKill, rerollHunterContracts, setHunterTargetBlocked, skipHunterContract, purchaseHunterUpgrade } from './huntersOrderRuntime'

describe('Hunter Order contract runtime', () => {
  it('unlocks from the Howling Den boss and generates three hunt choices', () => {
    const state = createInitialState()
    expect(generateHunterContractChoices(state)).toHaveLength(0)
    expect(canHuntMonster(state, 'ashen-tracker')).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const offers = generateHunterContractChoices(state)
    state.progress.huntersOrder.availableContracts = offers
    expect(offers).toHaveLength(3)
    expect(canHuntMonster(state, offers[0].targetMonsterId)).toBe(false)
    expect(acceptHunterContract(state, offers[0].id)).toBe(true)
    expect(canHuntMonster(state, offers[0].targetMonsterId)).toBe(true)
    expect(state.progress.huntersOrder.totalContractsAccepted).toBe(1)
  })

  it('counts only the active target, then grants Marks and Reputation on completion', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const target = generateHunterContractChoices(state)[0]
    target.target = 1
    state.progress.huntersOrder.availableContracts = [target]
    acceptHunterContract(state, target.id)
    expect(recordHunterKill(state, 'gloamfang-stalker')).toBe(false)
    expect(recordHunterKill(state, target.targetMonsterId)).toBe(true)
    expect(state.progress.huntersOrder.totalContractsCompleted).toBe(1)
    expect(state.progress.huntersOrder.hunterMarks).toBeGreaterThan(0)
    expect(state.progress.huntersOrder.reputation).toBeGreaterThan(0)
  })

  it('keeps block, reroll, skip, and purchase as separate actions', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    const targetId = state.progress.huntersOrder.availableContracts[0].targetMonsterId
    expect(setHunterTargetBlocked(state, targetId, true)).toBe(true)
    expect(state.progress.huntersOrder.availableContracts.some((entry) => entry.targetMonsterId === targetId)).toBe(false)
    state.progress.huntersOrder.hunterMarks = 20
    expect(rerollHunterContracts(state)).toBe(true)
    const offer = state.progress.huntersOrder.availableContracts[0]
    expect(acceptHunterContract(state, offer.id)).toBe(true)
    expect(skipHunterContract(state)).toBe(true)
    expect(state.progress.huntersOrder.activeContract).toBeNull()
    expect(purchaseHunterUpgrade(state, 'trail-kit')).toBe(true)
    expect(state.progress.huntersOrder.purchasedUpgrades['trail-kit']).toBe(1)
  })
})
