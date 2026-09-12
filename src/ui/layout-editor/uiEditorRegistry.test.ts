import { afterEach, describe, expect, it } from 'vitest'
import { getRegisteredUiElement, getUiRegistryDuplicates, registerUiElement } from './uiEditorRegistry'

const metadata = { id: 'test.element', type: 'card' as const, screen: 'test', label: 'Test element', capabilities: ['layout' as const] }

describe('advanced UI editor stable ID registry', () => {
  const cleanups: Array<() => void> = []
  afterEach(() => { while (cleanups.length) cleanups.pop()?.() })

  it('reports duplicate stable IDs and does not silently select one', () => {
    cleanups.push(registerUiElement(metadata, document.createElement('div')))
    cleanups.push(registerUiElement(metadata, document.createElement('div')))
    expect(getUiRegistryDuplicates()).toContain('test.element')
    expect(getRegisteredUiElement('test.element')).toBeNull()
  })
})
