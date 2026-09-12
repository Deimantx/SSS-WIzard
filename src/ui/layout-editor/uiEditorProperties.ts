import type { UiElementType, UiPropertyCategory, UiStyleKey } from './uiEditorTypes'

export interface UiPropertyDefinition {
  key: UiStyleKey
  label: string
  category: UiPropertyCategory
  valueType: 'length' | 'number' | 'enum' | 'color' | 'text'
  min?: number
  max?: number
  step?: number
  allowedValues?: readonly string[]
}

const length = (key: UiStyleKey, label: string, category: UiPropertyCategory, min = -2000, max = 4000): UiPropertyDefinition => ({ key, label, category, valueType: 'length', min, max })
const number = (key: UiStyleKey, label: string, category: UiPropertyCategory, min?: number, max?: number, step = 1): UiPropertyDefinition => ({ key, label, category, valueType: 'number', min, max, step })
const enumValue = (key: UiStyleKey, label: string, category: UiPropertyCategory, allowedValues: readonly string[]): UiPropertyDefinition => ({ key, label, category, valueType: 'enum', allowedValues })
const color = (key: UiStyleKey, label: string): UiPropertyDefinition => ({ key, label, category: 'appearance', valueType: 'color' })
const text = (key: UiStyleKey, label: string, category: UiPropertyCategory): UiPropertyDefinition => ({ key, label, category, valueType: 'text' })

