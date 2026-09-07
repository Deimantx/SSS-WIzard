import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatPlayerEquipmentTier, getPlayerEquipmentTier } from '../../../game/content/items/equipmentBalance'
import { ITEMS } from '../../../game/content/items/items'
import { EquipmentMetadata } from './EquipmentMetadata'

describe('EquipmentMetadata', () => {
  it('uses the player tier mapping without exposing the internal balance band', () => {
    render(<EquipmentMetadata item={ITEMS['predator-hide-mantle']} />)

    expect(screen.getByText('T1')).toBeTruthy()
    expect(screen.getByRole('generic', { name: /T1\. Build tags/ })).toBeTruthy()
    expect(screen.queryByText(/1\.3/)).toBeNull()
    expect(screen.getByRole('generic', { name: /T1\. Build tags/ }).getAttribute('aria-label')).not.toContain('1.3')
  })

  it('derives player tiers from the integer part of internal balance bands', () => {
    for (const [internalTier, playerTier] of [[1.0, 1], [1.3, 1], [1.6, 1], [2.3, 2], [3.6, 3]] as const) {
      expect(getPlayerEquipmentTier(internalTier)).toBe(playerTier)
      expect(formatPlayerEquipmentTier(internalTier)).toBe(`T${playerTier}`)
    }
  })
})
