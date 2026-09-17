import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useArcaneCorePresetStore } from '../../store/arcaneCorePresetStore'
import { useGameStore } from '../../store/gameStore'
import { ArcaneCoreScreen } from './ArcaneCoreScreen'

describe('Arcane Core screen', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useArcaneCorePresetStore.getState().reset() })
  it('mounts the V3 wallet and four independent Cores', () => { render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy(); expect(screen.getByText('0 / 688 points invested')).toBeTruthy(); for (const name of ['Power Core', 'Vitality Core', 'Focus Core', 'Control Core']) expect(screen.getByText(name)).toBeTruthy() })
  it('opens a Core modal with ring nodes and rank purchase', async () => { const user = userEvent.setup(); useGameStore.getState().setArcaneCoreLevel(2); render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); await user.click(screen.getByRole('button', { name: /Power Core/i })); const dialog = screen.getByRole('dialog', { name: 'Power Core' }); expect(dialog.querySelector('[aria-label^="Arcane Force"]')).toBeTruthy(); await user.click(dialog.querySelector('[aria-label^="Arcane Force"]') as HTMLElement); await user.click(within(dialog).getByRole('button', { name: /Purchase Rank/ })); expect(useGameStore.getState().arcaneCore.nodes['power-r1-arcane-force']).toEqual({ rank: 1 }) })
  it('renders ranked node effects in the inspector', async () => { const user = userEvent.setup(); useGameStore.setState((state) => ({ arcaneCore: { ...state.arcaneCore, nodes: { 'power-r1-critical-insight': { rank: 1 } } } })); render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); await user.click(screen.getByRole('button', { name: /Power Core/i })); expect(screen.getByText(/Critical Chance/)).toBeTruthy() })
})
