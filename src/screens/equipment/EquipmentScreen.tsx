import { LockKeyhole, Shield, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Card, EquipmentCombatDetails, GameTooltip, Status } from '../../components/ui'
import { ItemTooltip } from '../../components/ui/item'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_POSITION_LABELS, getEquippedCount, getItemPositions, isTwoHandedWeapon } from '../../game/core/equipment'
import type { EquipmentItemSlot, EquipmentPosition, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { getEquipmentCopyAvailability, getEquipmentPreview, getEquipmentStatSnapshot } from '../../game/presentation/equipment/equipmentReadModel'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { BLOCK_DAMAGE_REDUCTION, MAX_RESISTANCE } from '../../game/core/balance/combatStats'
import { formatBasicAttackTime } from '../../game/presentation/combat'
import { getEquipmentPrimaryCombatSummary } from '../../game/presentation/equipment/equipmentCombatPresentation'
import { getAdaptiveEquipmentLayout } from './equipmentLayout'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'

type ArmoryFilter = 'all' | EquipmentItemSlot
type WeaponHandsFilter = 'all' | 1 | 2

const ARMORY_FILTERS: { id: ArmoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL' }, { id: 'weapon', label: 'WEAPON' }, { id: 'offhand', label: 'OFFHAND' }, { id: 'armor', label: 'ARMOR' }, { id: 'helmet', label: 'HELMET' }, { id: 'cape', label: 'CAPE' }, { id: 'amulet', label: 'AMULET' }, { id: 'ring', label: 'RINGS' },
]
const EMPTY_FILTER_LABELS: Record<ArmoryFilter, string> = { all: 'EQUIPMENT', weapon: 'WEAPONS', offhand: 'OFFHANDS', armor: 'ARMOR', helmet: 'HELMETS', cape: 'CAPES', amulet: 'AMULETS', ring: 'RINGS' }
const LOADOUT_VISUAL_ORDER: readonly EquipmentPosition[] = ['cape', 'helmet', 'weapon', 'armor', 'offhand', 'ring1', 'amulet', 'ring2']
const SLOT_TOOLTIP_COPY: Record<EquipmentPosition, { title: string; description: ReactNode }> = {
  weapon: { title: 'WEAPON', description: <>Main-hand equipment.<br />Supports one-handed and two-handed weapons.<br />Two-handed weapons disable Offhand.</> },
  offhand: { title: 'OFFHAND', description: <>Shields, magical focuses, books, or other secondary equipment.<br />Cannot be equipped with a two-handed Weapon.</> },
  armor: { title: 'ARMOR', description: <>Body equipment including robes and future plated magical armor.</> },
  helmet: { title: 'HELMET', description: <>Head equipment such as wizard hats, hoods, circlets, or helmets.</> },
  cape: { title: 'CAPE', description: <>Back equipment such as magical cloaks and capes.<br />Cape effects depend on the individual item.</> },
  amulet: { title: 'AMULET', description: <>Neck equipment such as magical amulets and charms.</> },
  ring1: { title: 'RING', description: <>Ring accessory slot.<br />The same Ring may occupy both Ring slots if two copies are owned.</> },
  ring2: { title: 'RING', description: <>Ring accessory slot.<br />The same Ring may occupy both Ring slots if two copies are owned.</> },
}

export function EquipmentScreenV2() {
  const equipment = useGameStore((state) => state.equipment)
  const inventory = useGameStore((state) => state.inventory)
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const debug = useGameStore((state) => state.debug)
  const equipItem = useGameStore((state) => state.equipItem)
  const unequipItem = useGameStore((state) => state.unequipItem)
  const [selectedPosition, setSelectedPosition] = useState<EquipmentPosition>('weapon')
  const [filter, setFilter] = useState<ArmoryFilter>('all')
  const [weaponHandsFilter, setWeaponHandsFilter] = useState<WeaponHandsFilter>('all')
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(equipment.weapon)
  const [ringReplacement, setRingReplacement] = useState<EquipmentPosition | null>(null)
  const [loadoutContentHeight, setLoadoutContentHeight] = useState(0)
  const [statsContentHeight, setStatsContentHeight] = useState(0)
  const stateForPreview = { player, progress, activities, debug, equipment, inventory }
  const ownedEquipment = useMemo(() => (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment' && (inventory[id] ?? 0) > 0), [inventory])
  const visibleEquipment = useMemo(() => ownedEquipment.filter((id) => (filter === 'all' || ITEMS[id].equipmentSlot === filter) && (filter !== 'weapon' || weaponHandsFilter === 'all' || ITEMS[id].weaponHands === weaponHandsFilter)), [ownedEquipment, filter, weaponHandsFilter])
  const selectedItem = selectedItemId ? ITEMS[selectedItemId] : null
  const targetPosition = selectedItem?.equipmentSlot === 'ring'
    ? ringReplacement ?? (selectedPosition === 'ring1' || selectedPosition === 'ring2' ? selectedPosition : equipment.ring1 ? equipment.ring2 ? undefined : 'ring2' : 'ring1')
    : selectedPosition
  const preview = selectedItemId ? getEquipmentPreview(stateForPreview, selectedItemId, targetPosition) : null
  const inspectorTargetPosition = preview?.position ?? targetPosition
  const copyAvailability = selectedItemId ? getEquipmentCopyAvailability({ equipment, inventory }, selectedItemId) : null
  const statSnapshot = getEquipmentStatSnapshot(stateForPreview, equipment)
  const equippedCount = getEquippedCount({ equipment })
  const equippedPositions = selectedItemId ? getItemPositions(selectedItemId).filter((position) => equipment[position] === selectedItemId) : []
  const ringNeedsChoice = selectedItem?.equipmentSlot === 'ring' && !ringReplacement && Boolean(equipment.ring1 && equipment.ring2) && selectedPosition !== 'ring1' && selectedPosition !== 'ring2'
  const reportLoadoutContentHeight = useCallback((height: number) => setLoadoutContentHeight((current) => current === height ? current : height), [])
  const reportStatsContentHeight = useCallback((height: number) => setStatsContentHeight((current) => current === height ? current : height), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveEquipmentLayout>[0]) => getAdaptiveEquipmentLayout(layout, { requiredLoadoutContentHeight: loadoutContentHeight, requiredStatsContentHeight: statsContentHeight }), [loadoutContentHeight, statsContentHeight])

  useEffect(() => {
    if (selectedItemId && !ownedEquipment.includes(selectedItemId)) setSelectedItemId(ownedEquipment[0] ?? null)
  }, [ownedEquipment, selectedItemId])

  const selectSlot = (position: EquipmentPosition) => {
    setSelectedPosition(position)
    setRingReplacement(position === 'ring1' || position === 'ring2' ? position : null)
    setFilter(position === 'ring1' || position === 'ring2' ? 'ring' : position as ArmoryFilter)
    if (equipment[position]) setSelectedItemId(equipment[position])
  }

  const selectArmoryItem = (itemId: ItemId) => {
    setSelectedItemId(itemId)
    const slot = ITEMS[itemId].equipmentSlot
    if (slot === 'ring') {
      if (selectedPosition !== 'ring1' && selectedPosition !== 'ring2') setRingReplacement(equipment.ring1 ? equipment.ring2 ? null : 'ring2' : 'ring1')
    } else if (slot) {
      setSelectedPosition(slot)
      setRingReplacement(null)
    }
  }

  const loadout = <MeasuredEquipmentCard title="WIZARD LOADOUT" action={<Status tone="success">{equippedCount} / 8 EQUIPPED</Status>} onHeightChange={reportLoadoutContentHeight}>
    <div className="equipment-loadout-board">
      {LOADOUT_VISUAL_ORDER.map((position) => {
        const itemId = equipment[position]
        const item = itemId ? ITEMS[itemId] : null
        const locked = position === 'offhand' && isTwoHandedWeapon(equipment.weapon)
        const emptyCopy = locked ? 'Blocked by 2H Weapon' : position === 'ring1' || position === 'ring2' ? 'Select Ring' : `Select ${EQUIPMENT_POSITION_LABELS[position]}`
        const tooltip = SLOT_TOOLTIP_COPY[position]
        return <div className="equipment-slot-grid-item" data-position={position} key={position}>
          <EquipmentSlotTooltip itemId={itemId} owned={itemId ? inventory[itemId] ?? 0 : 0} tooltip={tooltip}>
            <div className={`equipment-slot-card ${selectedPosition === position ? 'selected' : ''} ${locked ? 'locked' : ''}`} data-position={position} role="button" tabIndex={0} onClick={() => selectSlot(position)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSlot(position) } }}>
              <div className="equipment-slot-card-head"><span>{EQUIPMENT_POSITION_LABELS[position]}</span>{item && <small>{item.weaponHands ? `${item.weaponHands}H` : 'EQUIPPED'}</small>}</div>
              {locked ? <div className="equipment-slot-lock"><LockKeyhole size={17} /><strong>{emptyCopy}</strong></div> : item ? <div className="equipment-slot-card-item"><span className="equipment-slot-icon" style={{ color: item.color }}>{item.icon}</span><strong>{item.name}</strong><small>{[flattenItemStats(item.stats).filter(([, value]) => value !== 0).map(([key, value]) => `${formatStat(key, value)} ${friendlyStatLabel(key)}`).join(' · '), getEquipmentPrimaryCombatSummary(item)].filter(Boolean).join(' · ') || 'Ready'}</small></div> : <div className="equipment-slot-empty"><span>+</span><small>{emptyCopy}</small></div>}
            </div>
          </EquipmentSlotTooltip>
        </div>
      })}
    </div>
    <p className="equipment-loadout-note">Select an empty slot to filter compatible gear. More slots may be added later.</p>
  </MeasuredEquipmentCard>

  const statsPanel = <MeasuredEquipmentCard title="WIZARD STATS" action={<Sparkles size={16} color="var(--gold)" />} onHeightChange={reportStatsContentHeight}>
    <div className="equipment-stat-groups">
      <StatGroup title="CORE" rows={[['Max Health', String(statSnapshot.maxHealth)], ['Max Mana', String(statSnapshot.maxMana)], ['Max Focus', String(statSnapshot.maxFocus)], ['Mana Regen', `+${statSnapshot.manaRegen.toFixed(1)}/s`]]} />
      <StatGroup title="OFFENSE" basicAttackIntervalMs={statSnapshot.basicAttackIntervalMs} rows={[['Spell Power', String(statSnapshot.spellPower)], ['Basic Attack Damage', String(statSnapshot.basicDamage)], ['Basic Attack Speed', `${statSnapshot.basicAttackSpeedMultiplier.toFixed(2)}x`], ['Crit Chance', `${Math.round(statSnapshot.critChance * 100)}%`], ['Crit Damage', `${Math.round(statSnapshot.critDamageMultiplier * 100)}%`], ...(statSnapshot.fireSpellDamage ? [['Fire Spell Damage', `${Math.round(statSnapshot.fireSpellDamage * 100)}%`] as [string, string]] : []), ...(statSnapshot.airSpellDamage ? [['Air Spell Damage', `${Math.round(statSnapshot.airSpellDamage * 100)}%`] as [string, string]] : [])]} />
      <StatGroup title="DEFENSE" rows={[['Defense', String(Math.round(statSnapshot.defense * 100) / 100)], ['Damage Reduction', `${(statSnapshot.damageReduction * 100).toFixed(1)}%`], ...(statSnapshot.blockChance ? [['Block Chance', `${Math.round(statSnapshot.blockChance * 100)}%`] as [string, string]] : []), ...(statSnapshot.barrierReceivedFlat ? [['Barrier Received', `+${statSnapshot.barrierReceivedFlat}`] as [string, string]] : []), ...Object.entries(statSnapshot.resistances).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([type, value]) => [`${type[0].toUpperCase()}${type.slice(1)} Resistance`, `${Math.round((value ?? 0) * 100)}%`] as [string, string])]} />
      <StatGroup title="UTILITY" rows={[...(statSnapshot.cooldownRecovery !== 1 ? [['Cooldown Recovery', `${statSnapshot.cooldownRecovery.toFixed(2)}x`] as [string, string]] : []), ...(statSnapshot.healingDoneBonus ? [['Healing Done', `${Math.round(statSnapshot.healingDoneBonus * 100)}%`] as [string, string]] : []), ...(statSnapshot.barrierPowerBonus ? [['Barrier Power', `${Math.round(statSnapshot.barrierPowerBonus * 100)}%`] as [string, string]] : []), ...(statSnapshot.waterBarrierPower ? [['Water Barrier Power', `${Math.round(statSnapshot.waterBarrierPower * 100)}%`] as [string, string]] : []), ...(statSnapshot.manaCostReduction ? [['Mana Cost Reduction', `${Math.round(statSnapshot.manaCostReduction * 100)}%`] as [string, string]] : []), ...(statSnapshot.focusEfficiency ? [['Focus Efficiency', `${Math.round(statSnapshot.focusEfficiency * 100)}%`] as [string, string]] : [])]} />
      <StatGroup title="PERIODIC / STATUS" rows={[...(statSnapshot.damageOverTimeBonus ? [['Damage over Time', `${Math.round(statSnapshot.damageOverTimeBonus * 100)}%`] as [string, string]] : []), ...(statSnapshot.statusDurationBonus ? [['Status Duration', `${Math.round(statSnapshot.statusDurationBonus * 100)}%`] as [string, string]] : []), ...(statSnapshot.negativeStatusDurationReceived ? [['Received Negative Status Duration', `${Math.round(statSnapshot.negativeStatusDurationReceived * 100)}%`] as [string, string]] : [])]} />
    </div>
    <div className="equipment-note"><Shield size={15} /><span>Equipped copies remain reserved from Research, Transmutation, Guild donation, Sell, and Destroy.</span></div>
  </MeasuredEquipmentCard>

  const armory = <Card title="ARMORY" action={<span className="equipment-armory-count">{ownedEquipment.length} OWNED TYPES</span>}>
    <div className="equipment-filter-bar" role="tablist" aria-label="Equipment filters">{ARMORY_FILTERS.map((entry) => <button type="button" role="tab" aria-selected={filter === entry.id} className={filter === entry.id ? 'active' : ''} key={entry.id} onClick={() => { setFilter(entry.id); if (entry.id !== 'all' && entry.id !== 'ring') setSelectedPosition(entry.id) }}>{entry.label}</button>)}</div>
    {filter === 'weapon' && <div className="equipment-weapon-badges"><button type="button" className={weaponHandsFilter === 'all' ? 'active' : ''} onClick={() => setWeaponHandsFilter('all')}>ALL</button><button type="button" className={weaponHandsFilter === 1 ? 'active' : ''} onClick={() => setWeaponHandsFilter(1)}>1H</button><button type="button" className={weaponHandsFilter === 2 ? 'active' : ''} onClick={() => setWeaponHandsFilter(2)}>2H</button></div>}
    {visibleEquipment.length === 0 ? <div className="equipment-empty-armory"><strong>NO {EMPTY_FILTER_LABELS[filter]} OWNED</strong><small>Future equipment will appear here.</small></div> : <div className="equipment-armory-grid">{visibleEquipment.map((id) => { const item = ITEMS[id]; const selected = id === selectedItemId; const equipped = getItemPositions(id).some((position) => equipment[position] === id); return <ItemTooltip itemId={id} owned={inventory[id] ?? 0} equipped={equipped} key={id}><button type="button" className={`equipment-armory-card ${selected ? 'selected' : ''} ${equipped ? 'equipped' : ''}`} onClick={() => selectArmoryItem(id)}><span className="equipment-armory-icon" style={{ color: item.color }}>{item.icon}</span><span className="equipment-armory-copy"><strong>{item.name}</strong><small>{getEquipmentPrimaryCombatSummary(item) ?? (item.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[item.equipmentSlot] : 'Equipment')}</small></span>{item.weaponHands && <Status tone="warning">{item.weaponHands}H</Status>}{equipped && <Status tone="success">EQUIPPED</Status>}</button></ItemTooltip> })}</div>}
  </Card>

  const inspector = <Card title="GEAR INSPECTOR" className="equipment-inspector"><InspectorTransition identity={selectedItemId}>
    {!selectedItem ? <div className="equipment-inspector-empty"><strong>SELECT GEAR</strong><small>Choose an item from the Armory to compare its real loadout impact.</small></div> : <>
      <div className="equipment-inspector-hero"><span className="equipment-inspector-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><div className="eyebrow">{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</div><h3>{selectedItem.name}</h3><p>{selectedItem.description}</p></div></div>
      {copyAvailability && <GameTooltip block content={<TooltipContent title="Equipment copies" description="Owned copies include every copy reserved by the current loadout. A Ring needs one owned copy per occupied Ring position." />}><div className="equipment-copy-availability"><span>COPIES</span><strong>OWNED {copyAvailability.owned}</strong><strong>EQUIPPED {copyAvailability.equipped}</strong><strong>AVAILABLE {copyAvailability.available}</strong></div></GameTooltip>}
      {selectedItem.weaponHands && <div className="equipment-hands"><span>WEAPON TYPE</span><strong>{selectedItem.weaponHands === 2 ? 'Two-Handed' : 'One-Handed'}</strong></div>}
      {preview?.removedOffhand && <div className="equipment-impact-warning"><LockKeyhole size={14} /><span>{ITEMS[preview.removedOffhand].name} will be unequipped automatically.</span></div>}
      <EquipmentCombatDetails item={selectedItem} />
      {ringNeedsChoice && <div className="equipment-ring-replace"><strong>REPLACE</strong><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring1'} onChange={() => setRingReplacement('ring1')} /> Ring 1: {equipment.ring1 ? ITEMS[equipment.ring1].name : 'Empty'}</label><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring2'} onChange={() => setRingReplacement('ring2')} /> Ring 2: {equipment.ring2 ? ITEMS[equipment.ring2].name : 'Empty'}</label></div>}
      {preview && !preview.compatible && <div className="equipment-incompatible"><strong>INCOMPATIBLE</strong><span>{preview.reason}</span></div>}
      {preview?.compatible && <div className="equipment-preview-impact"><span className="equipment-preview-label">LOADOUT IMPACT</span>{getImpactEntries(preview.impact).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([key, value]) => <div className="equipment-impact-row" key={key}><span className="equipment-stat-label">{friendlyStat(key)}</span><small className="equipment-stat-current equipment-stat-value">{formatSnapshotValue(key, preview.current)}</small><strong className="equipment-stat-value">{formatSnapshotValue(key, preview.preview!)}</strong><em className={`equipment-stat-delta ${(value ?? 0) > 0 ? 'positive' : 'negative'}`}>{formatSignedStat(key, value as number)}</em></div>)}</div>}
      {equippedPositions.length > 0 && <div className="equipment-current-position"><Status tone="success">EQUIPPED IN {equippedPositions.map((position) => EQUIPMENT_POSITION_LABELS[position]).join(' + ')}</Status></div>}
      <div className="equipment-inspector-actions"><Button variant="primary" disabled={!preview?.compatible || ringNeedsChoice || equippedPositions.includes(preview?.position ?? 'weapon')} onClick={() => selectedItemId && equipItem(selectedItemId, preview?.position ?? undefined)}>EQUIP</Button>{inspectorTargetPosition && equipment[inspectorTargetPosition] === selectedItemId && <Button variant="ghost" onClick={() => unequipItem(inspectorTargetPosition)}>UNEQUIP {EQUIPMENT_POSITION_LABELS[inspectorTargetPosition].toUpperCase()}</Button>}</div>
    </>}
  </InspectorTransition></Card>

  return <div className="screen-content equipment-screen"><div className="screen-header"><div><div className="eyebrow">WIZARD LOADOUT · EQUIPMENT</div><h1>Build the tower’s answer.</h1><p>Eight equipment positions, owned gear, and honest loadout impact. Two-handed weapons trade away the Offhand.</p></div></div><EditableGrid screen="equipment" layoutTransform={layoutTransform} panels={[{ id: 'equipment-loadout', content: loadout }, { id: 'equipment-stats', content: statsPanel }, { id: 'equipment-owned', content: armory }, { id: 'equipment-inspector', content: inspector }]} /></div>
}

