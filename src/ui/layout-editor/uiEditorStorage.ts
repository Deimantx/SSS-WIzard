import defaultUiPreset from '../presets/default-ui.json'
import type { ScreenId } from '../../game/types'
import { getUiPropertyDefinition, isUiStyleKey } from './uiEditorProperties'
import { getRegisteredUiElements, getUiRegistryDuplicates } from './uiEditorRegistry'
import { migrateUiPreset } from './uiEditorMigrations'
import { UI_EDITOR_GAME_VERSION, UI_EDITOR_PREVIEW_ZOOMS, UI_EDITOR_SCHEMA_VERSION, type UiLength, type UiPreset, type UiStyleOverride, type UiValidationIssue, type UiValidationReport } from './uiEditorTypes'
import { DEFAULT_UI_EDITOR_WORKSPACE } from './uiEditorWorkspaceMode'
import type { UiEditorPane, UiEditorPreviewZoom } from './uiEditorTypes'

export const UI_EDITOR_STORAGE_KEY = 'sss-wizard.dev.ui-editor-v1'
export const UI_EDITOR_RECOVERY_KEY = 'sss-wizard.dev.ui-editor-recovery-v1'
export const UI_EDITOR_WORKSPACE_KEY = 'sss-wizard.dev.ui-editor-workspace-v1'

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const now = () => new Date().toISOString()
const isDevelopment = () => Boolean(import.meta.env.DEV)

export function getDefaultUiPreset(): UiPreset {
  const source = clone(defaultUiPreset) as UiPreset
  return { ...source, schemaVersion: UI_EDITOR_SCHEMA_VERSION, gameUiVersion: UI_EDITOR_GAME_VERSION, meta: { ...source.meta, updatedAt: now() } }
}

export interface StoredUiEditorState { activePresetId: string; presets: Record<string, UiPreset> }
export interface StoredUiEditorWorkspace { activePane: UiEditorPane; hierarchyVisible: boolean; inspectorVisible: boolean; inspectorWidth: number; hierarchyWidth: number; previewZoom: UiEditorPreviewZoom }
const blankState = (): StoredUiEditorState => { const preset = getDefaultUiPreset(); return { activePresetId: preset.meta.id, presets: { [preset.meta.id]: preset } } }

export function loadUiEditorWorkspace(): StoredUiEditorWorkspace {
  if (!isDevelopment() || typeof localStorage === 'undefined') return { ...DEFAULT_UI_EDITOR_WORKSPACE }
  try {
    const value = JSON.parse(localStorage.getItem(UI_EDITOR_WORKSPACE_KEY) ?? 'null') as Partial<StoredUiEditorWorkspace> | null
    const activePane = ['canvas', 'inspector', 'hierarchy', 'design-system', 'presets'].includes(String(value?.activePane)) ? value?.activePane as UiEditorPane : DEFAULT_UI_EDITOR_WORKSPACE.activePane
    const previewZoom = UI_EDITOR_PREVIEW_ZOOMS.includes(value?.previewZoom as UiEditorPreviewZoom) ? value?.previewZoom as UiEditorPreviewZoom : DEFAULT_UI_EDITOR_WORKSPACE.previewZoom
    return { activePane, hierarchyVisible: value?.hierarchyVisible !== false, inspectorVisible: value?.inspectorVisible !== false, inspectorWidth: clampWorkspaceWidth(value?.inspectorWidth, 390, 520, DEFAULT_UI_EDITOR_WORKSPACE.inspectorWidth), hierarchyWidth: clampWorkspaceWidth(value?.hierarchyWidth, 220, 320, DEFAULT_UI_EDITOR_WORKSPACE.hierarchyWidth), previewZoom }
  } catch { return { ...DEFAULT_UI_EDITOR_WORKSPACE } }
}

export function saveUiEditorWorkspace(value: StoredUiEditorWorkspace) { if (isDevelopment() && typeof localStorage !== 'undefined') localStorage.setItem(UI_EDITOR_WORKSPACE_KEY, JSON.stringify(value)) }
function clampWorkspaceWidth(value: unknown, min: number, max: number, fallback: number) { const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback; return Math.max(min, Math.min(max, Math.round(number))) }

