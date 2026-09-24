import type { ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreRingIndex, ArcaneCoreSpecialEffect } from '../../types'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from './arcaneCoreBranches'

export type ArcaneCoreV7RuntimeKind = 'cast-modifier' | 'combat-event' | 'timeline' | 'resource' | 'survival' | 'static-extra'

export interface ArcaneCoreV7MechanicDefinition {
  mechanicId: string
  branch: ArcaneCoreBranchId
  ring: ArcaneCoreRingIndex
  slot: `S${5 | 6 | 7 | 8}` | 'M'
  name: string
  nodeId: string
  runtime: { kind: ArcaneCoreV7RuntimeKind; handler: string }
  describeRank: (rank: number) => string
}

const getMarker = (node: ArcaneCoreNodeDefinition): Extract<ArcaneCoreSpecialEffect, { type: 'v6-mechanic' }> | undefined => {
  const effect = node.resolveEffects(1).special?.find((entry) => entry.type === 'v6-mechanic')
  return effect?.type === 'v6-mechanic' ? effect : undefined
}

const lastPart = (value: string) => {
  const parts = value.split(':')
  return parts[parts.length - 1]
}

const inferRuntimeKind = (node: ArcaneCoreNodeDefinition): ArcaneCoreV7RuntimeKind => {
  if (node.nodeType === 'major') return 'combat-event'
  if (node.branchId === 'control') return 'timeline'
  if (node.branchId === 'focus') return 'resource'
  if (node.branchId === 'vitality') return 'survival'
  return 'cast-modifier'
}

const definitions = ARCANE_CORE_NODES.flatMap((node) => {
  const marker = getMarker(node)
  if (!marker) return []
  const definition: ArcaneCoreV7MechanicDefinition = {
    mechanicId: marker.mechanicId,
    branch: node.branchId,
    ring: node.ring,
    slot: lastPart(marker.mechanicId) as `S${5 | 6 | 7 | 8}` | 'M',
    name: node.name,
    nodeId: node.id,
    runtime: { kind: inferRuntimeKind(node), handler: node.name },
    describeRank: (rank) => node.resolveEffects(Math.max(1, Math.min(node.maxRank, Math.floor(rank)))).special?.find((entry) => entry.type === 'v6-mechanic')?.displayName ?? node.description,
  }
  return [definition]
})

export const ARCANE_CORE_V7_MECHANICS = definitions
export const ARCANE_CORE_V7_MECHANIC_REGISTRY = Object.fromEntries(definitions.map((definition) => [definition.mechanicId, definition])) as Record<string, ArcaneCoreV7MechanicDefinition>
export const ARCANE_CORE_V7_MECHANIC_NAMES = new Set(definitions.map((definition) => definition.name))

/** Structural/runtime coverage audit for the live V7 tree. */
export const validateArcaneCoreV7MechanicCoverage = () => {
  const errors: string[] = []
  const currentIds = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => branch.nodes.forEach((node) => {
    const marker = getMarker(node)
    if (!marker) return
    currentIds.add(marker.mechanicId)
    const definition = ARCANE_CORE_V7_MECHANIC_REGISTRY[marker.mechanicId]
    if (!definition) errors.push(`${branch.id}/Ring ${node.ring}/${lastPart(marker.mechanicId)} ${node.name} has no V7 runtime registry entry`)
    else if (definition.nodeId !== node.id || definition.name !== node.name || definition.runtime.handler !== node.name) errors.push(`${branch.id}/Ring ${node.ring}/${lastPart(marker.mechanicId)} ${node.name} has a mismatched V7 runtime registry entry`)
  }))
  Object.keys(ARCANE_CORE_V7_MECHANIC_REGISTRY).filter((id) => !currentIds.has(id)).forEach((id) => errors.push(`orphan V7 mechanic implementation ${id}`))
  return errors
}
