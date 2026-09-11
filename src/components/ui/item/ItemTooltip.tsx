import type { ReactNode } from 'react'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../../game/content/items/items'
import { getArtifactDefinition, getArtifactEffectiveStats, getArtifactLevel, isArtifactItem } from '../../../game/systems/artifacts/artifactProgression'
import { SCHOOLS } from '../../../game/content/schools/schools'
import type { EquipmentStats, ItemId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { getInventoryCategoryLabel, getInventorySubcategoryLabel } from '../../../game/content/items/inventoryMetadata'
import { ItemIcon } from './ItemIcon'
import { EquipmentMetadata } from './EquipmentMetadata'
import { EquipmentCombatDetails } from './EquipmentCombatDetails'
import { formatFlowEta, formatItemFlowRate, type ItemFlow } from '../../../game/systems/inventory/itemFlow'
import { friendlyStatLabel, formatStat } from '../../../game/presentation/equipment/equipmentStatPresentation'

export { friendlyStatLabel, formatStat } from '../../../game/presentation/equipment/equipmentStatPresentation'

export interface ItemTooltipRecipeContext {
  status: string
  baseDurationMs?: number
  manaCost?: number
  outputQuantity: number
  ingredients: Array<{ itemId: ItemId; quantity: number }>
  unlockReason?: string
}

interface ItemTooltipContentProps {
  itemId: ItemId
  owned: number
  protectedItem?: boolean
  equipped?: boolean
  recentlyGained?: number
  flow?: ItemFlow | null
  recipeContext?: ItemTooltipRecipeContext
  effectiveStats?: EquipmentStats
  artifactTier?: number
  artifactLevel?: number
  artifactMaxLevel?: number
  extraContent?: ReactNode
}

export function ItemTooltip({ itemId, owned, protectedItem = false, equipped = false, recentlyGained, flow, recipeContext, effectiveStats, artifactTier, artifactLevel, artifactMaxLevel, extraContent, children }: ItemTooltipContentProps & { children: ReactNode }) {
  const item = ITEMS[itemId]
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const artifact = item.kind === 'equipment' && isArtifactItem(itemId)
  const resolvedStats = effectiveStats ?? (artifact ? getArtifactEffectiveStats({ artifactProgress }, itemId) : item.stats)
  const artifactDefinition = artifact ? getArtifactDefinition(itemId) : undefined
  const resolvedArtifactTier = artifactTier ?? artifactDefinition?.tier
  const resolvedArtifactLevel = artifactLevel ?? (artifact ? getArtifactLevel({ artifactProgress }, itemId) : undefined)
  const resolvedArtifactMaxLevel = artifactMaxLevel ?? artifactDefinition?.maxLevel
  const accent = item.inventoryCategory === 'equipment' ? 'success' : item.inventoryCategory === 'loot' ? 'warning' : item.materialSubtype === 'elemental' ? 'elemental' : 'neutral'
  return <GameTooltip block accent={accent} content={<ItemTooltipContent itemId={itemId} owned={owned} protectedItem={protectedItem} equipped={equipped} recentlyGained={recentlyGained} flow={flow} recipeContext={recipeContext} effectiveStats={resolvedStats} artifactTier={resolvedArtifactTier} artifactLevel={resolvedArtifactLevel} artifactMaxLevel={resolvedArtifactMaxLevel} extraContent={extraContent} />}>{children}</GameTooltip>
}

export function ItemTooltipContent({ itemId, owned, protectedItem = false, equipped = false, recentlyGained, flow, recipeContext, effectiveStats, artifactTier, artifactLevel, artifactMaxLevel, extraContent }: ItemTooltipContentProps) {
  const item = ITEMS[itemId]
  const stats = effectiveStats ?? item.stats
  const category = getInventorySubcategoryLabel(itemId) ? getInventorySubcategoryLabel(itemId) + ' Material' : getInventoryCategoryLabel(itemId)
  const state = equipped ? 'EQUIPPED' : protectedItem ? 'PROTECTED' : 'NORMAL'
  const production = flow?.production.map((source) => source.label + ' ' + formatItemFlowRate(source.ratePerHour)).join(' · ')
  const consumption = flow?.consumption.map((source) => source.label + ' ' + formatItemFlowRate(-source.ratePerHour)).join(' · ')

  return <TooltipContent>
    <div className="item-tooltip-layout">
      <div className="item-tooltip-header">
        <span className="item-tooltip-icon"><ItemIcon itemId={itemId} size="tiny" /></span>
        <div className="item-tooltip-identity">
          <strong>{item.name}</strong>
          <span>{category}{item.materialTier !== undefined ? ' · T' + item.materialTier : ''}</span>
          {artifactLevel !== undefined && artifactMaxLevel !== undefined && <span className="item-tooltip-artifact-meta">{'T' + (artifactTier ?? 1) + ' ARTIFACT · LEVEL ' + artifactLevel + ' / ' + artifactMaxLevel}</span>}
          <p>{item.description}</p>
        </div>
      </div>

      {item.kind === 'equipment' && <EquipmentMetadata item={item} className="item-tooltip-equipment-meta" />}
      <div className="item-tooltip-quick-facts" aria-label="Item facts">
        <span><small>OWNED</small><b>{owned.toLocaleString()}</b></span>
        {recentlyGained !== undefined && <span className="item-tooltip-recent"><small>RECENT</small><b>{'+' + recentlyGained.toLocaleString()}</b></span>}
        <span className={'item-tooltip-state item-tooltip-state-' + state.toLowerCase()}><small>STATE</small><b>{state}</b></span>
        {item.materialTier !== undefined && <span><small>TIER</small><b>{'T' + item.materialTier}</b></span>}
      </div>

      {item.researchSchool && <div className="tooltip-section item-tooltip-research"><small>RESEARCH</small><div className="item-tooltip-research-grid">{(Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>).map((schoolId) => <TooltipRow key={schoolId} label={SCHOOLS[schoolId].name} value={getResearchXp(itemId, schoolId) + ' XP'} />)}</div></div>}
      {stats && Object.keys(stats).length > 0 && <div className="tooltip-section item-tooltip-stats"><small>STATS</small><div className="item-tooltip-stat-list">{flattenItemStats(stats).filter(([, value]) => value !== 0).map(([key, value]) => <TooltipRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div></div>}
      {item.kind === 'equipment' && <EquipmentCombatDetails item={item} compact />}
      {recipeContext && <div className="tooltip-section item-tooltip-recipe"><small>RECIPE</small><TooltipRow label="Status" value={recipeContext.status} />{recipeContext.baseDurationMs !== undefined && <TooltipRow label="Base time" value={formatDuration(recipeContext.baseDurationMs)} />}{recipeContext.manaCost !== undefined && <TooltipRow label="Mana" value={recipeContext.manaCost.toLocaleString()} />}<TooltipRow label="Output" value={'×' + recipeContext.outputQuantity} /><p>{recipeContext.ingredients.length ? recipeContext.ingredients.map((ingredient) => ITEMS[ingredient.itemId].name + ' ×' + ingredient.quantity).join(' · ') : 'Mana only'}</p>{recipeContext.unlockReason && <p>{recipeContext.unlockReason}</p>}</div>}
      {extraContent}
      {flow && <div className="tooltip-section item-tooltip-flow"><small>CURRENT FLOW</small>{production && <TooltipRow label="Production" value={production} />}{consumption && <TooltipRow label="Consumption" value={consumption} />}<TooltipRow label="Net" value={formatItemFlowRate(flow.netPerHour)} />{flow.depletionEtaMs !== null && <TooltipRow label="Depletes in" value={formatFlowEta(flow.depletionEtaMs) ?? '-'} />}</div>}
      <div className="tooltip-section item-tooltip-source"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div>
    </div>
  </TooltipContent>
}
function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }

export const flattenItemStats = (stats: NonNullable<import('../../../game/types').ItemDefinition['stats']>): Array<[string, number]> => Object.entries(stats).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)]) : [[key, Number(value)]])
