import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceWithOfflineBank } from './offlineBankSimulation'

describe('Offline Bank transaction boundary', () => {
  it('does not install detached progression or spend time when candidate save fails', async () => {
    const state = createInitialState()
    state.offlineBankMs = 5_000
    state.activities.channeling.acolytesAssigned = 1
    const before = JSON.parse(JSON.stringify(state))
    let candidateOfflineMs = 0
    const result = await advanceWithOfflineBank(1_000, () => state, () => { throw new Error('live state must not be installed before save') }, (candidate) => {
      candidateOfflineMs = candidate?.offlineBankMs ?? 0
      return { ok: false, error: 'SAVE STORAGE FULL', kind: 'quota' }
    })

    expect(result.ok).toBe(false)
    expect(result.saveKind).toBe('quota')
    expect(candidateOfflineMs).toBe(4_000)
    expect(state).toEqual(before)
  })

  it('installs the candidate exactly once after a successful save', async () => {
    const state = createInitialState()
    state.offlineBankMs = 5_000
    state.activities.channeling.acolytesAssigned = 1
    let installs = 0
    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => { installs += 1; recipe(state) }, () => ({ ok: true, error: null }))

    expect(result.ok).toBe(true)
    expect(installs).toBe(1)
    expect(state.offlineBankMs).toBe(4_000)
  })
})
