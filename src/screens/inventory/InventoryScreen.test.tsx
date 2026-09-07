import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { useGameStore } from '../../store/gameStore'
import { InventoryScreenV2 } from './InventoryScreen'

function renderInventoryWith(itemId: 'ember-staff' | 'wispglass-earring') {
  const state = useGameStore.getState()
  useGameStore.setState({
    ui: { screen: 'inventory' },
    inventory: { ...state.inventory, [itemId]: 1 },
  })
  return render(<TooltipProvider><GameContextMenuProvider><InventoryScreenV2 /></GameContextMenuProvider></TooltipProvider>)
}

describe('Inventory Artifact context actions', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('opens Artifact Path from an Artifact tile without leaving Inventory', () => {
    const { container } = renderInventoryWith('ember-staff')
    const tile = container.querySelector('[data-item-id="ember-staff"]') as HTMLElement

    fireEvent.contextMenu(tile, { clientX: 20, clientY: 20 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Artifact Path' }))

    expect(screen.getByRole('dialog', { name: 'Ember Staff Artifact Path' })).toBeTruthy()
    expect(useGameStore.getState().ui.screen).toBe('inventory')
  })

  it('does not offer Artifact Path for a normal Earring', () => {
    const { container } = renderInventoryWith('wispglass-earring')
    const tile = container.querySelector('[data-item-id="wispglass-earring"]') as HTMLElement

    fireEvent.contextMenu(tile, { clientX: 20, clientY: 20 })

    expect(screen.queryByRole('menuitem', { name: 'Artifact Path' })).toBeNull()
  })
})