export function loadUiEditorState(): StoredUiEditorState {
  if (!isDevelopment() || typeof localStorage === 'undefined') return blankState()
  try {
    const parsed = JSON.parse(localStorage.getItem(UI_EDITOR_STORAGE_KEY) ?? 'null') as Partial<StoredUiEditorState> | null
    if (!parsed?.presets || !isRecord(parsed.presets)) return blankState()
    const presets: Record<string, UiPreset> = {}
    for (const [id, value] of Object.entries(parsed.presets)) { const migrated = migrateUiPreset(value); const report = validateUiPreset(migrated); if (report.valid && isRecord(migrated)) presets[id] = normalizeUiPreset(migrated) }
    if (!Object.keys(presets).length) return blankState()
    const activePresetId = typeof parsed.activePresetId === 'string' && presets[parsed.activePresetId] ? parsed.activePresetId : Object.keys(presets)[0]
    return { activePresetId, presets }
  } catch { return blankState() }
}

export function saveUiEditorState(state: StoredUiEditorState) { if (isDevelopment() && typeof localStorage !== 'undefined') localStorage.setItem(UI_EDITOR_STORAGE_KEY, JSON.stringify(state)) }
export function saveUiEditorRecovery(preset: UiPreset) { if (isDevelopment() && typeof localStorage !== 'undefined') localStorage.setItem(UI_EDITOR_RECOVERY_KEY, JSON.stringify(preset)) }
export function clearUiEditorStorage() { if (isDevelopment() && typeof localStorage !== 'undefined') { localStorage.removeItem(UI_EDITOR_STORAGE_KEY); localStorage.removeItem(UI_EDITOR_RECOVERY_KEY); localStorage.removeItem(UI_EDITOR_WORKSPACE_KEY) } }

function validLength(value: unknown): value is UiLength {
  if (!isRecord(value)) return false
  if (value.keyword === 'auto') return true
  return typeof value.value === 'number' && Number.isFinite(value.value) && value.value >= -2000 && value.value <= 4000 && ['px', '%', 'rem', 'fr'].includes(String(value.unit))
}
function validColor(value: unknown) { return isRecord(value) && (typeof value.token === 'string' || typeof value.custom === 'string') }
function validStyleValue(key: string, value: unknown) {
  const definition = getUiPropertyDefinition(key as never)
  if (!definition) return false
  if (definition.valueType === 'length') return validLength(value)
  if (definition.valueType === 'number') return typeof value === 'number' && Number.isFinite(value) && (definition.min === undefined || value >= definition.min) && (definition.max === undefined || value <= definition.max)
  if (definition.valueType === 'enum') return typeof value === 'string' && definition.allowedValues?.includes(value)
  if (definition.valueType === 'color') return validColor(value)
  return typeof value === 'string' && value.length <= 200
}

function validateStyle(issues: UiValidationIssue[], path: string, style: unknown) {
  if (!isRecord(style)) { issues.push({ severity: 'ERROR', path, message: 'Expected a style object.' }); return 0 }
  let validChanges = 0
  for (const [key, value] of Object.entries(style)) {
    if (!isUiStyleKey(key)) issues.push({ severity: 'ERROR', path: `${path}.${key}`, message: 'Unsupported UI property.' })
    else if (!validStyleValue(key, value)) issues.push({ severity: 'ERROR', path: `${path}.${key}`, message: 'Invalid or unsafe value.' })
    else validChanges += 1
  }
  return validChanges
}

export function validateUiPreset(value: unknown): UiValidationReport {
  const issues: UiValidationIssue[] = []
  if (!isRecord(value)) return { valid: false, issues: [{ severity: 'ERROR', path: '$', message: 'Preset must be a JSON object.' }], validChanges: 0 }
  if (value.schemaVersion !== UI_EDITOR_SCHEMA_VERSION) issues.push({ severity: 'ERROR', path: 'schemaVersion', message: `Unsupported schema version. Expected ${UI_EDITOR_SCHEMA_VERSION}.` })
  if (typeof value.gameUiVersion !== 'number') issues.push({ severity: 'ERROR', path: 'gameUiVersion', message: 'gameUiVersion must be a number.' })
  if (!isRecord(value.meta) || typeof value.meta.id !== 'string' || typeof value.meta.name !== 'string') issues.push({ severity: 'ERROR', path: 'meta', message: 'Preset metadata is incomplete.' })
  let validChanges = 0
  if (value.elements !== undefined) { if (!isRecord(value.elements)) issues.push({ severity: 'ERROR', path: 'elements', message: 'elements must be an object.' }); else for (const [id, style] of Object.entries(value.elements)) validChanges += validateStyle(issues, `elements.${id}`, style) }
  if (value.componentStyles !== undefined) { if (!isRecord(value.componentStyles)) issues.push({ severity: 'ERROR', path: 'componentStyles', message: 'componentStyles must be an object.' }); else for (const [id, style] of Object.entries(value.componentStyles)) validChanges += validateStyle(issues, `componentStyles.${id}`, style) }
  if (value.screens !== undefined) { if (!isRecord(value.screens)) issues.push({ severity: 'ERROR', path: 'screens', message: 'screens must be an object.' }); else for (const [screen, screenStyles] of Object.entries(value.screens)) { if (!isRecord(screenStyles)) issues.push({ severity: 'ERROR', path: `screens.${screen}`, message: 'Screen styles must be an object.' }); else for (const [id, style] of Object.entries(screenStyles)) validChanges += validateStyle(issues, `screens.${screen}.${id}`, style) } }
  issues.push(...findUiPresetOrphans(value))
  return { valid: !issues.some((issue) => issue.severity === 'ERROR'), issues, validChanges }
}

