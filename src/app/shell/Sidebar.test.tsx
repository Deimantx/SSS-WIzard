import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialState } from '../../store/initialState'
import { defaultUiPreferences } from '../../ui/preferences/uiPreferencesStorage'
import { useGameStore } from '../../store/gameStore'
import { Sidebar } from './Sidebar'

describe('Sidebar Artificing navigation', () => {
  it('shows Artificing during the Tower Work stage', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.tutorialStage = 'tower-work'
    useGameStore.setState(state)

    render(<Sidebar
      screen="home"
      setScreen={vi.fn()}
      preferences={defaultUiPreferences()}
      toggleGroup={vi.fn()}
      activeProfile={{ slotNumber: 1, name: 'Test Profile' }}
      profileKey={null}
      profileSwitchError={null}
      switchProfile={vi.fn()}
    />)

    expect(screen.getByRole('button', { name: 'Artificing' })).toBeTruthy()
  })
})
