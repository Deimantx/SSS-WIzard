import { describe, expect, it } from 'vitest'

const productionFiles = {
  ...import.meta.glob('./*.{ts,tsx,css}', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('../bestiary/BestiaryScreen.tsx', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>
const malformedMarkers = [String.fromCharCode(195, 8218), String.fromCharCode(195, 402), String.fromCharCode(239, 191, 189), String.fromCharCode(194, 183), String.fromCharCode(226, 8364, 8482), String.fromCharCode(226, 8364, 8221), `Hunter${'?'}s`]

describe('Hunter UI source encoding', () => {
  it('contains no recurring mojibake or replacement text in player-facing source', () => {
    for (const [path, source] of Object.entries(productionFiles)) {
      for (const marker of malformedMarkers) expect(source, `${path} contains ${marker}`).not.toContain(marker)
    }
  })
})
