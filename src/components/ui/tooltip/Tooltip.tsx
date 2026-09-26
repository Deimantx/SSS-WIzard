import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type ReactElement, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'

export type TooltipAccent = 'neutral' | 'mana' | 'health' | 'acolyte' | 'success' | 'warning' | 'danger' | 'elemental'
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipRequest { id: string; element: HTMLElement; content: ReactNode; accent: TooltipAccent; placement: TooltipPlacement; tooltipId: string; wide: boolean; modal?: boolean }
interface TooltipContextValue { request: (request: TooltipRequest, delay?: number) => void; leave: (id: string) => void; unmount: (id: string) => void; dismiss: () => void; touch: (request: TooltipRequest) => void }
const TooltipContext = createContext<TooltipContextValue | null>(null)
export interface TooltipDetailMode { advanced: boolean }
const TooltipDetailModeContext = createContext<TooltipDetailMode>({ advanced: false })
let providerDismiss: (() => void) | null = null

export function dismissGameTooltips() { providerDismiss?.() }
export function useTooltipDetailMode(): TooltipDetailMode { return useContext(TooltipDetailModeContext) }

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<TooltipRequest | null>(null)
  const [active, setActive] = useState<TooltipRequest | null>(null)
  const [altPressed, setAltPressed] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const timer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const touchTimer = useRef<number | null>(null)
  const pendingRef = useRef<TooltipRequest | null>(null)
  const activeRef = useRef<TooltipRequest | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const advanced = altPressed && (activeRef.current !== null || pendingRef.current !== null)

  const clearTimers = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    if (touchTimer.current !== null) window.clearTimeout(touchTimer.current)
    timer.current = null; closeTimer.current = null; touchTimer.current = null
  }
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const dismiss = () => { clearTimers(); pendingRef.current = null; activeRef.current = null; setPending(null); setActive(null); setPosition({ top: 0, left: 0, ready: false }) }
  const unmount = (id: string) => {
    if (pendingRef.current?.id === id) {
      clearTimers()
      pendingRef.current = null
      setPending(null)
    }
    if (activeRef.current?.id === id) dismiss()
  }
  const scheduleClose = () => { cancelClose(); closeTimer.current = window.setTimeout(dismiss, 70) }
  const request = (next: TooltipRequest, delay = 500) => {
    if (activeRef.current?.id === next.id) {
      cancelClose()
      activeRef.current = next
      setActive(next)
      return
    }
    if (pendingRef.current?.id === next.id) return
    clearTimers();
    pendingRef.current = next
    activeRef.current = null
    setActive(null)
    setPosition({ top: 0, left: 0, ready: false })
    setPending(next)
    timer.current = window.setTimeout(() => {
      if (pendingRef.current?.id !== next.id || !document.body.contains(next.element)) return
      pendingRef.current = null
      activeRef.current = next
      setPending(null)
      setPosition({ top: 0, left: 0, ready: false })
      setActive(next)
    }, delay)
  }
  const leave = (id: string) => {
    if (pendingRef.current?.id === id) { clearTimers(); pendingRef.current = null; setPending(null) }
    if (activeRef.current?.id === id) {
      scheduleClose()
    }
  }
  const touch = (next: TooltipRequest) => { request(next, 0); touchTimer.current = window.setTimeout(dismiss, 1800) }

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Alt') return
      if (event.ctrlKey || event.metaKey || event.shiftKey) return
      if (activeRef.current !== null || pendingRef.current !== null) event.preventDefault()
      setAltPressed(true)
    }
    const onKeyUp = (event: globalThis.KeyboardEvent) => { if (event.key === 'Alt') setAltPressed(false) }
    const onBlur = () => setAltPressed(false)
    const onVisibilityChange = () => { if (document.hidden) setAltPressed(false) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVisibilityChange) }
  }, [])
  useEffect(() => { providerDismiss = dismiss; return () => { if (providerDismiss === dismiss) providerDismiss = null; clearTimers() } }, [])
  useLayoutEffect(() => {
    if (!active) return
    let retryFrame: number | null = null
    let trackingFrame: number | null = null
    let retried = false
    let lastSignature = ''
    const updatePosition = () => {
      if (!document.body.contains(active.element)) { dismiss(); return }
      const trigger = active.element.getBoundingClientRect()
      const layer = layerRef.current?.getBoundingClientRect()
      if (!layer) {
        if (!retried && typeof requestAnimationFrame !== 'undefined') {
          retried = true
          retryFrame = requestAnimationFrame(updatePosition)
        }
        return
      }
      const signature = [trigger.top, trigger.left, trigger.width, trigger.height, layer.width, layer.height].join(':')
      if (signature === lastSignature) return
      lastSignature = signature
      const gap = 8; const margin = 8
      const fits = { top: trigger.top - layer.height - gap >= margin, bottom: trigger.bottom + layer.height + gap <= innerHeight - margin, left: trigger.left - layer.width - gap >= margin, right: trigger.right + layer.width + gap <= innerWidth - margin }
      const fallbackOrder: Record<TooltipPlacement, TooltipPlacement[]> = { top: ['top', 'bottom', 'right', 'left'], bottom: ['bottom', 'top', 'right', 'left'], left: ['left', 'right', 'top', 'bottom'], right: ['right', 'left', 'top', 'bottom'] }
      const side = fallbackOrder[active.placement].find((candidate) => fits[candidate]) ?? active.placement
      let top = trigger.top - layer.height - gap
      let left = trigger.left + (trigger.width - layer.width) / 2
      if (side === 'bottom') top = trigger.bottom + gap
      if (side === 'left') { top = trigger.top + (trigger.height - layer.height) / 2; left = trigger.left - layer.width - gap }
      if (side === 'right') { top = trigger.top + (trigger.height - layer.height) / 2; left = trigger.right + gap }
      setPosition({ top: Math.max(margin, Math.min(innerHeight - layer.height - margin, top)), left: Math.max(margin, Math.min(innerWidth - layer.width - margin, left)), ready: true })
    }
    const trackMovingTarget = () => {
      updatePosition()
      trackingFrame = requestAnimationFrame(trackMovingTarget)
    }
    updatePosition()
    addEventListener('resize', updatePosition); addEventListener('scroll', updatePosition, true)
    const observer = typeof ResizeObserver !== 'undefined' && layerRef.current ? new ResizeObserver(updatePosition) : null
    if (observer && layerRef.current) observer.observe(layerRef.current)
    if (typeof requestAnimationFrame !== 'undefined') trackingFrame = requestAnimationFrame(trackMovingTarget)
    return () => { if (retryFrame !== null) cancelAnimationFrame(retryFrame); if (trackingFrame !== null) cancelAnimationFrame(trackingFrame); observer?.disconnect(); removeEventListener('resize', updatePosition); removeEventListener('scroll', updatePosition, true) }
  }, [active, advanced])

  const value = { request, leave, unmount, dismiss, touch }
  const detailMode = { advanced }
  return <TooltipContext.Provider value={value}><TooltipDetailModeContext.Provider value={detailMode}><>{children}</>{active && typeof document !== 'undefined' && createPortal(<div ref={layerRef} id={active.tooltipId} className={`game-tooltip game-tooltip-${active.accent}${active.wide ? ' game-tooltip-wide' : ''}${active.modal ? ' game-tooltip-modal' : ''} ${position.ready ? 'is-positioned' : ''}`} role="tooltip" onPointerEnter={active.wide ? cancelClose : undefined} onPointerLeave={active.wide ? scheduleClose : undefined} style={{ top: position.top, left: position.left }}>{active.content}</div>, document.body)}</TooltipDetailModeContext.Provider></TooltipContext.Provider>
}

