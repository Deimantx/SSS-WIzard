import type { ScreenId } from '../../game/types'
import type { SavedPanelLayout, ScreenLayouts } from './layoutEditorTypes'

const layout = (x: number, y: number, w: number, h: number): SavedPanelLayout => ({ x, y, w, h })

export const DEFAULT_LAYOUTS: Record<ScreenId, ScreenLayouts> = {
  home: {
    'home-objective': layout(0, 0, 12, 4), 'home-checklist': layout(0, 4, 7, 10), 'home-wizard': layout(7, 4, 5, 10),
  },
  tower: {
    'tower-channeling': layout(0, 0, 7, 10), 'tower-focus': layout(7, 0, 5, 10), 'tower-condensation': layout(0, 10, 4, 9), 'tower-research': layout(4, 10, 5, 9), 'tower-transmutation': layout(9, 10, 3, 9),
  },
  schools: {
    'school-fire': layout(0, 0, 6, 10), 'school-water': layout(6, 0, 6, 10), 'school-earth': layout(0, 10, 6, 10), 'school-air': layout(6, 10, 6, 10), 'school-ceiling': layout(0, 20, 12, 5),
  },
  combat: {
    'combat-dungeon': layout(0, 0, 7, 11), 'combat-enemy': layout(7, 0, 5, 11), 'combat-timeline': layout(0, 11, 12, 8), 'combat-spells': layout(0, 19, 7, 12), 'combat-log': layout(7, 19, 5, 12),
  },
  inventory: { 'inventory-catalog': layout(0, 0, 8, 18), 'inventory-detail': layout(8, 0, 4, 18) },
  equipment: { 'equipment-loadout': layout(0, 0, 7, 13), 'equipment-stats': layout(7, 0, 5, 13), 'equipment-owned': layout(0, 13, 12, 13) },
  guild: { 'guild-banner': layout(0, 0, 12, 5), 'guild-request-1': layout(0, 5, 4, 11), 'guild-request-2': layout(4, 5, 4, 11), 'guild-request-3': layout(8, 5, 4, 11), 'guild-rank': layout(0, 16, 12, 6) },
  collection: { 'collection-summary': layout(0, 0, 12, 5), 'collection-content': layout(0, 5, 12, 15) },
  settings: { 'settings-appearance': layout(0, 0, 8, 20), 'settings-theme-preview': layout(8, 0, 4, 20), 'settings-save': layout(0, 20, 6, 10), 'settings-layout': layout(6, 20, 6, 10), 'settings-developer': layout(0, 30, 6, 8), 'settings-info': layout(6, 30, 6, 8) },
}
