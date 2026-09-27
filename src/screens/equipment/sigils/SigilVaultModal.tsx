import { useEffect, useMemo, useRef, useState } from 'react'
import { LockKeyhole, Sparkles, Unlock, X } from 'lucide-react'
import { Button, GameTooltip, ModalPortal, SearchInput, SelectMenu } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ActiveSigilTraits, SigilQualityBadge, SigilSetSummary, SigilSocket, SigilTooltipContent } from '../../../components/sigils/SigilPresentation'
import { SIGIL_QUALITIES } from '../../../game/content/sigils/sigilQualities'
import { SIGIL_STORAGE_SOFT_CAP } from '../../../game/content/sigils/sigilDropConfig'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS, type SigilStatId } from '../../../game/content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../../game/content/sigils/sigilTraits'
import { getSigilEnhancementCap, getSigilEnhancementCost, resolveSigilStatsForInstance } from '../../../game/systems/sigils/sigilRuntime'
import { getSigilSearchText, getSigilSlotRoman, formatSigilStatValue } from '../../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilTier } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'

type StateFilter = 'all' | 'equipped' | 'stored' | 'locked' | 'unlocked'
type SortMode = 'quality' | 'tier' | 'rank' | 'newest'
const ALL = 'all'
const QUALITY_ORDER: SigilQuality[] = ['common', 'refined', 'perfect', 'legendary']
const SLOT_OPTIONS = [1, 2, 3, 4, 5, 6].map((slot) => ({ value: String(slot), label: getSigilSlotRoman(slot as SigilSlot) }))
const TIER_OPTIONS = [1, 2, 3, 4, 5, 6].map((tier) => ({ value: String(tier), label: `Tier ${tier}` }))

