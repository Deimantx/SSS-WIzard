import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { selectUsedFocus } from '../../engine'
import { getFocusUsageGroups } from './focusUsage'

describe('Focus usage groups', () => {
  it('groups the reservation engine into all four Focus Load categories', () => {
    const state = createInitialState()
    state.activities.channeling.echoesAssigned = 4
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 2, status: 'running' }
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 3, progressMs: 0 }
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true

    const groups = getFocusUsageGroups(state)
    expect(groups.map((group) => group.sourceType)).toEqual(['channeling', 'research', 'transmutation', 'autocast'])
    expect(groups.map((group) => group.amount)).toEqual([40, 20, 30, 10])
    expect(groups.reduce((sum, group) => sum + group.amount, 0)).toBe(selectUsedFocus(state))
  })
})