export const UI_PROPERTY_REGISTRY: readonly UiPropertyDefinition[] = [
  length('width', 'Width', 'layout', 0, 4000), length('height', 'Height', 'layout', 0, 4000),
  length('minWidth', 'Min width', 'layout', 0, 4000), length('minHeight', 'Min height', 'layout', 0, 4000),
  length('maxWidth', 'Max width', 'layout', 0, 4000), length('maxHeight', 'Max height', 'layout', 0, 4000),
  length('marginTop', 'Margin top', 'layout'), length('marginRight', 'Margin right', 'layout'), length('marginBottom', 'Margin bottom', 'layout'), length('marginLeft', 'Margin left', 'layout'),
  length('paddingTop', 'Padding top', 'layout', 0, 2000), length('paddingRight', 'Padding right', 'layout', 0, 2000), length('paddingBottom', 'Padding bottom', 'layout', 0, 2000), length('paddingLeft', 'Padding left', 'layout', 0, 2000),
  length('gap', 'Gap', 'layout', 0, 500), length('rowGap', 'Row gap', 'layout', 0, 500), length('columnGap', 'Column gap', 'layout', 0, 500),
  enumValue('display', 'Display', 'layout', ['block', 'flex', 'grid', 'inline-flex', 'inline-block', 'none']),
  enumValue('flexDirection', 'Flex direction', 'layout', ['row', 'column', 'row-reverse', 'column-reverse']), enumValue('flexWrap', 'Flex wrap', 'layout', ['nowrap', 'wrap', 'wrap-reverse']),
  enumValue('justifyContent', 'Justify', 'layout', ['stretch', 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'flex-start', 'flex-end']), enumValue('alignItems', 'Align items', 'layout', ['stretch', 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly', 'flex-start', 'flex-end']), enumValue('alignSelf', 'Align self', 'layout', ['auto', 'stretch', 'start', 'center', 'end', 'flex-start', 'flex-end']),
  text('gridTemplateColumns', 'Grid columns', 'layout'), text('gridTemplateRows', 'Grid rows', 'layout'), enumValue('overflowX', 'Overflow X', 'layout', ['visible', 'hidden', 'auto', 'scroll']), enumValue('overflowY', 'Overflow Y', 'layout', ['visible', 'hidden', 'auto', 'scroll']), number('aspectRatio', 'Aspect ratio', 'layout', 0.1, 10, 0.05),
  length('xOffset', 'X offset', 'position'), length('yOffset', 'Y offset', 'position'), number('scale', 'Scale', 'position', 0.25, 4, 0.05), number('rotation', 'Rotation', 'position', -360, 360, 1), text('transformOrigin', 'Transform origin', 'position'), number('zIndex', 'Z-index', 'position', -100, 100, 1),
  text('fontFamily', 'Font family', 'typography'), length('fontSize', 'Font size', 'typography', 6, 96), number('fontWeight', 'Font weight', 'typography', 100, 900, 100), enumValue('fontStyle', 'Font style', 'typography', ['normal', 'italic']),
  number('lineHeight', 'Line height', 'typography', 0.5, 4, 0.05), length('letterSpacing', 'Letter spacing', 'typography', -20, 40), enumValue('textAlign', 'Text align', 'typography', ['left', 'center', 'right', 'justify']), enumValue('textTransform', 'Text transform', 'typography', ['none', 'uppercase', 'lowercase', 'capitalize']), enumValue('textDecoration', 'Decoration', 'typography', ['none', 'underline', 'line-through']), enumValue('whiteSpace', 'White space', 'typography', ['normal', 'nowrap', 'pre-wrap']), enumValue('textOverflow', 'Text overflow', 'typography', ['clip', 'ellipsis']), number('maxLines', 'Max lines', 'typography', 1, 20, 1), text('textShadow', 'Text shadow', 'typography'),
  enumValue('objectFit', 'Object fit', 'image', ['contain', 'cover', 'fill', 'none']), text('objectPosition', 'Object position', 'image'), number('imageScale', 'Image scale', 'image', 0.25, 4, 0.05), number('iconScale', 'Icon scale', 'image', 0.25, 4, 0.05),
  color('background', 'Background'), color('borderColor', 'Border color'), length('borderWidth', 'Border width', 'appearance', 0, 40), enumValue('borderStyle', 'Border style', 'appearance', ['none', 'solid', 'dashed', 'dotted']), length('borderRadius', 'Border radius', 'appearance', 0, 100), color('color', 'Text color'), number('opacity', 'Opacity', 'appearance', 0, 1, 0.05),
  text('boxShadow', 'Box shadow', 'effects'), text('filter', 'Filter', 'effects'), text('backdropFilter', 'Backdrop blur', 'effects'),
]

const typeCategories: Record<UiElementType, UiPropertyCategory[]> = {
  container: ['layout', 'position', 'appearance', 'effects'], panel: ['layout', 'position', 'appearance', 'effects'], card: ['layout', 'position', 'appearance', 'effects'], text: ['layout', 'position', 'typography', 'appearance', 'effects'], heading: ['layout', 'position', 'typography', 'appearance', 'effects'], button: ['layout', 'position', 'typography', 'appearance', 'effects'], 'icon-button': ['layout', 'position', 'typography', 'appearance', 'effects'], image: ['layout', 'position', 'image', 'appearance', 'effects'], icon: ['layout', 'position', 'image', 'appearance', 'effects'], 'progress-bar': ['layout', 'position', 'appearance', 'effects'], tab: ['layout', 'position', 'typography', 'appearance', 'effects'], input: ['layout', 'position', 'typography', 'appearance', 'effects'], list: ['layout', 'position', 'appearance', 'effects'], grid: ['layout', 'position', 'appearance', 'effects'], divider: ['layout', 'position', 'appearance'], badge: ['layout', 'position', 'typography', 'appearance'], tooltip: ['layout', 'position', 'typography', 'appearance', 'effects'],
}

export function getUiPropertyDefinitions(type: UiElementType) { const categories = typeCategories[type]; return UI_PROPERTY_REGISTRY.filter((property) => categories.includes(property.category)) }
export function getUiPropertyDefinition(key: UiStyleKey) { return UI_PROPERTY_REGISTRY.find((property) => property.key === key) }
export function isUiStyleKey(value: string): value is UiStyleKey { return UI_PROPERTY_REGISTRY.some((property) => property.key === value) }
