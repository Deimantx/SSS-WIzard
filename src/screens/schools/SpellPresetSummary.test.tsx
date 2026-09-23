import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellLoadout, getLoadoutDropDestination } from './CombatSpellLoadout'
import { SpellLoadoutDndProvider } from './SpellLoadoutDnd'

describe('CombatSpellLoadout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('renders the selected ordered combat loadout and equipment-aware Focus summary', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } },
      equipment: current.equipment,
      artifactProgress: current.artifactProgress,
    })
    const id = useGameStore.getState().createSpellPreset('Fire focus')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire focus', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    useGameStore.getState().selectSpellPreset(id)

    const focusState = {
      activities: useGameStore.getState().activities,
      progress: useGameStore.getState().progress,
      equipment: useGameStore.getState().equipment,
      artifactProgress: useGameStore.getState().artifactProgress,
      arcaneCore: useGameStore.getState().arcaneCore,
      player: { maxFocus: useGameStore.getState().player.maxFocus },
    }
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout focusState={focusState} /></SpellLoadoutDndProvider>)

    expect(screen.getByText('Fire focus')).toBeTruthy()
    expect(screen.getByText('1 / 8 prepared')).toBeTruthy()
  })

  it('calculates stable insertion destinations for first, last, middle and empty targets', () => {
    expect(getLoadoutDropDestination(0, 7, 'after', 8)).toBe(7)
    expect(getLoadoutDropDestination(7, 0, 'before', 8)).toBe(0)
    expect(getLoadoutDropDestination(2, 5, 'after', 8)).toBe(5)
    expect(getLoadoutDropDestination(5, 2, 'before', 8)).toBe(2)
    expect(getLoadoutDropDestination(0, 7, 'before', 3)).toBe(2)
    expect(getLoadoutDropDestination(8, 1, 'before', 8)).toBeNull()
  })

  it('exposes direct preset controls instead of a separate manager modal', () => {
    const current = useGameStore.getState()
    const focusState = { activities: current.activities, progress: current.progress, equipment: current.equipment, artifactProgress: current.artifactProgress, arcaneCore: current.arcaneCore, player: { maxFocus: current.player.maxFocus } }
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout focusState={focusState} /></SpellLoadoutDndProvider>)
    expect(screen.getByLabelText('Active combat loadout preset')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save active combat loadout preset' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'NEW' })).toBeTruthy()
  })
})
