import { useSyncExternalStore } from 'react'
import type { ScreenId } from '../../game/types'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { getPanelDefinitions } from './panelRegistry'
import { loadUiLayouts, resetUiLayouts, saveUiLayouts } from './layoutEditorStorage'
import { clampPanelLayout, getScreenLayouts, isDesktopLayout } from './layoutUtils'
import { clampTopbarLayout, DEFAULT_TOPBAR_LAYOUT, moveTopbarResource, TOPBAR_PRESETS } from './shellLayout'
import { LAYOUT_VERSION, type LayoutEditorState, SavedPanelLayout, ScreenLayouts, TopbarLayout, TopbarRegionId, UiLayoutDocument } from './layoutEditorTypes'

type Snapshot = LayoutEditorState & { document: UiLayoutDocument }
const listeners = new Set<() => void>()
let documentState = loadUiLayouts()
let snapshot: Snapshot = { isEditing: false, layoutTarget: 'screen', shellInteraction: 'idle', shellPreview: null, selectedShellRegion: null, selectedPanelId: null, showGrid: true, panelInteraction: false, notice: null, undoDepth: 0, redoDepth: 0, document: documentState }
let undoStack: UiLayoutDocument[] = []
let redoStack: UiLayoutDocument[] = []
type ShellInteraction = { kind: 'dragging' | 'resizing'; regionId: TopbarRegionId; startX: number; edge?: 'left' | 'right'; startLayout: TopbarLayout }
let shellInteraction: ShellInteraction | null = null
const clearShellInteractionCursor = () => { if (typeof document !== 'undefined') document.body.classList.remove('shell-layout-interacting') }

const emit = () => listeners.forEach((listener) => listener())
const publish = (changes: Partial<Snapshot>) => { snapshot = { ...snapshot, ...changes, document: documentState, undoDepth: undoStack.length, redoDepth: redoStack.length }; emit() }
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const commitDocument = (next: UiLayoutDocument, record = true) => {
  if (record) { undoStack = [...undoStack.slice(-19), clone(documentState)]; redoStack = [] }
  documentState = next; saveUiLayouts(documentState); publish({})
}

