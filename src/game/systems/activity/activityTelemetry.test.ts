import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { prepareResearchAction, setResearchEchoesAction } from '../../../store/actions/researchActions'
import { getActivityTelemetry } from './activityTelemetry'
import { getManaDemandBreakdown } from '../channeling/manaFlow'

const prepareCombatActivity = (dungeonId: 'whispering-woods' | 'howling-den' | 'abandoned-catacombs', enemyId: 'forest-wisp' | 'bonehide-boar' | 'grave-wraith') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = dungeonId
  state.combat.enemyId = enemyId
  state.combat.enemyHp = 50
  state.combat.enemyMaxHp = 100
  state.combat.enemyActionPatternId = 'default'
  state.combat.enemyActionDurationMs = 1_000
  state.combat.enemyActionTimerMs = 500
  return state
}

describe('Combat activity telemetry', () => {
  it('shows resolved Threat for targeted Combat Zones', () => {
    const state = prepareCombatActivity('whispering-woods', 'forest-wisp')
    state.combat.threatCleared = 2_430

    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'combat')

    expect(activity?.metrics).toContainEqual({ label: 'Threat', value: '2,430 / 5,000' })
    expect(activity?.collapsedSummary).toContain('Threat 2,430 / 5,000')
  })

  it('shows resolved Threat for Elite Zones', () => {
    const state = prepareCombatActivity('howling-den', 'bonehide-boar')
    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'combat')

    expect(activity?.metrics?.find((entry) => entry.label === 'Threat')?.value).toBe('0 / 10.0K')
  })

  it('removes Threat from sequence Dungeon combat and exposes the run step', () => {
    const state = prepareCombatActivity('abandoned-catacombs', 'grave-wraith')
    state.combat.dungeonSequenceIndex = 1

    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'combat')

    expect(activity?.metrics?.some((entry) => entry.label === 'Threat')).toBe(false)
    expect(activity?.metrics).toContainEqual({ label: 'Dungeon Run', value: 'Step 2 / 4' })
    expect(activity?.collapsedSummary).toBe('Abandoned Catacombs · Step 2 / 4 · P100% / E50%')
  })

  it('keeps sequence between-encounter telemetry free of Threat', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'abandoned-catacombs'
    state.combat.dungeonSequenceIndex = 2
    state.combat.encounterTimerMs = 2_000

    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'combat')

    expect(activity?.metrics?.some((entry) => entry.label === 'Threat')).toBe(false)
    expect(activity?.metrics).toContainEqual({ label: 'Dungeon Run', value: 'Step 3 / 4' })
    expect(activity?.collapsedSummary).not.toContain('Threat')
  })
})

describe('Research activity telemetry', () => {
  it('aggregates active batches, Echoes, Focus, throughput, and waiting count', () => {
    const state = createInitialState()
    state.player.mana = 100
    state.inventory['fire-fragment'] = 20
    state.inventory['water-fragment'] = 20
    prepareResearchAction(state, 'fire-fragment', 'fire', 10)
    prepareResearchAction(state, 'water-fragment', 'water', 10)
    setResearchEchoesAction(state, 'research-1', 2)
    setResearchEchoesAction(state, 'research-2', 1)

    const activity = getActivityTelemetry(state).find((entry) => entry.id === 'research')
    expect(activity).toMatchObject({ subtitle: '2 batches · 3 Echoes', progressPercent: 0, status: 'running' })
    expect(activity?.metrics?.find((entry) => entry.label === 'XP/h')).toMatchObject({ value: '13k/h' })
    expect(activity?.metrics?.find((entry) => entry.label === 'Items/h')).toMatchObject({ value: '1.1k/h' })
    expect(activity?.metrics?.find((entry) => entry.label === 'Mana demand')).toMatchObject({ value: '-9/s', tone: 'negative' })
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
    expect(funded?.remainingMs).toBeCloseTo(1_600)

    state.player.mana = 0
    state.activities.channeling.echoesAssigned = 1
    state.debug.bonusManaRegenFlat = -4
    const limited = getActivityTelemetry(state).find((entry) => entry.id === 'transmutation')
    expect(limited?.status).toBe('mana-limited')
    expect(limited?.remainingMs).toBeUndefined()
  })
})
