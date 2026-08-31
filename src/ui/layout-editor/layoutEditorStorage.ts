import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { LAYOUT_VERSION, type SavedPanelLayout, type UiLayoutDocument } from './layoutEditorTypes'
import { clampTopbarLayout, DEFAULT_TOPBAR_LAYOUT } from './shellLayout'

export const UI_LAYOUTS_KEY = 'sss-wizard-ui-layout-v5'
const LEGACY_UI_LAYOUTS_KEYS = ['sss-wizard-ui-layout-v4', 'sss-wizard-ui-layout-v3', 'sss-wizard-ui-layout-v2'] as const

const blankDocument = (): UiLayoutDocument => ({ version: LAYOUT_VERSION, screens: {}, shell: { topbar: clampTopbarLayout(DEFAULT_TOPBAR_LAYOUT) } })
const validNumber = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback

const panelFlags = (value: unknown): Pick<SavedPanelLayout, 'hidden' | 'locked'> => {
  if (!value || typeof value !== 'object') return {}
  const candidate = value as Partial<SavedPanelLayout>
  return { ...(candidate.hidden === true ? { hidden: true } : {}), ...(candidate.locked === true ? { locked: true } : {}) }
}

const hasGeometry = (value: unknown, expected: { x: number; y: number; w: number; h: number }) => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SavedPanelLayout>
  return candidate.x === expected.x && candidate.y === expected.y && candidate.w === expected.w && candidate.h === expected.h
}
const hasUnmodifiedGeometry = (value: unknown, expected: { x: number; y: number; w: number; h: number }) => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SavedPanelLayout>
  return hasGeometry(value, expected) && candidate.hidden !== true && candidate.locked !== true
}

const overlaps = (a: SavedPanelLayout, b: SavedPanelLayout) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
const placeMissingPanel = (screen: ScreenId, id: string, panels: Record<string, SavedPanelLayout>) => {
  const fallback = DEFAULT_LAYOUTS[screen]?.[id]
  if (!fallback || panels[id]) return
  let candidate = { ...fallback }
  if (Object.values(panels).some((panel) => overlaps(candidate, panel))) {
    const maxY = Math.max(0, ...Object.values(panels).map((panel) => panel.y + panel.h))
    candidate = { ...fallback, y: maxY }
  }
  panels[id] = candidate
}

const normalizePanel = (screen: ScreenId, id: string, value: unknown): SavedPanelLayout | null => {
  const fallback = DEFAULT_LAYOUTS[screen]?.[id]
  if (!fallback || !value || typeof value !== 'object') return null
  const candidate = value as Partial<SavedPanelLayout>
  return { x: Math.max(0, Math.round(validNumber(candidate.x, fallback.x))), y: Math.max(0, Math.round(validNumber(candidate.y, fallback.y))), w: Math.max(1, Math.round(validNumber(candidate.w, fallback.w))), h: Math.max(1, Math.round(validNumber(candidate.h, fallback.h))), ...(candidate.hidden === true ? { hidden: true } : {}), ...(candidate.locked === true ? { locked: true } : {}) }
}

