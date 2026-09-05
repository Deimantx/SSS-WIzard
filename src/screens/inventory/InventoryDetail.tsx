import { ArrowRight, Check, ChevronDown, ChevronRight, LockKeyhole, PackageOpen } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, EquipmentCombatDetails, Status } from '../../components/ui'
import { ItemIcon, ItemQuantity, ItemTooltip } from '../../components/ui/item'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { GameState, ItemId, SchoolId, ScreenId } from '../../game/types'
import { flattenItemStats, formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { getInventoryCategoryLabel, getInventorySubcategoryLabel, getItemProcessingChain, getItemSourceDestination, getItemUses } from '../../game/content/items/inventoryMetadata'
import { formatFlowEta, formatItemFlowRate, getItemFlow, type ItemFlow } from '../../game/systems/inventory/itemFlow'
import { type ItemEconomyState, type ItemNeed } from './inventoryEconomy'
import { getPinnedArtificingItemNeed } from './inventoryEconomy'
import { InventoryActions } from './InventoryActions'
import { ItemUsesDialog } from '../../components/ui/item/ItemUsesDialog'
import { EQUIPMENT_ITEM_SLOT_LABELS, getItemPositions } from '../../game/core/equipment'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { getResearchReservedQuantity } from '../../game/systems/research/researchReservations'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { getEquipmentPreview, type EquipmentPreview } from '../../game/presentation/equipment/equipmentReadModel'
import { useGameStore } from '../../store/gameStore'

type DetailAccordionKey = 'source' | 'researchValue'
type DetailAccordionState = Record<DetailAccordionKey, boolean>

export function InventoryDetail({ itemId, inventory, protectedItems, equipment, economyState, navigate, toggleProtection, equipItem, sellItem, destroyItem }: { itemId: ItemId | null; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; economyState?: ItemEconomyState; navigate?: (screen: ScreenId) => void; toggleProtection?: (id: ItemId) => void; equipItem?: (id: ItemId) => void; sellItem?: (id: ItemId, quantity: number) => void; destroyItem?: (id: ItemId, quantity: number) => void }) {
  const detailScrollRef = useRef<HTMLDivElement>(null)
  const preferences = useUiPreferences()
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const [usesOpen, setUsesOpen] = useState(false)
  const [ringTarget, setRingTarget] = useState<'ring1' | 'ring2' | null>(null)
  const openSections: DetailAccordionState = { source: preferences.screenState.inventory.sourceOpen, researchValue: preferences.screenState.inventory.researchValueOpen }
  useSmartScrollState(detailScrollRef, { resetKey: itemId })
  useEffect(() => setUsesOpen(false), [itemId])
  useEffect(() => setRingTarget(null), [itemId])

  if (!itemId) return <div className="inventory-detail-empty"><PackageOpen size={28} aria-hidden="true" /><strong>SELECT AN ITEM</strong><span>Choose an item from the Vault to inspect its source, uses, and protection.</span></div>
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const researchReserved = economyState ? getResearchReservedQuantity(economyState, itemId) : 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  const source = getItemSourceDestination(itemId)
  const recipeUses = getItemUses(itemId).filter((use) => Boolean(use.recipeId))
  const equippedId = item.equipmentSlot ? getItemPositions(item).map((position) => equipment[position]).find(Boolean) ?? null : null
  const equipmentPreview = item.kind === 'equipment' ? getEquipmentPreview({ player, progress, activities, equipment, inventory }, itemId, ringTarget ?? undefined) : null
  const category = getInventorySubcategoryLabel(itemId) ? `${getInventorySubcategoryLabel(itemId)} Material` : getInventoryCategoryLabel(itemId)
  const processingChain = getItemProcessingChain(itemId).filter((chainItem) => Boolean(ITEMS[chainItem]))
  const flow = economyState ? getItemFlow(itemId, economyState) : null
  const pinnedNeed = getPinnedArtificingItemNeed(itemId, economyState, preferences.screenState.artificing.pinnedRecipeId)
  const sourceLabel = getItemSourceLabel(itemId)
  const toggleSection = (section: DetailAccordionKey) => { const key = section === 'source' ? 'sourceOpen' : 'researchValueOpen'; setUiPreferences({ screenState: { inventory: { [key]: !openSections[section] } } }) }

  return <div ref={detailScrollRef} className={`inventory-detail-content inventory-detail-${item.inventoryCategory} smart-scroll-region`} style={{ '--detail-accent': item.color } as CSSProperties}>
    <div className="inventory-detail-hero"><div className="inventory-detail-icon"><ItemIcon itemId={itemId} size="large" /></div><div className="inventory-detail-title"><span className="inventory-detail-category">{category}{item.equipmentSlot ? ` · ${EQUIPMENT_ITEM_SLOT_LABELS[item.equipmentSlot]}` : ''}</span><h2>{item.name}</h2><div className="inventory-detail-badges">{equipped ? <Status tone="success"><Check size={12} /> Equipped</Status> : protectedItem ? <Status tone="warning"><LockKeyhole size={12} /> Protected</Status> : <Status>Available</Status>}</div></div></div>
    <div className="inventory-detail-owned"><span>OWNED</span><ItemQuantity value={quantity} /></div>
    {researchReserved > 0 && <div className="inventory-detail-reserved"><span>PREPARED FOR RESEARCH</span><strong>×{researchReserved.toLocaleString()}</strong><small>Unavailable to selling, destruction, Guild donations, and Transmutation.</small></div>}
    <p className="inventory-detail-description">{item.description}</p>

    {economyState && toggleProtection && equipItem && sellItem && destroyItem && <InventoryActions itemId={itemId} inventory={inventory} protectedItems={protectedItems} equipment={equipment} activities={economyState.activities} toggleProtection={toggleProtection} equipItem={equipItem} sellItem={sellItem} destroyItem={destroyItem} contextActions={<div className="inventory-context-actions">{item.inventoryCategory === 'material' && recipeUses.length > 0 && <Button variant="secondary" onClick={() => setUsesOpen(true)}>VIEW RECIPES</Button>}{item.researchSchool && <Button variant="ghost" onClick={() => { setUiPreferences({ screenState: { research: { selectedItemId: itemId } } }); navigate?.('tower-research') }}>RESEARCH</Button>}{item.kind === 'equipment' && <Button variant="ghost" onClick={() => document.querySelector('.inventory-loadout-comparison')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>COMPARE</Button>}</div>} />}
    {pinnedNeed && <GoalSection need={pinnedNeed} navigate={navigate} />}

    {flow && <FlowSection flow={flow} />}

    {item.stats && Object.keys(item.stats).length > 0 && <section className="inventory-detail-section"><span className="inventory-detail-label">STATS</span><div className="inventory-stat-list">{flattenItemStats(item.stats).filter(([, value]) => value !== 0).map(([key, value]) => <DetailRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div></section>}
    {item.kind === 'equipment' && <EquipmentCombatDetails item={item} />}

    {item.kind === 'equipment' && <InventoryLoadoutComparison itemId={itemId} equippedId={equippedId} quantity={quantity} inventory={inventory} preview={equipmentPreview} ringTarget={ringTarget} onRingTargetChange={setRingTarget} />}
    {sourceLabel && <InventoryDetailSection section="source" title="SOURCE" count={1} open={openSections.source} onToggle={toggleSection}><div className="inventory-detail-source"><span>{sourceLabel}</span>{source && <Button variant="ghost" className="inventory-detail-go" ariaLabel={`Go to ${source.label}`} onClick={() => navigate?.(source.destination)}>GO <ArrowRight size={13} /></Button>}</div></InventoryDetailSection>}

    {processingChain.length > 1 && <section className="inventory-detail-section"><span className="inventory-detail-label">PROCESSING CHAIN</span><div className="inventory-processing-chain">{processingChain.map((chainItem, index) => <span key={chainItem}><strong>{ITEMS[chainItem].name}</strong>{index < processingChain.length - 1 && <ArrowRight size={13} aria-hidden="true" />}</span>)}</div></section>}

    {item.researchSchool && <InventoryDetailSection section="researchValue" title="RESEARCH VALUE" open={openSections.researchValue} onToggle={toggleSection}><div className="inventory-research-values">{(Object.keys(SCHOOLS) as SchoolId[]).map((schoolId) => <DetailRow key={schoolId} label={SCHOOLS[schoolId].name} value={`${getResearchXp(itemId, schoolId)} XP`} />)}</div><Button variant="ghost" className="inventory-inline-action" onClick={() => navigate?.('tower-research')}>GO TO RESEARCH <ArrowRight size={13} /></Button></InventoryDetailSection>}

    <ItemUsesDialog itemId={itemId} uses={recipeUses} open={usesOpen} onClose={() => setUsesOpen(false)} />

  </div>
}

function InventoryDetailSection({ section, title, count, open, onToggle, children }: { section: DetailAccordionKey; title: string; count?: number; open: boolean; onToggle: (section: DetailAccordionKey) => void; children: ReactNode }) {
  const contentId = `inventory-detail-${section}-content`
  return <section className={`inventory-detail-section inventory-detail-accordion ${open ? 'is-open' : 'is-collapsed'}`}>
    <button type="button" className="inventory-detail-accordion-header" aria-expanded={open} aria-controls={contentId} onClick={() => onToggle(section)}>
      <span className="inventory-detail-accordion-heading"><span className="inventory-detail-label">{title}</span></span>
      <span className="inventory-detail-accordion-meta">{count !== undefined && <span className="inventory-detail-accordion-count">{count}</span>}{open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}</span>
    </button>
    <div id={contentId} className="inventory-detail-accordion-body" hidden={!open}>{children}</div>
  </section>
}

function FlowSection({ flow }: { flow: ItemFlow }) {
  const netTone = flow.netPerHour > 0 ? 'positive' : flow.netPerHour < 0 ? 'negative' : 'neutral'
  return <section className="inventory-detail-section inventory-flow-section"><span className="inventory-detail-label">CURRENT FLOW</span>{flow.production.length > 0 && <div className="inventory-flow-group"><small>PRODUCTION</small>{flow.production.map((source) => <FlowRow key={`production-${source.label}`} label={source.label} value={formatItemFlowRate(source.ratePerHour)} tone="positive" />)}</div>}{flow.consumption.length > 0 && <div className="inventory-flow-group"><small>CONSUMPTION</small>{flow.consumption.map((source) => <FlowRow key={`consumption-${source.label}`} label={source.label} value={formatItemFlowRate(-source.ratePerHour)} tone="negative" />)}</div>}<FlowRow label="NET FLOW" value={formatItemFlowRate(flow.netPerHour)} tone={netTone} emphasis />{flow.depletionEtaMs !== null && <FlowRow label="DEPLETES IN" value={formatFlowEta(flow.depletionEtaMs) ?? '-'} emphasis />}</section>
}

function GoalSection({ need, navigate }: { need: ItemNeed; navigate?: (screen: ScreenId) => void }) {
  return <section className="inventory-detail-section inventory-goal-section"><span className="inventory-detail-label">CURRENT GOAL</span><button type="button" className="inventory-goal-card" onClick={() => navigate?.(need.destination)}><span><strong>{need.label}</strong><small>PINNED RECIPE · REQUIRED {need.required} · AVAILABLE {need.owned}</small></span><Status tone={need.status === 'MISSING' ? 'warning' : 'success'}>{need.status === 'MISSING' ? `MISSING ${need.missing}` : need.status}</Status></button></section>
}

function FlowRow({ label, value, emphasis = false, tone = 'neutral' }: { label: string; value: string; emphasis?: boolean; tone?: 'positive' | 'negative' | 'neutral' }) { return <span className={`inventory-flow-row ${emphasis ? 'emphasis' : ''} ${tone}`}><span>{label}</span><strong>{value}</strong></span> }
function DetailRow({ label, value }: { label: string; value: ReactNode }) { return <span className="inventory-detail-row"><span>{label}</span><strong>{value}</strong></span> }

function InventoryLoadoutComparison({ itemId, equippedId, quantity, inventory, preview, ringTarget, onRingTargetChange }: { itemId: ItemId; equippedId: ItemId | null; quantity: number; inventory: GameState['inventory']; preview: EquipmentPreview | null; ringTarget: 'ring1' | 'ring2' | null; onRingTargetChange: (target: 'ring1' | 'ring2') => void }) {
  if (!preview) return null
  const impactRows = Object.entries(preview.impact).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)] as [string, number]) : [[key, Number(value)] as [string, number]]).filter(([, value]) => Math.abs(value) > 0.0001)
  const ringChoiceRequired = preview.failureReason === 'ring-target-required'
  return <section className="inventory-detail-section inventory-loadout-comparison"><span className="inventory-detail-label">LOADOUT COMPARISON</span>{ringChoiceRequired && <div className="artificing-ring-choices"><button type="button" className={`artificing-ring-choice ${ringTarget === 'ring1' ? 'selected' : ''}`} onClick={() => onRingTargetChange('ring1')}><span>RING 1</span><strong>Choose replacement</strong></button><button type="button" className={`artificing-ring-choice ${ringTarget === 'ring2' ? 'selected' : ''}`} onClick={() => onRingTargetChange('ring2')}><span>RING 2</span><strong>Choose replacement</strong></button></div>}{!ringChoiceRequired && <><div className="artificing-output-current"><span>CURRENT</span>{equippedId ? <ItemTooltip itemId={equippedId} owned={inventory[equippedId] ?? 0} equipped><span className="artificing-comparison-icon"><ItemIcon itemId={equippedId} size="tiny" /></span></ItemTooltip> : <span className="artificing-empty-slot">EMPTY</span>}<span aria-hidden="true">→</span><span>SELECTED PREVIEW</span><ItemTooltip itemId={itemId} owned={quantity}><span className="artificing-comparison-icon"><ItemIcon itemId={itemId} size="tiny" /></span></ItemTooltip></div>{preview.compatible && preview.preview ? <div className="artificing-output-stat-list comparison">{impactRows.map(([key, value]) => <div key={key}><span>{friendlyStatLabel(key)}</span><small>{formatPreviewValue(key, getSnapshotValue(preview.current, key))} → {formatPreviewValue(key, getSnapshotValue(preview.preview!, key))}</small><strong className={value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}>{formatPreviewValue(key, value, true)}</strong></div>)}</div> : <p className="artificing-output-note">{preview.reason ?? 'No loadout change can be calculated.'}</p>}</>}{preview.removedOffhand && <div className="artificing-output-warning"><LockKeyhole size={14} aria-hidden="true" /><span>{ITEMS[preview.removedOffhand].name} would be removed because this is a two-handed Weapon.</span></div>}</section>
}

