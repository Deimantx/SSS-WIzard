import type { ScreenId } from '../../game/types'

export const UI_EDITOR_SCHEMA_VERSION = 1
export const UI_EDITOR_GAME_VERSION = 1

export type UiElementType = 'container' | 'panel' | 'card' | 'text' | 'heading' | 'button' | 'icon-button' | 'image' | 'icon' | 'progress-bar' | 'tab' | 'input' | 'list' | 'grid' | 'divider' | 'badge' | 'tooltip'
export type UiPropertyCategory = 'layout' | 'position' | 'typography' | 'image' | 'appearance' | 'effects'
export type UiLengthUnit = 'px' | '%' | 'rem' | 'fr'
export type UiLength = { value: number; unit: UiLengthUnit } | { keyword: 'auto' }
export type UiColor = { token: string } | { custom: string }

export type UiDisplay = 'block' | 'flex' | 'grid' | 'inline-flex' | 'inline-block' | 'none'
export type UiFlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
export type UiAlign = 'stretch' | 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end'
export type UiOverflow = 'visible' | 'hidden' | 'auto' | 'scroll'
export type UiObjectFit = 'contain' | 'cover' | 'fill' | 'none'
export type UiTextAlign = 'left' | 'center' | 'right' | 'justify'
export type UiTextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'

export interface UiStyleOverride {
  width?: UiLength
  height?: UiLength
  minWidth?: UiLength
  minHeight?: UiLength
  maxWidth?: UiLength
  maxHeight?: UiLength
  marginTop?: UiLength
  marginRight?: UiLength
  marginBottom?: UiLength
  marginLeft?: UiLength
  paddingTop?: UiLength
  paddingRight?: UiLength
  paddingBottom?: UiLength
  paddingLeft?: UiLength
  gap?: UiLength
  rowGap?: UiLength
  columnGap?: UiLength
  display?: UiDisplay
  flexDirection?: UiFlexDirection
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: UiAlign
  alignItems?: UiAlign
  alignSelf?: UiAlign
  gridTemplateColumns?: string
  gridTemplateRows?: string
  overflowX?: UiOverflow
  overflowY?: UiOverflow
  aspectRatio?: number
  xOffset?: UiLength
  yOffset?: UiLength
  scale?: number
  rotation?: number
  transformOrigin?: string
  zIndex?: number
  fontFamily?: string
  fontSize?: UiLength
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
  lineHeight?: number | UiLength
  letterSpacing?: UiLength
  textAlign?: UiTextAlign
  textTransform?: UiTextTransform
  textDecoration?: 'none' | 'underline' | 'line-through'
  whiteSpace?: 'normal' | 'nowrap' | 'pre-wrap'
  textOverflow?: 'clip' | 'ellipsis'
  maxLines?: number
  textShadow?: string
  objectFit?: UiObjectFit
  objectPosition?: string
  imageScale?: number
  iconScale?: number
  background?: UiColor
  borderColor?: UiColor
  borderWidth?: UiLength
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'
  borderRadius?: UiLength
  color?: UiColor
  opacity?: number
  boxShadow?: string
  filter?: string
  backdropFilter?: string
}

export type UiStyleKey = keyof UiStyleOverride
export type UiStyleValue = Exclude<UiStyleOverride[UiStyleKey], undefined>
export type UiOverrideScope = 'element' | 'component' | 'screen'

export interface UiDesignTokens {
  typography?: {
    fontFamilyBody?: string
    fontSizeBase?: UiLength
    fontSizeSmall?: UiLength
    fontSizeLarge?: UiLength
    lineHeightBase?: number
  }
  spacing?: { xs?: UiLength; sm?: UiLength; md?: UiLength; lg?: UiLength; xl?: UiLength }
  panel?: { background?: UiColor; borderRadius?: UiLength; borderWidth?: UiLength; padding?: UiLength }
  card?: { padding?: UiLength; gap?: UiLength; borderRadius?: UiLength }
  button?: { height?: UiLength; padding?: UiLength; borderRadius?: UiLength; fontSize?: UiLength }
  colors?: { text?: UiColor; muted?: UiColor; accent?: UiColor; panel?: UiColor }
}

export interface UiPresetMeta {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface UiPreset {
  schemaVersion: number
  gameUiVersion: number
  meta: UiPresetMeta
  tokens?: UiDesignTokens
  componentStyles?: Record<string, UiStyleOverride>
  screens?: Partial<Record<ScreenId, Record<string, UiStyleOverride>>>
  elements?: Record<string, UiStyleOverride>
}

export interface RegisteredUiElement {
  id: string
  type: UiElementType
  componentType?: string
  screen: string
  parentId?: string
  label: string
  element: HTMLElement
  capabilities: UiPropertyCategory[]
}

export interface UiStyleSourceMap { [key: string]: 'base' | 'token' | 'component' | 'screen' | 'element' }

export interface ResolvedUiStyle {
  style: UiStyleOverride
  sources: UiStyleSourceMap
}

export interface UiValidationIssue { severity: 'ERROR' | 'WARNING' | 'INFO'; path: string; message: string }
export interface UiValidationReport { valid: boolean; issues: UiValidationIssue[]; validChanges: number }
