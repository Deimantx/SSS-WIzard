import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CrystalsScreen } from './CrystalsScreen'

describe('CrystalsScreen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('keeps the socket board at fifteen equal-footprint cards with locked slots filled in', () => {
    const { container } = render(<TooltipProvider><CrystalsScreen /></TooltipProvider>)

    expect(container.querySelectorAll('.crystal-socket')).toHaveLength(15)
    expect(container.querySelectorAll('.crystal-socket.is-locked')).toHaveLength(10)
    expect(screen.getAllByText('LOCKED')).toHaveLength(10)
    expect(container.querySelectorAll('.crystal-socket-grid > .game-tooltip-trigger')).toHaveLength(15)
  })

  it('renders equipped Crystal inspection in the summary rail and removes the old floating popover', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      crystals: {
        ...state.crystals,
        owned: { ...state.crystals.owned, 'force-t1': 1 },
        equippedSlots: ['force-t1', ...state.crystals.equippedSlots.slice(1)],
      },
    })
    const { container } = render(<TooltipProvider><CrystalsScreen /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /T1 Crystal of Force equipped in slot 1/i }))

    expect(container.querySelector('.crystal-right-rail .crystal-selected-inspector')).toBeTruthy()
    expect(container.querySelector('.crystal-inspect-popover')).toBeNull()
    expect(screen.queryByText('MAX FOCUS')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close Crystal details' }))
    expect(container.querySelector('.crystal-selected-inspector')).toBeNull()
  })
})
