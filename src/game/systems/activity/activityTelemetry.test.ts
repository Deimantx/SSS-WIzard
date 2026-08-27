import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { prepareResearchAction, setResearchEchoesAction } from '../../../store/actions/researchActions'
import { getActivityTelemetry } from './activityTelemetry'
import { getManaDemandBreakdown } from '../channeling/manaFlow'

describe('Research activity telemetry', () => {
  it('aggregates active batches, Echoes, Focus, throughput, and waiting count', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 20
    state.inventory['water-fragment'] = 20
    prepareResearchAction(state, 'fire-fragment', 'fire', 10)
    prepareResearchAction(state, 'water-fragment', 'water', 10)
    setResearchEchoesAction(state, 'research-1', 2)
    setResearchEchoesAction(state, 'research-2', 1)

    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'research')
    expect(activity).toMatchObject({ subtitle: '2 batches · 3 Echoes', progressPercent: 0, status: 'running' })
    expect(activity?.metrics?.find((entry) => entry.label === 'XP/h')).toMatchObject({ value: '26k/h' })
    expect(activity?.metrics?.find((entry) => entry.label === 'Items/h')).toMatchObject({ value: '2.2k/h' })
    expect(activity?.metrics?.find((entry) => entry.label === 'Mana demand')).toMatchObject({ value: '-3/s', tone: 'negative' })
    expect(activity?.metrics?.find((entry) => entry.label === 'Focus')).toMatchObject({ value: '30' })
    expect(getManaDemandBreakdown(state).filter((source) => source.id.startsWith('research-'))).toHaveLength(2)
  })

  it('does not report prepared zero-Echo batches as active', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 10)
    expect(getActivityTelemetry(state).find((entry) => entry.id === 'research')).toBeUndefined()
  })

  it('uses Echo-adjusted Transmutation ETA and reports Mana limitation honestly', () => {
    const state = createInitialState()
    state.player.mana = 100
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
    const funded = getActivityTelemetry(state).find((entry) => entry.id === 'transmutation')
    expect(funded?.remainingMs).toBeCloseTo(1_200)

    state.player.mana = 0
    state.debug.bonusManaRegenFlat = -4
    const limited = getActivityTelemetry(state).find((entry) => entry.id === 'transmutation')
    expect(limited?.status).toBe('mana-limited')
    expect(limited?.remainingMs).toBeUndefined()
  })
})
