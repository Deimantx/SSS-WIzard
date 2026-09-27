import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { serializeGameState } from './profileSaveManager'
import { getAuthoritativeSaveSnapshot, validateSerializedSave } from './saveIntegrity'

describe('authoritative save validation', () => {
  it('round-trips sigils, crystals, and guardian progression as authoritative data', () => {
    const state = createInitialState()
    state.sigils.dust = 31
    state.sigils.lifetimeDrops = 4
    state.crystals.dust = 27
    state.crystals.owned['force-t1'] = 2
    state.guardians.selectedGuardianId = 'fire-guardian'
    state.guardians.progress['fire-guardian'] = { level: 3, rank: 2 }

    const result = validateSerializedSave(JSON.stringify(serializeGameState(state)), state)

    expect(result.ok).toBe(true)
    expect(result.report.classification).toBe('MATCH')
    expect(result.state?.sigils.dust).toBe(31)
    expect(result.state?.crystals.owned['force-t1']).toBe(2)
    expect(result.state?.guardians.progress['fire-guardian']).toEqual({ level: 3, rank: 2 })
  })

  it('reports the exact authoritative path when migration changes owned data', () => {
    const state = createInitialState()
    const encoded = JSON.stringify({ ...serializeGameState(state), sigils: { ...state.sigils, dust: 9 } })
    const result = validateSerializedSave(encoded, state)

    expect(result.ok).toBe(false)
    expect(result.report.classification).toBe('AUTHORITATIVE_CHANGE')
    expect(result.report.changes.some((change) => change.path === 'sigils.dust')).toBe(true)
  })

  it('does not treat chronicle-only normalization as an authoritative rollback', () => {
    const expected = createInitialState()
    const actual = createInitialState()
    actual.progress.chronicle.completedObjectiveIds = ['m1-choose-school']
    const expectedSnapshot = getAuthoritativeSaveSnapshot(expected)
    const actualSnapshot = getAuthoritativeSaveSnapshot(actual)

    expect(expectedSnapshot).toEqual(actualSnapshot)
    const result = validateSerializedSave(JSON.stringify(serializeGameState(actual)), expected)
    expect(result.ok).toBe(true)
    expect(result.report.classification).toBe('DERIVED_ONLY')
    expect(result.report.changes[0]?.path).toBe('chronicle.completedObjectiveIds.0')
  })
})
