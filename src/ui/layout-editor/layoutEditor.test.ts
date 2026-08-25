import { beforeEach, describe, expect, it } from 'vitest'
import { UI_LAYOUTS_KEY } from './layoutEditorStorage'
import { closeLayoutEditor, getLayoutEditorState, getSavedScreenLayouts, moveSelectedPanel, openLayoutEditor, resetAllScreenLayouts, selectLayoutPanel, togglePanelHidden, togglePanelLocked, undoLayout, redoLayout, updateSelectedPanel } from './layoutEditorStore'

describe('layout editor persistence and session state', () => {
  beforeEach(() => { localStorage.clear(); resetAllScreenLayouts(); closeLayoutEditor(); Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 }) })

  it('keeps editor state transient while saving only screen geometry', () => {
    expect(openLayoutEditor('home')).toBe(true)
    selectLayoutPanel('home-wizard')
    updateSelectedPanel('home', { x: 5, w: 6 })
    closeLayoutEditor()
    expect(getLayoutEditorState().isEditing).toBe(false)
    expect(JSON.parse(localStorage.getItem(UI_LAYOUTS_KEY) ?? '{}')).toMatchObject({ version: 3, screens: { home: { 'home-wizard': { x: 5, w: 6 } } }, shell: { topbar: { widths: { 'topbar-mana': 600 } } } })
    expect(Object.prototype.hasOwnProperty.call(getLayoutEditorState(), 'document')).toBe(true)
  })

  it('supports undo and redo for panel property changes', () => {
    openLayoutEditor('home'); selectLayoutPanel('home-wizard'); updateSelectedPanel('home', { w: 8 }); expect(getSavedScreenLayouts('home')['home-wizard'].w).toBe(8)
    undoLayout(); expect(getSavedScreenLayouts('home')['home-wizard'].w).toBe(5)
    redoLayout(); expect(getSavedScreenLayouts('home')['home-wizard'].w).toBe(8)
  })

  it('does not move locked panels and keeps hidden panels in the editor document', () => {
    openLayoutEditor('home'); selectLayoutPanel('home-wizard'); togglePanelLocked('home', 'home-wizard'); moveSelectedPanel('home', 'x', -1); expect(getSavedScreenLayouts('home')['home-wizard'].x).toBe(7)
    togglePanelHidden('home', 'home-wizard'); expect(getSavedScreenLayouts('home')['home-wizard'].hidden).toBe(true)
  })

  it('guards editor entry below desktop width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 900 }); expect(openLayoutEditor('home')).toBe(false); expect(getLayoutEditorState().isEditing).toBe(false); expect(getLayoutEditorState().notice).toContain('desktop-sized')
  })
})
