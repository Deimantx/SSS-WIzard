import { LockKeyhole, Shield, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import { EQUIPMENT_ITEM_SLOT_LABELS, EQUIPMENT_POSITION_LABELS, getEquippedCount, getItemPositions, isTwoHandedWeapon } from '../../game/core/equipment'
import type { EquipmentItemSlot, EquipmentPosition, ItemId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { getEquipmentPreview, getEquipmentStatSnapshot } from './equipmentPreview'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'

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
  const stateForPreview = { player, progress, activities, debug, equipment }
  const ownedEquipment = useMemo(() => (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'equipment' && (inventory[id] ?? 0) > 0), [inventory])
  const visibleEquipment = useMemo(() => ownedEquipment.filter((id) => (filter === 'all' || ITEMS[id].equipmentSlot === filter) && (filter !== 'weapon' || weaponHandsFilter === 'all' || ITEMS[id].weaponHands === weaponHandsFilter)), [ownedEquipment, filter, weaponHandsFilter])
  const selectedItem = selectedItemId ? ITEMS[selectedItemId] : null
  const targetPosition = selectedItem?.equipmentSlot === 'ring'
    ? ringReplacement ?? (selectedPosition === 'ring1' || selectedPosition === 'ring2' ? selectedPosition : equipment.ring1 ? equipment.ring2 ? undefined : 'ring2' : 'ring1')
    : selectedPosition
  const preview = selectedItemId ? getEquipmentPreview(stateForPreview, selectedItemId, targetPosition) : null
  const statSnapshot = getEquipmentStatSnapshot(stateForPreview, equipment)
  const equippedCount = getEquippedCount({ equipment })
  const equippedPositions = selectedItemId ? getItemPositions(selectedItemId).filter((position) => equipment[position] === selectedItemId) : []
  const ringNeedsChoice = selectedItem?.equipmentSlot === 'ring' && !ringReplacement && Boolean(equipment.ring1 && equipment.ring2) && selectedPosition !== 'ring1' && selectedPosition !== 'ring2'

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

  const loadout = <Card title="WIZARD LOADOUT" action={<Status tone="success">{equippedCount} / 8 EQUIPPED</Status>}>
    <div className="equipment-loadout-board">
      {LOADOUT_VISUAL_ORDER.map((position) => {
        const itemId = equipment[position]
        const item = itemId ? ITEMS[itemId] : null
        const locked = position === 'offhand' && isTwoHandedWeapon(equipment.weapon)
        const emptyCopy = locked ? 'Blocked by 2H Weapon' : position === 'ring1' || position === 'ring2' ? 'Select Ring' : `Select ${EQUIPMENT_POSITION_LABELS[position]}`
        const tooltip = SLOT_TOOLTIP_COPY[position]
        return <div className="equipment-slot-grid-item" data-position={position} key={position}>
          <GameTooltip block content={<TooltipContent title={tooltip.title} description={tooltip.description} />}>
            <div className={`equipment-slot-card ${selectedPosition === position ? 'selected' : ''} ${locked ? 'locked' : ''}`} data-position={position} role="button" tabIndex={0} onClick={() => selectSlot(position)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSlot(position) } }}>
              <div className="equipment-slot-card-head"><span>{EQUIPMENT_POSITION_LABELS[position]}</span>{item && <small>{item.weaponHands ? `${item.weaponHands}H` : 'EQUIPPED'}</small>}</div>
              {locked ? <div className="equipment-slot-lock"><LockKeyhole size={17} /><strong>{emptyCopy}</strong></div> : item ? <div className="equipment-slot-card-item"><span className="equipment-slot-icon" style={{ color: item.color }}>{item.icon}</span><strong>{item.name}</strong><small>{Object.entries(item.stats ?? {}).filter(([, value]) => value !== 0).map(([key, value]) => `${formatStat(key, value)} ${friendlyStatLabel(key)}`).join(' · ') || 'Ready'}</small></div> : <div className="equipment-slot-empty"><span>+</span><small>{emptyCopy}</small></div>}
            </div>
          </GameTooltip>
        </div>
      })}
    </div>
    <p className="equipment-loadout-note">Select an empty slot to filter compatible gear. More slots may be added later.</p>
  </Card>

  const statsPanel = <Card title="WIZARD STATS" action={<Sparkles size={16} color="var(--gold)" />}>
    <div className="equipment-stat-groups">
      <StatGroup title="CORE" rows={[['Max Health', String(statSnapshot.maxHealth)], ['Max Mana', String(statSnapshot.maxMana)], ['Max Focus', String(statSnapshot.maxFocus)], ['Passive Mana Regen', `+${statSnapshot.manaRegen.toFixed(1)}/s`]]} />
      <StatGroup title="OFFENSE" rows={[['Spell Power', String(statSnapshot.spellPower)], ['Basic Attack Damage', String(statSnapshot.basicDamage)]]} />
      <StatGroup title="DEFENSE" rows={statSnapshot.barrierReceived ? [['Barrier Received', `+${statSnapshot.barrierReceived}`]] : []} />
      <StatGroup title="MAGIC" rows={[['Fire Spell Damage', statSnapshot.fireSpellDamagePct], ['Water Barrier Strength', statSnapshot.waterBarrierPct], ['Earth Spell Damage', statSnapshot.earthSpellDamagePct], ['Air Spell Damage', statSnapshot.airSpellDamagePct]].filter(([, value]) => value !== 0).map(([label, value]) => [String(label), `+${Math.round(Number(value) * 100)}%`])} />
    </div>
    <div className="equipment-note"><Shield size={15} /><span>Equipped copies remain reserved from Research, Transmutation, Guild donation, Sell, and Destroy.</span></div>
  </Card>

  const armory = <Card title="ARMORY" action={<span className="equipment-armory-count">{ownedEquipment.length} OWNED TYPES</span>}>
    <div className="equipment-filter-bar" role="tablist" aria-label="Equipment filters">{ARMORY_FILTERS.map((entry) => <button type="button" role="tab" aria-selected={filter === entry.id} className={filter === entry.id ? 'active' : ''} key={entry.id} onClick={() => { setFilter(entry.id); if (entry.id !== 'all' && entry.id !== 'ring') setSelectedPosition(entry.id) }}>{entry.label}</button>)}</div>
    {filter === 'weapon' && <div className="equipment-weapon-badges"><button type="button" className={weaponHandsFilter === 'all' ? 'active' : ''} onClick={() => setWeaponHandsFilter('all')}>ALL</button><button type="button" className={weaponHandsFilter === 1 ? 'active' : ''} onClick={() => setWeaponHandsFilter(1)}>1H</button><button type="button" className={weaponHandsFilter === 2 ? 'active' : ''} onClick={() => setWeaponHandsFilter(2)}>2H</button></div>}
    {visibleEquipment.length === 0 ? <div className="equipment-empty-armory"><strong>NO {EMPTY_FILTER_LABELS[filter]} OWNED</strong><small>Future equipment will appear here.</small></div> : <div className="equipment-armory-grid">{visibleEquipment.map((id) => { const item = ITEMS[id]; const selected = id === selectedItemId; const equipped = getItemPositions(id).some((position) => equipment[position] === id); return <button type="button" className={`equipment-armory-card ${selected ? 'selected' : ''} ${equipped ? 'equipped' : ''}`} key={id} onClick={() => selectArmoryItem(id)}><span className="equipment-armory-icon" style={{ color: item.color }}>{item.icon}</span><span className="equipment-armory-copy"><strong>{item.name}</strong><small>{item.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[item.equipmentSlot] : 'Equipment'}</small></span>{item.weaponHands && <Status tone="warning">{item.weaponHands}H</Status>}{equipped && <Status tone="success">EQUIPPED</Status>}</button> })}</div>}
  </Card>

  const inspector = <Card title="GEAR INSPECTOR" className="equipment-inspector">
    {!selectedItem ? <div className="equipment-inspector-empty"><strong>SELECT GEAR</strong><small>Choose an item from the Armory to compare its real loadout impact.</small></div> : <>
      <div className="equipment-inspector-hero"><span className="equipment-inspector-icon" style={{ color: selectedItem.color }}>{selectedItem.icon}</span><div><div className="eyebrow">{selectedItem.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[selectedItem.equipmentSlot] : 'EQUIPMENT'}</div><h3>{selectedItem.name}</h3><p>{selectedItem.description}</p></div></div>
      {selectedItem.weaponHands && <div className="equipment-hands"><span>WEAPON TYPE</span><strong>{selectedItem.weaponHands === 2 ? 'Two-Handed' : 'One-Handed'}</strong></div>}
      {preview?.removedOffhand && <div className="equipment-impact-warning"><LockKeyhole size={14} /><span>{ITEMS[preview.removedOffhand].name} will be unequipped automatically.</span></div>}
      {ringNeedsChoice && <div className="equipment-ring-replace"><strong>REPLACE</strong><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring1'} onChange={() => setRingReplacement('ring1')} /> Ring 1: {equipment.ring1 ? ITEMS[equipment.ring1].name : 'Empty'}</label><label><input type="radio" name="ring-replacement" checked={ringReplacement === 'ring2'} onChange={() => setRingReplacement('ring2')} /> Ring 2: {equipment.ring2 ? ITEMS[equipment.ring2].name : 'Empty'}</label></div>}
      {preview && !preview.compatible && <div className="equipment-incompatible"><strong>INCOMPATIBLE</strong><span>{preview.reason}</span></div>}
      {preview?.compatible && <div className="equipment-preview-impact"><span className="equipment-preview-label">LOADOUT IMPACT</span>{Object.entries(preview.impact).filter(([, value]) => Math.abs(value ?? 0) > 0.0001).map(([key, value]) => <div className="equipment-impact-row" key={key}><span>{friendlyStat(key)}</span><small>{formatSnapshotValue(key, preview.current)}</small><strong>{formatSnapshotValue(key, preview.preview!)}</strong><em className={(value ?? 0) > 0 ? 'positive' : 'negative'}>{formatSignedStat(key, value as number)}</em></div>)}</div>}
      {equippedPositions.length > 0 && <div className="equipment-current-position"><Status tone="success">EQUIPPED IN {equippedPositions.map((position) => EQUIPMENT_POSITION_LABELS[position]).join(' + ')}</Status></div>}
      <div className="equipment-inspector-actions"><Button variant="primary" disabled={!preview?.compatible || ringNeedsChoice || equippedPositions.includes(preview?.position ?? 'weapon')} onClick={() => selectedItemId && equipItem(selectedItemId, preview?.position ?? undefined)}>EQUIP</Button>{equipment[selectedPosition] && <Button variant="ghost" onClick={() => unequipItem(selectedPosition)}>UNEQUIP {EQUIPMENT_POSITION_LABELS[selectedPosition].toUpperCase()}</Button>}</div>
    </>}
  </Card>

  return <div className="screen-content equipment-screen"><div className="screen-header"><div><div className="eyebrow">WIZARD LOADOUT · EQUIPMENT</div><h1>Build the tower’s answer.</h1><p>Eight equipment positions, owned gear, and honest loadout impact. Two-handed weapons trade away the Offhand.</p></div></div><EditableGrid screen="equipment" panels={[{ id: 'equipment-loadout', content: loadout }, { id: 'equipment-stats', content: statsPanel }, { id: 'equipment-owned', content: armory }, { id: 'equipment-inspector', content: inspector }]} /></div>
}

