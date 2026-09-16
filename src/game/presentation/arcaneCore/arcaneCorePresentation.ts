import type { ArcaneCoreBranchDefinition, ArcaneCoreModifierKey, ArcaneCoreNodeDefinition } from '../../types'
import type { CombatModifier } from '../../systems/combat/combatTypes'

export const ARCANE_CORE_NODE_WIDTH = 86
export const ARCANE_CORE_NODE_HEIGHT = 54
export const ARCANE_CORE_NODE_STEP_X = 112
export const ARCANE_CORE_NODE_STEP_Y = 76
export const ARCANE_CORE_GRAPH_PADDING_X = 24
export const ARCANE_CORE_GRAPH_PADDING_TOP = 20
export const ARCANE_CORE_GRAPH_PADDING_BOTTOM = 24
export const ARCANE_CORE_HUB_WIDTH = 140
export const ARCANE_CORE_HUB_HEIGHT = 34
export const ARCANE_CORE_HUB_GAP = 18

const PERCENT_MODIFIERS = new Set<ArcaneCoreModifierKey>([
  'critChance',
  'critDamage',
  'damageOverTimePct',
  'blockChance',
  'barrierPowerPct',
  'healingDonePct',
  'focusEfficiencyPct',
  'manaCostReductionPct',
  'cooldownRecoveryPct',
  'statusDurationPct',
  'basicAttackSpeedPct',
])

const MODIFIER_LABELS: Record<ArcaneCoreModifierKey, string> = {
  spellPower: 'Spell Power',
  critChance: 'Critical Chance',
  critDamage: 'Critical Damage',
  basicDamage: 'Basic Damage',
  damageOverTimePct: 'Damage over Time',
  maxHealth: 'Maximum Health',
  healthRegen: 'Health Regeneration',
  defense: 'Defense',
  blockChance: 'Block Chance',
  barrierPowerPct: 'Barrier Power',
  healingDonePct: 'Healing Done',
  maxMana: 'Maximum Mana',
  manaRegen: 'Mana Regeneration',
  maxFocus: 'Maximum Focus',
  focusEfficiencyPct: 'Focus Efficiency',
  manaCostReductionPct: 'Mana Cost Reduction',
  cooldownRecoveryPct: 'Cooldown Recovery',
  statusDurationPct: 'Status Duration',
  basicAttackSpeedPct: 'Basic Attack Speed',
}

const COMBAT_MODIFIER_LABELS: Record<CombatModifier['key'], string> = {
  'damage-dealt-percent': 'Damage Dealt',
  'damage-taken-percent': 'Damage Taken',
  'basic-attack-damage-percent': 'Basic Attack Damage',
  'basic-attack-speed-percent': 'Basic Attack Speed',
  'action-speed-percent': 'Action Speed',
  'spell-damage-percent': 'Spell Damage',
  'melee-damage-percent': 'Melee Damage',
  'ranged-damage-percent': 'Ranged Damage',
  'healing-done-percent': 'Healing Done',
  'healing-received-percent': 'Healing Received',
  'barrier-power-percent': 'Barrier Power',
  'barrier-received-flat': 'Barrier Received',
  'barrier-received-percent': 'Barrier Received',
  'mana-regen-percent': 'Mana Regeneration',
  'cooldown-recovery-percent': 'Cooldown Recovery',
  'control-duration-received-percent': 'Control Duration Received',
  'status-duration-dealt-percent': 'Status Duration',
  'status-duration-received-percent': 'Status Duration Received',
  'defense-flat': 'Defense',
  'crit-chance': 'Critical Chance',
  'crit-damage': 'Critical Damage',
  'block-chance': 'Block Chance',
  'damage-over-time-percent': 'Damage over Time',
  'resistance-percent': 'Resistance',
}

const trimNumber = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits))
  return rounded.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export const getArcaneCoreModifierLabel = (key: ArcaneCoreModifierKey) => MODIFIER_LABELS[key] ?? key

export const formatArcaneCoreModifierValue = (key: ArcaneCoreModifierKey, value: number) => {
  const sign = value >= 0 ? '+' : ''
  return PERCENT_MODIFIERS.has(key) ? `${sign}${(value * 100).toFixed(2)}%` : `${sign}${trimNumber(value, 2)}`
}

const formatCombatModifierValue = (key: CombatModifier['key'], value: number) => {
  const percent = key.endsWith('percent') || key === 'crit-chance' || key === 'crit-damage' || key === 'block-chance'
  const sign = value >= 0 ? '+' : ''
  return percent ? `${sign}${(value * 100).toFixed(2)}%` : `${sign}${trimNumber(value, 2)}`
}

const formatSpecialEffect = (node: ArcaneCoreNodeDefinition) => (node.special ?? []).map((special) => {
  switch (special.type) {
    case 'nth-damaging-spell-bonus': return `Every ${special.every}th damaging Spell +${trimNumber((special.damageMultiplier - 1) * 100, 0)}% Damage`
    case 'lethal-survival': return 'Survive lethal damage once per dungeon run'
    case 'mana-overflow-to-barrier': return `Convert ${trimNumber(special.conversion * 100, 0)}% Mana overflow to Barrier`
    case 'nth-spell-free': return `Every ${special.every}th Spell costs 0 Mana`
    case 'reserved-focus-spell-power': return `+${trimNumber(special.spellPowerPerReservedFocus, 2)} Spell Power per reserved Focus`
    case 'free-focus-mana-regen': return `+${trimNumber(special.manaRegenPerFreeFocus, 2)} Mana/s per free Focus`
    case 'nth-spell-cooldown-pulse': return `Every ${special.every}th Spell reduces cooldowns by ${special.cooldownReductionMs} ms`
  }
})

