import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { assignResearchAcolyteAction, prepareResearchAction } from '../../../store/actions/researchActions'
import { getActivityTelemetry } from './activityTelemetry'

describe('activity telemetry', () => {
  it('reports Research through Acolytes and Flux when the work is unfunded', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 1

    expect(prepareResearchAction(state, 'fire-fragment', 'fire', 1)).toBe(true)
    expect(assignResearchAcolyteAction(state, 'research-1')).toBe(true)

    const research = getActivityTelemetry(state).find((activity) => activity.id === 'research')
    expect(research).toMatchObject({ status: 'waiting-flux' })
    expect(research?.subtitle).toContain('Acolytes')
    expect(research?.metrics.some((entry) => entry.label === 'Flux demand')).toBe(true)
    expect(research?.metrics.some((entry) => entry.label === 'Focus' || entry.label === 'Mana')).toBe(false)
  })
})
