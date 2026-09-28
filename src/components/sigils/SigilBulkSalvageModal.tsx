import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Button, GameTooltip, ModalPortal, SearchInput, SelectMenu, Status } from '../ui'
import { SigilCard } from './SigilCard'
import { SIGIL_QUALITIES, type SigilQuality } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SET_IDS, SIGIL_SETS, type SigilSetId } from '../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../game/content/sigils/sigilStats'
import { SIGIL_TIERS, resolveSigilTierFromEnemyPower } from '../../game/content/sigils/sigilTiers'
import { getSigilSalvageValue } from '../../game/systems/sigils/sigilRuntime'
import { getSigilSlotRoman } from '../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilInstance, SigilSlot } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const formatSigilCount = (count: number) => count.toLocaleString() + ' SIGIL' + (count === 1 ? '' : 'S')
const QUALITY_FILTERS = [{ value: 'all', label: 'All Qualities' }, ...SIGIL_QUALITIES.map(({ id, label }) => ({ value: id, label }))]
const TIER_FILTERS = [{ value: 'all', label: 'All Tiers' }, ...SIGIL_TIERS.map(({ tier }) => ({ value: String(tier), label: 'Tier ' + tier }))]
const SET_FILTERS = [{ value: 'all', label: 'All Sets' }, ...SIGIL_SET_IDS.map((id) => ({ value: id, label: SIGIL_SETS[id].name }))]
const SLOT_FILTERS = [{ value: 'all', label: 'All Channels' }, ...([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((slot) => ({ value: String(slot), label: 'Slot ' + getSigilSlotRoman(slot) }))]
const RANK_FILTERS = [{ value: 'all', label: 'Any Rank' }, { value: '0', label: '+0' }, { value: '1-5', label: '+1 to +5' }, { value: '6-10', label: '+6 to +10' }, { value: '11-15', label: '+11 to +15' }, { value: '16+', label: '+16+' }]
const STATE_FILTERS = [{ value: 'all', label: 'All Eligible' }, { value: 'unequipped', label: 'Unequipped' }, { value: 'locked', label: 'Locked' }, { value: 'unlocked', label: 'Unlocked' }]
const TRAIT_FILTERS = [{ value: 'all', label: 'Any Traits' }, { value: 'none', label: 'No Traits' }, { value: 'has', label: 'Has Trait' }, { value: 'two', label: '2 Traits' }]
const MAIN_STAT_FILTERS = [{ value: 'all', label: 'All Main Stats' }, ...Object.entries(SIGIL_STAT_DEFINITIONS).map(([value, definition]) => ({ value, label: definition.label }))]

type FilterValue = { quality: string; tier: string; set: string; slot: string; rank: string; mainStat: string; state: string; traits: string }
type QuickPreset = 'common' | 'common-refined' | 'rank-zero' | 'common-rank-zero' | 'no-traits' | 'below-tier' | 'unequipped'

export function SigilBulkSalvageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sigils = useGameStore((state) => state.sigils)
  const highestSourcePower = useGameStore((state) => state.sigils.highestSourcePowerDefeated)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterValue>({ quality: 'all', tier: 'all', set: 'all', slot: 'all', rank: 'all', mainStat: 'all', state: 'all', traits: 'all' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const equippedIds = useMemo(() => new Set(Object.values(sigils.equipped).filter((id): id is string => Boolean(id))), [sigils.equipped])
  const stored = useMemo(() => Object.values(sigils.storage), [sigils.storage])
  const currentTier = resolveSigilTierFromEnemyPower(highestSourcePower)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setFilters({ quality: 'all', tier: 'all', set: 'all', slot: 'all', rank: 'all', mainStat: 'all', state: 'all', traits: 'all' })
    setSelectedIds(new Set())
    setConfirming(false)
  }, [open])

  const visible = useMemo(() => stored.filter((sigil) => {
    const name = SIGIL_SETS[sigil.setId].name + ' ' + SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label + ' ' + getSigilSlotRoman(sigil.slot) + ' ' + sigil.quality + ' ' + sigil.tier
    const rankMatches = filters.rank === 'all' || filters.rank === '0' && sigil.rank === 0 || filters.rank === '1-5' && sigil.rank >= 1 && sigil.rank <= 5 || filters.rank === '6-10' && sigil.rank >= 6 && sigil.rank <= 10 || filters.rank === '11-15' && sigil.rank >= 11 && sigil.rank <= 15 || filters.rank === '16+' && sigil.rank >= 16
    const stateMatches = filters.state === 'all' ? !sigil.locked && !equippedIds.has(sigil.instanceId) : filters.state === 'unequipped' ? !equippedIds.has(sigil.instanceId) : filters.state === 'locked' ? sigil.locked : !sigil.locked
    const traitMatches = filters.traits === 'all' || filters.traits === 'none' && sigil.traitIds.length === 0 || filters.traits === 'has' && sigil.traitIds.length > 0 || filters.traits === 'two' && sigil.traitIds.length === 2
    return (!query || name.toLowerCase().includes(query.trim().toLowerCase())) && (filters.quality === 'all' || sigil.quality === filters.quality) && (filters.tier === 'all' || sigil.tier === Number(filters.tier)) && (filters.set === 'all' || sigil.setId === filters.set) && (filters.slot === 'all' || sigil.slot === Number(filters.slot)) && rankMatches && (filters.mainStat === 'all' || sigil.mainStatId === filters.mainStat) && stateMatches && traitMatches
  }).sort((a, b) => b.instanceId.localeCompare(a.instanceId)), [stored, query, filters, equippedIds])

  const selected = useMemo(() => [...selectedIds].flatMap((id) => { const sigil = sigils.storage[id]; return sigil && !sigil.locked && !equippedIds.has(id) ? [sigil] : [] }), [selectedIds, sigils.storage, equippedIds])
  const dustExpected = selected.reduce((sum, sigil) => sum + getSigilSalvageValue(sigil), 0)
  const selectedByQuality = Object.fromEntries(SIGIL_QUALITIES.map(({ id }) => [id, selected.filter((sigil) => sigil.quality === id).length])) as Record<SigilQuality, number>
  const eligibleVisibleIds = visible.filter((sigil) => !sigil.locked && !equippedIds.has(sigil.instanceId)).map((sigil) => sigil.instanceId)
  const highQualityCounts = { perfect: selectedByQuality.perfect, legendary: selectedByQuality.legendary }
  const highQualitySelected = highQualityCounts.perfect + highQualityCounts.legendary > 0

  const choosePreset = (preset: QuickPreset) => {
    const match = (sigil: SigilInstance) => {
      if (sigil.locked || equippedIds.has(sigil.instanceId)) return false
      if (preset === 'common') return sigil.quality === 'common'
      if (preset === 'common-refined') return sigil.quality === 'common' || sigil.quality === 'refined'
      if (preset === 'rank-zero') return sigil.rank === 0
      if (preset === 'common-rank-zero') return sigil.quality === 'common' && sigil.rank === 0
      if (preset === 'no-traits') return sigil.traitIds.length === 0
      if (preset === 'below-tier') return sigil.tier < currentTier
      return !equippedIds.has(sigil.instanceId)
    }
    setSelectedIds(new Set(stored.filter(match).map((sigil) => sigil.instanceId)))
  }
  const toggleOne = (sigil: SigilInstance) => {
    if (sigil.locked || equippedIds.has(sigil.instanceId)) return
    setSelectedIds((previous) => { const next = new Set(previous); if (next.has(sigil.instanceId)) next.delete(sigil.instanceId); else next.add(sigil.instanceId); return next })
  }
  const selectVisible = () => setSelectedIds((previous) => new Set([...previous, ...eligibleVisibleIds]))
  const invertVisible = () => setSelectedIds((previous) => {
    const next = new Set(previous)
    eligibleVisibleIds.forEach((id) => next.has(id) ? next.delete(id) : next.add(id))
    return next
  })
  const updateFilter = (key: keyof FilterValue, value: string) => setFilters((previous) => ({ ...previous, [key]: value }))
  const completeSalvage = () => {
    const result = useGameStore.getState().bulkSalvageSigils([...selectedIds])
    if (result.ok) {
      const changed = result.skippedLocked + result.skippedEquipped + result.missing
      const details = changed ? ` ${changed} selected Sigil${changed === 1 ? ' was' : 's were'} skipped because its state changed.` : ''
      useGameStore.getState().notifySigil(`Salvaged ${result.salvagedCount} Sigils for ${result.dustGranted.toLocaleString()} Sigil Dust.${details}`, 'success')
    } else {
      useGameStore.getState().notifySigil('No selected Sigils could be salvaged. Protected or missing Sigils were skipped.', 'warning')
    }
    onClose()
  }

  return <ModalPortal open={open} onClose={onClose} backdropClassName="sigil-bulk-backdrop" surfaceClassName="sigil-bulk-modal" ariaLabel="Bulk Salvage Sigils" ariaLabelledBy="sigil-bulk-title">
    <header className="sigil-bulk-header"><div><span className="eyebrow">SIGIL MANAGEMENT</span><h2 id="sigil-bulk-title">{confirming ? 'CONFIRM SALVAGE' : 'BULK SALVAGE'}</h2><p>{confirming ? 'Review this irreversible conversion before confirming.' : 'Select unwanted Sigils and convert them into Sigil Dust.'}</p></div><div className="sigil-bulk-header-metrics"><Status tone="neutral">{stored.length} STORED</Status><Status tone="active">{selected.length} SELECTED</Status><Status tone="success">{dustExpected.toLocaleString()} DUST EXPECTED</Status></div><Button variant="ghost" ariaLabel="Close Bulk Salvage" onClick={onClose}>CLOSE</Button></header>
    {confirming ? <section className="sigil-bulk-confirm"><div className="sigil-bulk-confirm-title"><span className="eyebrow">FINAL REVIEW</span><h3>SALVAGE {formatSigilCount(selected.length)}?</h3></div><div className="sigil-bulk-quality-totals">{SIGIL_QUALITIES.filter(({ id }) => selectedByQuality[id] > 0).map(({ id, label }) => <div key={id} className={'quality-' + id}><span>{label}</span><strong>{selectedByQuality[id].toLocaleString()}</strong></div>)}</div><div className="sigil-bulk-confirm-dust"><span>EXPECTED DUST</span><strong>+{dustExpected.toLocaleString()}</strong></div><p>Equipped and Locked Sigils are excluded. Any selected Sigil whose state changed will be skipped safely.</p>{highQualitySelected && <Status tone="warning">HIGH-QUALITY SIGILS INCLUDED Â· {highQualityCounts.perfect} PERFECT Â· {highQualityCounts.legendary} LEGENDARY</Status>}<p className="sigil-bulk-irreversible">This cannot be undone.</p><div className="sigil-bulk-confirm-actions"><Button variant="secondary" onClick={() => setConfirming(false)}>CANCEL</Button><Button variant="danger" disabled={selected.length === 0} onClick={completeSalvage}>CONFIRM SALVAGE</Button></div></section> : <>
      <div className="sigil-bulk-toolbar"><div className="sigil-bulk-search"><SearchInput value={query} onChange={setQuery} placeholder="Search Set, Main Stat, Slot, Quality, or Tier" ariaLabel="Search stored Sigils" /></div><div className="sigil-bulk-presets" aria-label="Quick select presets">{[['COMMON', 'common'], ['COMMON + REFINED', 'common-refined'], ['RANK +0', 'rank-zero'], ['COMMON + RANK +0', 'common-rank-zero'], ['NO TRAITS', 'no-traits'], ['BELOW CURRENT TIER', 'below-tier'], ['UNEQUIPPED', 'unequipped']].map(([label, preset]) => <Button key={preset} variant="ghost" onClick={() => choosePreset(preset as QuickPreset)}>{label}</Button>)}</div><div className="sigil-bulk-filters"><SelectMenu portalLayer="modal" ariaLabel="Filter by Quality" value={filters.quality} options={QUALITY_FILTERS} onChange={(value) => updateFilter('quality', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Tier" value={filters.tier} options={TIER_FILTERS} onChange={(value) => updateFilter('tier', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Set" value={filters.set} options={SET_FILTERS} onChange={(value) => updateFilter('set', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Slot" value={filters.slot} options={SLOT_FILTERS} onChange={(value) => updateFilter('slot', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Rank" value={filters.rank} options={RANK_FILTERS} onChange={(value) => updateFilter('rank', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Main Stat" value={filters.mainStat} options={MAIN_STAT_FILTERS} onChange={(value) => updateFilter('mainStat', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Sigil State" value={filters.state} options={STATE_FILTERS} onChange={(value) => updateFilter('state', value)} /><SelectMenu portalLayer="modal" ariaLabel="Filter by Trait State" value={filters.traits} options={TRAIT_FILTERS} onChange={(value) => updateFilter('traits', value)} /></div><div className="sigil-bulk-selection-actions"><span>{visible.length} VISIBLE</span><Button variant="secondary" onClick={selectVisible}>SELECT ALL VISIBLE</Button><Button variant="ghost" onClick={invertVisible}>INVERT VISIBLE</Button><Button variant="ghost" onClick={() => setSelectedIds(new Set())}>CLEAR SELECTION</Button></div></div>
      <div className="sigil-bulk-grid-scroll">{visible.length ? <div className="sigil-bulk-grid">{visible.map((sigil) => { const equipped = equippedIds.has(sigil.instanceId); const disabled = equipped || sigil.locked; const selectedCard = selectedIds.has(sigil.instanceId); const protection = equipped ? 'Equipped Sigils cannot be salvaged.' : sigil.locked ? 'Locked Sigils are protected from Salvage.' : undefined; return <div key={sigil.instanceId} className={'sigil-bulk-card-wrap' + (selectedCard ? ' is-selected' : '')}><SigilCard sigil={sigil} selected={selectedCard} equipped={equipped} disabled={disabled} disabledReason={protection} compact onSelect={() => toggleOne(sigil)} /><span className="sigil-bulk-check" aria-hidden="true">{selectedCard ? <Check size={12} strokeWidth={3} /> : '+'}</span></div> })}</div> : <div className="sigil-bulk-empty"><strong>NO SIGILS MATCH</strong><span>Change the filters or clear your search.</span></div>}</div>
      <footer className="sigil-bulk-footer"><div className="sigil-bulk-footer-summary"><strong>{formatSigilCount(selected.length)} SELECTED</strong><div className="sigil-bulk-quality-totals">{SIGIL_QUALITIES.map(({ id, label }) => <span key={id} className={'quality-' + id}>{label}<b>{selectedByQuality[id].toLocaleString()}</b></span>)}</div></div><div className="sigil-bulk-footer-dust"><span>EXPECTED RETURN</span><strong>+{dustExpected.toLocaleString()} SIGIL DUST</strong></div><Button variant="secondary" onClick={onClose}>CANCEL</Button><Button variant="danger" disabled={!selected.length} onClick={() => setConfirming(true)}>SALVAGE {formatSigilCount(selected.length)}</Button></footer>
    </>}
  </ModalPortal>
}
