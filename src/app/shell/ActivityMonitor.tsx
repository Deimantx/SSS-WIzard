import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatCompactDuration } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import type { ActivityTelemetry } from '../../game/types'

const collapsedStorageKey = 'sss-wizard.activity-monitor-collapsed'

const summaryFor = (activity: ActivityTelemetry) => activity.collapsedSummary ?? (activity.remainingMs === undefined ? activity.status.toUpperCase() : formatCompactDuration(activity.remainingMs))

export function ActivityMonitor() {
  const state = useGameStore()
  const activities = getActivityTelemetry(state)
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem(collapsedStorageKey) === 'true' } catch { return false }
  })
  const setScreen = useGameStore((current) => current.setScreen)

  useEffect(() => {
    try { window.localStorage.setItem(collapsedStorageKey, String(collapsed)) } catch { /* storage is optional */ }
  }, [collapsed])

  if (!activities.length) return null
  if (collapsed) {
    return <aside className="activity-monitor activity-monitor-collapsed" aria-label="Activity Monitor">
      <div className="activity-monitor-collapsed-head"><strong>{activities.length} ACTIVE</strong><button onClick={() => setCollapsed(false)} aria-label="Expand Activity Monitor"><ChevronUp size={14} /></button></div>
      <div className="activity-monitor-mini-list">
        {activities.slice(0, 2).map((activity) => <button className={`activity-mini-summary accent-${activity.accent}`} key={activity.id} onClick={() => setScreen(activity.screen)}><strong>{activity.label}</strong><span>{summaryFor(activity)}</span></button>)}
      </div>
      {activities.length > 2 && <small className="activity-monitor-more">+{activities.length - 2} more active</small>}
    </aside>
  }

  return <aside className="activity-monitor" aria-label="Activity Monitor">
    <div className="activity-monitor-header"><span>ACTIVITY MONITOR · {activities.length} ACTIVE</span><button onClick={() => setCollapsed(true)} aria-label="Collapse Activity Monitor"><ChevronDown size={14} /></button></div>
    <div className="activity-monitor-track">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} onClick={() => setScreen(activity.screen)} />)}</div>
  </aside>
}

function ActivityCard({ activity, onClick }: { activity: ActivityTelemetry; onClick: () => void }) {
  const statusLabel = activity.status === 'waiting-mana' ? 'WAITING FOR MANA' : activity.status === 'waiting-materials' ? 'WAITING FOR MATERIALS' : activity.status === 'recovery' ? 'NEXT ENCOUNTER' : activity.status.toUpperCase()
  const progressLabel = activity.id === 'combat' ? 'Enemy HP' : activity.remainingMs === undefined ? '' : formatCompactDuration(activity.remainingMs)
  return <button className={`activity-card accent-${activity.accent} ${activity.status === 'waiting-mana' || activity.status === 'waiting-materials' ? 'activity-waiting' : ''}`} onClick={onClick} aria-label={`Open ${activity.label} activity`}>
    <div className="activity-card-head"><div><strong>{activity.label}</strong><span>{activity.subtitle}</span></div><small>{statusLabel}</small></div>
    {activity.bars?.length ? <div className="activity-bars">{activity.bars.map((bar) => <div className={`activity-bar-row ${bar.tone ?? 'neutral'}`} key={bar.label}><div className="activity-bar-label"><span>{bar.label}</span><b>{bar.value}</b></div><div className="activity-progress"><i style={{ width: `${Math.max(0, Math.min(100, bar.percent))}%` }} /></div></div>)}</div> : activity.progressPercent !== undefined && <div className="activity-progress-row"><div className="activity-progress"><i style={{ width: `${Math.max(0, Math.min(100, activity.progressPercent))}%` }} /></div><span>{progressLabel}</span></div>}
    <div className="activity-card-metrics">{activity.metrics.map((item, index) => <span className={item.tone ?? 'neutral'} key={`${item.label}-${index}`}><small>{item.label}</small><b>{item.value}</b></span>)}</div>
  </button>
}
