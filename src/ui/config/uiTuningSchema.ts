import type { UITuningComponentKey } from './uiTuning'

export type UITuningTarget =
  | 'panel'
  | 'panelGeometry'
  | 'screenLayout'
  | 'typography'
  | UITuningComponentKey

export interface UITuningFieldSchema {
  target: UITuningTarget
  key: string
  label: string
  section: 'layout' | 'spacing' | 'typography' | 'icon' | 'border' | 'grid'
  min: number
  max: number
  step: number
  unit?: 'px' | 'number' | 'ratio'
}

export const UI_TUNING_SCHEMA: readonly UITuningFieldSchema[] = [
  { target: 'panel', key: 'padding', label: 'Panel padding', section: 'spacing', min: 0, max: 48, step: 1, unit: 'px' },
  { target: 'panel', key: 'headerGap', label: 'Header gap', section: 'spacing', min: 0, max: 40, step: 1, unit: 'px' },
  { target: 'panel', key: 'headerMarginBottom', label: 'Header bottom gap', section: 'spacing', min: 0, max: 48, step: 1, unit: 'px' },
  { target: 'panel', key: 'borderRadius', label: 'Panel radius', section: 'border', min: 0, max: 24, step: 1, unit: 'px' },
  { target: 'panel', key: 'borderWidth', label: 'Panel border', section: 'border', min: 0, max: 4, step: 1, unit: 'px' },

  { target: 'panelGeometry', key: 'columnStart', label: 'Column start', section: 'layout', min: 1, max: 12, step: 1, unit: 'number' },
  { target: 'panelGeometry', key: 'columnSpan', label: 'Column span', section: 'layout', min: 1, max: 12, step: 1, unit: 'number' },
  { target: 'panelGeometry', key: 'rowStart', label: 'Row start', section: 'layout', min: 1, max: 99, step: 1, unit: 'number' },
  { target: 'panelGeometry', key: 'minHeight', label: 'Minimum height', section: 'layout', min: 0, max: 2400, step: 1, unit: 'px' },
  { target: 'panelGeometry', key: 'preferredHeight', label: 'Preferred height', section: 'layout', min: 0, max: 2400, step: 1, unit: 'px' },
  { target: 'panelGeometry', key: 'maxHeight', label: 'Maximum height', section: 'layout', min: 0, max: 2400, step: 1, unit: 'px' },

  { target: 'screenLayout', key: 'columnGap', label: 'Column gap', section: 'spacing', min: 0, max: 64, step: 1, unit: 'px' },
  { target: 'screenLayout', key: 'rowGap', label: 'Row gap', section: 'spacing', min: 0, max: 64, step: 1, unit: 'px' },

  { target: 'inventoryItemCard', key: 'minWidth', label: 'Minimum width', section: 'layout', min: 72, max: 240, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'maxWidth', label: 'Maximum width', section: 'layout', min: 72, max: 280, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'height', label: 'Card height', section: 'layout', min: 72, max: 320, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'paddingX', label: 'Horizontal padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'paddingY', label: 'Vertical padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'paddingBottom', label: 'Bottom padding', section: 'spacing', min: 0, max: 48, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'cardGap', label: 'Card content gap', section: 'spacing', min: 0, max: 24, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'iconSize', label: 'Icon size', section: 'icon', min: 18, max: 96, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'nameFontSize', label: 'Name size', section: 'typography', min: 8, max: 24, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'nameLineHeight', label: 'Name line height', section: 'typography', min: 0.9, max: 2, step: 0.05, unit: 'ratio' },
  { target: 'inventoryItemCard', key: 'nameMaxLines', label: 'Name max lines', section: 'typography', min: 1, max: 4, step: 1, unit: 'number' },
  { target: 'inventoryItemCard', key: 'quantityFontSize', label: 'Quantity size', section: 'typography', min: 8, max: 24, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'borderWidth', label: 'Card border', section: 'border', min: 0, max: 4, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'borderRadius', label: 'Card radius', section: 'border', min: 0, max: 24, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'gridGap', label: 'Grid gap', section: 'grid', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'inventoryItemCard', key: 'newDotSize', label: 'New marker size', section: 'icon', min: 3, max: 16, step: 1, unit: 'px' },

  { target: 'equipmentItemCard', key: 'minWidth', label: 'Minimum width', section: 'layout', min: 96, max: 320, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'height', label: 'Card height', section: 'layout', min: 56, max: 240, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'iconSize', label: 'Icon size', section: 'icon', min: 18, max: 80, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'titleFontSize', label: 'Title size', section: 'typography', min: 8, max: 24, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'metadataFontSize', label: 'Metadata size', section: 'typography', min: 7, max: 18, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'padding', label: 'Card padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'gap', label: 'Card gap', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'equipmentItemCard', key: 'gridGap', label: 'Grid gap', section: 'grid', min: 0, max: 32, step: 1, unit: 'px' },

  { target: 'spellCardMagicSchools', key: 'minWidth', label: 'Minimum width', section: 'layout', min: 96, max: 320, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'height', label: 'Card height', section: 'layout', min: 96, max: 360, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'iconSize', label: 'Icon size', section: 'icon', min: 18, max: 96, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'nameFontSize', label: 'Name size', section: 'typography', min: 8, max: 24, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'manaFontSize', label: 'Mana size', section: 'typography', min: 8, max: 20, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'cooldownFontSize', label: 'Cooldown size', section: 'typography', min: 8, max: 20, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'padding', label: 'Card padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'gap', label: 'Card gap', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'spellCardMagicSchools', key: 'gridGap', label: 'Grid gap', section: 'grid', min: 0, max: 32, step: 1, unit: 'px' },

  { target: 'spellCardCombatDeck', key: 'minWidth', label: 'Minimum width', section: 'layout', min: 72, max: 280, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'height', label: 'Card height', section: 'layout', min: 56, max: 240, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'iconSize', label: 'Icon size', section: 'icon', min: 18, max: 72, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'nameFontSize', label: 'Name size', section: 'typography', min: 8, max: 22, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'manaFontSize', label: 'Mana size', section: 'typography', min: 8, max: 18, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'cooldownFontSize', label: 'Cooldown size', section: 'typography', min: 8, max: 18, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'paddingTop', label: 'Top padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'paddingRight', label: 'Right padding', section: 'spacing', min: 0, max: 48, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'paddingBottom', label: 'Bottom padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'paddingLeft', label: 'Left padding', section: 'spacing', min: 0, max: 32, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'gap', label: 'Card gap', section: 'spacing', min: 0, max: 24, step: 1, unit: 'px' },
  { target: 'spellCardCombatDeck', key: 'gridGap', label: 'Grid gap', section: 'grid', min: 0, max: 32, step: 1, unit: 'px' },

  { target: 'statRow', key: 'labelFontSize', label: 'Label size', section: 'typography', min: 8, max: 22, step: 1, unit: 'px' },
  { target: 'statRow', key: 'valueFontSize', label: 'Value size', section: 'typography', min: 8, max: 22, step: 1, unit: 'px' },
  { target: 'statRow', key: 'valueFontWeight', label: 'Value weight', section: 'typography', min: 400, max: 900, step: 50, unit: 'number' },

  { target: 'tooltip', key: 'maxWidth', label: 'Tooltip max width', section: 'layout', min: 180, max: 640, step: 1, unit: 'px' },
  { target: 'tooltip', key: 'paddingX', label: 'Tooltip horizontal padding', section: 'spacing', min: 4, max: 32, step: 1, unit: 'px' },
  { target: 'tooltip', key: 'paddingY', label: 'Tooltip vertical padding', section: 'spacing', min: 4, max: 32, step: 1, unit: 'px' },
  { target: 'tooltip', key: 'fontSize', label: 'Tooltip text size', section: 'typography', min: 8, max: 20, step: 1, unit: 'px' },
  { target: 'tooltip', key: 'lineHeight', label: 'Tooltip line height', section: 'typography', min: 1, max: 2, step: 0.05, unit: 'ratio' },

  { target: 'typography', key: 'screenTitleFontSize', label: 'Screen title size', section: 'typography', min: 20, max: 64, step: 1, unit: 'px' },
  { target: 'typography', key: 'screenTitleFontWeight', label: 'Screen title weight', section: 'typography', min: 400, max: 900, step: 50, unit: 'number' },
  { target: 'typography', key: 'panelTitleFontSize', label: 'Panel title size', section: 'typography', min: 9, max: 28, step: 1, unit: 'px' },
  { target: 'typography', key: 'panelTitleFontWeight', label: 'Panel title weight', section: 'typography', min: 400, max: 900, step: 50, unit: 'number' },
  { target: 'typography', key: 'itemNameFontSize', label: 'Item name size', section: 'typography', min: 8, max: 28, step: 1, unit: 'px' },
  { target: 'typography', key: 'itemNameFontWeight', label: 'Item name weight', section: 'typography', min: 400, max: 900, step: 50, unit: 'number' },
  { target: 'typography', key: 'bodyFontSize', label: 'Body size', section: 'typography', min: 9, max: 24, step: 1, unit: 'px' },
  { target: 'typography', key: 'metadataFontSize', label: 'Metadata size', section: 'typography', min: 7, max: 18, step: 1, unit: 'px' },
  { target: 'typography', key: 'metadataLetterSpacing', label: 'Metadata spacing', section: 'typography', min: 0, max: 0.3, step: 0.01, unit: 'ratio' },
  { target: 'typography', key: 'statLabelFontSize', label: 'Stat label size', section: 'typography', min: 8, max: 22, step: 1, unit: 'px' },
  { target: 'typography', key: 'statValueFontSize', label: 'Stat value size', section: 'typography', min: 8, max: 22, step: 1, unit: 'px' },
  { target: 'typography', key: 'statValueFontWeight', label: 'Stat value weight', section: 'typography', min: 400, max: 900, step: 50, unit: 'number' },
]

export const getUITuningFieldSchema = (target: UITuningTarget, key: string) => UI_TUNING_SCHEMA.find((field) => field.target === target && field.key === key)
