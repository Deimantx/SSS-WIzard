import type { Layout } from 'react-grid-layout'
import { GRID_COLUMNS } from '../../ui/layout-editor/layoutEditorTypes'
import { pixelsToGridRows } from '../../ui/layout-editor/runtimePanelLayout'

const INSPECTOR_PANEL_ID = 'schools-inspector'
const PRESETS_PANEL_ID = 'schools-presets'

export function getAdaptiveSchoolsLayout(layout: Layout, inspectorContentHeight: number): Layout {
  if (inspectorContentHeight <= 0) return layout
  const inspector = layout.find((item) => item.i === INSPECTOR_PANEL_ID)
  const presets = layout.find((item) => item.i === PRESETS_PANEL_ID)
  if (!inspector || !presets) return layout

  const requiredInspectorHeight = Math.max(inspector.h, pixelsToGridRows(inspectorContentHeight))
  const requiredPresetsY = Math.max(presets.y, inspector.y + requiredInspectorHeight)
  if (requiredInspectorHeight === inspector.h && requiredPresetsY === presets.y) return layout

  return layout.map((item) => {
    if (item.i === INSPECTOR_PANEL_ID) return { ...item, h: requiredInspectorHeight }
    if (item.i === PRESETS_PANEL_ID) return { ...item, x: Math.max(0, Math.min(GRID_COLUMNS - item.w, item.x)), y: requiredPresetsY }
    return item
  })
}
