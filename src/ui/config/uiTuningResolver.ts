import { useSyncExternalStore, type CSSProperties } from 'react'
import type { ScreenId } from '../../game/types'
import { getPanelLayout, getScreenLayout, type ScreenLayoutDefinition, type ScreenPanelLayout } from '../layout/screenPanelLayouts'
import { UI_TUNING, type PanelTuning, type TypographyTuning, type UITuningComponentKey } from './uiTuning'
import { getUITuningDraft, subscribeUITuningDraft, type UITuningDraft } from './uiTuningDraftStore'

type NumberRecord = Record<string, number>
export type UITuningCSSProperties = CSSProperties & Record<`--${string}`, string>

const FALLBACKS: Record<string, NumberRecord> = {
  panel: { padding: 20, headerGap: 15, headerMarginBottom: 18, borderRadius: 10, borderWidth: 1 },
  inventoryItemCard: { minWidth: 102, maxWidth: 126, height: 126, paddingX: 3, paddingY: 3, paddingBottom: 20, cardGap: 4, iconSize: 54, nameFontSize: 10, nameLineHeight: 1.15, nameMaxLines: 2, quantityFontSize: 12, borderWidth: 1, borderRadius: 8, gridGap: 7, newDotSize: 7 },
  equipmentItemCard: { minWidth: 120, height: 90, iconSize: 38, titleFontSize: 12, metadataFontSize: 8, padding: 7, gap: 7, gridGap: 7 },
  spellCardMagicSchools: { minWidth: 160, height: 174, iconSize: 58, nameFontSize: 13, manaFontSize: 11, cooldownFontSize: 11, padding: 12, gap: 8, gridGap: 9 },
  spellCardCombatDeck: { minWidth: 110, height: 74, iconSize: 29, nameFontSize: 11, manaFontSize: 11, cooldownFontSize: 11, padding: 8, gap: 3, gridGap: 7, paddingTop: 8, paddingRight: 32, paddingBottom: 6, paddingLeft: 9 },
  statRow: { labelFontSize: 11, valueFontSize: 11, valueFontWeight: 700 },
  tooltip: { maxWidth: 360, paddingX: 10, paddingY: 8, fontSize: 12, lineHeight: 1.4 },
  typography: { screenTitleFontSize: 40, screenTitleFontWeight: 700, panelTitleFontSize: 14, panelTitleFontWeight: 700, itemNameFontSize: 12, itemNameFontWeight: 600, bodyFontSize: 13, metadataFontSize: 9, metadataLetterSpacing: 0.08, statLabelFontSize: 11, statValueFontSize: 11, statValueFontWeight: 700 },
}

const asNumbers = (value: unknown): NumberRecord => {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'number' && Number.isFinite(item)))
}

export function getUITuningComponent<K extends UITuningComponentKey>(component: K, screen?: ScreenId, draft: UITuningDraft = getUITuningDraft()): typeof UI_TUNING.components[K] {
  const source = asNumbers(UI_TUNING.components[component])
  const screenSource = screen ? asNumbers(UI_TUNING.screens[screen]?.components?.[component]) : {}
  const screenDraft = screen ? asNumbers(draft.screens[screen]?.components?.[component]) : {}
  const draftValues = asNumbers(draft.components[component])
  return { ...FALLBACKS[component], ...source, ...screenSource, ...screenDraft, ...draftValues } as unknown as typeof UI_TUNING.components[K]
}

export function getUITuningPanel(screen?: ScreenId, draft: UITuningDraft = getUITuningDraft()): PanelTuning {
  const source = screen ? asNumbers(UI_TUNING.screens[screen]?.panel) : {}
  const draftValues = screen ? asNumbers(draft.screens[screen]?.panel) : {}
  return { ...FALLBACKS.panel, ...UI_TUNING.panel, ...source, ...asNumbers(draft.panel), ...draftValues } as PanelTuning
}

