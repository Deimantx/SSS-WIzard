export type GameCursorVariant = 'default' | 'action' | 'disabled'

export interface GameCursorOptions {
  accent?: string
  secondary?: string
  variant?: GameCursorVariant
}

const FALLBACK_ACCENT = '#a894ff'
const FALLBACK_SECONDARY = '#efbd77'

const normalizeAccent = (accent: string) => /^#[0-9a-f]{6}$/i.test(accent) ? accent : FALLBACK_ACCENT
const normalizeSecondary = (secondary: string) => /^#[0-9a-f]{6}$/i.test(secondary) ? secondary : FALLBACK_SECONDARY

/** Builds a native CSS cursor without creating a cursor-following DOM element. */
export const createCursorDataUri = ({ accent = FALLBACK_ACCENT, secondary = FALLBACK_SECONDARY, variant = 'default' }: GameCursorOptions = {}) => {
  const safeAccent = normalizeAccent(accent)
  const safeSecondary = normalizeSecondary(secondary)
  const fill = variant === 'disabled' ? '#686b7e' : safeAccent
  const innerHighlight = variant === 'disabled' ? '#9295a8' : safeSecondary
  const rune = variant === 'action' ? safeSecondary : variant === 'disabled' ? '#4b4e60' : '#f0ecff'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 2.8 26.2 16.3l-9.1 2.6 5 8.6-3.4 2-5-8.7-6.7 6.1Z" fill="${fill}" stroke="#090a13" stroke-width="2" stroke-linejoin="round"/><path d="M8.2 7.2 20.6 14.7l-5.1 1.5 2.8 4.8-1.9 1.1-2.8-4.8-3.8 3.5Z" fill="${innerHighlight}" opacity=".62"/><path d="m8.4 24.4 2.5 2.5 2.5-2.5-2.5-2.5Z" fill="${rune}" stroke="#090a13" stroke-width="1"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function createCursorValue(options: GameCursorOptions): string
export function createCursorValue(accent: string, variant?: GameCursorVariant): string
export function createCursorValue(optionsOrAccent: GameCursorOptions | string, legacyVariant: GameCursorVariant = 'default') {
  const options = typeof optionsOrAccent === 'string' ? { accent: optionsOrAccent, variant: legacyVariant } : optionsOrAccent
  const variant = options.variant ?? 'default'
  const hotspot = variant === 'action' ? '4 3' : '3 2'
  const fallback = variant === 'action' ? 'pointer' : variant === 'disabled' ? 'not-allowed' : 'auto'
  return `url("${createCursorDataUri(options)}") ${hotspot}, ${fallback}`
}
