import { useEffect } from 'react'
import { getRegisteredUiElements, subscribeUiRegistry } from './uiEditorRegistry'
import { getActiveUiPreset, subscribeUiEditor } from './uiEditorStore'
import { resolveUiStyle, syncUiElementStyle } from './uiEditorResolver'
import { isUiEditorEnabled } from './uiEditorAccess'

export function syncRegisteredUiStyles() { const preset = getActiveUiPreset(); for (const entry of getRegisteredUiElements()) syncUiElementStyle(entry.element, resolveUiStyle({ element: entry, preset }).style) }

export function UiEditorRuntime() {
  useEffect(() => { if (!isUiEditorEnabled()) return; syncRegisteredUiStyles(); const refresh = () => syncRegisteredUiStyles(); const unsubscribeEditor = subscribeUiEditor(refresh); const unsubscribeRegistry = subscribeUiRegistry(refresh); return () => { unsubscribeEditor(); unsubscribeRegistry() } }, [])
  return null
}
