import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type TooltipAccent = 'neutral' | 'mana' | 'health' | 'focus' | 'success' | 'warning' | 'danger' | 'elemental'
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

let activeDismiss: (() => void) | null = null

export function dismissGameTooltips() {
  activeDismiss?.()
  activeDismiss = null
}

interface GameTooltipProps {
  children: ReactNode
  content: ReactNode
  accent?: TooltipAccent
  placement?: TooltipPlacement
  className?: string
  block?: boolean
  disabled?: boolean
}

export function GameTooltip({ children, content, accent = 'neutral', placement = 'top', className = '', block = false, disabled = false }: GameTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const touchTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipId = `game-tooltip-${useId().replace(/:/g, '')}`

  const clearTimers = () => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    if (touchTimer.current !== null) window.clearTimeout(touchTimer.current)
    openTimer.current = null
    closeTimer.current = null
    touchTimer.current = null
  }

  const close = (immediate = false) => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), immediate ? 0 : 70)
  }

  const show = (immediate = false) => {
    if (disabled || !content) return
    if (activeDismiss && activeDismiss !== close) activeDismiss()
    activeDismiss = close
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    openTimer.current = window.setTimeout(() => setOpen(true), immediate ? 0 : 400)
  }

  useEffect(() => () => {
    clearTimers()
    if (activeDismiss === close) activeDismiss = null
  }, [])

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect()
      const tooltip = tooltipRef.current?.getBoundingClientRect()
      if (!trigger || !tooltip) return
      const gap = 8
      const margin = 8
      const fits = {
        top: trigger.top - tooltip.height - gap >= margin,
        bottom: trigger.bottom + tooltip.height + gap <= window.innerHeight - margin,
        left: trigger.left - tooltip.width - gap >= margin,
        right: trigger.right + tooltip.width + gap <= window.innerWidth - margin,
      }
      const fallback = placement === 'top' || placement === 'bottom' ? (placement === 'top' ? 'bottom' : 'top') : placement === 'left' ? 'right' : 'left'
      const side = fits[placement] ? placement : fits[fallback] ? fallback : placement
      let top = trigger.top - tooltip.height - gap
      let left = trigger.left + (trigger.width - tooltip.width) / 2
      if (side === 'bottom') top = trigger.bottom + gap
      if (side === 'left') { top = trigger.top + (trigger.height - tooltip.height) / 2; left = trigger.left - tooltip.width - gap }
      if (side === 'right') { top = trigger.top + (trigger.height - tooltip.height) / 2; left = trigger.right + gap }
      setPosition({ top: Math.max(margin, Math.min(window.innerHeight - tooltip.height - margin, top)), left: Math.max(margin, Math.min(window.innerWidth - tooltip.width - margin, left)) })
    }
    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true) }
  }, [open, placement, content])

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); clearTimers(); close(true) }
  }
  const describedChild = isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': tooltipId }) : children

  return <span ref={triggerRef} className={`game-tooltip-trigger ${block ? 'block' : ''} ${className}`} onPointerEnter={(event) => event.pointerType !== 'touch' && show()} onPointerLeave={(event) => event.pointerType !== 'touch' && close()} onFocusCapture={() => show()} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close() }} onPointerDown={(event) => { if (event.pointerType === 'touch') { show(true); touchTimer.current = window.setTimeout(() => close(true), 1800) } }} onKeyDown={onKeyDown}>
    {describedChild}
    {open && typeof document !== 'undefined' && createPortal(<div ref={tooltipRef} id={tooltipId} className={`game-tooltip game-tooltip-${accent} ${position.top ? 'is-positioned' : ''}`} role="tooltip" style={{ top: position.top, left: position.left }}>{content}</div>, document.body)}
  </span>
}

export function TooltipContent({ title, description, children }: { title?: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return <div className="game-tooltip-content">{title && <strong>{title}</strong>}{description && <p>{description}</p>}{children}</div>
}
