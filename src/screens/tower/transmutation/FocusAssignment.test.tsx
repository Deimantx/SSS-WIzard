import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { FocusAssignment } from './FocusAssignment'

describe('FocusAssignment locked state', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('does not render Echo controls for a locked selected recipe', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<FocusAssignment selectedRecipeId="ember-staff" onSelect={vi.fn()} />)

    expect(screen.getByText('LOCKED')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Assign Echo to Ember Staff' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remove Echo from Ember Staff' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Echo from Fire Fragment' })).toBeTruthy()
  })
})
