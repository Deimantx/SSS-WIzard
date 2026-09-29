import type { ScreenId } from '../../game/types'

// ============================================================
// SSS WIZARD — ALL SCREEN PANEL LAYOUTS
// EDIT PANEL SIZE / POSITION / ORDER HERE
// ============================================================

/**
 * SSS WIZARD — SCREEN PANEL LAYOUTS
 *
 * EDIT THIS FILE to change outer panel geometry.
 *
 * order:
 *   visual/layout order within the screen
 *
 * columnStart:
 *   first grid column (1–12)
 *
 * columnSpan:
 *   how many columns the panel occupies
 *
 * minHeight / preferredHeight / maxHeight:
 *   outer panel height in pixels
 *
 * null:
 *   no explicit limit
 *
 * 'auto':
 *   content/browser determines size
 *
 * Responsive overrides live inside each screen's responsive section.
 *
 * Do NOT put internal card typography/content spacing here.
 */

export type ScreenLayoutSize = number | 'auto' | `${number}%`
export type ScreenLayoutAlignment = 'stretch' | 'start' | 'center' | 'end'
export type ScreenPanelOverflow = 'visible' | 'hidden' | 'auto'

export interface ScreenPanelLayout {
  order: number
  columnStart: number
  columnSpan: number
  rowStart?: number | 'auto'
  rowSpan?: number
  minWidth?: number | null
  preferredWidth?: ScreenLayoutSize
  maxWidth?: number | null
  minHeight?: number | null
  preferredHeight?: ScreenLayoutSize
  maxHeight?: number | null
  alignSelf?: ScreenLayoutAlignment
  justifySelf?: ScreenLayoutAlignment
  overflow?: ScreenPanelOverflow
  label?: string
}

export type ScreenPanelLayoutOverride = Partial<ScreenPanelLayout>

export interface ResponsiveScreenLayout {
  maxWidth: number
  columns?: number
  columnGap?: number
  rowGap?: number
  minWidth?: number | null
  maxWidthOverride?: number | null
  alignItems?: 'stretch' | 'start'
  panels: Record<string, ScreenPanelLayoutOverride>
}

export interface ScreenLayoutDefinition {
  screen: {
    columns: number
    columnGap: number
    rowGap: number
    minWidth?: number | null
    maxWidth?: number | null
    alignItems?: 'stretch' | 'start'
  }
  panels: Record<string, ScreenPanelLayout>
  responsive?: {
    tablet?: ResponsiveScreenLayout
    mobile?: ResponsiveScreenLayout
  }
}

export const SCREEN_LAYOUT_DEFAULTS = {
  columns: 12,
  columnGap: 14,
  rowGap: 14,
  panel: {
    minWidth: 0,
    preferredWidth: 'auto' as const,
    maxWidth: null,
    minHeight: 0,
    preferredHeight: 'auto' as const,
    maxHeight: null,
    alignSelf: 'stretch' as const,
    justifySelf: 'stretch' as const,
    overflow: 'visible' as const,
  },
} as const

type ScreenPanelInput = Pick<ScreenPanelLayout, 'order' | 'columnStart' | 'columnSpan' | 'minHeight' | 'preferredHeight'> & Partial<Omit<ScreenPanelLayout, 'order' | 'columnStart' | 'columnSpan' | 'minHeight' | 'preferredHeight'>>

const panel = (layout: ScreenPanelInput): ScreenPanelLayout => ({ ...SCREEN_LAYOUT_DEFAULTS.panel, ...layout })
const defineScreen = (layout: ScreenLayoutDefinition): ScreenLayoutDefinition => layout

const mobilePanel = (order: number): ScreenPanelLayoutOverride => ({
  order,
  columnStart: 1,
  columnSpan: 12,
  rowStart: 'auto',
  rowSpan: 1,
  minWidth: 0,
  preferredWidth: 'auto',
  maxWidth: null,
  minHeight: 0,
  preferredHeight: 'auto',
  maxHeight: null,
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  overflow: 'visible',
})

const mobilePanels = (...panelIds: string[]): Record<string, ScreenPanelLayoutOverride> => Object.fromEntries(panelIds.map((panelId, index) => [panelId, mobilePanel(index + 1)]))

