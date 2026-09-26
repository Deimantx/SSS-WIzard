import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { assignChannelingAcolyteAction, assignTransmutationAcolyteAction } from '../../../store/actions/acolyteActions'
import { getAcolyteAssignmentGroups } from './acolyteAssignmentPresentation'

describe('Acolyte assignment presentation', () => {
  it('groups all Channeling workers into one canonical-output row', () => {
    const state = createInitialState()
    for (let index = 0; index < 5; index += 1) assignChannelingAcolyteAction(state)

    expect(getAcolyteAssignmentGroups(state)).toEqual([expect.objectContaining({ key: 'channeling', label: 'Leyline Channeling', count: 5, outputValue: 10, outputUnit: 'FLUX/S' })])
  })

  it('only merges identical Research and Transmutation work', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 2
    state.inventory['water-fragment'] = 2
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 2, remainingQuantity: 2, progressMs: 0, acolyteAssigned: true, status: 'running' }
    state.activities.research.slots['research-2'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 2, remainingQuantity: 2, progressMs: 0, acolyteAssigned: true, status: 'running' }
    assignTransmutationAcolyteAction(state, 'water-fragment')

    const groups = getAcolyteAssignmentGroups(state)
    expect(groups.map(({ sourceType, label, count }) => ({ sourceType, label, count }))).toEqual([
      { sourceType: 'research', label: 'Fire Fragment → Fire', count: 2 },
      { sourceType: 'transmutation', label: 'Water Fragment', count: 1 },
    ])
  })
})
