import { ArrowRight, HelpCircle } from 'lucide-react'
import { Button, Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemRequirementTile } from '../../../components/ui/item'
import { FOCUS_IMPROVEMENT, getFocusImprovementLevelCost } from '../../../game/content/focus/focusImprovement'
import { ITEMS, getItemSourceLabel } from '../../../game/content/items/items'
import { getEquippedReservedQuantity } from '../../../game/core/equipment/equipmentRules'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getFocusCapacityAtImprovementLevel, getFocusCapacityBreakdown } from '../../../game/systems/focus/focusCapacity'
import { formatNumber } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

const REQUIRED_ITEMS = ['prismatic-fragment', 'life-essence'] as const

export function FocusImprovementPanel() {
  const state = useGameStore()
  const improvement = state.progress.focusImprovement
  const level = Math.max(0, Math.min(FOCUS_IMPROVEMENT.maxLevel, Math.floor(improvement.level)))
  const mastered = level >= FOCUS_IMPROVEMENT.maxLevel
  const cost = getFocusImprovementLevelCost(level + 1)
  const currentCapacity = getFocusCapacityBreakdown(state).total
  const nextCapacity = cost ? getFocusCapacityAtImprovementLevel(state, level + 1) : currentCapacity
  const protectedItem = cost ? REQUIRED_ITEMS.find((itemId) => Boolean(state.protectedItems[itemId]) || getEquippedReservedQuantity(state, itemId) > 0) : undefined
  const missingItem = cost ? REQUIRED_ITEMS.find((itemId) => getConsumableQuantity(state, itemId) < (itemId === 'prismatic-fragment' ? cost.primary : cost.lifeEssence)) : undefined
  const canUpgrade = Boolean(cost && !protectedItem && !missingItem)
  const reason = mastered ? 'Rank I Focus Capacity is mastered.' : protectedItem ? `${ITEMS[protectedItem].name} is protected or equipped and cannot be consumed.` : missingItem ? `Not enough ${ITEMS[missingItem].name} for the next Focus Capacity level.` : undefined
  const buttonLabel = protectedItem ? 'PROTECTED MATERIAL' : missingItem ? 'MISSING MATERIALS' : 'UPGRADE'
  const upgrade = useGameStore((game) => game.upgradeFocusCapacity)
  return <Card className="focus-improvement" title="FOCUS IMPROVEMENT">
    <div className="focus-improvement-heading"><GameTooltip block accent="focus" content={<TooltipContent title={FOCUS_IMPROVEMENT.name} description="Each level adds 10 Max Focus. Rank I has ten levels." />}><div><div className="focus-improvement-name"><ItemIcon itemId="prismatic-fragment" size="tiny" /><strong>{FOCUS_IMPROVEMENT.name}</strong></div><p>{FOCUS_IMPROVEMENT.description}</p></div></GameTooltip><Status tone="active">RANK I</Status></div>
    <div className="focus-level"><span>LEVEL {level} / {FOCUS_IMPROVEMENT.maxLevel}</span><div className="focus-level-marks" aria-label={`Level ${level} of ${FOCUS_IMPROVEMENT.maxLevel}`}>{Array.from({ length: FOCUS_IMPROVEMENT.maxLevel }, (_, index) => <GameTooltip key={index} content={`Focus Capacity Level ${index + 1}${index < level ? ' complete' : ''}`}><i className={index < level ? 'filled' : ''} /></GameTooltip>)}</div></div>
    {mastered ? <><MasteredState bonus={FOCUS_IMPROVEMENT.maxLevel * FOCUS_IMPROVEMENT.focusPerLevel} /><GameTooltip block content={<TooltipContent title="Rank I Mastered" description={`Focus Capacity cannot be upgraded beyond Level ${FOCUS_IMPROVEMENT.maxLevel} until a future rank is discovered.`} />}><Button className="focus-upgrade-button" variant="ghost" disabled ariaLabel="Rank I Mastered">RANK I MASTERED</Button></GameTooltip></> : <><div className="focus-improvement-effect"><span>CURRENT <b>→</b> NEXT</span><strong>+{formatNumber(level * FOCUS_IMPROVEMENT.focusPerLevel)} Max Focus <ArrowRight size={14} /> +{formatNumber((level + 1) * FOCUS_IMPROVEMENT.focusPerLevel)} Max Focus</strong></div><div className="focus-improvement-total"><span>TOTAL MAX FOCUS</span><strong>{formatNumber(currentCapacity)} <ArrowRight size={15} /> {formatNumber(nextCapacity)}</strong></div>{cost && <div className="focus-improvement-cost"><span className="eyebrow">COST · OWNED / REQUIRED</span><div className="focus-requirements">{REQUIRED_ITEMS.map((itemId) => { const required = itemId === 'prismatic-fragment' ? cost.primary : cost.lifeEssence; const owned = state.inventory[itemId] ?? 0; const available = getConsumableQuantity(state, itemId); const protectedItemState = Boolean(state.protectedItems[itemId]) || getEquippedReservedQuantity(state, itemId) > 0; return <ItemRequirementTile key={itemId} itemId={itemId} owned={owned} available={available} equipped={getEquippedReservedQuantity(state, itemId)} required={required} protectedItem={protectedItemState} source={getItemSourceLabel(itemId)} /> })}</div></div>}<GameTooltip block disabled={canUpgrade} content={<TooltipContent title={protectedItem ? 'Protected Material' : 'Missing Materials'} description={reason ?? 'The next level is ready to purchase.'} />}><Button className="focus-upgrade-button" variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} onClick={upgrade} ariaLabel={reason ?? buttonLabel}>{buttonLabel}</Button></GameTooltip></>}
    <RankTwoPlaceholder />
  </Card>
}

function MasteredState({ bonus }: { bonus: number }) { return <div className="focus-mastered"><Status tone="success">RANK I MASTERED</Status><strong>+{formatNumber(bonus)} MAX FOCUS</strong><span>Normal upgrades are complete.</span></div> }

function RankTwoPlaceholder() {
  return <div className="focus-rank-two"><GameTooltip content={<TooltipContent title="Rank II" description="This progression tier is not yet discovered." />}><div className="focus-rank-two-heading"><span>RANK II</span><small>Not yet discovered</small><HelpCircle size={14} /></div></GameTooltip><div className="focus-unknown-catalysts">{Array.from({ length: 3 }, (_, index) => <GameTooltip key={index} content="Unknown catalyst — future progression material"><span><i>?</i> UNKNOWN CATALYST</span></GameTooltip>)}</div><p>Rank II requirements will be revealed in a future progression tier.</p></div>
}
