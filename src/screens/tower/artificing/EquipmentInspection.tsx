import { LockKeyhole } from 'lucide-react'
import { type ReactNode } from 'react'
import { EquipmentCombatDetails } from '../../../components/ui/item/EquipmentCombatDetails'
import { ItemIcon, ItemTooltip, flattenItemStats, formatStat, friendlyStatLabel } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { ArtificingRecipeDefinition } from '../../../game/content/recipes/artificingRecipes'
import { getArtificingEquipmentPreview, getArtificingOutputInspection } from '../../../game/presentation/artificing/artificingEquipmentReadModel'
import { getDefaultEquipmentPosition } from '../../../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

export function EquipmentInspection({ recipe }: { recipe: ArtificingRecipeDefinition }) {
  const state = useGameStore()
  const item = ITEMS[recipe.output.itemId]
  const inspection = getArtificingOutputInspection(state, recipe)
  if (item.kind !== 'equipment' || !inspection.equipment) return null
  const targetPosition = getDefaultEquipmentPosition(inspection.equipment.slot)
  const preview = getArtificingEquipmentPreview(state, recipe.output.itemId, targetPosition)

  return <div className="artificing-output-preview"><EquipmentOutput inspection={inspection} preview={preview} /></div>
}

function EquipmentOutput({ inspection, preview }: { inspection: ReturnType<typeof getArtificingOutputInspection>; preview: ReturnType<typeof getArtificingEquipmentPreview> | null }) {
  const item = ITEMS[inspection.itemId]
  if (!inspection.equipment) return null
  const authoredStats = flattenItemStats(inspection.stats).filter(([, value]) => Math.abs(value) > 0)
  const impactRows = preview ? getImpactEntries(preview.impact).filter(([, value]) => Math.abs(value) > 0.0001) : []
  return <>
    {authoredStats.length > 0 && <DetailSection title="STATS"><div className="artificing-output-stat-list">{authoredStats.map(([key, value]) => <div key={key}><span>{friendlyStatLabel(key)}</span><strong>{formatStat(key, value)}</strong></div>)}</div></DetailSection>}
    <EquipmentCombatDetails item={item} />
    {preview && !preview.compatible && <div className="artificing-output-warning"><LockKeyhole size={14} aria-hidden="true" /><span>{preview.reason}</span></div>}
    {preview?.preview && <DetailSection title="LOADOUT COMPARISON"><div className="artificing-output-current"><span>CURRENT</span><ComparisonItem itemId={getCurrentItemId(useGameStore.getState(), preview, inspection.equipment.slot)} /><span>→</span><span>CRAFTED PREVIEW</span><ItemTooltip itemId={inspection.itemId} owned={inspection.owned} effectiveStats={inspection.stats} artifactRanks={inspection.artifactRanks ?? undefined} artifactMaxRanks={inspection.artifactMaxRanks ?? undefined}><span className="artificing-comparison-icon"><ItemIcon itemId={inspection.itemId} size="tiny" /></span></ItemTooltip></div><div className="artificing-output-stat-list comparison">{impactRows.map(([key, value]) => <div key={key}><span>{friendlyStatLabel(key)}</span><small>{formatSnapshotValue(key, preview.current)} → {formatSnapshotValue(key, preview.preview!)}</small><strong className={value > 0 ? 'positive' : 'negative'}>{formatSignedImpact(key, value)}</strong></div>)}</div>{impactRows.length === 0 && <p className="artificing-output-note">No authored loadout stat change for this replacement.</p>}</DetailSection>}
  </>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="artificing-output-section"><span className="eyebrow">{title}</span>{children}</section> }

function getCurrentItemId(state: Pick<GameState, 'equipment'>, preview: NonNullable<ReturnType<typeof getArtificingEquipmentPreview>>, slot: NonNullable<ReturnType<typeof getArtificingOutputInspection>['equipment']>['slot']) {
  const position = preview.position ?? getDefaultEquipmentPosition(slot)
  const current = position ? state.equipment[position] : null
  return current
}

function ComparisonItem({ itemId }: { itemId: ItemId | null }) { if (!itemId) return <span className="artificing-empty-slot">EMPTY</span>; return <ItemTooltip itemId={itemId} owned={useGameStore.getState().inventory[itemId] ?? 0}><span className="artificing-comparison-icon"><ItemIcon itemId={itemId} size="tiny" /></span></ItemTooltip> }

function getImpactEntries(impact: ReturnType<typeof getArtificingEquipmentPreview>['impact']): Array<[string, number]> {
  return Object.entries(impact).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([damageType, resistance]) => [`resistance-${damageType}`, Number(resistance)]) : [[key, Number(value)]])
}

function getSnapshotValue(key: string, snapshot: NonNullable<ReturnType<typeof getArtificingEquipmentPreview>['preview']>) {
  const mapping: Record<string, keyof typeof snapshot> = { healthRegen: 'healthRegen', critDamage: 'critDamageMultiplier', damageOverTimePct: 'damageOverTimeBonus', statusDurationPct: 'statusDurationBonus', cooldownRecoveryPct: 'cooldownRecovery', healingDonePct: 'healingDoneBonus', barrierPowerPct: 'barrierPowerBonus', manaCostReductionPct: 'manaCostReduction', focusEfficiencyPct: 'focusEfficiency', fireSpellDamage: 'fireSpellDamage', airSpellDamage: 'airSpellDamage', barrierReceivedFlat: 'barrierReceivedFlat', negativeStatusDurationReceived: 'negativeStatusDurationReceived' }
  if (key.startsWith('resistance-')) return snapshot.resistances[key.replace('resistance-', '') as keyof typeof snapshot.resistances] ?? 0
  return snapshot[mapping[key] ?? key as keyof typeof snapshot] as number
}

function formatSnapshotValue(key: string, current: NonNullable<ReturnType<typeof getArtificingEquipmentPreview>['current']>) { return formatImpact(key, getSnapshotValue(key, current)) }
function formatSignedImpact(key: string, value: number) { return formatImpact(key, value, true) }
function formatImpact(key: string, value: number, signed = false) {
  const sign = signed && value > 0 ? '+' : ''
  if (key === 'damageReduction') return `${sign}${(value * 100).toFixed(1)}%`
  if (key.endsWith('Pct') || ['critChance', 'critDamage', 'fireSpellDamage', 'airSpellDamage', 'negativeStatusDurationReceived'].includes(key) || key.startsWith('resistance-')) return `${sign}${Math.round(value * 100)}%`
  if (key === 'healthRegen' || key === 'manaRegen') return `${sign}${value.toFixed(1)}/s`
  return `${sign}${Math.round(value * 100) / 100}`
}
