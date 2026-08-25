import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'

export function ToastStack() {
  const notifications = useGameStore((state) => state.notifications)
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  useEffect(() => {
    const timeout = window.setTimeout(() => { if (notifications[0]) dismissNotification(notifications[0].id) }, 5000)
    return () => window.clearTimeout(timeout)
  }, [notifications, dismissNotification])
  return <div className="toast-stack">{notifications.map((note) => <div className={`toast ${note.tone}`} key={note.id}><span>{note.tone === 'success' ? '✦' : note.tone === 'warning' ? '!' : '·'}</span><div>{note.text}</div><button onClick={() => dismissNotification(note.id)} aria-label="Dismiss notification"><X size={13} /></button></div>)}</div>
}

