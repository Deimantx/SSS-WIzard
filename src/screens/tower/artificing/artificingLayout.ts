import type { EditableGridLayoutTransform } from '../../../ui/layout-editor/EditableGrid'

/** The shared solver places the pin below the measured Forge without persisting shifts. */
export const arrangeArtificingPanels: EditableGridLayoutTransform = layout => {
  const forge = layout.find(panel => panel.i === 'artificing-detail')
  if (!forge) return layout
  return layout.map(panel => {
    if (panel.i === forge.i) return { ...panel, h: panel.minH ?? 1 }
    if (panel.i === 'artificing-pinned-recipe') return { ...panel, x: forge.x, w: forge.w, y: forge.y + 1, h: panel.minH ?? 1 }
    return panel
  })
}
