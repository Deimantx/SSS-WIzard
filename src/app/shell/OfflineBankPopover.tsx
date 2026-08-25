import { useEffect, useRef, useState } from 'react'
import { Clock3, X } from 'lucide-react'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatOfflineBank } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'

const presets = [{ label: '1m', ms: 60_000 }, { label: '5m', ms: 300_000 }, { label: '15m', ms: 900_000 }, { label: '1h', ms: 3_600_000 }]

export function OfflineBankPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [advancing, setAdvancing] = useState(false)
  const [advancingLabel, setAdvancingLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, right: 16 })
  const state = useGameStore()
  const bankMs = state.offlineBankMs
  const activities = getActivityTelemetry(state)
  const advance = state.advanceWithOfflineBank

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const anchor = document.querySelector('.offline-bank-trigger')?.getBoundingClientRect()
      if (!anchor) return
      setPosition({ top: anchor.bottom + 8, right: Math.max(12, window.innerWidth - anchor.right) })
    }
    updatePosition()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    const onPointerDown = (event: MouseEvent) => { const target = event.target as HTMLElement; if (!panelRef.current?.contains(target) && !target.closest('.offline-bank-trigger')) onClose() }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('mousedown', onPointerDown); window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true) }
  }, [open, onClose])

  if (!open) return null

  const spend = async (durationMs: number) => {
    setError(null)
    setAdvancing(true)
    setAdvancingLabel(`${durationMs / 60_000 >= 60 ? '1h' : `${durationMs / 60_000}m`}`)
    const result = await advance(durationMs)
    setAdvancing(false)
    setAdvancingLabel('')
    if (!result.ok) setError(result.error ?? 'Unable to advance Offline Bank.')
  }

  return <div className="offline-bank-popover" style={position} ref={panelRef} role="dialog" aria-label="Offline Bank">
    <div className="offline-bank-header"><div><span className="offline-bank-eyebrow"><Clock3 size={13} /> OFFLINE BANK</span><strong>{formatOfflineBank(bankMs)} banked</strong></div><button className="offline-bank-close" onClick={onClose} aria-label="Close Offline Bank"><X size={15} /></button></div>
    <p className="offline-bank-copy">Spend banked time to advance your currently active systems. No time is spent automatically.</p>
    <div className="offline-bank-section"><small>ACTIVE SYSTEMS</small>{activities.length ? <div className="offline-active-list">{activities.map((activity) => <span key={activity.id}><i className={activity.accent} />{activity.label} · {activity.subtitle ?? activity.status}</span>)}</div> : <span className="offline-empty">No timed systems are active.</span>}</div>
    <div className="offline-bank-section"><small>ADVANCE TIME</small><div className="offline-presets">{presets.map((preset) => <button key={preset.ms} className="offline-preset" disabled={advancing || bankMs < preset.ms} onClick={() => spend(preset.ms)}>{advancing ? '…' : preset.label}</button>)}</div></div>
    {advancing && <div className="offline-advancing" role="status">Advancing {advancingLabel}…</div>}
    {error && <div className="offline-bank-error" role="alert">{error}</div>}
    <small className="offline-bank-footnote">Time is consumed from the Offline Bank and uses the normal simulation.</small>
  </div>
}
