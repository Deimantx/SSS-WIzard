import type { RegisteredUiElement, ResolvedUiStyle, UiColor, UiDesignTokens, UiLength, UiPreset, UiStyleKey, UiStyleOverride } from './uiEditorTypes'
import type { ScreenId } from '../../game/types'

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const add = (target: UiStyleOverride, sources: Record<string, 'base' | 'token' | 'component' | 'screen' | 'element'>, values: UiStyleOverride, source: 'token' | 'component' | 'screen' | 'element') => { for (const [key, value] of Object.entries(values)) if (value !== undefined) { (target as Record<string, unknown>)[key] = value; sources[key] = source } }

const colorValue = (value?: UiColor) => value && ('token' in value ? `var(${value.token.startsWith('--') ? value.token : `--${value.token}`})` : value.custom)
export const uiLengthToCss = (value?: UiLength) => !value ? undefined : 'keyword' in value ? value.keyword : `${value.value}${value.unit}`

const tokenStyle = (type: RegisteredUiElement['type'], tokens?: UiDesignTokens): UiStyleOverride => {
  if (!tokens) return {}
  const style: UiStyleOverride = {}
  const typography = tokens.typography
  if (typography && ['text', 'heading', 'button', 'tab', 'badge'].includes(type)) { if (typography.fontFamilyBody) style.fontFamily = typography.fontFamilyBody; if (typography.fontSizeBase) style.fontSize = copy(typography.fontSizeBase); if (typography.lineHeightBase !== undefined) style.lineHeight = typography.lineHeightBase }
  const panel = tokens.panel
  if (panel && ['panel', 'card', 'container'].includes(type)) { if (panel.background) style.background = copy(panel.background); if (panel.borderRadius) style.borderRadius = copy(panel.borderRadius); if (panel.borderWidth) style.borderWidth = copy(panel.borderWidth); if (panel.padding) { style.paddingTop = copy(panel.padding); style.paddingRight = copy(panel.padding); style.paddingBottom = copy(panel.padding); style.paddingLeft = copy(panel.padding) } }
  const card = tokens.card
  if (card && type === 'card') { if (card.padding) { style.paddingTop = copy(card.padding); style.paddingRight = copy(card.padding); style.paddingBottom = copy(card.padding); style.paddingLeft = copy(card.padding) }; if (card.gap) style.gap = copy(card.gap); if (card.borderRadius) style.borderRadius = copy(card.borderRadius) }
  const button = tokens.button
  if (button && ['button', 'icon-button'].includes(type)) { if (button.height) style.height = copy(button.height); if (button.padding) { style.paddingLeft = copy(button.padding); style.paddingRight = copy(button.padding) }; if (button.borderRadius) style.borderRadius = copy(button.borderRadius); if (button.fontSize) style.fontSize = copy(button.fontSize) }
  if (tokens.colors) { const colorTokens = tokens.colors; if (colorTokens.text) style.color = copy(colorTokens.text); if (colorTokens.muted) style.color = copy(colorTokens.muted) }
  return style
}

export function resolveUiStyle({ element, preset }: { element: Pick<RegisteredUiElement, 'id' | 'screen' | 'componentType' | 'type'>; preset: UiPreset }): ResolvedUiStyle {
  const style: UiStyleOverride = {}
  const sources: Record<string, 'base' | 'token' | 'component' | 'screen' | 'element'> = {}
  add(style, sources, tokenStyle(element.type, preset.tokens), 'token')
  if (element.componentType) add(style, sources, preset.componentStyles?.[element.componentType] ?? {}, 'component')
  add(style, sources, preset.screens?.[element.screen as ScreenId]?.[element.id] ?? {}, 'screen')
  add(style, sources, preset.elements?.[element.id] ?? {}, 'element')
  return { style, sources }
}

const colorCss = (value?: UiColor) => colorValue(value)
export const UI_EDITOR_CSS_PROPERTIES: readonly UiStyleKey[] = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap', 'rowGap', 'columnGap', 'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'gridTemplateColumns', 'gridTemplateRows', 'overflowX', 'overflowY', 'aspectRatio', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'whiteSpace', 'textOverflow', 'maxLines', 'textShadow', 'objectFit', 'objectPosition', 'opacity', 'background', 'borderColor', 'borderWidth', 'borderStyle', 'borderRadius', 'color', 'boxShadow', 'filter', 'backdropFilter', 'zIndex', 'transformOrigin', 'xOffset', 'yOffset', 'scale', 'rotation', 'imageScale', 'iconScale']

