import type { ArcaneCoreBranchDefinition, ArcaneCoreModifierKey, ArcaneCoreNodeDefinition, ArcaneCoreRingIndex } from '../../types'
import { ARCANE_CORE_RING_OFFSETS } from '../../content/arcaneCore/arcaneCoreRings'
import type { CombatEffect, CombatModifier, CombatTriggerRule, Magnitude } from '../../systems/combat/combatTypes'

const PERCENT_STATS = new Set<ArcaneCoreModifierKey>(['critChance', 'critDamage', 'damageOverTimePct', 'blockChance', 'barrierPowerPct', 'healingDonePct', 'focusEfficiencyPct', 'manaCostReductionPct', 'cooldownRecoveryPct', 'statusDurationPct', 'basicAttackSpeedPct'])
const STAT_LABELS: Record<ArcaneCoreModifierKey, string> = {
  spellPower: 'Spell Power', critChance: 'Critical Chance', critDamage: 'Critical Damage', basicDamage: 'Basic Damage', damageOverTimePct: 'Damage over Time', maxHealth: 'Maximum Health', healthRegen: 'Health Regeneration', defense: 'Defense', blockChance: 'Block Chance', barrierPowerPct: 'Barrier Power', healingDonePct: 'Healing Done', maxMana: 'Maximum Mana', manaRegen: 'Mana Regeneration', maxFocus: 'Maximum Focus', focusEfficiencyPct: 'Combat Auto-Cast Efficiency', manaCostReductionPct: 'Spell Mana Cost', cooldownRecoveryPct: 'Cooldown Recovery', statusDurationPct: 'Status Duration', basicAttackSpeedPct: 'Basic Attack Speed',
}
const COMBAT_LABELS: Record<CombatModifier['key'], string> = {
  'health-regen-flat': 'Health Regeneration',
  'damage-dealt-percent': 'Damage Dealt', 'damage-taken-percent': 'Damage Taken', 'basic-attack-damage-percent': 'Basic Attack Damage', 'basic-attack-speed-percent': 'Basic Attack Speed', 'action-speed-percent': 'Action Speed', 'spell-damage-percent': 'Spell Damage', 'melee-damage-percent': 'Melee Damage', 'ranged-damage-percent': 'Ranged Damage', 'healing-done-percent': 'Healing Done', 'healing-received-percent': 'Healing Received', 'barrier-power-percent': 'Barrier Power', 'barrier-received-flat': 'Barrier Received', 'barrier-received-percent': 'Barrier Received', 'mana-regen-percent': 'Mana Regeneration', 'cooldown-recovery-percent': 'Cooldown Recovery', 'control-duration-received-percent': 'Control Duration Received', 'status-duration-dealt-percent': 'Status Duration', 'status-duration-received-percent': 'Status Duration Received', 'defense-flat': 'Defense', 'defense-percent': 'Defense', 'crit-chance': 'Critical Chance', 'crit-damage': 'Critical Damage', 'block-chance': 'Block Chance', 'damage-over-time-percent': 'Damage over Time', 'resistance-percent': 'Resistance',
}
const trimNumber = (value: number, digits = 2) => Number(value.toFixed(digits)).toLocaleString(undefined, { maximumFractionDigits: digits })
export const getArcaneCoreModifierLabel = (key: ArcaneCoreModifierKey) => STAT_LABELS[key] ?? key
export const formatArcaneCoreModifierValue = (key: ArcaneCoreModifierKey, value: number) => `${value >= 0 ? '+' : ''}${PERCENT_STATS.has(key) ? `${(value * 100).toFixed(2)}%` : trimNumber(value)}`
const formatCombatModifierValue = (key: CombatModifier['key'], value: number) => `${value >= 0 ? '+' : ''}${key.includes('percent') || ['crit-chance', 'crit-damage', 'block-chance'].includes(key) ? `${(value * 100).toFixed(2)}%` : trimNumber(value)}`

const formatRuleDuration = (milliseconds: number) => milliseconds >= 1000 ? `${trimNumber(milliseconds / 1000, 2)} sec` : `${trimNumber(milliseconds, 0)} ms`
const formatMagnitude = (magnitude: Magnitude, verb: string) => {
  switch (magnitude.type) {
    case 'flat': return `${verb} ${trimNumber(magnitude.value, 2)}`
    case 'source-max-health-percent': return `${verb} ${trimNumber(magnitude.value * 100, 2)}% Max Health`
    case 'target-max-health-percent': return `${verb} ${trimNumber(magnitude.value * 100, 2)}% Target Max Health`
    default: return verb
  }
}
const formatRuleEffect = (effect: CombatEffect) => {
  switch (effect.type) {
    case 'modify-cooldown': return `${effect.amountMs < 0 ? 'Reduce' : 'Delay'} ${effect.spellId === 'source' ? 'applying Spell' : effect.spellId ? `${effect.spellId} Spell` : 'Spell'} cooldowns by ${formatRuleDuration(Math.abs(effect.amountMs))}`
    case 'modify-action-timer': return `${effect.amountMs < 0 ? 'Advance' : 'Delay'} ${effect.target === 'opponent' ? 'enemy' : 'player'} ${effect.action === 'basic-attack' ? 'Basic Attack' : 'current action'} by ${formatRuleDuration(Math.abs(effect.amountMs))}`
    case 'restore-resource': return effect.resource === 'mana' ? `${formatMagnitude(effect.magnitude, 'Restore')} Mana` : formatMagnitude(effect.magnitude, 'Restore')
    case 'heal': return `${formatMagnitude(effect.magnitude, 'Heal')} Health`
    case 'gain-barrier': return formatMagnitude(effect.magnitude, 'Gain Barrier')
    default: return undefined
  }
}
const formatRule = (rule: CombatTriggerRule) => {
  const effects = rule.effects.map(formatRuleEffect).filter((text): text is string => Boolean(text)).join('; ')
  const cooldown = rule.cooldownMs && rule.cooldownMs > 0 ? ` · Internal Cooldown: ${formatRuleDuration(rule.cooldownMs)}` : ''
  return effects ? `${effects}${cooldown}` : undefined
}

