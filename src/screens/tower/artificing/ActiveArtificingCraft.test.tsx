import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { ActiveArtificingCraft } from './ActiveArtificingCraft'

describe('Active Artificing craft', () => {
  it('cancels through the store, refunds materials, and hides its controls', () => {
    const initial = createInitialState()
    initial.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    initial.inventory = { 'fire-fragment': 48, 'wisp-essence': 24, 'grove-bark': 3 }
    useGameStore.setState(initial)
    useGameStore.getState().craftArtificingRecipe('ember-staff')
    render(<ActiveArtificingCraft />)
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }))
    expect(screen.queryByRole('button', { name: 'CANCEL' })).toBeNull()
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(48)
    expect(useGameStore.getState().inventory['ember-staff']).toBeUndefined()
  })
})
