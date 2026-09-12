import { useSyncExternalStore } from 'react'
import type { ScreenId } from '../../game/types'
import { getRegisteredUiElement } from './uiEditorRegistry'
import { getUiPropertyDefinitions } from './uiEditorProperties'
import { getDefaultUiPreset, loadUiEditorState, saveUiEditorRecovery, saveUiEditorState, validateUiPreset, normalizeUiPreset, type StoredUiEditorState } from './uiEditorStorage'
import { migrateUiPreset } from './uiEditorMigrations'
import { type UiOverrideScope, type UiPreset, type UiStyleKey, type UiStyleOverride, type UiStyleValue } from './uiEditorTypes'

interface UiHistoryEntry { preset: UiPreset; label: string }
interface UiEditorState { activePresetId: string; presets: Record<string, UiPreset>; selectedUiId: string | null; hoveredUiId: string | null; tool: 'select' | 'move' | 'resize'; previewMode: boolean; showBounds: boolean; showIds: boolean; inspectorSection: 'inspector' | 'design-system' | 'components'; scope: UiOverrideScope; notice: string | null; undoDepth: number; redoDepth: number; clipboard: UiStyleOverride | null }
const initial = loadUiEditorState()
let current: UiEditorState = { ...initial, selectedUiId: null, hoveredUiId: null, tool: 'select', previewMode: false, showBounds: true, showIds: false, inspectorSection: 'inspector', scope: 'element', notice: null, undoDepth: 0, redoDepth: 0, clipboard: null }
let undoStack: UiHistoryEntry[] = []; let redoStack: UiHistoryEntry[] = []
const listeners = new Set<() => void>(); const emit = () => listeners.forEach((listener) => listener())
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const activePreset = () => current.presets[current.activePresetId] ?? getDefaultUiPreset()
const persist = () => saveUiEditorState({ activePresetId: current.activePresetId, presets: current.presets })
const publish = (changes: Partial<UiEditorState>) => { current = { ...current, ...changes }; emit() }
function commitPreset(next: UiPreset, label: string, record = true) { if (record) { undoStack = [...undoStack.slice(-39), { preset: clone(activePreset()), label }]; redoStack = [] }; next.meta.updatedAt = new Date().toISOString(); current = { ...current, presets: { ...current.presets, [next.meta.id]: next }, undoDepth: undoStack.length, redoDepth: redoStack.length }; persist(); saveUiEditorRecovery(next); emit() }

export const getUiEditorState = () => current
export const subscribeUiEditor = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const useUiEditorStore = <T,>(selector: (state: UiEditorState) => T) => selector(useSyncExternalStore(subscribeUiEditor, getUiEditorState, getUiEditorState))
export const getActiveUiPreset = () => activePreset()
export const setUiEditorSelection = (selectedUiId: string | null) => publish({ selectedUiId })
export const setUiEditorHover = (hoveredUiId: string | null) => { if (current.hoveredUiId !== hoveredUiId) publish({ hoveredUiId }) }
export const setUiEditorTool = (tool: UiEditorState['tool']) => publish({ tool })
export const setUiEditorPreview = (previewMode: boolean) => publish({ previewMode })
export const setUiEditorOption = (key: 'showBounds' | 'showIds', value: boolean) => publish({ [key]: value })
export const setUiEditorSection = (inspectorSection: UiEditorState['inspectorSection']) => publish({ inspectorSection })
export const setUiEditorScope = (scope: UiOverrideScope) => publish({ scope })
export const setUiEditorNotice = (notice: string | null) => publish({ notice })

