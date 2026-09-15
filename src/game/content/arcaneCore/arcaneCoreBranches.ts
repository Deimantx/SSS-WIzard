import type { ArcaneCoreBranchDefinition, ArcaneCoreModifierKey } from '../../types'
import { ARCANE_CORE_NODE_MAX_RANK } from './arcaneCoreBalance'

const EFFECT_POOLS: Record<ArcaneCoreBranchDefinition['id'], readonly { key: ArcaneCoreModifierKey; label: string; perRank: number }[]> = {
  power: [
    { key: 'spellPower', label: 'Spell Power', perRank: 1 },
    { key: 'critChance', label: 'Critical Chance', perRank: 0.002 },
    { key: 'critDamage', label: 'Critical Damage', perRank: 0.01 },
    { key: 'basicDamage', label: 'Basic Damage', perRank: 1 },
    { key: 'damageOverTimePct', label: 'Damage over Time', perRank: 0.002 },
  ],
  vitality: [
    { key: 'maxHealth', label: 'Maximum Health', perRank: 2 },
    { key: 'healthRegen', label: 'Health Regeneration', perRank: 0.2 },
    { key: 'defense', label: 'Defense', perRank: 0.5 },
    { key: 'blockChance', label: 'Block Chance', perRank: 0.002 },
    { key: 'barrierPowerPct', label: 'Barrier Power', perRank: 0.002 },
    { key: 'healingDonePct', label: 'Healing Done', perRank: 0.002 },
  ],
  focus: [
    { key: 'maxMana', label: 'Maximum Mana', perRank: 2 },
    { key: 'manaRegen', label: 'Mana Regeneration', perRank: 0.2 },
    { key: 'maxFocus', label: 'Maximum Focus', perRank: 1 },
    { key: 'focusEfficiencyPct', label: 'Focus Efficiency', perRank: 0.002 },
    { key: 'manaCostReductionPct', label: 'Mana Cost Reduction', perRank: 0.002 },
  ],
  control: [
    { key: 'cooldownRecoveryPct', label: 'Cooldown Recovery', perRank: 0.002 },
    { key: 'statusDurationPct', label: 'Status Duration', perRank: 0.002 },
    { key: 'basicAttackSpeedPct', label: 'Basic Attack Speed', perRank: 0.002 },
    { key: 'manaCostReductionPct', label: 'Mana Cost Reduction', perRank: 0.002 },
    { key: 'focusEfficiencyPct', label: 'Focus Efficiency', perRank: 0.002 },
  ],
}

const pad = (value: number) => String(value).padStart(2, '0')
const nodeId = (branchId: ArcaneCoreBranchDefinition['id'], index: number) => `${branchId}-${pad(index + 1)}`

/**
 * The 8x8 lattice is authored from fixed branch-specific effect pools. Its
 * coordinates and prerequisite topology are deterministic content, not a
 * runtime roll or random node generator.
 */
const createBranch = (id: ArcaneCoreBranchDefinition['id'], name: string, description: string, accent: string): ArcaneCoreBranchDefinition => ({
  id,
  name,
  description,
  accent,
  rootId: `${id}-root`,
  nodes: Array.from({ length: 64 }, (_, index) => {
    const x = Math.floor(index / 8)
    const y = index % 8
    const pool = EFFECT_POOLS[id]
    const effect = pool[(index + x) % pool.length]
    const primary = x === 0 ? null : nodeId(id, (x - 1) * 8 + y)
    const alternate = x === 0 || y % 3 !== 0 ? null : nodeId(id, (x - 1) * 8 + ((y + 1) % 8))
    const prerequisites = [primary, alternate].filter((value): value is string => Boolean(value))
    return {
      id: nodeId(id, index),
      branchId: id,
      name: `${effect.label} ${pad(index + 1)}`,
      description: `Strengthens the Arcane Core's ${effect.label.toLowerCase()} lattice.`,
      x,
      y,
      maxRank: ARCANE_CORE_NODE_MAX_RANK,
      prerequisites,
      prerequisiteMode: alternate && y % 2 === 0 ? 'all' : 'any',
      effect,
    }
  }),
})

export const ARCANE_CORE_BRANCHES: ArcaneCoreBranchDefinition[] = [
  createBranch('power', 'Power', 'Sharpen spellcraft, critical force, and direct offense.', 'var(--arcane-core-power)'),
  createBranch('vitality', 'Vitality', 'Build a stronger frame, ward, and recovery cycle.', 'var(--arcane-core-vitality)'),
  createBranch('focus', 'Focus', 'Expand the reserves that let the tower sustain its work.', 'var(--arcane-core-focus)'),
  createBranch('control', 'Control', 'Tighten timing, recovery, and spell control.', 'var(--arcane-core-control)'),
]

export const ARCANE_CORE_BRANCH_BY_ID = Object.fromEntries(ARCANE_CORE_BRANCHES.map((branch) => [branch.id, branch])) as Record<ArcaneCoreBranchDefinition['id'], ArcaneCoreBranchDefinition>
export const ARCANE_CORE_NODES = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes)
export const ARCANE_CORE_NODE_BY_ID = Object.fromEntries(ARCANE_CORE_NODES.map((node) => [node.id, node]))

export const getArcaneCoreBranch = (branchId: ArcaneCoreBranchDefinition['id']) => ARCANE_CORE_BRANCH_BY_ID[branchId]
export const getArcaneCoreNode = (nodeIdValue: string) => ARCANE_CORE_NODE_BY_ID[nodeIdValue]
