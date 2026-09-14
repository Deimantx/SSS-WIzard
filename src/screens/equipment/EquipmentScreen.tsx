import { Circle, Crown, Gem, Shield, Shirt, Sparkles, WandSparkles, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Card, EquipmentCombatDetails, GameTooltip, GameValue, SearchInput, SelectMenu, Status } from '../../components/ui'
import { EquipmentMetadata, ItemIcon, ItemTooltip } from '../../components/ui/item'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import { formatPlayerEquipmentTier } from '../../game/content/items/equipmentBalance'
import { getArtifactDefinition } from '../../game/content/artifacts/artifacts'
import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_POSITION_LABELS, EQUIPMENT_POSITIONS, getDefaultEquipmentPosition, getEquippedCount, getItemPositions } from '../../game/core/equipment'
import type { ArtifactId, EquipmentItemSlot, EquipmentPosition, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { getEquipmentCopyAvailability, getEquipmentKeyChanges, getEquipmentPreview, getEquipmentPrimarySummary, getEquipmentSearchText, getEquipmentStatSnapshot, resolveEquipmentPreviewTarget } from '../../game/presentation/equipment/equipmentReadModel'
import { formatEquipmentStat, getEquipmentStatDescription, getEquipmentStatLabel } from '../../game/presentation/equipment/equipmentStatPresentation'
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
  { id: 'all', label: 'ALL' }, { id: 'weapon', label: 'WEAPON' }, { id: 'armor', label: 'ARMOR' }, { id: 'helmet', label: 'HEAD' }, { id: 'cape', label: 'CAPE' }, { id: 'amulet', label: 'NECKLACE' }, { id: 'earring', label: 'EARRINGS' }, { id: 'ring', label: 'RINGS' },
]
const EMPTY_FILTER_LABELS: Record<ArmoryFilter, string> = { all: 'EQUIPMENT', weapon: 'WEAPONS', armor: 'ARMOR', helmet: 'HEAD', cape: 'CAPES', amulet: 'NECKLACES', earring: 'EARRINGS', ring: 'RINGS' }
const LOADOUT_SECTIONS: readonly { id: 'artifacts' | 'accessories'; label: string; positions: readonly EquipmentPosition[] }[] = [
  { id: 'artifacts', label: 'ARTIFACTS', positions: ['weapon', 'armor', 'head'] },
  { id: 'accessories', label: 'ACCESSORIES', positions: ['earring1', 'necklace', 'ring1', 'earring2', 'cape', 'ring2'] },
]
const EMPTY_SLOT_ICONS: Record<EquipmentPosition, LucideIcon> = { weapon: WandSparkles, armor: Shirt, head: Crown, cape: Shield, necklace: Gem, earring1: Sparkles, earring2: Sparkles, ring1: Circle, ring2: Circle }
const ARMORY_SORT_OPTIONS = [{ value: 'tier', label: 'Tier' }, { value: 'name', label: 'Name' }, { value: 'owned', label: 'Owned' }] as const
const isRingPosition = (position: EquipmentPosition | null): position is 'ring1' | 'ring2' => position === 'ring1' || position === 'ring2'
const isEarringPosition = (position: EquipmentPosition | null): position is 'earring1' | 'earring2' => position === 'earring1' || position === 'earring2'
const isDualAccessoryPosition = (position: EquipmentPosition | null) => isRingPosition(position) || isEarringPosition(position)
const getArmoryFilterForPosition = (position: EquipmentPosition): ArmoryFilter => isRingPosition(position) ? 'ring' : isEarringPosition(position) ? 'earring' : position === 'head' ? 'helmet' : position === 'necklace' ? 'amulet' : position
const SLOT_TOOLTIP_COPY: Record<EquipmentPosition, { title: string; description: ReactNode }> = {
  weapon: { title: 'WEAPON', description: <>Your active combat implement.<br />Staffs, wands, magical focuses, and future weapon configurations all use this single slot.</> },
  armor: { title: 'ARMOR', description: <>Body equipment including robes and future plated magical armor.</> },
  head: { title: 'HEAD', description: <>Head equipment such as wizard hats, hoods, circlets, or helmets.</> },
  cape: { title: 'CAPE', description: <>Back equipment such as magical cloaks and capes.<br />Cape effects depend on the individual item.</> },
  necklace: { title: 'NECKLACE', description: <>Neck equipment such as magical amulets and charms.</> },
  earring1: { title: 'EARRING 1', description: <>First accessory slot for magical earrings.<br />The same Earring cannot occupy both Earring slots.</> },
  earring2: { title: 'EARRING 2', description: <>Second accessory slot for magical earrings.<br />The same Earring cannot occupy both Earring slots.</> },
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
  const [selectedPosition, setSelectedPosition] = useState<EquipmentPosition | null>(() => navigationIntent.equipmentPosition ?? null)
  const [filter, setFilter] = useState<ArmoryFilter>(() => navigationIntent.equipmentPosition ? getArmoryFilterForPosition(navigationIntent.equipmentPosition) : 'all')
  const [search, setSearch] = useState('')
  const initialNavigationItemId = navigationIntent.equipmentItemId && ITEMS[navigationIntent.equipmentItemId] ? navigationIntent.equipmentItemId : null
  const initialWeaponId = equipment.weapon && ITEMS[equipment.weapon] ? equipment.weapon : null
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(() => initialNavigationItemId ?? initialWeaponId)
  const [accessoryReplacement, setAccessoryReplacement] = useState<EquipmentPosition | null>(null)
  const [sortMode, setSortMode] = useState<ArmorySort>('tier')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [filterPulseKey, setFilterPulseKey] = useState(0)
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
  const statsScrollRef = useRef<HTMLDivElement>(null)
  const inspectorScrollRef = useRef<HTMLDivElement>(null)
  const targetPosition = selectedItemId ? resolveEquipmentPreviewTarget({ itemId: selectedItemId, selectedPosition, accessoryReplacement, equipment }) : undefined
  const preview = selectedItemId ? getEquipmentPreview(stateForPreview, selectedItemId, targetPosition) : null
  const inspectorTargetPosition = preview?.position ?? targetPosition
  const copyAvailability = selectedItemId ? getEquipmentCopyAvailability({ equipment, inventory }, selectedItemId) : null
  const statSnapshot = getEquipmentStatSnapshot(stateForPreview, equipment)
  const equippedCount = getEquippedCount({ equipment })
  const [artifactPath, setArtifactPath] = useState<ArtifactId | null>(null)
  const [crystalNotice, setCrystalNotice] = useState(false)
  const equippedPositions = selectedItemId ? getItemPositions(selectedItemId).filter((position) => equipment[position] === selectedItemId) : []
  const accessoryPositions = selectedItemId ? getItemPositions(selectedItemId) : []
  const accessoryNeedsChoice = Boolean(selectedItem && (selectedItem.equipmentSlot === 'ring' || selectedItem.equipmentSlot === 'earring') && !accessoryReplacement && accessoryPositions.every((position) => Boolean(equipment[position])) && !isDualAccessoryPosition(selectedPosition))
  const explicitTargetFits = Boolean(selectedItemId && selectedPosition && getItemPositions(selectedItemId).includes(selectedPosition))
  const inspectorContextLabel = explicitTargetFits ? 'TARGET SLOT' : selectedItem && (selectedItem.equipmentSlot === 'ring' || selectedItem.equipmentSlot === 'earring') && targetPosition ? 'PREVIEW SLOT' : 'FITS'
  const inspectorContextValue = selectedItem
    ? explicitTargetFits && selectedPosition ? EQUIPMENT_POSITION_LABELS[selectedPosition]
      : (selectedItem.equipmentSlot === 'ring' || selectedItem.equipmentSlot === 'earring') && targetPosition ? EQUIPMENT_POSITION_LABELS[targetPosition]
        : EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot!]
    : 'EQUIPMENT'
  useSmartScrollState(armoryScrollRef, { dependencies: [visibleEquipment.join('|'), filter, search, availableOnly, sortMode] })
  useSmartScrollState(statsScrollRef)
  useSmartScrollState(inspectorScrollRef, { resetKey: selectedItemId })

  useEffect(() => {
    const itemId = navigationIntent.equipmentItemId
    if (!itemId) return
    if (!ITEMS[itemId]) { setNavigationIntent({ equipmentItemId: null }); return }
    setSelectedItemId(itemId)
    if (navigationIntent.equipmentPosition) {
      setSelectedPosition(navigationIntent.equipmentPosition)
      setAccessoryReplacement(isDualAccessoryPosition(navigationIntent.equipmentPosition) ? navigationIntent.equipmentPosition : null)
      setFilter(getArmoryFilterForPosition(navigationIntent.equipmentPosition))
    }
  }, [navigationIntent.equipmentItemId, navigationIntent.equipmentPosition])

  useEffect(() => {
    if (selectedItemId && visibleEquipment.includes(selectedItemId)) return
    const nextSelectedItemId = visibleEquipment[0] ?? null
    if (nextSelectedItemId !== selectedItemId) setSelectedItemId(nextSelectedItemId)
  }, [visibleEquipment, selectedItemId])

  const selectSlot = (position: EquipmentPosition) => {
    setSelectedPosition(position)
    setNavigationIntent({ equipmentPosition: position, equipmentItemId: equipment[position] })
    setAccessoryReplacement(isDualAccessoryPosition(position) ? position : null)
    const nextFilter = getArmoryFilterForPosition(position)
    if (nextFilter !== filter) setFilterPulseKey((key) => key + 1)
    setFilter(nextFilter)
    const selectedItemFits = selectedItemId ? getItemPositions(selectedItemId).includes(position) : false
    setSelectedItemId(equipment[position] ?? (selectedItemFits ? selectedItemId : null))
  }

  const selectArmoryItem = (itemId: ItemId) => {
    setSelectedItemId(itemId)
    setNavigationIntent({ equipmentItemId: itemId })
    if (ITEMS[itemId].equipmentSlot !== 'ring' && ITEMS[itemId].equipmentSlot !== 'earring') setAccessoryReplacement(null)
  }

  const equipFromArmoryDoubleClick = (itemId: ItemId) => {
    const target = resolveEquipmentPreviewTarget({ itemId, selectedPosition, accessoryReplacement, equipment })
    const candidate = getEquipmentPreview(stateForPreview, itemId, target)
    selectArmoryItem(itemId)
    if (candidate.compatible && candidate.position) equipItem(itemId, candidate.position)
  }

  const openEquipmentMenu = (itemId: ItemId, positions: EquipmentPosition[], x: number, y: number, anchor?: HTMLElement, compare = true) => {
    const item = ITEMS[itemId]
    const equipped = positions.length > 0
    const resolvedTarget = resolveEquipmentPreviewTarget({ itemId, selectedPosition, accessoryReplacement, equipment })
    const equipTargets = !equipped ? (item.equipmentSlot === 'ring' || item.equipmentSlot === 'earring')
      ? getItemPositions(itemId).map((position) => ({ position, preview: getEquipmentPreview(stateForPreview, itemId, position) })).filter((entry) => entry.preview.compatible)
      : item.equipmentSlot ? [{ position: resolvedTarget ?? getDefaultEquipmentPosition(item.equipmentSlot)!, preview: getEquipmentPreview(stateForPreview, itemId, resolvedTarget ?? getDefaultEquipmentPosition(item.equipmentSlot)!) }].filter((entry) => entry.preview.compatible) : []
      : []
    const quickEquipOptions = equipTargets.length > 1 ? equipTargets.map(({ position }) => ({ label: `Equip to ${EQUIPMENT_POSITION_LABELS[position]}`, onSelect: () => { selectArmoryItem(itemId); equipItem(itemId, position) } })) : undefined
    const quickUnequipOptions = positions.map((position) => ({ label: `Unequip ${EQUIPMENT_POSITION_LABELS[position]}`, onSelect: () => { selectSlot(position); unequipItem(position) } }))
    const artificingOutput = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail === 'Artificing output')
    const transmutationOutput = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail === 'Transmutation output')
    const selectForComparison = () => {
      setSelectedItemId(itemId)
      if (positions.length === 1) {
        setSelectedPosition(positions[0])
        setAccessoryReplacement(isDualAccessoryPosition(positions[0]) ? positions[0] : null)
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

  const clearSelectionTarget = () => {
    setSelectedPosition(null)
    setAccessoryReplacement(null)
    setFilterPulseKey((key) => key + 1)
    setFilter('all')
    setNavigationIntent({ equipmentPosition: null, equipmentItemId: null })
  }
  const selectFilter = (nextFilter: ArmoryFilter) => {
    if (nextFilter !== filter) setFilterPulseKey((key) => key + 1)
    setFilter(nextFilter)
    setSelectedPosition(null)
    setAccessoryReplacement(null)
    setNavigationIntent({ equipmentPosition: null, equipmentItemId: null })
  }
  const clearArmoryFilters = () => { setSearch(''); setAvailableOnly(false); selectFilter('all') }
  const openArtificing = () => { setNavigationIntent({ artificingRecipeId: null }); useGameStore.getState().setScreen('tower-artificing') }
  const equipDisabledReason = !preview ? 'Select equipment to preview.' : preview.reason ?? (accessoryNeedsChoice ? `Choose ${selectedItem?.equipmentSlot === 'earring' ? 'Earring 1 or Earring 2' : 'Ring 1 or Ring 2'}.` : equippedPositions.length > 0 ? 'Already equipped.' : null)
  const keyChanges = preview?.preview ? getEquipmentKeyChanges(preview.impact) : []
  const accessoryChoice = accessoryNeedsChoice ? <div className="equipment-ring-replace"><strong>REPLACE {selectedItem?.equipmentSlot === 'earring' ? 'EARRING' : 'RING'}</strong>{accessoryPositions.map((position) => {
    const itemId = equipment[position]
    return <label key={position}><input type="radio" aria-label={`${EQUIPMENT_POSITION_LABELS[position]}: ${itemId ? ITEMS[itemId].name : 'Empty'}`} name="accessory-replacement" checked={accessoryReplacement === position} onChange={() => setAccessoryReplacement(position)} /><span className="equipment-ring-replace-option"><span className="equipment-ring-replace-position">{EQUIPMENT_POSITION_LABELS[position].toUpperCase()}</span><span className="equipment-ring-replace-item">{itemId ? ITEMS[itemId].name : 'Empty'}</span></span></label>
  })}</div> : null
  const renderLoadoutSlot = (position: EquipmentPosition) => {
    const itemId = equipment[position]
    const item = itemId ? ITEMS[itemId] : null
    const emptyCopy = isDualAccessoryPosition(position) ? `Select ${EQUIPMENT_POSITION_LABELS[position].replace(/ [12]$/, '')}` : `Select ${EQUIPMENT_POSITION_LABELS[position]}`
    const tooltip = SLOT_TOOLTIP_COPY[position]
    const SlotGhostIcon = EMPTY_SLOT_ICONS[position]
    return <div className="equipment-slot-grid-item" data-position={position} key={position}>
      <EquipmentSlotTooltip itemId={itemId} owned={itemId ? inventory[itemId] ?? 0 : 0} tooltip={tooltip}>
        <div className={`equipment-slot-card ${item ? 'is-equipped' : 'is-empty'} ${selectedPosition === position ? 'selected' : ''}`} data-position={position} role="button" tabIndex={0} style={item ? { '--item-color': item.color } as CSSProperties : undefined} onClick={() => selectSlot(position)} onContextMenu={(event) => { if (!itemId) return; event.preventDefault(); event.stopPropagation(); openEquipmentMenu(itemId, [position], event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSlot(position) } }}>
          <div className="equipment-slot-card-head"><span>{EQUIPMENT_POSITION_LABELS[position]}</span><span className="equipment-slot-card-meta">{item && <span className="equipment-tier-badge">{formatPlayerEquipmentTier(item.equipmentTier ?? 1)}</span>}{item && isArtifactItem(item.id) && <span className="equipment-level-chip">L{getArtifactLevel({ artifactProgress }, item.id)}/{getArtifactDefinition(item.id)?.maxLevel ?? 10}</span>}</span></div>
          <div className="equipment-slot-card-body">
            {item ? <div className="equipment-slot-card-item"><span className="equipment-slot-icon" style={{ color: item.color }}><ItemIcon itemId={item.id} size="tile" /></span><span className="equipment-slot-card-copy"><strong>{item.name}</strong></span></div> : <div className="equipment-slot-empty"><SlotGhostIcon size={27} strokeWidth={1.35} aria-hidden="true" /><strong>EMPTY SLOT</strong><small>{emptyCopy}</small></div>}
          </div>
        </div>
      </EquipmentSlotTooltip>
    </div>
  }

  const loadout = <Card title="WIZARD LOADOUT" action={<Status tone="success">{equippedCount} / {EQUIPMENT_POSITIONS.length} EQUIPPED</Status>}>
    <div className="equipment-loadout-board">
      {LOADOUT_SECTIONS.map((section) => <section className={`equipment-loadout-section equipment-loadout-section-${section.id}`} key={section.id}>
        <div className="equipment-loadout-section-head"><div><span className="equipment-section-kicker">LOADOUT</span><strong>{section.label}</strong></div><small>{section.id === 'artifacts' ? 'Core power' : 'Flexible slots'}</small></div>
        <div className="equipment-loadout-section-grid">{section.positions.map(renderLoadoutSlot)}</div>
      </section>)}
      <div className="equipment-crystal-module">
        <div className="equipment-crystal-copy"><span className="equipment-section-kicker">EXTENSION SOCKET</span><strong>CRYSTALS</strong><small>Crystal loadout support is ready for a future progression pass.</small></div>
        <Button variant="secondary" onClick={() => setCrystalNotice(true)}><Gem size={14} aria-hidden="true" /> OPEN CRYSTALS</Button>
        {crystalNotice && <span className="equipment-crystal-notice" role="status">Crystal management is coming soon.</span>}
      </div>
    </div>
    <p className="equipment-loadout-note">Select a slot to filter compatible equipment.</p>
  </Card>

  const statsPanel = <Card title="WIZARD STATS" className="equipment-stats-panel" action={<Sparkles size={16} color="var(--gold)" />}>
    <div ref={statsScrollRef} className="equipment-stat-groups smart-scroll-region">
      <StatGroup title="CORE" rows={[{ key: 'maxHealth', value: statSnapshot.maxHealth }, { key: 'healthRegen', value: statSnapshot.healthRegen }, { key: 'maxMana', value: statSnapshot.maxMana }, { key: 'maxFocus', value: statSnapshot.maxFocus }, { key: 'manaRegen', value: statSnapshot.manaRegen }]} />
      <StatGroup title="OFFENSE" basicAttackIntervalMs={statSnapshot.basicAttackIntervalMs} rows={[{ key: 'spellPower', value: statSnapshot.spellPower }, { key: 'basicDamage', value: statSnapshot.basicDamage }, { key: 'basicAttackSpeedMultiplier', value: statSnapshot.basicAttackSpeedMultiplier }, { key: 'critChance', value: statSnapshot.critChance }, { key: 'critDamageMultiplier', value: statSnapshot.critDamageMultiplier }, ...(statSnapshot.fireSpellDamage ? [{ key: 'fireSpellDamage', value: statSnapshot.fireSpellDamage }] : []), ...(statSnapshot.airSpellDamage ? [{ key: 'airSpellDamage', value: statSnapshot.airSpellDamage }] : [])]} />
      <StatGroup title="DEFENSE" rows={[{ key: 'defense', value: statSnapshot.defense }, { key: 'damageReduction', value: statSnapshot.damageReduction }, ...(statSnapshot.blockChance ? [{ key: 'blockChance', value: statSnapshot.blockChance }] : []), ...(statSnapshot.barrierReceivedFlat ? [{ key: 'barrierReceivedFlat', value: statSnapshot.barrierReceivedFlat }] : []), ...Object.entries(statSnapshot.resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([type, value]) => ({ key: `resistance-${type}`, value: value ?? 0 }))]} />
      <StatGroup title="UTILITY" rows={[...(statSnapshot.cooldownRecovery !== 1 ? [{ key: 'cooldownRecovery', value: statSnapshot.cooldownRecovery }] : []), ...(statSnapshot.healingDoneBonus ? [{ key: 'healingDoneBonus', value: statSnapshot.healingDoneBonus }] : []), ...(statSnapshot.barrierPowerBonus ? [{ key: 'barrierPowerBonus', value: statSnapshot.barrierPowerBonus }] : []), ...(statSnapshot.waterBarrierPower ? [{ key: 'waterBarrierPower', value: statSnapshot.waterBarrierPower }] : []), ...(statSnapshot.manaCostReduction ? [{ key: 'manaCostReduction', value: statSnapshot.manaCostReduction }] : []), ...(statSnapshot.focusEfficiency ? [{ key: 'focusEfficiency', value: statSnapshot.focusEfficiency }] : [])]} />
      <StatGroup title="PERIODIC / STATUS" rows={[...(statSnapshot.damageOverTimeBonus ? [{ key: 'damageOverTimeBonus', value: statSnapshot.damageOverTimeBonus }] : []), ...(statSnapshot.statusDurationBonus ? [{ key: 'statusDurationBonus', value: statSnapshot.statusDurationBonus }] : []), ...(statSnapshot.negativeStatusDurationReceived ? [{ key: 'negativeStatusDurationReceived', value: statSnapshot.negativeStatusDurationReceived }] : [])]} />
    </div>
    <GameTooltip block content={<TooltipContent title="Reserved equipment" description="Equipped copies stay reserved and cannot be spent by Research, Transmutation, Guild donation, Sell, or Destroy." />}><div className="equipment-note"><Shield size={15} /><span>Equipped copies reserved from other actions.</span></div></GameTooltip>
  </Card>

  const armory = <Card title="ARMORY" className="equipment-armory-panel" action={<span className="equipment-armory-count">{ownedEquipment.length} OWNED TYPES</span>}>
    <label className="equipment-search"><SearchInput value={search} onChange={setSearch} placeholder="Search name, stat, or build tag..." ariaLabel="Search equipment" /></label>
    <div className="equipment-armory-controls"><SelectMenu options={ARMORY_SORT_OPTIONS} value={sortMode} onChange={setSortMode} ariaLabel="Armory sort" prefix="SORT: " /><label className="equipment-availability-toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> <span>AVAILABLE ONLY</span></label></div>
    {selectedPosition && <div className="equipment-target-chip" role="status"><span>TARGET SLOT</span><strong>{EQUIPMENT_POSITION_LABELS[selectedPosition].toUpperCase()}</strong><button type="button" onClick={clearSelectionTarget}>CLEAR</button></div>}
    <div key={filterPulseKey} className={`equipment-filter-bar${filterPulseKey ? ' equipment-filter-attention' : ''}`} role="tablist" aria-label="Equipment filters">{ARMORY_FILTERS.map((entry) => <button type="button" role="tab" aria-label={entry.label} aria-selected={filter === entry.id} className={filter === entry.id ? 'active' : ''} key={entry.id} onClick={() => selectFilter(entry.id)}>{entry.label} <span>{equipmentCounts[entry.id]}</span></button>)}</div>

    {visibleEquipment.length === 0 ? ownedEquipment.length === 0 ? <div className="equipment-empty-armory"><strong>NO EQUIPMENT OWNED</strong><small>Craft your first gear in Artificing.</small><Button variant="secondary" onClick={openArtificing}>OPEN ARTIFICING</Button></div> : <div className="equipment-empty-armory"><strong>NO ITEMS MATCH CURRENT FILTERS</strong><small>Try another name, stat, build tag, or availability setting.</small><Button variant="ghost" onClick={clearArmoryFilters}>CLEAR FILTERS</Button></div> : <div ref={armoryScrollRef} className="equipment-armory-grid smart-scroll-region">{visibleEquipment.map((id) => { const item = ITEMS[id]; const selected = id === selectedItemId; const equipped = getItemPositions(id).some((position) => equipment[position] === id); const isNew = recentAcquisitions.some((entry) => entry.itemId === id && entry.isNew); const tracked = uiPreferences.trackedItemId === id; const isArtifact = isArtifactItem(id); const tierLabel = item.equipmentTier !== undefined ? formatPlayerEquipmentTier(item.equipmentTier) : null; const armoryMeta = tierLabel === null ? null : isArtifact ? `${tierLabel} · L${getArtifactLevel({ artifactProgress }, id)}/${getArtifactDefinition(id)?.maxLevel ?? 10}` : tierLabel; return <ItemTooltip itemId={id} owned={inventory[id] ?? 0} equipped={equipped} key={id}><button type="button" data-item-id={id} aria-label={`${item.name}, owned ${inventory[id] ?? 0}${equipped ? ', equipped' : ''}${isNew ? ', new' : ''}${tracked ? ', tracked' : ''}`} className={`equipment-armory-card ${selected ? 'selected' : ''} ${equipped ? 'equipped' : ''}`} onClick={() => selectArmoryItem(id)} onDoubleClick={() => equipFromArmoryDoubleClick(id)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openEquipmentMenu(id, getItemPositions(id).filter((position) => equipment[position] === id), event.clientX, event.clientY, event.currentTarget) }}><span className="equipment-armory-icon" style={{ color: item.color }}><ItemIcon itemId={id} size="tile" /></span><span className="equipment-armory-copy"><span className="equipment-armory-name-line"><strong>{item.name}</strong><span className="equipment-armory-meta-line">{armoryMeta && <span className={isArtifact ? 'equipment-armory-artifact-meta' : 'equipment-tier-badge'}>{armoryMeta}</span>}</span></span><small className="equipment-armory-summary">{getEquipmentPrimarySummary(id, stateForPreview) ?? 'Ready'}</small></span><span className="equipment-armory-markers">{equipped && <Status tone="success">EQUIPPED</Status>}{isNew && <span className="equipment-armory-marker new">NEW</span>}{tracked && <span className="equipment-armory-marker tracked" aria-label="Tracked item">TRACKED</span>}</span></button></ItemTooltip> })}</div>}
  </Card>

  const inspector = <Card title="GEAR INSPECTOR" className="equipment-inspector"><InspectorTransition identity={selectedItemId} accent={selectedItem?.color} fill><div ref={inspectorScrollRef} className="equipment-inspector-content smart-scroll-region">
    {!selectedItem ? <div className="equipment-inspector-empty"><strong>SELECT GEAR</strong><small>Choose an item from the Armory to compare its real loadout impact.</small></div> : <>
      <div className="equipment-inspector-hero"><ItemTooltip itemId={selectedItemId!} owned={inventory[selectedItemId!] ?? 0} equipped={equippedPositions.length > 0}><span className="equipment-inspector-icon" style={{ color: selectedItem.color }}><ItemIcon itemId={selectedItemId!} size="large" /></span></ItemTooltip><div className="equipment-inspector-hero-copy"><div className="eyebrow">{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</div><h3>{selectedItem.name}</h3><EquipmentMetadata item={selectedItem} className="equipment-inspector-metadata" /><div className={`equipment-preview-slot-context${explicitTargetFits ? ' is-explicit' : ''}`}><span>{inspectorContextLabel}</span><strong>{inspectorContextValue.toUpperCase()}</strong></div><p>{selectedItem.description}</p></div></div>
      {equippedPositions.length > 0 && <div className="equipment-inspector-equipped-state"><Status tone="success">EQUIPPED — {equippedPositions.map((position) => EQUIPMENT_POSITION_LABELS[position]).join(' + ')}</Status></div>}
      {isArtifactItem(selectedItemId!) && <div className="equipment-inspector-meta equipment-artifact-summary"><div className="equipment-artifact-identity"><strong>T{getArtifactDefinition(selectedItemId!)?.tier ?? 1} ARTIFACT · LEVEL {getArtifactLevel({ artifactProgress }, selectedItemId!)} / 10</strong><span className="equipment-artifact-points">ARTIFACT POINTS {getArtifactAvailablePoints({ artifactProgress }, selectedItemId!)} / {getArtifactTotalPoints({ artifactProgress }, selectedItemId!)}</span></div><Button variant="secondary" onClick={() => setArtifactPath(selectedItemId)}>ARTIFACT PATH</Button></div>}
      {copyAvailability && <GameTooltip block content={<TooltipContent title="Equipment copies" description="Owned copies include every copy reserved by the current loadout. The same Ring cannot occupy both Ring positions." />}><div className="equipment-inspector-meta equipment-copy-availability"><span className="equipment-copy-availability-slot">{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</span><div className="equipment-copy-availability-values"><span><small>OWNED</small><strong>{copyAvailability.owned}</strong></span><span><small>EQUIPPED</small><strong>{copyAvailability.equipped}</strong></span><span><small>AVAILABLE</small><strong>{copyAvailability.available}</strong></span></div></div></GameTooltip>}

      <section className="equipment-inspector-stats"><span>STATS</span>{flattenItemStats(selectedStats).filter(([, value]) => value !== 0).map(([key, value]) => <EquipmentStatTooltip key={key} statKey={key}><div className="equipment-inspector-stat-row equipment-stat-row"><span className="equipment-stat-label">{getEquipmentStatLabel(key)}</span><strong className="equipment-stat-value">{formatEquipmentStat(key, value)}</strong></div></EquipmentStatTooltip>)}</section>
      <EquipmentCombatDetails item={selectedItem} />
      {accessoryChoice}
      {preview && !preview.compatible && <div className="equipment-incompatible"><strong>INCOMPATIBLE</strong><span>{preview.reason}</span></div>}
      {preview?.preview && <div className="equipment-preview-impact"><div className="equipment-preview-heading"><span className="equipment-preview-label">LOADOUT COMPARISON</span><span className="equipment-preview-context">PREVIEWING: {EQUIPMENT_POSITION_LABELS[preview.position ?? 'weapon']}</span></div>{keyChanges.length > 0 && <div className="equipment-key-changes"><span className="equipment-key-changes-label">KEY CHANGES</span><div>{keyChanges.map((change) => <EquipmentStatTooltip key={change.key} statKey={change.key}><span className={`equipment-key-change ${change.direction}`} data-change-key={change.key}><i aria-hidden="true">{change.direction === 'increase' ? '▲' : '▼'}</i><strong>{change.formatted}</strong><span>{change.label}</span></span></EquipmentStatTooltip>)}</div></div>}<div className="equipment-comparison-visual"><div className="equipment-comparison-side"><small>CURRENT</small>{equipment[preview.position ?? 'weapon'] ? <><ItemTooltip itemId={equipment[preview.position ?? 'weapon']!} owned={inventory[equipment[preview.position ?? 'weapon']!] ?? 0} equipped><span className="equipment-comparison-icon" style={{ color: ITEMS[equipment[preview.position ?? 'weapon']!].color }}>{ITEMS[equipment[preview.position ?? 'weapon']!].icon}</span></ItemTooltip><strong className="equipment-comparison-name">{ITEMS[equipment[preview.position ?? 'weapon']!].name}</strong></> : <span className="equipment-comparison-empty">EMPTY</span>}</div><b aria-hidden="true">→</b><div className="equipment-comparison-side"><small>SELECTED PREVIEW</small><ItemTooltip itemId={selectedItemId!} owned={inventory[selectedItemId!] ?? 0}><span className="equipment-comparison-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span></ItemTooltip><strong className="equipment-comparison-name">{selectedItem.name}</strong></div></div><div className="equipment-impact-header" aria-hidden="true"><span>STAT</span><span>CURRENT</span><span>PREVIEW</span><span>CHANGE</span></div>{getImpactEntries(preview.impact).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([key, value]) => <EquipmentStatTooltip key={key} statKey={key}><div className="equipment-impact-row"><span className="equipment-stat-label">{getEquipmentStatLabel(key)}</span><small className="equipment-stat-current equipment-stat-value">{formatSnapshotValue(key, preview.current)}</small><strong className="equipment-stat-value">{formatSnapshotValue(key, preview.preview!)}</strong><em className={`equipment-stat-value equipment-stat-delta ${(value ?? 0) > 0 ? 'positive' : 'negative'}`}>{formatSignedStat(key, value as number)}</em></div></EquipmentStatTooltip>)}</div>}
      <div className="equipment-inspector-actions equipment-inspector-action-footer"><Button variant="primary" disabled={Boolean(equipDisabledReason)} tooltip={equipDisabledReason ? <TooltipContent title="Equip unavailable" description={equipDisabledReason} /> : undefined} onClick={() => selectedItemId && equipItem(selectedItemId, preview?.position ?? undefined)}>EQUIP</Button>{inspectorTargetPosition && equipment[inspectorTargetPosition] === selectedItemId && <Button variant="ghost" onClick={() => unequipItem(inspectorTargetPosition)}>UNEQUIP {EQUIPMENT_POSITION_LABELS[inspectorTargetPosition].toUpperCase()}</Button>}</div>
    </>}
  </div></InspectorTransition></Card>

  return <div className="screen-content equipment-screen"><div className="screen-header"><div><div className="eyebrow">WIZARD LOADOUT · EQUIPMENT</div><h1>Build the tower’s answer.</h1><p>Build your loadout from Artifacts and swappable accessories.</p></div></div><ScreenGrid screen="equipment" panels={[{ id: 'equipment-loadout', content: loadout }, { id: 'equipment-stats', content: statsPanel }, { id: 'equipment-owned', content: armory }, { id: 'equipment-inspector', content: inspector }]} />{artifactPath && <ArtifactPathModal artifactId={artifactPath} onClose={() => setArtifactPath(null)} />}</div>
}

export const EquipmentScreen = EquipmentScreenV2

function EquipmentSlotTooltip({ itemId, owned, tooltip, children }: { itemId: ItemId | null; owned: number; tooltip: { title: string; description: ReactNode }; children: ReactNode }) {
  return itemId ? <ItemTooltip itemId={itemId} owned={owned} equipped>{children}</ItemTooltip> : <GameTooltip block content={<TooltipContent title={tooltip.title} description={tooltip.description} />}>{children}</GameTooltip>
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
