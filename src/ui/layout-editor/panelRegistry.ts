import type { ScreenId } from '../../game/types'
import type { PanelDefinition } from './layoutEditorTypes'
import { DEFAULT_LAYOUTS } from './defaultLayouts'

const labels: Record<string, string> = {
  'home-objective': 'Main objective', 'home-checklist': 'Chapter checklist', 'home-wizard': 'The wizard',
  'channeling-mana-core': 'Mana Core', 'channeling-echoes': 'Arcane Echoes', 'channeling-pillars': 'Pillars of Mana', 'focus-summary': 'Focus summary', 'focus-reservations': 'Focus reservations', 'condensation-elements': 'Elemental condensation', 'condensation-status': 'Condensation status', 'research-config': 'Research config', 'research-queue': 'Research queue', 'transmutation-recipes': 'Transmutation recipes', 'transmutation-detail': 'Transmutation detail',
  'school-fire': 'Fire school', 'school-water': 'Water school', 'school-earth': 'Earth school', 'school-air': 'Air school', 'school-ceiling': 'Level ceiling',
  'combat-dungeon': 'Dungeon', 'combat-enemy': 'Enemy', 'combat-timeline': 'Combat timeline', 'combat-spells': 'Spell bar', 'combat-log': 'Combat log',
  'inventory-catalog': 'Item Vault', 'inventory-detail': 'Item Details', 'inventory-actions': 'Item Actions', 'equipment-loadout': 'Equipment loadout', 'equipment-stats': 'Equipment stats', 'equipment-owned': 'Armory', 'equipment-inspector': 'Gear inspector',
  'guild-banner': 'Guild banner', 'guild-request-1': 'Request one', 'guild-request-2': 'Request two', 'guild-request-3': 'Request three', 'guild-rank': 'Guild rank',
  'collection-summary': 'Collection summary', 'collection-content': 'Collection content', 'settings-profile': 'Profile', 'settings-appearance': 'Appearance', 'settings-theme-preview': 'Theme preview', 'settings-save': 'Save', 'settings-layout': 'Interface layout', 'settings-developer': 'Developer', 'settings-info': 'Info',
}

export const PANEL_REGISTRY: PanelDefinition[] = (Object.entries(DEFAULT_LAYOUTS) as [ScreenId, Record<string, PanelDefinition['defaultLayout']>][]) .flatMap(([screen, layouts]) => Object.entries(layouts).map(([id, defaultLayout]) => ({ id, screen, label: labels[id] ?? id, defaultLayout, minW: id === 'inventory-actions' || id.includes('request') ? 3 : 2, minH: id === 'inventory-actions' ? 5 : 4, canHide: true })))

export const getPanelDefinitions = (screen: ScreenId) => PANEL_REGISTRY.filter((panel) => panel.screen === screen)
export const getPanelDefinition = (screen: ScreenId, panelId: string) => PANEL_REGISTRY.find((panel) => panel.screen === screen && panel.id === panelId)
