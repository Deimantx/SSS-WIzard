import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { assignChannelingAcolyteAction, assignTransmutationAcolyteAction, removeChannelingAcolyteAction } from '../../../store/actions/acolyteActions'
import { getAcolyteCapacityBreakdown } from './acolyteCapacity'
import { selectFreeAcolytes, selectUsedAcolytes } from './acolyteAssignments'

describe('Acolyte capacity', () => {
  it('starts with five available Acolytes and tracks shared assignments', () => {
    const state = createInitialState()
    expect(getAcolyteCapacityBreakdown(state).total).toBe(5)
    expect(selectFreeAcolytes(state)).toBe(5)
    assignChannelingAcolyteAction(state)
    assignTransmutationAcolyteAction(state, 'fire-fragment')
    expect(selectUsedAcolytes(state)).toBe(2)
    expect(selectFreeAcolytes(state)).toBe(3)
    removeChannelingAcolyteAction(state)
    expect(selectFreeAcolytes(state)).toBe(4)
  })
})
