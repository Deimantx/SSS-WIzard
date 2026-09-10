import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

interface StageSize { width: number; height: number }
export interface ProgressionBounds { left: number; right: number; top: number; bottom: number }
interface PanBounds { x: { min: number; max: number }; y: { min: number; max: number } }

const FIT_PADDING = 28
const PAN_THRESHOLD = 5

const getFitScale = (viewport: StageSize, stage: StageSize) => {
  if (viewport.width <= 0 || viewport.height <= 0) return 1
  return Math.max(0.1, Math.min((viewport.width - FIT_PADDING * 2) / stage.width, (viewport.height - FIT_PADDING * 2) / stage.height))
}

const getPanBounds = (viewport: StageSize, stage: StageSize, scale: number, contentBounds: ProgressionBounds): PanBounds => {
  if (viewport.width <= 0 || viewport.height <= 0) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }
  const baseLeft = viewport.width / 2 + (contentBounds.left - stage.width / 2) * scale
  const baseRight = viewport.width / 2 + (contentBounds.right - stage.width / 2) * scale
  const baseTop = viewport.height / 2 + (contentBounds.top - stage.height / 2) * scale
  const baseBottom = viewport.height / 2 + (contentBounds.bottom - stage.height / 2) * scale
  const xLower = FIT_PADDING - baseLeft
  const xUpper = viewport.width - FIT_PADDING - baseRight
  const yLower = FIT_PADDING - baseTop
  const yUpper = viewport.height - FIT_PADDING - baseBottom
  return { x: { min: Math.min(xLower, xUpper), max: Math.max(xLower, xUpper) }, y: { min: Math.min(yLower, yUpper), max: Math.max(yLower, yUpper) } }
}

export function CombatProgressionViewport({ stage, contentBounds, resetKey, ariaLabel, children }: { stage: StageSize; contentBounds: ProgressionBounds; resetKey: string; ariaLabel: string; children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [viewport, setViewport] = useState<StageSize>({ width: 0, height: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const fitScale = useMemo(() => getFitScale(viewport, stage), [stage, viewport])
  const scale = Math.max(0.55, Math.min(1, fitScale * 1.08))
  const panBounds = useMemo(() => getPanBounds(viewport, stage, scale, contentBounds), [contentBounds, scale, stage, viewport])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setViewport((current) => current.width === width && current.height === height ? current : { width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => { setPan({ x: 0, y: 0 }); setDragging(false); dragRef.current = null }, [resetKey])
  useEffect(() => {
    setPan((current) => {
      const x = Math.max(panBounds.x.min, Math.min(panBounds.x.max, current.x))
      const y = Math.max(panBounds.y.min, Math.min(panBounds.y.max, current.y))
      return x === current.x && y === current.y ? current : { x, y }
    })
  }, [panBounds])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as HTMLElement).closest('[data-combat-progression-interactive="true"]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y }
  }
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (!dragging && Math.abs(deltaX) < PAN_THRESHOLD && Math.abs(deltaY) < PAN_THRESHOLD) return
    event.preventDefault()
    setDragging(true)
    setPan({ x: Math.max(panBounds.x.min, Math.min(panBounds.x.max, drag.originX + deltaX)), y: Math.max(panBounds.y.min, Math.min(panBounds.y.max, drag.originY + deltaY)) })
  }
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const stageStyle = { width: `${stage.width}px`, height: `${stage.height}px`, transform: `translate3d(calc(-50% + ${pan.x / scale}px), calc(-50% + ${pan.y / scale}px), 0) scale(${scale})` } as CSSProperties
  return <div ref={viewportRef} className={`combat-progression-viewport${dragging ? ' is-dragging' : ''}`} aria-label={ariaLabel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onDragStart={(event) => event.preventDefault()}><div className="combat-progression-ambient combat-progression-ambient-one" aria-hidden="true" /><div className="combat-progression-ambient combat-progression-ambient-two" aria-hidden="true" /><div className="combat-progression-stage" style={stageStyle}>{children}</div></div>
}
