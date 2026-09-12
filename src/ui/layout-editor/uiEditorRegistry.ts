import type { RegisteredUiElement, UiElementType, UiPropertyCategory } from './uiEditorTypes'

const entries = new Map<string, RegisteredUiElement[]>()
const listeners = new Set<() => void>()
let version = 0
const emit = () => { version += 1; listeners.forEach((listener) => listener()) }

export function registerUiElement(metadata: Omit<RegisteredUiElement, 'element'>, element: HTMLElement) {
  const entry = { ...metadata, element }
  const current = entries.get(metadata.id) ?? []
  entries.set(metadata.id, [...current, entry])
  emit()
  return () => {
    const next = (entries.get(metadata.id) ?? []).filter((candidate) => candidate.element !== element)
    if (next.length) entries.set(metadata.id, next)
    else entries.delete(metadata.id)
    emit()
  }
}

export function getRegisteredUiElements() { return Array.from(entries.values()).flat().filter((entry) => entry.element.isConnected || typeof document === 'undefined') }
export function getRegisteredUiElement(id: string) { const matches = entries.get(id) ?? []; return matches.length === 1 ? matches[0] : null }
export function getUiRegistryDuplicates() { return Array.from(entries.entries()).filter(([, values]) => values.length > 1).map(([id]) => id) }
export function getUiRegistryVersion() { return version }
export function subscribeUiRegistry(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }

export function registerUiElementFromDataset(element: HTMLElement, metadata: { id: string; type: UiElementType; componentType?: string; screen: string; parentId?: string; label: string; capabilities: UiPropertyCategory[] }) { return registerUiElement(metadata, element) }
