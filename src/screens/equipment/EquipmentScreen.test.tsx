import { render, screen } from '@testing-library/react'
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
})
