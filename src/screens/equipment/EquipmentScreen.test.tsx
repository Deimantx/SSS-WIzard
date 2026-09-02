import { render } from '@testing-library/react'
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
    })
  })
})
