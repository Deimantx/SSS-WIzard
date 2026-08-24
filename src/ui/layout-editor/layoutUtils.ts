import type { Layout } from 'react-grid-layout'
import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { getPanelDefinitions } from './panelRegistry'
import { GRID_COLUMNS, type SavedPanelLayout, type ScreenLayouts } from './layoutEditorTypes'

export const isDesktopLayout = () => typeof window === 'undefined' || window.innerWidth >= 1024

export function getScreenLayouts(screen: ScreenId, saved: ScreenLayouts = {}) {
  const result: ScreenLayouts = {}
  for (const panel of getPanelDefinitions(screen)) result[panel.id] = { ...panel.defaultLayout, ...(saved[panel.id] ?? {}) }
  return result
}

export function clampPanelLayout(screen: ScreenId, panelId: string, value: Partial<SavedPanelLayout>): SavedPanelLayout {
  const base = getScreenLayouts(screen)[panelId] ?? DEFAULT_LAYOUTS[screen][panelId]
  const panel = getPanelDefinitions(screen).find((item) => item.id === panelId)
  const minW = panel?.minW ?? 1
  const minH = panel?.minH ?? 1
  const w = Math.max(minW, Math.min(panel?.maxW ?? GRID_COLUMNS, Math.round(value.w ?? base.w)))
  return { ...base, ...value, x: Math.max(0, Math.min(GRID_COLUMNS - w, Math.round(value.x ?? base.x))), y: Math.max(0, Math.round(value.y ?? base.y)), w, h: Math.max(minH, Math.round(value.h ?? base.h)) }
}

export function toGridLayout(screen: ScreenId, layouts: ScreenLayouts, editing: boolean): Layout {
  return getPanelDefinitions(screen).filter((panel) => editing || !layouts[panel.id]?.hidden).map((panel) => {
    const value = clampPanelLayout(screen, panel.id, layouts[panel.id])
    return { i: panel.id, x: value.x, y: value.y, w: value.w, h: value.h, minW: panel.minW, minH: panel.minH, maxW: panel.maxW, maxH: panel.maxH, static: Boolean(value.locked) }
  })
}

export function fromGridLayout(screen: ScreenId, current: ScreenLayouts, layout: Layout): ScreenLayouts {
  const result = { ...current }
  for (const item of layout) result[item.i] = clampPanelLayout(screen, item.i, { ...result[item.i], x: item.x, y: item.y, w: item.w, h: item.h })
  return result
}

export const panelName = (screen: ScreenId, panelId: string) => getPanelDefinitions(screen).find((panel) => panel.id === panelId)?.label ?? panelId
