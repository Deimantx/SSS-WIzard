import { Lock, Unlock, EyeOff } from 'lucide-react'
import { useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { getPanelDefinition } from './panelRegistry'
import { getSavedScreenLayouts, selectLayoutPanel, togglePanelHidden, togglePanelLocked, useLayoutEditorStore } from './layoutEditorStore'
import { usePanelNaturalHeight } from './usePanelNaturalHeight'

export function EditableGridItem({ screen, panelId, children, onNaturalHeightChange }: { screen: ScreenId; panelId: string; children: ReactNode; onNaturalHeightChange?: (panelId: string, height: number) => void }) {
  const editor = useLayoutEditorStore()
  const layout = getSavedScreenLayouts(screen)[panelId]
  const panel = getPanelDefinition(screen, panelId)
  const naturalContentRef = useRef<HTMLDivElement>(null)
  const reportNaturalHeight = useCallback((height: number) => onNaturalHeightChange?.(panelId, height), [onNaturalHeightChange, panelId])
  usePanelNaturalHeight(naturalContentRef, panel?.heightMode !== 'bounded-scroll', onNaturalHeightChange ? reportNaturalHeight : undefined)
  if (!panel || layout?.hidden && !editor.isEditing) return null
  const selected = editor.selectedPanelId === panelId
  return <div className={`ui-editor-panel ${selected ? 'selected' : ''} ${layout?.hidden ? 'hidden-panel' : ''}`} data-panel-id={panelId} onClick={() => editor.isEditing && selectLayoutPanel(panelId)}>
    {editor.isEditing && <div className="ui-editor-overlay" aria-label={`${panel.label} layout controls`}>
      <GameTooltip content="Drag panel"><button type="button" className="ui-editor-drag-handle" onClick={(event) => { event.stopPropagation(); selectLayoutPanel(panelId) }} aria-label={`Drag ${panel.label}`}><span className="ui-editor-grip">⠿</span><span>{panel.label}</span></button></GameTooltip>
      <span className="ui-editor-panel-actions">{layout?.locked ? <Lock size={12} /> : <Unlock size={12} />}{layout?.hidden && <EyeOff size={12} />}</span>
      <div className="ui-editor-item-actions"><GameTooltip content={layout?.locked ? 'Unlock panel' : 'Lock panel'}><button type="button" className="ui-editor-no-drag" onClick={(event) => { event.stopPropagation(); togglePanelLocked(screen, panelId) }} aria-label={layout?.locked ? 'Unlock panel' : 'Lock panel'}>{layout?.locked ? <Lock size={12} /> : <Unlock size={12} />}</button></GameTooltip><GameTooltip content={layout?.hidden ? 'Show panel' : 'Hide panel'}><button type="button" className="ui-editor-no-drag" onClick={(event) => { event.stopPropagation(); togglePanelHidden(screen, panelId) }} aria-label={layout?.hidden ? 'Show panel' : 'Hide panel'}><EyeOff size={12} /></button></GameTooltip></div>
    </div>}
    <div className="ui-editor-panel-viewport">
      <div ref={naturalContentRef} className={`ui-editor-panel-content ui-editor-panel-natural-content height-mode-${panel.heightMode ?? 'content'} ${editor.isEditing && !editor.panelInteraction ? 'ui-editor-interaction-off' : ''}`}>{children}</div>
    </div>
  </div>
}
