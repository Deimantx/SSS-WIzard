import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { useGameStore } from '../../../store/gameStore'
import { EquipmentInspection } from './EquipmentInspection'

describe('Artificing equipment output inspection', () => {
  beforeEach(() => useGameStore.getState().resetSave())


  it('shows equipment stats, combat effects, and the real two-handed preview warning', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      progress: { ...state.progress, firstBossKill: true },
      inventory: { ...state.inventory, 'tide-focus': 1 },
      equipment: { ...state.equipment, offhand: 'tide-focus' },
    })
    render(<EquipmentInspection recipe={RECIPES['ember-staff']} />)
    expect(screen.getByText('STATS')).toBeTruthy()
    expect(screen.getByText(/would be removed because this is a two-handed Weapon/)).toBeTruthy()
  })

  it('keeps inspection content-only without a duplicate identity hero', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ progress: { ...state.progress, firstBossKill: true } })
    const { container } = render(<EquipmentInspection recipe={RECIPES['ember-staff']} />)
    expect(container.querySelector('.artificing-output-hero')).toBeNull()
    expect(container.querySelector('.artificing-output-icon')).toBeNull()
    expect(screen.getByText('STATS')).toBeTruthy()
  })
})
