import type { ReactNode } from 'react'

export function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="developer-number-field">{label}<input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} /></label> }
export function Summary({ label, value }: { label: string; value: ReactNode }) { return <div className="developer-summary"><span>{label}</span><strong>{value}</strong></div> }
