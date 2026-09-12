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
    'home-objective': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 138, label: 'Main objective' }),
    'home-school-mastery': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 210, label: 'Magic School Mastery' }),
    'home-checklist': panel({ order: 3, columnStart: 1, columnSpan: 7, rowStart: 3, minHeight: 0, preferredHeight: 354, label: 'Chapter checklist' }),
    'home-wizard': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 3, minHeight: 0, preferredHeight: 354, label: 'The wizard' }),
    'home-arcane-work': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 4, minHeight: 0, preferredHeight: 246, label: 'Current Arcane Work' }),
  }, ['home-objective', 'home-school-mastery', 'home-checklist', 'home-wizard', 'home-arcane-work']),

  // ============================================================
  // COMBAT
  // ============================================================
  combat: screen({
    'combat-stage': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 462, preferredHeight: 570, label: 'Combat Stage' }),
    'combat-spell-deck': panel({ order: 2, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 174, preferredHeight: 246, label: 'Spell Deck' }),
    'combat-analytics': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 282, preferredHeight: 354, label: 'Combat Analytics' }),
  }, ['combat-stage', 'combat-spell-deck', 'combat-analytics']),

  // ============================================================
  // MAGIC SCHOOLS
  // ============================================================
  schools: screen({
    'schools-browser': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 138, preferredHeight: 642, label: 'Spell browser' }),
    'schools-inspector': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 138, preferredHeight: 642, label: 'Spell inspector' }),
    'schools-presets': panel({ order: 3, columnStart: 1, columnSpan: 12, rowStart: 2, minHeight: 0, preferredHeight: 282, label: 'Spell presets' }),
  }, ['schools-browser', 'schools-inspector', 'schools-presets']),

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
    'equipment-loadout': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 462, preferredHeight: 462, label: 'Equipment loadout' }),
    'equipment-stats': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 462, preferredHeight: 462, label: 'Equipment stats' }),
    'equipment-owned': panel({ order: 3, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 462, preferredHeight: 714, label: 'Armory' }),
    'equipment-inspector': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 462, preferredHeight: 462, label: 'Gear inspector' }),
  }, ['equipment-loadout', 'equipment-stats', 'equipment-owned', 'equipment-inspector']),

  // ============================================================
  // COLLECTION
  // ============================================================
  collection: screen({
    'collection-summary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 174, label: 'Collection summary' }),
    'collection-content': panel({ order: 2, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 0, preferredHeight: 606, label: 'Item collection' }),
    'collection-inspector': panel({ order: 3, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 0, preferredHeight: 606, label: 'Item inspection' }),
  }, ['collection-summary', 'collection-content', 'collection-inspector']),

  // ============================================================
  // BESTIARY
  // ============================================================
  bestiary: screen({
    'bestiary-summary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 174, label: 'Bestiary summary' }),
    'bestiary-index': panel({ order: 2, columnStart: 1, columnSpan: 5, rowStart: 2, minHeight: 0, preferredHeight: 678, label: 'Bestiary index' }),
    'bestiary-inspector': panel({ order: 3, columnStart: 6, columnSpan: 7, rowStart: 2, minHeight: 0, preferredHeight: 678, label: 'Creature dossier' }),
  }, ['bestiary-summary', 'bestiary-index', 'bestiary-inspector']),

  // ============================================================
  // CHANNELING
  // ============================================================
  'tower-channeling': screen({
    'channeling-mana-core': panel({ order: 1, columnStart: 1, columnSpan: 6, rowStart: 1, minHeight: 0, preferredHeight: 354, label: 'Mana Core' }),
    'channeling-echoes': panel({ order: 2, columnStart: 7, columnSpan: 6, rowStart: 1, minHeight: 354, preferredHeight: 354, label: 'Arcane Echoes' }),
    'channeling-breakdown': panel({ order: 3, columnStart: 1, columnSpan: 6, rowStart: 2, minHeight: 354, preferredHeight: 534, label: 'Channeling Breakdown' }),
    'channeling-pillars': panel({ order: 4, columnStart: 7, columnSpan: 6, rowStart: 2, minHeight: 354, preferredHeight: 534, label: 'Pillars of Mana' }),
  }, ['channeling-mana-core', 'channeling-echoes', 'channeling-breakdown', 'channeling-pillars']),

  // ============================================================
  // FOCUS
  // ============================================================
  'tower-focus': screen({
    'focus-summary': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 282, preferredHeight: 498, label: 'Focus overview' }),
    'focus-reservations': panel({ order: 2, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 354, preferredHeight: 570, label: 'Active Focus usage' }),
    'focus-improvement': panel({ order: 3, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 390, preferredHeight: 570, label: 'Focus improvement' }),
  }, ['focus-summary', 'focus-reservations', 'focus-improvement']),

  // ============================================================
  // RESEARCH
  // ============================================================
  'tower-research': screen({
    'research-school-mastery': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 138, preferredHeight: 138, label: 'Magic School Mastery' }),
    'research-library': panel({ order: 2, columnStart: 1, columnSpan: 6, rowStart: 2, minHeight: 282, preferredHeight: 426, label: 'Researchable items' }),
    'research-inspector': panel({ order: 3, columnStart: 7, columnSpan: 6, rowStart: 2, minHeight: 426, preferredHeight: 426, label: 'Item inspection' }),
    'research-prepared': panel({ order: 4, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 246, preferredHeight: 354, label: 'Prepared Research' }),
  }, ['research-school-mastery', 'research-library', 'research-inspector', 'research-prepared']),

  // ============================================================
  // TRANSMUTATION
  // ============================================================
  'tower-transmutation': screen({
    'transmutation-recipes': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 354, preferredHeight: 534, label: 'Recipe library' }),
    'transmutation-focus': panel({ order: 2, columnStart: 1, columnSpan: 7, rowStart: 2, minHeight: 282, preferredHeight: 534, label: 'Focus assignment' }),
    'transmutation-detail': panel({ order: 3, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 282, preferredHeight: 426, label: 'Recipe detail' }),
    'transmutation-arrays': panel({ order: 4, columnStart: 8, columnSpan: 5, rowStart: 2, minHeight: 426, preferredHeight: 642, label: 'Transmutation Arrays' }),
  }, ['transmutation-recipes', 'transmutation-focus', 'transmutation-detail', 'transmutation-arrays']),

  // ============================================================
  // ARTIFICING
  // ============================================================
  'tower-artificing': screen({
    'artificing-catalog': panel({ order: 1, columnStart: 1, columnSpan: 7, rowStart: 1, minHeight: 570, preferredHeight: 1074, label: 'Equipment Catalog' }),
    'artificing-detail': panel({ order: 2, columnStart: 8, columnSpan: 5, rowStart: 1, minHeight: 714, preferredHeight: 1074, label: 'Arcane Forge' }),
  }, ['artificing-catalog', 'artificing-detail']),

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
    'guild-banner': panel({ order: 1, columnStart: 1, columnSpan: 12, rowStart: 1, minHeight: 0, preferredHeight: 174, label: 'Guild banner' }),
    'guild-request-1': panel({ order: 2, columnStart: 1, columnSpan: 4, rowStart: 2, minHeight: 0, preferredHeight: 390, label: 'Request one' }),
    'guild-request-2': panel({ order: 3, columnStart: 5, columnSpan: 4, rowStart: 2, minHeight: 0, preferredHeight: 390, label: 'Request two' }),
    'guild-request-3': panel({ order: 4, columnStart: 9, columnSpan: 4, rowStart: 2, minHeight: 0, preferredHeight: 390, label: 'Request three' }),
    'guild-rank': panel({ order: 5, columnStart: 1, columnSpan: 12, rowStart: 3, minHeight: 0, preferredHeight: 210, label: 'Guild rank' }),
  }, ['guild-banner', 'guild-request-1', 'guild-request-2', 'guild-request-3', 'guild-rank']),

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
