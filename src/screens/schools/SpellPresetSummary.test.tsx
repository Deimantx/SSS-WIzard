import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { swapSpellSlots } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellLoadout } from './CombatSpellLoadout'
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
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout projectionState={focusState} /></SpellLoadoutDndProvider>)

    expect(screen.getByText('Fire focus')).toBeTruthy()
    expect(screen.getByText('1 / 8 prepared')).toBeTruthy()
  })

  it('swaps prepared positions directly across the visible loadout grid', () => {
    const slots = [
      { spellId: 'fire-bolt' as const, autoCast: false },
      { spellId: 'water-bolt' as const, autoCast: false },
      { spellId: 'stone-shard' as const, autoCast: false },
      { spellId: 'wind-blade' as const, autoCast: false },
    ]
    expect(swapSpellSlots(slots, 0, 3)?.map((slot) => slot.spellId)).toEqual(['wind-blade', 'water-bolt', 'stone-shard', 'fire-bolt'])
    expect(swapSpellSlots(slots, 0, 7)?.map((slot) => slot.spellId)).toEqual(['wind-blade', 'water-bolt', 'stone-shard', 'fire-bolt'])
    expect(swapSpellSlots(slots, 2, 2)?.map((slot) => slot.spellId)).toEqual(['fire-bolt', 'water-bolt', 'stone-shard', 'wind-blade'])
    expect(swapSpellSlots(slots, 4, 1)).toBeNull()
  })

  it('exposes direct preset controls instead of a separate manager modal', () => {
    const current = useGameStore.getState()
    const focusState = { activities: current.activities, progress: current.progress, equipment: current.equipment, artifactProgress: current.artifactProgress, arcaneCore: current.arcaneCore, player: { maxFocus: current.player.maxFocus } }
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout projectionState={focusState} /></SpellLoadoutDndProvider>)
    expect(screen.getByLabelText('Active combat loadout preset')).toBeTruthy()
    expect(screen.getByText('Changes save automatically.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'NEW' })).toBeTruthy()
  })
})
