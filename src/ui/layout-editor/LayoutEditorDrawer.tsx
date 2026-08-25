import { Check, Eye, EyeOff, Grid2X2, Lock, Redo2, RotateCcw, Ruler, Unlock, Undo2, X } from 'lucide-react'
import { useEffect } from 'react'
import type { ScreenId } from '../../game/types'
import { Button } from '../../components/ui'
import { getPanelDefinitions } from './panelRegistry'
import { applyTopbarPreset, fitSelectedPanel, getSavedScreenLayouts, getTopbarLayout, moveSelectedPanel, moveTopbarResourceBy, redoLayout, resetAllScreenLayouts, resetHeaderLayout, resetSelectedPanel, resetScreenLayout, selectLayoutPanel, setLayoutTarget, setPanelInteraction, setShowEditorGrid, togglePanelHidden, togglePanelLocked, undoLayout, updateSelectedPanel, updateTopbarWidth, useLayoutEditorStore, closeLayoutEditor } from './layoutEditorStore'
import { panelName } from './layoutUtils'
import { TOPBAR_RESOURCE_IDS, TOPBAR_WIDTH_LIMITS, topbarLayoutPresetName } from './shellLayout'
import type { TopbarRegionId } from './layoutEditorTypes'

const SCREEN_LABELS: Record<ScreenId, string> = { home: 'Overview', combat: 'Combat', schools: 'Magic Schools', inventory: 'Inventory', equipment: 'Equipment', collection: 'Collection', 'tower-channeling': 'Channeling', 'tower-focus': 'Focus', 'tower-condensation': 'Condensation', 'tower-research': 'Research', 'tower-transmutation': 'Transmutation', guild: 'Guild', settings: 'Settings / Info' }

