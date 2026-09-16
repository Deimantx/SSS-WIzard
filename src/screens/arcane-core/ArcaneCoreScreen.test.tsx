import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useArcaneCorePresetStore } from '../../store/arcaneCorePresetStore'
import { useGameStore } from '../../store/gameStore'
import { ArcaneCoreScreen } from './ArcaneCoreScreen'

describe('Arcane Core screen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useArcaneCorePresetStore.getState().reset()
  })

  it('mounts without an unstable Zustand snapshot loop', () => {
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy()
    expect(screen.queryByText('This screen failed to render.')).toBeNull()
  })

  it('shows the Core wallet and all four progression branches', () => {
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByText('CORE POINTS')).toBeTruthy()
    expect(screen.queryByText('ARCANE ESSENCE')).toBeNull()
    for (const branch of ['POWER BRANCH', 'VITALITY BRANCH', 'FOCUS BRANCH', 'CONTROL BRANCH']) expect(screen.getByText(branch)).toBeTruthy()
  })

  it('opens a branch, selects a starter, and supports one-click purchase', async () => {
    const user = userEvent.setup()
    useGameStore.getState().setArcaneCoreXp(100)
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    await user.click(screen.getByRole('button', { name: /POWER BRANCH/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Arcane Core branch' })
    expect(dialog.querySelector('[data-node-id="power-a1"]')).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: 'Max reachable' })).toBeNull()
    await user.click(dialog.querySelector('[data-node-id="power-a1"]') as HTMLElement)
    await user.click(within(dialog).getByRole('button', { name: /Purchase/ }))
    expect(dialog.querySelector('[data-node-id="power-a1"].is-unlocked')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Power Arcane Core branch' })).toBeNull()
  })

  it('uses percentage formatting in the node inspector and active resonance', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => ({ arcaneCore: { ...state.arcaneCore, nodes: { 'power-b1': { purchased: true } } } }))
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByText('+1.00%')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /POWER BRANCH/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Arcane Core branch' })
    await user.click(dialog.querySelector('[data-node-id="power-b1"]') as HTMLElement)
    expect(dialog.querySelector('.arcane-core-inspector-effect')?.textContent).toContain('Critical Chance +1.00%')
  })

  it('creates and deletes named presets without changing the gameplay save', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    expect(screen.getByRole('heading', { name: 'Presets' })).toBeTruthy()
    expect(screen.queryByText('Session presets')).toBeNull()
    expect(screen.queryByText(/3 slots/)).toBeNull()
    expect(screen.queryByText(/available for this session|runtime only/i)).toBeNull()
    expect(screen.getByText('No presets saved yet.')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Save current' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Save current' }))
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Power route')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText('Power route')).toBeTruthy()
    expect(screen.getByText(/0 nodes.*0 points/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save current' }))
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Second route')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText('Second route')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Delete preset/ })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Delete preset Power route' }))
    expect(screen.getByText('Delete preset?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Power route')).toBeNull()
    expect(useGameStore.getState().arcaneCore).toEqual({ totalXp: 0, nodes: {} })
  })

  it('shows accurate preset validation errors and reacts to external runtime reset', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Save current' }))
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText('Enter a preset name.')).toBeTruthy()
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Power route')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const renameInput = screen.getByRole('textbox', { name: 'Rename Power route' })
    await user.clear(renameInput)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Enter a preset name.')).toBeTruthy()
    useArcaneCorePresetStore.getState().reset()
    await waitFor(() => expect(screen.getByText('No presets saved yet.')).toBeTruthy())
  })
})
