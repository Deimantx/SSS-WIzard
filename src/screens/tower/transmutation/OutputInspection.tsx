import { LockKeyhole } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Card } from '../../../components/ui'
import { EquipmentCombatDetails } from '../../../components/ui/item/EquipmentCombatDetails'
import { ItemIcon, ItemTooltip, flattenItemStats, formatStat, friendlyStatLabel } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getTransmutationEquipmentPreview, getTransmutationOutputInspection } from '../../../game/presentation/transmutation/transmutationOutputReadModel'
import type { EquipmentItemSlot, EquipmentPosition, GameState } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

export function OutputInspection({ recipe }: { recipe: RecipeDefinition }) {
  const state = useGameStore()
  const item = ITEMS[recipe.output.itemId]
  const inspection = getTransmutationOutputInspection(state, recipe)
  const [ringTarget, setRingTarget] = useState<EquipmentPosition | null>(null)
  if (item.kind !== 'equipment' || !inspection.equipment) return null
  const ringNeedsChoice = inspection.equipment.slot === 'ring' && Boolean(state.equipment.ring1 && state.equipment.ring2)
  const targetPosition = ringNeedsChoice ? ringTarget ?? undefined : getDefaultTargetPosition(state, inspection.equipment.slot)
  const preview = ringNeedsChoice && !ringTarget ? null : getTransmutationEquipmentPreview(state, recipe.output.itemId, targetPosition)

  return <Card className="transmutation-output-preview" title="EQUIPMENT INSPECTION" action={<span className="transmutation-count">OWNED {inspection.owned.toLocaleString()}</span>}>
    <div className="transmutation-output-content">
      <ItemTooltip itemId={inspection.itemId} owned={inspection.owned}>
        <div className="transmutation-output-hero" tabIndex={0}><span className="transmutation-output-icon"><ItemIcon itemId={inspection.itemId} size="large" /></span><div><span className="eyebrow">EQUIPMENT</span><h2>{item.name}</h2><p>{item.description}</p></div></div>
      </ItemTooltip>
      <EquipmentOutput inspection={inspection} preview={preview} ringNeedsChoice={ringNeedsChoice} ringTarget={ringTarget} onRingTargetChange={setRingTarget} />
    </div>
  </Card>
}

function EquipmentOutput({ inspection, preview, ringNeedsChoice, ringTarget, onRingTargetChange }: { inspection: ReturnType<typeof getTransmutationOutputInspection>; preview: ReturnType<typeof getTransmutationEquipmentPreview> | null; ringNeedsChoice: boolean; ringTarget: EquipmentPosition | null; onRingTargetChange: (position: EquipmentPosition) => void }) {
  const item = ITEMS[inspection.itemId]
  if (!inspection.equipment) return null
  const authoredStats = flattenItemStats(item.stats ?? {}).filter(([, value]) => Math.abs(value) > 0)
  const impactRows = preview ? getImpactEntries(preview.impact).filter(([, value]) => Math.abs(value) > 0.0001) : []
  return <>
    <DetailSection title="EQUIPMENT PROFILE"><div className="transmutation-output-meta"><span><small>SLOT</small><strong>{inspection.equipment.slot.toUpperCase()}</strong></span>{inspection.equipment.hands && <span><small>HANDS</small><strong>{inspection.equipment.hands}H</strong></span>}{inspection.equipment.presentation && <span><small>OFFHAND TYPE</small><strong>{inspection.equipment.presentation.toUpperCase()}</strong></span>}<span><small>OWNED</small><strong>{inspection.owned.toLocaleString()}</strong></span></div></DetailSection>
    {authoredStats.length > 0 && <DetailSection title="AUTHORED STATS"><div className="transmutation-output-stat-list">{authoredStats.map(([key, value]) => <div key={key}><span>{friendlyStatLabel(key)}</span><strong>{formatStat(key, value)}</strong></div>)}</div></DetailSection>}
    <EquipmentCombatDetails item={item} />
    {ringNeedsChoice && <DetailSection title="RING POSITION"><p className="transmutation-output-note">Both Ring positions are occupied. Choose which existing Ring this output would replace.</p><div className="transmutation-ring-choices"><RingChoice position="ring1" itemId={useGameStore.getState().equipment.ring1} selected={ringTarget === 'ring1'} onClick={() => onRingTargetChange('ring1')} /><RingChoice position="ring2" itemId={useGameStore.getState().equipment.ring2} selected={ringTarget === 'ring2'} onClick={() => onRingTargetChange('ring2')} /></div></DetailSection>}
    {preview?.removedOffhand && <div className="transmutation-output-warning"><LockKeyhole size={14} aria-hidden="true" /><span>{ITEMS[preview.removedOffhand].name} would be removed because this is a two-handed Weapon.</span></div>}
    {preview && !preview.compatible && <div className="transmutation-output-warning"><LockKeyhole size={14} aria-hidden="true" /><span>{preview.reason}</span></div>}
    {preview?.compatible && preview.preview && <DetailSection title="LOADOUT COMPARISON"><div className="transmutation-output-current"><span>CURRENT</span><strong>{getCurrentItemName(useGameStore.getState(), preview, inspection.equipment.slot)}</strong></div><div className="transmutation-output-stat-list comparison">{impactRows.map(([key, value]) => <div key={key}><span>{friendlyStatLabel(key)}</span><small>{formatSnapshotValue(key, preview.current)} → {formatSnapshotValue(key, preview.preview!)}</small><strong className={value > 0 ? 'positive' : 'negative'}>{formatSignedImpact(key, value)}</strong></div>)}</div>{impactRows.length === 0 && <p className="transmutation-output-note">No authored loadout stat change for this replacement.</p>}</DetailSection>}
    {!preview && ringNeedsChoice && <div className="transmutation-output-note">Select Ring 1 or Ring 2 to calculate the real loadout impact.</div>}
  </>
}

