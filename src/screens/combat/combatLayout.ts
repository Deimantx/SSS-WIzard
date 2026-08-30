import type { Layout } from 'react-grid-layout'
import { GRID_COLUMNS, GRID_MARGIN, GRID_ROW_HEIGHT } from '../../ui/layout-editor/layoutEditorTypes'

const STAGE_ID = 'combat-stage'
const SPELL_DECK_ID = 'combat-spell-deck'
const LOG_ID = 'combat-log'

/** Expands the live stage only when its responsive content needs more rows. */
export function getAdaptiveCombatLayout(layout: Layout, requiredStageContentHeight: number): Layout {
  if (requiredStageContentHeight <= 0) return layout
  const stage = layout.find((item) => item.i === STAGE_ID)
  const deck = layout.find((item) => item.i === SPELL_DECK_ID)
  const log = layout.find((item) => item.i === LOG_ID)
  if (!stage || !deck || !log) return layout

  const requiredStageHeight = Math.max(stage.h, Math.ceil((requiredStageContentHeight + GRID_MARGIN[1]) / (GRID_ROW_HEIGHT + GRID_MARGIN[1])))
  const lowerStartY = stage.y + requiredStageHeight
  const deckY = Math.max(deck.y, lowerStartY)
  const logY = Math.max(log.y, deckY + deck.h)
  if (requiredStageHeight === stage.h && deckY === deck.y && logY === log.y) return layout

  return layout.map((item) => {
    if (item.i === STAGE_ID) return { ...item, h: requiredStageHeight, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)) }
    if (item.i === SPELL_DECK_ID) return { ...item, y: deckY }
    if (item.i === LOG_ID) return { ...item, y: logY }
    return item
  })
}
