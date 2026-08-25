import { describe, expect, it } from 'vitest'
import { makeInitialState, useGameStore } from '../store/gameStore'
import { recalculateDerivedStats } from './engine'
import { advanceChanneling } from './engine/channelingEngine'
import { BALANCE } from './core/balance/balance'
import { advanceGameState } from './systems/simulation/advanceGameState'
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

  it('does not report a full ETA while Mana is already over cap', () => {
    const state = makeInitialState()
    state.debug.allowManaOverCap = true
    state.player.mana = state.player.maxMana + 100
    expect(getManaFlowBreakdown(state)).toMatchObject({ state: 'surplus', etaKind: null, etaMs: null })
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

  it('exposes player, enemy, threat, lifetime and next-action combat telemetry', () => {
    const state = makeInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'thornling'
    state.combat.enemyHp = 36
    state.combat.enemyMaxHp = 64
    state.combat.enemyActionTimerMs = 1300
    state.combat.threatCleared = 8
    state.progress.lifetimeKills = 47
    state.player.health = 82
    const combat = getActivityTelemetry(state).find((item) => item.id === 'combat')

    expect(combat?.bars?.map((bar) => bar.label)).toEqual(['Player HP', 'Enemy HP'])
    expect(combat?.metrics.map((item) => item.label)).toEqual(['Threat Cleared', 'Lifetime Kills', 'Next'])

    state.combat.enemyId = null
    state.combat.encounterTimerMs = 3200
    const recovery = getActivityTelemetry(state).find((item) => item.id === 'combat')
    expect(recovery?.bars?.map((bar) => bar.label)).toEqual(['Player HP'])
    expect(recovery?.metrics.map((item) => item.label)).toEqual(['Threat Cleared', 'Lifetime Kills', 'Next Encounter'])
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

describe('Phase 2.7 stability fixes', () => {
  it('does not grant condensation output before its completion payment', () => {
    const state = makeInitialState()
    state.debug.bonusManaRegenFlat = -BALANCE.channeling.baseNaturalRegenPerSecond
    state.activities.condense.running = true
    state.activities.condense.element = 'water'
    state.activities.condense.progressMs = BALANCE.condense.durationMs - 100
    state.player.mana = 0
    advanceGameState(state, 100, { mode: 'banked' })

    expect(state.activities.condense.progressMs).toBe(BALANCE.condense.durationMs)
    expect(state.inventory['water-fragment'] ?? 0).toBe(0)
    expect(state.player.mana).toBe(0)
    expect(getActivityTelemetry(state).find((item) => item.id === 'condensation')?.status).toBe('waiting-mana')

    state.player.mana = BALANCE.condense.manaCost
    advanceGameState(state, 1, { mode: 'banked' })
    expect(state.player.mana).toBe(0)
    expect(state.inventory['water-fragment']).toBe(1)
    expect(state.activities.condense.progressMs).toBe(0)
  })

  it('does not complete a waiting condensation cycle while paused', () => {
    const state = makeInitialState()
    state.debug.bonusManaRegenFlat = -BALANCE.channeling.baseNaturalRegenPerSecond
    state.activities.condense.running = true
    state.activities.condense.progressMs = BALANCE.condense.durationMs
    state.player.mana = 0
    advanceGameState(state, 1, { mode: 'banked' })
    state.activities.condense.running = false
    state.player.mana = BALANCE.condense.manaCost
    advanceGameState(state, 1000, { mode: 'banked' })

    expect(state.inventory['water-fragment'] ?? 0).toBe(0)
    expect(state.activities.condense.progressMs).toBe(BALANCE.condense.durationMs)
    expect(state.player.mana).toBe(BALANCE.condense.manaCost)
  })

  it('continues Mana regeneration above Max Mana only while the debug override is enabled', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.debug.allowManaOverCap = true
    advanceChanneling(state, 1000)
    expect(state.player.mana).toBeGreaterThan(state.player.maxMana)

    state.debug.allowManaOverCap = false
    recalculateDerivedStats(state)
    expect(state.player.mana).toBe(state.player.maxMana)
  })
})