export const getArcaneCoreNodeEffectTexts = (node: ArcaneCoreNodeDefinition, rank = 1) => {
  if (rank <= 0) return ['Inactive']
  const effects = node.resolveEffects(Math.max(1, Math.min(node.maxRank, rank)))
  const stats = Object.entries(effects.stats ?? {}).map(([key, value]) => `${getArcaneCoreModifierLabel(key as ArcaneCoreModifierKey)} ${formatArcaneCoreModifierValue(key as ArcaneCoreModifierKey, Number(value))}`)
  const modifiers = (effects.modifiers ?? []).map((value) => `${COMBAT_LABELS[value.key] ?? value.key} ${formatCombatModifierValue(value.key, value.value)}`)
  const rules = (effects.rules ?? []).map(formatRule).filter((text): text is string => Boolean(text))
  const special = (effects.special ?? []).map((value) => {
    switch (value.type) {
      case 'nth-damaging-spell-bonus': return `Every ${value.every}th damaging Spell +${trimNumber((value.damageMultiplier - 1) * 100, 1)}% Damage`
      case 'lethal-survival': return 'Survive lethal damage once per dungeon run'
      case 'mana-overflow-to-barrier': return `Convert ${trimNumber(value.conversion * 100, 0)}% Mana overflow to Barrier`
      case 'nth-spell-free': return `Every ${value.every}th Spell costs 0 Mana`
      case 'reserved-focus-spell-power': return `+${trimNumber(value.spellPowerPerReservedFocus)} Spell Power per reserved Focus`
      case 'free-focus-mana-regen': return `+${trimNumber(value.manaRegenPerFreeFocus)} Mana/s per free Focus`
      case 'nth-spell-cooldown-pulse': return `Every ${value.every}th Spell reduces cooldowns by ${value.cooldownReductionMs} ms`
    }
  })
  return [...stats, ...modifiers, ...rules, ...special]
}
export const formatArcaneCoreNodeEffect = (node: ArcaneCoreNodeDefinition, rank = 1) => getArcaneCoreNodeEffectTexts(node, rank).join(' · ') || node.description

export interface ArcaneCoreRingLayout {
  radius: number
  offsetDeg: number
  opacityWhenDeepLocked: number
}

export const ARCANE_CORE_CANVAS_SIZE = 4200
export const ARCANE_CORE_RING_LAYOUT: Record<ArcaneCoreRingIndex, ArcaneCoreRingLayout> = {
  1: { radius: 300, offsetDeg: ARCANE_CORE_RING_OFFSETS[1], opacityWhenDeepLocked: 0.45 },
  2: { radius: 500, offsetDeg: ARCANE_CORE_RING_OFFSETS[2], opacityWhenDeepLocked: 0.36 },
  3: { radius: 710, offsetDeg: ARCANE_CORE_RING_OFFSETS[3], opacityWhenDeepLocked: 0.3 },
  4: { radius: 930, offsetDeg: ARCANE_CORE_RING_OFFSETS[4], opacityWhenDeepLocked: 0.25 },
  5: { radius: 1160, offsetDeg: ARCANE_CORE_RING_OFFSETS[5], opacityWhenDeepLocked: 0.21 },
  6: { radius: 1400, offsetDeg: ARCANE_CORE_RING_OFFSETS[6], opacityWhenDeepLocked: 0.18 },
  7: { radius: 1650, offsetDeg: ARCANE_CORE_RING_OFFSETS[7], opacityWhenDeepLocked: 0.15 },
  8: { radius: 1910, offsetDeg: ARCANE_CORE_RING_OFFSETS[8], opacityWhenDeepLocked: 0.12 },
}
export const ARCANE_CORE_RING_RADII: Record<ArcaneCoreRingIndex, number> = Object.fromEntries(Object.entries(ARCANE_CORE_RING_LAYOUT).map(([ring, layout]) => [Number(ring), layout.radius])) as Record<ArcaneCoreRingIndex, number>
export const getArcaneCoreRingRadius = (ring: ArcaneCoreRingIndex) => ARCANE_CORE_RING_LAYOUT[ring].radius
export const getArcaneCoreNodePosition = (node: ArcaneCoreNodeDefinition) => {
  const radius = getArcaneCoreRingRadius(node.ring)
  const radians = (node.angleDeg - 90) * Math.PI / 180
  return { left: ARCANE_CORE_CANVAS_SIZE / 2 + Math.cos(radians) * radius, top: ARCANE_CORE_CANVAS_SIZE / 2 + Math.sin(radians) * radius }
}
export const getArcaneCoreBranchPointTotal = (branch: Pick<ArcaneCoreBranchDefinition, 'nodes'>, state: { nodes?: Record<string, { rank: number }> }) => branch.nodes.reduce((sum, node) => sum + (state.nodes?.[node.id]?.rank ?? 0) * node.rankCost, 0)
