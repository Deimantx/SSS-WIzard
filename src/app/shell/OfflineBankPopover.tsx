import { Activity, Clock3, Hammer, Swords, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatCompactDuration, formatOfflineBank } from '../../game/utils'
import type { OfflineBankProgress } from '../../game/systems/offline-bank/offlineBankSimulation'
import { useGameStore } from '../../store/gameStore'
import { getTransmutationAcolytesAssigned } from '../../game/systems/transmutation/transmutationSelectors'
import { getResearchAcolytesAssigned } from '../../game/systems/research/researchSelectors'
import { useSampledGameReadModel } from './sampledGameReadModel'

const presets = [{ label: '1 MIN', short: '1m', ms: 60_000 }, { label: '5 MIN', short: '5m', ms: 300_000 }, { label: '15 MIN', short: '15m', ms: 900_000 }, { label: '1 HOUR', short: '1h', ms: 3_600_000 }]

type OfflineBankPopoverProps = { open: boolean; onClose: () => void; onViewLastResults: () => void }

export function OfflineBankPopover({ open, onClose, onViewLastResults }: OfflineBankPopoverProps) {
  if (!open) return null
  return <OpenOfflineBankPopover onClose={onClose} onViewLastResults={onViewLastResults} />
}

function OpenOfflineBankPopover({ onClose, onViewLastResults }: Omit<OfflineBankPopoverProps, 'open'>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [advancing, setAdvancing] = useState(false)
  const [progress, setProgress] = useState<OfflineBankProgress | null>(null)
  const [advancingDurationMs, setAdvancingDurationMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, right: 16 })
  const bankMs = useGameStore((state) => state.offlineBankMs)
  const advance = useGameStore((state) => state.advanceWithOfflineBank)
  const lastOfflineBankReport = useGameStore((state) => state.lastOfflineBankReport)
  const activities = useSampledGameReadModel((state) => getActivityTelemetry(state), 250)
  const canAdvance = useSampledGameReadModel((state) => {
    const meaningfulRecovery = state.combat.active && (Boolean(state.combat.enemyId) || state.player.health < state.player.maxHealth || state.combat.encounterTimerMs > 0)
    return getTransmutationAcolytesAssigned(state) > 0 || getResearchAcolytesAssigned(state) > 0 || meaningfulRecovery
  }, 250)

  useEffect(() => {
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
  }, [onClose, activities.length])

  const spend = async (durationMs: number) => {
    setError(null)
    setAdvancing(true)
    setProgress({ phase: 'simulating', percent: 0 })
    setAdvancingDurationMs(durationMs)
    await waitForPaint()
    try {
      const result = await advance(durationMs, (nextProgress) => setProgress(nextProgress))
      if (!result.ok) setError(result.error ?? 'Unable to advance Offline Bank.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to advance Offline Bank.')
    } finally {
      setAdvancing(false)
      setProgress(null)
      setAdvancingDurationMs(0)
    }
  }

  return <div className="offline-bank-popover" style={position} ref={panelRef} role="dialog" aria-label="Offline Bank">
    <div className="offline-bank-header"><div><span className="offline-bank-eyebrow"><Clock3 size={14} /> OFFLINE BANK</span><p>Stored time can advance live systems</p></div><button className="offline-bank-close icon-button" onClick={onClose} aria-label="Close Offline Bank"><X size={15} /></button></div>
    <div className="offline-bank-hero"><span className="offline-bank-section-label">BANKED TIME</span><strong>{formatOfflineBank(bankMs)}</strong><small>Available for simulation</small><div className="offline-bank-meter" aria-hidden="true"><i /></div></div>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ACTIVE SYSTEMS</span><small>{activities.length ? `${activities.length} running` : 'Standby'}</small></div>{activities.length ? <div className="offline-active-list">{activities.map((activity) => <div className={`offline-active-row accent-${activity.accent}`} key={activity.id}><span className="offline-activity-icon"><ActivityIcon activity={activity.label} /></span><span className="offline-active-copy"><strong>{activity.label}</strong><small>{activity.subtitle ?? activity.status}</small></span><em>{activity.status === 'running' ? 'ACTIVE' : activity.status.replace('-', ' ').toUpperCase()}</em></div>)}</div> : <div className="offline-empty-state"><strong>No active timed systems.</strong><span>Start an activity before spending Offline Bank time.</span></div>}</section>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ADVANCE TIME</span><small>Spend deliberately</small></div>{!canAdvance && <div className="offline-no-work">Start an activity before spending Offline Bank time.</div>}<div className="offline-presets">{presets.map((preset) => { const disabled = advancing || bankMs < preset.ms || !canAdvance; const reason = !canAdvance ? 'Start an activity before spending Offline Bank time.' : 'Not enough Offline Bank time.'; const button = <button key={preset.ms} className="offline-preset" disabled={disabled} onClick={() => spend(preset.ms)} aria-label={`Advance ${preset.short}`}><strong>+{preset.label}</strong><small>Advance active systems</small></button>; return disabled && !advancing ? <GameTooltip key={preset.ms} block content={reason} accent="warning">{button}</GameTooltip> : button })}</div>{advancing && progress && <OfflineProgress progress={progress} durationMs={advancingDurationMs} />}</section>
    {error && <div className="offline-bank-error" role="alert">{error}</div>}
    <div className="offline-bank-footnote"><span>Offline Bank is never spent automatically.</span><span>Simulation uses normal game rules.</span>{lastOfflineBankReport && <button type="button" className="offline-last-results" onClick={onViewLastResults}>View Last Results</button>}</div>
  </div>
}

function OfflineProgress({ progress, durationMs }: { progress: OfflineBankProgress; durationMs: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)))
  const phase = progress.phase === 'simulating' ? 'SIMULATING' : progress.phase === 'finalizing' ? 'FINALIZING' : 'SAVING'
  return <div className="offline-progress" role="status" aria-live="polite"><div className="offline-progress-head"><span>ADVANCING OFFLINE TIME</span><strong>{percent}%</strong></div><div className="offline-progress-phase"><span>{phase}</span><i aria-hidden="true" /></div><div className="offline-progress-track" role="progressbar" aria-label="Offline Bank progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>{progress.phase === 'simulating' && <small>{formatProgressDuration(durationMs * progress.percent / 100)} / {formatOfflineBank(durationMs)} simulated</small>}</div>
}

const formatProgressDuration = (ms: number) => ms <= 0 ? '0s' : formatCompactDuration(ms)

const waitForPaint = () => new Promise<void>((resolve) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => resolve())
  else setTimeout(resolve, 0)
})

function ActivityIcon({ activity }: { activity: string }) {
  if (activity === 'COMBAT') return <Swords size={15} />
  if (activity === 'TRANSMUTATION') return <Hammer size={15} />
  return <Activity size={15} />
}
