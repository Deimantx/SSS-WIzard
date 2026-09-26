import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { StartingSchoolScreen } from './StartingSchoolScreen'

describe('StartingSchoolScreen', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('shows only the four school choices with each artifact and three starter spells', () => {
    render(<StartingSchoolScreen />)

    expect(screen.getByText('Momentum and direct damage')).toBeTruthy()
    expect(screen.getByText('Recovery and protection')).toBeTruthy()
    expect(screen.getByText('Wards and endurance')).toBeTruthy()
    expect(screen.getByText('Speed and disruption')).toBeTruthy()
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    expect(screen.getByText('Tideglass Wand')).toBeTruthy()
    expect(screen.getByText('Stoneheart Scepter')).toBeTruthy()
    expect(screen.getByText('Windthread Wand')).toBeTruthy()
    ;['Fire Bolt', 'Searing Touch', 'Flame Burst', 'Water Bolt', 'Mending Waters', 'Frost Touch', 'Stone Shard', 'Stone Skin', 'Earthen Barrier', 'Wind Blade', 'Lightning Spark', 'Gust'].forEach((name) => expect(screen.getByText(name)).toBeTruthy())
    expect(screen.getAllByRole('button', { name: /CHOOSE/ })).toHaveLength(4)
    expect(screen.queryByText(/Scaling|Spell Power Damage|Base Damage|Cooldown|MANA/)).toBeNull()
  })
})