export function getLayoutEditorState() { return snapshot }
export function subscribeLayoutEditor(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
export function useLayoutEditorStore<T = Snapshot>(selector?: (state: Snapshot) => T): T { const value = useSyncExternalStore(subscribeLayoutEditor, getLayoutEditorState, getLayoutEditorState); return selector ? selector(value) : value as T }

export function getSavedScreenLayouts(screen: ScreenId) { return getScreenLayouts(screen, documentState.screens[screen]) }
export function openLayoutEditor(screen: ScreenId) {
  if (!isDesktopLayout()) { publish({ notice: 'UI Editor is available on desktop-sized layouts.' }); return false }
  const first = getPanelDefinitions(screen).find((panel) => !getSavedScreenLayouts(screen)[panel.id]?.hidden)?.id ?? getPanelDefinitions(screen)[0]?.id ?? null
  publish({ isEditing: true, layoutTarget: 'screen', selectedPanelId: first, notice: null, showGrid: true })
  return true
}
export function closeLayoutEditor(notice: string | null = null) { cancelTopbarInteraction(); undoStack = []; redoStack = []; publish({ isEditing: false, layoutTarget: 'screen', selectedPanelId: null, selectedShellRegion: null, panelInteraction: false, notice }) }
export function toggleLayoutEditor(screen: ScreenId) { return snapshot.isEditing ? (closeLayoutEditor(), false) : openLayoutEditor(screen) }
export function selectLayoutPanel(panelId: string | null) { publish({ selectedPanelId: panelId }) }
export function setLayoutTarget(layoutTarget: LayoutEditorState['layoutTarget']) { cancelTopbarInteraction(); publish({ layoutTarget, selectedPanelId: layoutTarget === 'shell' ? null : snapshot.selectedPanelId, selectedShellRegion: layoutTarget === 'shell' ? null : snapshot.selectedShellRegion }) }
export function setShowEditorGrid(showGrid: boolean) { publish({ showGrid }) }
export function setPanelInteraction(panelInteraction: boolean) { publish({ panelInteraction }) }
export function clearLayoutNotice() { publish({ notice: null }) }

export function updateScreenLayouts(screen: ScreenId, layouts: ScreenLayouts, record = true) {
  const next = clone(documentState)
  next.screens[screen] = layouts
  commitDocument(next, record)
}

export function updateSelectedPanel(screen: ScreenId, changes: Partial<SavedPanelLayout>) {
  if (!snapshot.selectedPanelId) return
  const current = getSavedScreenLayouts(screen)
  const id = snapshot.selectedPanelId
  updateScreenLayouts(screen, { ...current, [id]: clampPanelLayout(screen, id, { ...current[id], ...changes }) })
}

export function commitGridLayout(screen: ScreenId, layout: import('react-grid-layout').Layout) {
  updateScreenLayouts(screen, requireCurrentGridLayouts(screen, layout))
}

function requireCurrentGridLayouts(screen: ScreenId, layout: import('react-grid-layout').Layout) {
  const current = getSavedScreenLayouts(screen)
  for (const item of layout) current[item.i] = clampPanelLayout(screen, item.i, { ...current[item.i], x: item.x, y: item.y, w: item.w, h: item.h })
  return current
}

export function togglePanelHidden(screen: ScreenId, panelId: string) {
  const current = getSavedScreenLayouts(screen); const value = current[panelId]
  if (!value) return
  updateScreenLayouts(screen, { ...current, [panelId]: { ...value, hidden: !value.hidden } })
}
export function togglePanelLocked(screen: ScreenId, panelId: string) {
  const current = getSavedScreenLayouts(screen); const value = current[panelId]
  if (!value) return
  updateScreenLayouts(screen, { ...current, [panelId]: { ...value, locked: !value.locked } })
}
export function resetSelectedPanel(screen: ScreenId) { if (snapshot.selectedPanelId) updateScreenLayouts(screen, { ...getSavedScreenLayouts(screen), [snapshot.selectedPanelId]: clone(DEFAULT_LAYOUTS[screen][snapshot.selectedPanelId]) }) }
export function resetScreenLayout(screen: ScreenId) { const next = clone(documentState); delete next.screens[screen]; commitDocument(next) }
export function getTopbarLayout() { return clampTopbarLayout(snapshot.shellPreview ?? documentState.shell?.topbar) }
export function updateTopbarLayout(changes: Partial<TopbarLayout>) { const next = clone(documentState); next.shell = { topbar: clampTopbarLayout({ ...getTopbarLayout(), ...changes }) }; commitDocument(next) }
export function updateTopbarWidth(regionId: TopbarRegionId, width: number) { updateTopbarLayout({ widths: { ...getTopbarLayout().widths, [regionId]: width } }) }
export function moveTopbarResourceBy(regionId: TopbarRegionId, direction: -1 | 1) { updateTopbarLayout(moveTopbarResource(getTopbarLayout(), regionId, direction)) }
export function applyTopbarPreset(preset: keyof typeof TOPBAR_PRESETS) { updateTopbarLayout(clone(TOPBAR_PRESETS[preset])) }
export function resetHeaderLayout() { updateTopbarLayout(clone(DEFAULT_TOPBAR_LAYOUT)) }
export function resetAllScreenLayouts() { resetUiLayouts(); commitDocument({ version: LAYOUT_VERSION, screens: {}, shell: { topbar: clone(DEFAULT_TOPBAR_LAYOUT) } }) }

export function selectShellRegion(regionId: TopbarRegionId | null) { publish({ selectedShellRegion: regionId }) }
export function beginTopbarResize(regionId: TopbarRegionId, edge: 'left' | 'right', clientX: number) { if (!snapshot.isEditing || snapshot.layoutTarget !== 'shell') return; if (typeof document !== 'undefined') document.body.classList.add('shell-layout-interacting'); shellInteraction = { kind: 'resizing', regionId, edge, startX: clientX, startLayout: clone(getTopbarLayout()) }; publish({ shellInteraction: 'resizing', shellPreview: clone(getTopbarLayout()), selectedShellRegion: regionId }) }
export function previewTopbarResize(clientX: number) { if (!shellInteraction || shellInteraction.kind !== 'resizing') return; const { regionId, edge, startX, startLayout } = shellInteraction; const delta = clientX - startX; const width = startLayout.widths[regionId] + (edge === 'right' ? delta : -delta); publish({ shellPreview: clampTopbarLayout({ ...startLayout, widths: { ...startLayout.widths, [regionId]: width } }) }) }
export function beginTopbarReorder(regionId: TopbarRegionId, clientX: number) { if (!snapshot.isEditing || snapshot.layoutTarget !== 'shell') return; if (typeof document !== 'undefined') document.body.classList.add('shell-layout-interacting'); shellInteraction = { kind: 'dragging', regionId, startX: clientX, startLayout: clone(getTopbarLayout()) }; publish({ shellInteraction: 'dragging', shellPreview: clone(getTopbarLayout()), selectedShellRegion: regionId }) }
export function previewTopbarOrder(order: TopbarRegionId[]) { if (!shellInteraction || shellInteraction.kind !== 'dragging') return; publish({ shellPreview: clampTopbarLayout({ ...getTopbarLayout(), order }) }) }
export function commitTopbarInteraction() { if (!shellInteraction) return; const preview = snapshot.shellPreview; shellInteraction = null; clearShellInteractionCursor(); if (preview) { const next = clone(documentState); next.shell = { topbar: clone(preview) }; commitDocument(next) }; publish({ shellInteraction: 'idle', shellPreview: null }) }
export function cancelTopbarInteraction() { clearShellInteractionCursor(); if (!shellInteraction && snapshot.shellInteraction === 'idle' && !snapshot.shellPreview) return; shellInteraction = null; publish({ shellInteraction: 'idle', shellPreview: null }) }

export function undoLayout() { const previous = undoStack.pop(); if (!previous) return; redoStack.push(clone(documentState)); documentState = previous; saveUiLayouts(documentState); publish({}) }
export function redoLayout() { const next = redoStack.pop(); if (!next) return; undoStack.push(clone(documentState)); documentState = next; saveUiLayouts(documentState); publish({}) }

export function moveSelectedPanel(screen: ScreenId, axis: 'x' | 'y', amount: number) {
  if (!snapshot.selectedPanelId) return
  const current = getSavedScreenLayouts(screen)[snapshot.selectedPanelId]
  if (current.locked) return
  updateSelectedPanel(screen, { [axis]: current[axis] + amount })
}
export function fitSelectedPanel(screen: ScreenId) {
  if (!snapshot.selectedPanelId) return
  const element = document.querySelector(`[data-panel-id="${snapshot.selectedPanelId}"]`)
  if (!element) return
  const rows = Math.max(4, Math.ceil((element.getBoundingClientRect().height + 14) / 44))
  updateSelectedPanel(screen, { h: rows })
}
