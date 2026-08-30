import type { ScreenId } from '../../game/types'
import type { PanelDefinition } from './layoutEditorTypes'
import { DEFAULT_LAYOUTS } from './defaultLayouts'

const labels: Record<string, string> = {
  'home-objective': 'Main objective', 'home-school-mastery': 'Magic School Mastery', 'home-checklist': 'Chapter checklist', 'home-wizard': 'The wizard', 'home-arcane-work': 'Current Arcane Work',
  'channeling-mana-core': 'Mana Core', 'channeling-echoes': 'Arcane Echoes', 'channeling-pillars': 'Pillars of Mana', 'focus-summary': 'Focus overview', 'focus-reservations': 'Active Focus usage', 'focus-improvement': 'Focus improvement', 'research-school-mastery': 'Magic School Mastery', 'research-library': 'Researchable items', 'research-inspector': 'Item inspection', 'research-prepared': 'Prepared Research', 'transmutation-recipes': 'Recipe library', 'transmutation-detail': 'Recipe detail', 'transmutation-focus': 'Focus assignment',
  'schools-browser': 'Spell browser', 'schools-inspector': 'Spell inspector', 'schools-presets': 'Spell presets',
  'combat-stage': 'Combat Stage', 'combat-spell-deck': 'Spell Deck', 'combat-intel': 'Combat Intel',
  'inventory-catalog': 'Item Vault', 'inventory-detail': 'Item Details', 'inventory-actions': 'Item Actions', 'equipment-loadout': 'Equipment loadout', 'equipment-stats': 'Equipment stats', 'equipment-owned': 'Armory', 'equipment-inspector': 'Gear inspector',
  'guild-banner': 'Guild banner', 'guild-request-1': 'Request one', 'guild-request-2': 'Request two', 'guild-request-3': 'Request three', 'guild-rank': 'Guild rank',
  'collection-summary': 'Collection summary', 'collection-content': 'Item collection', 'collection-inspector': 'Item inspection', 'bestiary-summary': 'Bestiary summary', 'bestiary-index': 'Bestiary index', 'bestiary-inspector': 'Creature dossier', 'settings-profile': 'Profile', 'settings-appearance': 'Appearance', 'settings-theme-preview': 'Theme preview', 'settings-save': 'Save', 'settings-layout': 'Interface layout', 'settings-developer': 'Developer', 'settings-info': 'Info',
}

export const PANEL_REGISTRY: PanelDefinition[] = (Object.entries(DEFAULT_LAYOUTS) as [ScreenId, Record<string, PanelDefinition['defaultLayout']>][]) .flatMap(([screen, layouts]) => Object.entries(layouts).map(([id, defaultLayout]) => ({
  id,
  screen,
  label: labels[id] ?? id,
  defaultLayout,
  minW: id === 'combat-stage' ? 6 : id === 'combat-spell-deck' ? 6 : id === 'combat-intel' ? 4 : id === 'focus-summary' ? 8 : id === 'focus-reservations' ? 5 : id === 'focus-improvement' ? 4 : id === 'research-school-mastery' || id === 'home-school-mastery' || id === 'home-arcane-work' ? 6 : id === 'inventory-actions' || id.includes('request') ? 3 : 2,
  minH: id === 'combat-stage' ? 13 : id === 'combat-spell-deck' ? 9 : id === 'combat-intel' ? 8 : id === 'focus-summary' ? 8 : id === 'focus-reservations' ? 10 : id === 'focus-improvement' ? 11 : id === 'inventory-actions' ? 5 : id === 'research-library' ? 8 : id === 'research-inspector' ? 12 : id === 'research-prepared' ? 7 : id === 'home-school-mastery' ? 5 : id === 'home-arcane-work' ? 6 : id === 'research-school-mastery' ? 4 : 4,
  canHide: true,
})))

export const getPanelDefinitions = (screen: ScreenId) => PANEL_REGISTRY.filter((panel) => panel.screen === screen)
export const getPanelDefinition = (screen: ScreenId, panelId: string) => PANEL_REGISTRY.find((panel) => panel.screen === screen && panel.id === panelId)
