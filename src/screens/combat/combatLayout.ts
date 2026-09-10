import type { Layout } from 'react-grid-layout'
import { GRID_COLUMNS } from '../../ui/layout-editor/layoutEditorTypes'
import { pixelsToGridRows } from '../../ui/layout-editor/runtimePanelLayout'

const STAGE_ID = 'combat-stage'
const SPELL_DECK_ID = 'combat-spell-deck'
const ANALYTICS_ID = 'combat-analytics'
export const DEFAULT_COMBAT_SPELL_DECK_H = 7
export const MAX_ADAPTIVE_COMBAT_SPELL_DECK_H = 9

export interface AdaptiveCombatLayoutOptions {
  requiredDeckRows?: number
  /** Compatibility input for callers that still report natural pixels. */
  requiredDeckContentHeight?: number
  /** @deprecated Analytics uses its saved bounded height. */
  requiredAnalyticsContentHeight?: number
}

/**
 * Adapts the single Combat stack from measured content.
 * The deck bottom is the sole source of truth for the shared analytics row.
 */
export function getAdaptiveCombatLayout(layout: Layout, options: AdaptiveCombatLayoutOptions | number): Layout {
  const normalized = typeof options === 'number' ? {} : options
  const stage = layout.find((item) => item.i === STAGE_ID)
  const deck = layout.find((item) => item.i === SPELL_DECK_ID)
  const analytics = layout.find((item) => item.i === ANALYTICS_ID)
  if (!stage || !deck || !analytics) return layout

  // The Stage is a designed bounded arena. Keep its saved geometry stable so
  // its live timers cannot feed layout measurement back into the whole screen.
  const deckRows = normalized.requiredDeckRows ?? (normalized.requiredDeckContentHeight && normalized.requiredDeckContentHeight > 0 ? pixelsToGridRows(normalized.requiredDeckContentHeight) : 0)
  const requiredDeckHeight = deckRows > 0
    ? Math.min(MAX_ADAPTIVE_COMBAT_SPELL_DECK_H, Math.ceil(deckRows))
    : deck.h
  const deckHeight = Math.max(deck.h > DEFAULT_COMBAT_SPELL_DECK_H ? deck.h : DEFAULT_COMBAT_SPELL_DECK_H, requiredDeckHeight)
  const lowerStartY = stage.y + stage.h
  const deckY = Math.max(deck.y, lowerStartY)
  const bottomY = deckY + deckHeight
  const analyticsHeight = analytics.h
  const next = layout.map((item) => {
    if (item.i === STAGE_ID) return { ...item, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)) }
    if (item.i === SPELL_DECK_ID) return { ...item, y: deckY, h: deckHeight }
    if (item.i === ANALYTICS_ID) return { ...item, y: bottomY, h: analyticsHeight }
    return item
  })
  return next.every((item, index) => item.i === layout[index]?.i && item.x === layout[index]?.x && item.y === layout[index]?.y && item.w === layout[index]?.w && item.h === layout[index]?.h) ? layout : next
}
