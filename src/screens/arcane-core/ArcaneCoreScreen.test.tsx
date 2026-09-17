import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useArcaneCorePresetStore } from '../../store/arcaneCorePresetStore'
import { useGameStore } from '../../store/gameStore'
import { ArcaneCoreScreen } from './ArcaneCoreScreen'

describe('Arcane Core screen', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useArcaneCorePresetStore.getState().reset() })
  it('mounts the V3 wallet and four independent Cores', () => { render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy(); expect(screen.getByText('0 / 688 points invested')).toBeTruthy(); for (const name of ['Power Core', 'Vitality Core', 'Focus Core', 'Control Core']) expect(screen.getByText(name)).toBeTruthy() })
  it('opens a Core modal with circular board layers and rank purchase', async () => { const user = userEvent.setup(); useGameStore.getState().setArcaneCoreLevel(2); render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); await user.click(screen.getByRole('button', { name: /Power Core/i })); const dialog = screen.getByRole('dialog', { name: 'Power Core' }); expect(dialog.querySelector('.arcane-core-node-layer')).toBeTruthy(); expect(dialog.querySelector('.arcane-core-ring-node.node-major')).toBeTruthy(); expect(dialog.querySelectorAll('.arcane-core-ring-node')).toHaveLength(36); expect(dialog.querySelector('[aria-label^="Arcane Force"]')).toBeTruthy(); await user.click(dialog.querySelector('[aria-label^="Arcane Force"]') as HTMLElement); await user.click(within(dialog).getByRole('button', { name: /Purchase Rank/ })); expect(useGameStore.getState().arcaneCore.nodes['power-r1-arcane-force']).toEqual({ rank: 1 }) })
  it('renders ranked node effects in the inspector', async () => { const user = userEvent.setup(); useGameStore.setState((state) => ({ arcaneCore: { ...state.arcaneCore, nodes: { 'power-r1-critical-insight': { rank: 1 } } } })); render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>); await user.click(screen.getByRole('button', { name: /Power Core/i })); expect(screen.getByText(/Critical Chance/)).toBeTruthy() })
  it('keeps locked nodes selectable and reports the exact Ring gate', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    expect(dialog.querySelector('.arcane-core-ring.ring-2.is-locked')).toBeTruthy()
    await user.click(dialog.querySelector('[aria-label^="Opening Blast"]') as HTMLElement)
    expect(within(dialog).getByText('RING LOCKED · 0 / 20 PREVIOUS-RING POINTS')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: /Purchase Rank/ }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('updates rank pips, shows Major gates, and confirms refund cascades', async () => {
    const user = userEvent.setup()
    useGameStore.getState().setArcaneCoreLevel(2)
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    const arcaneForce = dialog.querySelector('[aria-label^="Arcane Force"]') as HTMLElement
    await user.click(arcaneForce)
    expect(within(dialog).getAllByText('Inactive').length).toBeGreaterThan(0)
    await user.click(within(dialog).getByRole('button', { name: /Purchase Rank/ }))
    expect(useGameStore.getState().arcaneCore.nodes['power-r1-arcane-force']).toEqual({ rank: 1 })
    expect(dialog.querySelector('[aria-label^="Arcane Force, rank 1"]')).toBeTruthy()

    await user.click(dialog.querySelector('[aria-label^="Overwhelming Force"]') as HTMLElement)
    expect(within(dialog).getByText(/MAJOR LOCKED/)).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: /Purchase Rank/ }) as HTMLButtonElement).disabled).toBe(true)

    useGameStore.setState((state) => ({ arcaneCore: { ...state.arcaneCore, nodes: { 'power-r1-arcane-force': { rank: 1 }, 'power-r2-opening-blast': { rank: 1 } } } }))
    await user.click(dialog.querySelector('[aria-label^="Arcane Force"]') as HTMLElement)
    await user.click(within(dialog).getByRole('button', { name: 'Refund One Rank' }))
    const confirmation = screen.getByRole('alertdialog')
    expect(within(confirmation).getAllByText('2').length).toBeGreaterThan(0)
    expect(within(confirmation).getByText('RINGS RELOCKED')).toBeTruthy()
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm Refund' }))
    expect(useGameStore.getState().arcaneCore.nodes['power-r2-opening-blast']).toBeUndefined()
  })
  it('Fit Core resets both zoom and pan', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    const viewport = dialog.querySelector('.arcane-core-ring-viewport') as HTMLElement
    const canvas = dialog.querySelector('.arcane-core-ring-canvas') as HTMLElement
    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(viewport, { clientX: 180, clientY: 140, pointerId: 1 })
    fireEvent.pointerUp(viewport, { clientX: 180, clientY: 140, pointerId: 1 })
    expect(canvas.style.transform).toContain('80px')
    await user.click(within(dialog).getByRole('button', { name: /Fit Core/ }))
    expect(canvas.style.transform).toContain('0px')
    expect(canvas.style.transform).toContain('scale(0.46)')
  })
})
