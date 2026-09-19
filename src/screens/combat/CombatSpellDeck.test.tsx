import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { CombatSpellDeck } from './CombatSpellDeck'

describe('CombatSpellDeck', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    const state = useGameStore.getState()
    useGameStore.setState({ progress: { ...state.progress, spellRanks: { ...state.progress.spellRanks, 'fire-bolt': 1, 'wind-blade': 1 } } })
  })

  it('renders only the selected preset slots with read-only AUTO and MANUAL state', () => {
    const id = useGameStore.getState().createSpellPreset('Fire opener')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire opener', slots: [{ spellId: 'fire-bolt', autoCast: true }, { spellId: 'wind-blade', autoCast: false }] })
    expect(useGameStore.getState().selectSpellPreset(id).ok).toBe(true)
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText('Fire Bolt', { selector: 'strong' })).toBeTruthy()
    expect(screen.getByText('Wind Blade', { selector: 'strong' })).toBeTruthy()
    expect(screen.getByLabelText('AUTO, priority 1')).toBeTruthy()
    expect(screen.getByLabelText('MANUAL, no Auto-Cast focus')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Enable Auto-Cast|Disable Auto-Cast|Move .*priority|Remove from Preset/ })).toBeNull()
    expect(screen.getByText(/1 AUTO · 1 MANUAL/)).toBeTruthy()
  })

  it('freezes the active encounter snapshot while changing the selected next-battle preset', () => {
    const store = useGameStore.getState()
    const first = store.createSpellPreset('Fire opener')
    store.saveSpellPreset({ id: first, name: 'Fire opener', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    const second = store.createSpellPreset('Wind follow-up')
    store.saveSpellPreset({ id: second, name: 'Wind follow-up', slots: [{ spellId: 'wind-blade', autoCast: false }] })
    expect(store.selectSpellPreset(first).ok).toBe(true)
    store.spawnDebugEnemy('forest-wisp')
    const activeSignature = useGameStore.getState().combat.activeSpellLoadout?.signature
    expect(activeSignature).toBe('fire-bolt:1')

    expect(useGameStore.getState().selectSpellPreset(second).ok).toBe(true)
    const state = useGameStore.getState()
    expect(state.spellPresets.selectedPresetId).toBe(second)
    expect(state.combat.activeSpellLoadout?.signature).toBe(activeSignature)
    expect(state.activities.autoCastPriority).toEqual(['fire-bolt'])
  })

  it('displays the frozen active snapshot rather than the selected next preset during battle', () => {
    const store = useGameStore.getState()
    const first = store.createSpellPreset('Fire opener')
    store.saveSpellPreset({ id: first, name: 'Fire opener', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    const second = store.createSpellPreset('Wind follow-up')
    store.saveSpellPreset({ id: second, name: 'Wind follow-up', slots: [{ spellId: 'wind-blade', autoCast: false }] })
    store.selectSpellPreset(first)
    store.spawnDebugEnemy('forest-wisp')
    store.selectSpellPreset(second)
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText('Fire Bolt', { selector: 'strong' })).toBeTruthy()
    expect(screen.queryByText('Wind Blade', { selector: 'strong' })).toBeNull()
    expect(screen.getByText(/Will activate next battle/)).toBeTruthy()
  })
})
