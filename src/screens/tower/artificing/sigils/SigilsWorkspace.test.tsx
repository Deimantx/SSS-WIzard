import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../../components/ui/tooltip/Tooltip'
import { generateSigil } from '../../../../game/systems/sigils/sigilGeneration'
import { createInitialState } from '../../../../store/initialState'
import { useGameStore } from '../../../../store/gameStore'
import { getNavigationIntent, setNavigationIntent } from '../../../../ui/navigation/navigationIntent'
import { resetAllUiPreferences, setUiPreferences } from '../../../../ui/preferences/uiPreferencesStore'
import { SigilsWorkspace } from './SigilsWorkspace'

describe('SigilsWorkspace', () => {
  beforeEach(() => {
    resetAllUiPreferences()
    const intent = getNavigationIntent()
    setNavigationIntent({ ...intent, artificingSigilTab: null, artificingSigilInstanceId: null })
  })

  it('shows the same visible workflow tabs on direct entry and consumes an exact Refinement deep link', async () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, source: 'debug', forcedTier: 1, forcedSetId: 'tempest', forcedSlot: 4, forcedQuality: 'legendary', rng: () => .3 })
    useGameStore.setState(state)
    setUiPreferences({ screenState: { artificing: { mode: 'sigils', sigilTab: 'refinement' } } })
    render(<TooltipProvider><SigilsWorkspace /></TooltipProvider>)

    expect(screen.getByRole('tab', { name: 'REFINEMENT' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'FORGE' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'ATTUNEMENT' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'REFINEMENT' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('tab', { name: 'FORGE' }))
    expect(screen.getByText('BASIC CRAFT')).toBeTruthy()
    setNavigationIntent({ artificingSigilTab: 'refinement', artificingSigilInstanceId: sigil.instanceId })

    await waitFor(() => expect(document.querySelector('.sigil-card[aria-pressed="true"]')?.textContent).toContain('Tempest'))
    expect(screen.getByRole('tab', { name: 'REFINEMENT' }).getAttribute('aria-selected')).toBe('true')
    expect(getNavigationIntent().artificingSigilInstanceId).toBeNull()
    expect(document.querySelector('.sigil-shared-inspector h2')?.textContent).toContain('Tempest')
  })
})