function getSnapshotValue(snapshot: EquipmentPreview['current'], key: string) { if (key.startsWith('resistance-')) return snapshot.resistances[key.replace('resistance-', '') as keyof typeof snapshot.resistances] ?? 0; const mapping: Record<string, keyof EquipmentPreview['current']> = { basicDamage: 'basicDamage', basicAttackSpeedPct: 'basicAttackSpeedMultiplier', critDamage: 'critDamageMultiplier', damageOverTimePct: 'damageOverTimeBonus', statusDurationPct: 'statusDurationBonus', cooldownRecoveryPct: 'cooldownRecovery', healingDonePct: 'healingDoneBonus', barrierPowerPct: 'barrierPowerBonus', manaCostReductionPct: 'manaCostReduction', focusEfficiencyPct: 'focusEfficiency', fireSpellDamage: 'fireSpellDamage', airSpellDamage: 'airSpellDamage', waterBarrierPower: 'waterBarrierPower', barrierReceivedFlat: 'barrierReceivedFlat', negativeStatusDurationReceived: 'negativeStatusDurationReceived' }; return snapshot[mapping[key] ?? key as keyof typeof snapshot] as number ?? 0 }

function formatPreviewValue(key: string, value: number, signed = false) {
  const sign = signed && value > 0 ? '+' : ''
  if (key === 'damageReduction') return `${sign}${(value * 100).toFixed(1)}%`
  if (key.endsWith('Pct') || ['critChance', 'critDamage', 'blockChance', 'fireSpellDamage', 'airSpellDamage', 'waterBarrierPower', 'negativeStatusDurationReceived'].includes(key) || key.startsWith('resistance-')) return `${sign}${Math.round(value * 100)}%`
  if (key === 'manaRegen') return `${sign}${value.toFixed(1)}/s`
  return `${sign}${Math.round(value * 100) / 100}`
}
