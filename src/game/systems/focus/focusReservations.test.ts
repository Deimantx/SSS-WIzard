import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getCombatFocusReadiness, selectFreeFocus, selectUsedFocus } from './focusReservations'

const stateWithPreparedCombat = () => {
  const state = createInitialState()
  state.progress.spellRanks = { 'fire-bolt': 1 }
  state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 3, status: 'running' }
  state.spellPresets.presets = [{ id: 'prepared', name: 'Prepared', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
  state.spellPresets.selectedPresetId = 'prepared'
  return state
}

describe('Focus V2 active versus prepared reservations', () => {
  it('does not charge prepared Auto-Cast while combat is inactive', () => {
    const state = stateWithPreparedCombat()
    expect(selectUsedFocus(state)).toBe(30)
    expect(selectFreeFocus(state)).toBe(70)
    expect(getCombatFocusReadiness(state, state.spellPresets.presets[0].slots)).toMatchObject({ activeNonCombatFocus: 30, combatFocusRequired: 10, availableForCombat: 70, missingFocus: 0, ready: true })
  })

  it('charges the active battle snapshot and releases it when combat ends', () => {
    const state = stateWithPreparedCombat()
    state.combat.active = true
    state.combat.activeSpellLoadout = { presetId: 'prepared', presetName: 'Prepared', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' }
    expect(selectUsedFocus(state)).toBe(40)
    state.combat.active = false
    expect(selectUsedFocus(state)).toBe(30)
  })

  it('ignores stale compatibility Auto-Cast values outside combat', () => {
    const state = stateWithPreparedCombat()
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']
    expect(selectUsedFocus(state)).toBe(30)
  })

  it('reports the complete combat readiness deficit from one shared model', () => {
    const state = stateWithPreparedCombat()
    state.player.maxFocus = 35
    const readiness = getCombatFocusReadiness(state, [{ spellId: 'fire-bolt', autoCast: true }])
    expect(readiness).toMatchObject({ maxFocus: 35, activeNonCombatFocus: 30, combatFocusRequired: 10, availableForCombat: 5, missingFocus: 5, projectedTotalFocus: 40, projectedFreeFocus: -5, ready: false })
  })
})
