import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { OutputInspection } from './OutputInspection'

describe('Transmutation output inspection', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
    resetAllUiPreferences()
  })

  it('shows authored material tier, source, and downstream uses', () => {
    render(<OutputInspection recipe={RECIPES['fire-fragment']} />)
    expect(screen.getByText('T1')).toBeTruthy()
    expect(screen.getByText('Wizard Tower → Transmutation')).toBeTruthy()
    expect(screen.getByText('USED IN')).toBeTruthy()
  })

  it('shows equipment stats, combat effects, and the real two-handed preview warning', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      inventory: { ...state.inventory, 'tide-focus': 1 },
      equipment: { ...state.equipment, offhand: 'tide-focus' },
    })
    render(<OutputInspection recipe={RECIPES['ember-staff']} />)
    expect(screen.getByText('2H')).toBeTruthy()
    expect(screen.getByText('AUTHORED STATS')).toBeTruthy()
    expect(screen.getByText(/would be removed because this is a two-handed Weapon/)).toBeTruthy()
  })

  it('keeps the output icon cell and copy as separate contained hero columns', () => {
    const { container } = render(<OutputInspection recipe={RECIPES['ember-staff']} />)
    const hero = container.querySelector('.transmutation-output-hero')
    const icon = container.querySelector('.transmutation-output-icon')
    expect(hero?.children).toHaveLength(2)
    expect(icon?.querySelector('.item-icon-large')).toBeTruthy()
    expect(icon?.parentElement).toBe(hero)
  })

  it('collapses Used In with the same persisted accordion control as Recipe Detail', () => {
    const view = render(<OutputInspection recipe={RECIPES['fire-fragment']} />)
    const usedIn = screen.getByRole('button', { name: /USED IN/ })

    expect(usedIn.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()

    fireEvent.click(usedIn)

    expect(usedIn.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Prismatic Fragment')).toBeNull()
    view.unmount()

    render(<OutputInspection recipe={RECIPES['fire-fragment']} />)
    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
  })
})
