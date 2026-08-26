import { Minus, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'

export type InventoryQuantityAccent = 'sell' | 'destroy'

export const clampInventoryQuantity = (value: number, maximum: number) => {
  const safeMaximum = Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : 0
  if (safeMaximum < 1) return 0
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 1
  return Math.max(1, Math.min(safeMaximum, safeValue))
}

export const getInventoryQuantityPreset = (preset: 'one' | 'quarter' | 'half' | 'max', maximum: number) => {
  const safeMaximum = Math.max(0, Math.floor(Number.isFinite(maximum) ? maximum : 0))
  if (preset === 'max') return safeMaximum
  if (preset === 'one') return safeMaximum > 0 ? 1 : 0
  return clampInventoryQuantity(Math.floor(safeMaximum * (preset === 'quarter' ? 0.25 : 0.5)), safeMaximum)
}

export function InventoryQuantitySelector({ quantity, maximum, accent, onChange }: { quantity: number; maximum: number; accent: InventoryQuantityAccent; onChange: (quantity: number) => void }) {
  const value = clampInventoryQuantity(quantity, maximum)
  const disabled = maximum < 1
  const setValue = (next: number) => onChange(clampInventoryQuantity(next, maximum))
  return <div className={`inventory-quantity-selector inventory-quantity-${accent}`}>
    <div className="inventory-quantity-head"><label htmlFor={`inventory-${accent}-quantity`}>QUANTITY</label><output>{value} / {maximum}</output></div>
    <div className="inventory-quantity-input-row">
      <button type="button" className="inventory-quantity-step" aria-label="Decrease quantity" disabled={disabled || value <= 1} onClick={() => setValue(value - 1)}><Minus size={13} /></button>
      <input id={`inventory-${accent}-quantity`} type="number" min={1} max={maximum} step={1} value={value || ''} disabled={disabled} aria-label={`${accent} quantity`} onChange={(event) => setValue(Number.parseInt(event.currentTarget.value, 10))} />
      <button type="button" className="inventory-quantity-step" aria-label="Increase quantity" disabled={disabled || value >= maximum} onClick={() => setValue(value + 1)}><Plus size={13} /></button>
    </div>
    <input className="inventory-quantity-range" style={{ '--quantity-percent': `${maximum > 1 ? ((value - 1) / (maximum - 1)) * 100 : 100}%` } as CSSProperties} type="range" min={1} max={Math.max(1, maximum)} step={1} value={value || 1} disabled={disabled} aria-label={`${accent} quantity slider`} onChange={(event) => setValue(Number(event.currentTarget.value))} />
    <div className="inventory-quantity-presets" aria-label="Quick quantity choices">
      {([['one', '1'], ['quarter', '25%'], ['half', '50%'], ['max', 'MAX']] as const).map(([preset, label]) => <button type="button" key={preset} onClick={() => setValue(getInventoryQuantityPreset(preset, maximum))} disabled={disabled}>{label}</button>)}
    </div>
  </div>
}