export const EquipmentScreen = EquipmentScreenV2

function EquipmentSlotTooltip({ itemId, owned, tooltip, children }: { itemId: ItemId | null; owned: number; tooltip: { title: string; description: ReactNode }; children: ReactNode }) {
  return itemId ? <ItemTooltip itemId={itemId} owned={owned} equipped>{children}</ItemTooltip> : <GameTooltip block content={<TooltipContent title={tooltip.title} description={tooltip.description} />}>{children}</GameTooltip>
}

function MeasuredEquipmentCard({ children, onHeightChange, ...props }: { children: ReactNode; onHeightChange: (height: number) => void; className?: string; title?: string; action?: ReactNode; style?: React.CSSProperties }) {
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

function StatGroup({ title, rows, basicAttackIntervalMs }: { title: string; rows: [string, string][]; basicAttackIntervalMs?: number }) {
  if (rows.length === 0) return null
  return <section className="equipment-stat-group"><span>{title}</span>{rows.map(([label, value]) => {
    const descriptions: Record<string, string> = { 'Spell Power': "Determines the base magnitude of damaging, healing, Barrier, and Spell-applied damage-over-time effects according to each Spell's authored Scaling coefficient.", Defense: 'A rating that reduces Direct Hit damage with diminishing returns. Damage over Time ignores Defense.', 'Damage Reduction': 'Current Direct Hit reduction produced by Defense. Damage over Time ignores Defense.', 'Crit Chance': 'Chance for a Direct Hit to critically strike. Damage over Time, Healing and Barrier effects cannot Crit.', 'Crit Damage': 'Damage multiplier applied to a Critical Direct Hit. 150% means 1.5× damage before target mitigation.', 'Basic Attack Speed': `Current Basic Attack rate multiplier. Current Basic Attack Time: ${formatBasicAttackTime(basicAttackIntervalMs ?? 0)}.`, 'Block Chance': `Chance for a Direct Hit to be Blocked. A successful Block currently reduces that hit by ${Math.round(BLOCK_DAMAGE_REDUCTION * 100)}%. Damage over Time cannot be Blocked.`, 'Damage over Time': 'Increases periodic DoT damage. Does not increase direct hits.', 'Status Duration': 'Increases the duration of Statuses you apply, including DoTs, buffs, debuffs and control effects.', 'Cooldown Recovery': 'Increases the rate at which Spell cooldowns recover.', 'Healing Done': 'Increases healing produced by your effects.', 'Barrier Power': 'Increases Barrier generated by your effects.', 'Mana Cost Reduction': 'Reduces Spell Mana costs, subject to the current 80% cap.', 'Focus Efficiency': 'Reduces Auto-Cast Focus reservation costs, subject to the current 80% cap.' }
    const resistanceDescription = label.endsWith(' Resistance') ? `Reduces damage of this type. Ordinary Resistance is capped at ${Math.round(MAX_RESISTANCE * 100)}%. Negative Resistance increases damage taken.` : undefined
    const extraDescriptions: Record<string, string> = { 'Fire Spell Damage': 'Additional damage for Fire spells only.', 'Air Spell Damage': 'Additional damage for Air spells only.', 'Received Negative Status Duration': 'Changes the duration of debuffs applied to you. Positive buffs are unaffected.', 'Water Barrier Power': 'Additional Barrier power for Water spells that generate Barrier.', 'Barrier Received': 'Flat Barrier capacity added whenever you gain Barrier.' }
    const content = descriptions[label] || resistanceDescription || extraDescriptions[label] ? <TooltipContent title={label} description={descriptions[label] ?? resistanceDescription ?? extraDescriptions[label]} /> : null
    const row = <EquipmentStatRow key={label} label={label} value={value} />
    return content ? <GameTooltip block key={label} content={content}>{row}</GameTooltip> : row
  })}</section>
}

function EquipmentStatRow({ label, value }: { label: string; value: string }) {
  return <div className="equipment-stat-row-shell"><div tabIndex={0} className="equipment-stat-row" data-stat-label={label}><span className="equipment-stat-label">{label}</span><strong className="equipment-stat-value">{value}</strong></div></div>
}

function friendlyStat(key: string) {
  return ({ maxHealth: 'Max Health', maxMana: 'Max Mana', maxFocus: 'Max Focus', manaRegen: 'Mana Regen', basicDamage: 'Basic Attack Damage', spellPower: 'Spell Power', basicAttackSpeedPct: 'Basic Attack Speed', critChance: 'Crit Chance', critDamage: 'Crit Damage', defense: 'Defense', damageReduction: 'Damage Reduction', blockChance: 'Block Chance', damageOverTimePct: 'Damage over Time', statusDurationPct: 'Status Duration', cooldownRecoveryPct: 'Cooldown Recovery', healingDonePct: 'Healing Done', barrierPowerPct: 'Barrier Power', manaCostReductionPct: 'Mana Cost Reduction', focusEfficiencyPct: 'Focus Efficiency', fireSpellDamage: 'Fire Spell Damage', airSpellDamage: 'Air Spell Damage', waterBarrierPower: 'Water Barrier Power', barrierReceivedFlat: 'Barrier Received', negativeStatusDurationReceived: 'Received Negative Status Duration' } as Record<string, string>)[key] ?? key.replace(/^resistance-/, '').replace(/^./, (value) => value.toUpperCase()) + (key.startsWith('resistance-') ? ' Resistance' : '')
}

function formatSnapshotValue(key: string, snapshot: ReturnType<typeof getEquipmentStatSnapshot>) {
  const snapshotKey: Record<string, keyof ReturnType<typeof getEquipmentStatSnapshot>> = { basicAttackSpeedPct: 'basicAttackSpeedMultiplier', critDamage: 'critDamageMultiplier', damageOverTimePct: 'damageOverTimeBonus', statusDurationPct: 'statusDurationBonus', cooldownRecoveryPct: 'cooldownRecovery', healingDonePct: 'healingDoneBonus', barrierPowerPct: 'barrierPowerBonus', manaCostReductionPct: 'manaCostReduction', focusEfficiencyPct: 'focusEfficiency', fireSpellDamage: 'fireSpellDamage', airSpellDamage: 'airSpellDamage', waterBarrierPower: 'waterBarrierPower', barrierReceivedFlat: 'barrierReceivedFlat', negativeStatusDurationReceived: 'negativeStatusDurationReceived' }
  const value = key.startsWith('resistance-')
    ? Number((snapshot.resistances as Record<string, number>)[key.replace('resistance-', '')] ?? 0)
    : Number(snapshot[snapshotKey[key] ?? (key as keyof ReturnType<typeof getEquipmentStatSnapshot>)] ?? 0)
  if (key === 'damageReduction') return `${(value * 100).toFixed(1)}%`
  if (key.endsWith('Pct') || ['critChance', 'blockChance', 'damageOverTimeBonus', 'statusDurationBonus', 'healingDoneBonus', 'barrierPowerBonus', 'manaCostReduction', 'focusEfficiency', 'fireSpellDamage', 'airSpellDamage', 'waterBarrierPower', 'negativeStatusDurationReceived'].includes(key) || key.startsWith('resistance-')) return `${Math.round(value * 100)}%`
  if (key === 'manaRegen') return `${value.toFixed(1)}/s`
  if (key === 'basicAttackSpeedPct' || key === 'cooldownRecovery') return `${value.toFixed(2)}x`
  if (key === 'critDamage') return `${Math.round(value * 100)}%`
  return String(Math.round(value * 100) / 100)
}

function formatSignedStat(key: string, value: number) {
  const sign = value > 0 ? '+' : ''
  return key === 'damageReduction' ? `${sign}${(value * 100).toFixed(1)}%` : key.endsWith('Pct') || ['critChance', 'critDamage', 'blockChance', 'fireSpellDamage', 'airSpellDamage', 'waterBarrierPower', 'negativeStatusDurationReceived'].includes(key) || key.startsWith('resistance-') ? `${sign}${Math.round(value * 100)}%` : key === 'manaRegen' ? `${sign}${value.toFixed(1)}/s` : key === 'basicAttackSpeedPct' || key === 'cooldownRecoveryPct' ? `${sign}${value.toFixed(2)}x` : `${sign}${Math.round(value * 100) / 100}`
}

const getImpactEntries = (impact: ReturnType<typeof getEquipmentPreview>['impact']): Array<[string, number]> => Object.entries(impact).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([damageType, resistance]) => [`resistance-${damageType}`, Number(resistance)]) : [[key, Number(value)]])
const flattenItemStats = (stats: NonNullable<import('../../game/types').ItemDefinition['stats']> | undefined): Array<[string, number]> => Object.entries(stats ?? {}).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)]) : [[key, Number(value)]])
