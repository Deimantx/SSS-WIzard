import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { getArcaneCoreRingRadius } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import type { ArcaneCoreRingIndex } from '../../game/types'

export type ArcaneCoreCameraMode = 'progression' | 'all' | 'manual'
export type ArcaneCoreViewportSize = { width: number; height: number }
export type ArcaneCoreCamera = { x: number; y: number; zoom: number }

export const ARCANE_CORE_MIN_ZOOM = .14
export const ARCANE_CORE_MAX_ZOOM = 1.2
export const ARCANE_CORE_DRAG_THRESHOLD = 6
export const ARCANE_CORE_NODE_MARGIN = 150

const getViewportDimensions = (viewport: ArcaneCoreViewportSize) => ({
  width: viewport.width || 720,
  height: viewport.height || 520,
})

export const clampCameraOffset = (offset: Pick<ArcaneCoreCamera, 'x' | 'y'>, zoom: number, viewport: ArcaneCoreViewportSize) => {
  const { width, height } = getViewportDimensions(viewport)
  const extent = (getArcaneCoreRingRadius(8) + ARCANE_CORE_NODE_MARGIN) * zoom
  const maxX = Math.max(0, extent - width / 2 + 24)
  const maxY = Math.max(0, extent - height / 2 + 24)
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}

export const getArcaneCoreFitZoom = (viewport: ArcaneCoreViewportSize, targetRing: ArcaneCoreRingIndex) => {
  const { width, height } = getViewportDimensions(viewport)
  const usableSize = Math.max(260, Math.min(width, height) - 56)
  return Math.max(ARCANE_CORE_MIN_ZOOM, Math.min(.78, usableSize / ((getArcaneCoreRingRadius(targetRing) + ARCANE_CORE_NODE_MARGIN) * 2)))
}

export const zoomAroundPointer = (camera: ArcaneCoreCamera, nextZoom: number, pointer: { x: number; y: number }, viewport: ArcaneCoreViewportSize) => {
  const worldX = (pointer.x - camera.x) / camera.zoom
  const worldY = (pointer.y - camera.y) / camera.zoom
  const zoom = Math.max(ARCANE_CORE_MIN_ZOOM, Math.min(ARCANE_CORE_MAX_ZOOM, nextZoom))
  const offset = clampCameraOffset({ x: pointer.x - worldX * zoom, y: pointer.y - worldY * zoom }, zoom, viewport)
  return { ...offset, zoom }
}

const requestFrame = (callback: FrameRequestCallback) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(callback)
  return window.setTimeout(() => callback(performance.now()), 0)
}

const cancelFrame = (frame: number) => {
  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(frame)
  else window.clearTimeout(frame)
}

interface UseArcaneCoreCameraOptions {
  viewportRef: RefObject<HTMLDivElement | null>
  worldRef: RefObject<HTMLDivElement | null>
  initialCamera?: ArcaneCoreCamera
}

export function useArcaneCoreCamera({ viewportRef, worldRef, initialCamera = { x: 0, y: 0, zoom: .2 } }: UseArcaneCoreCameraOptions) {
  const cameraRef = useRef<ArcaneCoreCamera>(initialCamera)
  const viewportSizeRef = useRef<ArcaneCoreViewportSize>({ width: 0, height: 0 })
  const frameRef = useRef<number | null>(null)
  const hudTimerRef = useRef<number | null>(null)
  const [viewportSize, setViewportSize] = useState<ArcaneCoreViewportSize>({ width: 0, height: 0 })
  const [zoomForHud, setZoomForHud] = useState(initialCamera.zoom)
  const [cameraMode, setCameraMode] = useState<ArcaneCoreCameraMode>('progression')
  const cameraModeRef = useRef<ArcaneCoreCameraMode>('progression')

  const changeCameraMode = useCallback((mode: ArcaneCoreCameraMode) => {
    if (cameraModeRef.current === mode) return
    cameraModeRef.current = mode
    setCameraMode(mode)
  }, [])

  const applyCamera = useCallback(() => {
    const world = worldRef.current
    if (!world) return
    const { x, y, zoom } = cameraRef.current
    world.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${zoom})`
  }, [worldRef])

  const scheduleCameraApply = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = requestFrame(() => {
      frameRef.current = null
      applyCamera()
    })
  }, [applyCamera])

  const commitCamera = useCallback((next: ArcaneCoreCamera, syncHud = false) => {
    cameraRef.current = next
    scheduleCameraApply()
    if (syncHud) setZoomForHud(next.zoom)
  }, [scheduleCameraApply])

  const syncZoomHud = useCallback((immediate = false) => {
    if (hudTimerRef.current !== null) window.clearTimeout(hudTimerRef.current)
    if (immediate) {
      setZoomForHud(cameraRef.current.zoom)
      hudTimerRef.current = null
      return
    }
    hudTimerRef.current = window.setTimeout(() => {
      hudTimerRef.current = null
      setZoomForHud(cameraRef.current.zoom)
    }, 100)
  }, [])

  const fitCamera = useCallback((mode: Exclude<ArcaneCoreCameraMode, 'manual'>, targetRing: ArcaneCoreRingIndex) => {
    changeCameraMode(mode)
    commitCamera({ x: 0, y: 0, zoom: getArcaneCoreFitZoom(viewportSizeRef.current, targetRing) }, true)
  }, [changeCameraMode, commitCamera])

  const zoomAtPointer = useCallback((nextZoom: number, pointer: { x: number; y: number }) => {
    changeCameraMode('manual')
    commitCamera(zoomAroundPointer(cameraRef.current, nextZoom, pointer, viewportSizeRef.current))
    syncZoomHud()
  }, [changeCameraMode, commitCamera, syncZoomHud])

  useEffect(() => {
    applyCamera()
    const viewport = viewportRef.current
    if (!viewport) return
    const updateSize = () => {
      const next = { width: viewport.clientWidth, height: viewport.clientHeight }
      viewportSizeRef.current = next
      setViewportSize(next)
    }
    updateSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [applyCamera, viewportRef])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelFrame(frameRef.current)
    if (hudTimerRef.current !== null) window.clearTimeout(hudTimerRef.current)
  }, [])

  return { cameraRef, viewportSizeRef, viewportSize, zoomForHud, cameraMode, setCameraMode: changeCameraMode, commitCamera, applyCamera, scheduleCameraApply, syncZoomHud, fitCamera, zoomAtPointer }
}
