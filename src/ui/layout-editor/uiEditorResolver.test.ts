import { describe, expect, it } from 'vitest'
import { resolveUiStyle, syncUiElementStyle } from './uiEditorResolver'
import type { RegisteredUiElement, UiPreset } from './uiEditorTypes'

const preset = (): UiPreset => ({ schemaVersion: 1, gameUiVersion: 1, meta: { id: 'test', name: 'Test', description: '', createdAt: '', updatedAt: '' }, tokens: { typography: { fontSizeBase: { value: 14, unit: 'px' } } }, componentStyles: { 'item-card': { paddingTop: { value: 8, unit: 'px' }, fontWeight: 500 } }, screens: { inventory: { 'inventory.item': { fontWeight: 600 } } }, elements: { 'inventory.item': { fontSize: { value: 18, unit: 'px' } } } })
const element: RegisteredUiElement = { id: 'inventory.item', type: 'text', componentType: 'item-card', screen: 'inventory', label: 'Item', element: document.createElement('div'), capabilities: ['layout', 'typography'] }

describe('advanced UI editor style resolver', () => {
  it('applies layers in token, component, screen, element order', () => {
    const result = resolveUiStyle({ element, preset: preset() })
    expect(result.style.fontSize).toEqual({ value: 18, unit: 'px' })
    expect(result.style.fontWeight).toBe(600)
    expect(result.style.paddingTop).toEqual({ value: 8, unit: 'px' })
    expect(result.sources.fontSize).toBe('element')
    expect(result.sources.fontWeight).toBe('screen')
  })

  it('applies only supported resolved properties to a live element', () => {
    syncUiElementStyle(element.element, { width: { value: 96, unit: 'px' }, opacity: 0.5, xOffset: { value: 4, unit: 'px' }, yOffset: { value: 2, unit: 'px' }, scale: 1.1 })
    expect(element.element.style.width).toBe('96px')
    expect(element.element.style.opacity).toBe('0.5')
    expect(element.element.style.transform).toBe('translate(4px, 2px) scale(1.1) rotate(0deg)')
    syncUiElementStyle(element.element, {})
    expect(element.element.style.width).toBe('')
    expect(element.element.style.transform).toBe('')
  })

  it('does not remove an authored inline property when no editor override remains', () => {
    const authored = document.createElement('div')
    authored.style.width = '120px'
    authored.style.transform = 'translateX(2px)'
    syncUiElementStyle(authored, {})
    expect(authored.style.width).toBe('120px')
    expect(authored.style.transform).toBe('translateX(2px)')
    syncUiElementStyle(authored, { width: { value: 96, unit: 'px' } })
    expect(authored.style.width).toBe('96px')
    syncUiElementStyle(authored, {})
    expect(authored.style.width).toBe('120px')
    expect(authored.style.transform).toBe('translateX(2px)')
  })
})