interface GameTooltipProps { children: ReactNode; content: ReactNode; accent?: TooltipAccent; placement?: TooltipPlacement; className?: string; block?: boolean; disabled?: boolean; delay?: number; wide?: boolean }

type TooltipChildProps = {
  className?: string
  disabled?: boolean
  'aria-describedby'?: string
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === 'function') ref(value)
      else ref.current = value
    })
  }
}

function composeHandler<T extends { currentTarget: HTMLElement }>(first: ((event: T) => void) | undefined, second: (event: T) => void) {
  return (event: T) => { first?.(event); second(event) }
}

export function GameTooltip({ children, content, accent = 'neutral', placement = 'top', className = '', block = false, disabled = false, delay = 250, wide = false }: GameTooltipProps) {
  const context = useContext(TooltipContext)
  const fallback = useFallbackTooltip(context === null)
  const interaction = context ?? fallback
  const triggerRef = useRef<HTMLElement>(null)
  const id = useId().replace(/:/g, '')
  const tooltipId = `game-tooltip-${id}`
  const request = () => { if (!disabled && content && triggerRef.current) (context ?? fallback).request({ id, element: triggerRef.current, content, accent, placement, tooltipId, wide, modal: Boolean(triggerRef.current.closest('[aria-modal="true"]')) }, delay) }
  const leave = () => (context ?? fallback).leave(id)
  useEffect(() => () => interaction.unmount(id), [id])
  if (!isValidElement(children)) return <>{children}</>
  const child = Children.only(children) as ReactElement<TooltipChildProps> & { ref?: Ref<HTMLElement> }
  const childProps = child.props
  const childClassName = [childProps.className, 'game-tooltip-trigger', block ? 'block' : '', className].filter(Boolean).join(' ')
  const onPointerEnter = composeHandler(childProps.onPointerEnter, (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== 'touch') request() })
  const onPointerLeave = composeHandler(childProps.onPointerLeave, (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== 'touch') leave() })
  const onFocus = composeHandler(childProps.onFocus, () => request())
  const onBlur = composeHandler(childProps.onBlur, (event: FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) leave() })
  const onPointerDown = composeHandler(childProps.onPointerDown, (event: PointerEvent<HTMLElement>) => {
    interaction.dismiss()
    if (event.pointerType === 'touch' && triggerRef.current) interaction.touch({ id, element: triggerRef.current, content, accent, placement, tooltipId, wide, modal: Boolean(triggerRef.current.closest('[aria-modal="true"]')) })
  })
  const onKeyDown = composeHandler(childProps.onKeyDown, (event: ReactKeyboardEvent<HTMLElement>) => { if (event.key === 'Escape') { event.preventDefault(); interaction.dismiss() } })
  const enhancedChild = cloneElement(child as ReactElement<any>, {
    ref: composeRefs(triggerRef, child.ref),
    className: childClassName,
    'aria-describedby': `${childProps['aria-describedby'] ?? ''} ${tooltipId}`.trim(),
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onFocus,
    onBlur,
    onKeyDown,
  })
  if (childProps.disabled) {
    return <span className={`game-tooltip-trigger game-tooltip-disabled-anchor${block ? ' block' : ''}${className ? ` ${className}` : ''}`} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onPointerDown={onPointerDown}>{enhancedChild}</span>
  }
  return enhancedChild
}

