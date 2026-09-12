import { useSyncExternalStore } from 'react'
import type { ScreenPanelLayoutOverride } from '../layout/screenPanelLayouts'
import { UI_TUNING_VERSION, type UITuningComponentKey } from './uiTuning'
import { getUITuningFieldSchema, UI_TUNING_SCHEMA, type UITuningTarget } from './uiTuningSchema'

export interface UITuningDraft {
  panel?: Record<string, number>
  typography?: Record<string, number>
  components: Partial<Record<UITuningComponentKey, Record<string, number>>>
  screens: Record<string, {
    panel?: Record<string, number>
    screenLayout?: Record<string, number>
    typography?: Record<string, number>
    components?: Partial<Record<UITuningComponentKey, Record<string, number>>>
  }>
  panels: Record<string, Record<string, ScreenPanelLayoutOverride>>
}

const EMPTY_DRAFT: UITuningDraft = { components: {}, screens: {}, panels: {} }
let current = EMPTY_DRAFT
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const update = (next: UITuningDraft) => { current = next; emit() }
const copyDraft = (): UITuningDraft => ({
  panel: current.panel ? { ...current.panel } : undefined,
  typography: current.typography ? { ...current.typography } : undefined,
  components: Object.fromEntries(Object.entries(current.components).map(([key, values]) => [key, { ...values }])) as UITuningDraft['components'],
  screens: Object.fromEntries(Object.entries(current.screens).map(([screen, values]) => [screen, {
    ...values,
    panel: values.panel ? { ...values.panel } : undefined,
    screenLayout: values.screenLayout ? { ...values.screenLayout } : undefined,
    typography: values.typography ? { ...values.typography } : undefined,
    components: values.components ? Object.fromEntries(Object.entries(values.components).map(([key, fields]) => [key, { ...fields }])) as UITuningDraft['screens'][string]['components'] : undefined,
  }])) as UITuningDraft['screens'],
  panels: Object.fromEntries(Object.entries(current.panels).map(([screen, panels]) => [screen, Object.fromEntries(Object.entries(panels).map(([panelId, values]) => [panelId, { ...values }]))])) as UITuningDraft['panels'],
})

const clamp = (target: UITuningTarget, key: string, value: number) => {
  const schema = getUITuningFieldSchema(target, key)
  if (!schema || !Number.isFinite(value)) return null
  return Math.min(schema.max, Math.max(schema.min, value))
}

const COMPONENT_TARGETS = new Set<UITuningComponentKey>(['inventoryItemCard', 'equipmentItemCard', 'spellCardMagicSchools', 'spellCardCombatDeck', 'statRow', 'tooltip'])
const isComponentTarget = (target: UITuningTarget): target is UITuningComponentKey => COMPONENT_TARGETS.has(target as UITuningComponentKey)
const ensureScreen = (draft: UITuningDraft, screen: string) => { draft.screens[screen] ??= {}; return draft.screens[screen] }