export const EquipmentScreen = EquipmentScreenV2

function StatGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  if (rows.length === 0) return null
  return <section className="equipment-stat-group"><span>{title}</span>{rows.map(([label, value]) => {
    const content = label === 'Spell Power' ? <TooltipContent title="Spell Power" description="Determines the base magnitude of damaging, healing, Barrier, and Spell-applied damage-over-time effects according to each Spell's authored Scaling coefficient." /> : null
    const row = <div key={label}><small>{label}</small><strong>{value}</strong></div>
    return content ? <GameTooltip block key={label} content={content}>{row}</GameTooltip> : row
  })}</section>
}

function friendlyStat(key: string) {
  return ({ maxHealth: 'Max Health', maxMana: 'Max Mana', maxFocus: 'Max Focus', manaRegen: 'Passive Mana Regen', basicDamage: 'Basic Attack Damage', spellPower: 'Spell Power', barrierReceived: 'Barrier Received', fireSpellDamagePct: 'Fire Spell Damage', waterBarrierPct: 'Water Barrier Strength', earthSpellDamagePct: 'Earth Spell Damage', airSpellDamagePct: 'Air Spell Damage' } as Record<string, string>)[key] ?? key
}

function formatSnapshotValue(key: string, snapshot: ReturnType<typeof getEquipmentStatSnapshot>) {
  const value = snapshot[key as keyof ReturnType<typeof getEquipmentStatSnapshot>] as number
  return key.endsWith('Pct') ? `${Math.round(value * 100)}%` : key === 'manaRegen' ? `${value.toFixed(1)}/s` : String(Math.round(value * 100) / 100)
}

function formatSignedStat(key: string, value: number) {
  const sign = value > 0 ? '+' : ''
  return key.endsWith('Pct') ? `${sign}${Math.round(value * 100)}%` : key === 'manaRegen' ? `${sign}${value.toFixed(1)}/s` : `${sign}${Math.round(value * 100) / 100}`
}
