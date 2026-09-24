import { formatStatLabel, formatStatValue } from '../../content/presentation/balanceFormatters'
import type { ArtifactResolvedEffects, ArtifactMinorNodeDefinition, ArtifactMajorMilestoneDefinition, ArtifactSpecialEffect } from '../../content/artifacts/artifacts'
import type { EquipmentStats } from '../../types'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'
import { getEquipmentCombatPresentation } from '../equipment/equipmentCombatPresentation'

export interface ArtifactNodePresentation { summary: string; details: string[]; currentTotal?: ArtifactNodePresentation; nextRank?: ArtifactNodePresentation | null }
const numberLabel = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const percentLabel = (value: number) => `${numberLabel(value * 100)}%`
const secondsLabel = (value: number) => `${numberLabel(value / 1000)}s`
const formatSpecialEffect = (special: ArtifactSpecialEffect) => {
  switch (special.type) {
    case 'heal-on-hp-threshold': return `Below ${percentLabel(special.threshold)}, restore ${percentLabel(special.maxHealthPercent)} of Max Health.`
    case 'damage-taken-while-barrier': return `While Barrier holds, take ${percentLabel(special.reduction)} less damage.`
    case 'critical-next-cooldown': return `After a critical ${special.school} hit, reduce your next ${special.school} Spell cooldown by ${percentLabel(special.reduction)}.`
    case 'lethal-barrier': return `When damage would be lethal, gain a Barrier equal to ${percentLabel(special.barrierMaxHealthPercent)} of Max Health.`
    case 'barrier-break': return `When Barrier breaks, gain a Barrier equal to ${percentLabel(special.barrierMaxHealthPercent)} of Max Health. Cooldown ${secondsLabel(special.cooldownMs)}.`
    case 'barrier-gain-mana': return `When you gain Barrier, restore ${percentLabel(special.maxHealthPercent)} of Max Health as Mana. Cooldown ${secondsLabel(special.cooldownMs)}.`
    case 'hp-threshold-barrier-status-immunity': return `Below ${percentLabel(special.threshold)} Health, gain a ${percentLabel(special.barrierMaxHealthPercent)} Max Health Barrier and Status immunity for ${secondsLabel(special.durationMs)}.`
    case 'nth-spell-refund': return `Every ${special.every}th Spell restores ${percentLabel(special.focusPercent)} Focus and ${percentLabel(special.manaPercent)} Mana.`
    case 'first-spell-after-focus-change': return `Your first Spell after Focus changes costs ${percentLabel(special.manaReduction)} less Mana.`
    case 'first-spell-after-idle': return `After ${secondsLabel(special.idleMs)} without casting, your next Spell deals ${percentLabel(special.damageIncrease)} more damage.`
    case 'air-spell-repeat': return `Every ${special.every}th Air Spell repeats at ${percentLabel(special.effectiveness)} effectiveness.`
    case 'burn-refresh-detonation': return `Refreshing Burning detonates ${percentLabel(special.damagePercent)} of its remaining damage.`
    case 'after-heal-water-damage': return `After healing, your next Water Spell deals ${percentLabel(special.damageIncrease)} more damage.`
    case 'critical-air-damage': return `Critical Air damage deals ${percentLabel(special.damagePercent)} more damage.`
  }
}
const modifierIdentity = (modifier: NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['modifiers']>[number]) => JSON.stringify({ ...modifier, value: undefined })
const mergeResolvedEffects = (effects: readonly ArtifactResolvedEffects[]): ArtifactResolvedEffects => {
  const stats = effects.reduce<EquipmentStats>((total, entry) => addEquipmentStats(total, entry.stats), {})
  const modifiers = new Map<string, NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['modifiers']>[number]>()
  const rules = effects.flatMap((entry) => entry.combat?.rules ?? [])
  const special = effects.flatMap((entry) => entry.special ?? [])
  effects.flatMap((entry) => entry.combat?.modifiers ?? []).forEach((modifier) => {
    const key = modifierIdentity(modifier); const prior = modifiers.get(key)
    modifiers.set(key, { ...modifier, value: (prior?.value ?? 0) + modifier.value })
  })
  return { ...(Object.keys(stats).length ? { stats } : {}), ...(modifiers.size || rules.length ? { combat: { ...(modifiers.size ? { modifiers: [...modifiers.values()] } : {}), ...(rules.length ? { rules } : {}) } } : {}), ...(special.length ? { special } : {}) }
}
export const getArtifactEffectsPresentation = (effects: ArtifactResolvedEffects): ArtifactNodePresentation => {
  const combat = getEquipmentCombatPresentation(effects.combat)
  const statDetails = Object.entries(effects.stats ?? {}).flatMap(([key, value]) => key === 'resistances' ? Object.entries(value ?? {}).map(([damageType, resistance]) => `${formatStatValue('resistancePct', Number(resistance))} ${formatStatLabel(damageType)} resistance`) : `${formatStatValue(key, Number(value))} ${formatStatLabel(key)}`)
  const details = [...combat.modifiers, ...combat.rules.map((rule) => rule.summary), ...statDetails, ...(effects.special ?? []).map(formatSpecialEffect)]
  return { summary: details[0] ?? 'No active effect', details }
}
export const getArtifactMinorCurrentTotalPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number) => getArtifactEffectsPresentation(currentRank > 0 ? mergeResolvedEffects(node.rankEffects.slice(0, currentRank)) : {})
export const getArtifactMinorNextRankPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number) => currentRank < node.maxRank ? getArtifactEffectsPresentation(node.rankEffects[currentRank]) : null
export const getArtifactMinorPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number): ArtifactNodePresentation => {
  const currentTotal = getArtifactMinorCurrentTotalPresentation(node, currentRank); const nextRank = getArtifactMinorNextRankPresentation(node, currentRank)
  return { summary: currentRank > 0 ? currentTotal.summary : node.description, details: currentTotal.details, currentTotal, nextRank }
}
export const getArtifactMajorPresentation = (major: ArtifactMajorMilestoneDefinition) => getArtifactEffectsPresentation(major.effects)
