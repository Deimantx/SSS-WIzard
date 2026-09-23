import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellLoadout } from './CombatSpellLoadout'
import { CombatAutomationOverviewModal, SpellAutomationModal } from './SpellAutomationModals'
import { SpellLoadoutDndProvider } from './SpellLoadoutDnd'

const focusState = () => {
  const state = useGameStore.getState()
  return { activities: state.activities, progress: state.progress, equipment: state.equipment, artifactProgress: state.artifactProgress, arcaneCore: state.arcaneCore, player: { maxFocus: state.player.maxFocus } }
}

function renderAutomationModal(spellId: 'earthen-barrier' | 'cleansing-tide' | 'fire-bolt', automation?: { conditions: Array<{ type: 'player-hp'; operator: 'below'; percent: number }>; targetRule: 'current-enemy' }, withTooltips = false) {
  const modal = <SpellAutomationModal open slot={{ spellId, autoCast: true, automation }} slotIndex={0} presetName="Test Preset" onClose={vi.fn()} onApply={vi.fn()} />
  return render(withTooltips ? <TooltipProvider>{modal}</TooltipProvider> : modal)
}

describe('Spell automation editor audit fixes', () => {
  afterEach(() => { vi.useRealTimers() })

  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('shows the authored Earthen Barrier condition instead of Always', () => {
    renderAutomationModal('earthen-barrier')

    expect((screen.getByRole('combobox', { name: 'Condition type' }) as HTMLSelectElement).value).toBe('player-barrier-below')
    expect((screen.getByLabelText('Barrier value') as HTMLInputElement).value).toBe('10')
    expect(screen.queryByDisplayValue('Always')).toBeNull()
  })

  it('shows the authored Cleansing Tide cleanseable-debuff condition', () => {
    renderAutomationModal('cleansing-tide')

    expect((screen.getByRole('combobox', { name: 'Condition type' }) as HTMLSelectElement).value).toBe('player-has-cleanseable-debuff')
    expect(screen.getByText('Has cleanseable debuff')).toBeTruthy()
  })

  it('removes the exact condition row and falls back to Always', () => {
    renderAutomationModal('fire-bolt', { conditions: [{ type: 'player-hp', operator: 'below', percent: 50 }], targetRule: 'current-enemy' })

    expect(screen.getByRole('button', { name: 'Remove Condition' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Condition' }))

    expect((screen.getByRole('combobox', { name: 'Condition type' }) as HTMLSelectElement).value).toBe('always')
  })

  it('renders automation tooltips through the modal portal and shared provider', () => {
    vi.useFakeTimers()
    renderAutomationModal('fire-bolt', { conditions: [{ type: 'player-hp', operator: 'below', percent: 50 }], targetRule: 'current-enemy' }, true)

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Remove Condition' }))
    act(() => { vi.advanceTimersByTime(500) })

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.classList.contains('game-tooltip-modal')).toBe(true)
    expect(document.body.contains(tooltip)).toBe(true)
    expect(tooltip.textContent).toContain('Remove Condition')
  })

  it('keeps the combat automation editor read-only when opened from a battle snapshot', () => {
    render(<SpellAutomationModal open readOnly slot={{ spellId: 'fire-bolt', autoCast: true }} slotIndex={0} presetName="Battle Snapshot" onClose={vi.fn()} onApply={vi.fn()} />)

    expect(screen.getByText(/Active battle snapshot/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'APPLY' })).toBeNull()
    expect((screen.queryByRole('button', { name: 'ADD CONDITION' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('evaluates the edited mode from the projected draft state', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } },
      player: { ...current.player, mana: current.player.maxMana },
      activities: { ...current.activities, autoCast: { ...current.activities.autoCast, 'fire-bolt': true } },
      combat: { ...current.combat, active: true, enemyId: 'forest-wisp', enemyHp: 100, enemyMaxHp: 100 },
    })
    renderAutomationModal('fire-bolt')

    expect(screen.getByText('WOULD CAST')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /ON .* AUTO/ }))
    expect(screen.getByText('MANUAL')).toBeTruthy()
  })

  it('uses VIEW for read-only overview rows and forwards the selected slot', () => {
    const onEdit = vi.fn()
    render(<CombatAutomationOverviewModal open readOnly presetName="Battle Snapshot" slots={[{ spellId: 'fire-bolt', autoCast: true }]} onClose={vi.fn()} onEdit={onEdit} onToggleMode={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'VIEW' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'EDIT' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'VIEW' }))
    expect(onEdit).toHaveBeenCalledWith(0)
  })

  it('keeps evaluation compact outside combat and reveals details on demand', () => {
    renderAutomationModal('fire-bolt')

    expect(screen.getByText('WAITING FOR COMBAT')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'SHOW DETAILS' })).toBeTruthy()
    expect(screen.queryByText('SYSTEM CHECKS')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'SHOW DETAILS' }))
    expect(screen.getByText('CONFIGURED RULES')).toBeTruthy()
    expect(screen.getByText('LIVE CHECKS')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'HIDE DETAILS' })).toBeTruthy()
  })

  it('returns from overview edit to the overview after Apply', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } } })
    const id = useGameStore.getState().createSpellPreset('Audit Preset')
    useGameStore.getState().saveSpellPreset({ id, name: 'Audit Preset', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    useGameStore.getState().selectSpellPreset(id)
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout focusState={focusState()} /></SpellLoadoutDndProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Open combat automation overview' }))
    expect(screen.getByRole('dialog', { name: 'Combat Automation Overview' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'EDIT' }))
    expect(screen.getByRole('dialog', { name: 'Fire Bolt Automation' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'APPLY' }))

    expect(screen.getByRole('dialog', { name: 'Combat Automation Overview' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Fire Bolt Automation' })).toBeNull()
  })

  it('returns directly to the loadout after direct gear edit Apply', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } } })
    const id = useGameStore.getState().createSpellPreset('Direct Preset')
    useGameStore.getState().saveSpellPreset({ id, name: 'Direct Preset', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    useGameStore.getState().selectSpellPreset(id)
    render(<SpellLoadoutDndProvider onCommit={() => {}}><CombatSpellLoadout focusState={focusState()} /></SpellLoadoutDndProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Configure Fire Bolt automation' }))
    expect(screen.getByRole('dialog', { name: 'Fire Bolt Automation' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'APPLY' }))

    expect(screen.queryByRole('dialog', { name: 'Fire Bolt Automation' })).toBeNull()
    expect(screen.queryByRole('dialog', { name: 'Combat Automation Overview' })).toBeNull()
  })
})