function useFallbackTooltip(enabled: boolean): TooltipContextValue {
  const [requestState, setRequestState] = useState<TooltipRequest | null>(null)
  const [active, setActive] = useState<TooltipRequest | null>(null)
  const requestStateRef = useRef<TooltipRequest | null>(null)
  const activeRef = useRef<TooltipRequest | null>(null)
  const timer = useRef<number | null>(null)
  const request = (next: TooltipRequest, delay = 500) => {
    if (!enabled) return
    if (timer.current !== null) window.clearTimeout(timer.current)
    activeRef.current = null
    requestStateRef.current = next
    setActive(null)
    setRequestState(next)
    timer.current = window.setTimeout(() => {
      if (requestStateRef.current?.id !== next.id || !document.body.contains(next.element)) return
      requestStateRef.current = null
      activeRef.current = next
      setRequestState(null)
      setActive(next)
    }, delay)
  }
  const leave = (id: string) => {
    if (requestStateRef.current?.id === id) {
      if (timer.current !== null) window.clearTimeout(timer.current)
      requestStateRef.current = null
      setRequestState(null)
    }
    if (activeRef.current?.id === id) {
      activeRef.current = null
      setActive(null)
    }
  }
  const dismiss = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    requestStateRef.current = null
    activeRef.current = null
    setRequestState(null)
    setActive(null)
  }
  const touch = (next: TooltipRequest) => request(next, 0)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])
  useEffect(() => { if (!active) return; const node = document.createElement('div'); node.setAttribute('role', 'tooltip'); return () => node.remove() }, [active])
  const unmount = (id: string) => { if (requestStateRef.current?.id === id || activeRef.current?.id === id) dismiss() }
  return { request, leave, unmount, dismiss, touch }
}

export function TooltipContent({ title, description, children }: { title?: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return <div className="game-tooltip-content game-tooltip-rich">{title && <strong>{title}</strong>}{description && <p>{description}</p>}{children}</div>
}
