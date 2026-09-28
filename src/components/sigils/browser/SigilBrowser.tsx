import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, GameTooltip, SearchInput, SelectMenu, type SelectMenuPortalLayer } from '../../ui'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'
import { SigilCard } from '../SigilCard'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../../game/content/sigils/sigilStats'
import { SIGIL_TIERS } from '../../../game/content/sigils/sigilTiers'
import { SIGIL_STORAGE_SOFT_CAP } from '../../../game/content/sigils/sigilDropConfig'
import type { SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilStatId, SigilTier } from '../../../game/types'
import { getVisibleSigils, type SigilBrowserFilters, type SigilSortMode, type SigilStateFilter } from '../../../game/presentation/sigils/sigilBrowserReadModel'

const ALL = 'all'
const SLOT_OPTIONS = [1, 2, 3, 4, 5, 6].map((slot) => ({ value: String(slot), label: ['I', 'II', 'III', 'IV', 'V', 'VI'][slot - 1] }))
const TIER_OPTIONS = SIGIL_TIERS.map(({ tier, label }) => ({ value: String(tier), label }))
const SORT_OPTIONS = [{ value: 'quality', label: 'Quality' }, { value: 'tier', label: 'Tier' }, { value: 'rank', label: 'Rank' }, { value: 'newest', label: 'Newest' }] as const
const STATE_OPTIONS = [{ value: 'all', label: 'All states' }, { value: 'equipped', label: 'Equipped' }, { value: 'stored', label: 'Stored' }, { value: 'locked', label: 'Locked' }, { value: 'unlocked', label: 'Unlocked' }] as const

