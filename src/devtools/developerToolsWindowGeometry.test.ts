import { describe, expect, it } from 'vitest'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, sanitizeDeveloperToolsGeometry } from './developerToolsWindowGeometry'

const viewport = { width: 1200, height: 800 }

describe('Developer Tools window geometry', () => {
  it('defaults to the centered workspace mode and keeps dock geometry ready', () => {
    expect(getDefaultDeveloperGeometry(viewport)).toMatchObject({ mode: 'workspace', dockedWidth: 640, dockedHeight: 560 })
  })

  it('clamps persisted docked size and position into the viewport', () => {
    const geometry = sanitizeDeveloperToolsGeometry({ mode: 'docked', dockedX: -500, dockedY: 9999, dockedWidth: 9999, dockedHeight: 9999 }, viewport)
    expect(geometry).toMatchObject({ mode: 'docked', dockedX: 12, dockedY: 12, dockedWidth: 1176, dockedHeight: 776 })
  })

  it('falls back to sensible defaults for invalid geometry', () => {
    expect(sanitizeDeveloperToolsGeometry({ mode: 'unknown', dockedX: Number.NaN, dockedWidth: 'wide' }, viewport)).toEqual(getDefaultDeveloperGeometry(viewport))
  })

  it('enforces the docked minimum dimensions', () => {
    const geometry = clampDeveloperToolsGeometry({ mode: 'docked', dockedX: 100, dockedY: 100, dockedWidth: 10, dockedHeight: 10 }, viewport)
    expect(geometry).toMatchObject({ dockedWidth: 560, dockedHeight: 440 })
  })

  it('migrates old V2 geometry and safely discards the compact title-bar position', () => {
    const geometry = sanitizeDeveloperToolsGeometry({ x: 600, y: 300, width: 700, height: 450, minimized: true, minimizedX: 1100, minimizedY: 780 }, viewport)
    expect(geometry).toMatchObject({ mode: 'docked', dockedX: 488, dockedY: 300, dockedWidth: 700, dockedHeight: 450 })
    expect('minimizedX' in geometry).toBe(false)
  })
})