function RingChoice({ position, itemId, selected, onClick }: { position: 'ring1' | 'ring2'; itemId: GameState['equipment']['ring1']; selected: boolean; onClick: () => void }) {
  return <button type="button" className={`transmutation-ring-choice ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={onClick}><span>{position === 'ring1' ? 'RING 1' : 'RING 2'}</span><strong>{itemId ? ITEMS[itemId].name : 'Empty'}</strong></button>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="transmutation-output-section"><span className="eyebrow">{title}</span>{children}</section> }

function getDefaultTargetPosition(state: Pick<GameState, 'equipment'>, slot?: EquipmentItemSlot): EquipmentPosition | undefined {
  if (!slot) return undefined
  if (slot === 'ring') return state.equipment.ring1 ? 'ring2' : 'ring1'
  return slot
}

function getCurrentItemName(state: Pick<GameState, 'equipment'>, preview: NonNullable<ReturnType<typeof getTransmutationEquipmentPreview>>, slot: NonNullable<ReturnType<typeof getTransmutationOutputInspection>['equipment']>['slot']) {
  const position = preview.position ?? (slot === 'ring' ? 'ring1' : slot)
  const current = position ? state.equipment[position] : null
  return current ? ITEMS[current].name : 'Empty'
}

function getImpactEntries(impact: ReturnType<typeof getTransmutationEquipmentPreview>['impact']): Array<[string, number]> {
  return Object.entries(impact).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([damageType, resistance]) => [`resistance-${damageType}`, Number(resistance)]) : [[key, Number(value)]])
}

function getSnapshotValue(key: string, snapshot: NonNullable<ReturnType<typeof getTransmutationEquipmentPreview>['preview']>) {
  const mapping: Record<string, keyof typeof snapshot> = { basicAttackSpeedPct: 'basicAttackSpeedMultiplier', critDamage: 'critDamageMultiplier', damageOverTimePct: 'damageOverTimeBonus', statusDurationPct: 'statusDurationBonus', cooldownRecoveryPct: 'cooldownRecovery', healingDonePct: 'healingDoneBonus', barrierPowerPct: 'barrierPowerBonus', manaCostReductionPct: 'manaCostReduction', focusEfficiencyPct: 'focusEfficiency', fireSpellDamage: 'fireSpellDamage', airSpellDamage: 'airSpellDamage', waterBarrierPower: 'waterBarrierPower', barrierReceivedFlat: 'barrierReceivedFlat', negativeStatusDurationReceived: 'negativeStatusDurationReceived' }
  if (key.startsWith('resistance-')) return snapshot.resistances[key.replace('resistance-', '') as keyof typeof snapshot.resistances] ?? 0
  return snapshot[mapping[key] ?? key as keyof typeof snapshot] as number
}

function formatSnapshotValue(key: string, current: NonNullable<ReturnType<typeof getTransmutationEquipmentPreview>['current']>) { return formatImpact(key, getSnapshotValue(key, current)) }
function formatSignedImpact(key: string, value: number) { return formatImpact(key, value, true) }
function formatImpact(key: string, value: number, signed = false) {
  const sign = signed && value > 0 ? '+' : ''
  if (key === 'damageReduction') return `${sign}${(value * 100).toFixed(1)}%`
  if (key.endsWith('Pct') || ['critChance', 'critDamage', 'blockChance', 'fireSpellDamage', 'airSpellDamage', 'waterBarrierPower', 'negativeStatusDurationReceived'].includes(key) || key.startsWith('resistance-')) return `${sign}${Math.round(value * 100)}%`
  if (key === 'manaRegen') return `${sign}${value.toFixed(1)}/s`
  return `${sign}${Math.round(value * 100) / 100}`
}
