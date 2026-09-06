import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GameContextMenuAction, GameContextMenuHeader, GameContextMenuSection } from './gameContextMenuTypes'

export function GameContextMenu({ x, y, header, sections, onClose }: { x: number; y: number; header?: GameContextMenuHeader; sections: GameContextMenuSection[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })
  const items = sections.flatMap((section) => section.actions)
  const focusItem = (index: number) => menuRef.current?.querySelector<HTMLButtonElement>(`[data-menu-index="${index}"]`)?.focus()
  useEffect(() => { focusItem(items.findIndex((item) => !item.disabled)) }, [])
  useLayoutEffect(() => { const menu = menuRef.current; if (!menu) return; const rect = menu.getBoundingClientRect(); setPosition({ x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)), y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)) }) }, [x, y])
  const onKeyDown = (event: React.KeyboardEvent) => {
    const current = Number((document.activeElement as HTMLElement | null)?.dataset.menuIndex ?? 0)
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? -1 : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : 1
      let next = direction === 0 || direction === items.length - 1 ? direction : (current + direction + items.length) % items.length
      for (let tries = 0; tries < items.length && items[next]?.disabled; tries++) next = (next + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
      focusItem(next)
    }
    if ((event.key === 'Enter' || event.key === ' ') && !items[current]?.disabled) { event.preventDefault(); onClose(); items[current].onSelect() }
  }
  return <div ref={menuRef} className="game-context-menu" role="menu" style={{ left: position.x, top: position.y }} onKeyDown={onKeyDown}>
    {header && <div className="game-context-menu-header">{header.icon}<span><strong>{header.title}</strong>{header.meta && <small>{header.meta}</small>}</span></div>}
    {sections.map((section, sectionIndex) => <div className="game-context-menu-section" key={section.id}>{sectionIndex > 0 && <div className="game-context-menu-separator" />}{section.actions.map((action, actionIndex) => { const index = sections.slice(0, sectionIndex).reduce((count, current) => count + current.actions.length, 0) + actionIndex; return <button key={action.id} type="button" role="menuitem" data-menu-index={index} disabled={action.disabled} aria-disabled={action.disabled} className={`game-context-menu-item ${action.tone ?? 'normal'}`} onClick={() => { if (action.disabled) return; onClose(); action.onSelect() }}><span className="game-context-menu-item-icon" aria-hidden="true">{action.icon ? <action.icon size={14} /> : null}</span><span className="game-context-menu-item-copy"><span className="game-context-menu-item-label">{action.label}</span>{action.disabledReason && <small className="game-context-menu-item-reason">{action.disabledReason}</small>}</span></button> })}</div>)}
  </div>
}
