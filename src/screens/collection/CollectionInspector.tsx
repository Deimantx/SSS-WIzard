import { ArrowRight, PackageOpen } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../components/ui/item'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { GameState, ItemId, SchoolId, ScreenId } from '../../game/types'
import { EQUIPMENT_ITEM_SLOT_LABELS } from '../../game/core/equipment'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { getInventoryCategoryLabel, getInventorySubcategoryLabel, getItemSourceDestination, getItemUses } from '../inventory/inventoryMetadata'

interface CollectionInspectorProps {
  itemId: ItemId | null
  inventory: Partial<Record<ItemId, number>>
  progress: GameState['progress']
  navigate: (screen: ScreenId) => void
}

export function CollectionInspector({ itemId, inventory, progress, navigate }: CollectionInspectorProps) {
  if (!itemId) return <Card title="ITEM INSPECTION" className="collection-inspector"><EmptyInspector text="Select an item to inspect its archive record." /></Card>
  const item = ITEMS[itemId]
  if (!item) return <Card title="ITEM INSPECTION" className="collection-inspector"><EmptyInspector text="This item is no longer part of the authored archive." /></Card>
  if (!progress.discoveredItems.includes(itemId)) return <Card title="ITEM INSPECTION" className="collection-inspector"><div className="collection-inspector-empty"><span className="collection-unknown-mark">?</span><strong>UNDISCOVERED ITEM</strong><span>Acquire this item once to permanently reveal its archive entry.</span></div></Card>

  const quantity = inventory[itemId] ?? 0
  const subcategory = getInventorySubcategoryLabel(itemId)
  const category = subcategory ? `${subcategory} Material` : getInventoryCategoryLabel(itemId)
  const source = getItemSourceDestination(itemId)
  const uses = getItemUses(itemId)

  return <Card title="ITEM INSPECTION" className="collection-inspector"><div className="collection-inspector-scroll" style={{ '--collection-accent': item.color } as CSSProperties}>
    <div className="collection-inspector-hero"><div className="collection-inspector-icon"><ItemIcon itemId={itemId} size="large" /></div><div><span className="collection-inspector-category">{category}{item.equipmentSlot ? ` · ${EQUIPMENT_ITEM_SLOT_LABELS[item.equipmentSlot]}` : ''}</span><h2>{item.name}</h2><Status tone="success">Discovered</Status></div></div>
    <div className="collection-owned"><span>OWNED NOW</span><ItemQuantity value={quantity} /></div>
    <p className="collection-description">{item.description}</p>
    {source && <section className="collection-inspector-section"><span className="collection-section-label">SOURCE</span><div className="collection-source"><span>{getItemSourceLabel(itemId)}</span><Button variant="ghost" ariaLabel={`Go to ${source.label}`} tooltip={<TooltipContent title={`Open ${source.label}`} description="Navigate to the system that produces this item." />} onClick={() => navigate(source.destination)}>GO <ArrowRight size={13} /></Button></div></section>}
    {item.researchSchool && <section className="collection-inspector-section"><span className="collection-section-label">RESEARCH VALUE</span><div className="collection-value-list">{(Object.keys(SCHOOLS) as SchoolId[]).map((schoolId) => <DetailRow key={schoolId} label={SCHOOLS[schoolId].name} value={`${getResearchXp(itemId, schoolId)} XP`} />)}</div></section>}
    {item.stats && Object.keys(item.stats).length > 0 && <section className="collection-inspector-section"><span className="collection-section-label">STATS</span><div className="collection-value-list">{Object.entries(item.stats).filter(([, value]) => value !== 0).map(([key, value]) => <DetailRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div></section>}
    {item.kind === 'equipment' && <section className="collection-inspector-section"><span className="collection-section-label">EQUIPMENT</span><DetailRow label="Slot" value={item.equipmentSlot ? EQUIPMENT_ITEM_SLOT_LABELS[item.equipmentSlot] : '—'} />{item.weaponHands && <DetailRow label="Weapon" value={`${item.weaponHands}H`} />}</section>}
    {uses.length > 0 && <section className="collection-inspector-section"><span className="collection-section-label">USED IN</span><div className="collection-use-list">{uses.map((use) => <GameTooltip block key={`${use.destination}-${use.label}`} content={<TooltipContent title={`Open ${use.label}`} description="Navigate to the system that uses this item." />}><button type="button" aria-label={`Open ${use.label}`} onClick={() => navigate(use.destination)}><span><strong>{use.label}</strong><small>{use.detail}</small></span><ArrowRight size={14} /></button></GameTooltip>)}</div></section>}
    {item.sellValue !== null && <section className="collection-inspector-section"><DetailRow label="Sell value" value={`${item.sellValue} Gold`} /></section>}
  </div></Card>
}

function EmptyInspector({ text }: { text: string }) { return <div className="collection-inspector-empty"><PackageOpen size={28} aria-hidden="true" /><strong>SELECT AN ITEM</strong><span>{text}</span></div> }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="collection-detail-row"><span>{label}</span><strong>{value}</strong></div> }