export function SigilVaultModal({ open, onClose, initialSigilInstanceId = null, initialSlot = null, onSelectedInstanceChange, onOpenArtificing }: {
  open: boolean
  onClose: () => void
  initialSigilInstanceId?: string | null
  initialSlot?: SigilSlot | null
  onSelectedInstanceChange?: (instanceId: string | null) => void
  onOpenArtificing: (instanceId: string | null) => void
}) {
  const storage = useGameStore((state) => state.sigils.storage)
  const equipped = useGameStore((state) => state.sigils.equipped)
  const dust = useGameStore((state) => state.sigils.dust)
  const progress = useGameStore((state) => state.progress)
  const sigilState = useGameStore((state) => state.sigils)
  const setScreen = useGameStore((state) => state.setScreen)
  const equipSigil = useGameStore((state) => state.equipSigil)
  const unequipSigil = useGameStore((state) => state.unequipSigil)
  const toggleSigilLock = useGameStore((state) => state.toggleSigilLock)
  const notifySigil = useGameStore((state) => state.notifySigil)
  const { openContextMenu } = useGameContextMenu()
  const [targetSlot, setTargetSlot] = useState<SigilSlot | null>(initialSlot)
  const [selectedId, setSelectedId] = useState<string | null>(() => resolveInitialSigil(initialSigilInstanceId, initialSlot, storage, equipped))
  const [search, setSearch] = useState('')
  const [qualityFilter, setQualityFilter] = useState<SigilQuality | 'all'>('all')
  const [setFilter, setSetFilter] = useState<SigilSetId | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | SigilTier>('all')
  const [slotFilter, setSlotFilter] = useState<'all' | SigilSlot>('all')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('quality')
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    if (!open) return
    setTargetSlot(initialSlot)
    const nextId = resolveInitialSigil(initialSigilInstanceId, initialSlot, storage, equipped)
    setSelectedId(nextId)
    onSelectedInstanceChange?.(nextId)
  }, [open, initialSigilInstanceId, initialSlot])
  useEffect(() => {
    if (open && selectedId) cardRefs.current.get(selectedId)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, selectedId])

  const selected = selectedId ? storage[selectedId] : undefined
  const equippedIds = useMemo(() => new Set(Object.values(equipped).filter((id): id is string => Boolean(id))), [equipped])
  const stored = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const qualityRank = (quality: SigilQuality) => QUALITY_ORDER.indexOf(quality)
    return Object.values(storage)
      .filter((sigil) => !query || getSigilSearchText(sigil).includes(query))
      .filter((sigil) => qualityFilter === 'all' || sigil.quality === qualityFilter)
      .filter((sigil) => setFilter === 'all' || sigil.setId === setFilter)
      .filter((sigil) => tierFilter === 'all' || sigil.tier === tierFilter)
      .filter((sigil) => slotFilter === 'all' || sigil.slot === slotFilter)
      .filter((sigil) => targetSlot === null || sigil.slot === targetSlot)
      .filter((sigil) => stateFilter === 'all' || stateFilter === 'equipped' && equippedIds.has(sigil.instanceId) || stateFilter === 'stored' && !equippedIds.has(sigil.instanceId) || stateFilter === 'locked' && sigil.locked || stateFilter === 'unlocked' && !sigil.locked)
      .sort((left, right) => sortMode === 'tier' ? right.tier - left.tier || right.rank - left.rank : sortMode === 'rank' ? right.rank - left.rank || right.tier - left.tier : sortMode === 'newest' ? getSigilSequence(right) - getSigilSequence(left) : qualityRank(right.quality) - qualityRank(left.quality) || right.tier - left.tier || right.rank - left.rank)
  }, [storage, search, qualityFilter, setFilter, tierFilter, slotFilter, targetSlot, stateFilter, sortMode, equippedIds])
  const cap = getSigilEnhancementCap({ sigils: sigilState, progress })
  const equippedCount = equippedIds.size
  const storedCount = Math.max(0, Object.keys(storage).length - equippedCount)

  const chooseSlot = (slot: SigilSlot) => {
    const instanceId = equipped[slot]
    setTargetSlot(slot)
    setSlotFilter('all')
    setSelectedId(instanceId)
    onSelectedInstanceChange?.(instanceId)
  }
  const chooseSigil = (sigil: SigilInstance) => {
    setSelectedId(sigil.instanceId)
    setTargetSlot((current) => current ?? sigil.slot)
    onSelectedInstanceChange?.(sigil.instanceId)
  }
  const clearTarget = () => { setTargetSlot(null); setSlotFilter('all') }
  const openArtificing = () => onOpenArtificing(selected?.instanceId ?? null)
  const equipSelected = () => {
    if (!selected) return
    const result = equipSigil(selected.instanceId)
    if (!result.ok) { notifySigil(result.reason ?? 'Unable to equip Sigil.'); return }
    setTargetSlot(selected.slot)
    notifySigil(`Equipped to Slot ${getSigilSlotRoman(selected.slot)}.`, 'success')
  }
  const unequipSelected = () => {
    if (!selected) return
    const slot = (Object.entries(equipped).find(([, id]) => id === selected.instanceId)?.[0])
    if (!slot) return
    const result = unequipSigil(Number(slot) as SigilSlot)
    if (!result.ok) notifySigil(result.reason ?? 'Unable to unequip Sigil.')
  }
  const toggleLock = () => {
    if (!selected) return
    const result = toggleSigilLock(selected.instanceId)
    if (!result.ok) notifySigil(result.reason ?? 'Unable to update protection.')
  }
  const openSigilMenu = (event: React.MouseEvent<HTMLButtonElement>, sigil: SigilInstance, isEquipped: boolean) => {
    event.preventDefault()
    event.stopPropagation()
    const select = () => chooseSigil(sigil)
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      anchor: event.currentTarget,
      header: { title: `${SIGIL_SETS[sigil.setId].name} ${getSigilSlotRoman(sigil.slot)}`, meta: `TIER ${sigil.tier} · ${sigil.quality.toUpperCase()} · +${sigil.rank}` },
      sections: [
        { id: 'inspect', actions: [{ id: 'inspect', label: 'Inspect', onSelect: select }, { id: 'compare', label: 'Compare', onSelect: select }] },
        { id: 'equipment', actions: [
          { id: 'equip', label: isEquipped ? 'Equipped' : equipped[sigil.slot] ? 'Replace in Array' : 'Equip', disabled: isEquipped, disabledReason: isEquipped ? 'Already in the Array.' : undefined, onSelect: () => { select(); const result = equipSigil(sigil.instanceId); if (!result.ok) notifySigil(result.reason ?? 'Unable to equip Sigil.') } },
          ...(isEquipped ? [{ id: 'unequip', label: 'Unequip', onSelect: () => { chooseSigil(sigil); unequipSigil(sigil.slot) } }] : []),
          { id: 'lock', label: sigil.locked ? 'Unlock' : 'Lock', onSelect: () => toggleSigilLock(sigil.instanceId) },
        ] },
        { id: 'routes', actions: [
          { id: 'artificing', label: 'Open in Artificing', onSelect: () => onOpenArtificing(sigil.instanceId) },
          { id: 'collection', label: 'Open Set in Collection', onSelect: () => { setNavigationIntent({ sigilSetId: sigil.setId }); setUiPreferences({ screenState: { collection: { primaryTab: 'sigils' } } }); setScreen('collection') } },
        ] },
      ],
    })
  }

  return <ModalPortal open={open} onClose={onClose} backdropClassName="sigil-vault-backdrop" surfaceClassName="sigil-vault-modal" ariaLabel="Arcane Sigil Vault" ariaLabelledBy="sigil-vault-title">
    <header className="sigil-vault-header">
      <div><span className="eyebrow">EQUIPMENT · SIGIL MANAGEMENT</span><h2 id="sigil-vault-title">ARCANE SIGIL VAULT</h2><p>Manage the six channels engraved into your loadout.</p><div className="sigil-vault-metrics"><span>{equippedCount}/6 <small>EQUIPPED</small></span><span>{storedCount} <small>STORED</small></span><span>{dust.toLocaleString()} <small>DUST</small></span><span>+{cap} <small>GLOBAL CAP</small></span></div></div>
      <div className="sigil-vault-header-actions"><Button variant="secondary" onClick={openArtificing}>OPEN ARTIFICING</Button><GameTooltip content={<TooltipContent title="Close Sigil Vault" description="Return to your Equipment loadout." />}><button className="sigil-vault-close" type="button" aria-label="Close Sigil Vault" onClick={onClose}><X size={18} /></button></GameTooltip></div>
    </header>
    <div className="sigil-vault-body">
      <aside className="sigil-vault-array">
        <div className="sigil-vault-section-heading"><span className="eyebrow">LOADOUT</span><h3>ARCANE ARRAY</h3></div>
        <div className="sigil-vault-sockets">{([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((slot) => {
          const id = equipped[slot]
          return <SigilSocket key={slot} slot={slot} sigil={id ? storage[id] : undefined} storage={storage} equipped={equipped} selected={targetSlot === slot} compact onClick={() => chooseSlot(slot)} />
        })}</div>
        <div className="sigil-vault-array-summary"><span className="eyebrow">ACTIVE SET BONUSES</span><SigilSetSummary state={{ sigils: sigilState }} /><ActiveSigilTraits state={{ sigils: sigilState }} /></div>
      </aside>

      <section className="sigil-vault-storage" aria-label="Sigil storage">
        <div className="sigil-vault-section-heading"><div><span className="eyebrow">OWNED SIGILS · {stored.length} MATCHES</span><h3>SIGIL STORAGE</h3></div><span className="sigil-storage-cap">{Object.keys(storage).length} / {SIGIL_STORAGE_SOFT_CAP}</span></div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search Set, quality, stat, Trait..." ariaLabel="Search owned Sigils" />
        <div className="sigil-quality-chips" role="group" aria-label="Filter by Sigil quality">{([{ value: 'all', label: 'ALL' }, ...SIGIL_QUALITIES.map(({ id, label }) => ({ value: id, label: label.toUpperCase() }))] as const).map(({ value, label }) => <button key={value} type="button" aria-pressed={qualityFilter === value} className={`quality-chip ${qualityFilter === value ? 'active' : ''} ${value === 'all' ? '' : `quality-${value}`}`} onClick={() => setQualityFilter(value)}>{label}</button>)}</div>
        <div className="sigil-filter-row">
          <SelectMenu options={[{ value: 'all', label: 'All Sets' }, ...SIGIL_SET_IDS.map((id) => ({ value: id, label: SIGIL_SETS[id].name }))]} value={setFilter} onChange={(value) => setSetFilter(value as SigilSetId | 'all')} ariaLabel="Filter by Set" prefix="SET: " />
          <SelectMenu options={[{ value: 'all', label: 'All Tiers' }, ...TIER_OPTIONS]} value={String(tierFilter)} onChange={(value) => setTierFilter(value === 'all' ? 'all' : Number(value) as SigilTier)} ariaLabel="Filter by Tier" prefix="TIER: " />
          <SelectMenu options={[{ value: 'all', label: 'All Slots' }, ...SLOT_OPTIONS]} value={String(slotFilter)} onChange={(value) => setSlotFilter(value === 'all' ? 'all' : Number(value) as SigilSlot)} ariaLabel="Filter by Slot" prefix="SLOT: " />
          <SelectMenu options={[{ value: 'all', label: 'All States' }, ...(['equipped', 'stored', 'locked', 'unlocked'] as StateFilter[]).slice(1).map((value) => ({ value, label: titleCase(value) }))]} value={stateFilter} onChange={(value) => setStateFilter(value as StateFilter)} ariaLabel="Filter Sigil state" prefix="STATE: " />
          <SelectMenu options={[{ value: 'quality', label: 'Quality' }, { value: 'tier', label: 'Tier' }, { value: 'rank', label: 'Rank' }, { value: 'newest', label: 'Newest' }]} value={sortMode} onChange={(value) => setSortMode(value as SortMode)} ariaLabel="Sort Sigils" prefix="SORT: " />
        </div>
        {targetSlot !== null && <div className="sigil-target-banner"><span>CHOOSING FOR SLOT {getSigilSlotRoman(targetSlot)}</span><button type="button" onClick={clearTarget}>CLEAR SLOT TARGET</button></div>}
        {stored.length === 0 ? <div className="sigil-storage-empty"><Sparkles size={22} /><strong>{Object.keys(storage).length === 0 ? 'NO SIGILS STORED' : 'NO MATCHES'}</strong><p>{Object.keys(storage).length === 0 ? 'Sigils can drop from eligible Combat enemies.' : 'Clear filters or choose another Slot.'}</p>{targetSlot !== null && <Button variant="ghost" onClick={clearTarget}>SHOW ALL SIGILS</Button>}</div> : <div className="sigil-vault-card-grid">{stored.map((sigil) => {
          const isEquipped = equippedIds.has(sigil.instanceId)
          const count = Object.values(equipped).filter((id) => id && storage[id]?.setId === sigil.setId).length
          return <GameTooltip key={sigil.instanceId} block wide content={<SigilTooltipContent sigil={sigil} equipped={isEquipped} setCount={count} />}>
            <button ref={(element) => { if (element) cardRefs.current.set(sigil.instanceId, element); else cardRefs.current.delete(sigil.instanceId) }} type="button" className={`sigil-vault-card quality-${sigil.quality}${selectedId === sigil.instanceId ? ' selected' : ''}${isEquipped ? ' equipped' : ''}`} aria-pressed={selectedId === sigil.instanceId} onClick={() => chooseSigil(sigil)} onContextMenu={(event) => openSigilMenu(event, sigil, isEquipped)}>
              <span className="sigil-card-tier">T{sigil.tier}</span><SigilQualityBadge quality={sigil.quality} />
              <strong className="sigil-card-identity">{SIGIL_SETS[sigil.setId].name} {getSigilSlotRoman(sigil.slot)}</strong><span className="sigil-card-rank">+{sigil.rank}</span>
              <span className="sigil-card-main-stat">{SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label} <b>{formatSigilStatValue(sigil.mainStatId, resolveSigilStatsForInstance(sigil)[sigil.mainStatId] ?? 0, true)}</b></span>
              <span className="sigil-card-markers">{isEquipped && <i>IN ARRAY</i>}{sigil.locked && <LockKeyhole size={13} aria-label="Protected from salvage" />}</span>
            </button>
          </GameTooltip>
        })}</div>}
      </section>

      <SigilInspectorPanel sigil={selected} equipped={equipped} storage={storage} targetSlot={targetSlot} cap={cap} onEquip={equipSelected} onUnequip={unequipSelected} onToggleLock={toggleLock} onOpenArtificing={openArtificing} />
    </div>
  </ModalPortal>
}

function SigilInspectorPanel({ sigil, equipped, storage, targetSlot, cap, onEquip, onUnequip, onToggleLock, onOpenArtificing }: {
  sigil?: SigilInstance
  equipped: Record<SigilSlot, string | null>
  storage: Record<string, SigilInstance>
  targetSlot: SigilSlot | null
  cap: number
  onEquip: () => void
  onUnequip: () => void
  onToggleLock: () => void
  onOpenArtificing: () => void
}) {
  if (!sigil) return <aside className="sigil-vault-inspector"><div className="sigil-inspector-empty"><span className="sigil-inspector-rune">◈</span><strong>{targetSlot ? `SLOT ${getSigilSlotRoman(targetSlot)} IS EMPTY` : 'SELECT A SIGIL'}</strong><p>{targetSlot ? `Choose a Slot ${getSigilSlotRoman(targetSlot)} Sigil from Storage.` : 'Select an engraved channel or a stored Sigil to inspect its build impact.'}</p></div></aside>

  const isEquipped = Object.values(equipped).includes(sigil.instanceId)
  const target = targetSlot ?? sigil.slot
  const currentId = equipped[target]
  const current = currentId && currentId !== sigil.instanceId ? storage[currentId] : undefined
  const stats = resolveSigilStatsForInstance(sigil)
  const maxRank = SIGIL_QUALITIES.find((quality) => quality.id === sigil.quality)?.maxRank ?? 0
  const comparison = current ? buildComparison(current, sigil, equipped, storage) : null
  const canEquip = !isEquipped && sigil.slot === target

  return <aside className={`sigil-vault-inspector quality-${sigil.quality}`}>
    <div className="sigil-inspector-scroll">
      <div className="sigil-inspector-identity"><span className="eyebrow">T{sigil.tier} · {sigil.quality.toUpperCase()}</span><h3>{SIGIL_SETS[sigil.setId].name.toUpperCase()} SIGIL {getSigilSlotRoman(sigil.slot)}</h3><strong>+{sigil.rank} <small>/ +{maxRank}</small></strong></div>
      {current && <div className="sigil-current-replacement"><span>CURRENT IN SLOT {getSigilSlotRoman(target)}</span><strong>{SIGIL_SETS[current.setId].name} · T{current.tier} {current.quality} +{current.rank}</strong></div>}
      <InspectorStatSection title="MAIN STAT"><div className="sigil-inspector-stat"><span>{SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label}</span><b>{formatSigilStatValue(sigil.mainStatId, stats[sigil.mainStatId] ?? 0, true)}</b></div></InspectorStatSection>
      <InspectorStatSection title="SECONDARIES">{sigil.secondaries.length ? sigil.secondaries.map(({ statId }) => <div className="sigil-inspector-stat" key={statId}><span>{SIGIL_STAT_DEFINITIONS[statId].label}</span><b>{formatSigilStatValue(statId, stats[statId] ?? 0, true)}</b></div>) : <small className="sigil-inspector-muted">Starting Secondary rolls unlock at enhancement milestones.</small>}</InspectorStatSection>
      <InspectorStatSection title="TRAITS">{sigil.traitIds.length ? sigil.traitIds.map((traitId) => <article className="sigil-trait-detail" key={traitId}><strong>{SIGIL_TRAITS[traitId].name}{SIGIL_TRAITS[traitId].unique ? <small>UNIQUE</small> : null}</strong><p>{SIGIL_TRAITS[traitId].description}</p></article>) : <small className="sigil-inspector-muted">No Traits unlocked on this Sigil.</small>}</InspectorStatSection>
      <InspectorStatSection title="SET BONUS"><div className="sigil-set-effect"><strong>{SIGIL_SETS[sigil.setId].name} · {Object.values(equipped).filter((id) => id && storage[id]?.setId === sigil.setId).length}/{SIGIL_SETS[sigil.setId].piecesRequired}</strong><p>{SIGIL_SETS[sigil.setId].description}</p></div></InspectorStatSection>
      <InspectorStatSection title="ROLL HISTORY"><div className="sigil-roll-history">{sigil.secondaries.flatMap((secondary) => secondary.rolls.filter((roll) => roll.rank === 0).map((roll, index) => <span key={`${secondary.statId}-start-${index}`}><b>+0</b> Starting Secondary · {SIGIL_STAT_DEFINITIONS[secondary.statId].label} {formatSigilStatValue(secondary.statId, resolveSigilStatsForInstance({ ...sigil, secondaries: [{ ...secondary, rolls: [roll] }] })[secondary.statId] ?? 0, true)}</span>))}{sigil.rollHistory.map((entry, index) => <span key={`${entry.rank}-${index}`}><b>+{entry.rank}</b> {entry.kind === 'trait' ? <>Trait Awakened · {entry.traitId ? SIGIL_TRAITS[entry.traitId].name : 'New Trait'}</> : <>{entry.kind === 'new-secondary' ? 'New Secondary · ' : ''}{entry.statId ? SIGIL_STAT_DEFINITIONS[entry.statId].label : 'Secondary roll'}</>}</span>)}{!sigil.secondaries.some((secondary) => secondary.rolls.some((roll) => roll.rank === 0)) && sigil.rollHistory.length === 0 && <small>No enhancement milestones reached.</small>}</div></InspectorStatSection>
      {comparison && <InspectorStatSection title="CURRENT SLOT COMPARISON"><div className="sigil-comparison-identity"><span>{SIGIL_SETS[current!.setId].name} +{current!.rank}</span><span>{SIGIL_SETS[sigil.setId].name} +{sigil.rank}</span></div><div className="sigil-comparison-rows">{comparison.stats.map((row) => <div className="sigil-comparison-row" key={row.statId}><span>{SIGIL_STAT_DEFINITIONS[row.statId].label}</span><small>{formatSigilStatValue(row.statId, row.current)}</small><small>{formatSigilStatValue(row.statId, row.next)}</small><b className={row.delta >= 0 ? 'positive' : 'negative'}>{formatSigilStatValue(row.statId, row.delta, true)}</b></div>)}</div><div className="sigil-comparison-sets">{comparison.sets.map((set) => <span key={set.id} className={set.before !== set.after ? 'changed' : ''}>{SIGIL_SETS[set.id].name}: {set.before} → {set.after} {set.beforeActive !== set.afterActive ? (set.afterActive ? 'ACTIVE' : 'LOST') : ''}</span>)}{comparison.traits.map((trait) => <span key={trait} className="trait-change">{trait.startsWith('+') ? '+' : '−'} {SIGIL_TRAITS[trait.slice(1) as keyof typeof SIGIL_TRAITS]?.name}</span>)}</div></InspectorStatSection>}
      {!current && !isEquipped && targetSlot !== null && sigil.slot !== targetSlot && <p className="sigil-inspector-warning">This is a Slot {getSigilSlotRoman(sigil.slot)} Sigil. Choose a compatible Slot {getSigilSlotRoman(targetSlot)} candidate.</p>}
    </div>
    <footer className="sigil-inspector-actions">
      {isEquipped ? <Button variant="secondary" onClick={onUnequip}>UNEQUIP</Button> : <Button variant="primary" disabled={!canEquip} tooltip={!canEquip ? <TooltipContent title="Wrong channel" description={`This Sigil fits Slot ${getSigilSlotRoman(sigil.slot)} only.`} /> : undefined} onClick={onEquip}>{current ? `REPLACE SLOT ${getSigilSlotRoman(target)}` : `EQUIP TO SLOT ${getSigilSlotRoman(target)}`}</Button>}
      <GameTooltip content={<TooltipContent title={sigil.locked ? 'Unlock Sigil' : 'Protect from salvage'} description="Locking protects a Sigil from accidental salvage. Locked Sigils can still be equipped and unequipped." />}><Button variant="ghost" icon onClick={onToggleLock} ariaLabel={sigil.locked ? 'Unlock Sigil' : 'Lock Sigil'}>{sigil.locked ? <Unlock size={16} /> : <LockKeyhole size={16} />}</Button></GameTooltip>
      <GameTooltip content={<TooltipContent title="Open in Artificing" description="Enhance this Sigil or adjust Sigil crafting and refinement settings." />}><Button variant="ghost" onClick={onOpenArtificing}>ARTIFICING</Button></GameTooltip>
    </footer>
    {sigil.rank < maxRank && sigil.rank < cap && <div className="sigil-next-enhancement"><Sparkles size={13} /> NEXT ENHANCEMENT · {getSigilEnhancementCost(sigil, sigil.rank + 1).toLocaleString()} DUST</div>}
  </aside>
}

function InspectorStatSection({ title, children }: { title: string; children: import('react').ReactNode }) { return <section className="sigil-inspector-section"><span className="eyebrow">{title}</span>{children}</section> }

function resolveInitialSigil(instanceId: string | null, slot: SigilSlot | null, storage: Record<string, SigilInstance>, equipped: Record<SigilSlot, string | null>) {
  if (instanceId && storage[instanceId]) return instanceId
  if (slot !== null && equipped[slot] && storage[equipped[slot]!]) return equipped[slot]
  return ([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((position) => equipped[position]).find((id) => Boolean(id && storage[id])) ?? Object.keys(storage).sort((a, b) => getSigilSequence(b) - getSigilSequence(a))[0] ?? null
}

function getSigilSequence(sigil: SigilInstance | string) { const id = typeof sigil === 'string' ? sigil : sigil.instanceId; return Number(/sigil:(\d+)/.exec(id)?.[1] ?? 0) }
function titleCase(value: string) { return value.slice(0, 1).toUpperCase() + value.slice(1) }

function buildComparison(current: SigilInstance, next: SigilInstance, equipped: Record<SigilSlot, string | null>, storage: Record<string, SigilInstance>) {
  const currentStats = resolveSigilStatsForInstance(current)
  const nextStats = resolveSigilStatsForInstance(next)
  const stats = [...new Set([...Object.keys(currentStats), ...Object.keys(nextStats)])].map((statId) => ({ statId: statId as SigilStatId, current: currentStats[statId as SigilStatId] ?? 0, next: nextStats[statId as SigilStatId] ?? 0, delta: (nextStats[statId as SigilStatId] ?? 0) - (currentStats[statId as SigilStatId] ?? 0) })).filter((row) => row.delta !== 0)
  const beforeCounts: Partial<Record<SigilSetId, number>> = {}
  Object.values(equipped).forEach((id) => { const item = id ? storage[id] : undefined; if (item) beforeCounts[item.setId] = (beforeCounts[item.setId] ?? 0) + 1 })
  const afterCounts = { ...beforeCounts }
  afterCounts[current.setId] = Math.max(0, (afterCounts[current.setId] ?? 0) - 1)
  afterCounts[next.setId] = (afterCounts[next.setId] ?? 0) + 1
  const setIds = [...new Set([current.setId, next.setId])]
  const sets = setIds.map((id) => ({ id, before: beforeCounts[id] ?? 0, after: afterCounts[id] ?? 0, beforeActive: (beforeCounts[id] ?? 0) >= SIGIL_SETS[id].piecesRequired, afterActive: (afterCounts[id] ?? 0) >= SIGIL_SETS[id].piecesRequired }))
  return { stats, sets, traits: [...next.traitIds.filter((trait) => !current.traitIds.includes(trait)).map((trait) => `+${trait}`), ...current.traitIds.filter((trait) => !next.traitIds.includes(trait)).map((trait) => `-${trait}`)] }
}
