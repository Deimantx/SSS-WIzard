import { Button, Card, Status } from '../../../components/ui'
import { ItemIcon, ItemRequirementTile } from '../../../components/ui/item'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../../game/content/items/items'
import { TRANSMUTATION_ARRAYS, TRANSMUTATION_ARRAY_IDS, getTransmutationArrayFragmentItemId, getTransmutationArrayLevelCost, type ElementalFragmentKey, type TransmutationArrayDefinition } from '../../../game/content/transmutation/transmutationArrays'
import { getItemSourceLabel } from '../../../game/data/items'
import { FRAGMENT_ORDER, SCHOOLS } from '../../../game/data/schools'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getEquippedReservedQuantity } from '../../../game/core/equipment/equipmentRules'
import { getTransmutationArrayBonuses, getTransmutationArrayEffectValue } from '../../../game/systems/transmutation/transmutationArrays'
import type { TransmutationArrayId } from '../../../game/types'
import { formatNumber } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

const ELEMENTS: readonly ElementalFragmentKey[] = ['fire', 'water', 'earth', 'air']
const GROUPS: readonly { label: string; ids: readonly TransmutationArrayId[] }[] = [
  { label: 'PROCESS ARRAYS', ids: ['temporal-array', 'mana-refinement-array'] },
  { label: 'YIELD ARRAYS', ids: ['conservation-array', 'replication-array'] },
  { label: 'CONTROL ARRAY', ids: ['echo-stabilization-array'] },
]

export function TransmutationArraysPanel() {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const mastered = TRANSMUTATION_ARRAY_IDS.filter((id) => progress.transmutation.arrays[id].level >= TRANSMUTATION_ARRAYS[id].maxLevel).length
  const bonuses = getTransmutationArrayBonuses({ progress })
  return <Card className="transmutation-arrays-panel" title="TRANSMUTATION ARRAYS" action={<div className="transmutation-array-mastery-summary"><span>RANK I MASTERY</span><strong>{mastered} / {TRANSMUTATION_ARRAY_IDS.length}</strong><div className="transmutation-array-mastery-marks">{TRANSMUTATION_ARRAY_IDS.map((id) => <GameTooltip key={id} content={<TooltipContent title={TRANSMUTATION_ARRAYS[id].name} description={`Rank I · Level ${progress.transmutation.arrays[id].level} / 10${progress.transmutation.arrays[id].level >= 10 ? ' · Mastered' : ''}`} />} accent={progress.transmutation.arrays[id].level >= 10 ? 'success' : 'neutral'}><i className={progress.transmutation.arrays[id].level >= 10 ? 'filled' : ''} aria-label={`${TRANSMUTATION_ARRAYS[id].name} level ${progress.transmutation.arrays[id].level} of 10`} /></GameTooltip>)}</div></div>}>
    <p className="transmutation-arrays-intro">Tune the permanent lattice that governs Transmutation speed, yield, Mana, and Echo capacity.</p>
    <MaterialStrip inventory={inventory} />
    {GROUPS.map((group) => <section className="transmutation-array-group" key={group.label}><h3>{group.label}</h3><div className={`transmutation-array-grid ${group.ids.length === 1 ? 'single' : ''}`}>{group.ids.map((id) => <TransmutationArrayCard key={id} arrayId={id} />)}</div></section>)}
    <div className="transmutation-array-bonus-summary"><span>ACTIVE BONUSES</span><strong>Speed +{formatPercent(bonuses.craftSpeedPct)} · Preservation {formatPercent(bonuses.preservationChance)} · Replication {formatPercent(bonuses.replicationChance)} · Mana −{formatPercent(bonuses.manaCostReductionPct)} · Echo Capacity +{bonuses.echoCapacityBonus}</strong></div>
  </Card>
}

function MaterialStrip({ inventory }: { inventory: Partial<Record<import('../../../game/types').ItemId, number>> }) {
  return <div className="transmutation-array-material-strip"><span className="eyebrow">AVAILABLE MATERIALS</span><div>{ELEMENTS.map((element) => { const itemId = getTransmutationArrayFragmentItemId(element); return <MaterialChip key={element} itemId={itemId} label={SCHOOLS[element].name} glyph={SCHOOLS[element].glyph} amount={inventory[itemId] ?? 0} /> })}<MaterialChip itemId="life-essence" label="Life Essence" glyph="✦" amount={inventory['life-essence'] ?? 0} /></div></div>
}

function MaterialChip({ itemId, label, glyph, amount }: { itemId: import('../../../game/types').ItemId; label: string; glyph: string; amount: number }) {
  const item = ITEMS[itemId]
  return <GameTooltip content={<TooltipContent title={item.name} description={item.description}><div className="tooltip-section"><small>AVAILABLE</small><p>{formatNumber(amount)}</p></div><div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div></TooltipContent>} accent="elemental"><span className="transmutation-array-material-chip" style={{ '--array-material-accent': item.color } as React.CSSProperties}><i>{glyph}</i>{label}<strong>{formatNumber(amount)}</strong></span></GameTooltip>
}

