import type { ScreenId } from '../../game/types'
import type { PanelDefinition } from './layoutEditorTypes'
import { DEFAULT_LAYOUTS } from './defaultLayouts'

const labels: Record<string, string> = {
  'artificing-catalog': 'Equipment Catalog', 'artificing-detail': 'Arcane Forge', 'artificing-pinned-recipe': 'Pinned Recipe',
  'home-objective': 'Main objective', 'home-school-mastery': 'Magic School Mastery', 'home-checklist': 'Chapter checklist', 'home-wizard': 'The wizard', 'home-arcane-work': 'Current Arcane Work',
  'channeling-mana-core': 'Mana Core', 'channeling-echoes': 'Arcane Echoes', 'channeling-pillars': 'Pillars of Mana', 'focus-summary': 'Focus overview', 'focus-reservations': 'Active Focus usage', 'focus-improvement': 'Focus improvement', 'research-school-mastery': 'Magic School Mastery', 'research-library': 'Researchable items', 'research-inspector': 'Item inspection', 'research-prepared': 'Prepared Research', 'transmutation-recipes': 'Recipe library', 'transmutation-focus': 'Focus assignment', 'transmutation-detail': 'Recipe detail',
  'schools-browser': 'Spell browser', 'schools-inspector': 'Spell inspector', 'schools-presets': 'Spell presets',
  'combat-stage': 'Combat Stage', 'combat-spell-deck': 'Spell Deck', 'combat-analytics': 'Combat Analytics',
  'inventory-catalog': 'Item Vault', 'inventory-detail': 'Item Details', 'inventory-actions': 'Item Actions', 'equipment-loadout': 'Equipment loadout', 'equipment-stats': 'Equipment stats', 'equipment-owned': 'Armory', 'equipment-inspector': 'Gear inspector',
  'guild-banner': 'Guild banner', 'guild-request-1': 'Request one', 'guild-request-2': 'Request two', 'guild-request-3': 'Request three', 'guild-rank': 'Guild rank',
  'collection-summary': 'Collection summary', 'collection-content': 'Item collection', 'collection-inspector': 'Item inspection', 'bestiary-summary': 'Bestiary summary', 'bestiary-index': 'Bestiary index', 'bestiary-inspector': 'Creature dossier', 'settings-profile': 'Profile', 'settings-appearance': 'Appearance', 'settings-theme-preview': 'Theme preview', 'settings-save': 'Save', 'settings-layout': 'Interface layout', 'settings-developer': 'Developer', 'settings-info': 'Info',
}

type PanelOverrides = Pick<PanelDefinition, 'minW' | 'minH' | 'heightMode'>
const panelOverrides: Record<string, PanelOverrides> = {
  'transmutation-recipes': { minW: 5, minH: 10, heightMode: 'bounded-scroll' },
  'transmutation-focus': { minW: 5, minH: 8, heightMode: 'bounded-scroll' },
  'transmutation-detail': { minW: 4, minH: 7 },
  'artificing-catalog': { minW: 4, minH: 16, heightMode: 'bounded-scroll' },
  'artificing-detail': { minW: 4, minH: 20, heightMode: 'content' },
  'artificing-pinned-recipe': { minW: 4, minH: 7, heightMode: 'content' },
  'combat-stage': { minW: 6, minH: 13, heightMode: 'bounded-scroll' },
  'combat-spell-deck': { minW: 6, minH: 5, heightMode: 'bounded-scroll' },
  'combat-analytics': { minW: 8, minH: 8, heightMode: 'bounded-scroll' },
  'focus-summary': { minW: 8, minH: 8, heightMode: 'bounded-scroll' },
  'focus-reservations': { minW: 5, minH: 10, heightMode: 'bounded-scroll' },
  'focus-improvement': { minW: 4, minH: 11, heightMode: 'bounded-scroll' },
  'research-school-mastery': { minW: 6, minH: 4, heightMode: 'bounded-scroll' },
  'research-library': { minH: 8, heightMode: 'bounded-scroll' },
  'research-inspector': { minH: 12, heightMode: 'bounded-scroll' },
  'research-prepared': { minH: 7, heightMode: 'bounded-scroll' },
  'home-school-mastery': { minW: 6, minH: 5, heightMode: 'bounded-scroll' },
  'home-arcane-work': { minW: 6, minH: 6, heightMode: 'bounded-scroll' },
  'inventory-catalog': { heightMode: 'bounded-scroll' },
  'inventory-detail': { heightMode: 'bounded-scroll' },
  'inventory-actions': { minW: 3, minH: 5, heightMode: 'bounded-scroll' },
  'guild-request-1': { minW: 3 },
  'guild-request-2': { minW: 3 },
  'guild-request-3': { minW: 3 },
  'equipment-loadout': { minW: 7, minH: 13, heightMode: 'bounded-scroll' },
  'equipment-stats': { minW: 5, minH: 13, heightMode: 'bounded-scroll' },
  'equipment-owned': { minH: 13, heightMode: 'bounded-scroll' },
  'equipment-inspector': { minH: 13, heightMode: 'bounded-scroll' },
  'collection-content': { heightMode: 'bounded-scroll' },
  'collection-inspector': { heightMode: 'bounded-scroll' },
  'bestiary-index': { heightMode: 'bounded-scroll' },
  'bestiary-inspector': { heightMode: 'bounded-scroll' },
  'schools-browser': { heightMode: 'bounded-scroll' },
  'schools-inspector': { heightMode: 'bounded-scroll' },
  'schools-presets': { heightMode: 'content' },
}

export const PANEL_REGISTRY: PanelDefinition[] = (Object.entries(DEFAULT_LAYOUTS) as [ScreenId, Record<string, PanelDefinition['defaultLayout']>][]) .flatMap(([screen, layouts]) => Object.entries(layouts).map(([id, defaultLayout]) => ({
  id,
  screen,
  label: labels[id] ?? id,
  defaultLayout,
  minW: 2,
  minH: 4,
  canHide: true,
  ...panelOverrides[id],
})))

export const getPanelDefinitions = (screen: ScreenId) => PANEL_REGISTRY.filter((panel) => panel.screen === screen)
export const getPanelDefinition = (screen: ScreenId, panelId: string) => PANEL_REGISTRY.find((panel) => panel.screen === screen && panel.id === panelId)
