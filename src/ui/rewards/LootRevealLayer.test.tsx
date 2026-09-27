import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { getUiPreferences, setUiPreferences } from '../preferences/uiPreferencesStore'
import { clearLootReveals, enqueueCombatLootReveal } from './lootRevealStore'
import { LootRevealLayer } from './LootRevealLayer'

afterEach(() => {
  clearLootReveals()
})

describe('Loot Reveal navigation', () => {
  it('opens mixed Sigil loot in Artificing > Sigils with Inventory as the secondary destination', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.tutorialStage = 'first-kill'
    useGameStore.setState(state)
    setUiPreferences({ screenState: { artificing: { mode: 'artifacts' } } })
    enqueueCombatLootReveal({
      sourceLabel: 'Whispering Woods',
      sourceDetail: 'Forest Wisp',
      items: [{ itemId: 'life-essence', quantity: 1, isNewDiscovery: false }],
      sigils: [{ instanceId: 'sigil:test', setId: 'echo', slot: 1, tier: 1, quality: 'refined', autoSalvaged: false, dustGranted: 0 }],
      now: 1000,
    })

    render(<LootRevealLayer />)
    expect(screen.getByRole('button', { name: 'VIEW SIGIL' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'VIEW INVENTORY' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'VIEW SIGIL' }))
    expect(useGameStore.getState().ui.screen).toBe('tower-artificing')
    expect(getUiPreferences().screenState.artificing.mode).toBe('sigils')
  })
})