const screen = (panels: Record<string, ScreenPanelLayout>, mobilePanelIds: string[]): ScreenLayoutDefinition => defineScreen({
  screen: {
    columns: SCREEN_LAYOUT_DEFAULTS.columns,
    columnGap: SCREEN_LAYOUT_DEFAULTS.columnGap,
    rowGap: SCREEN_LAYOUT_DEFAULTS.rowGap,
    minWidth: 0,
    maxWidth: null,
    alignItems: 'stretch',
  },
  panels,
  responsive: {
    mobile: {
      maxWidth: 760,
      panels: mobilePanels(...mobilePanelIds),
    },
  },
})

export const SCREEN_PANEL_LAYOUTS: Record<ScreenId, ScreenLayoutDefinition> = {
  // ============================================================
  // HOME / OVERVIEW
  // ============================================================
  home: screen({
    'home-objective': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 100, label: 'Main objective' }),
    'home-school-mastery': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 210, label: 'Magic School Mastery' }),
    'home-chronicles': panel({ order: 3, columnStart: 1, columnSpan: 7, rowStart: 3, minHeight: 0, preferredHeight: 390, label: 'Chronicles summary' }),
    'home-wizard': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 3, minHeight: 0, preferredHeight: 390, label: 'The wizard' }),
    'home-arcane-work': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 246, label: 'Current Arcane Work' }),
  }, ['home-objective', 'home-school-mastery', 'home-chronicles', 'home-wizard', 'home-arcane-work']),

  // ============================================================
  // COMBAT
  // ============================================================
  combat: screen({
    'combat-stage': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 462, preferredHeight: 570, label: 'Combat Stage' }),
    'combat-spell-deck': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 174, preferredHeight: 320, label: 'Spell Deck' }),
    'combat-analytics': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 282, preferredHeight: 440, label: 'Combat Analytics' }),
  }, ['combat-stage', 'combat-spell-deck', 'combat-analytics']),

  // ============================================================
  // MAGIC SCHOOLS
  // ============================================================
  schools: screen({
    'schools-library': panel({ order: 1, columnStart: 1, columnSpan: 8, rowStart: 1, minHeight: 520, preferredHeight: 660, label: 'Spell library' }),
    'schools-inspector': panel({ order: 2, columnStart: 9, columnSpan: 4, rowStart: 1, minHeight: 520, preferredHeight: 660, label: 'Spell inspector' }),
    'schools-loadout': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 220, preferredHeight: 350, label: 'Combat loadout' }),
  }, ['schools-library', 'schools-inspector', 'schools-loadout']),

  // ============================================================
  // INVENTORY
  // ============================================================
  inventory: screen({
    'inventory-catalog': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 420, preferredHeight: 858, label: 'Item Vault' }),
    'inventory-detail': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 420, preferredHeight: 858, label: 'Item Details' }),
  }, ['inventory-catalog', 'inventory-detail']),

  // ============================================================
  // EQUIPMENT
  // ============================================================
  equipment: screen({
    'equipment-loadout': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 462, preferredHeight: 740, label: 'Equipment loadout' }),
    'equipment-stats': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 462, preferredHeight: 740, label: 'Equipment stats' }),
    'equipment-owned': panel({ order: 3, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 462, preferredHeight: 710, label: 'Armory' }),
    'equipment-inspector': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 462, preferredHeight: 710, label: 'Gear inspector' }),
  }, ['equipment-loadout', 'equipment-stats', 'equipment-owned', 'equipment-inspector']),

  // ============================================================
  // ARCANE CORE
  // ============================================================
  'arcane-core': screen({
    'arcane-core-overview': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 600, preferredHeight: 'auto', label: 'Arcane Core overview' }),
  }, ['arcane-core-overview']),

  // ============================================================
  // CRYSTALS
  // ============================================================
  crystals: screen({
    'crystals-board': panel({ order: 1, columnStart: 1, columnSpan: 8, rowStart: 1, minHeight: 560, preferredHeight: 760, label: 'Crystal Slot Board' }),
    'crystals-summary': panel({ order: 2, columnStart: 9, columnSpan: 4, rowStart: 1, minHeight: 560, preferredHeight: 760, label: 'Crystal Summary' }),
    'crystals-presets': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 190, preferredHeight: 250, label: 'Crystal Presets' }),
  }, ['crystals-board', 'crystals-summary', 'crystals-presets']),

  // ============================================================
  // COLLECTION
  // ============================================================
  collection: screen({
    'collection-summary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 200, label: 'Collection summary' }),
    'collection-content': panel({ order: 2, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 0, preferredHeight: 800, label: 'Item collection' }),
    'collection-inspector': panel({ order: 3, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 0, preferredHeight: 800, label: 'Item inspection' }),
  }, ['collection-summary', 'collection-content', 'collection-inspector']),

  // ============================================================
  // BESTIARY
  // ============================================================
  bestiary: screen({
    'bestiary-summary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 200, label: 'Bestiary summary' }),
    'bestiary-index': panel({ order: 2, columnStart: 1, columnSpan: 5, rowStart: 2, minHeight: 0, preferredHeight: 800, label: 'Bestiary index' }),
    'bestiary-inspector': panel({ order: 3, columnStart: 6, columnSpan: 7, rowStart: 2, minHeight: 0, preferredHeight: 800, label: 'Creature dossier' }),
  }, ['bestiary-summary', 'bestiary-index', 'bestiary-inspector']),

  // ============================================================
  // CHANNELING
  // ============================================================
  'tower-channeling': screen({
    'channeling-mana-core': panel({ order: 1, columnStart: 1, columnSpan: 6, rowStart: 1, minHeight: 0, preferredHeight: 354, label: 'Arcane Flux Core' }),
    'channeling-acolytes': panel({ order: 2, columnStart: 7, columnSpan: 6, rowStart: 1, minHeight: 354, preferredHeight: 354, label: 'Acolyte Channeling' }),
    'channeling-breakdown': panel({ order: 3, columnStart: 1, columnSpan: 6, rowStart: 2, minHeight: 354, preferredHeight: 650, label: 'Channeling Breakdown' }),
    'channeling-pillars': panel({ order: 4, columnStart: 7, columnSpan: 6, rowStart: 2, minHeight: 354, preferredHeight: 650, label: 'Leyline Pillars' }),
  }, ['channeling-mana-core', 'channeling-acolytes', 'channeling-breakdown', 'channeling-pillars']),

  'tower-acolytes': screen({
    'acolyte-roster': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 170, preferredHeight: 210, label: 'Acolyte roster' }),
    'acolyte-assignments': panel({ order: 2, columnStart: 1, columnSpan: 8, rowStart: 2, minHeight: 260, preferredHeight: 420, label: 'Active Acolyte assignments' }),
    'acolyte-sources': panel({ order: 3, columnStart: 9, columnSpan: 4, rowStart: 2, minHeight: 260, preferredHeight: 420, label: 'Acolyte sources' }),
  }, ['acolyte-roster', 'acolyte-assignments', 'acolyte-sources']),

  // ============================================================
  // RESEARCH
  // ============================================================
  'tower-research': screen({
    'research-school-mastery': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 138, preferredHeight: 150, label: 'Magic School Mastery' }),
    'research-library': panel({ order: 2, columnStart: 1, columnSpan: 6, rowStart: 2, minHeight: 282, preferredHeight: 740, label: 'Researchable items' }),
    'research-inspector': panel({ order: 3, columnStart: 7, columnSpan: 6, rowStart: 2, minHeight: 426, preferredHeight: 740, label: 'Item inspection' }),
    'research-prepared': panel({ order: 4, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 246, preferredHeight: 500, label: 'Prepared Research' }),
  }, ['research-school-mastery', 'research-library', 'research-inspector', 'research-prepared']),

  // ============================================================
  // TRANSMUTATION
  // ============================================================
  'tower-transmutation': screen({
    'transmutation-recipes': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 354, preferredHeight: 600, label: 'Recipe library' }),
    'transmutation-acolytes': panel({ order: 2, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 282, preferredHeight: 600, label: 'Acolyte assignment' }),
    'transmutation-detail': panel({ order: 3, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 282, preferredHeight: 600, label: 'Recipe detail' }),
    'transmutation-arrays': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 426, preferredHeight: 600, label: 'Transmutation Arrays' }),
  }, ['transmutation-recipes', 'transmutation-acolytes', 'transmutation-detail', 'transmutation-arrays']),

  // ============================================================
  // ARTIFICING
  // ============================================================
  'tower-artificing': screen({
    'artificing-catalog': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 570, preferredHeight: 1074, label: 'Equipment Catalog' }),
    'artificing-detail': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 714, preferredHeight: 1074, label: 'Arcane Forge' }),
  }, ['artificing-catalog', 'artificing-detail']),

  // ============================================================
  // SUMMONING
  // ============================================================
  'tower-summoning': screen({
    'summoning-binding': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 250, label: 'Active Guardian Binding' }),
    'summoning-roster': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 720, label: 'Elemental Guardians' }),
  }, ['summoning-binding', 'summoning-roster']),

  // ============================================================
  // DARK PORTAL
  // ============================================================
  // Dark Portal currently uses its own field layout rather than ScreenGrid.
  'tower-dark-portal': defineScreen({
    screen: {
      columns: SCREEN_LAYOUT_DEFAULTS.columns,
      columnGap: SCREEN_LAYOUT_DEFAULTS.columnGap,
      rowGap: SCREEN_LAYOUT_DEFAULTS.rowGap,
      minWidth: 0,
      maxWidth: null,
      alignItems: 'stretch',
    },
    panels: {},
  }),

  // ============================================================
  // GUILD
  // ============================================================
  guild: screen({
    // Each visible Guild surface has its own editable panel. The shared mobile
    // layout changes these values to auto when panels stack vertically.
    'guild-header': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 190, label: 'Guild identity and metrics' }),
    'guild-tabs': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 100, label: 'Guild navigation tabs' }),
    'guild-progression': panel({ order: 3, columnStart: 1, columnSpan: 5, rowStart: 3, minHeight: 0, preferredHeight: 710, overflow: 'auto', label: 'Guild rank progression' }),
    'guild-recommended-contracts': panel({ order: 4, columnStart: 6, columnSpan: 7, rowStart: 3, minHeight: 0, preferredHeight: 610, overflow: 'auto', label: 'Recommended Guild contracts' }),
    'guild-advancement-summary': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 190, label: 'Guild Advancement summary' }),
    'guild-specialization': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 220, overflow: 'auto', label: 'Guild specialization summary' }),
    'guild-contract-controls': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 86, overflow: 'auto', label: 'Guild contract filters' }),
    'guild-contracts': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 1020, overflow: 'auto', label: 'Guild contract board' }),
    'guild-skills-summary': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 200, label: 'Guild skill points summary' }),
    'guild-skills': panel({ order: 4, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 860, overflow: 'auto', label: 'Guild skill branches' }),
    'guild-skills-note': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 5, minHeight: 0, preferredHeight: 72, label: 'Guild skill tree note' }),
    'guild-locked': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 520, label: 'Guild locked state' }),
    'guild-registry': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 520, preferredHeight: 900, overflow: 'auto', label: 'Arcane Registry' }),
    'guild-projects': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 500, preferredHeight: 900, overflow: 'auto', label: 'Guild Projects' }),
    'guild-chains': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 500, preferredHeight: 900, overflow: 'auto', label: 'Guild Commission Chains' }),
  }, [
    'guild-header',
    'guild-tabs',
    'guild-progression',
    'guild-recommended-contracts',
    'guild-advancement-summary',
    'guild-specialization',
    'guild-contract-controls',
    'guild-contracts',
    'guild-skills-summary',
    'guild-skills',
    'guild-skills-note',
    'guild-locked',
    'guild-registry',
    'guild-projects',
    'guild-chains',
  ]),

  'hunters-order': screen({
    'hunter-contracts': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 380, preferredHeight: 840, overflow: 'auto', label: 'Hunter contract board' }),
    'hunter-rank': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 240, preferredHeight: 480, label: 'Hunter rank progress' }),
    'hunter-upgrades': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 240, preferredHeight: 420, label: 'Hunter upgrades' }),
    'hunter-bestiary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 540, preferredHeight: 880, overflow: 'auto', label: 'Hunter Bestiary' }),
    'hunter-grounds': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 340, preferredHeight: 570, overflow: 'auto', label: 'Hunting Grounds' }),
  }, ['hunter-contracts', 'hunter-rank', 'hunter-upgrades', 'hunter-bestiary', 'hunter-grounds']),

  'arcane-guild': screen({
    'guild-header': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 190, label: 'Arcane Guild identity and metrics' }),
    'guild-tabs': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 100, label: 'Arcane Guild navigation tabs' }),
    'guild-progression': panel({ order: 3, columnStart: 1, columnSpan: 5, rowStart: 3, minHeight: 0, preferredHeight: 610, overflow: 'auto', label: 'Arcane Guild rank progression' }),
    'guild-recommended-contracts': panel({ order: 4, columnStart: 6, columnSpan: 7, rowStart: 3, minHeight: 0, preferredHeight: 610, overflow: 'auto', label: 'Arcane Guild commissions' }),
    'guild-specialization': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 220, overflow: 'auto', label: 'Arcane Guild advancement' }),
    'guild-contract-controls': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 86, overflow: 'auto', label: 'Arcane Guild commission filters' }),
    'guild-contracts': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 1020, overflow: 'auto', label: 'Arcane Guild commission board' }),
    'guild-skills-summary': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 200, label: 'Arcane Guild advancement points' }),
    'guild-skills': panel({ order: 4, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 860, overflow: 'auto', label: 'Arcane Guild advancement board' }),
    'guild-skills-note': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 5, minHeight: 0, preferredHeight: 72, label: 'Arcane Guild project note' }),
    'guild-locked': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 520, label: 'Arcane Guild locked state' }),
    'guild-registry': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 520, preferredHeight: 900, overflow: 'auto', label: 'Arcane Registry' }),
    'guild-projects': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 500, preferredHeight: 900, overflow: 'auto', label: 'Guild Projects' }),
    'guild-chains': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 500, preferredHeight: 900, overflow: 'auto', label: 'Guild Commission Chains' }),
  }, ['guild-header', 'guild-tabs', 'guild-progression', 'guild-recommended-contracts', 'guild-specialization', 'guild-contract-controls', 'guild-contracts', 'guild-skills-summary', 'guild-skills', 'guild-skills-note', 'guild-locked', 'guild-registry', 'guild-projects', 'guild-chains']),

  // ============================================================
  // SETTINGS / INFO
  // ============================================================
  settings: screen({
    'settings-profile': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 282, label: 'Profile' }),
    'settings-appearance': panel({ order: 2, columnStart: 1, columnSpan: 8, rowStart: 2, minHeight: 0, preferredHeight: 570, label: 'Appearance' }),
    'settings-theme-preview': panel({ order: 3, columnStart: 9, columnSpan: 4, rowStart: 2, minHeight: 0, preferredHeight: 462, label: 'Theme preview' }),
    'settings-save': panel({ order: 4, columnStart: 1, columnSpan: 6, rowStart: 3, minHeight: 0, preferredHeight: 318, label: 'Save' }),
    'settings-developer': panel({ order: 5, columnStart: 1, columnSpan: 6, rowStart: 4, minHeight: 0, preferredHeight: 246, label: 'Developer' }),
    'settings-info': panel({ order: 6, columnStart: 7, columnSpan: 6, rowStart: 4, minHeight: 0, preferredHeight: 246, label: 'Info' }),
  }, ['settings-profile', 'settings-appearance', 'settings-theme-preview', 'settings-save', 'settings-developer', 'settings-info']),
}

const FALLBACK_SCREEN_LAYOUT: ScreenLayoutDefinition = defineScreen({
  screen: {
    columns: SCREEN_LAYOUT_DEFAULTS.columns,
    columnGap: SCREEN_LAYOUT_DEFAULTS.columnGap,
    rowGap: SCREEN_LAYOUT_DEFAULTS.rowGap,
    minWidth: 0,
    maxWidth: null,
    alignItems: 'stretch',
  },
  panels: {},
})

export function getScreenLayout(screenId: ScreenId): ScreenLayoutDefinition {
  return SCREEN_PANEL_LAYOUTS[screenId] ?? FALLBACK_SCREEN_LAYOUT
}

export function getPanelLayout(screenId: ScreenId, panelId: string, fallbackOrder = 1): ScreenPanelLayout {
  const configuredPanel = getScreenLayout(screenId).panels[panelId]
  return configuredPanel
    ? { ...SCREEN_LAYOUT_DEFAULTS.panel, ...configuredPanel }
    : { ...SCREEN_LAYOUT_DEFAULTS.panel, order: fallbackOrder, columnStart: 1, columnSpan: SCREEN_LAYOUT_DEFAULTS.columns }
}
