import { Children, isValidElement, useMemo } from 'react'
import { GridLayout, useContainerWidth, type Layout } from 'react-grid-layout'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { commitGridLayout, getSavedScreenLayouts, useLayoutEditorStore } from './layoutEditorStore'
import { getPanelDefinitions } from './panelRegistry'
import { toGridLayout } from './layoutUtils'
import { GRID_COLUMNS, GRID_MARGIN, GRID_ROW_HEIGHT } from './layoutEditorTypes'
import { EditableGridItem } from './EditableGridItem'
import { GridOverlay } from './GridOverlay'

export interface EditableGridPanel { id: string; content: ReactNode }
export type EditableGridLayoutTransform = (layout: Layout) => Layout

export function EditableGrid({ screen, panels, children, layoutTransform }: { screen: ScreenId; panels?: EditableGridPanel[]; children?: ReactNode; layoutTransform?: EditableGridLayoutTransform }) {
  const editor = useLayoutEditorStore()
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: false, initialWidth: 1100 })
  const saved = getSavedScreenLayouts(screen)
  const grid = useMemo(() => toGridLayout(screen, saved, editor.isEditing), [editor.document, editor.isEditing, saved, screen])
  const transformedGrid = useMemo(() => editor.isEditing || !layoutTransform ? grid : layoutTransform(grid), [editor.isEditing, grid, layoutTransform])
  const displayGrid = useMemo(() => {
    const responsiveScreen = screen === 'inventory' || screen === 'collection' || screen === 'bestiary' || screen === 'tower-focus' || screen === 'tower-transmutation' || screen === 'tower-research' || screen === 'schools' || screen === 'combat' || screen === 'equipment'
    if (!responsiveScreen || width <= 0) return transformedGrid
    if (width >= 760) return transformedGrid
    let nextY = 0
    return transformedGrid.map((item) => {
      const stacked = { ...item, x: 0, y: nextY, w: GRID_COLUMNS }
      nextY += item.h
      return stacked
    })
  }, [screen, transformedGrid, width])
  const childPanels = Children.toArray(children).flatMap((child) => { if (!isValidElement(child)) return []; const props = child.props as { children?: ReactNode; 'data-panel-id'?: string }; const id = props['data-panel-id'] ?? (typeof child.key === 'string' ? child.key.replace(/^\$+/, '') : ''); return id ? [{ id, content: props.children }] : [] })
  const panelEntries = panels ?? childPanels
  const available = new Map(panelEntries.map((panel) => [panel.id, panel.content]))
  const definitions = getPanelDefinitions(screen)
  const renderedChildren = definitions.filter((definition) => grid.some((item) => item.i === definition.id) && available.has(definition.id)).map((definition) => <div key={definition.id}><EditableGridItem screen={screen} panelId={definition.id}>{available.get(definition.id)}</EditableGridItem></div>)

  const handleLayoutStop = (layout: Layout) => { if (editor.isEditing) commitGridLayout(screen, layout) }
  return <div className={`ui-editor-grid ${editor.isEditing ? 'editing' : ''}`} ref={containerRef}>
    <GridOverlay visible={editor.isEditing && editor.showGrid} />
    {mounted && <GridLayout width={width} layout={displayGrid} gridConfig={{ cols: GRID_COLUMNS, rowHeight: GRID_ROW_HEIGHT, margin: GRID_MARGIN, containerPadding: [0, 0] }} dragConfig={{ enabled: editor.isEditing, bounded: true, handle: '.ui-editor-drag-handle', cancel: '.ui-editor-no-drag,button,input,select,textarea,a' }} resizeConfig={{ enabled: editor.isEditing, handles: ['e', 's', 'se'] }} className="ui-editor-grid-layout" onDragStop={handleLayoutStop} onResizeStop={handleLayoutStop}>{renderedChildren}</GridLayout>}
  </div>
}
