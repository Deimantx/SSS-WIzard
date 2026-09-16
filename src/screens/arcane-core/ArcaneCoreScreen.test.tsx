import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { ArcaneCoreScreen } from './ArcaneCoreScreen'

describe('Arcane Core screen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useGameStore.getState().resetArcaneCorePresets()
  })

  it('mounts without an unstable Zustand snapshot loop', () => {
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy()
    expect(screen.queryByText('This screen failed to render.')).toBeNull()
  })

  it('shows the Core wallet and all four progression branches', () => {
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByText('CORE POINTS')).toBeTruthy()
    expect(screen.getByText('ARCANE ESSENCE')).toBeTruthy()
    for (const branch of ['POWER BRANCH', 'VITALITY BRANCH', 'FOCUS BRANCH', 'CONTROL BRANCH']) expect(screen.getByText(branch)).toBeTruthy()
  })

  it('opens a branch, selects a starter, and supports unlock plus rank-up', async () => {
    const user = userEvent.setup()
    useGameStore.getState().setArcaneCorePoints(1)
    useGameStore.getState().setArcaneEssence(25)
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    await user.click(screen.getByRole('button', { name: /POWER BRANCH/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Arcane Core branch' })
    expect(dialog.querySelector('[data-node-id="power-01"]')).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: 'Max reachable' })).toBeNull()
    await user.click(dialog.querySelector('[data-node-id="power-01"]') as HTMLElement)
    await user.click(within(dialog).getByRole('button', { name: /Unlock/ }))
    expect(within(dialog).getByText('0 / 5')).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: /\+1 Rank/ }))
    expect(within(dialog).getByText('1 / 5')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Power Arcane Core branch' })).toBeNull()
  })

  it('uses percentage formatting in the node inspector and active resonance', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => ({ arcaneCore: { ...state.arcaneCore, nodes: { 'power-02': { unlocked: true, rank: 1, coreSpent: 0, essenceSpent: 0 } } } }))
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)

    expect(screen.getByText('+0.20%')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /POWER BRANCH/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Arcane Core branch' })
    await user.click(dialog.querySelector('[data-node-id="power-02"]') as HTMLElement)
    expect(dialog.querySelector('.arcane-core-inspector-effect')?.textContent).toContain('Critical Chance +0.20%')
  })

  it('creates and deletes named presets without changing the gameplay save', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    expect(screen.getByRole('heading', { name: 'Presets' })).toBeTruthy()
    expect(screen.queryByText('Session presets')).toBeNull()
    expect(screen.queryByText(/3 slots/)).toBeNull()
    expect(screen.getByText('No presets saved yet.')).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: 'Save current' })[0])
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Power route')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText('Power route')).toBeTruthy()
    expect(screen.getByText('0 nodes · 0 ranks')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save current' }))
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Second route')
    await user.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(screen.getByText('Second route')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Delete preset/ })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Delete preset Power route' }))
    expect(screen.getByText('Delete preset?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Power route')).toBeNull()
    expect(useGameStore.getState().arcaneCore).toEqual({ corePoints: 0, arcaneEssence: 0, nodes: {} })
  })
})
