import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { SpellIcon } from './SpellIcon'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import type { SpellId } from '../../game/types'

export type SpellDragPayload =
  | { source: 'loadout'; spellId: SpellId; fromIndex: number }
  | { source: 'library'; spellId: SpellId }

export type SpellDropTarget = { index: number; position: 'before' | 'after' }

type SpellLoadoutDndContextValue = {
  drag: { payload: SpellDragPayload; x: number; y: number } | null
  dropTarget: SpellDropTarget | null
  beginDrag: (payload: SpellDragPayload, event: ReactPointerEvent<HTMLElement>) => void
  registerTarget: (index: number, element: HTMLElement | null) => void
}

const SpellLoadoutDndContext = createContext<SpellLoadoutDndContextValue | null>(null)

export function SpellLoadoutDndProvider({ onCommit, children }: { onCommit: (payload: SpellDragPayload, target: SpellDropTarget) => void; children: ReactNode }) {
  const [drag, setDrag] = useState<SpellLoadoutDndContextValue['drag']>(null)
  const [dropTarget, setDropTarget] = useState<SpellDropTarget | null>(null)
  const pendingRef = useRef<{ payload: SpellDragPayload; pointerId: number; x: number; y: number } | null>(null)
  const targetsRef = useRef(new Map<number, HTMLElement>())
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit

  const clear = useCallback(() => {
    pendingRef.current = null
    setDrag(null)
    setDropTarget(null)
    document.body.style.removeProperty('user-select')
  }, [])

  const registerTarget = useCallback((index: number, element: HTMLElement | null) => {
    if (element) targetsRef.current.set(index, element)
    else targetsRef.current.delete(index)
  }, [])

  const beginDrag = useCallback((payload: SpellDragPayload, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-no-drag="true"]')) return
    pendingRef.current = { payload, pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }, [])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current
      if (!pending || pending.pointerId !== event.pointerId) return
      const moved = Math.hypot(event.clientX - pending.x, event.clientY - pending.y)
      if (!drag && moved < 7) return
      if (!drag) {
        document.body.style.userSelect = 'none'
        setDrag({ payload: pending.payload, x: event.clientX, y: event.clientY })
      } else setDrag((current) => current ? { ...current, x: event.clientX, y: event.clientY } : current)
      let nextTarget: SpellDropTarget | null = null
      for (const [index, element] of targetsRef.current) {
        const rect = element.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) continue
        nextTarget = { index, position: event.clientY <= rect.top + rect.height / 2 ? 'before' : 'after' }
        break
      }
      setDropTarget((current) => current?.index === nextTarget?.index && current?.position === nextTarget?.position ? current : nextTarget)
      event.preventDefault()
    }
    const onPointerUp = (event: PointerEvent) => {
      const pending = pendingRef.current
      if (!pending || pending.pointerId !== event.pointerId) return
      if (drag && dropTarget) commitRef.current(pending.payload, dropTarget)
      clear()
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && pendingRef.current) { event.preventDefault(); clear() } }
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', clear)
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); window.removeEventListener('pointercancel', clear); window.removeEventListener('keydown', onKeyDown) }
  }, [clear, drag, dropTarget])

  const value = useMemo(() => ({ drag, dropTarget, beginDrag, registerTarget }), [drag, dropTarget, beginDrag, registerTarget])
  return <SpellLoadoutDndContext.Provider value={value}>{children}{drag && <SpellDragOverlay drag={drag} />}</SpellLoadoutDndContext.Provider>
}

export function useSpellLoadoutDnd() {
  const value = useContext(SpellLoadoutDndContext)
  if (!value) throw new Error('useSpellLoadoutDnd must be used inside SpellLoadoutDndProvider')
  return value
}

function SpellDragOverlay({ drag }: { drag: NonNullable<SpellLoadoutDndContextValue['drag']> }) {
  const spell = SPELLS[drag.payload.spellId]
  const school = SCHOOLS[spell.school]
  return <div className="spell-drag-overlay" style={{ left: drag.x + 14, top: drag.y + 14, '--drag-school-accent': school.color } as React.CSSProperties} aria-hidden="true"><SpellIcon school={spell.school} spellId={spell.id} size="small" /><span><strong>{spell.name}</strong><small>{school.name.toUpperCase()}</small></span></div>
}
