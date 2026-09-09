import { useState, type CSSProperties } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { ItemIcon, ItemRequirementTile } from '../../../components/ui/item'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../../game/content/items/items'
import { TRANSMUTATION_ARRAYS, TRANSMUTATION_ARRAY_IDS, getTransmutationArrayFragmentItemId, getTransmutationArrayLevelCost, type ElementalFragmentKey, type TransmutationArrayDefinition } from '../../../game/content/transmutation/transmutationArrays'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getEquippedReservedQuantity } from '../../../game/core/equipment/equipmentRules'
import { getTransmutationArrayBonuses, getTransmutationArrayEffectValue } from '../../../game/systems/transmutation/transmutationArrays'
import type { ItemId, TransmutationArrayId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

const ELEMENTS: readonly ElementalFragmentKey[] = ['fire', 'water', 'earth', 'air']
const ARRAY_CATEGORIES: Record<TransmutationArrayId, 'PROCESS' | 'YIELD' | 'CONTROL'> = {
  'temporal-array': 'PROCESS',
  'mana-refinement-array': 'PROCESS',
  'conservation-array': 'YIELD',
  'replication-array': 'YIELD',
  'echo-stabilization-array': 'CONTROL',
}

export function TransmutationArraysPanel() {
  const [selectedArrayId, setSelectedArrayId] = useState<TransmutationArrayId>('temporal-array')
  const state = useGameStore()
  const bonuses = getTransmutationArrayBonuses(state)
  const mastered = TRANSMUTATION_ARRAY_IDS.filter((id) => state.progress.transmutation.arrays[id].level >= TRANSMUTATION_ARRAYS[id].maxLevel).length

  return <Card className="transmutation-arrays-panel" title="TRANSMUTATION ARRAYS" action={<div className="transmutation-array-mastery-summary"><span>RANK I</span><strong>{mastered} / {TRANSMUTATION_ARRAY_IDS.length} MASTERED</strong></div>}>
    <p className="transmutation-arrays-intro">Permanent Arrays tune Transmutation speed, yield, Mana, and Echo capacity.</p>
    <div className="transmutation-array-bonus-summary"><span>ACTIVE BONUSES</span><strong>Speed +{formatPercent(bonuses.craftSpeedPct)} · Preserve {formatPercent(bonuses.preservationChance)} · Replicate {formatPercent(bonuses.replicationChance)} · Mana −{formatPercent(bonuses.manaCostReductionPct)} · Echo +{bonuses.echoCapacityBonus}</strong></div>
    <div className="transmutation-array-selector-grid" aria-label="Transmutation Arrays">
      {TRANSMUTATION_ARRAY_IDS.map((arrayId, index) => <ArraySelector key={arrayId} arrayId={arrayId} selected={selectedArrayId === arrayId} wide={index === TRANSMUTATION_ARRAY_IDS.length - 1} onSelect={() => setSelectedArrayId(arrayId)} />)}
    </div>
    <SelectedArrayInspector arrayId={selectedArrayId} />
  </Card>
}

function ArraySelector({ arrayId, selected, wide, onSelect }: { arrayId: TransmutationArrayId; selected: boolean; wide: boolean; onSelect: () => void }) {
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const progress = useGameStore((state) => state.progress)
  const level = getSafeLevel(progress.transmutation.arrays[arrayId].level)
  const mastered = level >= definition.maxLevel
  const description = `${definition.description} Current level: ${level} / ${definition.maxLevel}${mastered ? ' · Rank I mastered.' : ''}`
  return <GameTooltip block className={wide ? 'is-wide' : ''} content={<TooltipContent title={definition.name} description={description} />} accent="elemental">
    <button type="button" className={`transmutation-array-selector ${selected ? 'is-selected' : ''} ${mastered ? 'is-mastered' : ''} ${wide ? 'is-wide' : ''}`} aria-pressed={selected} onClick={onSelect} style={{ '--array-dominant-accent': getArrayAccent(definition) } as CSSProperties}>
      <ItemIcon itemId={getTransmutationArrayFragmentItemId(definition.dominantElement)} size="tiny" />
      <span className="transmutation-array-selector-copy"><strong>{definition.name}</strong><small>{ARRAY_CATEGORIES[arrayId]} · Lv {level} / {definition.maxLevel}</small><b>{compactEffectText(definition, getTransmutationArrayEffectValue(arrayId, level))}</b></span>
      {mastered && <Status tone="success">MASTERED</Status>}
    </button>
  </GameTooltip>
}

function SelectedArrayInspector({ arrayId }: { arrayId: TransmutationArrayId }) {
  const state = useGameStore()
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const level = getSafeLevel(state.progress.transmutation.arrays[arrayId].level)
  const mastered = level >= definition.maxLevel
  const currentValue = getTransmutationArrayEffectValue(arrayId, level)
  const nextLevel = definition.effect === 'echo-capacity' ? Math.min(definition.maxLevel, level < 5 ? 5 : 10) : Math.min(definition.maxLevel, level + 1)
  const nextValue = getTransmutationArrayEffectValue(arrayId, nextLevel)
  const cost = mastered ? null : getTransmutationArrayLevelCost(arrayId, level + 1)
  const requirements = cost ? [...ELEMENTS.map((element) => ({ itemId: getTransmutationArrayFragmentItemId(element), quantity: cost.fragments[element] })), { itemId: 'life-essence' as const, quantity: cost.lifeEssence }] : []
  const protectedMaterial = requirements.find(({ itemId }) => Boolean(state.protectedItems[itemId]))
  const missingMaterial = requirements.find(({ itemId, quantity }) => getConsumableQuantity(state, itemId) < quantity)
  const canUpgrade = Boolean(cost && !protectedMaterial && !missingMaterial)
  const reason = mastered ? 'Rank I already mastered.' : protectedMaterial ? 'Required material is protected.' : missingMaterial ? 'Missing required materials.' : ''

  return <section className="transmutation-array-selected" style={{ '--array-dominant-accent': getArrayAccent(definition) } as CSSProperties}>
    <div className="transmutation-array-selected-head"><div className="transmutation-array-selected-identity"><span className="transmutation-array-selected-icon"><ItemIcon itemId={getTransmutationArrayFragmentItemId(definition.dominantElement)} size="tiny" /></span><div><span className="eyebrow">RANK I · {ARRAY_CATEGORIES[arrayId]} ARRAY</span><h3>{definition.name}</h3><span className="transmutation-array-selected-level">LEVEL {level} / {definition.maxLevel}</span></div></div>{mastered && <Status tone="success">MASTERED</Status>}</div>
    <p className="transmutation-array-selected-description">{definition.description}</p>
    <div className="transmutation-array-level"><span>LEVEL PROGRESSION</span><div className="transmutation-array-marks" aria-label={`${definition.name} progress ${level} of ${definition.maxLevel}`}>{Array.from({ length: definition.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    {mastered ? <div className="transmutation-array-effect-row is-mastered"><div><span>CURRENT</span><strong>{effectText(definition, currentValue)}</strong></div><p>RANK I MASTERED<br /><small>Further ranks are not yet available.</small></p></div> : <GameTooltip block content={<TooltipContent title={definition.effectLabel} description={effectTooltip(definition)} />} accent="elemental"><div className="transmutation-array-effect-row"><div><span>CURRENT</span><strong>{effectText(definition, currentValue)}</strong></div><b aria-hidden="true">→</b><div><span>{definition.effect === 'echo-capacity' ? `NEXT MILESTONE · Lv${level < 5 ? 5 : 10}` : 'NEXT'}</span><strong>{definition.effect === 'echo-capacity' ? `+${nextValue} Echo Capacity` : effectText(definition, nextValue)}</strong></div></div></GameTooltip>}
    {!mastered && cost && <div className="transmutation-array-costs"><span className="eyebrow">COST · OWNED / AVAILABLE / REQUIRED</span><div className="transmutation-array-requirements">{requirements.map(({ itemId, quantity }) => <ItemRequirementTile key={itemId} itemId={itemId} owned={state.inventory[itemId] ?? 0} available={getConsumableQuantity(state, itemId)} equipped={getEquippedReservedQuantity(state, itemId)} required={quantity} protectedItem={Boolean(state.protectedItems[itemId])} />)}</div></div>}
    <GameTooltip block disabled={canUpgrade} content={reason}><Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} ariaLabel={reason || `Upgrade ${definition.name}`} onClick={() => state.upgradeTransmutationArray(arrayId)}>{mastered ? 'RANK I MASTERED' : 'UPGRADE'}</Button></GameTooltip>
  </section>
}

function getSafeLevel(level: number) { return Math.max(0, Math.min(10, Math.floor(level))) }

function getArrayAccent(definition: TransmutationArrayDefinition) {
  const itemId = getTransmutationArrayFragmentItemId(definition.dominantElement)
  return ITEMS[itemId].color
}

function compactEffectText(definition: TransmutationArrayDefinition, value: number) {
  if (definition.effect === 'mana-cost-reduction-percent') return `−${formatPercent(value)} Mana`
  if (definition.effect === 'echo-capacity') return `+${value} Echo`
  if (definition.effect === 'craft-speed-percent') return `+${formatPercent(value)} Speed`
  if (definition.effect === 'preservation-chance') return `${formatPercent(value)} Preserve`
  return `${formatPercent(value)} Replicate`
}

function effectTooltip(definition: TransmutationArrayDefinition) {
  if (definition.effect === 'craft-speed-percent') return 'Increases work completed per real second. Echo speed and Array speed multiply together.'
  if (definition.effect === 'preservation-chance') return 'One roll per completed cycle can preserve all recipe ingredients. Ingredientless recipes receive no benefit.'
  if (definition.effect === 'replication-chance') return 'One independent roll can grant one extra authored output. No second cycle, Mana payment, or ingredient payment.'
  if (definition.effect === 'mana-cost-reduction-percent') return 'Reduces effective Mana paid per Transmutation cycle. The authored recipe cost remains unchanged.'
  return 'Adds Transmutation Echo capacity at Rank I milestones Lv5 and Lv10.'
}

function effectText(definition: TransmutationArrayDefinition, value: number) {
  if (definition.effect === 'mana-cost-reduction-percent') return `−${formatPercent(value)} Mana / Cycle`
  if (definition.effect === 'echo-capacity') return `+${value} Echo Capacity`
  if (definition.effect === 'craft-speed-percent') return `+${formatPercent(value)} Speed`
  if (definition.effect === 'preservation-chance') return `${formatPercent(value)} Preservation`
  return `${formatPercent(value)} Replication`
}

function formatPercent(value: number) {
  const percent = value * 100
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 1)}%`
}
