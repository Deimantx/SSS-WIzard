import { createElement, useEffect, useRef, type ElementType, type ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { registerUiElement } from './uiEditorRegistry'
import type { UiElementType, UiPropertyCategory } from './uiEditorTypes'

export function UiEditable({ uiId, type, screen, label, componentType, parentId, capabilities, as = 'div', children }: { uiId: string; type: UiElementType; screen: ScreenId | string; label: string; componentType?: string; parentId?: string; capabilities?: UiPropertyCategory[]; as?: ElementType; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { if (!ref.current) return; return registerUiElement({ id: uiId, type, screen, label, componentType, parentId, capabilities: capabilities ?? ['layout', 'position', 'appearance'] }, ref.current) }, [capabilities, componentType, label, parentId, screen, type, uiId])
  return createElement(as, { ref, 'data-ui-id': uiId, 'data-ui-type': type, 'data-ui-component': componentType, 'data-ui-editable': 'true' }, children)
}
