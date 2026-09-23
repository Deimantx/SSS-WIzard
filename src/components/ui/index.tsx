import type { HTMLInputTypeAttribute } from 'react'
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { GameTooltip } from './tooltip/Tooltip'
import type { ReactNode as TooltipNode } from 'react'
export { GameValue } from '../../ui/game-feel/GameValue'
export type { GameValueTone } from '../../ui/game-feel/GameValue'

export const Card = forwardRef<HTMLElement, { children: ReactNode; className?: string; title?: string; action?: ReactNode; style?: CSSProperties }>(function Card({ children, className = '', title, action, style }, ref) {
  return <section ref={ref} style={style} data-game-panel="true" className={`card ${className}`}>{title && <div className="card-head"><h2>{title}</h2>{action}</div>}{children}</section>
})

export const Button = forwardRef<HTMLButtonElement, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled' | 'onClick' | 'children' | 'aria-pressed'> & { children?: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; disabled?: boolean; className?: string; tooltip?: TooltipNode; ariaLabel?: string; ariaPressed?: boolean; icon?: boolean; uiSound?: 'click' | 'confirm' | 'none'; dataStaticMotion?: boolean; dataNoDrag?: boolean }>(function Button({ children, onClick, variant = 'primary', disabled = false, className = '', tooltip, ariaLabel, ariaPressed, icon = false, uiSound, dataStaticMotion = false, dataNoDrag = false, ...nativeProps }, ref) {
  const button = <button {...nativeProps} ref={ref} aria-label={ariaLabel} aria-pressed={ariaPressed} data-ui-sound={uiSound} data-static-motion={dataStaticMotion ? 'true' : undefined} data-no-drag={dataNoDrag ? 'true' : undefined} className={`button ${variant} ${icon ? 'icon' : ''} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
  return tooltip ? <GameTooltip block content={tooltip}>{button}</GameTooltip> : button
})

export function Progress({ value, tone = 'violet', label, right, running = false, completionPulseKey }: { value: number; tone?: string; label?: string; right?: ReactNode; running?: boolean; completionPulseKey?: string | number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return <div className={`progress-wrap ${running ? 'is-running' : ''} ${completionPulseKey !== undefined ? 'has-completion-pulse' : ''}`.trim()}>{(label || right) && <div className="progress-label"><span>{label}</span><strong>{right}</strong></div>}<div className="progress"><i key={completionPulseKey} className={tone} style={{ width: `${clamped}%` }} /></div></div>
}

export const Status = forwardRef<HTMLSpanElement, Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'> & { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'active' | 'locked'; className?: string }>(function Status({ children, tone = 'neutral', className = '', ...nativeProps }, ref) { return <span {...nativeProps} ref={ref} className={`status ${tone} ${className}`.trim()}>{children}</span> })
export { GameTooltip }
export function Tooltip({ children, text }: { children: ReactNode; text: string }) { return <GameTooltip content={text}>{children}</GameTooltip> }
export function SearchInput({ value, onChange, placeholder = 'Search...', ariaLabel, type = 'text' }: { value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel?: string; type?: HTMLInputTypeAttribute }) { return <input type={type} aria-label={ariaLabel} className="search-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> }

export function Tabs<T extends string>({ items, active, onChange }: { items: readonly T[]; active: T; onChange: (value: T) => void }) { return <div className="tabs" role="tablist">{items.map((item) => <button role="tab" aria-selected={item === active} className={item === active ? 'active' : ''} key={item} onClick={() => onChange(item)}>{item}</button>)}</div> }
export { ArchiveProgressTile } from './ArchiveProgressTile'
export { FilterBar, type FilterOption } from './FilterBar'
export { SelectMenu, type SelectMenuOption, type SelectMenuPortalLayer } from './SelectMenu'
export { ModalPortal } from './ModalPortal'
export { EquipmentCombatDetails } from './item/EquipmentCombatDetails'
