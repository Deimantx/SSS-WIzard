import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellLoadout } from './CombatSpellLoadout'

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
    render(<CombatSpellLoadout focusState={focusState} onManage={() => {}} />)

    expect(screen.getByText('Fire focus')).toBeTruthy()
    expect(screen.getByText('1 / 8 prepared')).toBeTruthy()
  })
})
