import type { Layout } from 'react-grid-layout'
import { GRID_COLUMNS, GRID_MARGIN, GRID_ROW_HEIGHT } from '../../ui/layout-editor/layoutEditorTypes'

const STAGE_ID = 'combat-stage'
const SPELL_DECK_ID = 'combat-spell-deck'
const DETAILS_ID = 'combat-details'
export const DEFAULT_COMBAT_SPELL_DECK_H = 7
export const MAX_ADAPTIVE_COMBAT_SPELL_DECK_H = 9

export interface AdaptiveCombatLayoutOptions {
  requiredStageContentHeight?: number
  requiredDeckContentHeight?: number
}

/**
 * Adapts the single Combat stack from measured content.
 * Saved geometry remains the floor for panels the player intentionally expanded.
 */
export function getAdaptiveCombatLayout(layout: Layout, options: AdaptiveCombatLayoutOptions | number): Layout {
  const normalized = typeof options === 'number' ? { requiredStageContentHeight: options } : options
  const stage = layout.find((item) => item.i === STAGE_ID)
  const deck = layout.find((item) => item.i === SPELL_DECK_ID)
  const details = layout.find((item) => item.i === DETAILS_ID)
  if (!stage || !deck || !details) return layout

  const requiredStageHeight = normalized.requiredStageContentHeight && normalized.requiredStageContentHeight > 0
    ? Math.max(stage.h, Math.ceil((normalized.requiredStageContentHeight + GRID_MARGIN[1]) / (GRID_ROW_HEIGHT + GRID_MARGIN[1])))
    : stage.h
  const requiredDeckHeight = normalized.requiredDeckContentHeight && normalized.requiredDeckContentHeight > 0
    ? Math.min(MAX_ADAPTIVE_COMBAT_SPELL_DECK_H, Math.ceil((normalized.requiredDeckContentHeight + GRID_MARGIN[1]) / (GRID_ROW_HEIGHT + GRID_MARGIN[1])))
    : deck.h
  const deckHeight = Math.max(deck.h > DEFAULT_COMBAT_SPELL_DECK_H ? deck.h : DEFAULT_COMBAT_SPELL_DECK_H, requiredDeckHeight)
  const lowerStartY = stage.y + requiredStageHeight
  const deckY = Math.max(deck.y, lowerStartY)
  const detailsY = Math.max(details.y, deckY + deckHeight)
  const next = layout.map((item) => {
    if (item.i === STAGE_ID) return { ...item, h: requiredStageHeight, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)) }
    if (item.i === SPELL_DECK_ID) return { ...item, y: deckY, h: deckHeight }
    if (item.i === DETAILS_ID) return { ...item, y: detailsY }
    return item
  })
  return next.every((item, index) => item.i === layout[index]?.i && item.x === layout[index]?.x && item.y === layout[index]?.y && item.w === layout[index]?.w && item.h === layout[index]?.h) ? layout : next
}
