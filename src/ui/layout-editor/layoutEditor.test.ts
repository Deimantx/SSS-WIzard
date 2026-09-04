import { beforeEach, describe, expect, it } from 'vitest'
import { UI_LAYOUTS_KEY } from './layoutEditorStorage'
import { beginTopbarReorder, beginTopbarResize, cancelTopbarInteraction, closeLayoutEditor, commitGridLayout, commitTopbarInteraction, getLayoutEditorState, getSavedScreenLayouts, getTopbarLayout, moveSelectedPanel, openLayoutEditor, previewTopbarOrder, previewTopbarResize, resetAllScreenLayouts, selectLayoutPanel, setLayoutTarget, togglePanelHidden, togglePanelLocked, undoLayout, redoLayout, updateSelectedPanel } from './layoutEditorStore'
import { clampPanelLayout } from './layoutUtils'
import { getPanelDefinition } from './panelRegistry'

describe('layout editor persistence and session state', () => {
  beforeEach(() => { localStorage.clear(); resetAllScreenLayouts(); closeLayoutEditor(); Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 }) })

  it('keeps editor state transient while saving only screen geometry', () => {
    expect(openLayoutEditor('home')).toBe(true)
    selectLayoutPanel('home-wizard')
    updateSelectedPanel('home', { x: 5, w: 6 })
    closeLayoutEditor()
    expect(getLayoutEditorState().isEditing).toBe(false)
    expect(JSON.parse(localStorage.getItem(UI_LAYOUTS_KEY) ?? '{}')).toMatchObject({ version: 12, screens: { home: { 'home-wizard': { x: 5, w: 6 } } }, shell: { topbar: { widths: { 'topbar-mana': 480 } } } })
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

  it('directly resizes the live shell with one undoable commit', () => {
    openLayoutEditor('home'); setLayoutTarget('shell')
    beginTopbarResize('topbar-mana', 'right', 100); previewTopbarResize(200)
    expect(getTopbarLayout().widths['topbar-mana']).toBe(580)
    expect(JSON.parse(localStorage.getItem(UI_LAYOUTS_KEY) ?? '{}').shell.topbar.widths['topbar-mana']).toBe(480)
    commitTopbarInteraction()
    expect(getTopbarLayout().widths['topbar-mana']).toBe(580)
    undoLayout()
    expect(getTopbarLayout().widths['topbar-mana']).toBe(480)
  })

  it('directly reorders resources and can cancel an interaction', () => {
    openLayoutEditor('home'); setLayoutTarget('shell')
    beginTopbarReorder('topbar-focus', 100); previewTopbarOrder(['topbar-breadcrumb', 'topbar-health', 'topbar-focus', 'topbar-mana', 'topbar-utilities']); commitTopbarInteraction()
    expect(getTopbarLayout().order).toEqual(['topbar-breadcrumb', 'topbar-health', 'topbar-focus', 'topbar-mana', 'topbar-utilities'])
    undoLayout()
    expect(getTopbarLayout().order).toEqual(['topbar-breadcrumb', 'topbar-health', 'topbar-mana', 'topbar-focus', 'topbar-utilities'])
    beginTopbarResize('topbar-health', 'right', 100); previewTopbarResize(1000); cancelTopbarInteraction()
    expect(getTopbarLayout().widths['topbar-health']).toBe(160)
  })

  it('opens the topbar action directly in Header mode with Mana selected', () => {
    openLayoutEditor('home', 'shell')
    expect(getLayoutEditorState().layoutTarget).toBe('shell')
    expect(getLayoutEditorState().selectedShellRegion).toBe('topbar-mana')
    expect(getTopbarLayout().widths['topbar-mana']).toBe(480)
  })

  it('keeps Item Actions at its functional minimum height', () => {
    expect(clampPanelLayout('inventory', 'inventory-actions', { h: 1 }).h).toBe(5)
  })

  it('keeps Research panels at safe minimum heights', () => {
    expect(getPanelDefinition('tower-research', 'research-library')?.minH).toBe(8)
    expect(getPanelDefinition('tower-research', 'research-inspector')?.minH).toBe(12)
    expect(getPanelDefinition('tower-research', 'research-prepared')?.minH).toBe(7)
    expect(clampPanelLayout('tower-research', 'research-inspector', { h: 1 }).h).toBe(12)
    expect(getPanelDefinition('tower-transmutation', 'transmutation-recipes')?.heightMode).toBe('bounded-scroll')
    expect(getPanelDefinition('tower-transmutation', 'transmutation-detail')?.heightMode ?? 'content').toBe('content')
  })

  it('persists only the panel directly changed by a grid interaction', () => {
    openLayoutEditor('home')
    const before = getSavedScreenLayouts('home')
    commitGridLayout('home', [
      { i: 'home-objective', x: 0, y: 0, w: 12, h: 8 },
      { i: 'home-school-mastery', x: 0, y: 8, w: 12, h: 10 },
    ], 'home-objective')
    expect(getSavedScreenLayouts('home')['home-objective'].h).toBe(8)
    expect(getSavedScreenLayouts('home')['home-school-mastery']).toEqual(before['home-school-mastery'])
  })
})
