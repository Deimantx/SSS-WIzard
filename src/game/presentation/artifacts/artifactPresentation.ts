import { formatStatLabel, formatStatValue } from '../../content/presentation/balanceFormatters'
import type { ArtifactResolvedEffects, ArtifactMinorNodeDefinition, ArtifactMajorMilestoneDefinition, ArtifactSpecialEffect } from '../../content/artifacts/artifacts'
import type { CombatEffect, CombatModifier, CombatTriggerRule, DamageType } from '../../systems/combat/combatTypes'
import { getEquipmentCombatPresentation } from '../equipment/equipmentCombatPresentation'
import { mergeArtifactResolvedEffects } from '../../systems/artifacts/artifactProgression'

export type ArtifactEffectTone = 'artifact' | 'fire' | 'water' | 'earth' | 'air' | 'health' | 'defense' | 'mana' | 'critical' | 'utility' | 'special'

export interface ArtifactEffectPresentationLine {
  text: string
  tone: ArtifactEffectTone
  kind?: 'numeric' | 'special'
}

export interface ArtifactNodePresentation {
  summary: string
  details: string[]
  effectLines: ArtifactEffectPresentationLine[]
  compactEffectLines: ArtifactEffectPresentationLine[]
  specialEffectLines: ArtifactEffectPresentationLine[]
  /** Compact graph-safe rows; excludes long signature mechanics. */
  compactDetails?: string[]
  hasSpecialEffect?: boolean
  currentTotal?: ArtifactNodePresentation
  nextRank?: ArtifactNodePresentation | null
}

const numberLabel = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const percentLabel = (value: number) => `${numberLabel(value * 100)}%`
const secondsLabel = (value: number) => `${numberLabel(value / 1000)}s`

const damageTone = (damageTypes: readonly DamageType[] | undefined): ArtifactEffectTone | null => {
  const type = damageTypes?.length === 1 ? damageTypes[0] : undefined
  return type === 'fire' || type === 'water' || type === 'earth' || type === 'air' ? type : null
}

const statTone = (key: string, damageType?: DamageType): ArtifactEffectTone => {
  const damage = damageTone(damageType ? [damageType] : undefined)
  if (damage) return damage
  if (key === 'maxHealth' || key === 'maxHealthPct' || key === 'healthRegen') return 'health'
  if (key === 'defense' || key === 'damageReductionPct' || key === 'barrierPowerPct') return 'defense'
  if (key === 'maxMana' || key === 'maxManaPct' || key === 'manaRegen' || key === 'manaCostReductionPct') return 'mana'
  if (key === 'critChance' || key === 'critDamage') return 'critical'
  if (key === 'cooldownRecoveryPct' || key === 'statusDurationPct') return 'air'
  return 'artifact'
}

const modifierTone = (modifier: CombatModifier): ArtifactEffectTone => {
  const damage = damageTone(modifier.damageTypes)
  if (damage) return damage
  if (modifier.key === 'crit-chance' || modifier.key === 'crit-damage') return 'critical'
  if (modifier.key === 'damage-taken-percent' || modifier.key === 'defense-flat' || modifier.key === 'defense-percent' || modifier.key === 'barrier-power-percent' || modifier.key === 'barrier-received-flat' || modifier.key === 'barrier-received-percent' || modifier.key === 'resistance-percent') return 'defense'
  if (modifier.key === 'healing-done-percent' || modifier.key === 'healing-received-percent') return 'water'
  if (modifier.key === 'mana-regen-percent') return 'mana'
  if (modifier.key === 'damage-over-time-percent') return 'fire'
  if (modifier.key === 'cooldown-recovery-percent' || modifier.key === 'spell-cast-time-percent' || modifier.key === 'action-speed-percent' || modifier.key === 'basic-attack-speed-percent') return 'air'
  return 'artifact'
}

const effectTone = (effect: CombatEffect): ArtifactEffectTone => {
  switch (effect.type) {
    case 'deal-damage': return damageTone(effect.components.map((component) => component.damageType)) ?? 'artifact'
    case 'heal': return 'health'
    case 'gain-barrier': return 'defense'
    case 'restore-resource': return 'mana'
    case 'drain-resource': return 'mana'
    case 'modify-cooldown':
    case 'modify-action-timer': return 'air'
    default: return 'special'
  }
}

const ruleTone = (rule: CombatTriggerRule): ArtifactEffectTone => rule.effects.map(effectTone).find((tone) => tone !== 'special') ?? 'special'

