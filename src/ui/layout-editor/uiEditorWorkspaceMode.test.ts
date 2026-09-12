import { beforeEach, describe, expect, it } from 'vitest'
import { getUiEditorWorkspaceMode } from './uiEditorWorkspaceMode'
import { UI_EDITOR_WORKSPACE_KEY, loadUiEditorWorkspace, saveUiEditorWorkspace } from './uiEditorStorage'

describe('advanced UI editor responsive workspace', () => {
  beforeEach(() => localStorage.removeItem(UI_EDITOR_WORKSPACE_KEY))

  it('maps supported widths to one centralized workspace mode', () => {
    expect(getUiEditorWorkspaceMode(1600)).toBe('wide')
    expect(getUiEditorWorkspaceMode(1599)).toBe('medium')
    expect(getUiEditorWorkspaceMode(1280)).toBe('medium')
    expect(getUiEditorWorkspaceMode(1279)).toBe('compact')
    expect(getUiEditorWorkspaceMode(1024)).toBe('compact')
    expect(getUiEditorWorkspaceMode(800)).toBe('compact')
  })

  it('persists workspace preferences separately from exported UI presets', () => {
    saveUiEditorWorkspace({ activePane: 'hierarchy', hierarchyVisible: true, inspectorVisible: false, hierarchyWidth: 280, inspectorWidth: 500, previewZoom: 0.75 })
    expect(loadUiEditorWorkspace()).toEqual({ activePane: 'hierarchy', hierarchyVisible: true, inspectorVisible: false, hierarchyWidth: 280, inspectorWidth: 500, previewZoom: 0.75 })
  })
})
