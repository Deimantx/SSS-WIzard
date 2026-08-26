import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InventoryQuantitySlider } from './InventoryQuantitySelector'

describe('InventoryQuantitySlider UI', () => {
  it('exposes an integer range slider with the actionable maximum', () => {
    const onChange = vi.fn()
    render(<InventoryQuantitySlider value={8} max={17} onChange={onChange} />)
    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('min')).toBe('1')
    expect(slider.getAttribute('max')).toBe('17')
    expect(slider.getAttribute('step')).toBe('1')
    fireEvent.change(slider, { target: { value: '12' } })
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('disables the slider when no actionable copies remain', () => {
    render(<InventoryQuantitySlider value={1} max={0} onChange={() => undefined} />)
    expect((screen.getByRole('slider') as HTMLInputElement).disabled).toBe(true)
  })
})
