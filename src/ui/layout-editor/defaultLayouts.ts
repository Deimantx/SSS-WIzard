import type { ScreenId } from '../../game/types'
import type { SavedPanelLayout, ScreenLayouts } from './layoutEditorTypes'

const layout = (x: number, y: number, w: number, h: number): SavedPanelLayout => ({ x, y, w, h })

export const DEFAULT_LAYOUTS: Record<ScreenId, ScreenLayouts> = {
  home: {
    'home-objective': layout(0, 0, 12, 4), 'home-school-mastery': layout(0, 4, 12, 6), 'home-checklist': layout(0, 10, 7, 10), 'home-wizard': layout(7, 10, 5, 10), 'home-arcane-work': layout(0, 20, 12, 7),
  },
  'tower-channeling': { 'channeling-mana-core': layout(0, 0, 6, 9), 'channeling-echoes': layout(6, 0, 6, 9), 'channeling-pillars': layout(0, 9, 12, 25) },
  'tower-focus': { 'focus-summary': layout(0, 0, 12, 14), 'focus-reservations': layout(0, 14, 7, 16), 'focus-improvement': layout(7, 14, 5, 16) },
  'tower-research': { 'research-school-mastery': layout(0, 0, 12, 4), 'research-library': layout(0, 4, 6, 12), 'research-inspector': layout(6, 4, 6, 12), 'research-prepared': layout(0, 16, 12, 10) },
  'tower-transmutation': { 'transmutation-recipes': layout(0, 0, 7, 15), 'transmutation-focus': layout(0, 15, 7, 15), 'transmutation-detail': layout(7, 0, 5, 8) },
  'tower-artificing': { 'artificing-catalog': layout(0, 0, 7, 30), 'artificing-detail': layout(7, 0, 5, 30), 'artificing-pinned-recipe': layout(7, 30, 5, 9) },
  schools: {
    'schools-browser': layout(0, 0, 7, 18), 'schools-inspector': layout(7, 0, 5, 18), 'schools-presets': layout(0, 18, 12, 6),
  },
  combat: {
    'combat-stage': layout(0, 0, 12, 14), 'combat-spell-deck': layout(0, 14, 12, 7), 'combat-analytics': layout(0, 21, 12, 8),
  },
  inventory: { 'inventory-catalog': layout(0, 0, 8, 12), 'inventory-detail': layout(8, 0, 4, 12), 'inventory-actions': layout(8, 12, 4, 5) },
  equipment: { 'equipment-loadout': layout(0, 0, 7, 13), 'equipment-stats': layout(7, 0, 5, 13), 'equipment-owned': layout(0, 13, 8, 13), 'equipment-inspector': layout(8, 13, 4, 13) },
  guild: { 'guild-banner': layout(0, 0, 12, 5), 'guild-request-1': layout(0, 5, 4, 11), 'guild-request-2': layout(4, 5, 4, 11), 'guild-request-3': layout(8, 5, 4, 11), 'guild-rank': layout(0, 16, 12, 6) },
  collection: { 'collection-summary': layout(0, 0, 12, 5), 'collection-content': layout(0, 5, 7, 17), 'collection-inspector': layout(7, 5, 5, 17) },
  bestiary: { 'bestiary-summary': layout(0, 0, 12, 5), 'bestiary-index': layout(0, 5, 5, 19), 'bestiary-inspector': layout(5, 5, 7, 19) },
  settings: { 'settings-profile': layout(0, 0, 12, 8), 'settings-appearance': layout(0, 8, 8, 16), 'settings-theme-preview': layout(8, 8, 4, 13), 'settings-save': layout(0, 24, 6, 9), 'settings-layout': layout(6, 24, 6, 9), 'settings-developer': layout(0, 33, 6, 7), 'settings-info': layout(6, 33, 6, 7) },
}