export const getArcaneCoreNodeEffectTexts = (node: ArcaneCoreNodeDefinition) => [
  ...Object.entries(node.stats ?? {}).map(([key, value]) => `${getArcaneCoreModifierLabel(key as ArcaneCoreModifierKey)} ${formatArcaneCoreModifierValue(key as ArcaneCoreModifierKey, Number(value))}`),
  ...(node.modifiers ?? []).map((modifier) => `${COMBAT_MODIFIER_LABELS[modifier.key] ?? modifier.key} ${formatCombatModifierValue(modifier.key, modifier.value)}`),
  ...formatSpecialEffect(node),
]

export const formatArcaneCoreNodeEffect = (node: ArcaneCoreNodeDefinition, _legacyRank = 1) => getArcaneCoreNodeEffectTexts(node).join(' · ') || node.description

export interface ArcaneCoreGraphGeometry {
  width: number
  height: number
  nodeLeft: (node: ArcaneCoreNodeDefinition) => number
  nodeTop: (node: ArcaneCoreNodeDefinition) => number
  nodeCenterX: (node: ArcaneCoreNodeDefinition) => number
  nodeCenterY: (node: ArcaneCoreNodeDefinition) => number
  hub: { left: number; top: number; width: number; height: number; centerX: number; bottomY: number }
}

export const getArcaneCoreGraphGeometry = (branch: Pick<ArcaneCoreBranchDefinition, 'nodes'>): ArcaneCoreGraphGeometry => {
  const maxX = Math.max(0, ...branch.nodes.map((node) => node.x))
  const maxY = Math.max(0, ...branch.nodes.map((node) => node.y))
  const gridTop = ARCANE_CORE_GRAPH_PADDING_TOP + ARCANE_CORE_HUB_HEIGHT + ARCANE_CORE_HUB_GAP
  const width = ARCANE_CORE_GRAPH_PADDING_X * 2 + maxX * ARCANE_CORE_NODE_STEP_X + ARCANE_CORE_NODE_WIDTH
  const height = gridTop + maxY * ARCANE_CORE_NODE_STEP_Y + ARCANE_CORE_NODE_HEIGHT + ARCANE_CORE_GRAPH_PADDING_BOTTOM
  const hubLeft = (width - ARCANE_CORE_HUB_WIDTH) / 2
  const nodeLeft = (node: ArcaneCoreNodeDefinition) => ARCANE_CORE_GRAPH_PADDING_X + node.x * ARCANE_CORE_NODE_STEP_X
  const nodeTop = (node: ArcaneCoreNodeDefinition) => gridTop + node.y * ARCANE_CORE_NODE_STEP_Y
  return {
    width,
    height,
    nodeLeft,
    nodeTop,
    nodeCenterX: (node) => nodeLeft(node) + ARCANE_CORE_NODE_WIDTH / 2,
    nodeCenterY: (node) => nodeTop(node) + ARCANE_CORE_NODE_HEIGHT / 2,
    hub: { left: hubLeft, top: ARCANE_CORE_GRAPH_PADDING_TOP, width: ARCANE_CORE_HUB_WIDTH, height: ARCANE_CORE_HUB_HEIGHT, centerX: hubLeft + ARCANE_CORE_HUB_WIDTH / 2, bottomY: ARCANE_CORE_GRAPH_PADDING_TOP + ARCANE_CORE_HUB_HEIGHT },
  }
}

export interface ArcaneCoreConnectorSegment {
  sourceId: string
  targetId: string
  x1: number
  y1: number
  x2: number
  y2: number
  virtual?: boolean
}

export const getArcaneCoreConnectorSegments = (branch: ArcaneCoreBranchDefinition, geometry = getArcaneCoreGraphGeometry(branch)): ArcaneCoreConnectorSegment[] => {
  const nodesById = new Map(branch.nodes.map((node) => [node.id, node]))
  const connectors = branch.nodes.flatMap((node) => node.prerequisites.flatMap((parentId) => {
    const parent = nodesById.get(parentId)
    return parent ? [{ sourceId: parent.id, targetId: node.id, x1: geometry.nodeCenterX(parent), y1: geometry.nodeCenterY(parent), x2: geometry.nodeCenterX(node), y2: geometry.nodeCenterY(node) }] : []
  }))
  const starterConnectors = branch.nodes.filter((node) => node.prerequisites.length === 0).map((node) => ({ sourceId: branch.rootId, targetId: node.id, x1: geometry.hub.centerX, y1: geometry.hub.bottomY, x2: geometry.nodeCenterX(node), y2: geometry.nodeTop(node), virtual: true }))
  return [...starterConnectors, ...connectors]
}
