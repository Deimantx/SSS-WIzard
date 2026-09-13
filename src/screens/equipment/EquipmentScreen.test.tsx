import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { EquipmentScreen } from './EquipmentScreen'

describe('EquipmentScreen stat typography structure', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setNavigationIntent({ equipmentItemId: null, equipmentPosition: null })
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
    useGameStore.setState({ equipment: { ...state.equipment, amulet: 'windthread-charm' }, inventory: { ...state.inventory, 'windthread-charm': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="windthread-charm"]') as HTMLElement)
    expect(screen.getByText('COMBAT EFFECTS')).toBeTruthy()
    expect(screen.getAllByText('+10% Air Spell Damage').length).toBeGreaterThan(0)
  })

  it('shows owned, equipped, and available copies for selected equipment', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'tideglass-wand', ring1: 'gravebinder-ring' }, inventory: { ...state.inventory, 'tideglass-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    expect(gravebinderCard).toBeTruthy()
    fireEvent.click(gravebinderCard as HTMLElement)
    const availability = container.querySelector('.equipment-copy-availability')
    expect(availability?.textContent?.replace(/\s+/g, '')).toContain('OWNED1')
    expect(availability?.textContent?.replace(/\s+/g, '')).toContain('EQUIPPED1')
    expect(availability?.textContent?.replace(/\s+/g, '')).toContain('AVAILABLE0')
  })

  it('renders one Weapon slot and no Offhand position', () => {
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    expect([...container.querySelectorAll('.equipment-slot-card')].map((card) => card.getAttribute('data-position'))).toEqual(['cape', 'helmet', 'earring', 'amulet', 'weapon', 'armor', 'ring1', 'ring2'])
    expect(container.querySelector('[data-position="offhand"]')).toBeNull()
  })

  it('does not expose a stale Weapon unequip action when selecting a Ring from Armory', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'tideglass-wand' }, inventory: { ...state.inventory, 'tideglass-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    expect(gravebinderCard).toBeTruthy()
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.getByRole('heading', { name: 'Gravebinder Ring' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(useGameStore.getState().equipment.weapon).toBe('tideglass-wand')
  })

  it('keeps Ring 1 occupied and Ring 2 empty selection targeted at Ring 2', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'tideglass-wand', ring1: 'gravebinder-ring' }, inventory: { ...state.inventory, 'tideglass-wand': 1, 'gravebinder-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNEQUIP RING 1' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNEQUIP RING 2' })).toBeNull()
    expect(useGameStore.getState().equipment.weapon).toBe('tideglass-wand')
  })

  it('waits for Ring replacement choice when both Ring positions are occupied', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'tideglass-wand', ring1: 'gravebinder-ring', ring2: 'wispbound-ring' }, inventory: { ...state.inventory, 'tideglass-wand': 1, 'gravebinder-ring': 1, 'wispbound-ring': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'RINGS' }))
    const gravebinderCard = Array.from(container.querySelectorAll('.equipment-armory-card')).find((card) => card.textContent?.includes('Gravebinder Ring')) as HTMLElement | undefined
    fireEvent.click(gravebinderCard as HTMLElement)

    expect(screen.queryByRole('button', { name: 'UNEQUIP WEAPON' })).toBeNull()
    expect(screen.queryByRole('button', { name: /UNEQUIP RING/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Ring 1:/ }))
    expect(screen.getByRole('button', { name: 'UNEQUIP RING 1' })).toBeTruthy()
    expect(useGameStore.getState().equipment.weapon).toBe('tideglass-wand')
  })

  it('opens Artifact Path directly from equipment context actions', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ ui: { screen: 'equipment' }, equipment: { ...state.equipment, weapon: 'ember-staff' }, inventory: { ...state.inventory, 'ember-staff': 1 } })
    const { container } = render(<TooltipProvider><GameContextMenuProvider><EquipmentScreen /></GameContextMenuProvider></TooltipProvider>)
    const card = container.querySelector('.equipment-armory-card[data-item-id="ember-staff"]') as HTMLElement

    fireEvent.contextMenu(card, { clientX: 20, clientY: 20 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Artifact Path' }))

    expect(screen.getByRole('dialog', { name: 'Ember Staff Artifact Path' })).toBeTruthy()
    expect(useGameStore.getState().ui.screen).toBe('equipment')
  })

  it('uses the concise player-facing Artifact tier label', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ equipment: { ...state.equipment, weapon: 'ember-staff' }, inventory: { ...state.inventory, 'ember-staff': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="ember-staff"]') as HTMLElement)

    expect(Array.from(container.querySelectorAll('.equipment-inspector-meta strong')).some((element) => element.textContent?.includes('T1 ARTIFACT'))).toBe(true)
    expect(screen.queryByText(/TIER 1 ARTIFACT/)).toBeNull()
  })

  it('opens without an implicit Weapon target', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'ember-staff': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    expect(container.querySelector('.equipment-slot-card.selected')).toBeNull()
    expect(container.querySelector('.equipment-preview-slot-context')?.textContent).toContain('FITS')
    expect(container.querySelector('.equipment-preview-slot-context')?.textContent).toContain('WEAPON')
  })

  it('makes an empty Cape slot an explicit target and keeps Cape gear compatible', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'grovekeeper-mantle': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="cape"]') as HTMLElement)
    expect(container.querySelector('.equipment-slot-card[data-position="cape"]')?.classList.contains('selected')).toBe(true)
    expect(container.querySelector('.equipment-target-chip')?.textContent).toContain('TARGET SLOTCAPE')
    expect(screen.getByRole('tab', { name: 'CAPE' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="grovekeeper-mantle"]') as HTMLElement)

    expect(container.querySelector('.equipment-preview-slot-context')?.textContent).toContain('TARGET SLOTCAPE')
    expect(screen.queryByText('INCOMPATIBLE')).toBeNull()
  })

  it('derives a natural slot after ALL clears an explicit target', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'ember-staff': 1, 'grovekeeper-mantle': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(screen.getByRole('tab', { name: 'ALL' }))
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="grovekeeper-mantle"]') as HTMLElement)

    expect(container.querySelector('.equipment-target-chip')).toBeNull()
    expect(container.querySelector('.equipment-preview-slot-context')?.textContent?.replace(/\s+/g, '')).toContain('FITSCAPE')
    expect(screen.queryByText('INCOMPATIBLE')).toBeNull()
  })

  it('keeps category filters as browsing state instead of loadout targets', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'ember-staff': 1, 'grovekeeper-mantle': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'CAPE' }))
    expect(container.querySelector('.equipment-target-chip')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'WEAPON' }))

    expect(container.querySelector('.equipment-target-chip')).toBeNull()
    expect(container.querySelector('.equipment-inspector-hero h3')?.textContent).toBe('Ember Staff')
    expect(screen.queryByText('INCOMPATIBLE')).toBeNull()
  })

  it('keeps an explicit Weapon target visible in the Armory and Inspector', () => {
    const state = useGameStore.getState()
    useGameStore.setState({ inventory: { ...state.inventory, 'ember-staff': 1 } })
    const { container } = render(<TooltipProvider><EquipmentScreen /></TooltipProvider>)

    fireEvent.click(container.querySelector('.equipment-slot-card[data-position="weapon"]') as HTMLElement)
    fireEvent.click(container.querySelector('.equipment-armory-card[data-item-id="ember-staff"]') as HTMLElement)

    expect(container.querySelector('.equipment-target-chip')?.textContent).toContain('TARGET SLOTWEAPON')
    expect(container.querySelector('.equipment-preview-slot-context')?.textContent).toContain('TARGET SLOTWEAPON')
    expect(screen.getByRole('button', { name: 'EQUIP' }).hasAttribute('disabled')).toBe(false)
  })
})
