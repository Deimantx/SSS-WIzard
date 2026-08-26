import type { ScreenId } from '../../game/types'
import type { SavedPanelLayout, ScreenLayouts } from './layoutEditorTypes'

const layout = (x: number, y: number, w: number, h: number): SavedPanelLayout => ({ x, y, w, h })

export const DEFAULT_LAYOUTS: Record<ScreenId, ScreenLayouts> = {
  home: {
    'home-objective': layout(0, 0, 12, 4), 'home-checklist': layout(0, 4, 7, 10), 'home-wizard': layout(7, 4, 5, 10),
  },
  'tower-channeling': { 'channeling-mana-core': layout(0, 0, 6, 9), 'channeling-echoes': layout(6, 0, 6, 9), 'channeling-pillars': layout(0, 9, 12, 25) },
  'tower-focus': { 'focus-summary': layout(0, 0, 7, 12), 'focus-reservations': layout(7, 0, 5, 12) },
  'tower-condensation': { 'condensation-elements': layout(0, 0, 7, 11), 'condensation-status': layout(7, 0, 5, 11) },
  'tower-research': { 'research-config': layout(0, 0, 7, 13), 'research-queue': layout(7, 0, 5, 13) },
  'tower-transmutation': { 'transmutation-recipes': layout(0, 0, 7, 13), 'transmutation-detail': layout(7, 0, 5, 13) },
  schools: {
    'school-fire': layout(0, 0, 6, 10), 'school-water': layout(6, 0, 6, 10), 'school-earth': layout(0, 10, 6, 10), 'school-air': layout(6, 10, 6, 10), 'school-ceiling': layout(0, 20, 12, 5),
  },
  combat: {
    'combat-dungeon': layout(0, 0, 7, 11), 'combat-enemy': layout(7, 0, 5, 11), 'combat-timeline': layout(0, 11, 12, 8), 'combat-spells': layout(0, 19, 7, 12), 'combat-log': layout(7, 19, 5, 12),
  },
  inventory: { 'inventory-catalog': layout(0, 0, 8, 17), 'inventory-detail': layout(8, 0, 4, 12), 'inventory-actions': layout(8, 12, 4, 5) },
  equipment: { 'equipment-loadout': layout(0, 0, 7, 17), 'equipment-stats': layout(7, 0, 5, 17), 'equipment-owned': layout(0, 17, 8, 13), 'equipment-inspector': layout(8, 17, 4, 13) },
  guild: { 'guild-banner': layout(0, 0, 12, 5), 'guild-request-1': layout(0, 5, 4, 11), 'guild-request-2': layout(4, 5, 4, 11), 'guild-request-3': layout(8, 5, 4, 11), 'guild-rank': layout(0, 16, 12, 6) },
  collection: { 'collection-summary': layout(0, 0, 12, 5), 'collection-content': layout(0, 5, 12, 15) },
  settings: { 'settings-profile': layout(0, 0, 12, 8), 'settings-appearance': layout(0, 8, 8, 16), 'settings-theme-preview': layout(8, 8, 4, 13), 'settings-save': layout(0, 24, 6, 9), 'settings-layout': layout(6, 24, 6, 9), 'settings-developer': layout(0, 33, 6, 7), 'settings-info': layout(6, 33, 6, 7) },
}
