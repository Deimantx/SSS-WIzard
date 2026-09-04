import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { ModalPortal } from '../ModalPortal'
import { SearchInput } from '../index'
import '../../../styles/components/item-uses-dialog.css'
import { ITEMS } from '../../../game/content/items/items'
import type { InventoryDestination } from '../../../game/content/items/inventoryMetadata'
import type { RecipeId } from '../../../game/types'

type ItemUseEntry = InventoryDestination & { locked?: boolean }
type ItemUseGroup = 'transmutation' | 'research' | 'tower-progression' | 'guild' | 'other'

const GROUPS: Array<{ id: ItemUseGroup; label: string }> = [
  { id: 'transmutation', label: 'TRANSMUTATION' },
  { id: 'research', label: 'RESEARCH' },
  { id: 'tower-progression', label: 'TOWER PROGRESSION' },
  { id: 'guild', label: 'GUILD' },
  { id: 'other', label: 'OTHER' },
]

export function ItemUsesDialog({ itemId, uses, open, onClose, onSelectRecipe }: { itemId: keyof typeof ITEMS; uses: ItemUseEntry[]; open: boolean; onClose: () => void; onSelectRecipe?: (recipeId: RecipeId) => void }) {
  const [query, setQuery] = useState('')
  const titleId = useId()
  const item = ITEMS[itemId]
  const normalizedQuery = query.trim().toLowerCase()
  const groups = useMemo(() => GROUPS.map((group) => ({ ...group, uses: uses.filter((use) => groupFor(use) === group.id && (!normalizedQuery || `${use.label} ${use.detail ?? ''} ${group.label}`.toLowerCase().includes(normalizedQuery))) })).filter((group) => group.uses.length > 0), [normalizedQuery, uses])

  useEffect(() => {
    if (open) setQuery('')
  }, [itemId, open])

  return <ModalPortal open={open} onClose={onClose} backdropClassName="item-uses-dialog-backdrop" surfaceClassName="item-uses-dialog" ariaLabelledBy={titleId}>
    <header className="item-uses-dialog-header"><div><span className="eyebrow">ITEM RELATIONSHIPS</span><h2 id={titleId}>{item.name.toUpperCase()} — USED IN</h2><p>{uses.length} visible {uses.length === 1 ? 'use' : 'uses'}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close Used In dialog"><X size={18} aria-hidden="true" /></button></header>
    <label className="item-uses-dialog-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search uses</span><SearchInput type="search" value={query} onChange={setQuery} placeholder="Search uses..." ariaLabel="Search uses" /></label>
    <div className="item-uses-dialog-scroll">
      {groups.length > 0 ? groups.map((group) => <section className="item-uses-dialog-group" key={group.id}><h3>{group.label}</h3>{group.uses.map((use) => <UseRow key={`${use.destination}-${use.recipeId ?? use.label}`} use={use} onSelectRecipe={onSelectRecipe} onClose={onClose} />)}</section>) : <p className="item-uses-dialog-empty">No uses match “{query}”.</p>}
    </div>
  </ModalPortal>
}

function UseRow({ use, onSelectRecipe, onClose }: { use: ItemUseEntry; onSelectRecipe?: (recipeId: RecipeId) => void; onClose: () => void }) {
  const content = <><strong>{use.label}</strong><small>{use.detail ?? 'Item relationship'}</small>{use.locked && <span className="status locked">LOCKED</span>}</>
  if (!use.recipeId || !onSelectRecipe) return <div className="item-uses-dialog-row">{content}</div>
  return <button type="button" className="item-uses-dialog-row is-action" aria-label={`Select ${use.label}${use.locked ? ', locked' : ''}`} onClick={() => { onSelectRecipe(use.recipeId!); onClose() }}>{content}</button>
}

function groupFor(use: ItemUseEntry): ItemUseGroup {
  if (use.destination === 'tower-transmutation') return 'transmutation'
  if (use.destination === 'tower-research') return 'research'
  if (use.destination === 'tower-channeling' || use.destination === 'tower-focus') return 'tower-progression'
  if (use.destination === 'guild') return 'guild'
  return 'other'
}
