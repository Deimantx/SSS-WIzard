import type { ScreenId } from '../../game/types'

export const LAYOUT_VERSION = 3
export const GRID_COLUMNS = 12
export const GRID_ROW_HEIGHT = 30
export const GRID_MARGIN: readonly [number, number] = [14, 14]

export interface SavedPanelLayout {
  x: number
  y: number
  w: number
  h: number
  hidden?: boolean
  locked?: boolean
}

export type ScreenLayouts = Record<string, SavedPanelLayout>

export type TopbarRegionId = 'topbar-breadcrumb' | 'topbar-health' | 'topbar-mana' | 'topbar-focus' | 'topbar-utilities'

export interface TopbarLayout {
  order: TopbarRegionId[]
  widths: Record<TopbarRegionId, number>
}

export interface ShellLayouts {
  topbar: TopbarLayout
}

export interface UiLayoutDocument {
  version: typeof LAYOUT_VERSION
  screens: Partial<Record<ScreenId, ScreenLayouts>>
  shell: ShellLayouts
}

export interface PanelDefinition {
  id: string
  screen: ScreenId
  label: string
  defaultLayout: SavedPanelLayout
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  canHide?: boolean
}

export interface LayoutEditorState {
  isEditing: boolean
  layoutTarget: 'screen' | 'shell'
  selectedPanelId: string | null
  showGrid: boolean
  panelInteraction: boolean
  notice: string | null
  undoDepth: number
  redoDepth: number
}
