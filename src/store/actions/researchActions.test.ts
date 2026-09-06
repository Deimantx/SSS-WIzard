import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { getResearchAssignOneEachState } from '../../game/systems/research/researchSelectors'
import { assignOneResearchEchoEachAction, prepareResearchAction } from './researchActions'

const preparedState = () => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = 10
  state.inventory['water-fragment'] = 10
  prepareResearchAction(state, 'fire-fragment', 'fire', 1)
  prepareResearchAction(state, 'water-fragment', 'water', 1)
  return state
}

describe('Research bulk Echo assignment', () => {
  it('adds one Echo to every eligible batch and remains additive', () => {
    const state = preparedState()
    state.activities.research.slots['research-1']!.echoesAssigned = 1
    state.activities.research.slots['research-2']!.echoesAssigned = 2

    expect(assignOneResearchEchoEachAction(state)).toBe(true)
    expect(state.activities.research.slots['research-1']?.echoesAssigned).toBe(2)
    expect(state.activities.research.slots['research-2']?.echoesAssigned).toBe(3)
  })

  it('rejects the entire assignment when Echo capacity is insufficient', () => {
    const state = preparedState()
    state.activities.research.slots['research-1']!.echoesAssigned = 4
    state.activities.research.slots['research-2']!.echoesAssigned = 0

    expect(getResearchAssignOneEachState(state).blockedReason).toBe('echo-capacity')
    expect(assignOneResearchEchoEachAction(state)).toBe(false)
    expect(state.activities.research.slots['research-1']?.echoesAssigned).toBe(4)
    expect(state.activities.research.slots['research-2']?.echoesAssigned).toBe(0)
  })

  it('skips blocked batches while assigning eligible batches', () => {
    const state = preparedState()
    state.protectedItems['water-fragment'] = true

    expect(assignOneResearchEchoEachAction(state)).toBe(true)
    expect(state.activities.research.slots['research-1']?.echoesAssigned).toBe(1)
    expect(state.activities.research.slots['research-2']?.echoesAssigned).toBe(0)
  })
})
