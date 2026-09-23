import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CrystalsScreen } from './CrystalsScreen'

const renderScreen = () => render(<TooltipProvider><CrystalsScreen /></TooltipProvider>)

describe('CrystalsScreen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('keeps the socket board at fifteen equal-footprint cards with locked slots filled in', () => {
    const { container } = renderScreen()

    expect(container.querySelectorAll('.crystal-socket')).toHaveLength(15)
    expect(container.querySelectorAll('.crystal-socket.is-locked')).toHaveLength(10)
    expect(screen.getAllByText('LOCKED')).toHaveLength(10)
    expect(container.querySelectorAll('.crystal-socket-grid > .game-tooltip-trigger')).toHaveLength(15)
  })

  it('keeps group limits on the board and stacks inventory before bulk crush', () => {
    const { container } = renderScreen()
    const board = container.querySelector('.crystal-board-card')
    const groups = board?.querySelector('.crystal-board-groups')
    const actions = board?.querySelector('.crystal-board-actions')

    expect(groups).toBeTruthy()
    expect(groups?.querySelectorAll('.crystal-board-group-row')).toHaveLength(4)
    expect(container.querySelector('.crystal-inspection-card .crystal-board-groups')).toBeNull()
    expect([...actions!.querySelectorAll('button')].map((button) => button.textContent?.trim())).toEqual([
      'CRYSTAL INVENTORY',
      'BULK CRUSH',
    ])
  })

  it('shows an empty inspection with a summary action and no crystal actions', () => {
    const { container } = renderScreen()

    expect(screen.getByRole('heading', { name: 'CRYSTAL INSPECTION' })).toBeTruthy()
    expect(screen.getByText('SELECT A CRYSTAL')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'SUMMARY' }) as HTMLButtonElement).disabled).toBe(false)
    expect(container.querySelector('.crystal-inspection-card .crystal-selected-inspector')).toBeNull()
    expect(screen.queryByRole('button', { name: 'UPGRADE' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNEQUIP' })).toBeNull()
  })

  it('shows the canonical zero state in the summary modal when no Crystal is equipped', () => {
    renderScreen()
    fireEvent.click(screen.getByRole('button', { name: 'SUMMARY' }))

    const dialog = screen.getByRole('dialog', { name: 'CRYSTAL SUMMARY' })
    expect(within(dialog).getByText('No active Crystal bonuses.')).toBeTruthy()
    expect(within(dialog).getByText('0 / 5')).toBeTruthy()
    expect(within(dialog).getByText('GROUP USAGE')).toBeTruthy()
    expect(within(dialog).getByText('CRYSTAL DUST')).toBeTruthy()
  })

  it('renders selected Crystal identity, current effect, next tier, cost, and actions in the inspection panel', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      crystals: {
        ...state.crystals,
        owned: { ...state.crystals.owned, 'force-t1': 1 },
        equippedSlots: ['force-t1', ...state.crystals.equippedSlots.slice(1)],
      },
    })
    const { container } = renderScreen()

    fireEvent.click(screen.getByRole('button', { name: /T1 Crystal of Force equipped in slot 1/i }))

    expect(container.querySelector('.crystal-inspection-card .crystal-selected-inspector')).toBeTruthy()
    expect(container.querySelector('.crystal-inspect-popover')).toBeNull()
    expect(screen.getByText('Equipped · Slot 1')).toBeTruthy()
    expect(screen.getByText('CURRENT EFFECT')).toBeTruthy()
    expect(screen.getByText('NEXT TIER')).toBeTruthy()
    expect(screen.getByText(/COST/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'UPGRADE' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'UNEQUIP' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'SUMMARY' }) as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Close Crystal inspection' }))
    expect(container.querySelector('.crystal-selected-inspector')).toBeNull()
    expect(screen.getByText('SELECT A CRYSTAL')).toBeTruthy()
  })

  it('opens the canonical Crystal summary modal and preserves inspection selection when it closes', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      crystals: {
        ...state.crystals,
        owned: { ...state.crystals.owned, 'force-t1': 1 },
        equippedSlots: ['force-t1', ...state.crystals.equippedSlots.slice(1)],
      },
    })
    const { container } = renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /T1 Crystal of Force equipped in slot 1/i }))
    fireEvent.click(screen.getByRole('button', { name: 'SUMMARY' }))

    const dialog = screen.getByRole('dialog', { name: 'CRYSTAL SUMMARY' })
    expect(within(dialog).getByText('ACTIVE CRYSTALS')).toBeTruthy()
    expect(within(dialog).getByText('Spell Power')).toBeTruthy()
    expect(within(dialog).getByText('GROUP USAGE')).toBeTruthy()
    expect(within(dialog).getByText('Destruction')).toBeTruthy()
    expect(within(dialog).getByText('CRYSTAL DUST')).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'CLOSE' }))
    expect(screen.queryByRole('dialog', { name: 'CRYSTAL SUMMARY' })).toBeNull()
    expect(container.querySelector('.crystal-selected-inspector')).toBeTruthy()
    expect(screen.getByText('Equipped · Slot 1')).toBeTruthy()
  })

  it('keeps summary available while combat locks upgrade and unequip', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      combat: { ...state.combat, active: true },
      crystals: {
        ...state.crystals,
        owned: { ...state.crystals.owned, 'force-t1': 1 },
        equippedSlots: ['force-t1', ...state.crystals.equippedSlots.slice(1)],
      },
    })
    renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /T1 Crystal of Force equipped in slot 1/i }))

    expect((screen.getByRole('button', { name: 'UPGRADE' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'UNEQUIP' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'SUMMARY' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
