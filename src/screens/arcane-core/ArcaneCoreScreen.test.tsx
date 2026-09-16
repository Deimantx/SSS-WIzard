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
    expect(within(dialog).getByRole('button', { name: /Spell Power \+1/ })).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: 'Max reachable' })).toBeNull()
    await user.click(within(dialog).getByRole('button', { name: /Spell Power \+1/ }))
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
    await user.click(within(dialog).getByRole('button', { name: /Critical Chance \+0.20%/ }))
    expect(within(dialog).getByText('Critical Chance +0.20%')).toBeTruthy()
  })

  it('saves and clears a session preset without changing the gameplay save', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    const saveButton = screen.getAllByRole('button', { name: 'Save' })[0]
    await user.click(saveButton)
    expect(screen.getAllByRole('button', { name: 'Overwrite' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear preset 1' }))
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(3)
    expect(useGameStore.getState().arcaneCore).toEqual({ corePoints: 0, arcaneEssence: 0, nodes: {} })
  })
})