function TransmutationArrayCard({ arrayId }: { arrayId: TransmutationArrayId }) {
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const state = useGameStore()
  const array = state.progress.transmutation.arrays[arrayId]
  const level = Math.max(0, Math.min(definition.maxLevel, Math.floor(array.level)))
  const cost = getTransmutationArrayLevelCost(arrayId, level + 1)
  const upgrade = state.upgradeTransmutationArray
  const mastered = level >= definition.maxLevel
  const requiredItems = cost ? [...ELEMENTS.map((element) => ({ itemId: getTransmutationArrayFragmentItemId(element), quantity: cost.fragments[element] })), { itemId: 'life-essence' as const, quantity: cost.lifeEssence }] : []
  const isProtected = (itemId: import('../../../game/types').ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
  const blocked = requiredItems.find(({ itemId }) => isProtected(itemId))
  const missing = requiredItems.filter(({ itemId, quantity }) => getConsumableQuantity(state, itemId) < quantity)
  const canUpgrade = Boolean(cost && !mastered && !blocked && missing.length === 0)
  const reason = mastered ? 'Rank I already mastered.' : blocked ? 'One or more required materials are protected.' : missing.length > 0 ? 'Missing required materials.' : ''
  const currentValue = getTransmutationArrayEffectValue(arrayId, level)
  const nextLevel = definition.effect === 'echo-capacity' ? Math.min(definition.maxLevel, level < 5 ? 5 : 10) : Math.min(definition.maxLevel, level + 1)
  const nextValue = getTransmutationArrayEffectValue(arrayId, nextLevel)
  const nextLabel = definition.effect === 'echo-capacity' ? getEchoNextLabel(level, definition) : mastered ? 'RANK II' : 'NEXT'
  return <article className={`transmutation-array-card array-${arrayId}`} style={{ '--array-dominant-accent': SCHOOLS[definition.dominantElement].color } as React.CSSProperties}>
    <div className="transmutation-array-card-head"><div><h3>{definition.name}</h3><Status tone={mastered ? 'success' : 'active'}>{mastered ? 'RANK I MASTERED' : 'RANK I'}</Status></div><ItemIcon itemId={getTransmutationArrayFragmentItemId(definition.dominantElement)} size="tiny" /></div>
    <p className="muted">{definition.description}</p>
    <div className="transmutation-array-level"><span>LEVEL {level} / {definition.maxLevel}</span><div className="transmutation-array-marks" aria-label={`${definition.name} progress ${level} of ${definition.maxLevel}`}>{Array.from({ length: definition.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    <GameTooltip block content={<TooltipContent title={definition.effectLabel} description={effectTooltip(definition)} />} accent="elemental"><div className="transmutation-array-effect-row"><div><span>CURRENT</span><strong>{effectText(definition, currentValue)}</strong></div><b aria-hidden="true">→</b><div><span>{nextLabel}</span><strong>{mastered ? '???' : definition.effect === 'echo-capacity' ? getEchoNextValueLabel(level, nextValue) : effectText(definition, nextValue)}</strong></div></div></GameTooltip>
    {!mastered && cost && <div className="transmutation-array-costs"><span className="eyebrow">COST · OWNED / REQUIRED</span><div className="transmutation-array-requirements">{requiredItems.map(({ itemId, quantity }) => <ItemRequirementTile key={itemId} itemId={itemId} owned={state.inventory[itemId] ?? 0} available={getConsumableQuantity(state, itemId)} equipped={getEquippedReservedQuantity(state, itemId)} required={quantity} protectedItem={isProtected(itemId)} />)}</div></div>}
    <GameTooltip block disabled={canUpgrade} content={reason}><Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} ariaLabel={reason || `Upgrade ${definition.name}`} onClick={() => upgrade(arrayId)}>{mastered ? 'Mastered' : blocked ? 'Protected Material' : missing.length ? 'Missing Materials' : 'Upgrade'}</Button></GameTooltip>
  </article>
}

function effectTooltip(definition: TransmutationArrayDefinition) {
  if (definition.effect === 'craft-speed-percent') return 'Increases work completed per real second. Echoes and Array speed multiply together.'
  if (definition.effect === 'preservation-chance') return 'One roll per completed cycle can preserve all recipe ingredients. Only affects recipes that consume ingredients.'
  if (definition.effect === 'replication-chance') return 'One independent roll can grant one extra copy of the authored output without another cycle, Mana, or ingredients.'
  if (definition.effect === 'mana-cost-reduction-percent') return 'Reduces effective Mana paid per Transmutation cycle. Authored recipe costs remain unchanged.'
  return 'Adds Transmutation Echo capacity at Rank I milestones Lv5 and Lv10.'
}

function effectText(definition: TransmutationArrayDefinition, value: number) {
  if (definition.effect === 'mana-cost-reduction-percent') return `−${formatPercent(value)}`
  if (definition.effect === 'echo-capacity') return `+${value} Echo Capacity`
  return `+${formatPercent(value)}`
}

function getEchoNextLabel(level: number, definition: TransmutationArrayDefinition) {
  if (level >= definition.maxLevel) return 'RANK II'
  return `NEXT MILESTONE · Lv${level < 5 ? 5 : 10}`
}

function getEchoNextValueLabel(level: number, value: number) {
  if (level >= 9) return `+${value} Echo Capacity`
  return `+${value} at next milestone`
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 1)}%`
}
