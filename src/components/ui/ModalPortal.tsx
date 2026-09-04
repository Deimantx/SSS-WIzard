import { createPortal } from 'react-dom'
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import '../../styles/components/modal-portal.css'

interface ModalPortalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  backdropClassName: string
  surfaceClassName: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  onBackdropClick?: () => void
  onEscape?: () => void
}

let activeModalCount = 0

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/** Shared top-level layer for dialogs that must sit above the game shell. */
export function ModalPortal({ open, onClose, children, backdropClassName, surfaceClassName, ariaLabel, ariaLabelledBy, ariaDescribedBy, onBackdropClick, onEscape }: ModalPortalProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onEscape ?? onClose)
  closeRef.current = onEscape ?? onClose

  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    activeModalCount += 1
    document.body.classList.add('modal-open')
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const target = surfaceRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]') ?? surfaceRef.current?.querySelector<HTMLElement>(focusableSelector)
      target?.focus()
    }, 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !surfaceRef.current) return
      const focusable = [...surfaceRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      activeModalCount = Math.max(0, activeModalCount - 1)
      if (activeModalCount === 0) {
        document.body.classList.remove('modal-open')
        document.body.style.overflow = previousOverflow
      }
      if (previousFocus && document.body.contains(previousFocus)) previousFocus.focus()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null
  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) (onBackdropClick ?? onClose)()
  }
  return createPortal(
    <div className={`modal-portal-backdrop ${backdropClassName}`.trim()} role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div ref={surfaceRef} className={`modal-portal-surface ${surfaceClassName}`.trim()} role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} aria-describedby={ariaDescribedBy}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
