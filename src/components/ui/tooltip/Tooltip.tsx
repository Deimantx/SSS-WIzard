import { cloneElement, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type TooltipAccent = 'neutral' | 'mana' | 'health' | 'focus' | 'success' | 'warning' | 'danger' | 'elemental'
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipRequest { id: string; element: HTMLElement; content: ReactNode; accent: TooltipAccent; placement: TooltipPlacement; tooltipId: string }
interface TooltipContextValue { request: (request: TooltipRequest, delay?: number) => void; leave: (id: string) => void; dismiss: () => void; touch: (request: TooltipRequest) => void }
const TooltipContext = createContext<TooltipContextValue | null>(null)
let providerDismiss: (() => void) | null = null

export function dismissGameTooltips() { providerDismiss?.() }

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<TooltipRequest | null>(null)
  const [active, setActive] = useState<TooltipRequest | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const touchTimer = useRef<number | null>(null)
  const pendingRef = useRef<TooltipRequest | null>(null)
  const activeRef = useRef<TooltipRequest | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  const clearTimers = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    if (touchTimer.current !== null) window.clearTimeout(touchTimer.current)
    timer.current = null; closeTimer.current = null; touchTimer.current = null
  }
  const dismiss = () => { clearTimers(); pendingRef.current = null; activeRef.current = null; setPending(null); setActive(null) }
  const request = (next: TooltipRequest, delay = 500) => {
    clearTimers();
    pendingRef.current = next
    activeRef.current = null
    setActive(null)
    setPending(next)
    timer.current = window.setTimeout(() => {
      if (pendingRef.current?.id !== next.id || !document.body.contains(next.element)) return
      pendingRef.current = null
      activeRef.current = next
      setPending(null)
      setActive(next)
    }, delay)
  }
  const leave = (id: string) => {
    if (pendingRef.current?.id === id) { clearTimers(); pendingRef.current = null; setPending(null) }
    if (activeRef.current?.id === id) {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      closeTimer.current = window.setTimeout(dismiss, 70)
    }
  }
  const touch = (next: TooltipRequest) => { request(next, 0); touchTimer.current = window.setTimeout(dismiss, 1800) }

  useEffect(() => { providerDismiss = dismiss; return () => { if (providerDismiss === dismiss) providerDismiss = null; clearTimers() } }, [])
  useEffect(() => {
    if (!active) return
    const updatePosition = () => {
      if (!document.body.contains(active.element)) { dismiss(); return }
      const trigger = active.element.getBoundingClientRect()
      const layer = layerRef.current?.getBoundingClientRect()
      if (!layer) return
      const gap = 8; const margin = 8
      const fits = { top: trigger.top - layer.height - gap >= margin, bottom: trigger.bottom + layer.height + gap <= innerHeight - margin, left: trigger.left - layer.width - gap >= margin, right: trigger.right + layer.width + gap <= innerWidth - margin }
      const opposite: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
      const side = fits[active.placement] ? active.placement : fits[opposite[active.placement]] ? opposite[active.placement] : active.placement
      let top = trigger.top - layer.height - gap
      let left = trigger.left + (trigger.width - layer.width) / 2
      if (side === 'bottom') top = trigger.bottom + gap
      if (side === 'left') { top = trigger.top + (trigger.height - layer.height) / 2; left = trigger.left - layer.width - gap }
      if (side === 'right') { top = trigger.top + (trigger.height - layer.height) / 2; left = trigger.right + gap }
      setPosition({ top: Math.max(margin, Math.min(innerHeight - layer.height - margin, top)), left: Math.max(margin, Math.min(innerWidth - layer.width - margin, left)) })
    }
    const frame = requestAnimationFrame(updatePosition)
    addEventListener('resize', updatePosition); addEventListener('scroll', updatePosition, true)
    const observer = typeof MutationObserver !== 'undefined' ? new MutationObserver(updatePosition) : null
    observer?.observe(document.body, { childList: true, subtree: true })
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); removeEventListener('resize', updatePosition); removeEventListener('scroll', updatePosition, true) }
  }, [active])

  const value = { request, leave, dismiss, touch }
  return <TooltipContext.Provider value={value}><>{children}</>{active && typeof document !== 'undefined' && createPortal(<div ref={layerRef} id={active.tooltipId} className={`game-tooltip game-tooltip-${active.accent} ${position.top > 0 ? 'is-positioned' : ''}`} role="tooltip" style={{ top: position.top, left: position.left }}>{active.content}</div>, document.body)}</TooltipContext.Provider>
}

interface GameTooltipProps { children: ReactNode; content: ReactNode; accent?: TooltipAccent; placement?: TooltipPlacement; className?: string; block?: boolean; disabled?: boolean; delay?: number }

export function GameTooltip({ children, content, accent = 'neutral', placement = 'top', className = '', block = false, disabled = false, delay = 500 }: GameTooltipProps) {
  const context = useContext(TooltipContext)
  const fallback = useFallbackTooltip(context === null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const id = useId().replace(/:/g, '')
  const tooltipId = `game-tooltip-${id}`
  const request = () => { if (!disabled && content) (context ?? fallback).request({ id, element: triggerRef.current!, content, accent, placement, tooltipId }, delay) }
  const leave = () => (context ?? fallback).leave(id)
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => { if (event.key === 'Escape') { event.preventDefault(); (context ?? fallback).dismiss() } }
  const describedChild = isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': `${(children.props as { 'aria-describedby'?: string })['aria-describedby'] ?? ''} ${tooltipId}`.trim() }) : children
  return <span ref={triggerRef} className={`game-tooltip-trigger ${block ? 'block' : ''} ${className}`} onPointerEnter={(event) => event.pointerType !== 'touch' && request()} onPointerLeave={(event) => event.pointerType !== 'touch' && leave()} onFocusCapture={request} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) leave() }} onPointerDown={(event) => { if (event.pointerType === 'touch' && triggerRef.current) (context ?? fallback).touch({ id, element: triggerRef.current, content, accent, placement, tooltipId }) }} onKeyDown={onKeyDown}>{describedChild}</span>
}

function useFallbackTooltip(enabled: boolean): TooltipContextValue {
  const [requestState, setRequestState] = useState<TooltipRequest | null>(null)
  const [active, setActive] = useState<TooltipRequest | null>(null)
  const timer = useRef<number | null>(null)
  const request = (next: TooltipRequest, delay = 500) => { if (!enabled) return; if (timer.current !== null) window.clearTimeout(timer.current); setActive(null); setRequestState(next); timer.current = window.setTimeout(() => { setRequestState(null); setActive(next) }, delay) }
  const leave = (id: string) => { if (requestState?.id === id) { if (timer.current !== null) window.clearTimeout(timer.current); setRequestState(null) }; if (active?.id === id) setActive(null) }
  const dismiss = () => { if (timer.current !== null) window.clearTimeout(timer.current); setRequestState(null); setActive(null) }
  const touch = (next: TooltipRequest) => request(next, 0)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])
  useEffect(() => { if (!active) return; const node = document.createElement('div'); node.setAttribute('role', 'tooltip'); return () => node.remove() }, [active])
  return { request, leave, dismiss, touch }
}

export function TooltipContent({ title, description, children }: { title?: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return <div className="game-tooltip-content game-tooltip-rich">{title && <strong>{title}</strong>}{description && <p>{description}</p>}{children}</div>
}
