import { formatStatLabel, formatStatValue } from '../../content/presentation/balanceFormatters'
import { getEquipmentCombatPresentation } from '../equipment/equipmentCombatPresentation'
import type { ArtifactNodeDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactNodePresentation { summary: string; details: string[] }

/** Shared player-facing formatting for Artifact node effects. */
export const getArtifactNodePresentation = (node: ArtifactNodeDefinition): ArtifactNodePresentation => {
  const combat = getEquipmentCombatPresentation(node.combat)
  const statDetails = Object.entries(node.stats ?? {}).flatMap(([key, value]) => key === 'resistances'
    ? Object.entries(value ?? {}).map(([damageType, resistance]) => `${formatStatValue('resistancePct', Number(resistance))} ${formatStatLabel(damageType)} resistance`)
    : `${formatStatValue(key, Number(value))} ${formatStatLabel(key)}`)
  const details = [...combat.modifiers, ...combat.rules.map((rule) => rule.summary), ...statDetails]
  return { summary: details[0] ?? 'Artifact combat effect', details }
}
