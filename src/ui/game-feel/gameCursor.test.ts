import { describe, expect, it } from 'vitest'
import { createCursorDataUri, createCursorValue } from './gameCursor'

describe('game cursor', () => {
  it('creates compact theme-aware SVG data URIs for both cursor variants', () => {
    const normal = createCursorDataUri({ accent: '#123456', variant: 'default' })
    const action = createCursorDataUri({ accent: '#123456', secondary: '#c98732', variant: 'action' })

    expect(normal.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(normal)).toContain('#123456')
    expect(action).not.toBe(normal)
    expect(createCursorValue('#123456', 'action')).toContain('pointer')
  })

  it('keeps the action cursor accent-dominant instead of using a white body', () => {
    const action = decodeURIComponent(createCursorDataUri({ accent: '#123456', secondary: '#c98732', variant: 'action' }))
    expect(action).toContain('fill="#123456"')
    expect(action).toContain('#c98732')
    expect(action).not.toContain('fill="#f8f5ff"')
  })

  it('accepts the object cursor contract and provides a disabled fallback', () => {
    expect(createCursorValue({ accent: '#123456', secondary: '#c98732', variant: 'default' })).toContain('auto')
    expect(createCursorValue({ accent: '#123456', secondary: '#c98732', variant: 'disabled' })).toContain('not-allowed')
  })
})
