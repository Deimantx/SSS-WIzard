import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { LAYOUT_VERSION, type SavedPanelLayout, type UiLayoutDocument } from './layoutEditorTypes'
import { clampTopbarLayout, DEFAULT_TOPBAR_LAYOUT } from './shellLayout'

export const UI_LAYOUTS_KEY = 'sss-wizard-ui-layout-v3'
const LEGACY_UI_LAYOUTS_KEY = 'sss-wizard-ui-layout-v2'

const blankDocument = (): UiLayoutDocument => ({ version: LAYOUT_VERSION, screens: {}, shell: { topbar: clampTopbarLayout(DEFAULT_TOPBAR_LAYOUT) } })
const validNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback

const normalizePanel = (screen: ScreenId, id: string, value: unknown): SavedPanelLayout | null => {
  const fallback = DEFAULT_LAYOUTS[screen]?.[id]
  if (!fallback || !value || typeof value !== 'object') return null
  const candidate = value as Partial<SavedPanelLayout>
  return { x: Math.max(0, Math.round(validNumber(candidate.x, fallback.x))), y: Math.max(0, Math.round(validNumber(candidate.y, fallback.y))), w: Math.max(1, Math.round(validNumber(candidate.w, fallback.w))), h: Math.max(1, Math.round(validNumber(candidate.h, fallback.h))), ...(candidate.hidden === true ? { hidden: true } : {}), ...(candidate.locked === true ? { locked: true } : {}) }
}

export function loadUiLayouts(): UiLayoutDocument {
  if (typeof window === 'undefined') return blankDocument()
  try {
    const raw = window.localStorage.getItem(UI_LAYOUTS_KEY) ?? window.localStorage.getItem(LEGACY_UI_LAYOUTS_KEY)
    if (!raw) return blankDocument()
    const parsed = JSON.parse(raw) as Partial<UiLayoutDocument>
    const screens: UiLayoutDocument['screens'] = {}
    for (const screen of Object.keys(DEFAULT_LAYOUTS) as ScreenId[]) {
      const rawSource = parsed.screens?.[screen]
      if (!rawSource || typeof rawSource !== 'object') continue
      const source = screen === 'tower-channeling' && !('channeling-pillars' in rawSource) && 'channeling-infrastructure' in rawSource
        ? { ...rawSource, 'channeling-pillars': rawSource['channeling-infrastructure'] }
        : rawSource
      if (screen === 'tower-channeling' && ('channeling-main' in source || 'channeling-stats' in source)) continue
      const panels: Record<string, SavedPanelLayout> = {}
      for (const [id, value] of Object.entries(source)) { const normalized = normalizePanel(screen, id, value); if (normalized) panels[id] = normalized }
      if (Object.keys(panels).length) screens[screen] = panels
    }
    return { version: LAYOUT_VERSION, screens, shell: { topbar: clampTopbarLayout(parsed.shell?.topbar) } }
  } catch { return blankDocument() }
}

export function saveUiLayouts(document: UiLayoutDocument) {
  if (typeof window !== 'undefined') window.localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: LAYOUT_VERSION, screens: document.screens, shell: document.shell }))
}

export function resetUiLayouts() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(UI_LAYOUTS_KEY)
}
