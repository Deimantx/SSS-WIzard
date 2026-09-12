import { useEffect, useState } from 'react'
import type { UiEditorPane, UiEditorPreviewZoom } from './uiEditorTypes'

export type UiEditorWorkspaceMode = 'wide' | 'medium' | 'compact'

export const UI_EDITOR_BREAKPOINTS = {
  compactMax: 1279,
  mediumMax: 1599,
  supportedMin: 1024,
} as const

export const getUiEditorWorkspaceMode = (width: number): UiEditorWorkspaceMode => {
  if (width >= UI_EDITOR_BREAKPOINTS.mediumMax + 1) return 'wide'
  if (width >= UI_EDITOR_BREAKPOINTS.compactMax + 1) return 'medium'
  return 'compact'
}

export const DEFAULT_UI_EDITOR_WORKSPACE = {
  activePane: 'canvas' as UiEditorPane,
  hierarchyVisible: true,
  inspectorVisible: true,
  inspectorWidth: 420,
  hierarchyWidth: 240,
  previewZoom: 'fit' as UiEditorPreviewZoom,
}

export function useUiEditorWorkspaceMode() {
  const [width, setWidth] = useState(() => typeof window === 'undefined' ? UI_EDITOR_BREAKPOINTS.supportedMin : window.innerWidth)

  useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return getUiEditorWorkspaceMode(width)
}
