import { Copy, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ScreenId } from '../../game/types'
import { getPanelDefinitions } from './panelRegistry'
import { useLayoutEditorStore } from './layoutEditorStore'
import { UiEditorDesignSystem } from './UiEditorDesignSystem'
import { UiEditorHierarchy } from './UiEditorHierarchy'
import { UiEditorInspector } from './UiEditorInspector'
import { UiEditorToolbar } from './UiEditorToolbar'
import { findUiPresetOrphans } from './uiEditorStorage'
import { createUiPreset, deleteActiveUiPreset, duplicateUiPreset, selectUiPreset, setUiEditorNotice, setUiEditorPane, setUiEditorSection, useUiEditorStore } from './uiEditorStore'
import { useUiEditorWorkspaceMode, type UiEditorWorkspaceMode } from './uiEditorWorkspaceMode'
import type { UiEditorPane } from './uiEditorTypes'

const paneLabels: Record<UiEditorPane, string> = { canvas: 'Canvas', inspector: 'Inspector', hierarchy: 'Hierarchy', 'design-system': 'Design', presets: 'Presets' }

export function UiEditorWorkspace({ screen }: { screen: ScreenId }) {
  const layout = useLayoutEditorStore()
  const presets = useUiEditorStore((state) => state.presets)
  const activePresetId = useUiEditorStore((state) => state.activePresetId)
  const previewMode = useUiEditorStore((state) => state.previewMode)
  const activePane = useUiEditorStore((state) => state.activePane)
  const hierarchyVisible = useUiEditorStore((state) => state.hierarchyVisible)
  const inspectorVisible = useUiEditorStore((state) => state.inspectorVisible)
  const hierarchyWidth = useUiEditorStore((state) => state.hierarchyWidth)
  const inspectorWidth = useUiEditorStore((state) => state.inspectorWidth)
  const mode = useUiEditorWorkspaceMode()
  const [presetName, setPresetName] = useState('')
  if (!layout.isEditing) return null
  const currentScreen = layout.layoutTarget === 'shell' ? 'shell' : screen
  const activePreset = presets[activePresetId]
  const orphanCount = activePreset ? findUiPresetOrphans(activePreset).length : 0
  const selectPane = (pane: UiEditorPane) => {
    setUiEditorPane(pane)
    if (pane === 'inspector') setUiEditorSection('inspector')
    if (pane === 'design-system') setUiEditorSection('design-system')
    if (pane === 'presets') setUiEditorSection('components')
  }
  const toolPane: Exclude<UiEditorPane, 'canvas' | 'hierarchy'> = activePane === 'design-system' || activePane === 'presets' ? activePane : 'inspector'
  const wideInspector = mode === 'wide' && (activePane === 'hierarchy' || activePane === 'canvas')
  const renderCanvas = activePane === 'canvas' && !wideInspector
  return <div className="ui-editor-advanced ui-editor-workbench" data-ui-editor-ignore="true" data-ui-editor-mode={mode} style={{ '--ui-editor-hierarchy-width': `${hierarchyWidth}px`, '--ui-editor-inspector-width': `${inspectorWidth}px` } as CSSProperties}>
    <UiEditorToolbar screen={screen} onImportReport={(message) => setUiEditorNotice(message)} />
    {!previewMode && <>
      <nav className="ui-editor-pane-tabs" aria-label="UI editor panes">
        {getPaneOrder(mode).map((pane) => <button type="button" key={pane} className={`ui-editor-pane-tab ${activePane === pane ? 'active' : ''}`} onClick={() => selectPane(pane)}>{paneLabels[pane]}</button>)}
      </nav>
      <div className={`ui-editor-advanced-body ui-editor-workbench-body ${renderCanvas ? 'canvas-active' : ''}`}>
        {hierarchyVisible && <div className={`ui-editor-hierarchy-slot ${activePane === 'hierarchy' ? 'active-pane' : ''}`}><UiEditorHierarchy screen={currentScreen} /></div>}
        <div className={`ui-editor-tool-pane ${renderCanvas || activePane === toolPane || wideInspector ? 'active-pane' : ''}`}>
          {renderCanvas && <CanvasPane />}
          {activePane === 'hierarchy' && !wideInspector && <HierarchyPane />}
          {activePane !== 'canvas' && (activePane !== 'hierarchy' || wideInspector) && inspectorVisible && (toolPane === 'design-system' ? <UiEditorDesignSystem /> : toolPane === 'presets' ? <PresetManager presets={presets} activePresetId={activePresetId} presetName={presetName} setPresetName={setPresetName} activePreset={activePreset} /> : <UiEditorInspector />)}
          {activePane !== 'canvas' && (activePane !== 'hierarchy' || wideInspector) && !inspectorVisible && <CanvasPane />}
        </div>
      </div>
      <div className="ui-editor-workbench-status"><span>{currentScreen === 'shell' ? 'Header' : 'Live screen'} · {getPanelDefinitions(screen).length} panels available</span>{orphanCount > 0 && <span className="ui-editor-status-warning">{orphanCount} stale override{orphanCount === 1 ? '' : 's'}</span>}<span>Workspace preferences stay local to this editor.</span></div>
      {layout.layoutTarget === 'shell' && <div className="ui-editor-shell-hint">Header width and order controls remain below. Element presets can still be applied to registered header regions.</div>}
    </>}
    {previewMode && <div className="ui-editor-preview-state"><strong>Preview mode</strong><span>Editor chrome is hidden. Use the top-right X to leave the editor.</span></div>}
  </div>
}