export function loadUiLayouts(): UiLayoutDocument {
  if (typeof window === 'undefined') return blankDocument()
  try {
    const raw = [UI_LAYOUTS_KEY, ...LEGACY_UI_LAYOUTS_KEYS].map((key) => window.localStorage.getItem(key)).find(Boolean)
    if (!raw) return blankDocument()
    const parsed = JSON.parse(raw) as Partial<UiLayoutDocument>
    const sourceVersion = typeof parsed.version === 'number' ? Number(parsed.version) : 0
    const layoutNeedsMigration = parsed.version !== LAYOUT_VERSION
    const screens: UiLayoutDocument['screens'] = {}
    for (const screen of Object.keys(DEFAULT_LAYOUTS) as ScreenId[]) {
      const rawSource = parsed.screens?.[screen]
      if (!rawSource || typeof rawSource !== 'object') continue
      if (screen === 'schools') {
        const legacySchoolIds = ['school-fire', 'school-water', 'school-earth', 'school-air', 'school-ceiling', 'school-ranks']
        const canonicalSchoolIds = ['schools-browser', 'schools-inspector', 'schools-presets']
        const hasLegacyPanels = legacySchoolIds.some((id) => Object.prototype.hasOwnProperty.call(rawSource, id))
        const hasCanonicalPanels = canonicalSchoolIds.some((id) => Object.prototype.hasOwnProperty.call(rawSource, id))
        if (hasLegacyPanels && !hasCanonicalPanels) {
          // The Schools composition changed completely. Reset only this
          // screen so custom layouts on every other screen survive.
          screens.schools = {}
          continue
        }
      }
      if (screen === 'combat') {
        const legacyCombatIds = ['combat-dungeon', 'combat-enemy', 'combat-timeline', 'combat-spells']
        const hasRemovedIntel = Object.prototype.hasOwnProperty.call(rawSource, 'combat-intel')
        const hasLegacyPanels = legacyCombatIds.some((id) => Object.prototype.hasOwnProperty.call(rawSource, id))
        if (hasRemovedIntel || hasLegacyPanels) {
          // The Combat composition changed completely. Reset only this screen;
          // other screen layouts remain user-owned and untouched.
          screens.combat = {}
          continue
        }
        if (layoutNeedsMigration && hasUnmodifiedGeometry(rawSource['combat-stage'], { x: 0, y: 0, w: 12, h: 16 }) && hasUnmodifiedGeometry(rawSource['combat-spell-deck'], { x: 0, y: 16, w: 12, h: 10 })) {
          screens.combat = {}
          continue
        }
        if (layoutNeedsMigration && hasUnmodifiedGeometry(rawSource['combat-stage'], { x: 0, y: 0, w: 12, h: 14 }) && hasUnmodifiedGeometry(rawSource['combat-spell-deck'], { x: 0, y: 14, w: 12, h: 9 })) {
          screens.combat = {}
          continue
        }
        if (layoutNeedsMigration && hasUnmodifiedGeometry(rawSource['combat-stage'], { x: 0, y: 0, w: 12, h: 14 }) && hasUnmodifiedGeometry(rawSource['combat-spell-deck'], { x: 0, y: 14, w: 12, h: 7 }) && hasUnmodifiedGeometry(rawSource['combat-log'], { x: 0, y: 21, w: 12, h: 8 })) {
          screens.combat = {}
          continue
        }
      }
      let combatSource: Record<string, unknown> | undefined
      const requiresLegacyCombatMigration = screen === 'combat' && Object.prototype.hasOwnProperty.call(rawSource, 'combat-stage') && Object.prototype.hasOwnProperty.call(rawSource, 'combat-spell-deck') && (Object.prototype.hasOwnProperty.call(rawSource, 'combat-log') || (layoutNeedsMigration && sourceVersion !== 4))
      if (requiresLegacyCombatMigration) {
        const rawDeck = rawSource['combat-spell-deck'] as Partial<SavedPanelLayout>
        const rawDetails = rawSource['combat-details'] as Partial<SavedPanelLayout> | undefined
        const rawLog = rawSource['combat-log'] as Partial<SavedPanelLayout> | undefined
        const deckY = validNumber(rawDeck.y, DEFAULT_LAYOUTS.combat['combat-spell-deck'].y)
        const deckH = Math.max(1, Math.round(validNumber(rawDeck.h, DEFAULT_LAYOUTS.combat['combat-spell-deck'].h)))
        const detailsY = Math.max(deckY + deckH, validNumber(rawDetails?.y, validNumber(rawLog?.y, DEFAULT_LAYOUTS.combat['combat-details'].y)))
        const withoutPermanentLog = Object.fromEntries(Object.entries(rawSource).filter(([id]) => id !== 'combat-log'))
        const detailsBase = rawDetails ?? DEFAULT_LAYOUTS.combat['combat-details']
        combatSource = {
          ...withoutPermanentLog,
          'combat-details': {
            ...detailsBase,
            x: layoutNeedsMigration || !rawDetails ? 0 : validNumber(detailsBase.x, 0),
            y: detailsY,
            w: layoutNeedsMigration || !rawDetails ? 12 : Math.max(1, Math.round(validNumber(detailsBase.w, 12))),
          },
        }
      }
      const source = screen === 'tower-channeling' && !('channeling-pillars' in rawSource) && 'channeling-infrastructure' in rawSource
        ? { ...rawSource, 'channeling-pillars': rawSource['channeling-infrastructure'] }
        : screen === 'tower-research' && ('research-config' in rawSource || 'research-queue' in rawSource)
          ? {
              ...rawSource,
              'research-library': { ...DEFAULT_LAYOUTS['tower-research']['research-library'], ...panelFlags(rawSource['research-config']) },
              'research-inspector': { ...DEFAULT_LAYOUTS['tower-research']['research-inspector'], ...panelFlags(rawSource['research-queue']) },
              'research-prepared': { ...DEFAULT_LAYOUTS['tower-research']['research-prepared'] },
            }
          : combatSource ?? rawSource
      if (screen === 'tower-channeling' && ('channeling-main' in source || 'channeling-stats' in source)) continue
      const panels: Record<string, SavedPanelLayout> = {}
      for (const [id, value] of Object.entries(source)) { const normalized = normalizePanel(screen, id, value); if (normalized) panels[id] = normalized }
      if (screen === 'combat' && !panels['combat-dungeon-statistics']) {
        const details = panels['combat-details']
        const oldDefaultDetails = details && hasUnmodifiedGeometry(details, { x: 0, y: 21, w: 12, h: 8 })
        if (oldDefaultDetails) {
          panels['combat-details'] = { ...details, x: 0, w: 7 }
          panels['combat-dungeon-statistics'] = { ...DEFAULT_LAYOUTS.combat['combat-dungeon-statistics'], y: details.y }
        } else if (details && details.x === 0 && details.w >= 6 && details.w <= 8) {
          const statisticsWidth = 12 - details.w
          panels['combat-dungeon-statistics'] = statisticsWidth >= 4
            ? { ...DEFAULT_LAYOUTS.combat['combat-dungeon-statistics'], x: details.w, y: details.y, w: statisticsWidth, h: details.h }
            : { ...DEFAULT_LAYOUTS.combat['combat-dungeon-statistics'], y: Math.max(0, details.y + details.h) }
        } else {
          placeMissingPanel(screen, 'combat-dungeon-statistics', panels)
        }
      }
      if (screen === 'tower-research' && hasGeometry(source['research-library'], { x: 0, y: 0, w: 6, h: 10 }) && hasGeometry(source['research-inspector'], { x: 6, y: 0, w: 6, h: 10 }) && hasGeometry(source['research-prepared'], { x: 0, y: 10, w: 12, h: 10 })) {
        panels['research-library'] = { ...panels['research-library'], ...DEFAULT_LAYOUTS['tower-research']['research-library'] }
        panels['research-inspector'] = { ...panels['research-inspector'], ...DEFAULT_LAYOUTS['tower-research']['research-inspector'] }
        panels['research-prepared'] = { ...panels['research-prepared'], ...DEFAULT_LAYOUTS['tower-research']['research-prepared'] }
      }
      if (screen === 'tower-research' && hasGeometry(source['research-library'], { x: 0, y: 0, w: 6, h: 12 }) && hasGeometry(source['research-inspector'], { x: 6, y: 0, w: 6, h: 12 }) && hasGeometry(source['research-prepared'], { x: 0, y: 12, w: 12, h: 10 })) {
        panels['research-library'] = { ...panels['research-library'], ...DEFAULT_LAYOUTS['tower-research']['research-library'] }
        panels['research-inspector'] = { ...panels['research-inspector'], ...DEFAULT_LAYOUTS['tower-research']['research-inspector'] }
        panels['research-prepared'] = { ...panels['research-prepared'], ...DEFAULT_LAYOUTS['tower-research']['research-prepared'] }
        panels['research-school-mastery'] = { ...DEFAULT_LAYOUTS['tower-research']['research-school-mastery'], ...panelFlags(source['research-school-mastery']) }
      }
      if (screen === 'home' && hasGeometry(source['home-objective'], { x: 0, y: 0, w: 12, h: 4 }) && hasGeometry(source['home-checklist'], { x: 0, y: 4, w: 7, h: 10 }) && hasGeometry(source['home-wizard'], { x: 7, y: 4, w: 5, h: 10 })) {
        panels['home-objective'] = { ...panels['home-objective'], ...DEFAULT_LAYOUTS.home['home-objective'] }
        panels['home-checklist'] = { ...panels['home-checklist'], ...DEFAULT_LAYOUTS.home['home-checklist'] }
        panels['home-wizard'] = { ...panels['home-wizard'], ...DEFAULT_LAYOUTS.home['home-wizard'] }
        panels['home-school-mastery'] = { ...DEFAULT_LAYOUTS.home['home-school-mastery'], ...panelFlags(source['home-school-mastery']) }
        panels['home-arcane-work'] = { ...DEFAULT_LAYOUTS.home['home-arcane-work'], ...panelFlags(source['home-arcane-work']) }
      }
      if (screen === 'tower-focus' && hasUnmodifiedGeometry(source['focus-summary'], { x: 0, y: 0, w: 12, h: 6 }) && hasUnmodifiedGeometry(source['focus-reservations'], { x: 0, y: 6, w: 7, h: 14 }) && hasUnmodifiedGeometry(source['focus-improvement'], { x: 7, y: 6, w: 5, h: 14 })) {
        panels['focus-summary'] = { ...panels['focus-summary'], ...DEFAULT_LAYOUTS['tower-focus']['focus-summary'] }
        panels['focus-reservations'] = { ...panels['focus-reservations'], ...DEFAULT_LAYOUTS['tower-focus']['focus-reservations'] }
        panels['focus-improvement'] = { ...panels['focus-improvement'], ...DEFAULT_LAYOUTS['tower-focus']['focus-improvement'] }
      }
      if (screen === 'tower-focus' && hasUnmodifiedGeometry(source['focus-summary'], { x: 0, y: 0, w: 12, h: 11 }) && hasUnmodifiedGeometry(source['focus-reservations'], { x: 0, y: 11, w: 7, h: 16 }) && hasUnmodifiedGeometry(source['focus-improvement'], { x: 7, y: 11, w: 5, h: 16 })) {
        panels['focus-summary'] = { ...panels['focus-summary'], ...DEFAULT_LAYOUTS['tower-focus']['focus-summary'] }
        panels['focus-reservations'] = { ...panels['focus-reservations'], ...DEFAULT_LAYOUTS['tower-focus']['focus-reservations'] }
        panels['focus-improvement'] = { ...panels['focus-improvement'], ...DEFAULT_LAYOUTS['tower-focus']['focus-improvement'] }
      }
      if (screen === 'tower-research') placeMissingPanel(screen, 'research-school-mastery', panels)
      if (screen === 'tower-focus') placeMissingPanel(screen, 'focus-improvement', panels)
      if (screen === 'home') { placeMissingPanel(screen, 'home-school-mastery', panels); placeMissingPanel(screen, 'home-arcane-work', panels) }
      if (screen === 'inventory' && hasGeometry(source['inventory-catalog'], { x: 0, y: 0, w: 9, h: 15 }) && hasGeometry(source['inventory-detail'], { x: 9, y: 0, w: 3, h: 15 })) {
        panels['inventory-catalog'] = { ...panels['inventory-catalog'], x: 0, y: 0, w: 8, h: 17 }
        panels['inventory-detail'] = { ...panels['inventory-detail'], x: 8, y: 0, w: 4, h: 12 }
      }
      if (screen === 'inventory' && hasGeometry(source['inventory-catalog'], { x: 0, y: 0, w: 8, h: 15 }) && hasGeometry(source['inventory-detail'], { x: 8, y: 0, w: 4, h: 15 })) {
        panels['inventory-catalog'] = { ...panels['inventory-catalog'], x: 0, y: 0, w: 8, h: 17 }
        panels['inventory-detail'] = { ...panels['inventory-detail'], x: 8, y: 0, w: 4, h: 12 }
      }
      if (screen === 'inventory' && hasGeometry(source['inventory-catalog'], { x: 0, y: 0, w: 8, h: 16 }) && hasGeometry(source['inventory-detail'], { x: 8, y: 0, w: 4, h: 11 }) && hasGeometry(source['inventory-actions'], { x: 8, y: 11, w: 4, h: 5 })) {
        panels['inventory-catalog'] = { ...panels['inventory-catalog'], x: 0, y: 0, w: 8, h: 17 }
        panels['inventory-detail'] = { ...panels['inventory-detail'], x: 8, y: 0, w: 4, h: 12 }
        panels['inventory-actions'] = { ...panels['inventory-actions'], x: 8, y: 12, w: 4, h: 5 }
      }
      if (screen === 'inventory' && hasGeometry(source['inventory-catalog'], { x: 0, y: 0, w: 8, h: 17 }) && hasGeometry(source['inventory-detail'], { x: 8, y: 0, w: 4, h: 10 }) && hasGeometry(source['inventory-actions'], { x: 8, y: 10, w: 4, h: 7 })) {
        panels['inventory-detail'] = { ...panels['inventory-detail'], x: 8, y: 0, w: 4, h: 12 }
        panels['inventory-actions'] = { ...panels['inventory-actions'], x: 8, y: 12, w: 4, h: 5 }
      }
      if (screen === 'inventory' && !panels['inventory-actions']) {
        const detail = panels['inventory-detail'] ?? DEFAULT_LAYOUTS.inventory['inventory-detail']
        const width = Math.max(3, Math.min(12, detail.w))
        const x = Math.max(0, Math.min(12 - width, detail.x))
        panels['inventory-actions'] = { x, y: Math.max(0, detail.y + detail.h), w: width, h: 5 }
      }
      if (screen === 'inventory' && panels['inventory-actions'] && panels['inventory-actions'].h < 5) panels['inventory-actions'] = { ...panels['inventory-actions'], h: 5 }
      if (Object.keys(panels).length) screens[screen] = panels
    }
    return { version: LAYOUT_VERSION, screens, shell: { topbar: clampTopbarLayout(parsed.shell?.topbar) } }
  } catch { return blankDocument() }
}

export function saveUiLayouts(document: UiLayoutDocument) {
  if (typeof window !== 'undefined') window.localStorage.setItem(UI_LAYOUTS_KEY, JSON.stringify({ version: LAYOUT_VERSION, screens: document.screens, shell: document.shell }))
}

export function resetUiLayouts() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(UI_LAYOUTS_KEY)
    LEGACY_UI_LAYOUTS_KEYS.forEach((key) => window.localStorage.removeItem(key))
  }
}
