import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { EquipmentCatalog } from './EquipmentCatalog'

describe('Artificing equipment catalog tier filter', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useGameStore.getState().setDebugShowLockedArtificingRecipes(true)
    resetAllUiPreferences()
  })

  it('renders compact player-tier boxes and combines them with the slot filter', () => {
    render(<TooltipProvider><EquipmentCatalog selected={null} onSelect={vi.fn()} query="" onQueryChange={vi.fn()} /></TooltipProvider>)

    const tierFilter = screen.getByRole('group', { name: 'TIER' })
    expect(within(tierFilter).getByRole('button', { name: 'ALL' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('21 SHOWN')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T2' }))
    expect(within(tierFilter).getByRole('button', { name: 'T2' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('0 SHOWN')).toBeTruthy()
    expect(screen.getByText('No Equipment matches these filters.')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T1' }))
    expect(screen.getByText('21 SHOWN')).toBeTruthy()

    const slotFilter = screen.getByRole('group', { name: 'SLOT' })
    fireEvent.click(within(slotFilter).getByRole('button', { name: 'EARRING' }))
    expect(screen.getByText('3 SHOWN')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T2' }))
    expect(screen.getByText('0 SHOWN')).toBeTruthy()
  })
})
