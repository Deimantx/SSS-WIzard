import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { discardDeveloperSandboxSnapshot, hasDeveloperSandboxSnapshot, restoreAndExitDeveloperSandbox } from '../developerSandbox'
import { clearDeveloperSandbox, getDeveloperToolsState } from '../developerToolsStore'
import { CustomScenarioLibrary } from './CustomScenarioLibrary'

describe('Custom Scenario Library UI', () => {
  beforeEach(() => {
    if (getDeveloperToolsState().sandbox.active) restoreAndExitDeveloperSandbox()
    else discardDeveloperSandboxSnapshot()
    clearDeveloperSandbox()
    useGameStore.setState(createInitialState())
  })

  it('offers JSON export when IndexedDB is unavailable without entering the sandbox', async () => {
    const urlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:scenario-test')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<CustomScenarioLibrary />)
    await waitFor(() => { expect(screen.getByRole('button', { name: 'EXPORT CURRENT STATE' })).toBeTruthy() })
    fireEvent.click(screen.getByRole('button', { name: 'EXPORT CURRENT STATE' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Regression Snapshot' } })
    fireEvent.click(screen.getByRole('button', { name: 'EXPORT JSON' }))
    expect(urlSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(hasDeveloperSandboxSnapshot()).toBe(false)
    urlSpy.mockRestore(); clickSpy.mockRestore()
  })
})
