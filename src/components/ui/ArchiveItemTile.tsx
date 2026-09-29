import type { MouseEvent, ReactNode } from 'react'
import { Check } from 'lucide-react'

export type ArchiveItemTileMark = 'registered' | 'ready' | 'unknown' | 'new'

export interface ArchiveItemTileProps {
  art: ReactNode
  title: string
  secondary: ReactNode
  ariaLabel: string
  selected: boolean
  hidden?: boolean
  mark?: ArchiveItemTileMark
  className?: string
  onSelect: () => void
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void
}

/** Shared selectable archive/catalog tile used by Collection and progression registries. */
export function ArchiveItemTile({ art, title, secondary, ariaLabel, selected, hidden = false, mark, className = '', onSelect, onContextMenu }: ArchiveItemTileProps) {
  return <button
    type="button"
    className={`archive-entry-card archive-item-tile ${hidden ? 'undiscovered' : ''} ${selected ? 'selected' : ''} ${className}`.trim()}
    onClick={onSelect}
    onContextMenu={onContextMenu}
    aria-label={ariaLabel}
    aria-pressed={selected}
  >
    <span className="archive-entry-art archive-item-tile-art">{art}</span>
    <span className="archive-item-copy"><strong>{title}</strong><small>{secondary}</small></span>
    {mark === 'registered' && <Check className="archive-item-tile-check" size={14} aria-hidden="true" />}
    {mark === 'ready' && <span className="archive-item-tile-ready">READY</span>}
    {mark === 'unknown' && <span className="archive-item-tile-unknown">?</span>}
    {mark === 'new' && <span className="archive-new-badge">NEW</span>}
  </button>
}
