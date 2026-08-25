import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { TopbarRegionId } from './layoutEditorTypes'
import { beginTopbarReorder, beginTopbarResize, cancelTopbarInteraction, commitTopbarInteraction, getTopbarLayout, previewTopbarOrder, previewTopbarResize, selectShellRegion, useLayoutEditorStore } from './layoutEditorStore'
import { TOPBAR_RESOURCE_IDS } from './shellLayout'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'

export function EditableTopbarRegion({ regionId, label, editing, width, children }: { regionId: TopbarRegionId; label: string; editing: boolean; width?: number; children: ReactNode }) {
  const editor = useLayoutEditorStore()
  const pointerId = useRef<number | null>(null)
  const captureTarget = useRef<HTMLElement | null>(null)
  const interactive = editing && editor.layoutTarget === 'shell'
  const isResource = TOPBAR_RESOURCE_IDS.includes(regionId)

  const previewOrderAt = (clientX: number) => {
    if (pointerId.current === null || editor.shellInteraction !== 'dragging') return
    const resources = getTopbarLayout().order.filter((id) => TOPBAR_RESOURCE_IDS.includes(id))
    const withoutDragged = resources.filter((id) => id !== regionId)
    let insertAt = withoutDragged.length
    for (let index = 0; index < withoutDragged.length; index += 1) {
      const node = document.querySelector(`[data-shell-region="${withoutDragged[index]}"]`)
      const rect = node?.getBoundingClientRect()
      if (rect && clientX < rect.left + rect.width / 2) { insertAt = index; break }
    }
    withoutDragged.splice(insertAt, 0, regionId)
    previewTopbarOrder(['topbar-breadcrumb', ...withoutDragged, 'topbar-utilities'])
  }

  const previewResizeAt = (clientX: number) => { if (pointerId.current !== null && editor.shellInteraction === 'resizing') previewTopbarResize(clientX) }
  const finish = (cancelled: boolean, eventPointerId?: number) => {
    if (pointerId.current === null || (eventPointerId !== undefined && pointerId.current !== eventPointerId)) return
    const activePointer = pointerId.current
    pointerId.current = null
    const target = captureTarget.current
    captureTarget.current = null
    if (target?.hasPointerCapture?.(activePointer)) target.releasePointerCapture?.(activePointer)
    cancelled ? cancelTopbarInteraction() : commitTopbarInteraction()
  }

  useEffect(() => {
    if (!interactive || editor.shellInteraction === 'idle') return
    const onPointerMove = (event: PointerEvent) => { if (event.pointerId === pointerId.current) { previewResizeAt(event.clientX); previewOrderAt(event.clientX) } }
    const onPointerUp = (event: PointerEvent) => finish(false, event.pointerId)
    const onPointerCancel = (event: PointerEvent) => finish(true, event.pointerId)
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); finish(true) } }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); window.removeEventListener('pointercancel', onPointerCancel); window.removeEventListener('keydown', onKeyDown) }
  }, [interactive, editor.shellInteraction, regionId])

  const begin = (event: ReactPointerEvent<HTMLButtonElement>, kind: 'dragging' | 'resizing', edge?: 'left' | 'right') => {
    event.preventDefault(); event.stopPropagation(); dismissGameTooltips()
    pointerId.current = event.pointerId
    captureTarget.current = event.currentTarget
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (kind === 'resizing' && edge) beginTopbarResize(regionId, edge, event.clientX)
    else beginTopbarReorder(regionId, event.clientX)
  }

  return <div className={`topbar-shell-region topbar-region-${regionId.replace('topbar-', '')} ${interactive ? 'shell-region-editing' : ''} ${editor.selectedShellRegion === regionId ? 'selected' : ''}`} style={{ width: width === undefined ? undefined : `${width}px` } as CSSProperties} data-shell-region={regionId} onClick={() => interactive && selectShellRegion(regionId)} onPointerMove={(event) => { previewResizeAt(event.clientX); previewOrderAt(event.clientX) }} onPointerUp={(event) => finish(false, event.pointerId)} onPointerCancel={(event) => finish(true, event.pointerId)}>
    {children}
    {interactive && <div className="topbar-region-overlay" aria-label={`${label} header controls`}>
      <span className="topbar-region-label">{label}</span>
      {isResource && <button type="button" className="topbar-region-grip" aria-label={`Drag ${label} to reorder`} onPointerDown={(event) => begin(event, 'dragging')}>⋮⋮</button>}
      {isResource && <button type="button" className="topbar-region-resize left" aria-label={`Resize ${label} from left edge`} onPointerDown={(event) => begin(event, 'resizing', 'left')} />}
      {isResource && <button type="button" className="topbar-region-resize right" aria-label={`Resize ${label} from right edge`} onPointerDown={(event) => begin(event, 'resizing', 'right')} />}
    </div>}
  </div>
}
