import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InventoryQuantitySelector } from './InventoryQuantitySelector'

describe('InventoryQuantitySelector UI', () => {
  it('exposes an integer range slider with the actionable maximum', () => {
    const onChange = vi.fn()
    render(<InventoryQuantitySelector quantity={8} maximum={17} accent="sell" onChange={onChange} />)
    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('min')).toBe('1')
    expect(slider.getAttribute('max')).toBe('17')
    expect(slider.getAttribute('step')).toBe('1')
    fireEvent.change(slider, { target: { value: '12' } })
    expect(onChange).toHaveBeenCalledWith(12)
  })
})
