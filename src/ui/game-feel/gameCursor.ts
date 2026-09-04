export type GameCursorVariant = 'default' | 'action'

const FALLBACK_ACCENT = '#a894ff'

const normalizeAccent = (accent: string) => /^#[0-9a-f]{6}$/i.test(accent) ? accent : FALLBACK_ACCENT

/** Builds a native CSS cursor without creating a cursor-following DOM element. */
export const createCursorDataUri = ({ accent = FALLBACK_ACCENT, variant = 'default' }: { accent?: string; variant?: GameCursorVariant } = {}) => {
  const safeAccent = normalizeAccent(accent)
  const fill = variant === 'action' ? '#f8f5ff' : safeAccent
  const rune = variant === 'action' ? safeAccent : '#f8f5ff'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M4 2.8 22.1 14l-7.5 2.2 4.2 7.6-3.1 1.7-4.2-7.6-5.5 5.1Z" fill="${fill}" stroke="#10101a" stroke-width="1.35" stroke-linejoin="round"/><path d="m7.5 20.4 2.1 2.1 2.1-2.1-2.1-2.1Z" fill="${rune}" stroke="#10101a" stroke-width=".8"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const createCursorValue = (accent: string, variant: GameCursorVariant) => {
  const hotspot = variant === 'action' ? '4 3' : '3 2'
  const fallback = variant === 'action' ? 'pointer' : 'auto'
  return `url("${createCursorDataUri({ accent, variant })}") ${hotspot}, ${fallback}`
}

