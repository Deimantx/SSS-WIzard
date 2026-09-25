import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import type { WorldTierId } from '../../game/types'
import { BestiaryInspector } from './BestiaryInspector'

const renderInspector = (monsterId: Parameters<typeof BestiaryInspector>[0]['monsterId'], worldTier: WorldTierId = 1, discovered = true) => {
  const state = createInitialState()
  state.progress.discoveredMonsters = discovered && monsterId ? [monsterId] : []
  state.worldTier.current = worldTier
  state.worldTier.highestUnlocked = Math.max(worldTier, 2) as WorldTierId
  useGameStore.setState(state)
  return render(<TooltipProvider><BestiaryInspector monsterId={monsterId} progress={state.progress} /></TooltipProvider>)
}

describe('BestiaryResonanceYield', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows scaled Resonance separately for a discovered boss', () => {
    renderInspector('forest-heart')

    expect(screen.getByText('RESONANCE YIELD')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    expect(screen.getByText('+16')).toBeTruthy()
    expect(screen.getByText('Life Essence')).toBeTruthy()
    expect(screen.getByText('LOOT TABLE')).toBeTruthy()
    expect(document.querySelector('.bestiary-resonance-section')?.compareDocumentPosition(document.querySelector('.bestiary-loot-list') as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })

  it('renders multiple types and reacts to the current World Tier', () => {
    renderInspector('graveglass-shade', 1)
    expect(screen.getByText('WT1')).toBeTruthy()
    expect(screen.getByText('+4')).toBeTruthy()
    expect(screen.getByText('+2')).toBeTruthy()

    act(() => { useGameStore.getState().setWorldTier(2) })
    expect(screen.getByText('WT2')).toBeTruthy()
    expect(screen.getByText('+9')).toBeTruthy()
    expect(screen.getByText('+4')).toBeTruthy()
  })

  it('shows an explicit empty state for an enemy without Resonance', () => {
    renderInspector('meridian-warden')
    expect(screen.getByText('No Resonance reward.')).toBeTruthy()
  })

  it('keeps undiscovered dossier details private', () => {
    renderInspector('forest-wisp', 1, false)
    expect(screen.getByText('UNDISCOVERED CREATURE')).toBeTruthy()
    expect(screen.queryByText('RESONANCE YIELD')).toBeNull()
  })
})
