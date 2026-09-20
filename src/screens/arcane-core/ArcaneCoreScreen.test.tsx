import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { getArcaneCoreResonanceSummary } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { useArcaneCorePresetStore } from '../../store/arcaneCorePresetStore'
import { useGameStore } from '../../store/gameStore'
import { ArcaneCoreScreen } from './ArcaneCoreScreen'

describe('Arcane Core screen', () => {
  beforeEach(() => { window.localStorage.clear(); useGameStore.getState().resetSave(); useArcaneCorePresetStore.getState().reset() })

  it('mounts the V6 wallet and four independent Cores', () => {
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    expect(screen.getByRole('heading', { name: 'Arcane Core' })).toBeTruthy()
    expect(screen.getByText('0 / 102992 Arcane Points invested')).toBeTruthy()
    for (const name of ['Power Core', 'Vitality Core', 'Focus Core', 'Control Core']) expect(screen.getByText(name)).toBeTruthy()
    expect(screen.getByText('Purchase ranks to bring permanent modifiers online.')).toBeTruthy()
  })

  it('renders static stats and combat modifiers in Active Resonance', () => {
    const findNode = (name: string) => ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes).find((node) => node.name === name)!
    for (const name of ['Arcane Scaling', 'Spell Impact', 'Casting Rhythm']) useGameStore.getState().setArcaneCoreNodeRank(findNode(name).id, 1)
    const state = useGameStore.getState()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    expect(screen.getByText('Spell Power')).toBeTruthy()
    expect(screen.getByText('+0.10%')).toBeTruthy()
    expect(screen.getByText('Spell Damage')).toBeTruthy()
    expect(screen.getAllByText('+0.25%')).toHaveLength(2)
    expect(screen.getByText('Action Speed')).toBeTruthy()
    expect(getArcaneCoreResonanceSummary(state.arcaneCore).alwaysOn.map((entry) => entry.label)).toEqual(expect.arrayContaining(['Spell Power', 'Spell Damage', 'Action Speed']))
  })

  it('keeps conditional enemy modifiers out of always-on totals', () => {
    const suppression = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes).find((node) => node.name === 'Suppression')!
    useGameStore.getState().setArcaneCoreNodeRank(suppression.id, 1)
    const state = useGameStore.getState()
    const summary = getArcaneCoreResonanceSummary(state.arcaneCore)
    expect(summary.alwaysOn.some((entry) => entry.label === 'Enemy Damage Dealt')).toBe(false)
    expect(summary.conditional).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Enemy Damage Dealt', formattedValue: '-0.50%', conditionText: 'While the enemy has at least 1 negative Statuses' })]))
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    expect(screen.getByText('CONDITIONAL RESONANCE')).toBeTruthy()
    expect(screen.getByText('Enemy Damage Dealt')).toBeTruthy()
  })

  it('opens a Core modal with eight circular board layers and purchases a rank', async () => {
    const user = userEvent.setup()
    useGameStore.getState().setArcanePoints(10)
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    expect(dialog.querySelector('.arcane-core-node-layer')).toBeTruthy()
    expect(dialog.querySelector('.arcane-core-ring-node.node-major')).toBeTruthy()
    expect(dialog.querySelectorAll('.arcane-core-ring-node')).toHaveLength(72)
    await user.click(dialog.querySelector('[aria-label^="Arcane Scaling"]') as HTMLElement)
    await user.click(within(dialog).getByRole('button', { name: /PURCHASE RANK/ }))
    expect(useGameStore.getState().arcaneCore.nodes['power-r1-arcane-force']).toEqual({ rank: 1 })
  })

  it('keeps locked nodes selectable and reports the exact rank gate', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    expect(dialog.querySelector('.arcane-core-orbit.is-next-locked[data-ring]')).toBeTruthy()
    await user.click(dialog.querySelector('[aria-label^="Critical Insight"]') as HTMLElement)
    expect(within(dialog).getByText(/RING LOCKED .*0 \/ 20 PREVIOUS-RING RANKS/)).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: /PURCHASE RANK/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('resets pan and zoom with Fit Progression', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ArcaneCoreScreen /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /Power Core/i }))
    const dialog = screen.getByRole('dialog', { name: 'Power Core' })
    const viewport = dialog.querySelector('.arcane-core-ring-viewport') as HTMLElement
    const canvas = dialog.querySelector('.arcane-core-world') as HTMLElement
    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(viewport, { clientX: 180, clientY: 140, pointerId: 1 })
    fireEvent.pointerUp(viewport, { clientX: 180, clientY: 140, pointerId: 1 })
    await waitFor(() => expect(canvas.style.transform).toContain('translate3d('))
    await user.click(within(dialog).getByRole('button', { name: /Fit Progression/ }))
    await waitFor(() => expect(canvas.style.transform).toContain('translate3d(0px, 0px'))
    expect(canvas.style.transform).toContain('scale(')
  })
})
