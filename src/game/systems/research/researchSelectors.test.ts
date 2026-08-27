import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { prepareResearchAction } from '../../../store/actions/researchActions'
import { BALANCE } from '../../core/balance/balance'
import { getResearchBatchEtaMs, getResearchEffectiveDuration, getResearchItemsPerHour, getResearchManaPerSecond, getResearchXpPerHour } from './researchSelectors'

describe('Research selectors', () => {
  it('derives speed and rate metrics from Echo count', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 25
    prepareResearchAction(state, 'fire-fragment', 'fire', 10)
    const job = state.activities.research.slots['research-1']!
    job.echoesAssigned = 2
    job.progressMs = 1000
    expect(getResearchEffectiveDuration(job)).toBe(BALANCE.research.durationPerItemMs / 2)
    expect(getResearchItemsPerHour(job)).toBe(1440)
    expect(getResearchXpPerHour(job)).toBe(17_280)
    expect(getResearchManaPerSecond(job)).toBe(2)
    expect(getResearchBatchEtaMs(job)).toBe((BALANCE.research.durationPerItemMs - 1000) / 2 + 9 * BALANCE.research.durationPerItemMs / 2)
  })
})
