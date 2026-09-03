import { Children, isValidElement, useCallback, useMemo, useState } from 'react'
import { GridLayout, noCompactor, useContainerWidth, type EventCallback, type Layout } from 'react-grid-layout'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { commitGridLayout, getSavedScreenLayouts, useLayoutEditorStore } from './layoutEditorStore'
import { getPanelDefinitions } from './panelRegistry'
import { toGridLayout } from './layoutUtils'
import { GRID_COLUMNS, GRID_MARGIN, GRID_ROW_HEIGHT } from './layoutEditorTypes'
import { EditableGridItem } from './EditableGridItem'
import { GridOverlay } from './GridOverlay'
import { getRequiredGridRows, resolvePanelAutoFlowLayout, stackPanelLayout } from './runtimePanelLayout'

export interface EditableGridPanel { id: string; content: ReactNode }
export type EditableGridLayoutTransform = (layout: Layout) => Layout

export function EditableGrid({ screen, panels, children, layoutTransform }: { screen: ScreenId; panels?: EditableGridPanel[]; children?: ReactNode; layoutTransform?: EditableGridLayoutTransform }) {
  const editor = useLayoutEditorStore()
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: false, initialWidth: 1100 })
  const saved = useMemo(() => getSavedScreenLayouts(screen), [editor.document, screen])
  const grid = useMemo(() => toGridLayout(screen, saved, editor.isEditing), [editor.document, editor.isEditing, saved, screen])
  const transformedGrid = useMemo(() => editor.isEditing || !layoutTransform ? grid : layoutTransform(grid), [editor.isEditing, grid, layoutTransform])
  const definitions = getPanelDefinitions(screen)
  const panelEntries = panels ?? Children.toArray(children).flatMap((child) => { if (!isValidElement(child)) return []; const props = child.props as { children?: ReactNode; 'data-panel-id'?: string }; const id = props['data-panel-id'] ?? (typeof child.key === 'string' ? child.key.replace(/^\$+/, '') : ''); return id ? [{ id, content: props.children }] : [] })
  const available = new Map(panelEntries.map((panel) => [panel.id, panel.content]))
  const availableDefinitions = definitions.filter((definition) => available.has(definition.id))
  const [measuredRows, setMeasuredRows] = useState<Record<string, number>>({})
  const handleNaturalHeightChange = useCallback((panelId: string, height: number) => {
    const panel = getPanelDefinitions(screen).find((definition) => definition.id === panelId)
    if (!panel || panel.heightMode === 'bounded-scroll') return
    const rows = getRequiredGridRows(height, panel.minH ?? 1)
    setMeasuredRows((current) => current[panelId] === rows ? current : { ...current, [panelId]: rows })
  }, [screen])
  const autoFlowGrid = useMemo(() => resolvePanelAutoFlowLayout(transformedGrid.filter((item) => available.has(item.i)), measuredRows, availableDefinitions), [available, availableDefinitions, measuredRows, transformedGrid])
  const displayGrid = useMemo(() => {
    if (width <= 0 || width >= 760) return autoFlowGrid
    return stackPanelLayout(autoFlowGrid)
  }, [autoFlowGrid, width])
  const renderedChildren = availableDefinitions.filter((definition) => autoFlowGrid.some((item) => item.i === definition.id)).map((definition) => <div key={definition.id}><EditableGridItem screen={screen} panelId={definition.id} onNaturalHeightChange={handleNaturalHeightChange}>{available.get(definition.id)}</EditableGridItem></div>)

  const handleLayoutStop: EventCallback = (layout, _oldItem, newItem) => { if (editor.isEditing && newItem) commitGridLayout(screen, layout, newItem.i) }
  return <div className={`ui-editor-grid ${editor.isEditing ? 'editing' : ''}`} ref={containerRef}>
    <GridOverlay visible={editor.isEditing && editor.showGrid} />
    {mounted && <GridLayout width={width} layout={displayGrid} compactor={noCompactor} gridConfig={{ cols: GRID_COLUMNS, rowHeight: GRID_ROW_HEIGHT, margin: GRID_MARGIN, containerPadding: [0, 0] }} dragConfig={{ enabled: editor.isEditing, bounded: true, handle: '.ui-editor-drag-handle', cancel: '.ui-editor-no-drag,button,input,select,textarea,a' }} resizeConfig={{ enabled: editor.isEditing, handles: ['e', 's', 'se'] }} className="ui-editor-grid-layout" onDragStop={handleLayoutStop} onResizeStop={handleLayoutStop}>{renderedChildren}</GridLayout>}
  </div>
}
