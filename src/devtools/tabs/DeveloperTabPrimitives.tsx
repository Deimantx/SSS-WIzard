import type { ReactNode } from 'react'

export function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) { return <label className="developer-number-field">{label}<input type="number" min={min} max={max} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} /></label> }
export function Summary({ label, value }: { label: string; value: ReactNode }) { return <div className="developer-summary"><span>{label}</span><strong>{value}</strong></div> }
