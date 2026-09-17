import type { ArcaneCoreBranchDefinition, ArcaneCoreModifierKey, ArcaneCoreNodeDefinition } from '../../types'
import type { CombatModifier } from '../../systems/combat/combatTypes'

const PERCENT_STATS = new Set<ArcaneCoreModifierKey>(['critChance', 'critDamage', 'damageOverTimePct', 'blockChance', 'barrierPowerPct', 'healingDonePct', 'focusEfficiencyPct', 'manaCostReductionPct', 'cooldownRecoveryPct', 'statusDurationPct', 'basicAttackSpeedPct'])
const STAT_LABELS: Record<ArcaneCoreModifierKey, string> = {
  spellPower: 'Spell Power', critChance: 'Critical Chance', critDamage: 'Critical Damage', basicDamage: 'Basic Damage', damageOverTimePct: 'Damage over Time', maxHealth: 'Maximum Health', healthRegen: 'Health Regeneration', defense: 'Defense', blockChance: 'Block Chance', barrierPowerPct: 'Barrier Power', healingDonePct: 'Healing Done', maxMana: 'Maximum Mana', manaRegen: 'Mana Regeneration', maxFocus: 'Maximum Focus', focusEfficiencyPct: 'Combat Auto-Cast Efficiency', manaCostReductionPct: 'Spell Mana Cost', cooldownRecoveryPct: 'Cooldown Recovery', statusDurationPct: 'Status Duration', basicAttackSpeedPct: 'Basic Attack Speed',
}
const COMBAT_LABELS: Record<CombatModifier['key'], string> = {
  'damage-dealt-percent': 'Damage Dealt', 'damage-taken-percent': 'Damage Taken', 'basic-attack-damage-percent': 'Basic Attack Damage', 'basic-attack-speed-percent': 'Basic Attack Speed', 'action-speed-percent': 'Action Speed', 'spell-damage-percent': 'Spell Damage', 'melee-damage-percent': 'Melee Damage', 'ranged-damage-percent': 'Ranged Damage', 'healing-done-percent': 'Healing Done', 'healing-received-percent': 'Healing Received', 'barrier-power-percent': 'Barrier Power', 'barrier-received-flat': 'Barrier Received', 'barrier-received-percent': 'Barrier Received', 'mana-regen-percent': 'Mana Regeneration', 'cooldown-recovery-percent': 'Cooldown Recovery', 'control-duration-received-percent': 'Control Duration Received', 'status-duration-dealt-percent': 'Status Duration', 'status-duration-received-percent': 'Status Duration Received', 'defense-flat': 'Defense', 'crit-chance': 'Critical Chance', 'crit-damage': 'Critical Damage', 'block-chance': 'Block Chance', 'damage-over-time-percent': 'Damage over Time', 'resistance-percent': 'Resistance',
}
const trimNumber = (value: number, digits = 2) => Number(value.toFixed(digits)).toLocaleString(undefined, { maximumFractionDigits: digits })
export const getArcaneCoreModifierLabel = (key: ArcaneCoreModifierKey) => STAT_LABELS[key] ?? key
export const formatArcaneCoreModifierValue = (key: ArcaneCoreModifierKey, value: number) => `${value >= 0 ? '+' : ''}${PERCENT_STATS.has(key) ? `${(value * 100).toFixed(2)}%` : trimNumber(value)}`
const formatCombatModifierValue = (key: CombatModifier['key'], value: number) => `${value >= 0 ? '+' : ''}${key.includes('percent') || ['crit-chance', 'crit-damage', 'block-chance'].includes(key) ? `${(value * 100).toFixed(2)}%` : trimNumber(value)}`

export const getArcaneCoreNodeEffectTexts = (node: ArcaneCoreNodeDefinition, rank = 1) => {
  const effects = node.resolveEffects(Math.max(1, Math.min(node.maxRank, rank)))
  const stats = Object.entries(effects.stats ?? {}).map(([key, value]) => `${getArcaneCoreModifierLabel(key as ArcaneCoreModifierKey)} ${formatArcaneCoreModifierValue(key as ArcaneCoreModifierKey, Number(value))}`)
  const modifiers = (effects.modifiers ?? []).map((value) => `${COMBAT_LABELS[value.key] ?? value.key} ${formatCombatModifierValue(value.key, value.value)}`)
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
  return [...stats, ...modifiers, ...special]
}
export const formatArcaneCoreNodeEffect = (node: ArcaneCoreNodeDefinition, rank = 1) => getArcaneCoreNodeEffectTexts(node, rank).join(' · ') || node.description

export const ARCANE_CORE_CANVAS_SIZE = 1600
export const ARCANE_CORE_RING_RADII: Record<1 | 2 | 3 | 4, number> = { 1: 240, 2: 400, 3: 570, 4: 750 }
export const getArcaneCoreRingRadius = (ring: 1 | 2 | 3 | 4) => ARCANE_CORE_RING_RADII[ring]
export const getArcaneCoreNodePosition = (node: ArcaneCoreNodeDefinition) => {
  const radius = getArcaneCoreRingRadius(node.ring)
  const radians = (node.angleDeg - 90) * Math.PI / 180
  return { left: ARCANE_CORE_CANVAS_SIZE / 2 + Math.cos(radians) * radius, top: ARCANE_CORE_CANVAS_SIZE / 2 + Math.sin(radians) * radius }
}
export const getArcaneCoreBranchPointTotal = (branch: Pick<ArcaneCoreBranchDefinition, 'nodes'>, state: { nodes?: Record<string, { rank: number }> }) => branch.nodes.reduce((sum, node) => sum + (state.nodes?.[node.id]?.rank ?? 0) * node.rankCost, 0)