export function setUiStyleProperty(uiId: string, key: UiStyleKey, value: UiStyleValue | undefined, scope: UiOverrideScope = current.scope) {
  const entry = getRegisteredUiElement(uiId); const preset = clone(activePreset()); if (!entry) return
  if (scope === 'component' && entry.componentType) { const existing = preset.componentStyles?.[entry.componentType] ?? {}; const next = { ...existing }; if (value === undefined) delete next[key]; else (next as Record<string, unknown>)[key] = value; preset.componentStyles = { ...preset.componentStyles, [entry.componentType]: next } }
  else if (scope === 'screen') { const screen = entry.screen as ScreenId; const screenStyles: Record<string, UiStyleOverride> = { ...(preset.screens?.[screen] ?? {}) }; const next = { ...(screenStyles[entry.id] ?? {}) }; if (value === undefined) delete next[key]; else (next as Record<string, unknown>)[key] = value; preset.screens = { ...preset.screens, [screen]: { ...screenStyles, [entry.id]: next } } }
  else { const next = { ...(preset.elements?.[uiId] ?? {}) }; if (value === undefined) delete next[key]; else (next as Record<string, unknown>)[key] = value; preset.elements = { ...preset.elements, [uiId]: next } }
  commitPreset(preset, `Change ${key} on ${uiId}`)
}

export function setUiToken(path: string, value: UiStyleValue | undefined) {
  const preset = clone(activePreset()); const [group, token] = path.split('.') as [keyof NonNullable<UiPreset['tokens']>, string]; const tokens = { ...(preset.tokens ?? {}) } as Record<string, Record<string, unknown>>; tokens[group] = { ...(tokens[group] ?? {}) }; if (value === undefined) delete tokens[group][token]; else tokens[group][token] = value; preset.tokens = tokens as UiPreset['tokens']; commitPreset(preset, `Change token ${path}`)
}
export function resetUiStyleProperty(uiId: string, key: UiStyleKey, scope: UiOverrideScope = current.scope) { setUiStyleProperty(uiId, key, undefined, scope) }
export function resetUiSection(uiId: string, category: 'layout' | 'position' | 'typography' | 'image' | 'appearance' | 'effects', scope: UiOverrideScope = current.scope) {
  const entry = getRegisteredUiElement(uiId); const preset = clone(activePreset()); if (!entry) return
  const keys = getUiPropertyDefinitions(entry.type).filter((definition) => definition.category === category).map((definition) => definition.key)
  const remove = (style: UiStyleOverride) => { const next = { ...style }; for (const key of keys) delete next[key]; return next }
  if (scope === 'component' && entry.componentType && preset.componentStyles?.[entry.componentType]) preset.componentStyles = { ...preset.componentStyles, [entry.componentType]: remove(preset.componentStyles[entry.componentType]) }
  else if (scope === 'screen') { const screen = entry.screen as ScreenId; const styles: Record<string, UiStyleOverride> = { ...(preset.screens?.[screen] ?? {}) }; if (styles[uiId]) styles[uiId] = remove(styles[uiId]); preset.screens = { ...preset.screens, [screen]: styles } }
  else if (preset.elements?.[uiId]) preset.elements = { ...preset.elements, [uiId]: remove(preset.elements[uiId]) }
  else return
  commitPreset(preset, `Reset ${category} on ${uiId}`)
}
export function resetUiElement(uiId: string, scope: UiOverrideScope = current.scope) {
  const entry = getRegisteredUiElement(uiId); const preset = clone(activePreset()); if (!entry) return
  if (scope === 'component' && entry.componentType && preset.componentStyles?.[entry.componentType]) { const next = { ...preset.componentStyles }; delete next[entry.componentType]; preset.componentStyles = next }
  else if (scope === 'screen' && preset.screens?.[entry.screen as ScreenId]?.[uiId]) { const screen = entry.screen as ScreenId; const screenStyles: Record<string, UiStyleOverride> = { ...preset.screens[screen] }; delete screenStyles[uiId]; preset.screens = { ...preset.screens, [screen]: screenStyles } }
  else if (preset.elements?.[uiId]) { const next = { ...preset.elements }; delete next[uiId]; preset.elements = next }
  else return
  commitPreset(preset, `Reset ${uiId}`)
}
export function resetUiScreen(screen: string) { const preset = clone(activePreset()); if (!preset.screens?.[screen as never]) return; const next = { ...preset.screens }; delete next[screen as never]; preset.screens = next; commitPreset(preset, `Reset ${screen}`) }

