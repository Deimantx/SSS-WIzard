import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import type { WorldTierId } from '../../game/types'
import { resolvePowerScaledCurrencyRewardRange } from '../../game/systems/loot/powerScaledCurrencyRewards'
import { formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
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
    expect(screen.getByText('Artifact Essence')).toBeTruthy()
    expect(screen.getByText('GUARANTEED REWARDS · WT1')).toBeTruthy()
    expect(screen.getByText('LOOT TABLE')).toBeTruthy()
    expect(document.querySelector('.bestiary-resonance-section')?.compareDocumentPosition(document.querySelector('.bestiary-loot-list') as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })

  it('shows guaranteed dynamic Essence ranges and updates them with World Tier', () => {
    renderInspector('forest-wisp', 1)
    const wt1Life = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 1)
    const wt1Artifact = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'artifact-essence', 1)
    const wt1Loot = document.querySelector('.bestiary-loot-list') as HTMLElement
    expect(wt1Loot.textContent).toContain(formatDropQuantity(wt1Life.finalMin, wt1Life.finalMax))
    expect(wt1Loot.textContent).toContain(formatDropQuantity(wt1Artifact.finalMin, wt1Artifact.finalMax))
    expect(wt1Loot.textContent).toContain('GUARANTEED')

    act(() => { useGameStore.getState().setWorldTier(2) })
    const wt2Life = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 2)
    const wt2Artifact = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'artifact-essence', 2)
    const wt2Loot = document.querySelector('.bestiary-loot-list') as HTMLElement
    expect(wt2Loot.textContent).toContain(formatDropQuantity(wt2Life.finalMin, wt2Life.finalMax))
    expect(wt2Loot.textContent).toContain(formatDropQuantity(wt2Artifact.finalMin, wt2Artifact.finalMax))
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
