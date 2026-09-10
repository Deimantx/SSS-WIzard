import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { getPanelDefinition } from './panelRegistry'
import { GRID_COLUMNS, LAYOUT_VERSION, type SavedPanelLayout, type ScreenLayouts, type UiLayoutDocument } from './layoutEditorTypes'
import { clampTopbarLayout, DEFAULT_TOPBAR_LAYOUT } from './shellLayout'

export const UI_LAYOUTS_KEY = 'sss-wizard-ui-layout'
const LEGACY_UI_LAYOUTS_KEYS = ['sss-wizard-ui-layout-v14', 'sss-wizard-ui-layout-v13', 'sss-wizard-ui-layout-v12', 'sss-wizard-ui-layout-v11', 'sss-wizard-ui-layout-v10', 'sss-wizard-ui-layout-v9', 'sss-wizard-ui-layout-v8', 'sss-wizard-ui-layout-v7', 'sss-wizard-ui-layout-v6', 'sss-wizard-ui-layout-v5', 'sss-wizard-ui-layout-v4', 'sss-wizard-ui-layout-v3', 'sss-wizard-ui-layout-v2'] as const

const blankDocument = (): UiLayoutDocument => ({ version: LAYOUT_VERSION, screens: {}, shell: { topbar: clampTopbarLayout(DEFAULT_TOPBAR_LAYOUT) } })
const validNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback

type StoredLayoutSource = { raw: string; isLegacyKey: boolean }

function readCurrentOrLegacyUiLayout(): StoredLayoutSource | null {
  const current = window.localStorage.getItem(UI_LAYOUTS_KEY)
  if (current) return { raw: current, isLegacyKey: false }
  for (const key of LEGACY_UI_LAYOUTS_KEYS) {
    const raw = window.localStorage.getItem(key)
    if (raw) return { raw, isLegacyKey: true }
  }
  return null
}

function persistCurrentLayout(document: UiLayoutDocument) {
  window.localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify(document))
}

function normalizePanel(screen: ScreenId, id: string, value: unknown): SavedPanelLayout | null {
  const panel = getPanelDefinition(screen, id)
  if (!panel || !value || typeof value !== 'object') return null
  const candidate = value as Partial<SavedPanelLayout>
  const base = panel.defaultLayout
  const minW = panel.minW ?? 1
  const maxW = Math.min(panel.maxW ?? GRID_COLUMNS, GRID_COLUMNS)
  const minH = panel.minH ?? 1
  const maxH = panel.maxH ?? Number.MAX_SAFE_INTEGER
  const w = Math.max(minW, Math.min(maxW, Math.round(validNumber(candidate.w, base.w))))
  const h = Math.max(minH, Math.min(maxH, Math.round(validNumber(candidate.h, base.h))))
  const x = Math.max(0, Math.min(GRID_COLUMNS - w, Math.round(validNumber(candidate.x, base.x))))
  const y = Math.max(0, Math.round(validNumber(candidate.y, base.y)))
  return { x, y, w, h, ...(candidate.hidden === true ? { hidden: true } : {}), ...(candidate.locked === true ? { locked: true } : {}) }
}

function normalizeCurrentVersionScreens(value: unknown): UiLayoutDocument['screens'] {
  if (!value || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>
  const screens: UiLayoutDocument['screens'] = {}
  for (const screen of Object.keys(DEFAULT_LAYOUTS) as ScreenId[]) {
    const rawScreen = source[screen]
    if (!rawScreen || typeof rawScreen !== 'object') continue
    const panels: ScreenLayouts = {}
    for (const [id, panelValue] of Object.entries(rawScreen)) {
      const normalized = normalizePanel(screen, id, panelValue)
      if (normalized) panels[id] = normalized
    }
    if (Object.keys(panels).length) screens[screen] = panels
  }
  return screens
}

export function loadUiLayouts(): UiLayoutDocument {
  if (typeof window === 'undefined') return blankDocument()
  try {
    const source = readCurrentOrLegacyUiLayout()
    if (!source) return blankDocument()
    const parsed = JSON.parse(source.raw) as Partial<UiLayoutDocument>
    const shell = { topbar: clampTopbarLayout(parsed.shell?.topbar) }

    // Intentional development-stage policy: old screen geometry is discarded
    // on any layout-version change. Screens evolve frequently, so preserving
    // historical panel coordinates causes invalid compositions.
    if (source.isLegacyKey || parsed.version !== LAYOUT_VERSION) {
      const resetDocument: UiLayoutDocument = { version: LAYOUT_VERSION, screens: {}, shell }
      persistCurrentLayout(resetDocument)
      return resetDocument
    }

    return { version: LAYOUT_VERSION, screens: normalizeCurrentVersionScreens(parsed.screens), shell }
  } catch {
    return blankDocument()
  }
}

export function saveUiLayouts(document: UiLayoutDocument) {
  if (typeof window !== 'undefined') persistCurrentLayout({ version: LAYOUT_VERSION, screens: document.screens, shell: document.shell })
}

export function resetUiLayouts() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(UI_LAYOUTS_KEY)
    LEGACY_UI_LAYOUTS_KEYS.forEach((key) => window.localStorage.removeItem(key))
  }
}
