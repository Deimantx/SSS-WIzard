import { formatStatLabel, formatStatValue } from '../../content/presentation/balanceFormatters'
import { getEquipmentCombatPresentation } from '../equipment/equipmentCombatPresentation'
import type { ArtifactResolvedEffects, ArtifactMinorNodeDefinition, ArtifactMajorMilestoneDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactNodePresentation { summary: string; details: string[] }

export const getArtifactEffectsPresentation = (effects: ArtifactResolvedEffects): ArtifactNodePresentation => {
  const combat = getEquipmentCombatPresentation(effects.combat)
  const statDetails = Object.entries(effects.stats ?? {}).flatMap(([key, value]) => key === 'resistances'
    ? Object.entries(value ?? {}).map(([damageType, resistance]) => `${formatStatValue('resistancePct', Number(resistance))} ${formatStatLabel(damageType)} resistance`)
    : `${formatStatValue(key, Number(value))} ${formatStatLabel(key)}`)
  const specialDetails = (effects.special ?? []).map((special) => special.type.replace(/-/g, ' '))
  const details = [...combat.modifiers, ...combat.rules.map((rule) => rule.summary), ...statDetails, ...specialDetails]
  return { summary: details[0] ?? 'No active effect', details }
}
export const getArtifactMinorPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number): ArtifactNodePresentation => {
  const current = node.rankEffects[Math.max(0, currentRank - 1)]
  const next = node.rankEffects[Math.min(node.rankEffects.length - 1, currentRank)]
  const currentPresentation = current ? getArtifactEffectsPresentation(current) : { summary: 'Not invested', details: [] }
  const nextPresentation = next && currentRank < node.maxRank ? getArtifactEffectsPresentation(next) : null
  return { summary: currentRank > 0 ? currentPresentation.summary : node.description, details: [...currentPresentation.details, ...(nextPresentation ? [`Next: ${nextPresentation.summary}`] : [])] }
}
export const getArtifactMajorPresentation = (major: ArtifactMajorMilestoneDefinition) => getArtifactEffectsPresentation(major.effects)
