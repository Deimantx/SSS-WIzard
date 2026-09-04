import { describe, expect, it } from 'vitest'
import { createCursorDataUri, createCursorValue } from './gameCursor'

describe('game cursor', () => {
  it('creates compact theme-aware SVG data URIs for both cursor variants', () => {
    const normal = createCursorDataUri({ accent: '#123456', variant: 'default' })
    const action = createCursorDataUri({ accent: '#123456', variant: 'action' })

    expect(normal.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(normal)).toContain('#123456')
    expect(action).not.toBe(normal)
    expect(createCursorValue('#123456', 'action')).toContain('pointer')
  })
})

