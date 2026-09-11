import { Circle, Crown, Gem, Shield, Shirt, Sparkles, WandSparkles, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Card, EquipmentCombatDetails, GameTooltip, GameValue, SearchInput, SelectMenu, Status } from '../../components/ui'
import { EquipmentMetadata, ItemTooltip } from '../../components/ui/item'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import { formatPlayerEquipmentTier } from '../../game/content/items/equipmentBalance'
import { getArtifactDefinition } from '../../game/content/artifacts/artifacts'
import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_POSITION_LABELS, EQUIPMENT_POSITIONS, getEquippedCount, getItemPositions } from '../../game/core/equipment'
import type { ArtifactId, EquipmentItemSlot, EquipmentPosition, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { getEquipmentCopyAvailability, getEquipmentKeyChanges, getEquipmentPreview, getEquipmentPrimarySummary, getEquipmentSearchText, getEquipmentStatSnapshot } from '../../game/presentation/equipment/equipmentReadModel'
import { formatEquipmentStat, getEquipmentStatDescription, getEquipmentStatLabel } from '../../game/presentation/equipment/equipmentStatPresentation'
import { getAdaptiveEquipmentLayout } from './equipmentLayout'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../ui/context-menu/itemContextActions'
import { getItemSources } from '../../game/content/contentRelations'
import { useNavigationIntent, setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { isArtifactItem, getArtifactEffectiveStats, getArtifactLevel, getArtifactTotalPoints, getArtifactAvailablePoints } from '../../game/systems/artifacts/artifactProgression'
import { ArtifactPathModal } from '../../components/artifacts/ArtifactPathModal'

type ArmoryFilter = 'all' | EquipmentItemSlot
type ArmorySort = 'tier' | 'name' | 'owned'
type EquipmentStatRowData = { key: string; value: number }

const ARMORY_FILTERS: { id: ArmoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL' }, { id: 'weapon', label: 'WEAPON' }, { id: 'armor', label: 'ARMOR' }, { id: 'helmet', label: 'HELMET' }, { id: 'cape', label: 'CAPE' }, { id: 'amulet', label: 'AMULET' }, { id: 'earring', label: 'EARRING' }, { id: 'ring', label: 'RINGS' },
]
const EMPTY_FILTER_LABELS: Record<ArmoryFilter, string> = { all: 'EQUIPMENT', weapon: 'WEAPONS', armor: 'ARMOR', helmet: 'HELMETS', cape: 'CAPES', amulet: 'AMULETS', earring: 'EARRINGS', ring: 'RINGS' }
const LOADOUT_VISUAL_ORDER: readonly EquipmentPosition[] = ['cape', 'helmet', 'earring', 'amulet', 'weapon', 'armor', 'ring1', 'ring2']
const EMPTY_SLOT_ICONS: Record<EquipmentPosition, LucideIcon> = { weapon: WandSparkles, armor: Shirt, helmet: Crown, cape: Shield, amulet: Gem, earring: Sparkles, ring1: Circle, ring2: Circle }
const ARMORY_SORT_OPTIONS = [{ value: 'tier', label: 'Tier' }, { value: 'name', label: 'Name' }, { value: 'owned', label: 'Owned' }] as const
const SLOT_TOOLTIP_COPY: Record<EquipmentPosition, { title: string; description: ReactNode }> = {
  weapon: { title: 'WEAPON', description: <>Your active combat implement.<br />Staffs, wands, magical focuses, and future weapon configurations all use this single slot.</> },
  armor: { title: 'ARMOR', description: <>Body equipment including robes and future plated magical armor.</> },
  helmet: { title: 'HELMET', description: <>Head equipment such as wizard hats, hoods, circlets, or helmets.</> },
  cape: { title: 'CAPE', description: <>Back equipment such as magical cloaks and capes.<br />Cape effects depend on the individual item.</> },
  amulet: { title: 'AMULET', description: <>Neck equipment such as magical amulets and charms.</> },
  earring: { title: 'EARRING', description: <>One accessory slot for magical earrings.</> },
  ring1: { title: 'RING', description: <>Ring accessory slot.<br />The same Ring cannot occupy both Ring slots.</> },
  ring2: { title: 'RING', description: <>Ring accessory slot.<br />The same Ring cannot occupy both Ring slots.</> },
}

export function EquipmentScreenV2() {
  const navigationIntent = useNavigationIntent()
  const uiPreferences = useUiPreferences()
  const { openContextMenu } = useGameContextMenu()
  const equipment = useGameStore((state) => state.equipment)
  const inventory = useGameStore((state) => state.inventory)
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const debug = useGameStore((state) => state.debug)
  const recentAcquisitions = useGameStore((state) => state.recentAcquisitions)
  const equipItem = useGameStore((state) => state.equipItem)
  const unequipItem = useGameStore((state) => state.unequipItem)
  const [selectedPosition, setSelectedPosition] = useState<EquipmentPosition>(() => navigationIntent.equipmentPosition ?? 'weapon')
  const [filter, setFilter] = useState<ArmoryFilter>('all')
  const [search, setSearch] = useState('')
  const initialNavigationItemId = navigationIntent.equipmentItemId && ITEMS[navigationIntent.equipmentItemId] ? navigationIntent.equipmentItemId : null
  const initialWeaponId = equipment.weapon && ITEMS[equipment.weapon] ? equipment.weapon : null
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(() => initialNavigationItemId ?? initialWeaponId)
  const [ringReplacement, setRingReplacement] = useState<EquipmentPosition | null>(null)
  const [sortMode, setSortMode] = useState<ArmorySort>('tier')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [filterPulseKey, setFilterPulseKey] = useState(0)
  const [loadoutContentHeight, setLoadoutContentHeight] = useState(0)
  const [statsContentHeight, setStatsContentHeight] = useState(0)
  const stateForPreview = { player, progress, activities, debug, equipment, inventory, artifactProgress }
  const ownedEquipment = useMemo(() => (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment' && (inventory[id] ?? 0) > 0), [inventory])
  const equipmentCounts = useMemo(() => Object.fromEntries(ARMORY_FILTERS.map((entry) => [entry.id, entry.id === 'all' ? ownedEquipment.length : ownedEquipment.filter((id) => ITEMS[id].equipmentSlot === entry.id).length])) as Record<ArmoryFilter, number>, [ownedEquipment])
  const visibleEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = ownedEquipment.filter((id) => {
      const item = ITEMS[id]
      const matchesSearch = !query || getEquipmentSearchText(id, stateForPreview).includes(query)
      const matchesAvailability = !availableOnly || getEquipmentCopyAvailability({ equipment, inventory }, id).available > 0
      return matchesSearch && matchesAvailability && (filter === 'all' || item.equipmentSlot === filter)
    })
    return filtered.sort((left, right) => {
      if (sortMode === 'name') return ITEMS[left].name.localeCompare(ITEMS[right].name)
      if (sortMode === 'owned') return (inventory[right] ?? 0) - (inventory[left] ?? 0) || ITEMS[left].name.localeCompare(ITEMS[right].name)
      return (ITEMS[right].equipmentTier ?? 0) - (ITEMS[left].equipmentTier ?? 0) || ITEMS[left].name.localeCompare(ITEMS[right].name)
    })
  }, [ownedEquipment, filter, search, availableOnly, sortMode, equipment, inventory, artifactProgress])
  const selectedItem = selectedItemId ? ITEMS[selectedItemId] : null
  const selectedStats = selectedItemId && selectedItem && isArtifactItem(selectedItemId) ? getArtifactEffectiveStats(stateForPreview, selectedItemId) : selectedItem?.stats
  const armoryScrollRef = useRef<HTMLDivElement>(null)
  const inspectorScrollRef = useRef<HTMLDivElement>(null)
  const targetPosition = selectedItem?.equipmentSlot === 'ring'
    ? ringReplacement ?? (selectedPosition === 'ring1' || selectedPosition === 'ring2' ? selectedPosition : equipment.ring1 ? equipment.ring2 ? undefined : 'ring2' : 'ring1')
    : selectedPosition
  const preview = selectedItemId ? getEquipmentPreview(stateForPreview, selectedItemId, targetPosition) : null
  const inspectorTargetPosition = preview?.position ?? targetPosition
  const copyAvailability = selectedItemId ? getEquipmentCopyAvailability({ equipment, inventory }, selectedItemId) : null
  const statSnapshot = getEquipmentStatSnapshot(stateForPreview, equipment)
  const equippedCount = getEquippedCount({ equipment })
  const [artifactPath, setArtifactPath] = useState<ArtifactId | null>(null)
  const equippedPositions = selectedItemId ? getItemPositions(selectedItemId).filter((position) => equipment[position] === selectedItemId) : []
  const ringNeedsChoice = selectedItem?.equipmentSlot === 'ring' && !ringReplacement && Boolean(equipment.ring1 && equipment.ring2) && selectedPosition !== 'ring1' && selectedPosition !== 'ring2'
  const reportLoadoutContentHeight = useCallback((height: number) => setLoadoutContentHeight((current) => current === height ? current : height), [])
  const reportStatsContentHeight = useCallback((height: number) => setStatsContentHeight((current) => current === height ? current : height), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveEquipmentLayout>[0]) => getAdaptiveEquipmentLayout(layout, { requiredLoadoutContentHeight: loadoutContentHeight, requiredStatsContentHeight: statsContentHeight }), [loadoutContentHeight, statsContentHeight])
  useSmartScrollState(armoryScrollRef, { dependencies: [visibleEquipment.join('|'), filter, search, availableOnly, sortMode] })
  useSmartScrollState(inspectorScrollRef, { resetKey: selectedItemId })

  useEffect(() => {
    if (selectedItemId && !ITEMS[selectedItemId]) setSelectedItemId(ownedEquipment[0] ?? null)
    else if (selectedItemId && !ownedEquipment.includes(selectedItemId) && selectedItemId !== navigationIntent.equipmentItemId) setSelectedItemId(ownedEquipment[0] ?? null)
  }, [ownedEquipment, selectedItemId, navigationIntent.equipmentItemId])

  useEffect(() => {
    const itemId = navigationIntent.equipmentItemId
    if (!itemId) return
    if (!ITEMS[itemId]) { setNavigationIntent({ equipmentItemId: null }); return }
    setSelectedItemId(itemId)
    if (navigationIntent.equipmentPosition) setSelectedPosition(navigationIntent.equipmentPosition)
  }, [navigationIntent.equipmentItemId, navigationIntent.equipmentPosition])

  const selectSlot = (position: EquipmentPosition) => {
    setSelectedPosition(position)
    setNavigationIntent({ equipmentPosition: position, equipmentItemId: equipment[position] })
    setRingReplacement(position === 'ring1' || position === 'ring2' ? position : null)
    const nextFilter = position === 'ring1' || position === 'ring2' ? 'ring' : position as ArmoryFilter
    if (nextFilter !== filter) setFilterPulseKey((key) => key + 1)
    setFilter(nextFilter)
    if (equipment[position]) setSelectedItemId(equipment[position])
  }

  const selectArmoryItem = (itemId: ItemId) => {
    setSelectedItemId(itemId)
    setNavigationIntent({ equipmentItemId: itemId })
    const slot = ITEMS[itemId].equipmentSlot
    if (slot === 'ring') {
      if (selectedPosition !== 'ring1' && selectedPosition !== 'ring2') setRingReplacement(equipment.ring1 ? equipment.ring2 ? null : 'ring2' : 'ring1')
    } else if (slot) {
      setSelectedPosition(slot)
      setRingReplacement(null)
    }
  }

  const equipFromArmoryDoubleClick = (itemId: ItemId) => {
    const item = ITEMS[itemId]
    const target = item.equipmentSlot === 'ring'
      ? ringReplacement ?? (selectedPosition === 'ring1' || selectedPosition === 'ring2' ? selectedPosition : undefined)
      : item.equipmentSlot as EquipmentPosition | undefined
    const candidate = getEquipmentPreview(stateForPreview, itemId, target)
    selectArmoryItem(itemId)
    if (candidate.compatible && candidate.position) equipItem(itemId, candidate.position)
  }

  const openEquipmentMenu = (itemId: ItemId, positions: EquipmentPosition[], x: number, y: number, anchor?: HTMLElement, compare = true) => {
    const item = ITEMS[itemId]
    const equipped = positions.length > 0
    const equipTargets = !equipped ? item.equipmentSlot === 'ring'
      ? (['ring1', 'ring2'] as const).map((position) => ({ position, preview: getEquipmentPreview(stateForPreview, itemId, position) })).filter((entry) => entry.preview.compatible)
      : item.equipmentSlot ? [{ position: item.equipmentSlot as EquipmentPosition, preview: getEquipmentPreview(stateForPreview, itemId) }].filter((entry) => entry.preview.compatible) : []
      : []
    const quickEquipOptions = equipTargets.length > 1 ? equipTargets.map(({ position }) => ({ label: `Equip to ${position === 'ring1' ? 'Ring 1' : 'Ring 2'}`, onSelect: () => { selectArmoryItem(itemId); equipItem(itemId, position) } })) : undefined
    const quickUnequipOptions = positions.map((position) => ({ label: `Unequip ${EQUIPMENT_POSITION_LABELS[position]}`, onSelect: () => { selectSlot(position); unequipItem(position) } }))
    const artificingOutput = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail === 'Artificing output')
    const transmutationOutput = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail === 'Transmutation output')
    const selectForComparison = () => {
      setSelectedItemId(itemId)
      if (positions.length === 1) {
        setSelectedPosition(positions[0])
        setRingReplacement(positions[0] === 'ring1' || positions[0] === 'ring2' ? positions[0] : null)
      } else selectArmoryItem(itemId)
      setNavigationIntent({ equipmentItemId: itemId, equipmentPosition: positions.length === 1 ? positions[0] : null })
    }
    openContextMenu({ x, y, anchor, header: { title: item.name, meta: `EQUIPMENT · OWNED ${inventory[itemId] ?? 0}` }, sections: buildItemContextSections({
      itemId,
      owned: inventory[itemId] ?? 0,
      equipped,
      protectedItem: equipped,
      tracked: uiPreferences.trackedItemId === itemId,
      source: 'reference',
      onQuickEquip: equipTargets.length === 1 ? () => { selectArmoryItem(itemId); equipItem(itemId, equipTargets[0].position) } : undefined,
      quickEquipOptions,
      onQuickUnequip: quickUnequipOptions.length === 1 ? quickUnequipOptions[0].onSelect : undefined,
      quickUnequipOptions: quickUnequipOptions.length > 1 ? quickUnequipOptions : undefined,
      onCompare: compare ? selectForComparison : undefined,
      onOpenArtifactPath: isArtifactItem(itemId) ? () => setArtifactPath(itemId) : undefined,
      onOpenInventory: () => { setNavigationIntent({ inventoryItemId: itemId }); useGameStore.getState().setScreen('inventory') },
      onOpenArtificing: artificingOutput ? () => { setNavigationIntent({ artificingRecipeId: artificingOutput.id as never }); useGameStore.getState().setScreen('tower-artificing') } : undefined,
      onOpenTransmutation: transmutationOutput ? () => { setNavigationIntent({ transmutationRecipeId: transmutationOutput.id as never }); useGameStore.getState().setScreen('tower-transmutation') } : undefined,
      onTrack: () => setUiPreferences({ trackedItemId: uiPreferences.trackedItemId === itemId ? null : itemId }),
    }) })
  }

  const clearArmoryFilters = () => { setSearch(''); setFilter('all'); setAvailableOnly(false) }
  const openArtificing = () => { setNavigationIntent({ artificingRecipeId: null }); useGameStore.getState().setScreen('tower-artificing') }
  const equipDisabledReason = !preview ? 'Select equipment to preview.' : preview.reason ?? (ringNeedsChoice ? 'Choose Ring 1 or Ring 2.' : equippedPositions.length > 0 ? 'Already equipped.' : null)
  const keyChanges = preview?.preview ? getEquipmentKeyChanges(preview.impact) : []

  const loadout = <MeasuredEquipmentCard title="WIZARD LOADOUT" action={<Status tone="success">{equippedCount} / {EQUIPMENT_POSITIONS.length} EQUIPPED</Status>} onHeightChange={reportLoadoutContentHeight}>
    <div className="equipment-loadout-board">
      {LOADOUT_VISUAL_ORDER.map((position) => {
        const itemId = equipment[position]
        const item = itemId ? ITEMS[itemId] : null
        const emptyCopy = position === 'ring1' || position === 'ring2' ? 'Select Ring' : `Select ${EQUIPMENT_POSITION_LABELS[position]}`
        const tooltip = SLOT_TOOLTIP_COPY[position]
        const SlotGhostIcon = EMPTY_SLOT_ICONS[position]
        return <div className="equipment-slot-grid-item" data-position={position} key={position}>
          <EquipmentSlotTooltip itemId={itemId} owned={itemId ? inventory[itemId] ?? 0 : 0} tooltip={tooltip}>
            <div className={`equipment-slot-card ${item ? 'is-equipped' : 'is-empty'} ${selectedPosition === position ? 'selected' : ''}`} data-position={position} role="button" tabIndex={0} style={item ? { '--item-color': item.color } as CSSProperties : undefined} onClick={() => selectSlot(position)} onContextMenu={(event) => { if (!itemId) return; event.preventDefault(); event.stopPropagation(); openEquipmentMenu(itemId, [position], event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSlot(position) } }}>
              <div className="equipment-slot-card-head"><span>{EQUIPMENT_POSITION_LABELS[position]}</span><span className="equipment-slot-card-meta">{item && <span className="equipment-tier-badge">{formatPlayerEquipmentTier(item.equipmentTier ?? 1)}</span>}{item && isArtifactItem(item.id) && <span className="equipment-level-chip">L{getArtifactLevel({ artifactProgress }, item.id)}/{getArtifactDefinition(item.id)?.maxLevel ?? 10}</span>}</span></div>
              {item ? <div className="equipment-slot-card-item"><span className="equipment-slot-icon" style={{ color: item.color }}>{item.icon}</span><span className="equipment-slot-card-copy"><strong>{item.name}</strong></span></div> : <div className="equipment-slot-empty"><SlotGhostIcon size={27} strokeWidth={1.35} aria-hidden="true" /><strong>EMPTY SLOT</strong><small>{emptyCopy}</small></div>}
            </div>
          </EquipmentSlotTooltip>
        </div>
      })}
    </div>
    <p className="equipment-loadout-note">Select a slot to filter compatible equipment.</p>
  </MeasuredEquipmentCard>

  const statsPanel = <MeasuredEquipmentCard title="WIZARD STATS" action={<Sparkles size={16} color="var(--gold)" />} onHeightChange={reportStatsContentHeight}>
    <div className="equipment-stat-groups">
      <StatGroup title="CORE" rows={[{ key: 'maxHealth', value: statSnapshot.maxHealth }, { key: 'healthRegen', value: statSnapshot.healthRegen }, { key: 'maxMana', value: statSnapshot.maxMana }, { key: 'maxFocus', value: statSnapshot.maxFocus }, { key: 'manaRegen', value: statSnapshot.manaRegen }]} />
      <StatGroup title="OFFENSE" basicAttackIntervalMs={statSnapshot.basicAttackIntervalMs} rows={[{ key: 'spellPower', value: statSnapshot.spellPower }, { key: 'basicDamage', value: statSnapshot.basicDamage }, { key: 'basicAttackSpeedMultiplier', value: statSnapshot.basicAttackSpeedMultiplier }, { key: 'critChance', value: statSnapshot.critChance }, { key: 'critDamageMultiplier', value: statSnapshot.critDamageMultiplier }, ...(statSnapshot.fireSpellDamage ? [{ key: 'fireSpellDamage', value: statSnapshot.fireSpellDamage }] : []), ...(statSnapshot.airSpellDamage ? [{ key: 'airSpellDamage', value: statSnapshot.airSpellDamage }] : [])]} />
      <StatGroup title="DEFENSE" rows={[{ key: 'defense', value: statSnapshot.defense }, { key: 'damageReduction', value: statSnapshot.damageReduction }, ...(statSnapshot.blockChance ? [{ key: 'blockChance', value: statSnapshot.blockChance }] : []), ...(statSnapshot.barrierReceivedFlat ? [{ key: 'barrierReceivedFlat', value: statSnapshot.barrierReceivedFlat }] : []), ...Object.entries(statSnapshot.resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([type, value]) => ({ key: `resistance-${type}`, value: value ?? 0 }))]} />
      <StatGroup title="UTILITY" rows={[...(statSnapshot.cooldownRecovery !== 1 ? [{ key: 'cooldownRecovery', value: statSnapshot.cooldownRecovery }] : []), ...(statSnapshot.healingDoneBonus ? [{ key: 'healingDoneBonus', value: statSnapshot.healingDoneBonus }] : []), ...(statSnapshot.barrierPowerBonus ? [{ key: 'barrierPowerBonus', value: statSnapshot.barrierPowerBonus }] : []), ...(statSnapshot.waterBarrierPower ? [{ key: 'waterBarrierPower', value: statSnapshot.waterBarrierPower }] : []), ...(statSnapshot.manaCostReduction ? [{ key: 'manaCostReduction', value: statSnapshot.manaCostReduction }] : []), ...(statSnapshot.focusEfficiency ? [{ key: 'focusEfficiency', value: statSnapshot.focusEfficiency }] : [])]} />
      <StatGroup title="PERIODIC / STATUS" rows={[...(statSnapshot.damageOverTimeBonus ? [{ key: 'damageOverTimeBonus', value: statSnapshot.damageOverTimeBonus }] : []), ...(statSnapshot.statusDurationBonus ? [{ key: 'statusDurationBonus', value: statSnapshot.statusDurationBonus }] : []), ...(statSnapshot.negativeStatusDurationReceived ? [{ key: 'negativeStatusDurationReceived', value: statSnapshot.negativeStatusDurationReceived }] : [])]} />
    </div>
    <GameTooltip block content={<TooltipContent title="Reserved equipment" description="Equipped copies stay reserved and cannot be spent by Research, Transmutation, Guild donation, Sell, or Destroy." />}><div className="equipment-note"><Shield size={15} /><span>Equipped copies reserved from other actions.</span></div></GameTooltip>
  </MeasuredEquipmentCard>

  const armory = <Card title="ARMORY" className="equipment-armory-panel" action={<span className="equipment-armory-count">{ownedEquipment.length} OWNED TYPES</span>}>
    <label className="equipment-search"><SearchInput value={search} onChange={setSearch} placeholder="Search name, stat, or build tag..." ariaLabel="Search equipment" /></label>
    <div className="equipment-armory-controls"><SelectMenu options={ARMORY_SORT_OPTIONS} value={sortMode} onChange={setSortMode} ariaLabel="Armory sort" prefix="SORT: " /><label className="equipment-availability-toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> <span>AVAILABLE ONLY</span></label></div>
    <div key={filterPulseKey} className={`equipment-filter-bar${filterPulseKey ? ' equipment-filter-attention' : ''}`} role="tablist" aria-label="Equipment filters">{ARMORY_FILTERS.map((entry) => <button type="button" role="tab" aria-label={entry.label} aria-selected={filter === entry.id} className={filter === entry.id ? 'active' : ''} key={entry.id} onClick={() => { setFilter(entry.id); if (entry.id !== 'all' && entry.id !== 'ring') setSelectedPosition(entry.id) }}>{entry.label} <span>{equipmentCounts[entry.id]}</span></button>)}</div>

    {visibleEquipment.length === 0 ? ownedEquipment.length === 0 ? <div className="equipment-empty-armory"><strong>NO EQUIPMENT OWNED</strong><small>Craft your first gear in Artificing.</small><Button variant="secondary" onClick={openArtificing}>OPEN ARTIFICING</Button></div> : <div className="equipment-empty-armory"><strong>NO ITEMS MATCH CURRENT FILTERS</strong><small>Try another name, stat, build tag, or availability setting.</small><Button variant="ghost" onClick={clearArmoryFilters}>CLEAR FILTERS</Button></div> : <div ref={armoryScrollRef} className="equipment-armory-grid smart-scroll-region">{visibleEquipment.map((id) => { const item = ITEMS[id]; const selected = id === selectedItemId; const equipped = getItemPositions(id).some((position) => equipment[position] === id); const isNew = recentAcquisitions.some((entry) => entry.itemId === id && entry.isNew); const tracked = uiPreferences.trackedItemId === id; const isArtifact = isArtifactItem(id); const tierLabel = item.equipmentTier !== undefined ? formatPlayerEquipmentTier(item.equipmentTier) : null; const armoryMeta = tierLabel === null ? null : isArtifact ? `${tierLabel} · L${getArtifactLevel({ artifactProgress }, id)}/${getArtifactDefinition(id)?.maxLevel ?? 10}` : tierLabel; return <ItemTooltip itemId={id} owned={inventory[id] ?? 0} equipped={equipped} key={id}><button type="button" data-item-id={id} aria-label={`${item.name}, owned ${inventory[id] ?? 0}${equipped ? ', equipped' : ''}${isNew ? ', new' : ''}${tracked ? ', tracked' : ''}`} className={`equipment-armory-card ${selected ? 'selected' : ''} ${equipped ? 'equipped' : ''}`} onClick={() => selectArmoryItem(id)} onDoubleClick={() => equipFromArmoryDoubleClick(id)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openEquipmentMenu(id, getItemPositions(id).filter((position) => equipment[position] === id), event.clientX, event.clientY, event.currentTarget) }}><span className="equipment-armory-icon" style={{ color: item.color }}>{item.icon}</span><span className="equipment-armory-copy"><span className="equipment-armory-name-line"><strong>{item.name}</strong><span className="equipment-armory-meta-line">{armoryMeta && <span className={isArtifact ? 'equipment-armory-artifact-meta' : 'equipment-tier-badge'}>{armoryMeta}</span>}</span></span><small className="equipment-armory-summary">{getEquipmentPrimarySummary(id, stateForPreview) ?? 'Ready'}</small></span><span className="equipment-armory-markers">{equipped && <Status tone="success">EQUIPPED</Status>}{isNew && <span className="equipment-armory-marker new">NEW</span>}{tracked && <span className="equipment-armory-marker tracked" aria-label="Tracked item">TRACKED</span>}</span></button></ItemTooltip> })}</div>}
  </Card>

  const inspector = <Card title="GEAR INSPECTOR" className="equipment-inspector"><InspectorTransition identity={selectedItemId} accent={selectedItem?.color} fill><div ref={inspectorScrollRef} className="equipment-inspector-content smart-scroll-region">
    {!selectedItem ? <div className="equipment-inspector-empty"><strong>SELECT GEAR</strong><small>Choose an item from the Armory to compare its real loadout impact.</small></div> : <>
      <div className="equipment-inspector-hero"><ItemTooltip itemId={selectedItemId!} owned={inventory[selectedItemId!] ?? 0} equipped={equippedPositions.length > 0}><span className="equipment-inspector-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span></ItemTooltip><div><div className="eyebrow">{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</div><h3>{selectedItem.name}</h3><EquipmentMetadata item={selectedItem} /><p>{selectedItem.description}</p></div></div>
      {isArtifactItem(selectedItemId!) && <div className="equipment-inspector-meta"><strong>T{getArtifactDefinition(selectedItemId!)?.tier ?? 1} ARTIFACT · LEVEL {getArtifactLevel({ artifactProgress }, selectedItemId!)} / 10</strong><span>ARTIFACT POINTS {getArtifactAvailablePoints({ artifactProgress }, selectedItemId!)} / {getArtifactTotalPoints({ artifactProgress }, selectedItemId!)}</span><Button variant="secondary" onClick={() => setArtifactPath(selectedItemId)}>ARTIFACT PATH</Button></div>}
      {copyAvailability && <GameTooltip block content={<TooltipContent title="Equipment copies" description="Owned copies include every copy reserved by the current loadout. The same Ring cannot occupy both Ring positions." />}><div className="equipment-inspector-meta"><span>{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</span><strong>OWNED {copyAvailability.owned} · EQUIPPED {copyAvailability.equipped} · AVAILABLE {copyAvailability.available}</strong></div></GameTooltip>}

      <section className="equipment-inspector-stats"><span>STATS</span>{flattenItemStats(selectedStats).filter(([, value]) => value !== 0).map(([key, value]) => <EquipmentStatTooltip key={key} statKey={key}><div className="equipment-inspector-stat-row"><span>{getEquipmentStatLabel(key)}</span><strong>{formatEquipmentStat(key, value)}</strong></div></EquipmentStatTooltip>)}</section>
      <EquipmentCombatDetails item={selectedItem} />
      {ringNeedsChoice && <div className="equipment-ring-replace"><strong>REPLACE</strong><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring1'} onChange={() => setRingReplacement('ring1')} /> Ring 1: {equipment.ring1 ? ITEMS[equipment.ring1].name : 'Empty'}</label><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring2'} onChange={() => setRingReplacement('ring2')} /> Ring 2: {equipment.ring2 ? ITEMS[equipment.ring2].name : 'Empty'}</label></div>}
      {preview && !preview.compatible && <div className="equipment-incompatible"><strong>INCOMPATIBLE</strong><span>{preview.reason}</span></div>}
      {preview?.preview && <div className="equipment-preview-impact"><span className="equipment-preview-label">LOADOUT COMPARISON</span>{keyChanges.length > 0 && <div className="equipment-key-changes"><span className="equipment-key-changes-label">KEY CHANGES</span><div>{keyChanges.map((change) => <EquipmentStatTooltip key={change.key} statKey={change.key}><span className={`equipment-key-change ${change.direction}`} data-change-key={change.key}><i aria-hidden="true">{change.direction === 'increase' ? '▲' : '▼'}</i>{change.formatted} {change.label}</span></EquipmentStatTooltip>)}</div></div>}<div className="equipment-comparison-visual"><div><small>CURRENT</small>{equipment[preview.position ?? 'weapon'] ? <ItemTooltip itemId={equipment[preview.position ?? 'weapon']!} owned={inventory[equipment[preview.position ?? 'weapon']!] ?? 0} equipped><span className="equipment-comparison-icon" style={{ color: ITEMS[equipment[preview.position ?? 'weapon']!].color }}>{ITEMS[equipment[preview.position ?? 'weapon']!].icon}</span></ItemTooltip> : <span className="equipment-comparison-empty">EMPTY</span>}</div><b aria-hidden="true">→</b><div><small>SELECTED PREVIEW</small><ItemTooltip itemId={selectedItemId!} owned={inventory[selectedItemId!] ?? 0}><span className="equipment-comparison-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span></ItemTooltip></div></div>{getImpactEntries(preview.impact).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([key, value]) => <EquipmentStatTooltip key={key} statKey={key}><div className="equipment-impact-row"><span className="equipment-stat-label">{getEquipmentStatLabel(key)}</span><small className="equipment-stat-current equipment-stat-value">{formatSnapshotValue(key, preview.current)}</small><strong className="equipment-stat-value">{formatSnapshotValue(key, preview.preview!)}</strong><em className={`equipment-stat-delta ${(value ?? 0) > 0 ? 'positive' : 'negative'}`}>{formatSignedStat(key, value as number)}</em></div></EquipmentStatTooltip>)}</div>}
      {equippedPositions.length > 0 && <div className="equipment-current-position"><Status tone="success">EQUIPPED IN {equippedPositions.map((position) => EQUIPMENT_POSITION_LABELS[position]).join(' + ')}</Status></div>}
      <div className="equipment-inspector-actions"><Button variant="primary" disabled={Boolean(equipDisabledReason)} tooltip={equipDisabledReason ? <TooltipContent title="Equip unavailable" description={equipDisabledReason} /> : undefined} onClick={() => selectedItemId && equipItem(selectedItemId, preview?.position ?? undefined)}>EQUIP</Button>{inspectorTargetPosition && equipment[inspectorTargetPosition] === selectedItemId && <Button variant="ghost" onClick={() => unequipItem(inspectorTargetPosition)}>UNEQUIP {EQUIPMENT_POSITION_LABELS[inspectorTargetPosition].toUpperCase()}</Button>}</div>
    </>}
  </div></InspectorTransition></Card>

  return <div className="screen-content equipment-screen"><div className="screen-header"><div><div className="eyebrow">WIZARD LOADOUT · EQUIPMENT</div><h1>Build the tower’s answer.</h1><p>Build your loadout from Artifacts and swappable accessories.</p></div></div><EditableGrid screen="equipment" layoutTransform={layoutTransform} panels={[{ id: 'equipment-loadout', content: loadout }, { id: 'equipment-stats', content: statsPanel }, { id: 'equipment-owned', content: armory }, { id: 'equipment-inspector', content: inspector }]} />{artifactPath && <ArtifactPathModal artifactId={artifactPath} onClose={() => setArtifactPath(null)} />}</div>
}

