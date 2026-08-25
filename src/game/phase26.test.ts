import { describe, expect, it } from 'vitest'
import { makeInitialState, useGameStore } from '../store/gameStore'
import { getManaFlowBreakdown } from './systems/channeling/manaFlow'
import { getActivityTelemetry } from './systems/activity/activityTelemetry'
import { clampResourcePercent } from '../app/shell/Topbar'

describe('Phase 2.6 Mana Flow', () => {
  it('clamps Focus and handles a zero maximum without invalid widths', () => {
    expect(clampResourcePercent(150, 100)).toBe(100)
    expect(clampResourcePercent(50, 0)).toBe(0)
  })

  it('uses authoritative production and reports surplus without consumers', () => {
    const state = makeInitialState()
    state.debug.bonusManaRegenFlat = 27.5
    const flow = getManaFlowBreakdown(state)
    expect(flow.production).toBe(32.5)
    expect(flow.demand).toBe(0)
    expect(flow.net).toBe(32.5)
    expect(flow.state).toBe('surplus')
  })

  it('derives condensation demand from its live balance values', () => {
    const state = makeInitialState()
    state.activities.condense.running = true
    const flow = getManaFlowBreakdown(state)
    expect(flow.demand).toBe(2.5)
    expect(flow.net).toBe(2.5)
  })

  it('reports deficit and time to empty', () => {
    const state = makeInitialState()
    state.debug.bonusManaRegenFlat = -3
    state.activities.condense.running = true
    state.activities.research.running = true
    state.activities.research.remainingQuantity = 1
    state.activities.research.durationPerItemMs = 5000
    state.activities.research.manaPerItem = 5
    state.player.mana = 60
    const flow = getManaFlowBreakdown(state)
    expect(flow.production).toBe(2)
    expect(flow.demand).toBe(3.5)
    expect(flow.net).toBe(-1.5)
    expect(flow.state).toBe('deficit')
    expect(flow.etaMs).toBe(40_000)
    expect(flow.etaKind).toBe('empty')
  })

  it('reports full, starved, and balanced boundary states', () => {
    const full = makeInitialState()
    full.player.mana = full.player.maxMana
    expect(getManaFlowBreakdown(full)).toMatchObject({ state: 'surplus', etaKind: 'full', etaMs: null })
    const starved = makeInitialState()
    starved.player.mana = 0
    starved.debug.bonusManaRegenFlat = -6
    expect(getManaFlowBreakdown(starved)).toMatchObject({ state: 'deficit', etaKind: 'starved', etaMs: null })
    const balanced = makeInitialState()
    balanced.debug.bonusManaRegenFlat = -5
    expect(getManaFlowBreakdown(balanced)).toMatchObject({ state: 'balanced', net: 0, etaKind: null })
  })
})

describe('Phase 2.6 Activity Monitor telemetry', () => {
  it('does not present persistent Arcane Echoes as a timed activity', () => {
    const state = makeInitialState()
    state.activities.channeling.echoesAssigned = 5
    expect(getActivityTelemetry(state)).toEqual([])
  })

  it('derives activity rates from the selected activity definitions', () => {
    const state = makeInitialState()
    state.activities.condense.running = true
    state.activities.research.running = true
    state.activities.research.itemId = 'fire-fragment'
    state.activities.research.targetSchoolId = 'fire'
    state.activities.research.remainingQuantity = 20
    state.activities.research.xpPerItem = 12
    state.activities.transmutation.running = true
    state.activities.transmutation.recipeId = 'ember-staff'
    const telemetry = getActivityTelemetry(state)
    expect(telemetry.find((item) => item.id === 'condensation')?.metrics[0].value).toBe('600/h')
    expect(telemetry.find((item) => item.id === 'research')?.metrics.map((item) => item.value)).toContain('8.6k/h')
    expect(telemetry.find((item) => item.id === 'transmutation')?.metrics[0].value).toBe('450/h')
  })
})

describe('Phase 2.6 Offline Bank', () => {
  it('spends banked time through the shared simulation and never recurses into the bank', async () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.preset('research')
    game.setResearchConfig('fire-fragment', 'fire', 20)
    game.toggleResearch()
    game.resumeFromHidden(600_000, false)
    const result = await useGameStore.getState().advanceWithOfflineBank(300_000)
    const state = useGameStore.getState()
    expect(result.ok).toBe(true)
    expect(state.offlineBankMs).toBe(300_000)
    expect(state.activities.research.remainingQuantity).toBeLessThan(20)
    expect(state.notifications.filter((note) => /research completed/i.test(note.text)).length).toBeLessThan(5)
  })

  it('rejects an advance larger than the bank without changing state', async () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.resumeFromHidden(180_000, false)
    const before = useGameStore.getState()
    const snapshot = { bank: before.offlineBankMs, mana: before.player.mana, notifications: before.notifications.map((note) => note.text) }
    const result = await before.advanceWithOfflineBank(300_000)
    const after = useGameStore.getState()
    expect(result.ok).toBe(false)
    expect(after.offlineBankMs).toBe(snapshot.bank)
    expect(after.player.mana).toBe(snapshot.mana)
    expect(after.notifications.map((note) => note.text)).toEqual(snapshot.notifications)
  })
})
