import type { Layout, LayoutItem } from 'react-grid-layout'
import type { PanelDefinition } from './layoutEditorTypes'
import { GRID_COLUMNS, GRID_MARGIN, GRID_ROW_HEIGHT } from './layoutEditorTypes'

export interface RuntimePanelLayoutOptions {
  rowHeight?: number
  marginY?: number
}

export function gridRowsToPixels(rows: number, rowHeight = GRID_ROW_HEIGHT, marginY = GRID_MARGIN[1]) {
  const safeRows = Math.max(1, Math.ceil(rows))
  return safeRows * rowHeight + (safeRows - 1) * marginY
}

/** Converts natural content pixels to the smallest grid height that contains them. */
export function pixelsToGridRows(requiredPixels: number, rowHeight = GRID_ROW_HEIGHT, marginY = GRID_MARGIN[1]) {
  if (!Number.isFinite(requiredPixels) || requiredPixels <= 0) return 1
  return Math.max(1, Math.ceil((requiredPixels + marginY) / (rowHeight + marginY)))
}

export function getRequiredGridRows(requiredPixels: number, minH = 1, options: RuntimePanelLayoutOptions = {}) {
  return Math.max(minH, pixelsToGridRows(requiredPixels, options.rowHeight, options.marginY))
}

export function rectanglesOverlap(a: Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>, b: Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function orderForRuntime(layout: Layout, definitions: readonly PanelDefinition[]) {
  const definitionOrder = new Map(definitions.map((definition, index) => [definition.id, index]))
  return [...layout].sort((a, b) => a.y - b.y || a.x - b.x || (definitionOrder.get(a.i) ?? Number.MAX_SAFE_INTEGER) - (definitionOrder.get(b.i) ?? Number.MAX_SAFE_INTEGER) || a.i.localeCompare(b.i))
}

/** Resolves render-only geometry; saved y/h values are never mutated here. */
export function resolvePanelAutoFlowLayout(layout: Layout, measuredRows: Readonly<Record<string, number>> = {}, definitions: readonly PanelDefinition[] = []): Layout {
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]))
  const placed: LayoutItem[] = []
  for (const source of orderForRuntime(layout, definitions)) {
    const definition = definitionById.get(source.i)
    const minH = definition?.minH ?? source.minH ?? 1
    const measuredHeight = Math.max(minH, Math.ceil(measuredRows[source.i] ?? 0))
    const height = definition?.heightMode === 'bounded-scroll' ? Math.max(source.h, minH) : Math.max(source.h, minH, measuredHeight)
    const width = Math.max(1, Math.min(GRID_COLUMNS, source.w))
    const current: LayoutItem = { ...source, w: width, x: Math.max(0, Math.min(GRID_COLUMNS - width, source.x)), h: height, y: Math.max(0, source.y) }
    let candidateY = current.y
    let blocker: LayoutItem | undefined
    do {
      blocker = placed.find((existing) => rectanglesOverlap({ ...current, y: candidateY }, existing))
      if (blocker) candidateY = blocker.y + blocker.h
    } while (blocker)
    placed.push({ ...current, y: candidateY })
  }
  const byId = new Map(placed.map((item) => [item.i, item]))
  return layout.map((item) => byId.get(item.i) ?? item)
}

export function validateNoPanelOverlap(layout: Layout) {
  for (let index = 0; index < layout.length; index += 1) {
    for (let other = index + 1; other < layout.length; other += 1) {
      if (rectanglesOverlap(layout[index], layout[other])) return false
    }
  }
  return true
}

export function stackPanelLayout(layout: Layout): Layout {
  let nextY = 0
  return layout.map((item) => {
    const stacked = { ...item, x: 0, y: nextY, w: GRID_COLUMNS }
    nextY += item.h
    return stacked
  })
}
