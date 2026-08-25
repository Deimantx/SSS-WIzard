import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { LAYOUT_VERSION, type SavedPanelLayout, type UiLayoutDocument } from './layoutEditorTypes'

export const UI_LAYOUTS_KEY = 'sss-wizard-ui-layout-v2'

const blankDocument = (): UiLayoutDocument => ({ version: LAYOUT_VERSION, screens: {} })
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
    const raw = window.localStorage.getItem(UI_LAYOUTS_KEY)
    if (!raw) return blankDocument()
    const parsed = JSON.parse(raw) as Partial<UiLayoutDocument>
    const screens: UiLayoutDocument['screens'] = {}
    for (const screen of Object.keys(DEFAULT_LAYOUTS) as ScreenId[]) {
      const source = parsed.screens?.[screen]
      if (!source || typeof source !== 'object') continue
      if (screen === 'tower-channeling' && ('channeling-main' in source || 'channeling-stats' in source)) continue
      const panels: Record<string, SavedPanelLayout> = {}
      for (const [id, value] of Object.entries(source)) { const normalized = normalizePanel(screen, id, value); if (normalized) panels[id] = normalized }
      if (Object.keys(panels).length) screens[screen] = panels
    }
    return { version: LAYOUT_VERSION, screens }
  } catch { return blankDocument() }
}

export function saveUiLayouts(document: UiLayoutDocument) {
  if (typeof window !== 'undefined') window.localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: LAYOUT_VERSION, screens: document.screens }))
}

export function resetUiLayouts() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(UI_LAYOUTS_KEY)
}