const formatSpecialEffect = (special: ArtifactSpecialEffect) => {
  switch (special.type) {
    case 'heal-on-hp-threshold': return `Below ${percentLabel(special.threshold)}, restore ${percentLabel(special.maxHealthPercent)} of Max Health.`
    case 'damage-taken-while-barrier': return `While Barrier holds, take ${percentLabel(special.reduction)} less damage.`
    case 'critical-next-cooldown': return `After a critical ${special.school} hit, reduce your next ${special.school} Spell cooldown by ${percentLabel(special.reduction)}.`
    case 'lethal-barrier': return `When damage would be lethal, gain a Barrier equal to ${percentLabel(special.barrierMaxHealthPercent)} of Max Health.`
    case 'barrier-break': return `When Barrier breaks, gain a Barrier equal to ${percentLabel(special.barrierMaxHealthPercent)} of Max Health. Cooldown ${secondsLabel(special.cooldownMs)}.`
    case 'barrier-gain-mana': return `When you gain Barrier, restore ${percentLabel(special.maxHealthPercent)} of Max Health as Mana. Cooldown ${secondsLabel(special.cooldownMs)}.`
    case 'hp-threshold-barrier-status-immunity': return `Below ${percentLabel(special.threshold)} Health, gain a ${percentLabel(special.barrierMaxHealthPercent)} Max Health Barrier and Status immunity for ${secondsLabel(special.durationMs)}.`
    case 'nth-spell-mana-refund': return `Every ${special.every}th Spell refunds ${percentLabel(special.manaPercent)} of its final Mana cost.`
    case 'mana-band-shift': return `When Mana crosses a 25%, 50%, or 75% boundary, the next Spell costs ${percentLabel(special.manaReduction)} less Mana. One prepared bonus at a time. Internal cooldown: ${secondsLabel(special.cooldownMs)}.`
    case 'first-spell-after-idle': return `After ${secondsLabel(special.idleMs)} without casting, your next Spell deals ${percentLabel(special.damageIncrease)} more damage.`
    case 'air-spell-repeat': return `Every ${special.every}th Air Spell repeats at ${percentLabel(special.effectiveness)} effectiveness.`
    case 'burn-refresh-detonation': return `Refreshing Burning detonates ${percentLabel(special.damagePercent)} of its remaining damage.`
    case 'after-heal-water-damage': return `After healing, your next Water Spell deals ${percentLabel(special.damageIncrease)} more damage.`
    case 'critical-air-damage': return `Critical Air damage deals ${percentLabel(special.damagePercent)} more damage.`
  }
}

const toLine = (text: string, tone: ArtifactEffectTone, kind: ArtifactEffectPresentationLine['kind'] = 'numeric'): ArtifactEffectPresentationLine => ({ text, tone, kind })

export const getArtifactEffectsPresentation = (effects: ArtifactResolvedEffects): ArtifactNodePresentation => {
  const combat = getEquipmentCombatPresentation(effects.combat)
  const modifiers = effects.combat?.modifiers ?? []
  const rules = effects.combat?.rules ?? []
  const statLines = Object.entries(effects.stats ?? {}).flatMap(([key, value]) => key === 'resistances'
    ? Object.entries(value ?? {}).map(([damageType, resistance]) => toLine(`${formatStatValue('resistancePct', Number(resistance))} ${formatStatLabel(damageType)} resistance`, statTone('resistances', damageType as DamageType)))
    : toLine(`${formatStatValue(key, Number(value))} ${formatStatLabel(key)}`, statTone(key)))
  const modifierLines = combat.modifiers.map((text, index) => toLine(text, modifierTone(modifiers[index])))
  const ruleLines = combat.rules.map((rule, index) => toLine(rule.summary, ruleTone(rules[index])))
  const specialLines = (effects.special ?? []).map((special) => toLine(formatSpecialEffect(special), 'special', 'special'))
  const compactEffectLines = [...modifierLines, ...ruleLines, ...statLines]
  const effectLines = [...compactEffectLines, ...specialLines]
  const details = effectLines.map((line) => line.text)
  return {
    summary: details[0] ?? 'No active effect',
    details,
    effectLines,
    compactEffectLines,
    specialEffectLines: specialLines,
    compactDetails: compactEffectLines.map((line) => line.text),
    hasSpecialEffect: specialLines.length > 0,
  }
}

export const getArtifactMinorCurrentTotalPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number) => getArtifactEffectsPresentation(currentRank > 0 ? mergeArtifactResolvedEffects(node.rankEffects.slice(0, currentRank)) : {})
export const getArtifactMinorNextRankPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number) => currentRank < node.maxRank ? getArtifactEffectsPresentation(node.rankEffects[currentRank]) : null
export const getArtifactMinorPresentation = (node: ArtifactMinorNodeDefinition, currentRank: number): ArtifactNodePresentation => {
  const currentTotal = getArtifactMinorCurrentTotalPresentation(node, currentRank); const nextRank = getArtifactMinorNextRankPresentation(node, currentRank)
  return { summary: currentRank > 0 ? currentTotal.summary : node.description, details: currentTotal.details, effectLines: currentTotal.effectLines, compactEffectLines: currentTotal.compactEffectLines, specialEffectLines: currentTotal.specialEffectLines, currentTotal, nextRank }
}
export const getArtifactMajorPresentation = (major: ArtifactMajorMilestoneDefinition) => getArtifactEffectsPresentation(major.effects)

export const getArtifactEffectLineClassName = (line: ArtifactEffectPresentationLine) => `artifact-effect-line tone-${line.tone}`