function getPaneOrder(mode: UiEditorWorkspaceMode): UiEditorPane[] { return mode === 'compact' ? ['canvas', 'inspector', 'hierarchy', 'design-system', 'presets'] : ['inspector', 'hierarchy', 'design-system', 'presets'] }
function CanvasPane() { return <section className="ui-editor-canvas-state"><span className="ui-editor-kicker">LIVE CANVAS</span><strong>Select a surface in the game</strong><p>Use the live canvas to inspect a registered element. The editor keeps the game view visible beside this workspace.</p></section> }
function HierarchyPane() { return <section className="ui-editor-canvas-state"><span className="ui-editor-kicker">HIERARCHY</span><strong>Hierarchy is open</strong><p>Choose an element from the hierarchy pane. Its inspector will remain available beside it on wide layouts.</p></section> }

function PresetManager({ presets, activePresetId, presetName, setPresetName, activePreset }: { presets: Record<string, { meta: { id: string; name: string; description: string } }>; activePresetId: string; presetName: string; setPresetName: (value: string) => void; activePreset?: { meta: { name: string; description: string } } }) {
  return <section className="ui-editor-preset-manager"><div className="ui-editor-pane-heading"><div><span className="ui-editor-kicker">PRESET MANAGER</span><strong>Development presets</strong></div><span>{Object.keys(presets).length}</span></div><label className="ui-editor-preset-field"><span>Active preset</span><select value={activePresetId} onChange={(event) => selectUiPreset(event.target.value)}>{Object.values(presets).map((preset) => <option value={preset.meta.id} key={preset.meta.id}>{preset.meta.name}</option>)}</select></label><div className="ui-editor-preset-actions"><button type="button" onClick={() => createUiPreset(presetName.trim() || 'New UI preset')}><Plus size={12} /> Create</button><button type="button" onClick={duplicateUiPreset}><Copy size={12} /> Duplicate</button><button type="button" disabled={activePresetId === 'default'} onClick={() => { if (window.confirm('Delete the active development preset?')) deleteActiveUiPreset() }}><Trash2 size={12} /> Delete</button></div><label className="ui-editor-preset-field"><span>New preset name</span><input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Compact Test" /></label>{activePreset && <p className="ui-editor-help">{activePreset.meta.description || 'No description added.'}</p>}<button type="button" className="ui-editor-secondary-action" onClick={() => setUiEditorPane('inspector')}>Back to inspector</button></section>
}
