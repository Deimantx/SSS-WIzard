import { Check, Copy, Download, Eye, EyeOff, Grid2X2, LayoutTemplate, Redo2, RotateCcw, Save, Settings2, Undo2, Upload, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { ScreenId } from '../../game/types'
import { closeLayoutEditor, setLayoutTarget, useLayoutEditorStore } from './layoutEditorStore'
import { importUiPreset, resetUiPreset, saveUiEditorPreset, setUiEditorOption, setUiEditorPreview, setUiEditorSection, setUiEditorTool, undoUiEditor, redoUiEditor, useUiEditorStore } from './uiEditorStore'
import { validateUiPreset } from './uiEditorStorage'
import { migrateUiPreset } from './uiEditorMigrations'

export function UiEditorToolbar({ screen, onImportReport }: { screen: ScreenId; onImportReport: (message: string) => void }) {
  const layout = useLayoutEditorStore()
  const ui = useUiEditorStore((state) => ({ ...state }))
  const inputRef = useRef<HTMLInputElement>(null)
  const exportPreset = () => {
    const preset = useUiEditorStore((state) => state.presets[state.activePresetId])
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `sss-wizard-ui-preset-${preset.meta.id}.json`; anchor.click(); URL.revokeObjectURL(url); onImportReport(`Exported ${preset.meta.name}.`)
  }
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { const value: unknown = migrateUiPreset(JSON.parse(await file.text())); const report = validateUiPreset(value); if (!report.valid) { onImportReport(`Import blocked: ${report.issues.filter((issue) => issue.severity === 'ERROR').map((issue) => issue.message).join(' ')}`); return }; importUiPreset(value); onImportReport(`Imported preset with ${report.validChanges} supported changes.`) } catch { onImportReport('Import blocked: the selected file is not valid JSON.') } }
  const target = layout.layoutTarget
  return <div className="ui-editor-toolbar" data-ui-editor-ignore="true">
    <div className="ui-editor-toolbar-brand"><span className="ui-editor-kicker">ADVANCED UI EDITOR</span><strong>{ui.presets[ui.activePresetId]?.meta.name ?? 'Development preset'}</strong></div>
    <div className="ui-editor-tool-group" aria-label="Editor tools">
      <ToolbarButton active={ui.tool === 'select'} label="Select" onClick={() => setUiEditorTool('select')}><LayoutTemplate size={13} /></ToolbarButton>
      <ToolbarButton active={ui.tool === 'move'} label="Move" onClick={() => setUiEditorTool('move')}><Copy size={13} /></ToolbarButton>
      <ToolbarButton active={ui.tool === 'resize'} label="Resize" onClick={() => setUiEditorTool('resize')}><Grid2X2 size={13} /></ToolbarButton>
    </div>
    <div className="ui-editor-tool-group ui-editor-history-tools">
      <ToolbarButton label="Undo" disabled={!ui.undoDepth} onClick={undoUiEditor}><Undo2 size={13} /></ToolbarButton><ToolbarButton label="Redo" disabled={!ui.redoDepth} onClick={redoUiEditor}><Redo2 size={13} /></ToolbarButton>
    </div>
    <div className="ui-editor-toolbar-actions">
      <button type="button" className={`ui-editor-toolbar-toggle ${ui.previewMode ? 'active' : ''}`} onClick={() => setUiEditorPreview(!ui.previewMode)}><Eye size={13} /> {ui.previewMode ? 'Editing' : 'Preview'}</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${ui.showBounds ? 'active' : ''}`} onClick={() => setUiEditorOption('showBounds', !ui.showBounds)}><Grid2X2 size={13} /> Bounds</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${ui.showIds ? 'active' : ''}`} onClick={() => setUiEditorOption('showIds', !ui.showIds)}><Eye size={13} /> IDs</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${target === 'screen' ? 'active' : ''}`} onClick={() => setLayoutTarget('screen')}>Screen</button>
      <button type="button" className={`ui-editor-toolbar-toggle ${target === 'shell' ? 'active' : ''}`} onClick={() => setLayoutTarget('shell')}>Header</button>
    </div>
    <div className="ui-editor-toolbar-actions ui-editor-file-actions">
      <button type="button" className="ui-editor-toolbar-toggle" onClick={() => saveUiEditorPreset()}><Save size={13} /> Save</button>
      <button type="button" className="ui-editor-toolbar-toggle" onClick={() => setUiEditorSection('components')}><Settings2 size={13} /> Presets</button>
      <button type="button" className="ui-editor-toolbar-toggle" onClick={() => inputRef.current?.click()}><Upload size={13} /> Import</button>
      <button type="button" className="ui-editor-toolbar-toggle" onClick={exportPreset}><Download size={13} /> Export</button>
      <button type="button" className="ui-editor-toolbar-toggle danger" onClick={() => { if (window.confirm('Reset this development UI preset to the shipped defaults?')) resetUiPreset() }}><RotateCcw size={13} /> Reset</button>
      <button type="button" className="ui-editor-toolbar-exit" onClick={() => closeLayoutEditor()}><X size={14} /> Exit</button>
    </div>
    <input ref={inputRef} className="ui-editor-file-input" type="file" accept="application/json,.json" onChange={onFile} data-ui-editor-ignore="true" />
  </div>
}

function ToolbarButton({ active, label, disabled, onClick, children }: { active?: boolean; label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" className={`ui-editor-tool-button ${active ? 'active' : ''}`} aria-label={label} disabled={disabled} onClick={onClick}>{children}<span>{label}</span></button> }
