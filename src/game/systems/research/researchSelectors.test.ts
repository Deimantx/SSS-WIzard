import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getResearchNextLevelEtaMs } from './researchSelectors'

const withResearchJob = (quantity: number, progressMs = 0, echoesAssigned = 1) => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = 10
  state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: quantity, remainingQuantity: quantity, progressMs, echoesAssigned, status: 'running' }
  return state
}

describe('research next-level ETA', () => {
  it('accounts for the current item before future full cycles', () => {
    const state = withResearchJob(3, 2_000)
    state.schools.fire.xp = 10
    state.schools.fire.level = 1
    expect(getResearchNextLevelEtaMs(state, 'research-1')).toEqual({ etaMs: 3_000, beyondBatch: false })
  })

  it('reports beyond batch when remaining items cannot reach the threshold', () => {
    const state = withResearchJob(1)
    expect(getResearchNextLevelEtaMs(state, 'research-1')).toEqual({ etaMs: null, beyondBatch: true })
  })

  it('uses all assigned Echoes for the effective cycle time', () => {
    const state = withResearchJob(1, 0, 5)
    state.schools.fire.xp = 8
    expect(getResearchNextLevelEtaMs(state, 'research-1')).toEqual({ etaMs: 1_000, beyondBatch: false })
  })

  it('returns no ETA for a capped school or an unassigned batch', () => {
    const state = withResearchJob(3)
    state.schools.fire.level = state.progress.magicLevelCap
    state.schools.fire.xp = state.progress.magicLevelCap * 20
    expect(getResearchNextLevelEtaMs(state, 'research-1')).toEqual({ etaMs: null, beyondBatch: false })
    state.activities.research.slots['research-1']!.echoesAssigned = 0
    expect(getResearchNextLevelEtaMs(state, 'research-1')).toEqual({ etaMs: null, beyondBatch: false })
  })

  it('returns no ETA for blocked research states', () => {
    const waitingMana = withResearchJob(2, 5_000)
    waitingMana.player.mana = 0
    expect(getResearchNextLevelEtaMs(waitingMana, 'research-1')).toEqual({ etaMs: null, beyondBatch: false })
    const protectedItem = withResearchJob(2)
    protectedItem.protectedItems['fire-fragment'] = true
    expect(getResearchNextLevelEtaMs(protectedItem, 'research-1')).toEqual({ etaMs: null, beyondBatch: false })
  })
})
