import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { saveGameAction, saveGameCandidateAction } from '../store/actions/persistenceActions'
import { setDeveloperTestSessionSavePaused } from './developerTestSessionSaveGuard'
import { saveProfileGame } from './profileSaveManager'
import { profileSaveKey } from '../profiles/profileKeys'

describe('Developer Test Session save interlock', () => {
  afterEach(() => setDeveloperTestSessionSavePaused(false))

  it('blocks direct manual and automatic profile writes before touching game state', () => {
    const state = createInitialState()
    const beforeNotifications = structuredClone(state.notifications)
    const beforeSavedAt = state.lastSavedAt
    setDeveloperTestSessionSavePaused(true)

    for (const reason of ['manual', 'autosave', 'visibility'] as const) {
      expect(saveGameAction(state, 'slot-1', reason, 999)).toMatchObject({ ok: false })
    }
    expect(saveProfileGame('slot-1', state, { savedAt: 999 })).toMatchObject({ ok: false, detail: expect.stringContaining('interlock') })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBeNull()

    expect(state.lastSavedAt).toBe(beforeSavedAt)
    expect(state.notifications).toEqual(beforeNotifications)
  })

  it('blocks detached candidate writes while a scenario fixture is active', () => {
    const candidate = createInitialState()
    const beforeSavedAt = candidate.lastSavedAt
    setDeveloperTestSessionSavePaused(true)
    expect(saveGameCandidateAction(candidate, 'slot-1', 999)).toMatchObject({ ok: false, detail: expect.stringContaining('interlock') })
    expect(candidate.lastSavedAt).toBe(beforeSavedAt)
  })
})
