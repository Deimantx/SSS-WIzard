import { describe, expect, it } from 'vitest'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, getDeveloperToolsMinimizedWidth, sanitizeDeveloperToolsGeometry } from './developerToolsWindowGeometry'

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

  it('keeps expanded geometry while clamping the compact title-bar position separately', () => {
    const geometry = clampDeveloperToolsGeometry({ x: 900, y: 700, width: 600, height: 400, minimized: true, minimizedX: 1100, minimizedY: 780 }, viewport)
    expect(geometry).toMatchObject({ x: 588, y: 388, width: 600, height: 400, minimizedX: 828, minimizedY: 730 })
    expect(getDeveloperToolsMinimizedWidth(viewport)).toBe(360)
  })

  it('migrates old geometry without losing the previous expanded position', () => {
    const geometry = sanitizeDeveloperToolsGeometry({ x: 600, y: 300, width: 700, height: 450, minimized: true }, viewport)
    expect(geometry).toMatchObject({ x: 488, y: 300, minimizedX: 600, minimizedY: 300 })
  })
})
