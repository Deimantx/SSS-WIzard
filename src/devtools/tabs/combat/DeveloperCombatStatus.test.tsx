import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { DeveloperCombatStatus } from './DeveloperCombatStatus'

describe('DeveloperCombatStatus Equipment fixtures', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('uses current Artifact slots for the authored combat fixtures', () => {
    render(<DeveloperCombatStatus />)

    fireEvent.click(screen.getByRole('button', { name: 'Stoneheart setup' }))

    const state = useGameStore.getState()
    expect(state.equipment.weapon).toBe('stoneheart-scepter')
    expect(state.equipment).toEqual({ weapon: 'stoneheart-scepter', armor: null, head: null })
    expect(state.combat.enemyId).toBe('forest-wisp')
  })

  it('can prepare a helmet fixture without creating an obsolete accessory slot', () => {
    render(<DeveloperCombatStatus />)

    fireEvent.click(screen.getByRole('button', { name: 'Wispveil debuffed hit' }))

    const state = useGameStore.getState()
    expect(state.equipment).toEqual({ weapon: null, armor: null, head: 'wispveil-hood' })
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'armor', 'head'])
  })
})
