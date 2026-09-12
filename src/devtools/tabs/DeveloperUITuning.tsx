import { Download, FileUp, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { getPanelLayout, getScreenLayout, SCREEN_PANEL_LAYOUTS } from '../../ui/layout/screenPanelLayouts'
import { getResolvedPanelLayout, getResolvedScreenLayout, getUITuningComponent, getUITuningPanel, getUITuningTypography } from '../../ui/config/uiTuningResolver'
import { exportUITuningDraft, importUITuningDraft, resetAllUITuning, resetUITuningField, resetUITuningTarget, setUITuningField, useUITuningDraft } from '../../ui/config/uiTuningDraftStore'
import { UI_TUNING_SCHEMA, type UITuningFieldSchema, type UITuningTarget } from '../../ui/config/uiTuningSchema'
import { UI_TUNING, type UITuningComponentKey } from '../../ui/config/uiTuning'
import type { ScreenId } from '../../game/types'

const TARGETS: readonly { target: UITuningTarget; label: string; description: string }[] = [
  { target: 'panel', label: 'Panel surface', description: 'Padding, header rhythm, border, and radius.' },
  { target: 'panelGeometry', label: 'Panel geometry', description: 'Safe position and size draft for one panel.' },
  { target: 'screenLayout', label: 'Screen spacing', description: 'Column and row gaps for the active screen.' },
  { target: 'inventoryItemCard', label: 'Inventory item card', description: 'Vault card density, icon, name, quantity, and marker.' },
  { target: 'equipmentItemCard', label: 'Equipment card', description: 'Armory card size, icon, labels, and grid density.' },
  { target: 'spellCardMagicSchools', label: 'School spell card', description: 'Magic Schools browser card controls.' },
  { target: 'spellCardCombatDeck', label: 'Combat spell card', description: 'Combat Deck card controls.' },
  { target: 'statRow', label: 'Stat row', description: 'Equipment stat label and value typography.' },
  { target: 'tooltip', label: 'Tooltip', description: 'Safe tooltip dimensions and readable text.' },
  { target: 'typography', label: 'Typography roles', description: 'Screen, panel, item, body, metadata, and stat roles.' },
]

const SCREEN_IDS = (Object.keys(SCREEN_PANEL_LAYOUTS) as ScreenId[]).filter((screen) => Object.keys(SCREEN_PANEL_LAYOUTS[screen].panels).length > 0)
const COMPONENT_TARGETS = new Set<UITuningTarget>(['inventoryItemCard', 'equipmentItemCard', 'spellCardMagicSchools', 'spellCardCombatDeck', 'statRow', 'tooltip'])
const isComponentTarget = (target: UITuningTarget): target is UITuningComponentKey => COMPONENT_TARGETS.has(target)

function fieldValue(target: UITuningTarget, key: string, screen: ScreenId, panelId: string | null, scope: 'global' | 'screen') {
  const resolvedScreen = scope === 'screen' ? screen : undefined
  let value: unknown
  if (target === 'panel') value = (getUITuningPanel(resolvedScreen) as unknown as Record<string, unknown>)[key]
  else if (target === 'typography') value = (getUITuningTypography(resolvedScreen) as unknown as Record<string, unknown>)[key]
  else if (isComponentTarget(target)) value = (getUITuningComponent(target, resolvedScreen) as unknown as Record<string, unknown>)[key]
  else if (target === 'screenLayout') value = (getResolvedScreenLayout(screen).screen as unknown as Record<string, unknown>)[key]
  else if (panelId) {
    const panel = getResolvedPanelLayout(screen, panelId)
    value = (panel as unknown as Record<string, unknown>)[key]
  }
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function fieldGroups(target: UITuningTarget) {
  const fields = UI_TUNING_SCHEMA.filter((field) => field.target === target)
  return ['layout', 'spacing', 'typography', 'icon', 'border', 'grid'].map((section) => ({ section, fields: fields.filter((field) => field.section === section) })).filter((group) => group.fields.length > 0)
}

export function DeveloperUITuning({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  useUITuningDraft()
  const [target, setTarget] = useState<UITuningTarget>('inventoryItemCard')
  const [screen, setScreen] = useState<ScreenId>('inventory')
  const [panelId, setPanelId] = useState('inventory-catalog')
  const [scope, setScope] = useState<'global' | 'screen'>('screen')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const panels = useMemo(() => Object.keys(getScreenLayout(screen).panels), [screen])
  const groups = useMemo(() => fieldGroups(target), [target])
  const selectedTarget = TARGETS.find((entry) => entry.target === target) ?? TARGETS[0]

  useEffect(() => {
    if (!panels.includes(panelId)) setPanelId(panels[0] ?? '')
  }, [panelId, panels])

  const effectiveScope = target === 'panelGeometry' || target === 'screenLayout' ? 'screen' : scope
  const updateField = (field: UITuningFieldSchema, value: number) => {
    setUITuningField(field.target, field.key, value, { screen: effectiveScope === 'screen' ? screen : undefined, panelId: target === 'panelGeometry' ? panelId : undefined })
    setMessage('Preview updated')
  }
  const resetField = (field: UITuningFieldSchema) => {
    resetUITuningField(field.target, field.key, { screen: effectiveScope === 'screen' ? screen : undefined, panelId: target === 'panelGeometry' ? panelId : undefined })
    setMessage('Field reset to default')
  }
  const resetTarget = () => {
    resetUITuningTarget(target, { screen: effectiveScope === 'screen' ? screen : undefined, panelId: target === 'panelGeometry' ? panelId : undefined })
    setMessage('Target reset to default')
  }
  const downloadDraft = () => {
    const blob = new Blob([JSON.stringify(exportUITuningDraft(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'sss-wizard-ui-tuning.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Draft exported')
  }
  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const imported = importUITuningDraft(JSON.parse(await file.text()))
      setMessage(imported ? 'Draft imported' : 'Import rejected: invalid tuning file')
    } catch {
      setMessage('Import rejected: invalid JSON')
    }
  }

  return <div className="developer-tab-grid developer-ui-tuning">
    <Card title="UI TUNING" action={<SlidersHorizontal size={16} aria-hidden="true" />}>
      <p className="muted">Edit safe visual values only. Changes preview immediately and stay outside gameplay saves.</p>
      <div className="developer-ui-tuning-toolbar">
        <label>Target<select value={target} onChange={(event) => setTarget(event.target.value as UITuningTarget)}>{TARGETS.map((entry) => <option key={entry.target} value={entry.target}>{entry.label}</option>)}</select></label>
        <label>Screen<select value={screen} onChange={(event) => setScreen(event.target.value as ScreenId)}>{SCREEN_IDS.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
        {target === 'panelGeometry' && <label>Panel<select value={panelId} onChange={(event) => setPanelId(event.target.value)}>{panels.map((id) => <option key={id} value={id}>{getPanelLayout(screen, id).label ?? id}</option>)}</select></label>}
        <label>Scope<select value={effectiveScope} disabled={effectiveScope === 'screen' && (target === 'panelGeometry' || target === 'screenLayout')} onChange={(event) => setScope(event.target.value as 'global' | 'screen')}><option value="screen">This screen</option><option value="global">All screens</option></select></label>
      </div>
      <div className="developer-ui-tuning-selection"><strong>{selectedTarget.label}</strong><span>{selectedTarget.description}</span></div>
      <div className="developer-ui-tuning-fields">{groups.map((group) => <section key={group.section} className="developer-ui-tuning-group"><span className="developer-ui-tuning-group-label">{group.section}</span><div className="developer-ui-tuning-field-grid">{group.fields.map((field) => { const value = fieldValue(field.target, field.key, screen, panelId, effectiveScope); return <label className="developer-ui-tuning-field" key={`${field.target}.${field.key}`}><span>{field.label}<small>{field.unit ?? 'number'}</small></span><div><input type="number" min={field.min} max={field.max} step={field.step} value={value} onChange={(event) => { const next = Number(event.currentTarget.value); if (Number.isFinite(next)) updateField(field, next) }} /><GameTooltip content={`Reset ${field.label}`}><button type="button" className="developer-ui-tuning-reset" aria-label={`Reset ${field.label}`} onClick={() => resetField(field)}><RotateCcw size={12} aria-hidden="true" /></button></GameTooltip></div></label> })}</div></section>)}</div>
      <div className="developer-ui-tuning-actions"><Button variant="secondary" onClick={resetTarget}>Reset target</Button><Button variant="danger" onClick={() => { resetAllUITuning(); setMessage('All UI tuning reset') }}>Reset all</Button><Button variant="ghost" onClick={downloadDraft}><Download size={14} /> Export JSON</Button><Button variant="ghost" onClick={() => fileRef.current?.click()}><FileUp size={14} /> Import JSON</Button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => { void onImportFile(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} /></div>
      <div className="developer-ui-tuning-footer">{message && <Status tone={message.includes('rejected') ? 'warning' : 'success'}>{message}</Status>}<Button variant="ghost" onClick={() => copy('UI tuning draft', exportUITuningDraft())}>Copy draft</Button><span>Default source: <code>src/ui/config/uiTuning.ts</code></span></div>
    </Card>
    <Card title="TUNING CONTRACT"><div className="developer-ui-tuning-contract"><span><b>Resolver order</b> editor draft → screen override → component default → safe fallback</span><span><b>Draft location</b> in-memory Developer Tools state only</span><span><b>Protected</b> gameplay, save schema, overflow, position, z-index, transforms, and animation</span></div><pre className="developer-json">{JSON.stringify({ version: UI_TUNING.version, target, screen, scope: effectiveScope, panel: target === 'panelGeometry' ? panelId : undefined }, null, 2)}</pre></Card>
  </div>
}
