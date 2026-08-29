import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export interface SelectMenuOption<T extends string> {
  value: T
  label: ReactNode
}

export function SelectMenu<T extends string>({ options, value, onChange, ariaLabel, prefix = '', disabled = false }: {
  options: readonly SelectMenuOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  prefix?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = `select-menu-${useId().replace(/:/g, '')}`
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex)
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', closeOutside)
    return () => window.removeEventListener('pointerdown', closeOutside)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!options.length) return
    setActiveIndex(Math.min(activeIndex, options.length - 1))
  }, [activeIndex, options.length])

  const choose = (nextValue: T) => {
    onChange(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const move = (direction: -1 | 1) => {
    if (!options.length) return
    setActiveIndex((index) => (index + direction + options.length) % options.length)
  }

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
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); if (!open) setOpen(true); else move(1) }
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); if (!open) setOpen(true); else move(-1) }
        if (event.key === 'Home' && open) { event.preventDefault(); setActiveIndex(0) }
        if (event.key === 'End' && open) { event.preventDefault(); setActiveIndex(Math.max(0, options.length - 1)) }
        if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); const option = options[activeIndex]; if (option) choose(option.value) }
        if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false) }
      }}
    >
      <span className="select-menu-label">{prefix}{selected?.label ?? 'Select'}</span>
      <span className="select-menu-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && <div id={menuId} className="select-menu-options" role="listbox" aria-label={ariaLabel}>
      {options.map((option, index) => <button
        key={option.value}
        type="button"
        role="option"
        aria-selected={option.value === value}
        className={`select-menu-option${option.value === value ? ' is-selected' : ''}${index === activeIndex ? ' is-active' : ''}`}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(option.value)}
      ><span>{option.label}</span>{option.value === value && <span className="select-menu-check" aria-hidden="true">✓</span>}</button>)}
    </div>}
  </div>
}