export function getUITuningDraft() { return current }
export function subscribeUITuningDraft(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
export function useUITuningDraft() { return useSyncExternalStore(subscribeUITuningDraft, getUITuningDraft, getUITuningDraft) }

export function setUITuningField(target: UITuningTarget, key: string, value: number, options: { screen?: string; panelId?: string } = {}) {
  const next = copyDraft()
  const clamped = clamp(target, key, value)
  if (clamped === null) return
  if (target === 'panelGeometry') {
    if (!options.screen || !options.panelId) return
    const panels = next.panels[options.screen] ?? (next.panels[options.screen] = {})
    panels[options.panelId] = { ...(panels[options.panelId] ?? {}), [key]: clamped }
  } else if (target === 'screenLayout' || target === 'panel' || target === 'typography') {
    if (target === 'screenLayout' && !options.screen) return
    const screen = options.screen ? ensureScreen(next, options.screen) : undefined
    const bucket = target === 'screenLayout' ? (screen!.screenLayout ?? (screen!.screenLayout = {})) : target === 'typography' ? options.screen ? (screen!.typography ?? (screen!.typography = {})) : (next.typography ?? (next.typography = {})) : options.screen ? (screen!.panel ?? (screen!.panel = {})) : (next.panel ?? (next.panel = {}))
    bucket[key] = clamped
  } else if (isComponentTarget(target)) {
    const bucket = options.screen
      ? (ensureScreen(next, options.screen).components ?? (ensureScreen(next, options.screen).components = {}))
      : next.components
    bucket[target] = { ...(bucket[target] ?? {}), [key]: clamped }
  }
  update(next)
}

export function resetUITuningField(target: UITuningTarget, key: string, options: { screen?: string; panelId?: string } = {}) {
  const next = copyDraft()
  if (target === 'panelGeometry' && options.screen && options.panelId) {
    const panel = next.panels[options.screen]?.[options.panelId]
    if (panel) { delete (panel as Record<string, unknown>)[key]; if (Object.keys(panel).length === 0) delete next.panels[options.screen][options.panelId] }
  } else if (target === 'screenLayout' || target === 'panel' || target === 'typography') {
    const screen = next.screens[options.screen ?? '']
    const values = target === 'screenLayout' ? screen?.screenLayout : target === 'typography' ? options.screen ? screen?.typography : next.typography : options.screen ? screen?.panel : next.panel
    if (values) { delete values[key]; if (Object.keys(values).length === 0) { if (options.screen && screen) delete screen[target]; else if (target === 'panel') delete next.panel; else if (target === 'typography') delete next.typography } }
  } else if (isComponentTarget(target)) {
    const values = options.screen ? next.screens[options.screen]?.components?.[target] : next.components[target]
    if (values) { delete values[key]; if (Object.keys(values).length === 0 && options.screen) delete next.screens[options.screen].components![target]; }
  }
  update(next)
}

export function resetUITuningTarget(target: UITuningTarget, options: { screen?: string; panelId?: string } = {}) {
  const next = copyDraft()
  if (target === 'panelGeometry' && options.screen && options.panelId) delete next.panels[options.screen]?.[options.panelId]
  else if (target === 'panel' || target === 'screenLayout' || target === 'typography') {
    if (options.screen) delete next.screens[options.screen]?.[target]
    else if (target === 'panel') delete next.panel
    else if (target === 'typography') delete next.typography
  }
  else if (isComponentTarget(target)) {
    if (options.screen) delete next.screens[options.screen]?.components?.[target]
    else delete next.components[target]
  }
  update(next)
}

export function resetAllUITuning() { update(EMPTY_DRAFT) }

export function exportUITuningDraft() {
  return { version: UI_TUNING_VERSION, panel: current.panel, typography: current.typography, components: current.components, screens: current.screens, panels: current.panels }
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }

function sanitizeFields(target: UITuningTarget, value: unknown) {
  if (!isRecord(value)) return undefined
  const output: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== 'number') continue
    const clamped = clamp(target, key, raw)
    if (clamped !== null) output[key] = clamped
  }
  return Object.keys(output).length > 0 ? output : undefined
}

export function importUITuningDraft(value: unknown): boolean {
  if (!isRecord(value) || (value.version !== undefined && value.version !== UI_TUNING_VERSION)) return false
  const next: UITuningDraft = { components: {}, screens: {}, panels: {} }
  const panel = sanitizeFields('panel', value.panel)
  const typography = sanitizeFields('typography', value.typography)
  if (panel) next.panel = panel
  if (typography) next.typography = typography
  if (isRecord(value.components)) {
    for (const [target, raw] of Object.entries(value.components)) {
      if (isComponentTarget(target as UITuningTarget)) {
        const fields = sanitizeFields(target as UITuningComponentKey, raw)
        if (fields) next.components[target as UITuningComponentKey] = fields
      }
    }
  }
  if (isRecord(value.screens)) {
    for (const [screenId, rawScreen] of Object.entries(value.screens)) {
      if (!isRecord(rawScreen)) continue
      const screen: UITuningDraft['screens'][string] = {}
      const panel = sanitizeFields('panel', rawScreen.panel)
      const screenLayout = sanitizeFields('screenLayout', rawScreen.screenLayout)
      const typography = sanitizeFields('typography', rawScreen.typography)
      if (panel) screen.panel = panel
      if (screenLayout) screen.screenLayout = screenLayout
      if (typography) screen.typography = typography
      if (isRecord(rawScreen.components)) {
        for (const [target, fieldsRaw] of Object.entries(rawScreen.components)) {
          if (!isComponentTarget(target as UITuningTarget)) continue
          const fields = sanitizeFields(target as UITuningComponentKey, fieldsRaw)
          if (fields) (screen.components ??= {})[target as UITuningComponentKey] = fields
        }
      }
      if (screen.panel || screen.screenLayout || screen.typography || screen.components) next.screens[screenId] = screen
    }
  }
  if (isRecord(value.panels)) {
    for (const [screenId, rawPanels] of Object.entries(value.panels)) {
      if (!isRecord(rawPanels)) continue
      for (const [panelId, rawPanel] of Object.entries(rawPanels)) {
        const fields = sanitizeFields('panelGeometry', rawPanel)
        if (fields) (next.panels[screenId] ??= {})[panelId] = fields as ScreenPanelLayoutOverride
      }
    }
  }
  update(next)
  return true
}
