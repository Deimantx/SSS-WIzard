import type { CSSProperties, ReactNode } from 'react'
import { GameTooltip } from './tooltip/Tooltip'

export function Card({ children, className = '', title, action, style }: { children: ReactNode; className?: string; title?: string; action?: ReactNode; style?: CSSProperties }) {
  return <section style={style} className={`card ${className}`}>{title && <div className="card-head"><h2>{title}</h2>{action}</div>}{children}</section>
}

export function Button({ children, onClick, variant = 'primary', disabled = false, className = '', title, ariaLabel }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; disabled?: boolean; className?: string; title?: string; ariaLabel?: string }) {
  return <button title={title} aria-label={ariaLabel} className={`button ${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
}

export function Progress({ value, tone = 'violet', label, right }: { value: number; tone?: string; label?: string; right?: ReactNode }) {
  return <div className="progress-wrap">{(label || right) && <div className="progress-label"><span>{label}</span><strong>{right}</strong></div>}<div className="progress"><i className={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>
}

export function Status({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'active' | 'locked' }) { return <span className={`status ${tone}`}>{children}</span> }
export { GameTooltip }
export function Tooltip({ children, text }: { children: ReactNode; text: string }) { return <GameTooltip content={text}>{children}</GameTooltip> }
export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <input className="search-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> }

export function Tabs<T extends string>({ items, active, onChange }: { items: readonly T[]; active: T; onChange: (value: T) => void }) { return <div className="tabs">{items.map((item) => <button className={item === active ? 'active' : ''} key={item} onClick={() => onChange(item)}>{item}</button>)}</div> }
