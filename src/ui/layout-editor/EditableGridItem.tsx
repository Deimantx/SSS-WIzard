import { Lock, Unlock, EyeOff } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { getPanelDefinition } from './panelRegistry'
import { getSavedScreenLayouts, selectLayoutPanel, togglePanelHidden, togglePanelLocked, useLayoutEditorStore } from './layoutEditorStore'

export function EditableGridItem({ screen, panelId, children }: { screen: ScreenId; panelId: string; children: ReactNode }) {
  const editor = useLayoutEditorStore()
  const layout = getSavedScreenLayouts(screen)[panelId]
  const panel = getPanelDefinition(screen, panelId)
  if (!panel || layout?.hidden && !editor.isEditing) return null
  const selected = editor.selectedPanelId === panelId
  return <div className={`ui-editor-panel ${selected ? 'selected' : ''} ${layout?.hidden ? 'hidden-panel' : ''}`} data-panel-id={panelId} onClick={() => editor.isEditing && selectLayoutPanel(panelId)}>
    {editor.isEditing && <div className="ui-editor-overlay" aria-label={`${panel.label} layout controls`}>
      <button type="button" className="ui-editor-drag-handle" onClick={(event) => { event.stopPropagation(); selectLayoutPanel(panelId) }} title="Drag panel"><span className="ui-editor-grip">⠿</span><span>{panel.label}</span></button>
      <span className="ui-editor-panel-actions">{layout?.locked ? <Lock size={12} /> : <Unlock size={12} />}{layout?.hidden && <EyeOff size={12} />}</span>
      <div className="ui-editor-item-actions"><button type="button" className="ui-editor-no-drag" onClick={(event) => { event.stopPropagation(); togglePanelLocked(screen, panelId) }} title={layout?.locked ? 'Unlock panel' : 'Lock panel'}>{layout?.locked ? <Lock size={12} /> : <Unlock size={12} />}</button><button type="button" className="ui-editor-no-drag" onClick={(event) => { event.stopPropagation(); togglePanelHidden(screen, panelId) }} title={layout?.hidden ? 'Show panel' : 'Hide panel'}><EyeOff size={12} /></button></div>
    </div>}
    <div className={`ui-editor-panel-content ${editor.isEditing && !editor.panelInteraction ? 'ui-editor-interaction-off' : ''}`}>{children}</div>
  </div>
}