export const EquipmentScreen = EquipmentScreenV2

function EquipmentSlotTooltip({ itemId, owned, tooltip, children }: { itemId: ItemId | null; owned: number; tooltip: { title: string; description: ReactNode }; children: ReactNode }) {
  return itemId ? <ItemTooltip itemId={itemId} owned={owned} equipped>{children}</ItemTooltip> : <GameTooltip block content={<TooltipContent title={tooltip.title} description={tooltip.description} />}>{children}</GameTooltip>
}

function MeasuredEquipmentCard({ children, onHeightChange, ...props }: { children: ReactNode; onHeightChange: (height: number) => void; className?: string; title?: string; action?: ReactNode; style?: CSSProperties }) {
  const cardRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const measure = useCallback(() => {
    const card = cardRef.current
    const content = contentRef.current
    if (!card || !content) return
    const cardRect = card.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const cardStyle = getComputedStyle(card)
    const bottomFrame = (Number.parseFloat(cardStyle.paddingBottom) || 0) + (Number.parseFloat(cardStyle.borderBottomWidth) || 0)
    const contentHeight = contentRect.height || content.scrollHeight
    onHeightChange(Math.ceil((contentRect.top - cardRect.top) + contentHeight + bottomFrame))
  }, [onHeightChange])

  useLayoutEffect(() => {
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    if (cardRef.current) observer.observe(cardRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [measure])

  return <Card ref={cardRef} {...props}><div ref={contentRef}>{children}</div></Card>
}

function EquipmentStatTooltip({ statKey, basicAttackIntervalMs, children }: { statKey: string; basicAttackIntervalMs?: number; children: ReactNode }) {
  return <GameTooltip block content={<TooltipContent title={getEquipmentStatLabel(statKey)} description={getEquipmentStatDescription(statKey, { basicAttackIntervalMs })} />}>{children}</GameTooltip>
}

function StatGroup({ title, rows, basicAttackIntervalMs }: { title: string; rows: EquipmentStatRowData[]; basicAttackIntervalMs?: number }) {
  if (rows.length === 0) return null
  return <section className="equipment-stat-group"><span>{title}</span>{rows.map((row) => <EquipmentStatRow key={row.key} row={row} basicAttackIntervalMs={basicAttackIntervalMs} />)}</section>
}

function EquipmentStatRow({ row, basicAttackIntervalMs }: { row: EquipmentStatRowData; basicAttackIntervalMs?: number }) {
  return <EquipmentStatTooltip statKey={row.key} basicAttackIntervalMs={basicAttackIntervalMs}><div className="equipment-stat-row-shell"><div tabIndex={0} className="equipment-stat-row" data-stat-label={getEquipmentStatLabel(row.key)}><span className="equipment-stat-label">{getEquipmentStatLabel(row.key)}</span><GameValue value={row.value} formatted={formatEquipmentStat(row.key, row.value, false)} className="equipment-stat-value" /></div></div></EquipmentStatTooltip>
}

function formatSnapshotValue(key: string, snapshot: ReturnType<typeof getEquipmentStatSnapshot>) {
  const snapshotKey: Record<string, keyof ReturnType<typeof getEquipmentStatSnapshot>> = { basicAttackSpeedPct: 'basicAttackSpeedMultiplier', critDamage: 'critDamageMultiplier', damageOverTimePct: 'damageOverTimeBonus', statusDurationPct: 'statusDurationBonus', cooldownRecoveryPct: 'cooldownRecovery', healingDonePct: 'healingDoneBonus', barrierPowerPct: 'barrierPowerBonus', manaCostReductionPct: 'manaCostReduction', focusEfficiencyPct: 'focusEfficiency', fireSpellDamage: 'fireSpellDamage', airSpellDamage: 'airSpellDamage', waterBarrierPower: 'waterBarrierPower', barrierReceivedFlat: 'barrierReceivedFlat', negativeStatusDurationReceived: 'negativeStatusDurationReceived' }
  const value = key.startsWith('resistance-')
    ? Number((snapshot.resistances as Record<string, number>)[key.replace('resistance-', '')] ?? 0)
    : Number(snapshot[snapshotKey[key] ?? (key as keyof ReturnType<typeof getEquipmentStatSnapshot>)] ?? 0)
  const displayKey = snapshotKey[key] ?? key
  return formatEquipmentStat(displayKey, value, false)
}

function formatSignedStat(key: string, value: number) { return formatEquipmentStat(key, value, true) }

const getImpactEntries = (impact: ReturnType<typeof getEquipmentPreview>['impact']): Array<[string, number]> => Object.entries(impact).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([damageType, resistance]) => [`resistance-${damageType}`, Number(resistance)]) : [[key, Number(value)]])
const flattenItemStats = (stats: NonNullable<import('../../game/types').ItemDefinition['stats']> | undefined): Array<[string, number]> => Object.entries(stats ?? {}).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)]) : [[key, Number(value)]])
