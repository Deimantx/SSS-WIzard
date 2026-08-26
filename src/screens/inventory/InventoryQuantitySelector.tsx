import type { CSSProperties } from 'react'

export const clampInventoryQuantity = (value: number, maximum: number) => {
  const safeMaximum = Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : 0
  if (safeMaximum < 1) return 0
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 1
  return Math.max(1, Math.min(safeMaximum, safeValue))
}

type InventoryQuantitySliderProps = {
  value: number
  max: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function InventoryQuantitySlider({ value, max, disabled = false, onChange }: InventoryQuantitySliderProps) {
  const safeMax = Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 0
  const safeValue = clampInventoryQuantity(value, safeMax)
  const sliderMin = safeMax > 0 ? 1 : 0
  const sliderMax = safeMax
  const percent = safeMax > 1 ? ((safeValue - 1) / (safeMax - 1)) * 100 : safeMax === 1 ? 100 : 0
  const isDisabled = disabled || safeMax < 1

  return <input
    className="inventory-action-slider"
    style={{ '--quantity-percent': `${percent}%` } as CSSProperties}
    type="range"
    min={sliderMin}
    max={sliderMax}
    step={1}
    value={safeMax > 0 ? safeValue : 0}
    disabled={isDisabled}
    aria-label="Action quantity slider"
    aria-valuemin={sliderMin}
    aria-valuemax={safeMax}
    aria-valuenow={safeMax > 0 ? safeValue : 0}
    onChange={(event) => onChange(clampInventoryQuantity(Number(event.currentTarget.value), safeMax))}
  />
}

// Kept as a lightweight compatibility export for callers that still import the old filename.
export const InventoryQuantitySelector = InventoryQuantitySlider
