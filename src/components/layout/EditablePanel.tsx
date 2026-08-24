import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const DEFAULT_LAYOUT = { x: 0, y: 0, width: 100, height: 100 }

export function EditablePanel({ screen, panelId, children }: { screen: ScreenId; panelId: string; children: ReactNode }) {
  const editMode = useGameStore((state) => state.ui.editMode)
  const layout = useGameStore((state) => state.ui.layouts[screen]?.[panelId] ?? DEFAULT_LAYOUT)
  const setLayout = useGameStore((state) => state.setLayout)
  const start = useRef<{ x: number; y: number; pointerX: number; pointerY: number; width: number; height: number; resizing: boolean } | null>(null)
  if (!editMode || (typeof window !== 'undefined' && window.innerWidth < 760)) return <>{children}</>
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const resizing = Boolean((event.target as HTMLElement).closest('.editable-resize'))
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { x: layout.x, y: layout.y, pointerX: event.clientX, pointerY: event.clientY, width: layout.width, height: layout.height, resizing }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    if (start.current.resizing) setLayout(screen, panelId, { ...layout, width: Math.max(55, Math.min(100, start.current.width + (event.clientX - start.current.pointerX) / 8)), height: Math.max(100, start.current.height + event.clientY - start.current.pointerY) })
    else setLayout(screen, panelId, { ...layout, x: Math.max(-20, start.current.x + event.clientX - start.current.pointerX), y: Math.max(0, start.current.y + event.clientY - start.current.pointerY) })
  }
  const onPointerUp = () => { start.current = null }
  return <div className="editable-panel" style={{ transform: `translate(${layout.x}px, ${layout.y}px)`, width: `${layout.width}%`, minHeight: layout.height > 100 ? `${layout.height}px` : undefined }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><div className="editable-label">DRAG PANEL · {panelId}</div>{children}<span className="editable-resize" title="Resize panel" /></div>
}
