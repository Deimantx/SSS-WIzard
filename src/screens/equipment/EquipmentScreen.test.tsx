import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { isMeaningfulEquipmentStatValue } from '../../game/presentation/equipment/equipmentStatPresentation'
import { EquipmentScreen } from './EquipmentScreen'

describe('EquipmentScreen', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setNavigationIntent({ equipmentItemId: null, equipmentPosition: null })
    useGameStore.getState().resetSave()
  })

  it('renders the three-slot Artifact loadout without accessory sections', () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    expect([...container.querySelectorAll('.equipment-slot-card')].map((card) => card.getAttribute('data-position'))).toEqual(['weapon', 'armor', 'head'])
    expect(screen.getByText('EQUIPMENT')).toBeTruthy()
    expect(screen.queryByText('ACCESSORIES')).toBeNull()
    expect(screen.queryByText('OFFHAND')).toBeNull()
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
    expect(screen.getByText(/T1 ARTIFACT · LEVEL 1 \/ 10/)).toBeTruthy()
    expect(screen.getByText('EQUIPPED · Weapon')).toBeTruthy()
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
})
