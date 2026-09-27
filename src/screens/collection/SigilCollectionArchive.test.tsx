import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { getNavigationIntent, setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { SigilCollectionArchive } from './SigilCollectionArchive'

describe('SigilCollectionArchive navigation', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
    setNavigationIntent({ openSigilVault: false, equipmentSigilInstanceId: null, equipmentSigilSlot: null })
  })

  it('opens the Equipment-owned Sigil array directly', () => {
    const state = createInitialState()
    state.progress.tutorialStage = 'complete'
    useGameStore.setState({ progress: state.progress })

    render(<TooltipProvider><SigilCollectionArchive state={state} /></TooltipProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'OPEN SIGIL EQUIPMENT' }))

    expect(getNavigationIntent().openSigilVault).toBe(true)
    expect(getNavigationIntent().equipmentSigilInstanceId).toBeNull()
    expect(getNavigationIntent().equipmentSigilSlot).toBeNull()
    expect(useGameStore.getState().ui.screen).toBe('equipment')
  })
})
