import { LockKeyhole } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../../components/ui/item'
import { getItemSourceLabel, getResearchableItemIds, getResearchXp, ITEMS } from '../../../game/content/items/items'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { getResearchAvailableQuantity } from '../../../game/systems/research/researchSelectors'
import { getResearchReservedQuantity } from '../../../game/systems/research/researchReservations'
import type { ItemId, SchoolId } from '../../../game/types'
import { formatNumber } from '../../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'

const SCHOOLS_ORDER = Object.keys(SCHOOLS) as SchoolId[]
const RESEARCHABLE_ITEM_IDS = getResearchableItemIds()

/** Primitive values keep the library stable while current-cycle progress changes. */
const useResearchItemState = () => useGameStore(useShallow((state) => Object.fromEntries(RESEARCHABLE_ITEM_IDS.map((itemId) => [itemId, `${state.inventory[itemId] ?? 0}|${getResearchReservedQuantity(state, itemId)}|${getResearchAvailableQuantity(state, itemId)}|${Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)}`])) as Record<ItemId, string>))

export function ResearchLibrary({ selectedItemId, onSelect }: { selectedItemId: ItemId | null; onSelect: (itemId: ItemId) => void }) {
  const preferences = useUiPreferences()
  const filter = preferences.screenState.research.affinityFilter
  const itemState = useResearchItemState()
  const itemIds = RESEARCHABLE_ITEM_IDS.filter((itemId) => {
    const [, reserved, ,] = itemState[itemId].split('|').map(Number)
    return (Number(itemState[itemId].split('|')[0]) > 0 || reserved > 0) && (filter === 'all' || ITEMS[itemId].researchSchool === filter)
  })
  const allResearchable = RESEARCHABLE_ITEM_IDS.filter((itemId) => Number(itemState[itemId].split('|')[0]) > 0 || Number(itemState[itemId].split('|')[1]) > 0)
  const setFilter = (next: 'all' | SchoolId) => setUiPreferences({ screenState: { research: { affinityFilter: next } } })
  return <Card className="research-library" title="RESEARCHABLE ITEMS" action={<span className="research-count">{itemIds.length} / {allResearchable.length}</span>}>
    <div className="research-filters" role="tablist" aria-label="Research affinity filters">
      <FilterButton label="ALL" active={filter === 'all'} onClick={() => setFilter('all')} />
      {SCHOOLS_ORDER.map((schoolId) => <FilterButton key={schoolId} label={SCHOOLS[schoolId].name.toUpperCase()} active={filter === schoolId} onClick={() => setFilter(schoolId)} />)}
    </div>
    <div className="research-library-body">{itemIds.length === 0 ? <div className="empty-state small">{allResearchable.length ? 'No researchable items match this affinity.' : 'Fragments you own or prepare will appear here.'}</div> : <div className="research-item-grid">{itemIds.map((itemId) => <ResearchItemTile key={itemId} itemId={itemId} selected={selectedItemId === itemId} encodedState={itemState[itemId]} onSelect={onSelect} />)}</div>}</div>
  </Card>
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} className={`research-filter ${active ? 'active' : ''}`} onClick={onClick}>{label}</button>
}

function ResearchItemTile({ itemId, selected, encodedState, onSelect }: { itemId: ItemId; selected: boolean; encodedState: string; onSelect: (itemId: ItemId) => void }) {
  const item = ITEMS[itemId]
  const [ownedValue, reservedValue, availableValue, protectedValue] = encodedState.split('|')
  const owned = Number(ownedValue)
  const reserved = Number(reservedValue)
  const available = Number(availableValue)
  const protectedItem = protectedValue === 'true'
  const tooltip = <TooltipContent title={item.name.toUpperCase()} description={item.description}><div className="tooltip-section"><small>RESEARCH</small><p>Native affinity: {item.researchSchool ? SCHOOLS[item.researchSchool].name : '—'}</p>{SCHOOLS_ORDER.map((schoolId) => <p key={schoolId}>{SCHOOLS[schoolId].name} XP: {getResearchXp(itemId, schoolId)}</p>)}</div><div className="tooltip-section"><small>INVENTORY</small><p>Owned: {formatNumber(owned)} · Reserved: {formatNumber(reserved)} · Available: {formatNumber(available)}</p></div><div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div></TooltipContent>
  return <GameTooltip block accent={protectedItem ? 'warning' : 'elemental'} content={tooltip}><button type="button" aria-pressed={selected} className={`research-item-tile ${selected ? 'selected' : ''} ${protectedItem ? 'protected' : ''} ${available <= 0 ? 'unavailable' : ''}`} style={{ '--research-accent': item.color } as CSSProperties} onClick={() => onSelect(itemId)}><span className="research-item-tile-top">{protectedItem ? <LockKeyhole size={13} aria-label="Protected" /> : <span aria-hidden="true" />}{reserved > 0 && <Status tone="active">{reserved} PREPARED</Status>}</span><span className="research-item-icon"><ItemIcon itemId={itemId} size="tile" /></span><strong>{item.name}</strong><span className="research-item-quantity"><ItemQuantity value={owned} compact /> · {available} available</span></button></GameTooltip>
}
