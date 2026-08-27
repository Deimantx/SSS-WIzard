import { Activity, Clock3, Hammer, Swords, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatOfflineBank } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { getTransmutationEchoesAssigned } from '../../game/systems/transmutation/transmutationSelectors'
import { getResearchEchoesAssigned } from '../../game/systems/research/researchSelectors'

const presets = [{ label: '1 MIN', short: '1m', ms: 60_000 }, { label: '5 MIN', short: '5m', ms: 300_000 }, { label: '15 MIN', short: '15m', ms: 900_000 }, { label: '1 HOUR', short: '1h', ms: 3_600_000 }]

export function OfflineBankPopover({ open, onClose, onViewLastResults }: { open: boolean; onClose: () => void; onViewLastResults: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [advancing, setAdvancing] = useState(false)
  const [advancingLabel, setAdvancingLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, right: 16 })
  const state = useGameStore()
  const bankMs = state.offlineBankMs
  const activities = getActivityTelemetry(state)
  const advance = state.advanceWithOfflineBank
  const meaningfulRecovery = state.combat.active && (Boolean(state.combat.enemyId) || state.player.health < state.player.maxHealth || state.combat.encounterTimerMs > 0)
  const canAdvance = getTransmutationEchoesAssigned(state) > 0 || getResearchEchoesAssigned(state) > 0 || meaningfulRecovery

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const anchor = document.querySelector('.offline-bank-trigger')?.getBoundingClientRect()
      if (!anchor) return
      const panel = panelRef.current?.getBoundingClientRect()
      const width = panel?.width ?? 380
      const height = panel?.height ?? 540
      const right = Math.max(12, Math.min(window.innerWidth - width - 12, window.innerWidth - anchor.right))
      const below = anchor.bottom + 9
      const top = below + height <= window.innerHeight - 12 ? below : Math.max(12, anchor.top - height - 9)
      setPosition({ top, right })
    }
    updatePosition()
    const frame = window.requestAnimationFrame(updatePosition)
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    const onPointerDown = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!panelRef.current?.contains(target) && !target.closest('.offline-bank-trigger')) onClose() }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('mousedown', onPointerDown); window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true) }
  }, [open, onClose, activities.length])

  if (!open) return null

  const spend = async (durationMs: number, label: string) => {
    setError(null)
    setAdvancing(true)
    setAdvancingLabel(label)
    try {
      const result = await advance(durationMs)
      if (!result.ok) setError(result.error ?? 'Unable to advance Offline Bank.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to advance Offline Bank.')
    } finally {
      setAdvancing(false)
      setAdvancingLabel('')
    }
  }

  return <div className="offline-bank-popover" style={position} ref={panelRef} role="dialog" aria-label="Offline Bank">
    <div className="offline-bank-header"><div><span className="offline-bank-eyebrow"><Clock3 size={14} /> OFFLINE BANK</span><p>Stored time can advance live systems</p></div><button className="offline-bank-close icon-button" onClick={onClose} aria-label="Close Offline Bank"><X size={15} /></button></div>
    <div className="offline-bank-hero"><span className="offline-bank-section-label">BANKED TIME</span><strong>{formatOfflineBank(bankMs)}</strong><small>Available for simulation</small><div className="offline-bank-meter" aria-hidden="true"><i /></div></div>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ACTIVE SYSTEMS</span><small>{activities.length ? `${activities.length} running` : 'Standby'}</small></div>{activities.length ? <div className="offline-active-list">{activities.map((activity) => <div className={`offline-active-row accent-${activity.accent}`} key={activity.id}><span className="offline-activity-icon"><ActivityIcon activity={activity.label} /></span><span className="offline-active-copy"><strong>{activity.label}</strong><small>{activity.subtitle ?? activity.status}</small></span><em>{activity.status === 'running' ? 'ACTIVE' : activity.status.replace('-', ' ').toUpperCase()}</em></div>)}</div> : <div className="offline-empty-state"><strong>No active timed systems.</strong><span>Start an activity before spending Offline Bank time.</span></div>}</section>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ADVANCE TIME</span><small>Spend deliberately</small></div>{!canAdvance && <div className="offline-no-work">Start an activity before spending Offline Bank time.</div>}<div className="offline-presets">{presets.map((preset) => { const disabled = advancing || bankMs < preset.ms || !canAdvance; const reason = !canAdvance ? 'Start an activity before spending Offline Bank time.' : 'Not enough Offline Bank time.'; const button = <button key={preset.ms} className="offline-preset" disabled={disabled} onClick={() => spend(preset.ms, preset.label)} aria-label={`Advance ${preset.short}`}><strong>+{preset.label}</strong><small>Advance active systems</small></button>; return disabled && !advancing ? <GameTooltip key={preset.ms} block content={reason} accent="warning">{button}</GameTooltip> : button })}</div>{advancing && <div className="offline-advancing" role="status"><span>ADVANCING {advancingLabel}...</span><i /></div>}</section>
    {error && <div className="offline-bank-error" role="alert">{error}</div>}
    <div className="offline-bank-footnote"><span>Offline Bank is never spent automatically.</span><span>Simulation uses normal game rules.</span>{state.lastOfflineBankReport && <button type="button" className="offline-last-results" onClick={onViewLastResults}>View Last Results</button>}</div>
  </div>
}

function ActivityIcon({ activity }: { activity: string }) {
  if (activity === 'COMBAT') return <Swords size={15} />
  if (activity === 'TRANSMUTATION') return <Hammer size={15} />
  return <Activity size={15} />
}
