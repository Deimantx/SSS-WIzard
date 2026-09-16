import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_NODE_COUNT, ARCANE_CORE_NODE_COUNT_PER_BRANCH } from '../../content/arcaneCore/arcaneCoreBalance'

export const validateArcaneCoreCatalog = () => {
  const errors: string[] = []
  const branchIds = new Set(['power', 'vitality', 'focus', 'control'])
  if (ARCANE_CORE_BRANCHES.length !== 4 || new Set(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).size !== 4 || ARCANE_CORE_BRANCHES.some((branch) => !branchIds.has(branch.id))) errors.push('Arcane Core must contain exactly four authored branches')
  if (ARCANE_CORE_NODES.length !== ARCANE_CORE_NODE_COUNT) errors.push(`Arcane Core must contain ${ARCANE_CORE_NODE_COUNT} nodes`)
  const ids = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => {
    if (branch.nodes.length !== ARCANE_CORE_NODE_COUNT_PER_BRANCH) errors.push(`${branch.id}: must contain exactly ${ARCANE_CORE_NODE_COUNT_PER_BRANCH} nodes`)
    const lanes = new Map<string, typeof branch.nodes>()
    branch.nodes.forEach((node) => {
      if (ids.has(node.id)) errors.push(`${node.id}: duplicate node id`)
      ids.add(node.id)
      if (node.branchId !== branch.id || node.cost !== 1 || !['minor', 'perk', 'major'].includes(node.nodeType)) errors.push(`${node.id}: invalid authored node shape`)
      const laneNodes = lanes.get(node.laneId) ?? []
      laneNodes.push(node)
      lanes.set(node.laneId, laneNodes)
      node.prerequisites.forEach((prerequisite) => { if (!branch.nodes.some((candidate) => candidate.id === prerequisite)) errors.push(`${node.id}: missing prerequisite ${prerequisite}`) })
    })
    if (lanes.size !== 4 || [...lanes.values()].some((lane) => lane.length !== 10)) errors.push(`${branch.id}: must contain four lanes of ten nodes`)
    lanes.forEach((nodes, laneId) => {
      nodes.sort((left, right) => left.order - right.order).forEach((node, index) => {
        const expectedPrerequisite = index === 0 ? [] : [nodes[index - 1].id]
        if (node.order !== index + 1 || JSON.stringify(node.prerequisites) !== JSON.stringify(expectedPrerequisite) || node.prerequisiteMode !== 'all') errors.push(`${branch.id}/${laneId}: lane must be a sequential chain`)
      })
    })
  })
  if (ARCANE_CORE_MAX_LEVEL !== ARCANE_CORE_NODE_COUNT + 1) errors.push('Arcane Core level cap must derive from node count')
  return errors
}