const cssName: Partial<Record<UiStyleKey, string>> = { minWidth: 'min-width', minHeight: 'min-height', maxWidth: 'max-width', maxHeight: 'max-height', marginTop: 'margin-top', marginRight: 'margin-right', marginBottom: 'margin-bottom', marginLeft: 'margin-left', paddingTop: 'padding-top', paddingRight: 'padding-right', paddingBottom: 'padding-bottom', paddingLeft: 'padding-left', rowGap: 'row-gap', columnGap: 'column-gap', flexDirection: 'flex-direction', flexWrap: 'flex-wrap', justifyContent: 'justify-content', alignItems: 'align-items', alignSelf: 'align-self', gridTemplateColumns: 'grid-template-columns', gridTemplateRows: 'grid-template-rows', overflowX: 'overflow-x', overflowY: 'overflow-y', aspectRatio: 'aspect-ratio', fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', fontStyle: 'font-style', lineHeight: 'line-height', letterSpacing: 'letter-spacing', textAlign: 'text-align', textTransform: 'text-transform', textDecoration: 'text-decoration', whiteSpace: 'white-space', textOverflow: 'text-overflow', maxLines: '-webkit-line-clamp', objectFit: 'object-fit', objectPosition: 'object-position', borderColor: 'border-color', borderWidth: 'border-width', borderStyle: 'border-style', borderRadius: 'border-radius', boxShadow: 'box-shadow', backdropFilter: 'backdrop-filter', zIndex: 'z-index', transformOrigin: 'transform-origin' }

function cssValue(key: UiStyleKey, value: unknown) {
  if (['background', 'borderColor', 'color'].includes(key)) return colorCss(value as UiColor)
  if (['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap', 'rowGap', 'columnGap', 'fontSize', 'letterSpacing', 'borderWidth', 'borderRadius', 'xOffset', 'yOffset'].includes(key)) return uiLengthToCss(value as UiLength)
  if (key === 'lineHeight' && typeof value === 'object') return uiLengthToCss(value as UiLength)
  return value === undefined ? undefined : String(value)
}

function transformCss(style: UiStyleOverride) {
  const x = uiLengthToCss(style.xOffset) ?? '0px'; const y = uiLengthToCss(style.yOffset) ?? '0px'; const scale = style.scale ?? 1; const rotation = style.rotation ?? 0
  return x === '0px' && y === '0px' && scale === 1 && rotation === 0 ? undefined : `translate(${x}, ${y}) scale(${scale}) rotate(${rotation}deg)`
}

const editorOwnedProperties = new WeakMap<HTMLElement, Set<string>>()
const authoredInlineValues = new WeakMap<HTMLElement, Map<string, string>>()

export function syncUiElementStyle(element: HTMLElement, resolved: UiStyleOverride) {
  const previous = editorOwnedProperties.get(element) ?? new Set<string>()
  const authored = authoredInlineValues.get(element) ?? new Map<string, string>()
  for (const property of previous) { const authoredValue = authored.get(property) ?? ''; if (authoredValue) element.style.setProperty(property, authoredValue); else element.style.removeProperty(property) }

  const values = new Map<string, string>()
  for (const [key, value] of Object.entries(resolved) as [UiStyleKey, unknown][]) {
    const css = cssValue(key, value)
    if (css === undefined) continue
    const property = cssName[key] ?? key
    values.set(property, css)
  }

  const transform = transformCss(resolved)
  if (transform) values.set('transform', transform)
  if (resolved.maxLines !== undefined) {
    values.set('display', '-webkit-box'); values.set('overflow', 'hidden'); values.set('-webkit-box-orient', 'vertical')
  }
  if (resolved.imageScale !== undefined || resolved.iconScale !== undefined) {
    const scale = resolved.imageScale ?? resolved.iconScale
    values.set('transform', `scale(${scale})`)
  }

  for (const property of previous) if (!values.has(property)) authored.delete(property)
  for (const [property, value] of values) { if (!authored.has(property)) authored.set(property, element.style.getPropertyValue(property)); element.style.setProperty(property, value) }
  if (authored.size) authoredInlineValues.set(element, authored)
  else authoredInlineValues.delete(element)
  const next = new Set(values.keys())
  editorOwnedProperties.set(element, next)
  if (next.size) element.dataset.uiEditorOverride = 'true'
  else delete element.dataset.uiEditorOverride
}