export function LayoutEditorDrawer({ screen }: { screen: ScreenId }) {
  const editor = useLayoutEditorStore()
  const layouts = getSavedScreenLayouts(screen)
  const panels = getPanelDefinitions(screen)
  const selectedId = editor.selectedPanelId && panels.some((panel) => panel.id === editor.selectedPanelId) ? editor.selectedPanelId : null
  const selected = selectedId ? layouts[selectedId] : null

  useEffect(() => {
    if (!editor.isEditing || editor.layoutTarget !== 'screen') return
    if (!selectedId) selectLayoutPanel(panels.find((panel) => !layouts[panel.id]?.hidden)?.id ?? panels[0]?.id ?? null)
  }, [editor.isEditing, editor.layoutTarget, layouts, panels, selectedId])

  useEffect(() => {
    if (!editor.isEditing) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const formField = target?.matches('input, select, textarea, [contenteditable="true"]')
      if ((event.ctrlKey || event.metaKey) && !formField && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redoLayout() : undoLayout(); return }
      if ((event.ctrlKey || event.metaKey) && !formField && event.key.toLowerCase() === 'y') { event.preventDefault(); redoLayout(); return }
      if (editor.layoutTarget !== 'screen' || formField || !selectedId || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveSelectedPanel(screen, 'x', -1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveSelectedPanel(screen, 'x', 1) }
      if (event.key === 'ArrowUp') { event.preventDefault(); moveSelectedPanel(screen, 'y', -1) }
      if (event.key === 'ArrowDown') { event.preventDefault(); moveSelectedPanel(screen, 'y', 1) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor.isEditing, editor.layoutTarget, screen, selectedId])

  if (!editor.isEditing) return null
  const setNumber = (key: 'x' | 'y' | 'w' | 'h', value: string) => { const number = Number(value); if (Number.isFinite(number)) updateSelectedPanel(screen, { [key]: number }) }
  const quickWidth = (w: number) => updateSelectedPanel(screen, { w })
  const confirmCurrent = () => { if (window.confirm(`Reset the ${SCREEN_LABELS[screen]} layout?`)) resetScreenLayout(screen) }
  const confirmAll = () => { if (window.confirm('Reset all UI layouts, including the Topbar shell?')) resetAllScreenLayouts() }
  return <aside className="layout-editor-drawer" aria-label="UI layout editor">
    <div className="layout-editor-drawer-head"><div><span className="layout-editor-kicker">UI EDITOR</span><strong>{editor.layoutTarget === 'shell' ? 'Shell Layout' : SCREEN_LABELS[screen]}</strong></div><button type="button" className="layout-editor-close ui-editor-no-drag" onClick={() => closeLayoutEditor()} aria-label="Exit UI editor"><X size={17} /></button></div>
    <div className="layout-editor-drawer-scroll">
      {editor.notice && <div className="layout-editor-notice">{editor.notice}</div>}
      <section className="layout-editor-section layout-target-selector"><div className="layout-editor-section-title">LAYOUT TARGET</div><div className="layout-target-buttons"><button className={editor.layoutTarget === 'screen' ? 'active' : ''} onClick={() => setLayoutTarget('screen')}>Screen Layout</button><button className={editor.layoutTarget === 'shell' ? 'active' : ''} onClick={() => setLayoutTarget('shell')}>Shell Layout</button></div></section>
      {editor.layoutTarget === 'shell' ? <ShellLayoutControls /> : <>
        <section className="layout-editor-section"><div className="layout-editor-section-title">CURRENT SCREEN <span>{panels.length} panels</span></div><div className="layout-editor-history"><Button variant="ghost" disabled={!editor.undoDepth} onClick={undoLayout}><Undo2 size={13} /> Undo</Button><Button variant="ghost" disabled={!editor.redoDepth} onClick={redoLayout}><Redo2 size={13} /> Redo</Button></div></section>
        <section className="layout-editor-section"><div className="layout-editor-panel-list">{panels.filter((panel) => !layouts[panel.id]?.hidden).map((panel) => <PanelListButton key={panel.id} label={panel.label} selected={selectedId === panel.id} locked={Boolean(layouts[panel.id]?.locked)} onClick={() => selectLayoutPanel(panel.id)} />)}</div>{panels.some((panel) => layouts[panel.id]?.hidden) && <div className="layout-editor-hidden-list"><span>Hidden Panels</span>{panels.filter((panel) => layouts[panel.id]?.hidden).map((panel) => <PanelListButton key={panel.id} label={panel.label} selected={selectedId === panel.id} locked={Boolean(layouts[panel.id]?.locked)} hidden onClick={() => selectLayoutPanel(panel.id)} />)}</div>}</section>
        {selectedId && selected && <section className="layout-editor-section selected-panel-controls"><div className="layout-editor-section-title">SELECTED PANEL <span>{panelName(screen, selectedId)}</span></div><div className="layout-editor-fields"><label>X<input className="ui-editor-no-drag" type="number" min="0" max="11" value={selected.x} onChange={(event) => setNumber('x', event.target.value)} /></label><label>Y<input className="ui-editor-no-drag" type="number" min="0" value={selected.y} onChange={(event) => setNumber('y', event.target.value)} /></label><label>W<input className="ui-editor-no-drag" type="number" min="1" max="12" value={selected.w} onChange={(event) => setNumber('w', event.target.value)} /></label><label>H<input className="ui-editor-no-drag" type="number" min="1" value={selected.h} onChange={(event) => setNumber('h', event.target.value)} /></label></div><div className="layout-editor-quick-widths"><span>Quick widths</span>{[[4, '1/3'], [6, '1/2'], [8, '2/3'], [12, 'Full']].map(([width, label]) => <button type="button" key={label} onClick={() => quickWidth(Number(width))}>{label}</button>)}</div><div className="layout-editor-control-row"><Button variant="ghost" onClick={() => fitSelectedPanel(screen)}><Ruler size={13} /> Fit Height</Button><Button variant={selected.locked ? 'success' : 'ghost'} onClick={() => togglePanelLocked(screen, selectedId)}>{selected.locked ? <Lock size={13} /> : <Unlock size={13} />} {selected.locked ? 'Locked' : 'Lock'}</Button><Button variant="ghost" onClick={() => togglePanelHidden(screen, selectedId)}>{selected.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {selected.hidden ? 'Show' : 'Hide'}</Button></div><Button variant="ghost" onClick={() => resetSelectedPanel(screen)}><RotateCcw size={13} /> Reset selected</Button></section>}
        <section className="layout-editor-section layout-editor-options"><ToggleRow icon={<Grid2X2 size={13} />} label="Show Grid" value={editor.showGrid} onClick={() => setShowEditorGrid(!editor.showGrid)} /><ToggleRow icon={<Check size={13} />} label="Panel Interaction" value={editor.panelInteraction} onClick={() => setPanelInteraction(!editor.panelInteraction)} /></section>
        <section className="layout-editor-section layout-editor-reset"><Button variant="secondary" onClick={confirmCurrent}>Reset Current Screen</Button><Button variant="ghost" onClick={confirmAll}>Reset All UI</Button></section>
      </>}
      {editor.layoutTarget === 'shell' && <section className="layout-editor-section layout-editor-reset"><Button variant="secondary" onClick={resetHeaderLayout}>Reset Header</Button><Button variant="ghost" onClick={confirmAll}>Reset All UI</Button></section>}
      <div className="layout-editor-saved">Saved locally · UI layout key v3</div>
    </div>
    <div className="layout-editor-drawer-foot"><Button variant="success" onClick={() => closeLayoutEditor()}><Check size={14} /> Done</Button><Button variant="ghost" onClick={() => closeLayoutEditor()}>Exit UI Editor</Button></div>
  </aside>
}

function ShellLayoutControls() {
  const layout = getTopbarLayout()
  const preset = topbarLayoutPresetName(layout)
  const names: Record<TopbarRegionId, string> = { 'topbar-breadcrumb': 'Breadcrumb', 'topbar-health': 'Health', 'topbar-mana': 'Mana', 'topbar-focus': 'Focus', 'topbar-utilities': 'Utilities' }
  const resources = layout.order.filter((id): id is TopbarRegionId => TOPBAR_RESOURCE_IDS.includes(id))
  return <>
    <section className="layout-editor-section shell-layout-section"><div className="layout-editor-section-title">TOPBAR PRESET <span>{preset === 'custom' ? 'Custom' : preset === 'mana-focused' ? 'Mana Focused' : preset[0].toUpperCase() + preset.slice(1)}</span></div><div className="shell-preset-buttons">{([['mana-focused', 'Mana Focused'], ['balanced', 'Balanced'], ['compact', 'Compact']] as const).map(([id, label]) => <button key={id} className={preset === id ? 'active' : ''} onClick={() => applyTopbarPreset(id)}>{label}</button>)}</div></section>
    <section className="layout-editor-section shell-layout-section"><div className="layout-editor-section-title">RESOURCE ORDER <span>Utilities stay right</span></div><div className="shell-order-list">{resources.map((id, index) => <div className="shell-order-row" key={id}><strong>{index + 1}. {names[id]}</strong><span><button type="button" disabled={index === 0} onClick={() => moveTopbarResourceBy(id, -1)} aria-label={`Move ${names[id]} up`}>↑</button><button type="button" disabled={index === resources.length - 1} onClick={() => moveTopbarResourceBy(id, 1)} aria-label={`Move ${names[id]} down`}>↓</button></span></div>)}</div></section>
    <section className="layout-editor-section shell-layout-section"><div className="layout-editor-section-title">REGION WIDTHS <span>Desktop pixels</span></div><div className="shell-width-list">{(['topbar-breadcrumb', ...TOPBAR_RESOURCE_IDS] as TopbarRegionId[]).map((id) => <label key={id}>{names[id]}<input type="number" min={TOPBAR_WIDTH_LIMITS[id].min} max={TOPBAR_WIDTH_LIMITS[id].max} value={layout.widths[id]} onChange={(event) => updateTopbarWidth(id, Number(event.target.value))} /><small>{TOPBAR_WIDTH_LIMITS[id].min}–{TOPBAR_WIDTH_LIMITS[id].max}px</small></label>)}</div><p className="layout-editor-help">Utilities remain content-sized as one grouped block. Narrow layouts temporarily use responsive shell rules and restore these values when wide.</p></section>
  </>
}

function PanelListButton({ label, selected, locked, hidden, onClick }: { label: string; selected: boolean; locked: boolean; hidden?: boolean; onClick: () => void }) { return <button type="button" className={`layout-editor-panel-button ${selected ? 'selected' : ''} ${hidden ? 'hidden' : ''}`} onClick={onClick}><span>{label}</span>{locked && <Lock size={12} />}{hidden && <EyeOff size={12} />}</button> }
function ToggleRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: boolean; onClick: () => void }) { return <button type="button" className="layout-editor-toggle" onClick={onClick}><span>{icon}{label}</span><strong>{value ? 'ON' : 'OFF'}</strong></button> }