export function SigilBrowser({ storage, equipped, selectedId, onSelect, targetSlot = null, onClearTarget, revealInstanceId = null, onRevealConsumed, menuLayer = 'default', label = 'SIGIL STORAGE', onContextMenu }: {
  storage: Record<string, SigilInstance>
  equipped: Record<SigilSlot, string | null>
  selectedId: string | null
  onSelect: (instanceId: string | null) => void
  targetSlot?: SigilSlot | null
  onClearTarget?: () => void
  revealInstanceId?: string | null
  onRevealConsumed?: () => void
  menuLayer?: SelectMenuPortalLayer
  label?: string
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>, sigil: SigilInstance, equipped: boolean) => void
}) {
  const [filters, setFilters] = useState<SigilBrowserFilters>({ search: '', quality: 'all', set: 'all', tier: 'all', slot: 'all', mainStat: 'all', state: 'all', sort: 'quality' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const gridRef = useRef<HTMLDivElement | null>(null)
  const visible = useMemo(() => getVisibleSigils(storage, equipped, filters, targetSlot, revealInstanceId), [storage, equipped, filters, targetSlot, revealInstanceId])
  useSmartScrollState(gridRef, { dependencies: [visible.map((sigil) => sigil.instanceId).join('|')] })
  const equippedIds = useMemo(() => new Set(Object.values(equipped).filter((id): id is string => Boolean(id))), [equipped])

  useEffect(() => {
    if (selectedId && !visible.some((sigil) => sigil.instanceId === selectedId)) onSelect(null)
  }, [selectedId, visible, onSelect])
  useEffect(() => {
    const target = revealInstanceId ?? selectedId
    if (target && visible.some((sigil) => sigil.instanceId === target)) cardRefs.current.get(target)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedId, revealInstanceId, visible])

  const update = <K extends keyof SigilBrowserFilters>(key: K, value: SigilBrowserFilters[K]) => { onRevealConsumed?.(); setFilters((current) => ({ ...current, [key]: value })) }
  const clear = () => { onRevealConsumed?.(); setFilters({ search: '', quality: 'all', set: 'all', tier: 'all', slot: 'all', mainStat: 'all', state: 'all', sort: 'quality' }) }
  const filterCount = Number(filters.set !== 'all') + Number(filters.tier !== 'all') + Number(filters.slot !== 'all') + Number(filters.mainStat !== 'all') + Number(filters.state !== 'all')

  return <section className="sigil-browser" aria-label={label}>
    <div className="sigil-browser-heading"><div><span className="eyebrow">OWNED SIGILS · {visible.length} MATCHES</span><h3>{label}</h3></div><span className="sigil-browser-count">{Object.keys(storage).length} / {SIGIL_STORAGE_SOFT_CAP}</span></div>
    <SearchInput value={filters.search} onChange={(value) => update('search', value)} placeholder="Search Set, quality, stat, Trait…" ariaLabel="Search owned Sigils" />
    <div className="sigil-browser-toolbar">
      <div className="sigil-quality-chips" role="group" aria-label="Filter by Sigil quality">
        {[{ value: ALL, label: 'ALL' }, { value: 'common', label: 'COMMON' }, { value: 'refined', label: 'REFINED' }, { value: 'perfect', label: 'PERFECT' }, { value: 'legendary', label: 'LEGENDARY' }].map(({ value, label: chip }) => <Button key={value} type="button" variant="secondary" ariaPressed={filters.quality === value} className={'quality-chip' + (filters.quality === value ? ' active' : '') + (value === ALL ? '' : ' quality-' + value)} onClick={() => update('quality', value as SigilQuality | 'all')}>{chip}</Button>)}
      </div>
      <div className="sigil-browser-actions">
        <GameTooltip content="Filter by Set, Tier, Slot, state, or Main Stat."><Button type="button" variant="ghost" ariaPressed={filtersOpen} className="sigil-filter-trigger" onClick={() => setFiltersOpen((open) => !open)}>FILTERS{filterCount ? ' · ' + filterCount : ''}</Button></GameTooltip>
        <SelectMenu options={SORT_OPTIONS} value={filters.sort} onChange={(value) => update('sort', value as SigilSortMode)} ariaLabel="Sort Sigils" portalLayer={menuLayer} prefix="SORT: " />
        {(filterCount > 0 || filters.quality !== 'all' || filters.search) && <Button type="button" variant="ghost" className="sigil-filter-clear" onClick={clear}>CLEAR</Button>}
      </div>
    </div>
    {filtersOpen && <div className="sigil-filter-popover" aria-label="Sigil filters">
      <SelectMenu options={[{ value: ALL, label: 'All Sets' }, ...SIGIL_SET_IDS.map((id) => ({ value: id, label: SIGIL_SETS[id].name }))]} value={filters.set} onChange={(value) => update('set', value as SigilSetId | 'all')} ariaLabel="Filter by Set" portalLayer={menuLayer} prefix="SET: " />
      <SelectMenu options={[{ value: ALL, label: 'All Tiers' }, ...TIER_OPTIONS]} value={String(filters.tier)} onChange={(value) => update('tier', value === ALL ? 'all' : Number(value) as SigilTier)} ariaLabel="Filter by Tier" portalLayer={menuLayer} prefix="TIER: " />
      {targetSlot === null && <SelectMenu options={[{ value: ALL, label: 'All Slots' }, ...SLOT_OPTIONS]} value={String(filters.slot)} onChange={(value) => update('slot', value === ALL ? 'all' : Number(value) as SigilSlot)} ariaLabel="Filter by Slot" portalLayer={menuLayer} prefix="SLOT: " />}
      <SelectMenu options={STATE_OPTIONS} value={filters.state} onChange={(value) => update('state', value as SigilStateFilter)} ariaLabel="Filter Sigil state" portalLayer={menuLayer} prefix="STATE: " />
      <SelectMenu options={[{ value: ALL, label: 'All Main Stats' }, ...Object.entries(SIGIL_STAT_DEFINITIONS).map(([value, item]) => ({ value, label: item.label }))]} value={filters.mainStat} onChange={(value) => update('mainStat', value as SigilStatId | 'all')} ariaLabel="Filter by Main Stat" portalLayer={menuLayer} prefix="STAT: " />
    </div>}
    {targetSlot !== null && <div className="sigil-target-banner"><span>REPLACING SLOT {['I', 'II', 'III', 'IV', 'V', 'VI'][targetSlot - 1]}</span>{onClearTarget && <Button type="button" variant="ghost" onClick={onClearTarget}>CLEAR TARGET</Button>}</div>}
    {visible.length === 0 ? <div className="sigil-storage-empty"><strong>{Object.keys(storage).length === 0 ? 'NO SIGILS STORED' : 'NO MATCHES'}</strong><p>{Object.keys(storage).length === 0 ? 'Sigils can drop from eligible Combat enemies.' : 'Adjust or clear the active filters.'}</p></div> : <div ref={gridRef} className="sigil-browser-grid">{visible.map((sigil) => <SigilCard key={sigil.instanceId} sigil={sigil} selected={selectedId === sigil.instanceId} equipped={equippedIds.has(sigil.instanceId)} cardRef={(element) => { if (element) cardRefs.current.set(sigil.instanceId, element); else cardRefs.current.delete(sigil.instanceId) }} onSelect={() => onSelect(sigil.instanceId)} onContextMenu={(event) => onContextMenu?.(event, sigil, equippedIds.has(sigil.instanceId))} />)}</div>}
  </section>
}