export function findUiPresetOrphans(value: unknown): UiValidationIssue[] {
  if (!isRecord(value)) return []
  const registered = getRegisteredUiElements()
  if (!registered.length) return []
  const knownIds = new Set(registered.map((entry) => entry.id))
  const knownScreens = new Set(registered.map((entry) => entry.screen))
  const knownComponents = new Set(registered.flatMap((entry) => entry.componentType ? [entry.componentType] : []))
  const duplicates = new Set(getUiRegistryDuplicates())
  const issues: UiValidationIssue[] = []
  const checkId = (id: string, path: string) => { if (!knownIds.has(id) && !duplicates.has(id)) issues.push({ severity: 'WARNING', path, message: `Orphan UI ID: ${id} is not registered on the current UI.` }) }
  if (isRecord(value.elements)) for (const id of Object.keys(value.elements)) checkId(id, `elements.${id}`)
  if (isRecord(value.screens)) for (const [screen, styles] of Object.entries(value.screens)) { if (!knownScreens.has(screen)) issues.push({ severity: 'WARNING', path: `screens.${screen}`, message: `Orphan screen: ${screen} is not registered.` }); if (isRecord(styles)) for (const id of Object.keys(styles)) checkId(id, `screens.${screen}.${id}`) }
  if (isRecord(value.componentStyles)) for (const id of Object.keys(value.componentStyles)) if (!knownComponents.has(id)) issues.push({ severity: 'WARNING', path: `componentStyles.${id}`, message: `Orphan component type: ${id} has no registered instances.` })
  return issues
}

function sanitizeStyle(value: unknown): UiStyleOverride {
  if (!isRecord(value)) return {}
  const result: UiStyleOverride = {}
  for (const [key, candidate] of Object.entries(value)) if (isUiStyleKey(key) && validStyleValue(key, candidate)) (result as Record<string, unknown>)[key] = candidate
  return result
}

export function normalizeUiPreset(value: unknown): UiPreset {
  const migrated = migrateUiPreset(value)
  const source = isRecord(migrated) ? migrated : {}
  const metaSource = isRecord(source.meta) ? source.meta : {}
  const id = typeof metaSource.id === 'string' ? metaSource.id : `preset-${Date.now()}`
  const elements: Record<string, UiStyleOverride> = {}
  if (isRecord(source.elements)) for (const [key, style] of Object.entries(source.elements)) elements[key] = sanitizeStyle(style)
  const componentStyles: Record<string, UiStyleOverride> = {}
  if (isRecord(source.componentStyles)) for (const [key, style] of Object.entries(source.componentStyles)) componentStyles[key] = sanitizeStyle(style)
  const screens: Partial<Record<ScreenId, Record<string, UiStyleOverride>>> = {}
  if (isRecord(source.screens)) for (const [screen, rawStyles] of Object.entries(source.screens)) if (isRecord(rawStyles)) { const styles: Record<string, UiStyleOverride> = {}; for (const [key, style] of Object.entries(rawStyles)) styles[key] = sanitizeStyle(style); screens[screen as ScreenId] = styles }
  return { schemaVersion: UI_EDITOR_SCHEMA_VERSION, gameUiVersion: typeof source.gameUiVersion === 'number' ? source.gameUiVersion : UI_EDITOR_GAME_VERSION, meta: { id, name: typeof metaSource.name === 'string' ? metaSource.name : 'Imported preset', description: typeof metaSource.description === 'string' ? metaSource.description : '', createdAt: typeof metaSource.createdAt === 'string' ? metaSource.createdAt : now(), updatedAt: now() }, tokens: isRecord(source.tokens) ? source.tokens as UiPreset['tokens'] : {}, componentStyles, screens, elements }
}
