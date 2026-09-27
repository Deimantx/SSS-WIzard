import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { generateSigil } from '../../../game/systems/sigils/sigilGeneration'
import { GameContextMenuProvider } from '../../../ui/context-menu/GameContextMenuProvider'
import { getNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { getUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { SigilVaultModal } from './SigilVaultModal'

describe('SigilVaultModal', () => {
  it('opens an exact stored Sigil, compares and replaces without losing the old instance, and toggles protection', () => {
    const state = createInitialState()
    const current = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'refined', rng: () => .3 })
    const candidate = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'echo', forcedSlot: 1, forcedQuality: 'refined', rng: () => .8 })
    state.sigils.equipped[1] = current.instanceId
    useGameStore.setState(state)

    render(<TooltipProvider><SigilVaultModal open onClose={() => undefined} initialSlot={1} initialSigilInstanceId={candidate.instanceId} onOpenArtificing={() => undefined} /></TooltipProvider>)

    expect(screen.getByText(/CURRENT IN SLOT I/)).toBeTruthy()
    expect(screen.getByText(/CURRENT SLOT COMPARISON/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'REPLACE SLOT I' }))
    expect(useGameStore.getState().sigils.equipped[1]).toBe(candidate.instanceId)
    expect(useGameStore.getState().sigils.storage[current.instanceId]).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Lock Sigil' }))
    expect(useGameStore.getState().sigils.storage[candidate.instanceId]?.locked).toBe(true)
    expect(document.querySelector('.sigil-vault-array')).toBeTruthy()
    expect(document.querySelector('.sigil-vault-inspector')).toBeTruthy()
  })

  it('offers safe shared context actions and routes Set collection without exposing salvage', () => {
    const state = createInitialState()
    generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'refined', rng: () => .3 })
    useGameStore.setState(state)
    render(<GameContextMenuProvider><TooltipProvider><SigilVaultModal open onClose={() => undefined} onOpenArtificing={() => undefined} /></TooltipProvider></GameContextMenuProvider>)

    fireEvent.contextMenu(document.querySelector('.sigil-vault-card') as HTMLElement)
    expect(screen.getByRole('menuitem', { name: 'Inspect' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Equip' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Compare' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Lock' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open Set in Collection' }))
    expect(useGameStore.getState().ui.screen).toBe('collection')
    expect(getUiPreferences().screenState.collection.primaryTab).toBe('sigils')
    expect(getNavigationIntent().sigilSetId).toBe('arcane')
    expect(screen.queryByRole('button', { name: /salvage/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /dismantle/i })).toBeNull()
  })
})
