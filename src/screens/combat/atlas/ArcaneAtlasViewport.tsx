import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

interface AtlasStageSize {
  width: number
  height: number
}

interface AtlasBounds {
  left: number
  right: number
  top: number
  bottom: number
}

interface PanBounds {
  x: { min: number; max: number }
  y: { min: number; max: number }
}

const FIT_PADDING = 28

const getFitScale = (viewport: AtlasStageSize, stage: AtlasStageSize) => {
  if (viewport.width <= 0 || viewport.height <= 0) return 1
  return Math.max(0.1, Math.min((viewport.width - FIT_PADDING * 2) / stage.width, (viewport.height - FIT_PADDING * 2) / stage.height))
}

const getPanBounds = (viewport: AtlasStageSize, stage: AtlasStageSize, scale: number, contentBounds: AtlasBounds | undefined, pannable: boolean): PanBounds => {
  if (!pannable || viewport.width <= 0 || viewport.height <= 0) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }
  const bounds = contentBounds ?? { left: 0, right: stage.width, top: 0, bottom: stage.height }
  const baseLeft = viewport.width / 2 + (bounds.left - stage.width / 2) * scale
  const baseRight = viewport.width / 2 + (bounds.right - stage.width / 2) * scale
  const baseTop = viewport.height / 2 + (bounds.top - stage.height / 2) * scale
  const baseBottom = viewport.height / 2 + (bounds.bottom - stage.height / 2) * scale
  const x = { min: FIT_PADDING - baseLeft, max: viewport.width - FIT_PADDING - baseRight }
  const y = { min: FIT_PADDING - baseTop, max: viewport.height - FIT_PADDING - baseBottom }
  return {
    x: x.min <= x.max ? x : { min: 0, max: 0 },
    y: y.min <= y.max ? y : { min: 0, max: 0 },
  }
}

export function ArcaneAtlasViewport({ stage, contentBounds, panMode = 'none', ariaLabel, className = '', children }: { stage: AtlasStageSize; contentBounds?: AtlasBounds; panMode?: 'none' | 'bounded'; ariaLabel: string; className?: string; children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<AtlasStageSize>({ width: 0, height: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const scale = useMemo(() => getFitScale(viewport, stage), [stage, viewport])
  const panBounds = useMemo(() => getPanBounds(viewport, stage, scale, contentBounds, panMode === 'bounded'), [contentBounds, panMode, scale, stage, viewport])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setViewport((current) => current.width === width && current.height === height ? current : { width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setPan((current) => {
      const next = {
        x: Math.max(panBounds.x.min, Math.min(panBounds.x.max, current.x)),
        y: Math.max(panBounds.y.min, Math.min(panBounds.y.max, current.y)),
      }
      return next.x === current.x && next.y === current.y ? current : next
    })
  }, [panBounds])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panMode === 'none' || (event.pointerType === 'mouse' && event.button !== 0)) return
    if ((event.target as HTMLElement).closest('[data-atlas-interactive="true"]')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return
    setDragging(true)
    setPan({
      x: Math.max(panBounds.x.min, Math.min(panBounds.x.max, drag.originX + deltaX)),
      y: Math.max(panBounds.y.min, Math.min(panBounds.y.max, drag.originY + deltaY)),
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const stageStyle = {
    width: `${stage.width}px`,
    height: `${stage.height}px`,
    transform: `translate3d(calc(-50% + ${pan.x / scale}px), calc(-50% + ${pan.y / scale}px), 0) scale(${scale})`,
  } as CSSProperties

  return <div ref={viewportRef} className={`arcane-atlas-viewport is-${panMode}${dragging ? ' is-dragging' : ''} ${className}`.trim()} aria-label={ariaLabel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onDragStart={(event) => event.preventDefault()}><div className="arcane-atlas-ambient arcane-atlas-ambient-one" aria-hidden="true" /><div className="arcane-atlas-ambient arcane-atlas-ambient-two" aria-hidden="true" /><div className="arcane-atlas-stage" style={stageStyle}>{children}</div></div>
}
