import type { Layout } from 'react-grid-layout'
import { GRID_COLUMNS } from '../../ui/layout-editor/layoutEditorTypes'
import { pixelsToGridRows } from '../../ui/layout-editor/runtimePanelLayout'

const LOADOUT_ID = 'equipment-loadout'
const STATS_ID = 'equipment-stats'
const ARMORY_ID = 'equipment-owned'
const INSPECTOR_ID = 'equipment-inspector'

export interface AdaptiveEquipmentLayoutOptions {
  requiredLoadoutContentHeight?: number
  requiredStatsContentHeight?: number
}

function requiredPanelHeight(currentHeight: number, contentHeight = 0) {
  if (contentHeight <= 0) return currentHeight
  return Math.max(currentHeight, pixelsToGridRows(contentHeight))
}

/**
 * Keeps the two lower Equipment panels below whichever top panel has the most
 * content. The measured height is only used for the rendered layout and does
 * not overwrite the user's saved editor geometry.
 */
export function getAdaptiveEquipmentLayout(layout: Layout, options: AdaptiveEquipmentLayoutOptions = {}): Layout {
  const loadout = layout.find((item) => item.i === LOADOUT_ID)
  const stats = layout.find((item) => item.i === STATS_ID)
  const armory = layout.find((item) => item.i === ARMORY_ID)
  const inspector = layout.find((item) => item.i === INSPECTOR_ID)
  if (!loadout || !stats || !armory || !inspector) return layout

  const loadoutHeight = requiredPanelHeight(loadout.h, options.requiredLoadoutContentHeight)
  const statsHeight = requiredPanelHeight(stats.h, options.requiredStatsContentHeight)
  const topPanelBottom = Math.max(loadout.y + loadoutHeight, stats.y + statsHeight)
  const armoryY = Math.max(armory.y, topPanelBottom)
  const inspectorY = Math.max(inspector.y, topPanelBottom)
  const next = layout.map((item) => {
    if (item.i === LOADOUT_ID) return { ...item, h: loadoutHeight, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)) }
    if (item.i === STATS_ID) return { ...item, h: statsHeight, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)) }
    if (item.i === ARMORY_ID) return { ...item, y: armoryY }
    if (item.i === INSPECTOR_ID) return { ...item, y: inspectorY }
    return item
  })

  return next.every((item, index) => {
    const previous = layout[index]
    return item.i === previous?.i && item.x === previous.x && item.y === previous.y && item.w === previous.w && item.h === previous.h
  }) ? layout : next
}
