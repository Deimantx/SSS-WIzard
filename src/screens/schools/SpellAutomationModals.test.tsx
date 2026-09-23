import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellLoadout } from './CombatSpellLoadout'
import { SpellAutomationModal } from './SpellAutomationModals'
import { SpellLoadoutDndProvider } from './SpellLoadoutDnd'

const focusState = () => {
  const state = useGameStore.getState()
  return { activities: state.activities, progress: state.progress, equipment: state.equipment, artifactProgress: state.artifactProgress, arcaneCore: state.arcaneCore, player: { maxFocus: state.player.maxFocus } }
}

function renderAutomationModal(spellId: 'earthen-barrier' | 'cleansing-tide' | 'fire-bolt', automation?: { conditions: Array<{ type: 'player-hp'; operator: 'below'; percent: number }>; targetRule: 'current-enemy' }) {
  return render(<SpellAutomationModal open slot={{ spellId, autoCast: true, automation }} slotIndex={0} presetName="Test Preset" onClose={vi.fn()} onApply={vi.fn()} />)
}

describe('Spell automation editor audit fixes', () => {
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
