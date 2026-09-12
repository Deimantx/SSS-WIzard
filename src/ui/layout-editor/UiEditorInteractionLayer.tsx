import { useEffect, useState } from 'react'
import { selectLayoutPanel, useLayoutEditorStore } from './layoutEditorStore'
import { getRegisteredUiElement, getRegisteredUiElements } from './uiEditorRegistry'
import { redoUiEditor, setUiEditorHover, setUiEditorPreview, setUiEditorSelection, undoUiEditor, useUiEditorStore } from './uiEditorStore'

const isEditorChrome = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('[data-ui-editor-ignore="true"], .layout-editor-drawer'))
const targetEntry = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null
  const candidate = target.closest('[data-ui-id]')
  const id = candidate?.getAttribute('data-ui-id')
  return id ? getRegisteredUiElement(id) : null
}

export function UiEditorInteractionLayer() {
  const layoutEditor = useLayoutEditorStore()
  const { selectedUiId, hoveredUiId, previewMode, showBounds, showIds } = useUiEditorStore((state) => ({ selectedUiId: state.selectedUiId, hoveredUiId: state.hoveredUiId, previewMode: state.previewMode, showBounds: state.showBounds, showIds: state.showIds }))
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!layoutEditor.isEditing) return
    const onOver = (event: MouseEvent) => { if (previewMode || isEditorChrome(event.target)) return; const entry = targetEntry(event.target); setUiEditorHover(entry?.id ?? null) }
    const onOut = (event: MouseEvent) => { if (!previewMode && !isEditorChrome(event.target) && !(event.relatedTarget instanceof Element && event.relatedTarget.closest('[data-ui-id]'))) setUiEditorHover(null) }
    const onClick = (event: MouseEvent) => {
      if (previewMode || isEditorChrome(event.target)) return
      const entry = targetEntry(event.target)
      if (!entry) return
      event.preventDefault(); event.stopPropagation()
      const selected = event.altKey && entry.parentId ? getRegisteredUiElement(entry.parentId) : entry
      setUiEditorSelection(selected?.id ?? entry.id)
      if (selected?.type === 'panel') { const panelId = selected.element.dataset.panelId; if (panelId) selectLayoutPanel(panelId) }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const formField = target?.matches('input, select, textarea, [contenteditable="true"]')
      if ((event.ctrlKey || event.metaKey) && !formField && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopImmediatePropagation(); event.shiftKey ? redoUiEditor() : undoUiEditor(); return }
      if ((event.ctrlKey || event.metaKey) && !formField && event.key.toLowerCase() === 'y') { event.preventDefault(); event.stopImmediatePropagation(); redoUiEditor(); return }
      if (formField) return
      if (event.key.toLowerCase() === 'p') { event.preventDefault(); event.stopImmediatePropagation(); setUiEditorPreview(!previewMode); return }
      if (event.key === 'Escape') { if (layoutEditor.shellInteraction !== 'idle') return; event.preventDefault(); event.stopImmediatePropagation(); if (previewMode) setUiEditorPreview(false); else { const parent = selectedUiId ? getRegisteredUiElement(selectedUiId)?.parentId : null; setUiEditorSelection(parent ?? null) }; return }
      if (event.key === 'Enter' && selectedUiId) { const child = getRegisteredUiElements().find((candidate) => candidate.parentId === selectedUiId); if (child) { event.preventDefault(); setUiEditorSelection(child.id) } }
    }
    document.addEventListener('mouseover', onOver, true); document.addEventListener('mouseout', onOut, true); document.addEventListener('click', onClick, true); window.addEventListener('keydown', onKeyDown, true)
    const onGeometryChange = () => setRevision((value) => value + 1)
    window.addEventListener('resize', onGeometryChange); document.addEventListener('scroll', onGeometryChange, true)
    const selected = getRegisteredUiElement(selectedUiId ?? '')
    const observer = typeof ResizeObserver !== 'undefined' && selected ? new ResizeObserver(onGeometryChange) : null
    if (observer && selected) observer.observe(selected.element)
    return () => { document.removeEventListener('mouseover', onOver, true); document.removeEventListener('mouseout', onOut, true); document.removeEventListener('click', onClick, true); window.removeEventListener('keydown', onKeyDown, true); window.removeEventListener('resize', onGeometryChange); document.removeEventListener('scroll', onGeometryChange, true); observer?.disconnect() }
  }, [layoutEditor.isEditing, previewMode, selectedUiId])

  if (!layoutEditor.isEditing || previewMode || (!showBounds && !showIds)) return null
  void revision
  const ids = showIds ? getRegisteredUiElements() : []
  const focusedId = hoveredUiId ?? selectedUiId
  const focused = focusedId ? getRegisteredUiElement(focusedId) : null
  const entries = [...ids, ...(focused && !ids.some((entry) => entry.id === focused.id) ? [focused] : [])]
  return <div className="ui-editor-selection-layer" data-ui-editor-ignore="true" aria-hidden="true">{entries.map((entry) => { const rect = entry.element.getBoundingClientRect(); if (rect.width <= 0 || rect.height <= 0) return null; const isFocused = focused?.id === entry.id; const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth; const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight; const labelWidth = Math.min(320, Math.max(160, viewportWidth - 24)); const labelLeft = Math.max(8, Math.min(rect.left, viewportWidth - labelWidth - 8)); const labelTop = rect.top >= 38 ? rect.top - 34 : Math.min(rect.bottom + 6, viewportHeight - 42); return <div key={entry.id} className={`ui-editor-selection-box ${isFocused && selectedUiId === entry.id ? 'selected' : isFocused ? 'hovered' : 'id-only'}`} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}><span className="ui-editor-selection-label" style={{ left: labelLeft, top: Math.max(8, labelTop) }}>{entry.label}{showIds && <small>{entry.id}</small>}<em>{Math.round(rect.width)} × {Math.round(rect.height)}</em></span>{isFocused && selectedUiId === entry.id && <><i className="ui-editor-resize-handle nw" /><i className="ui-editor-resize-handle ne" /><i className="ui-editor-resize-handle sw" /><i className="ui-editor-resize-handle se" /></>}</div> })}</div>
}

export function getVisibleUiEditorElements() { return getRegisteredUiElements() }