export function getUITuningTypography(screen?: ScreenId, draft: UITuningDraft = getUITuningDraft()): TypographyTuning {
  const source = screen ? asNumbers(UI_TUNING.screens[screen]?.typography) : {}
  const draftValues = screen ? asNumbers(draft.screens[screen]?.typography) : {}
  return { ...FALLBACKS.typography, ...UI_TUNING.typography, ...source, ...asNumbers(draft.typography), ...draftValues } as TypographyTuning
}

export function getResolvedScreenLayout(screen: ScreenId, draft: UITuningDraft = getUITuningDraft()): ScreenLayoutDefinition {
  const base = getScreenLayout(screen)
  const screenOverride = draft.screens[screen]?.screenLayout ?? {}
  return { ...base, screen: { ...base.screen, ...screenOverride } }
}

export function getResolvedPanelLayout(screen: ScreenId, panelId: string, fallbackOrder = 1, draft: UITuningDraft = getUITuningDraft()): ScreenPanelLayout {
  const base = getPanelLayout(screen, panelId, fallbackOrder)
  const override = draft.panels[screen]?.[panelId]
  return override ? { ...base, ...override } : base
}

const px = (value: number) => `${value}px`
const ratio = (value: number) => `${value}`

export function getUITuningStyle(screen: ScreenId, draft: UITuningDraft = getUITuningDraft()): UITuningCSSProperties {
  const panel = getUITuningPanel(screen, draft)
  const typography = getUITuningTypography(screen, draft)
  const inventory = getUITuningComponent('inventoryItemCard', screen, draft)
  const equipment = getUITuningComponent('equipmentItemCard', screen, draft)
  const schools = getUITuningComponent('spellCardMagicSchools', screen, draft)
  const combat = getUITuningComponent('spellCardCombatDeck', screen, draft)
  const stat = getUITuningComponent('statRow', screen, draft)
  const tooltip = getUITuningComponent('tooltip', screen, draft)
  return {
    '--ui-tuning-panel-padding': px(panel.padding),
    '--ui-tuning-panel-header-gap': px(panel.headerGap),
    '--ui-tuning-panel-header-margin': px(panel.headerMarginBottom),
    '--ui-tuning-panel-radius': px(panel.borderRadius),
    '--ui-tuning-panel-border-width': px(panel.borderWidth),
    '--ui-tuning-screen-title-size': px(typography.screenTitleFontSize),
    '--ui-tuning-screen-title-weight': ratio(typography.screenTitleFontWeight),
    '--ui-tuning-panel-title-size': px(typography.panelTitleFontSize),
    '--ui-tuning-panel-title-weight': ratio(typography.panelTitleFontWeight),
    '--ui-tuning-item-name-size': px(typography.itemNameFontSize),
    '--ui-tuning-item-name-weight': ratio(typography.itemNameFontWeight),
    '--ui-tuning-body-size': px(typography.bodyFontSize),
    '--ui-tuning-metadata-size': px(typography.metadataFontSize),
    '--ui-tuning-metadata-spacing': ratio(typography.metadataLetterSpacing),
    '--ui-tuning-stat-label-size': px(typography.statLabelFontSize),
    '--ui-tuning-stat-value-size': px(typography.statValueFontSize),
    '--ui-tuning-stat-value-weight': ratio(typography.statValueFontWeight),
    '--ui-tuning-inventory-min-width': px(inventory.minWidth),
    '--ui-tuning-inventory-max-width': px(inventory.maxWidth),
    '--ui-tuning-inventory-height': px(inventory.height),
    '--ui-tuning-inventory-padding-x': px(inventory.paddingX),
    '--ui-tuning-inventory-padding-y': px(inventory.paddingY),
    '--ui-tuning-inventory-padding-bottom': px(inventory.paddingBottom),
    '--ui-tuning-inventory-card-gap': px(inventory.cardGap),
    '--ui-tuning-inventory-icon-size': px(inventory.iconSize),
    '--ui-tuning-inventory-name-size': px(inventory.nameFontSize),
    '--ui-tuning-inventory-name-line-height': ratio(inventory.nameLineHeight),
    '--ui-tuning-inventory-name-lines': ratio(inventory.nameMaxLines),
    '--ui-tuning-inventory-quantity-size': px(inventory.quantityFontSize),
    '--ui-tuning-inventory-border-width': px(inventory.borderWidth),
    '--ui-tuning-inventory-radius': px(inventory.borderRadius),
    '--ui-tuning-inventory-grid-gap': px(inventory.gridGap),
    '--ui-tuning-inventory-new-dot-size': px(inventory.newDotSize),
    '--ui-tuning-equipment-min-width': px(equipment.minWidth),
    '--ui-tuning-equipment-height': px(equipment.height),
    '--ui-tuning-equipment-icon-size': px(equipment.iconSize),
    '--ui-tuning-equipment-title-size': px(equipment.titleFontSize),
    '--ui-tuning-equipment-metadata-size': px(equipment.metadataFontSize),
    '--ui-tuning-equipment-padding': px(equipment.padding),
    '--ui-tuning-equipment-gap': px(equipment.gap),
    '--ui-tuning-equipment-grid-gap': px(equipment.gridGap),
    '--ui-tuning-schools-min-width': px(schools.minWidth),
    '--ui-tuning-schools-height': px(schools.height),
    '--ui-tuning-schools-icon-size': px(schools.iconSize),
    '--ui-tuning-schools-name-size': px(schools.nameFontSize),
    '--ui-tuning-schools-mana-size': px(schools.manaFontSize),
    '--ui-tuning-schools-cooldown-size': px(schools.cooldownFontSize),
    '--ui-tuning-schools-padding': px(schools.padding),
    '--ui-tuning-schools-gap': px(schools.gap),
    '--ui-tuning-schools-grid-gap': px(schools.gridGap),
    '--ui-tuning-combat-min-width': px(combat.minWidth),
    '--ui-tuning-combat-height': px(combat.height),
    '--ui-tuning-combat-icon-size': px(combat.iconSize),
    '--ui-tuning-combat-name-size': px(combat.nameFontSize),
    '--ui-tuning-combat-mana-size': px(combat.manaFontSize),
    '--ui-tuning-combat-cooldown-size': px(combat.cooldownFontSize),
    '--ui-tuning-combat-padding-top': px(combat.paddingTop),
    '--ui-tuning-combat-padding-right': px(combat.paddingRight),
    '--ui-tuning-combat-padding-bottom': px(combat.paddingBottom),
    '--ui-tuning-combat-padding-left': px(combat.paddingLeft),
    '--ui-tuning-combat-gap': px(combat.gap),
    '--ui-tuning-combat-grid-gap': px(combat.gridGap),
    '--ui-tuning-stat-row-label-size': px(stat.labelFontSize),
    '--ui-tuning-stat-row-value-size': px(stat.valueFontSize),
    '--ui-tuning-stat-row-value-weight': ratio(stat.valueFontWeight),
    '--ui-tuning-tooltip-max-width': px(tooltip.maxWidth),
    '--ui-tuning-tooltip-padding-x': px(tooltip.paddingX),
    '--ui-tuning-tooltip-padding-y': px(tooltip.paddingY),
    '--ui-tuning-tooltip-font-size': px(tooltip.fontSize),
    '--ui-tuning-tooltip-line-height': ratio(tooltip.lineHeight),
  }
}

export function useUITuning(screen: ScreenId) {
  const draft = useSyncExternalStore(subscribeUITuningDraft, getUITuningDraft, getUITuningDraft)
  return {
    draft,
    panel: getUITuningPanel(screen, draft),
    typography: getUITuningTypography(screen, draft),
    style: getUITuningStyle(screen, draft),
  }
}
