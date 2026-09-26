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
    expect(screen.getByLabelText('Auto-Cast, priority 1')).toBeTruthy()
    expect(screen.getByLabelText('Manual Cast')).toBeTruthy()
    expect(screen.getByText('AUTO', { selector: '.spell-combat-mode-bar span' })).toBeTruthy()
    expect(screen.getByText('#01')).toBeTruthy()
    expect(screen.getByText('MANUAL', { selector: '.spell-combat-mode-bar span' })).toBeTruthy()
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

  it('compares the active snapshot with the usable projection, not unavailable stored slots', () => {
    const store = useGameStore.getState()
    const preset = store.createSpellPreset('Partial loadout')
    store.saveSpellPreset({ id: preset, name: 'Partial loadout', slots: [{ spellId: 'fire-bolt', autoCast: false }, { spellId: 'flame-burst', autoCast: false }] })
    expect(store.selectSpellPreset(preset).ok).toBe(true)
    store.spawnDebugEnemy('forest-wisp')
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.queryByText(/Will activate next battle/)).toBeNull()
    expect(screen.getByText(/Frozen for this enemy encounter/)).toBeTruthy()
  })

  it('keeps self-only manual Spells available during encounter downtime', () => {
    const store = useGameStore.getState()
    useGameStore.setState({ progress: { ...useGameStore.getState().progress, spellRanks: { ...useGameStore.getState().progress.spellRanks, 'mending-waters': 1 } } })
    const preset = store.createSpellPreset('Downtime healing')
    store.saveSpellPreset({ id: preset, name: 'Downtime healing', slots: [{ spellId: 'mending-waters', autoCast: false }] })
    expect(store.selectSpellPreset(preset).ok).toBe(true)
    store.spawnDebugEnemy('forest-wisp')
    useGameStore.setState({ combat: { ...useGameStore.getState().combat, enemyId: null } })
    render(<TooltipProvider><CombatSpellDeck /></TooltipProvider>)

    expect(screen.getByText(/ENCOUNTER DOWNTIME · SELF-CAST SPELLS REMAIN AVAILABLE/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /Mending Waters/ }) as HTMLButtonElement).disabled).toBe(false)
  })
})
