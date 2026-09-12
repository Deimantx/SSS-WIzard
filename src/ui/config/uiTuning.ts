import type { ScreenId } from '../../game/types'

/**
 * Source-controlled visual defaults. Gameplay, save data, and authored content
 * must never depend on this object.
 */
export const UI_TUNING_VERSION = 1

export interface PanelTuning {
  padding: number
  headerGap: number
  headerMarginBottom: number
  borderRadius: number
  borderWidth: number
}

export interface InventoryItemCardTuning {
  minWidth: number
  maxWidth: number
  height: number
  paddingX: number
  paddingY: number
  paddingBottom: number
  cardGap: number
  iconSize: number
  nameFontSize: number
  nameLineHeight: number
  nameMaxLines: number
  quantityFontSize: number
  borderWidth: number
  borderRadius: number
  gridGap: number
  newDotSize: number
}

export interface EquipmentItemCardTuning {
  minWidth: number
  height: number
  iconSize: number
  titleFontSize: number
  metadataFontSize: number
  padding: number
  gap: number
  gridGap: number
}

export interface SpellCardTuning {
  minWidth: number
  height: number
  iconSize: number
  nameFontSize: number
  manaFontSize: number
  cooldownFontSize: number
  padding: number
  gap: number
  gridGap: number
}

export interface CombatSpellCardTuning extends SpellCardTuning {
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

export interface StatRowTuning {
  labelFontSize: number
  valueFontSize: number
  valueFontWeight: number
}

export interface TooltipTuning {
  maxWidth: number
  paddingX: number
  paddingY: number
  fontSize: number
  lineHeight: number
}

export interface TypographyTuning {
  screenTitleFontSize: number
  screenTitleFontWeight: number
  panelTitleFontSize: number
  panelTitleFontWeight: number
  itemNameFontSize: number
  itemNameFontWeight: number
  bodyFontSize: number
  metadataFontSize: number
  metadataLetterSpacing: number
  statLabelFontSize: number
  statValueFontSize: number
  statValueFontWeight: number
}

export type UITuningComponentKey =
  | 'inventoryItemCard'
  | 'equipmentItemCard'
  | 'spellCardMagicSchools'
  | 'spellCardCombatDeck'
  | 'statRow'
  | 'tooltip'

export interface UITuningComponents {
  inventoryItemCard: InventoryItemCardTuning
  equipmentItemCard: EquipmentItemCardTuning
  spellCardMagicSchools: SpellCardTuning
  spellCardCombatDeck: CombatSpellCardTuning
  statRow: StatRowTuning
  tooltip: TooltipTuning
}

export interface UITuningScreenOverride {
  panel?: Partial<PanelTuning>
  typography?: Partial<TypographyTuning>
  components?: Partial<{
    [K in UITuningComponentKey]: Partial<UITuningComponents[K]>
  }>
}

export interface UITuningConfig {
  version: number
  panel: PanelTuning
  components: UITuningComponents
  typography: TypographyTuning
  screens: Partial<Record<ScreenId, UITuningScreenOverride>>
}

export const UI_TUNING: UITuningConfig = {
  version: UI_TUNING_VERSION,
  panel: {
    padding: 20,
    headerGap: 15,
    headerMarginBottom: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  components: {
    inventoryItemCard: {
      minWidth: 60,
      maxWidth: 80,
      height: 126,
      paddingX: 3,
      paddingY: 3,
      paddingBottom: 20,
      cardGap: 4,
      iconSize: 54,
      nameFontSize: 12,
      nameLineHeight: 1.15,
      nameMaxLines: 2,
      quantityFontSize: 12,
      borderWidth: 1,
      borderRadius: 8,
      gridGap: 7,
      newDotSize: 7,
    },
    equipmentItemCard: {
      minWidth: 120,
      height: 90,
      iconSize: 38,
      titleFontSize: 12,
      metadataFontSize: 8,
      padding: 7,
      gap: 7,
      gridGap: 7,
    },
    spellCardMagicSchools: {
      minWidth: 160,
      height: 174,
      iconSize: 58,
      nameFontSize: 13,
      manaFontSize: 11,
      cooldownFontSize: 11,
      padding: 12,
      gap: 8,
      gridGap: 9,
    },
    spellCardCombatDeck: {
      minWidth: 110,
      height: 74,
      iconSize: 29,
      nameFontSize: 11,
      manaFontSize: 11,
      cooldownFontSize: 11,
      padding: 8,
      gap: 3,
      gridGap: 7,
      paddingTop: 8,
      paddingRight: 32,
      paddingBottom: 6,
      paddingLeft: 9,
    },
    statRow: {
      labelFontSize: 11,
      valueFontSize: 11,
      valueFontWeight: 700,
    },
    tooltip: {
      maxWidth: 360,
      paddingX: 10,
      paddingY: 8,
      fontSize: 12,
      lineHeight: 1.4,
    },
  },
  typography: {
    // These defaults match the current desktop CSS rather than changing the
    // established screen hierarchy when the tuning layer is first enabled.
    screenTitleFontSize: 40,
    screenTitleFontWeight: 700,
    panelTitleFontSize: 14,
    panelTitleFontWeight: 700,
    itemNameFontSize: 12,
    itemNameFontWeight: 600,
    bodyFontSize: 13,
    metadataFontSize: 9,
    metadataLetterSpacing: 0.08,
    statLabelFontSize: 11,
    statValueFontSize: 11,
    statValueFontWeight: 700,
  },
  screens: {
    inventory: { components: { inventoryItemCard: { gridGap: 7 } } },
    equipment: { components: { equipmentItemCard: { gridGap: 7 } } },
    schools: { components: { spellCardMagicSchools: { gridGap: 9 } } },
    combat: { components: { spellCardCombatDeck: { gridGap: 7 } } },
  },
}
