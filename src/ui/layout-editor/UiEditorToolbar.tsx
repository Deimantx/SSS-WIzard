import { Copy, Download, Eye, Grid2X2, LayoutTemplate, MoreHorizontal, Redo2, RotateCcw, Save, Undo2, Upload } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { ScreenId } from '../../game/types'
import { setLayoutTarget, useLayoutEditorStore } from './layoutEditorStore'
import { importUiPreset, resetUiPreset, saveUiEditorPreset, setUiEditorOption, setUiEditorPreview, setUiEditorTool, setUiEditorWorkspacePreference, undoUiEditor, redoUiEditor, useUiEditorStore } from './uiEditorStore'
import { validateUiPreset } from './uiEditorStorage'
import { migrateUiPreset } from './uiEditorMigrations'
import { UI_EDITOR_PREVIEW_ZOOMS, type UiEditorPreviewZoom } from './uiEditorTypes'

const ZOOM_OPTIONS: { value: UiEditorPreviewZoom; label: string }[] = UI_EDITOR_PREVIEW_ZOOMS.map((value) => ({ value, label: value === 'fit' ? 'Fit' : `${Math.round(value * 100)}%` }))

export function UiEditorToolbar({ screen, onImportReport }: { screen: ScreenId; onImportReport: (message: string) => void }) {
  const layout = useLayoutEditorStore()
  const ui = useUiEditorStore((state) => state)
  const inputRef = useRef<HTMLInputElement>(null)
  const exportPreset = () => {
    const preset = ui.presets[ui.activePresetId]
    if (!preset) return
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sss-wizard-ui-preset-${preset.meta.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    onImportReport(`Exported ${preset.meta.name}.`)
  }
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const value: unknown = migrateUiPreset(JSON.parse(await file.text()))
      const report = validateUiPreset(value)
      if (!report.valid) {
        onImportReport(`Import blocked: ${report.issues.filter((issue) => issue.severity === 'ERROR').map((issue) => issue.message).join(' ')}`)
        return
      }
      importUiPreset(value)
      onImportReport(`Imported preset with ${report.validChanges} supported changes.`)
    } catch {
      onImportReport('Import blocked: the selected file is not valid JSON.')
    }
  }
  const target = layout.layoutTarget
  return <div className="ui-editor-toolbar" data-ui-editor-ignore="true">
    <div className="ui-editor-toolbar-brand"><span className="ui-editor-kicker">ADVANCED UI EDITOR</span><strong>{ui.presets[ui.activePresetId]?.meta.name ?? 'Development preset'}</strong></div>
    <div className="ui-editor-tool-group" aria-label="Editor tools">
      <ToolbarButton active={ui.tool === 'select'} label="Select" onClick={() => setUiEditorTool('select')}><LayoutTemplate size={13} /></ToolbarButton>
      <ToolbarButton active={ui.tool === 'move'} label="Move" onClick={() => setUiEditorTool('move')}><Copy size={13} /></ToolbarButton>
      <ToolbarButton active={ui.tool === 'resize'} label="Resize" onClick={() => setUiEditorTool('resize')}><Grid2X2 size={13} /></ToolbarButton>
    </div>
    <div className="ui-editor-tool-group ui-editor-history-tools">
      <ToolbarButton label="Undo" disabled={!ui.undoDepth} onClick={undoUiEditor}><Undo2 size={13} /></ToolbarButton>
      <ToolbarButton label="Redo" disabled={!ui.redoDepth} onClick={redoUiEditor}><Redo2 size={13} /></ToolbarButton>
    </div>
    <div className="ui-editor-toolbar-actions ui-editor-toolbar-main-actions">
      <button type="button" className={`ui-editor-toolbar-toggle ${target === 'screen' ? 'active' : ''}`} onClick={() => setLayoutTarget('screen')}>Screen</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${target === 'shell' ? 'active' : ''}`} onClick={() => setLayoutTarget('shell')}>Header</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${ui.previewMode ? 'active' : ''}`} onClick={() => setUiEditorPreview(!ui.previewMode)}><Eye size={13} /> {ui.previewMode ? 'Editing' : 'Preview'}</button>
      <label className="ui-editor-zoom-control"><span>Zoom</span><select aria-label="Preview zoom" value={String(ui.previewZoom)} onChange={(event) => { const value = event.target.value === 'fit' ? 'fit' : Number(event.target.value) as UiEditorPreviewZoom; setUiEditorWorkspacePreference('previewZoom', value) }}>{ZOOM_OPTIONS.map((option) => <option value={String(option.value)} key={String(option.value)}>{option.label}</option>)}</select></label>
    </div>
    <details className="ui-editor-more-menu">
      <summary><MoreHorizontal size={14} /> <span>More</span></summary>
      <div className="ui-editor-more-popover">
        <button type="button" className={`ui-editor-toolbar-toggle ${ui.showBounds ? 'active' : ''}`} onClick={() => setUiEditorOption('showBounds', !ui.showBounds)}><Grid2X2 size={13} /> Bounds</button>
        <button type="button" className={`ui-editor-toolbar-toggle ${ui.showIds ? 'active' : ''}`} onClick={() => setUiEditorOption('showIds', !ui.showIds)}><Eye size={13} /> IDs</button>
        <button type="button" className={`ui-editor-toolbar-toggle ${ui.hierarchyVisible ? 'active' : ''}`} onClick={() => setUiEditorWorkspacePreference('hierarchyVisible', !ui.hierarchyVisible)}><Eye size={13} /> Hierarchy pane</button>
        <button type="button" className={`ui-editor-toolbar-toggle ${ui.inspectorVisible ? 'active' : ''}`} onClick={() => setUiEditorWorkspacePreference('inspectorVisible', !ui.inspectorVisible)}><Eye size={13} /> Inspector pane</button>
        <label className="ui-editor-range-control"><span>Hierarchy width <b>{ui.hierarchyWidth}px</b></span><input type="range" min="220" max="320" step="10" value={ui.hierarchyWidth} onChange={(event) => setUiEditorWorkspacePreference('hierarchyWidth', Number(event.target.value))} /></label>
        <label className="ui-editor-range-control"><span>Inspector width <b>{ui.inspectorWidth}px</b></span><input type="range" min="390" max="520" step="10" value={ui.inspectorWidth} onChange={(event) => setUiEditorWorkspacePreference('inspectorWidth', Number(event.target.value))} /></label>
        <button type="button" className="ui-editor-toolbar-toggle" onClick={() => saveUiEditorPreset()}><Save size={13} /> Save</button>
        <button type="button" className="ui-editor-toolbar-toggle" onClick={() => inputRef.current?.click()}><Upload size={13} /> Import</button>
        <button type="button" className="ui-editor-toolbar-toggle" onClick={exportPreset}><Download size={13} /> Export</button>
        <button type="button" className="ui-editor-toolbar-toggle danger" onClick={() => { if (window.confirm('Reset this development UI preset to the shipped defaults?')) resetUiPreset() }}><RotateCcw size={13} /> Reset</button>
      </div>
    </details>
    <input ref={inputRef} className="ui-editor-file-input" type="file" accept="application/json,.json" onChange={onFile} data-ui-editor-ignore="true" />
  </div>
}

function ToolbarButton({ active, label, disabled, onClick, children }: { active?: boolean; label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" className={`ui-editor-tool-button ${active ? 'active' : ''}`} aria-label={label} disabled={disabled} onClick={onClick}>{children}<span>{label}</span></button> }
