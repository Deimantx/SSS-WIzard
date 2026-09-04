import { BookOpen, Compass, Sparkles, WandSparkles } from 'lucide-react'
import { useSyncExternalStore, type CSSProperties } from 'react'
import { getUiPreferences } from '../preferences/uiPreferencesStore'
import { getMilestones, removeMilestone, subscribeMilestones } from './milestoneStore'

const icons = { spell: WandSparkles, recipe: Sparkles, monster: Compass, school: BookOpen }

export function MilestoneBannerLayer() {
  const milestones = useSyncExternalStore(subscribeMilestones, getMilestones, getMilestones)
  const event = milestones[0]
  if (!event) return null
  const Icon = icons[event.kind]
  return <div className="milestone-layer" aria-live="polite"><div className={`milestone-banner milestone-${event.kind}`} role="status" style={{ '--milestone-accent': event.kind === 'monster' ? 'var(--ui-secondary)' : 'var(--ui-accent)' } as CSSProperties}>
    <Icon size={18} aria-hidden="true" /><div><span className="milestone-eyebrow">{event.eyebrow}</span><span className="milestone-title">{event.title}</span>{event.detail && <small>{event.detail}</small>}</div><button type="button" className="milestone-dismiss" aria-label="Dismiss milestone" onClick={() => removeMilestone(event.id)}>{getUiPreferences().reducedMotion ? '\u00d7' : '\u2726'}</button>
  </div></div>
}
