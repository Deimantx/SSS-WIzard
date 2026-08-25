import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { TopbarRegionId } from './layoutEditorTypes'
import { beginTopbarReorder, beginTopbarResize, cancelTopbarInteraction, commitTopbarInteraction, getTopbarLayout, previewTopbarOrder, previewTopbarResize, selectShellRegion, useLayoutEditorStore } from './layoutEditorStore'
import { TOPBAR_RESOURCE_IDS } from './shellLayout'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'

export function EditableTopbarRegion({ regionId, label, editing, width, children }: { regionId: TopbarRegionId; label: string; editing: boolean; width?: number; children: ReactNode }) {
  const editor = useLayoutEditorStore()
  const pointerId = useRef<number | null>(null)
  const interactive = editing && editor.layoutTarget === 'shell'
  const isResource = TOPBAR_RESOURCE_IDS.includes(regionId)

  useEffect(() => {
    if (!interactive || !editor.shellInteraction) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); cancelTopbarInteraction() } }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [interactive, editor.shellInteraction])

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>, edge: 'left' | 'right') => {
    event.preventDefault(); event.stopPropagation(); dismissGameTooltips(); pointerId.current = event.pointerId; event.currentTarget.setPointerCapture?.(event.pointerId); beginTopbarResize(regionId, edge, event.clientX)
  }
  const moveResize = (event: ReactPointerEvent<HTMLDivElement>) => { if (pointerId.current !== event.pointerId || editor.shellInteraction !== 'resizing') return; previewTopbarResize(event.clientX) }
  const finish = (event: ReactPointerEvent<HTMLDivElement>) => { if (pointerId.current !== event.pointerId) return; pointerId.current = null; if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId); commitTopbarInteraction() }
  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.stopPropagation(); dismissGameTooltips(); pointerId.current = event.pointerId; event.currentTarget.setPointerCapture?.(event.pointerId); beginTopbarReorder(regionId, event.clientX) }
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId || editor.shellInteraction !== 'dragging') return
    const resources = getTopbarLayout().order.filter((id) => TOPBAR_RESOURCE_IDS.includes(id))
    const withoutDragged = resources.filter((id) => id !== regionId)
    let insertAt = withoutDragged.length
    for (let index = 0; index < withoutDragged.length; index += 1) {
      const node = document.querySelector(`[data-shell-region="${withoutDragged[index]}"]`)
      const rect = node?.getBoundingClientRect()
      if (rect && event.clientX < rect.left + rect.width / 2) { insertAt = index; break }
    }
    withoutDragged.splice(insertAt, 0, regionId)
    previewTopbarOrder(['topbar-breadcrumb', ...withoutDragged, 'topbar-utilities'])
  }

  return <div className={`topbar-shell-region topbar-region-${regionId.replace('topbar-', '')} ${interactive ? 'shell-region-editing' : ''} ${editor.selectedShellRegion === regionId ? 'selected' : ''}`} style={{ width: width === undefined ? undefined : `${width}px` } as CSSProperties} data-shell-region={regionId} onClick={() => interactive && selectShellRegion(regionId)} onPointerMove={(event) => { moveResize(event); moveDrag(event) }} onPointerUp={finish} onPointerCancel={() => { pointerId.current = null; cancelTopbarInteraction() }}>
    {children}
    {interactive && <div className="topbar-region-overlay" aria-label={`${label} shell controls`}>
      <span className="topbar-region-label">{label}</span>
      {isResource && <button type="button" className="topbar-region-grip" aria-label={`Drag ${label} to reorder`} onPointerDown={startDrag}>⋮⋮</button>}
      {isResource && <button type="button" className="topbar-region-resize left" aria-label={`Resize ${label} from left edge`} onPointerDown={(event) => startResize(event, 'left')} />}
      {isResource && <button type="button" className="topbar-region-resize right" aria-label={`Resize ${label} from right edge`} onPointerDown={(event) => startResize(event, 'right')} />}
    </div>}
  </div>
}
