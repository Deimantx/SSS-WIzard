import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function ToastStack() {
  const notifications = useGameStore((state) => state.notifications)
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  useEffect(() => {
    const timers = notifications.slice(-3).map((note) => {
      const duration = note.tone === 'warning' ? 4_800 : 3_300
      const elapsed = note.createdAt ? Math.max(0, Date.now() - note.createdAt) : 0
      return window.setTimeout(() => dismissNotification(note.id), Math.max(0, duration - elapsed))
    })
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [notifications, dismissNotification])
  return <div className="toast-stack">{notifications.slice(-3).reverse().map((note) => <div className={`toast ${note.tone}`} key={note.id}><span aria-hidden="true">{note.tone === 'success' ? '✦' : note.tone === 'warning' ? '!' : '·'}</span><div>{note.text}</div></div>)}</div>
}
