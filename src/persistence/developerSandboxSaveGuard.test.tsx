import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { saveGameAction, saveGameCandidateAction } from '../store/actions/persistenceActions'
import { setDeveloperSandboxSavePaused } from './developerSandboxSaveGuard'
import { saveProfileGame } from './profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../profiles/profileKeys'
import { clearSaveDiagnostics, getSaveDiagnostics } from './saveDiagnosticsStore'
import { render, screen } from '@testing-library/react'
import { SaveProtectionNotice } from '../app/shell/SaveProtectionNotice'

describe('Developer Sandbox save suppression', () => {
  afterEach(() => setDeveloperSandboxSavePaused(false))

  it('skips manual and automatic profile writes without failure diagnostics or runtime changes', () => {
    clearSaveDiagnostics()
    const state = createInitialState()
    const beforeNotifications = structuredClone(state.notifications)
    const beforeSavedAt = state.lastSavedAt
    setDeveloperSandboxSavePaused(true)

    for (const reason of ['manual', 'autosave', 'visibility'] as const) {
      expect(saveGameAction(state, 'slot-1', reason, 999)).toMatchObject({ ok: true, skipped: true, reason: 'developer-sandbox', error: null })
    }
    expect(saveProfileGame('slot-1', state, { savedAt: 999 })).toMatchObject({ ok: true, skipped: true, reason: 'developer-sandbox' })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBeNull()

    expect(state.lastSavedAt).toBe(beforeSavedAt)
    expect(state.notifications).toEqual(beforeNotifications)
    expect(getSaveDiagnostics().health).toBe('healthy')
    expect(getSaveDiagnostics().lastFailure).toBeNull()
    render(<SaveProtectionNotice />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('skips detached candidate writes while the sandbox is active', () => {
    clearSaveDiagnostics()
    const candidate = createInitialState()
    const beforeSavedAt = candidate.lastSavedAt
    setDeveloperSandboxSavePaused(true)
    expect(saveGameCandidateAction(candidate, 'slot-1', 999)).toMatchObject({ ok: true, skipped: true, reason: 'developer-sandbox' })
    expect(candidate.lastSavedAt).toBe(beforeSavedAt)
  })
})
