import type { ArcaneCoreBranchDefinition, ArcaneCoreModifierKey, ArcaneCoreNodeDefinition } from '../../types'

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

const trimNumber = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits))
  return rounded.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export const getArcaneCoreModifierLabel = (key: ArcaneCoreModifierKey) => MODIFIER_LABELS[key] ?? key

export const formatArcaneCoreModifierValue = (key: ArcaneCoreModifierKey, value: number) => {
  const sign = value >= 0 ? '+' : ''
  return PERCENT_MODIFIERS.has(key) ? `${sign}${(value * 100).toFixed(2)}%` : `${sign}${trimNumber(value, 2)}`
}

export const formatArcaneCoreNodeEffect = (node: ArcaneCoreNodeDefinition, rank: number) => `${getArcaneCoreModifierLabel(node.effect.key)} ${formatArcaneCoreModifierValue(node.effect.key, node.effect.perRank * rank)}`

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
