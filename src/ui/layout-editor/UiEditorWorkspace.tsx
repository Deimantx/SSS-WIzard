import { Copy, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ScreenId } from '../../game/types'
import { getPanelDefinitions } from './panelRegistry'
import { useLayoutEditorStore } from './layoutEditorStore'
import { UiEditorDesignSystem } from './UiEditorDesignSystem'
import { UiEditorHierarchy } from './UiEditorHierarchy'
import { UiEditorInspector } from './UiEditorInspector'
import { UiEditorToolbar } from './UiEditorToolbar'
import { findUiPresetOrphans } from './uiEditorStorage'
import { createUiPreset, deleteActiveUiPreset, duplicateUiPreset, selectUiPreset, setUiEditorSection, setUiEditorNotice, useUiEditorStore } from './uiEditorStore'

export function UiEditorWorkspace({ screen }: { screen: ScreenId }) {
  const layout = useLayoutEditorStore(); const section = useUiEditorStore((state) => state.inspectorSection); const presets = useUiEditorStore((state) => state.presets); const activePresetId = useUiEditorStore((state) => state.activePresetId); const previewMode = useUiEditorStore((state) => state.previewMode); const [presetName, setPresetName] = useState('')
  if (!layout.isEditing) return null
  const activePreset = presets[activePresetId]
  const currentScreen = layout.layoutTarget === 'shell' ? 'shell' : screen
  const orphanCount = activePreset ? findUiPresetOrphans(activePreset).length : 0
  return <div className="ui-editor-advanced" data-ui-editor-ignore="true">
    <UiEditorToolbar screen={screen} onImportReport={(message) => setUiEditorNotice(message)} />
    {!previewMode && <>
      <div className="ui-editor-target-strip"><span><strong>{currentScreen === 'shell' ? 'Header' : 'Live screen'}</strong> · Click an outlined surface to inspect it</span><span>{getPanelDefinitions(screen).length} panels available{orphanCount ? ` · ${orphanCount} stale override${orphanCount === 1 ? '' : 's'}` : ''}</span><div><button type="button" className={section === 'inspector' ? 'active' : ''} onClick={() => setUiEditorSection('inspector')}>Inspector</button><button type="button" className={section === 'design-system' ? 'active' : ''} onClick={() => setUiEditorSection('design-system')}>Design system</button><button type="button" className={section === 'components' ? 'active' : ''} onClick={() => setUiEditorSection('components')}>Presets</button></div></div>
      <div className="ui-editor-advanced-body"><UiEditorHierarchy screen={currentScreen} />{section === 'design-system' ? <UiEditorDesignSystem /> : section === 'components' ? <PresetManager presets={presets} activePresetId={activePresetId} presetName={presetName} setPresetName={setPresetName} activePreset={activePreset} /> : <UiEditorInspector />}</div>
      {layout.layoutTarget === 'shell' && <div className="ui-editor-shell-hint">Header width and order controls remain below. Element presets can still be applied to registered header regions.</div>}
    </>}
    {previewMode && <div className="ui-editor-preview-state"><strong>Preview mode</strong><span>Editor chrome is hidden. Press the Editing button above to return.</span></div>}
  </div>
}

function PresetManager({ presets, activePresetId, presetName, setPresetName, activePreset }: { presets: Record<string, { meta: { id: string; name: string; description: string } }>; activePresetId: string; presetName: string; setPresetName: (value: string) => void; activePreset?: { meta: { name: string; description: string } } }) {
  return <section className="ui-editor-preset-manager"><div className="ui-editor-pane-heading"><div><span className="ui-editor-kicker">PRESET MANAGER</span><strong>Development presets</strong></div><span>{Object.keys(presets).length}</span></div><label className="ui-editor-preset-field"><span>Active preset</span><select value={activePresetId} onChange={(event) => selectUiPreset(event.target.value)}>{Object.values(presets).map((preset) => <option value={preset.meta.id} key={preset.meta.id}>{preset.meta.name}</option>)}</select></label><div className="ui-editor-preset-actions"><button type="button" onClick={() => createUiPreset(presetName.trim() || 'New UI preset')}><Plus size={12} /> Create</button><button type="button" onClick={duplicateUiPreset}><Copy size={12} /> Duplicate</button><button type="button" disabled={activePresetId === 'default'} onClick={() => { if (window.confirm('Delete the active development preset?')) deleteActiveUiPreset() }}><Trash2 size={12} /> Delete</button></div><label className="ui-editor-preset-field"><span>New preset name</span><input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Compact Test" /></label>{activePreset && <p className="ui-editor-help">{activePreset.meta.description || 'No description added.'}</p>}<button type="button" className="ui-editor-secondary-action" onClick={() => setUiEditorSection('inspector')}>Back to inspector</button></section>
}
