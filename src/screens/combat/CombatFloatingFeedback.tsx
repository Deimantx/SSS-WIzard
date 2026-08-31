import { useEffect, useRef, useState } from 'react'

type FeedbackKind = 'damage' | 'heal' | 'barrier' | 'break'
type FeedbackItem = { id: number; kind: FeedbackKind; label: string }

let nextFeedbackId = 0

export function CombatFloatingFeedback({ actor, health, barrier, resetKey }: { actor: 'player' | 'enemy'; health: number; barrier: number; resetKey: string }) {
  const previous = useRef({ health, barrier, resetKey })
  const timers = useRef<number[]>([])
  const [items, setItems] = useState<FeedbackItem[]>([])

  useEffect(() => {
    previous.current = { health, barrier, resetKey }
    setItems([])
  }, [resetKey])

  useEffect(() => {
    const prior = previous.current
    const next: FeedbackItem[] = []
    const healthDelta = health - prior.health
    const barrierDelta = barrier - prior.barrier
    if (healthDelta <= -10) next.push({ id: ++nextFeedbackId, kind: 'damage', label: `−${Math.round(Math.abs(healthDelta)).toLocaleString()}` })
    if (healthDelta >= 5) next.push({ id: ++nextFeedbackId, kind: 'heal', label: `+${Math.round(healthDelta).toLocaleString()}` })
    if (barrierDelta >= 5) next.push({ id: ++nextFeedbackId, kind: 'barrier', label: `+${Math.round(barrierDelta).toLocaleString()} Barrier` })
    if (prior.barrier > 0 && barrier <= 0) next.push({ id: ++nextFeedbackId, kind: 'break', label: 'BARRIER BREAK' })
    previous.current = { health, barrier, resetKey }
    if (!next.length) return
    setItems((current) => [...current, ...next].slice(-6))
    next.forEach((item) => {
      const timer = window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id))
        timers.current = timers.current.filter((entry) => entry !== timer)
      }, 600)
      timers.current.push(timer)
    })
  }, [barrier, health, resetKey])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  if (!items.length) return null
  return <div className={`combat-floating-feedback combat-floating-feedback-${actor}`} aria-hidden="true">{items.map((item) => <span className={`combat-floating-feedback-item is-${item.kind}`} key={item.id}>{item.label}</span>)}</div>
}
