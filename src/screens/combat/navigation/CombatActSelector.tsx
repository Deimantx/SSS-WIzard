import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { WheelEvent as ReactWheelEvent } from 'react'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import type { CombatActId, CombatActSummaryViewModel } from './combatActNavigationTypes'

export function CombatActSelector({ acts, selectedActId, onSelect }: { acts: CombatActSummaryViewModel[]; selectedActId: CombatActId; onSelect: (id: CombatActId) => void }) {
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const selected = stripRef.current?.querySelector<HTMLElement>(`[data-act-id="${selectedActId}"]`); if (!selected) return; const reducedMotion = document.documentElement.dataset.reducedMotion === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches; selected.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }) }, [selectedActId])
  const move = (direction: -1 | 1) => {
    const index = acts.findIndex((act) => act.id === selectedActId)
    const next = acts[index + direction]
    if (next) onSelect(next.id)
  }
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const strip = event.currentTarget
    if (strip.scrollWidth <= strip.clientWidth) return
    const before = strip.scrollLeft
    strip.scrollLeft += event.deltaY
    if (strip.scrollLeft !== before) event.preventDefault()
  }
  return <section className="combat-act-selector" aria-label="Campaign acts"><div className="combat-act-selector-head"><span className="combat-subsection-label">CAMPAIGN TIMELINE</span><span>{acts.length} {acts.length === 1 ? 'ACT' : 'ACTS'} REVEALED</span></div><div className="combat-act-selector-rail"><GameTooltip content={<TooltipContent title="Previous Act" description="Select the previous revealed campaign Act." />}><button type="button" className="combat-act-selector-arrow" aria-label="Previous act" onClick={() => move(-1)} disabled={acts.findIndex((act) => act.id === selectedActId) <= 0}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><div ref={stripRef} className="combat-act-selector-strip" onWheel={handleWheel}>{acts.map((act) => <button key={act.id} type="button" data-act-id={act.id} data-ui-sound="click" className={`combat-act-selector-item is-${act.status}${act.id === selectedActId ? ' is-selected' : ''}`} aria-current={act.id === selectedActId ? 'page' : undefined} aria-label={`${act.label}, ${act.title}, ${act.statusLabel}`} onClick={() => onSelect(act.id)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) } if (event.key === 'ArrowRight') { event.preventDefault(); move(1) } }}><span className="combat-act-selector-mark">{act.status === 'completed' ? <Check size={13} aria-hidden="true" /> : <i aria-hidden="true" />}</span><span className="combat-act-selector-copy"><strong>{act.label}</strong><small>{act.title}</small></span><em>{act.statusLabel}</em></button>)}</div><GameTooltip content={<TooltipContent title="Next Act" description="Select the next revealed campaign Act." />}><button type="button" className="combat-act-selector-arrow" aria-label="Next act" onClick={() => move(1)} disabled={acts.findIndex((act) => act.id === selectedActId) >= acts.length - 1}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip></div></section>
}
