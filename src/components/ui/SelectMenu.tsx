import { createPortal } from 'react-dom'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export interface SelectMenuOption<T extends string> {
  value: T
  label: ReactNode
}

export type SelectMenuPortalLayer = 'default' | 'context' | 'modal'

interface MenuPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

export function SelectMenu<T extends string>({ options, value, onChange, ariaLabel, prefix = '', disabled = false, portalLayer = 'default' }: {
  options: readonly SelectMenuOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  prefix?: string
  disabled?: boolean
  portalLayer?: SelectMenuPortalLayer
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const menuId = `select-menu-${useId().replace(/:/g, '')}`
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex)
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !optionsRef.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('pointerdown', closeOutside)
    return () => window.removeEventListener('pointerdown', closeOutside)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!options.length) return
    setActiveIndex((index) => Math.min(index, options.length - 1))
  }, [options.length])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const measure = () => {
      const trigger = triggerRef.current?.getBoundingClientRect()
      if (!trigger) return
      const margin = 8
      const maxHeight = Math.min(240, Math.max(80, innerHeight - margin * 2))
      const below = trigger.bottom + 4
      const top = below + maxHeight <= innerHeight - margin ? below : Math.max(margin, trigger.top - maxHeight - 4)
      const left = Math.max(margin, Math.min(innerWidth - trigger.width - margin, trigger.left))
      setMenuPosition({ top, left, width: trigger.width, maxHeight })
    }
    measure()
    addEventListener('resize', measure)
    addEventListener('scroll', measure, true)
    return () => { removeEventListener('resize', measure); removeEventListener('scroll', measure, true) }
  }, [open, options.length])

  const choose = (nextValue: T) => {
    onChange(nextValue)
    setOpen(false)
    setMenuPosition(null)
    triggerRef.current?.focus()
  }

  const move = (direction: -1 | 1) => {
    if (!options.length) return
    setActiveIndex((index) => (index + direction + options.length) % options.length)
  }

  const openMenu = () => {
    if (disabled || !options.length) return
    setOpen((current) => !current)
  }

  const menu = open && menuPosition && typeof document !== 'undefined' ? createPortal(
    <div
      ref={optionsRef}
      id={menuId}
      className={`select-menu-options select-menu-options-portal${portalLayer === 'context' ? ' is-context-dropdown' : portalLayer === 'modal' || triggerRef.current?.closest('[aria-modal="true"]') ? ' is-modal-dropdown' : ''}`}
      role="listbox"
      aria-label={ariaLabel}
      style={{ '--select-menu-top': `${menuPosition.top}px`, '--select-menu-left': `${menuPosition.left}px`, '--select-menu-width': `${menuPosition.width}px`, '--select-menu-max-height': `${menuPosition.maxHeight}px` } as CSSProperties}
    >
      {options.map((option, index) => <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={option.value === value}
        className={`select-menu-option${option.value === value ? ' is-selected' : ''}${index === activeIndex ? ' is-active' : ''}`}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(option.value)}
      ><span>{option.label}</span>{option.value === value && <span className="select-menu-check" aria-hidden="true">✓</span>}</button>)}
    </div>,
    document.body,
  ) : null

  return <div ref={rootRef} className={`select-menu${open ? ' is-open' : ''}`}>
    <button
      ref={triggerRef}
      type="button"
      className="select-menu-trigger"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={menuId}
      disabled={disabled || !options.length}
      onClick={openMenu}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); if (!open) setOpen(true); else move(1) }
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); if (!open) setOpen(true); else move(-1) }
        if (event.key === 'Home' && open) { event.preventDefault(); setActiveIndex(0) }
        if (event.key === 'End' && open) { event.preventDefault(); setActiveIndex(Math.max(0, options.length - 1)) }
        if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); const option = options[activeIndex]; if (option) choose(option.value) }
        if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); setMenuPosition(null) }
      }}
    >
      <span className="select-menu-label">{prefix}{selected?.label ?? 'Select'}</span>
      <span className="select-menu-chevron" aria-hidden="true">⌄</span>
    </button>
    {menu}
  </div>
}
