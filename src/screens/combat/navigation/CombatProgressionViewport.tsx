import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent } from 'react'

interface StageSize { width: number; height: number }
export interface ProgressionBounds { left: number; right: number; top: number; bottom: number }
interface PanBounds { x: { min: number; max: number }; y: { min: number; max: number } }
interface ViewTransform { x: number; y: number; scale: number }

export const MIN_ZOOM = 0.65
export const MAX_ZOOM = 1.6
export const DEFAULT_ZOOM = 1
const PAN_THRESHOLD = 5
const FIT_PADDING_RATIO = 0.12

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const getViewportPadding = (viewport: StageSize) => Math.max(24, Math.min(72, Math.min(viewport.width, viewport.height) * FIT_PADDING_RATIO))

const getPanBounds = (viewport: StageSize, scale: number, contentBounds: ProgressionBounds): PanBounds => {
  if (viewport.width <= 0 || viewport.height <= 0) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }
  const padding = getViewportPadding(viewport)
  return {
    x: { min: padding - contentBounds.right * scale, max: viewport.width - padding - contentBounds.left * scale },
    y: { min: padding - contentBounds.bottom * scale, max: viewport.height - padding - contentBounds.top * scale },
  }
}

const clampTransform = (transform: ViewTransform, viewport: StageSize, contentBounds: ProgressionBounds): ViewTransform => {
  const bounds = getPanBounds(viewport, transform.scale, contentBounds)
  return { ...transform, x: clamp(transform.x, bounds.x.min, bounds.x.max), y: clamp(transform.y, bounds.y.min, bounds.y.max) }
}

const getFitTransform = (viewport: StageSize, contentBounds: ProgressionBounds): ViewTransform => {
  if (viewport.width <= 0 || viewport.height <= 0) return { x: 0, y: 0, scale: DEFAULT_ZOOM }
  const padding = getViewportPadding(viewport)
  const contentWidth = Math.max(1, contentBounds.right - contentBounds.left)
  const contentHeight = Math.max(1, contentBounds.bottom - contentBounds.top)
  const scale = clamp(Math.min((viewport.width - padding * 2) / contentWidth, (viewport.height - padding * 2) / contentHeight), MIN_ZOOM, MAX_ZOOM)
  return clampTransform({ scale, x: viewport.width / 2 - ((contentBounds.left + contentBounds.right) / 2) * scale, y: viewport.height / 2 - ((contentBounds.top + contentBounds.bottom) / 2) * scale }, viewport, contentBounds)
}

export function CombatProgressionViewport({ stage, contentBounds, resetKey, ariaLabel, children }: { stage: StageSize; contentBounds: ProgressionBounds; resetKey: string; ariaLabel: string; children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const transformRef = useRef<ViewTransform>({ x: 0, y: 0, scale: DEFAULT_ZOOM })
  const pendingTransformRef = useRef<ViewTransform | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const layoutKeyRef = useRef('')
  const [viewport, setViewport] = useState<StageSize>({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const layoutKey = useMemo(() => `${resetKey}:${viewport.width}:${viewport.height}:${contentBounds.left}:${contentBounds.right}:${contentBounds.top}:${contentBounds.bottom}`, [contentBounds.bottom, contentBounds.left, contentBounds.right, contentBounds.top, resetKey, viewport.height, viewport.width])
  const applyStageTransform = useCallback((next: ViewTransform) => {
    const safe = clampTransform(next, viewport, contentBounds)
    transformRef.current = safe
    pendingTransformRef.current = null
    const stageElement = stageRef.current
    if (stageElement) stageElement.style.transform = `translate3d(${safe.x}px, ${safe.y}px, 0) scale(${safe.scale})`
    return safe
  }, [contentBounds, viewport])
  const scheduleStageTransform = useCallback((next: ViewTransform) => {
    const safe = clampTransform(next, viewport, contentBounds)
    transformRef.current = safe
    pendingTransformRef.current = safe
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      applyStageTransform(safe)
      return
    }
    if (animationFrameRef.current !== null) return
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null
      const pending = pendingTransformRef.current
      pendingTransformRef.current = null
      if (pending) applyStageTransform(pending)
    })
  }, [applyStageTransform, contentBounds, viewport])

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

  useEffect(() => {
    if (!viewport.width || !viewport.height || layoutKeyRef.current === layoutKey) return
    layoutKeyRef.current = layoutKey
    applyStageTransform(getFitTransform(viewport, contentBounds))
    setDragging(false)
    dragRef.current = null
  }, [applyStageTransform, contentBounds, layoutKey, viewport])

  useEffect(() => {
    applyStageTransform(transformRef.current)
  }, [applyStageTransform])

  useEffect(() => () => {
    if (animationFrameRef.current !== null && typeof window !== 'undefined') window.cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
    pendingTransformRef.current = null
  }, [])

  const fitView = useCallback(() => applyStageTransform(getFitTransform(viewport, contentBounds)), [applyStageTransform, contentBounds, viewport])
  const zoomAt = useCallback((factor: number, focalX: number, focalY: number) => {
    const current = transformRef.current
    const nextScale = clamp(current.scale * factor, MIN_ZOOM, MAX_ZOOM)
    if (nextScale === current.scale) return false
    const worldX = (focalX - current.x) / current.scale
    const worldY = (focalY - current.y) / current.scale
    applyStageTransform({ scale: nextScale, x: focalX - worldX * nextScale, y: focalY - worldY * nextScale })
    return true
  }, [applyStageTransform])

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const consumed = zoomAt(Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top)
    if (consumed) event.preventDefault()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(1.1, rect.width / 2, rect.height / 2) }
    if (event.key === '-') { event.preventDefault(); zoomAt(1 / 1.1, rect.width / 2, rect.height / 2) }
    if (event.key === '0') { event.preventDefault(); fitView() }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as HTMLElement).closest('[data-combat-progression-interactive="true"]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const current = transformRef.current
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: current.x, originY: current.y }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (!dragging && Math.abs(deltaX) < PAN_THRESHOLD && Math.abs(deltaY) < PAN_THRESHOLD) return
    event.preventDefault()
    if (!dragging) setDragging(true)
    scheduleStageTransform({ ...transformRef.current, x: drag.originX + deltaX, y: drag.originY + deltaY })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    applyStageTransform(transformRef.current)
    setDragging(false)
  }

  const stageStyle = { width: `${stage.width}px`, height: `${stage.height}px` } as CSSProperties
  return <div ref={viewportRef} className={`combat-progression-viewport${dragging ? ' is-dragging' : ''}`} tabIndex={0} aria-label={ariaLabel} onWheel={handleWheel} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onDragStart={(event) => event.preventDefault()}><div className="combat-progression-ambient combat-progression-ambient-one" aria-hidden="true" /><div className="combat-progression-ambient combat-progression-ambient-two" aria-hidden="true" /><div ref={stageRef} className="combat-progression-stage" style={stageStyle}>{children}</div></div>
}
