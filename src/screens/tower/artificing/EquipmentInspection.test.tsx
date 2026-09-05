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
    expect(screen.getByRole('heading', { name: 'EQUIPMENT INSPECTION' })).toBeTruthy()
    expect(screen.getByText('2H')).toBeTruthy()
    expect(screen.getByText('AUTHORED STATS')).toBeTruthy()
    expect(screen.getByText(/would be removed because this is a two-handed Weapon/)).toBeTruthy()
  })

  it('keeps the output icon cell and copy as separate contained hero columns', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ progress: { ...state.progress, firstBossKill: true } })
    const { container } = render(<EquipmentInspection recipe={RECIPES['ember-staff']} />)
    const hero = container.querySelector('.artificing-output-hero')
    const icon = container.querySelector('.artificing-output-icon')
    expect(hero?.children).toHaveLength(2)
    expect(icon?.querySelector('.item-icon-large')).toBeTruthy()
    expect(icon?.parentElement).toBe(hero)
  })
})
