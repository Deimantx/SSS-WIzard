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
  const category = getInventorySubcategoryLabel(itemId) ? `${getInventorySubcategoryLabel(itemId)} Material` : getInventoryCategoryLabel(itemId)
  return <TooltipContent title={item.name.toUpperCase()} description={category}>
    <div className="item-tooltip-heading"><ItemIcon itemId={itemId} size="tiny" /><span>{item.description}</span></div>
    {item.kind === 'equipment' && <EquipmentMetadata item={item} />}
    {artifactLevel !== undefined && artifactMaxLevel !== undefined && <TooltipRow label="Artifact" value={`T${artifactTier ?? 1} ARTIFACT · LEVEL ${artifactLevel} / ${artifactMaxLevel}`} />}
    <TooltipRow label="Owned" value={owned.toLocaleString()} />
    {recentlyGained !== undefined && <TooltipRow label="Recently gained" value={`+${recentlyGained.toLocaleString()}`} />}
    {equipped ? <TooltipRow label="State" value="Equipped" /> : <TooltipRow label="Protected" value={protectedItem ? 'Yes' : 'No'} />}
    {item.materialTier !== undefined && <TooltipRow label="Material tier" value={`T${item.materialTier}`} />}
    {item.researchSchool && <div className="tooltip-section"><small>RESEARCH</small>{(Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>).map((schoolId) => <TooltipRow key={schoolId} label={SCHOOLS[schoolId].name} value={`${getResearchXp(itemId, schoolId)} XP`} />)}</div>}
    {stats && Object.keys(stats).length > 0 && <div className="tooltip-section"><small>STATS</small>{flattenItemStats(stats).filter(([, value]) => value !== 0).map(([key, value]) => <TooltipRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div>}
    {item.kind === 'equipment' && <EquipmentCombatDetails item={item} />}
    {recipeContext && <div className="tooltip-section"><small>RECIPE</small><TooltipRow label="Status" value={recipeContext.status} />{recipeContext.baseDurationMs !== undefined && <TooltipRow label="Base time" value={formatDuration(recipeContext.baseDurationMs)} />}{recipeContext.manaCost !== undefined && <TooltipRow label="Mana" value={recipeContext.manaCost.toLocaleString()} />}<TooltipRow label="Output" value={`×${recipeContext.outputQuantity}`} /><p>{recipeContext.ingredients.length ? recipeContext.ingredients.map((ingredient) => `${ITEMS[ingredient.itemId].name} ×${ingredient.quantity}`).join(' · ') : 'Mana only'}</p>{recipeContext.unlockReason && <p>{recipeContext.unlockReason}</p>}</div>}
    {extraContent}
    {flow && <div className="tooltip-section"><small>CURRENT FLOW</small>{flow.production.map((source) => <TooltipRow key={`production-${source.label}`} label={source.label} value={formatItemFlowRate(source.ratePerHour)} />)}{flow.consumption.map((source) => <TooltipRow key={`consumption-${source.label}`} label={source.label} value={formatItemFlowRate(-source.ratePerHour)} />)}<TooltipRow label="Net" value={formatItemFlowRate(flow.netPerHour)} />{flow.depletionEtaMs !== null && <TooltipRow label="Depletes in" value={formatFlowEta(flow.depletionEtaMs) ?? '-'} />}</div>}
    <div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div>
  </TooltipContent>
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }

export const flattenItemStats = (stats: NonNullable<import('../../../game/types').ItemDefinition['stats']>): Array<[string, number]> => Object.entries(stats).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)]) : [[key, Number(value)]])
