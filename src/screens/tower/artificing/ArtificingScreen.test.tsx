import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ArtificingScreen } from './ArtificingScreen'

describe('Artificing screen mode boundary', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetAllUiPreferences()
    useGameStore.getState().hydrateState(createInitialState())
  })

  it('switches between Artifact and Sigil workspaces without changing hook order', () => {
    const { container } = render(<TooltipProvider><ArtificingScreen /></TooltipProvider>)
    const modeSwitch = container.querySelector('.artificing-mode-switch') as HTMLElement
    expect(modeSwitch.querySelector('button')?.className).toContain('active')
    fireEvent.click(modeSwitch.querySelectorAll('button')[1] as HTMLElement)
    expect(screen.getByText('Arcane Sigil Workshop')).toBeTruthy()
    fireEvent.click((container.querySelector('.artificing-mode-switch') as HTMLElement).querySelectorAll('button')[0] as HTMLElement)
    expect(screen.getByText('Permanent items that grow through Artifact Path progression.')).toBeTruthy()
  })

  it('requires confirmation before enabling Perfect auto-salvage', () => {
    const { container } = render(<TooltipProvider><ArtificingScreen /></TooltipProvider>)
    fireEvent.click((container.querySelector('.artificing-mode-switch') as HTMLElement).querySelectorAll('button')[1] as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'ATTUNEMENT' }))
    fireEvent.click(screen.getByRole('switch', { name: /Perfect Sigils/ }))
    expect(screen.getByRole('heading', { name: 'AUTO-SALVAGE PERFECT SIGILS?' })).toBeTruthy()
    expect(useGameStore.getState().sigils.autoSalvage.perfect).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'ENABLE' }))
    expect(useGameStore.getState().sigils.autoSalvage.perfect).toBe(true)
  })
})
