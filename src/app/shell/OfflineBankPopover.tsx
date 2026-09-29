import { Activity, Clock3, Hammer, Swords, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { Status } from '../../components/ui'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatCompactDuration, formatOfflineBank } from '../../game/utils'
import type { OfflineBankProgress } from '../../game/systems/offline-bank/offlineBankSimulation'
import { useGameStore } from '../../store/gameStore'
import { OFFLINE_BANK_SPEND_PRESETS as presets } from '../../game/systems/offline-bank/offlineBankDuration'
import { canAdvanceOfflineBank } from '../../game/systems/offline-bank/offlineBankSelectors'
import { useSampledGameReadModel } from './sampledGameReadModel'
import { useDeveloperToolsStore } from '../../devtools/developerToolsStore'

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
  const [errorKind, setErrorKind] = useState<import('../../persistence/saveDiagnosticsStore').SaveFailureKind | undefined>(undefined)
  const [position, setPosition] = useState({ top: 0, right: 16 })
  const bankMs = useGameStore((state) => state.offlineBankMs)
  const advance = useGameStore((state) => state.advanceWithOfflineBank)
  const lastOfflineBankReport = useGameStore((state) => state.lastOfflineBankReport)
  const activities = useSampledGameReadModel((state) => getActivityTelemetry(state), 250)
  const canAdvance = useSampledGameReadModel((state) => canAdvanceOfflineBank(state), 250)
  const sandboxActive = useDeveloperToolsStore().sandbox.active

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
    setErrorKind(undefined)
    setAdvancing(true)
    setProgress({ phase: 'simulating', simulatedMs: 0, totalMs: durationMs, percent: 0, realElapsedMs: 0 })
    setAdvancingDurationMs(durationMs)
    await waitForPaint()
    try {
      const result = await advance(durationMs, (nextProgress) => setProgress(nextProgress))
      if (!result.ok) { setError(result.error ?? 'Unable to advance Offline Bank.'); setErrorKind(result.saveKind) }
      else { setProgress(null); setAdvancingDurationMs(0) }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to advance Offline Bank.')
    } finally { setAdvancing(false) }
  }

  return <div className="offline-bank-popover" style={position} ref={panelRef} role="dialog" aria-label="Offline Bank">
    <div className="offline-bank-header"><div><span className="offline-bank-eyebrow"><Clock3 size={14} /> OFFLINE BANK</span><p>Stored time can advance live systems</p></div><button className="offline-bank-close icon-button" onClick={onClose} aria-label="Close Offline Bank"><X size={15} /></button></div>
    {sandboxActive && <div className="offline-sandbox-mode"><Status tone="warning">DEV SANDBOX · MEMORY-ONLY ADVANCE</Status><p>This simulated progress will not be written to the profile. Restore the snapshot to discard it.</p></div>}
    <div className="offline-bank-hero"><span className="offline-bank-section-label">BANKED TIME</span><strong>{formatOfflineBank(bankMs)}</strong><small>Available for simulation</small><div className="offline-bank-meter" aria-hidden="true"><i /></div></div>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ACTIVE SYSTEMS</span><small>{activities.length ? `${activities.length} running` : 'Standby'}</small></div>{activities.length ? <div className="offline-active-list">{activities.map((activity) => <div className={`offline-active-row accent-${activity.accent}`} key={activity.id}><span className="offline-activity-icon"><ActivityIcon activity={activity.label} /></span><span className="offline-active-copy"><strong>{activity.label}</strong><small>{activity.subtitle ?? activity.status}</small></span><em>{activity.status === 'running' ? 'ACTIVE' : activity.status.replace('-', ' ').toUpperCase()}</em></div>)}</div> : <div className="offline-empty-state"><strong>No active timed systems.</strong><span>Start an activity before spending Offline Bank time.</span></div>}</section>
    <section className="offline-bank-section"><div className="offline-bank-section-head"><span className="offline-bank-section-label">ADVANCE TIME</span><small>Spend deliberately</small></div>{!canAdvance && <div className="offline-no-work">Start an activity before spending Offline Bank time.</div>}<div className="offline-presets">{presets.map((preset) => { const disabled = advancing || bankMs < preset.ms || !canAdvance; const reason = !canAdvance ? 'Start an activity before spending Offline Bank time.' : 'Not enough Offline Bank time.'; const button = <button key={preset.ms} className="offline-preset" disabled={disabled} onClick={() => spend(preset.ms)} aria-label={`Advance ${preset.short}`}><strong>+{preset.label}</strong><small>Advance active systems</small></button>; return disabled && !advancing ? <GameTooltip key={preset.ms} block content={reason} accent="warning">{button}</GameTooltip> : button })}</div>{advancing && progress && <OfflineProgress progress={progress} durationMs={advancingDurationMs} />}</section>
    {error && <div className="offline-bank-error" role="alert"><strong>{errorKind === 'validation' ? 'OFFLINE ADVANCE BLOCKED BY SAVE VALIDATION' : 'OFFLINE ADVANCE NOT COMMITTED'}</strong><span>{error}</span><small>{errorKind === 'validation' ? 'No banked time or simulated progress was committed. Review Save Diagnostics before retrying.' : 'No Offline Bank time was spent. The live profile was rolled back.'}</small></div>}
    <div className="offline-bank-footnote"><span>Offline Bank is never spent automatically.</span><span>Simulation uses normal game rules.</span>{sandboxActive && <span>This simulated progress will not be written to the profile.</span>}{lastOfflineBankReport && <button type="button" className="offline-last-results" onClick={onViewLastResults}>View Last Results</button>}</div>
  </div>
}

function OfflineProgress({ progress, durationMs }: { progress: OfflineBankProgress; durationMs: number }) {
  const numericPercent = Math.max(0, Math.min(100, progress.percent))
  const percent = numericPercent > 0 && numericPercent < 1 ? '<1%' : `${Math.round(numericPercent)}%`
  const phase = progress.phase === 'preparing' ? 'PREPARING' : progress.phase === 'simulating' ? 'SIMULATING' : progress.phase === 'finalizing' ? 'FINALIZING' : 'SAVING'
  return <div className="offline-progress" role="status" aria-live="polite"><div className="offline-progress-head"><span>ADVANCING OFFLINE TIME</span><strong>{percent}</strong></div><div className="offline-progress-phase"><span>{phase}</span><i aria-hidden="true" /></div><div className="offline-progress-track" role="progressbar" aria-label="Offline Bank progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(numericPercent)}><span style={{ width: `${numericPercent}%` }} /></div>{progress.phase === 'simulating' && <small>{formatProgressDuration(progress.simulatedMs ?? durationMs * numericPercent / 100)} / {formatOfflineBank(durationMs)} simulated</small>}</div>
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