export function undoUiEditor() { const history = undoStack.pop(); if (!history) return; const now = clone(activePreset()); redoStack.push({ preset: now, label: history.label }); current = { ...current, presets: { ...current.presets, [history.preset.meta.id]: history.preset }, undoDepth: undoStack.length, redoDepth: redoStack.length }; persist(); emit() }
export function redoUiEditor() { const history = redoStack.pop(); if (!history) return; const now = clone(activePreset()); undoStack.push({ preset: now, label: history.label }); current = { ...current, presets: { ...current.presets, [history.preset.meta.id]: history.preset }, undoDepth: undoStack.length, redoDepth: redoStack.length }; persist(); emit() }
export function copyUiStyle(uiId: string, scope: UiOverrideScope = current.scope) { const preset = activePreset(); const entry = getRegisteredUiElement(uiId); if (!entry) return; const copied = scope === 'component' && entry.componentType ? preset.componentStyles?.[entry.componentType] : scope === 'screen' ? preset.screens?.[entry.screen as never]?.[uiId] : preset.elements?.[uiId]; publish({ clipboard: clone(copied ?? {}) }) }
export function pasteUiStyle(uiId: string, scope: UiOverrideScope = current.scope) { if (!current.clipboard) return; const entry = getRegisteredUiElement(uiId); if (!entry) return; const preset = clone(activePreset()); if (scope === 'component' && entry.componentType) preset.componentStyles = { ...preset.componentStyles, [entry.componentType]: clone(current.clipboard) }; else if (scope === 'screen') preset.screens = { ...preset.screens, [entry.screen]: { ...(preset.screens?.[entry.screen as never] ?? {}), [uiId]: clone(current.clipboard) } }; else preset.elements = { ...preset.elements, [uiId]: clone(current.clipboard) }; commitPreset(preset, `Paste style on ${uiId}`) }

export function createUiPreset(name = 'New UI preset') { const base = activePreset(); const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`; const preset: UiPreset = { ...clone(base), meta: { id, name, description: 'Development UI preset', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }; current = { ...current, activePresetId: id, presets: { ...current.presets, [id]: preset }, notice: `${name} created.` }; persist(); emit() }
export function duplicateUiPreset() { createUiPreset(`${activePreset().meta.name} copy`) }
export function renameUiPreset(name: string) { const preset = clone(activePreset()); preset.meta.name = name.trim() || preset.meta.name; commitPreset(preset, `Rename ${preset.meta.name}`, false) }
export function deleteActiveUiPreset() { if (current.activePresetId === 'default') return publish({ notice: 'The Default preset cannot be deleted.' }); const ids = Object.keys(current.presets).filter((id) => id !== current.activePresetId); const activePresetId = ids[0] ?? 'default'; const presets = { ...current.presets }; delete presets[current.activePresetId]; current = { ...current, activePresetId, presets, selectedUiId: null, notice: 'Preset deleted.' }; persist(); emit() }
export function selectUiPreset(id: string) { if (!current.presets[id]) return; current = { ...current, activePresetId: id, selectedUiId: null, notice: null }; persist(); emit() }
export function saveUiEditorPreset() { const preset = clone(activePreset()); preset.meta.updatedAt = new Date().toISOString(); commitPreset(preset, 'Save preset', false); publish({ notice: `${preset.meta.name} saved locally.` }) }
export function importUiPreset(value: unknown) { const migrated = migrateUiPreset(value); const report = validateUiPreset(migrated); if (!report.valid) return report; const preset = normalizeUiPreset(migrated); current = { ...current, activePresetId: preset.meta.id, presets: { ...current.presets, [preset.meta.id]: preset }, notice: `Imported ${preset.meta.name}.` }; persist(); emit(); return report }
export function resetUiPreset() { const preset = getDefaultUiPreset(); preset.meta = clone(activePreset().meta); commitPreset(preset, 'Reset preset') }
export type { UiEditorState }
