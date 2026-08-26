import { ArrowRight, Check, LockKeyhole, PackageOpen, ShieldCheck, Unlock } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Button, Status } from '../../components/ui'
import { ItemIcon, ItemQuantity } from '../../components/ui/item'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { GameState, ItemId, SchoolId, ScreenId } from '../../game/types'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { getInventoryCategoryLabel, getInventorySubcategoryLabel, getItemProcessingChain, getItemSourceDestination, getItemUses } from './inventoryMetadata'
import { getEquipmentComparison } from './inventoryEquipmentComparison'
import { formatFlowEta, formatItemFlowRate, getItemFlow, getItemNeeds, type ItemEconomyState, type ItemFlow, type ItemNeed } from './inventoryEconomy'

export function InventoryDetail({ itemId, inventory, protectedItems, equipment, economyState, toggleProtection, equipItem, navigate }: { itemId: ItemId | null; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; economyState?: ItemEconomyState; toggleProtection: (itemId: ItemId) => void; equipItem: (itemId: ItemId) => void; navigate?: (screen: ScreenId) => void }) {
  if (!itemId) return <div className="inventory-detail-empty"><PackageOpen size={28} aria-hidden="true" /><strong>SELECT AN ITEM</strong><span>Choose an item from the Vault to inspect its source, uses, and protection.</span></div>
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  const source = getItemSourceDestination(itemId)
  const uses = getItemUses(itemId)
  const equippedId = item.equipmentSlot ? equipment[item.equipmentSlot] : null
  const comparison = item.kind === 'equipment' ? getEquipmentComparison(item, equippedId ? ITEMS[equippedId] : null) : []
  const category = getInventorySubcategoryLabel(itemId) ? `${getInventorySubcategoryLabel(itemId)} Material` : getInventoryCategoryLabel(itemId)
  const processingChain = getItemProcessingChain(itemId).filter((chainItem) => Boolean(ITEMS[chainItem]))
  const flow = economyState ? getItemFlow(itemId, economyState) : null
  const needs = economyState ? getItemNeeds(itemId, economyState) : []

  return <div className={`inventory-detail-content inventory-detail-${item.inventoryCategory}`} style={{ '--detail-accent': item.color } as CSSProperties}>
    <div className="inventory-detail-hero"><div className="inventory-detail-icon"><ItemIcon itemId={itemId} size="large" /></div><div className="inventory-detail-title"><span className="inventory-detail-category">{category}{item.equipmentSlot ? ` · ${formatSlot(item.equipmentSlot)}` : ''}</span><h2>{item.name}</h2><div className="inventory-detail-badges">{equipped ? <Status tone="success"><Check size={12} /> Equipped</Status> : protectedItem ? <Status tone="warning"><LockKeyhole size={12} /> Protected</Status> : <Status>Available</Status>}</div></div></div>
    <div className="inventory-detail-owned"><span>OWNED</span><ItemQuantity value={quantity} /></div>
    <p className="inventory-detail-description">{item.description}</p>

    {flow && <FlowSection flow={flow} />}
    {needs.length > 0 && <NeedsSection needs={needs} navigate={navigate} />}

    {item.stats && Object.keys(item.stats).length > 0 && <section className="inventory-detail-section"><span className="inventory-detail-label">STATS</span><div className="inventory-stat-list">{Object.entries(item.stats).filter(([, value]) => value !== 0).map(([key, value]) => <DetailRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div></section>}

    {item.kind === 'equipment' && <section className="inventory-detail-section"><span className="inventory-detail-label">EQUIPMENT COMPARISON</span>{equippedId ? <><div className="inventory-comparison-current"><span>CURRENT</span><strong>{ITEMS[equippedId].name}</strong></div><div className="inventory-comparison-head"><span>STAT</span><span>CURRENT</span><span>SELECTED</span><span>DELTA</span></div><div className="inventory-comparison-list">{comparison.map((row) => <div className="inventory-comparison-row" key={row.key}><span>{row.label}</span><small>{row.equippedValue}</small><strong>{row.selectedValue}</strong><em className={row.direction}>{row.delta}</em></div>)}</div></> : <p className="inventory-muted-note">No item currently equipped in this slot. This item's bonuses are additions.</p>}</section>}

    <section className="inventory-detail-section"><span className="inventory-detail-label">SOURCE</span><div className="inventory-detail-source"><span>{getItemSourceLabel(itemId)}</span>{source && <Button variant="ghost" className="inventory-detail-go" ariaLabel={`Go to ${source.label}`} onClick={() => navigate?.(source.destination)}>GO <ArrowRight size={13} /></Button>}</div></section>

    {processingChain.length > 1 && <section className="inventory-detail-section"><span className="inventory-detail-label">PROCESSING CHAIN</span><div className="inventory-processing-chain">{processingChain.map((chainItem, index) => <span key={chainItem}><strong>{ITEMS[chainItem].name}</strong>{index < processingChain.length - 1 && <ArrowRight size={13} aria-hidden="true" />}</span>)}</div></section>}

    {item.researchSchool && <section className="inventory-detail-section"><span className="inventory-detail-label">RESEARCH VALUE</span><div className="inventory-research-values">{(Object.keys(SCHOOLS) as SchoolId[]).map((schoolId) => <DetailRow key={schoolId} label={SCHOOLS[schoolId].name} value={`${getResearchXp(itemId, schoolId)} XP`} />)}</div><Button variant="ghost" className="inventory-inline-action" onClick={() => navigate?.('tower-research')}>GO TO RESEARCH <ArrowRight size={13} /></Button></section>}

    {uses.length > 0 && <section className="inventory-detail-section"><span className="inventory-detail-label">USED IN</span><div className="inventory-use-list">{uses.map((use) => <button type="button" className="inventory-use-row" key={`${use.destination}-${use.label}`} onClick={() => navigate?.(use.destination)}><span><strong>{use.label}</strong><small>{use.detail}</small></span><ArrowRight size={14} aria-hidden="true" /></button>)}</div></section>}

    <section className="inventory-detail-section inventory-detail-actions"><span className="inventory-detail-label">ACTIONS</span><div className="inventory-action-row">{item.kind === 'equipment' && (equipped ? <Button variant="success" disabled ariaLabel={`${item.name} is equipped`}><Check size={14} /> EQUIPPED</Button> : <Button onClick={() => equipItem(itemId)} disabled={quantity <= 0}>EQUIP</Button>)}{equipped ? <div className="inventory-equipped-note"><span><LockKeyhole size={14} /> Equipped items are automatically protected.</span></div> : <Button variant={protectedItem ? 'success' : 'secondary'} onClick={() => toggleProtection(itemId)} tooltip={<span>Protect from Research, Transmutation, and Guild consumption.</span>}>{protectedItem ? <><Unlock size={14} /> UNPROTECT</> : <><ShieldCheck size={14} /> PROTECT</>}</Button>}</div>{protectedItem && !equipped && <p className="inventory-protection-note">PROTECTED · This item cannot be consumed by Research, Transmutation, or Guild donations.</p>}</section>
  </div>
}

function FlowSection({ flow }: { flow: ItemFlow }) {
  return <section className="inventory-detail-section inventory-flow-section"><span className="inventory-detail-label">CURRENT FLOW</span>{flow.production.length > 0 && <div className="inventory-flow-group"><small>PRODUCTION</small>{flow.production.map((source) => <FlowRow key={`production-${source.label}`} label={source.label} value={formatItemFlowRate(source.ratePerHour)} />)}</div>}{flow.consumption.length > 0 && <div className="inventory-flow-group"><small>CONSUMPTION</small>{flow.consumption.map((source) => <FlowRow key={`consumption-${source.label}`} label={source.label} value={formatItemFlowRate(-source.ratePerHour)} />)}</div>}<FlowRow label="NET FLOW" value={formatItemFlowRate(flow.netPerHour)} emphasis />{flow.depletionEtaMs !== null && <FlowRow label="DEPLETES IN" value={formatFlowEta(flow.depletionEtaMs) ?? '-'} emphasis />}</section>
}

function NeedsSection({ needs, navigate }: { needs: ItemNeed[]; navigate?: (screen: ScreenId) => void }) {
  return <section className="inventory-detail-section inventory-needs-section"><span className="inventory-detail-label">CURRENT NEEDS</span><div className="inventory-needs-list">{needs.map((entry) => <button type="button" className="inventory-need-row" key={entry.id} onClick={() => navigate?.(entry.destination)}><span className="inventory-need-copy"><strong>{entry.label}</strong><small>{entry.detail} · {entry.owned.toLocaleString()} / {entry.required.toLocaleString()}{entry.status === 'MISSING' ? ` · Missing ${entry.missing.toLocaleString()}` : ''}</small></span><span className={`inventory-need-status inventory-need-${entry.status.toLowerCase()}`}>{entry.status === 'MISSING' && entry.readyInMs !== null ? `READY IN ${formatFlowEta(entry.readyInMs)}` : entry.status}</span><ArrowRight size={14} aria-hidden="true" /></button>)}</div></section>
}

function FlowRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <span className={`inventory-flow-row ${emphasis ? 'emphasis' : ''}`}><span>{label}</span><strong>{value}</strong></span> }
function DetailRow({ label, value }: { label: string; value: ReactNode }) { return <span className="inventory-detail-row"><span>{label}</span><strong>{value}</strong></span> }
function formatSlot(slot: string) { return slot.charAt(0).toUpperCase() + slot.slice(1) }
