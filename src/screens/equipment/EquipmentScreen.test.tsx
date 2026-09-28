import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { getNavigationIntent, setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { formatEquipmentStat, isMeaningfulEquipmentStatValue } from '../../game/presentation/equipment/equipmentStatPresentation'
import { getEquipmentStatSnapshot } from '../../game/presentation/equipment/equipmentReadModel'
import { createInitialState } from '../../store/initialState'
import { generateSigil } from '../../game/systems/sigils/sigilGeneration'
import { EquipmentScreen } from './EquipmentScreen'

describe('EquipmentScreen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setNavigationIntent({ equipmentItemId: null, equipmentPosition: null, openSigilVault: false, equipmentSigilInstanceId: null, equipmentSigilSlot: null })
    useGameStore.getState().resetSave()
  })

  it('renders the three-slot Artifact loadout without accessory sections', () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    expect([...container.querySelectorAll('.equipment-slot-card')].map((card) => card.getAttribute('data-position'))).toEqual(['weapon', 'armor', 'head'])
    expect(screen.getByText('EQUIPMENT')).toBeTruthy()
    expect(screen.queryByText('ACCESSORIES')).toBeNull()
    expect(screen.queryByText('OFFHAND')).toBeNull()
  })

  it('keeps gear visible and embeds six Sigil sockets that open the Vault focused to the selected slot', () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    expect(container.querySelectorAll('.equipment-slot-card')).toHaveLength(3)
    expect(container.querySelectorAll('.equipment-sigil-sockets .sigil-socket')).toHaveLength(6)
    expect(screen.queryByRole('tab', { name: 'SIGILS' })).toBeNull()
    fireEvent.click(container.querySelector('.equipment-sigil-sockets .sigil-socket') as HTMLElement)
    expect(screen.getByRole('dialog', { name: /ARCANE SIGIL VAULT/i })).toBeTruthy()
    expect(screen.getByText('REPLACING SLOT I')).toBeTruthy()
  })

  it('consumes a Sigil loot deep link into the exact Vault slot while retaining normal Equipment panels', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'echo', forcedSlot: 4, forcedQuality: 'legendary', rng: () => .7 })
    setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: sigil.instanceId, equipmentSigilSlot: 4 })
    useGameStore.setState(state)

    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    expect(container.querySelectorAll('.equipment-slot-card')).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'ARMORY' })).toBeTruthy()
    expect(screen.getByText('REPLACING SLOT IV')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /ECHO SIGIL IV/i })).toBeTruthy()
    expect(document.querySelector('.sigil-card.selected')).toBeTruthy()
    expect(getNavigationIntent().openSigilVault).toBe(false)
  })

  it('opens an equipped socket on the exact instance and displays its Inspector immediately', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'precision', forcedSlot: 3, forcedQuality: 'perfect', rng: () => .4 })
    state.sigils.equipped[3] = sigil.instanceId
    useGameStore.setState(state)
    render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /Sigil Slot III, Precision/i }))

    expect(screen.getByText('REPLACING SLOT III')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /PRECISION SIGIL III/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'UNEQUIP' })).toBeTruthy()
  })

  it('uses one epsilon for meaningful equipment values and hides empty optional groups', () => {
    expect(isMeaningfulEquipmentStatValue(0)).toBe(false)
    expect(isMeaningfulEquipmentStatValue(0.000001)).toBe(false)
    expect(isMeaningfulEquipmentStatValue(0.000009)).toBe(false)
    expect(isMeaningfulEquipmentStatValue(0.00001)).toBe(true)
    expect(isMeaningfulEquipmentStatValue(-0.00001)).toBe(true)
    expect(isMeaningfulEquipmentStatValue(0.01)).toBe(true)
    expect(isMeaningfulEquipmentStatValue(Number.NaN)).toBe(false)
    expect(isMeaningfulEquipmentStatValue(Number.POSITIVE_INFINITY)).toBe(false)

    render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    expect(screen.queryByText('PERIODIC / STATUS')).toBeNull()
    expect(screen.queryByText('Healing Done')).toBeNull()
    expect(screen.queryByText('Damage over Time')).toBeNull()
  })

  it('shows owned Artifact Equipment and its comparison metadata', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'ember-staff' }, inventory: { ...state.inventory, 'ember-staff': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="ember-staff"]') as HTMLElement)
    expect(screen.getByRole('heading', { name: 'Ember Staff' })).toBeTruthy()
    expect(screen.getByText(/T1 ARTIFACT.*RANKS 0 . 50/)).toBeTruthy()
    expect(screen.getByText(/EQUIPPED.*Weapon/)).toBeTruthy()
    expect(container.querySelector('.equipment-armory-artifact-meta')?.textContent).toContain('T1 ' + String.fromCharCode(183) + ' RANKS 0 / 50')
    expect(container.textContent).toContain(String.fromCharCode(8594))
    expect(container.textContent).not.toMatch(new RegExp('[' + String.fromCharCode(0xc3, 0xc2, 0xe2) + ']'))
    expect(container.querySelector('.equipment-copy-availability')?.textContent?.replace(/\s+/g, '')).toContain('OWNED1')
  })

  it('filters the armory by the matching canonical item slot', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'ember-staff': 1, 'wispveil-hood': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(screen.getByRole('tab', { name: 'HEAD' }))
    expect(container.querySelector('.equipment-armory-card[data-item-id="wispveil-hood"]')).toBeTruthy()
    expect(container.querySelector('.equipment-armory-card[data-item-id="ember-staff"]')).toBeNull()
  })

  it('reveals and hides stat contributions when Alt changes over an open Wizard Stats tooltip', async () => {
    render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Spell Power breakdown' }))
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toContain('Hold ALT to inspect the contribution sources.')

    fireEvent.keyDown(window, { key: 'Alt' })
    expect(tooltip.textContent).toContain('FINAL TOTAL')
    expect(tooltip.textContent).toContain('Base Character Value')

    fireEvent.keyUp(window, { key: 'Alt' })
    expect(tooltip.textContent).toContain('Hold ALT to inspect the contribution sources.')
  })
  it('shows equipped Crystal contribution in the Wizard Stats panel', () => {
    const state = useGameStore.getState()
    useGameStore.setState({
      crystals: {
        ...state.crystals,
        owned: { ...state.crystals.owned, 'cataclysm-t1': 1 },
        equippedSlots: ['cataclysm-t1', ...state.crystals.equippedSlots.slice(1)],
      },
    })

    render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    expect(screen.getByText('Spell Power')).toBeTruthy()
    expect(screen.getByText('57')).toBeTruthy()
  })

  it('includes equipped Sigil stats in the live Wizard Stats panel', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'refined', forcedMainStatId: 'spellPower', rng: () => .5 })
    state.sigils.equipped[1] = sigil.instanceId
    useGameStore.setState(state)
    const expected = getEquipmentStatSnapshot(state, state.equipment).spellPower

    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    const spellPowerRow = [...container.querySelectorAll('.equipment-stat-row')].find((row) => row.querySelector('.equipment-stat-label')?.textContent === 'Spell Power')
    expect(spellPowerRow?.textContent).toContain(formatEquipmentStat('spellPower', expected, false))
    expect(container.querySelector('.equipment-sigil-sockets .sigil-socket.is-filled')).toBeTruthy()
  })
})
