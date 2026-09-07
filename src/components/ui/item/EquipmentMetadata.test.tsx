import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ITEMS } from '../../../game/content/items/items'
import { EquipmentMetadata } from './EquipmentMetadata'

describe('EquipmentMetadata', () => {
  it('uses the player tier mapping without exposing the internal balance band', () => {
    render(<EquipmentMetadata item={ITEMS['predator-hide-mantle']} />)

    expect(screen.getByText('T2')).toBeTruthy()
    expect(screen.getByRole('generic', { name: /T2\. Build tags/ })).toBeTruthy()
    expect(screen.queryByText(/1\.3/)).toBeNull()
    expect(screen.getByRole('generic', { name: /T2\. Build tags/ }).getAttribute('aria-label')).not.toContain('1.3')
  })
})
