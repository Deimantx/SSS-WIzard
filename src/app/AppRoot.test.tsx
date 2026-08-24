import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoot } from './AppRoot'
import { refreshProfiles, setActiveProfileId } from '../profiles/profileSessionStore'

describe('AppRoot profile gate', () => {
  beforeEach(() => {
    localStorage.clear()
    setActiveProfileId(null)
    refreshProfiles()
  })

  it('starts at the profile launcher instead of auto-loading gameplay', () => {
    render(<AppRoot />)
    expect(screen.getByRole('heading', { name: 'Choose a Profile' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
  })

  it('creates a profile in the selected slot', async () => {
    const user = userEvent.setup()
    render(<AppRoot />)
    await user.click(screen.getByRole('button', { name: 'Create Profile in Slot 1' }))
    expect(screen.getByRole('dialog', { name: 'Create profile' })).toBeTruthy()
    const input = screen.getByLabelText('Profile name')
    await user.clear(input)
    await user.type(input, 'Aster')
    await user.click(screen.getByRole('button', { name: 'Create Profile' }))
    expect(screen.getByRole('heading', { name: 'Aster' })).toBeTruthy()
    expect(screen.getByText('Default')).toBeTruthy()
    expect(screen.getByText('Normal')).toBeTruthy()
  })
})
