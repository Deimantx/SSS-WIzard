import { useSyncExternalStore, type CSSProperties } from 'react'
import { getGameFeelEvents, subscribeGameFeelEvents } from './gameFeelStore'
import type { GameFeelEvent } from './gameFeelTypes'

const sparkCount = (event: GameFeelEvent) => event.type === 'unlock' ? 10 : event.intensity && event.intensity > 1 ? 9 : 7

export function GameFeelLayer() {
  const events = useSyncExternalStore(subscribeGameFeelEvents, getGameFeelEvents, getGameFeelEvents)
  return <div className="game-feel-layer" aria-hidden="true">
    {events.map((event) => <Burst key={event.id} event={event} />)}
  </div>
}

function Burst({ event }: { event: GameFeelEvent }) {
  const count = sparkCount(event)
  const intensity = Math.max(0.8, Math.min(1.5, event.intensity ?? 1))
  return <div className={`game-feel-burst game-feel-${event.type}`} style={{ left: event.x, top: event.y, '--game-feel-color': event.color ?? 'var(--ui-accent)', '--game-feel-intensity': intensity } as CSSProperties}>
    <i className="game-feel-ring" />
    <span className="game-feel-sparks">{Array.from({ length: count }, (_, index) => { const angle = (index * (360 / count) - 90) * Math.PI / 180; const distance = 22 + (index % 3) * 7 * intensity; return <i key={index} className="game-feel-spark" style={{ '--game-feel-x': `${Math.cos(angle) * distance}px`, '--game-feel-y': `${Math.sin(angle) * distance}px`, '--game-feel-delay': `${(index % 3) * 12}ms` } as CSSProperties} /> })}</span>
  </div>
}
