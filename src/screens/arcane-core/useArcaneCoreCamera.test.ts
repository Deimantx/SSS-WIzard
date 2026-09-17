import { describe, expect, it } from 'vitest'
import { clampCameraOffset, getArcaneCoreFitZoom, zoomAroundPointer } from './useArcaneCoreCamera'

describe('Arcane Core camera helpers', () => {
  it('clamps camera movement to the complete outer Ring bounds', () => {
    const compact = clampCameraOffset({ x: 100000, y: -100000 }, .2, { width: 1000, height: 700 })
    expect(compact.x).toBe(0)
    expect(compact.y).toBe(-86)
    expect(clampCameraOffset({ x: 100000, y: -100000 }, .78, { width: 1000, height: 700 }).x).toBeGreaterThan(0)
  })

  it('zooms around the cursor without losing the pointed world position', () => {
    const camera = { x: 0, y: 0, zoom: .5 }
    const next = zoomAroundPointer(camera, 1, { x: 100, y: -50 }, { width: 2000, height: 1200 })
    expect(next.zoom).toBe(1)
    expect(next.x).toBe(-100)
    expect(next.y).toBe(50)
  })

  it('fits the requested Ring inside the viewport and keeps the zoom bounded', () => {
    const progression = getArcaneCoreFitZoom({ width: 1100, height: 700 }, 2)
    const all = getArcaneCoreFitZoom({ width: 1100, height: 700 }, 8)
    expect(progression).toBeGreaterThan(all)
    expect(all).toBeGreaterThanOrEqual(.14)
    expect(progression).toBeLessThanOrEqual(.78)
  })
})
