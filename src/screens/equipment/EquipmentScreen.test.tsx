import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { EquipmentScreen } from './EquipmentScreen'

describe('EquipmentScreen stat typography structure', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('gives every wizard stat row explicit label and value elements', () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    const rows = container.querySelectorAll('.equipment-stat-row')
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((row) => {
      expect(row.querySelector('.equipment-stat-label')).toBeTruthy()
      expect(row.querySelector('.equipment-stat-value')).toBeTruthy()
      expect(row.parentElement?.classList.contains('equipment-stat-row-shell')).toBe(true)
    })
  })

  it('keeps direct and tooltip rows in the same shell and formats Basic Attack time in seconds', async () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    const directRow = container.querySelector('[data-stat-label="Max Health"]')
    const tooltipRow = container.querySelector('[data-stat-label="Basic Attack Speed"]')
    expect(directRow?.parentElement?.classList.contains('equipment-stat-row-shell')).toBe(true)
    expect(tooltipRow?.parentElement?.classList.contains('equipment-stat-row-shell')).toBe(true)

    const row = screen.getByText('Basic Attack Speed').parentElement as HTMLElement
    row.focus()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toContain('2.20s')
    expect(tooltip.textContent).not.toContain('2200.00s')
  })

  it('shows data-driven combat mechanics in the Gear Inspector', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'ember-staff' }, inventory: { ...state.inventory, 'ember-staff': 1 } })
    render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    expect(screen.getByText('COMBAT EFFECTS')).toBeTruthy()
    expect(screen.getAllByText('+20% Fire Spell Damage').length).toBeGreaterThan(0)
  })

  it('shows owned, equipped, and available copies for selected equipment', async () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'wispwood-wand', ring1: 'gravebinder-ring' }, inventory: { ...state.inventory, 'wispwood-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    expect(gravebinderCard).toBeTruthy()
    fireEvent.click(gravebinderCard as HTMLElement)
    expect(screen.getByText('OWNED 1')).toBeTruthy()
    expect(screen.getByText('EQUIPPED 1')).toBeTruthy()
    expect(screen.getByText('AVAILABLE 0')).toBeTruthy()
    expect(await screen.findByText(/second copy is required for this Ring position/i)).toBeTruthy()
  })

  it('does not expose a stale Weapon unequip action when selecting a Ring from Armory', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'wispwood-wand' }, inventory: { ...state.inventory, 'wispwood-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    expect(gravebinderCard).toBeTruthy()
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.getByRole('heading', { name: 'Gravebinder Ring' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(useGameStore.getState().equipment.weapon).toBe('wispwood-wand')
  })

  it('keeps Ring 1 occupied and Ring 2 empty selection targeted at Ring 2', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'wispwood-wand', ring1: 'gravebinder-ring' }, inventory: { ...state.inventory, 'wispwood-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNEQUIP RING 1' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNEQUIP RING 2' })).toBeNull()
    expect(useGameStore.getState().equipment.weapon).toBe('wispwood-wand')
  })

  it('waits for Ring replacement choice when both Ring positions are occupied', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'wispwood-wand', ring1: 'gravebinder-ring', ring2: 'wispbound-ring' }, inventory: { ...state.inventory, 'wispwood-wand': 1, 'gravebinder-ring': 1, 'wispbound-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(screen.queryByRole('button', { name: /UNEQUIP RING/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Ring 1:/ }))
    expect(screen.getByRole('button', { name: 'UNEQUIP RING 1' })).toBeTruthy()
    expect(useGameStore.getState().equipment.weapon).toBe('wispwood-wand')
  })
})
