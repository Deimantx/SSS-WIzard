import { describe, expect, it } from 'vitest'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, sanitizeDeveloperToolsGeometry } from './developerToolsWindowGeometry'

const viewport = { width: 1200, height: 800 }

describe('Developer Tools window geometry', () => {
  it('clamps persisted size and position into the viewport', () => {
    const geometry = sanitizeDeveloperToolsGeometry({ x: -500, y: 9999, width: 9999, height: 9999, minimized: true }, viewport)
    expect(geometry).toMatchObject({ x: 12, y: 12, width: 1176, height: 776, minimized: true })
  })

  it('falls back to sensible defaults for invalid geometry', () => {
    expect(sanitizeDeveloperToolsGeometry({ x: Number.NaN, width: 'wide' }, viewport)).toEqual(getDefaultDeveloperGeometry(viewport))
  })

  it('preserves minimized state while clamping explicit geometry', () => {
    expect(clampDeveloperToolsGeometry({ x: 100, y: 100, width: 600, height: 400, minimized: true }, viewport).minimized).toBe(true)
  })
})
