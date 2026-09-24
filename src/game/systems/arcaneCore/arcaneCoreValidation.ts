import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_FULL_RING_COST_BY_RING, ARCANE_CORE_MAJOR_COST_BY_RING, ARCANE_CORE_NODE_COUNT, ARCANE_CORE_NODE_COUNT_PER_BRANCH, ARCANE_CORE_RING_INDICES, ARCANE_CORE_TOTAL_COST_PER_CORE, ARCANE_CORE_TOTAL_TREE_COST, ARCANE_CORE_STANDARD_RANK_COST_BY_RING } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES } from '../../content/arcaneCore/arcaneCoreRings'

export const validateArcaneCoreCatalog = () => {
  const errors: string[] = []
  const branchIds = new Set(['power', 'vitality', 'focus', 'control'])
  if (ARCANE_CORE_BRANCHES.length !== 4 || new Set(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).size !== 4 || ARCANE_CORE_BRANCHES.some((branch) => !branchIds.has(branch.id))) errors.push('Arcane Core must contain exactly four authored branches')
  if (ARCANE_CORE_NODES.length !== ARCANE_CORE_NODE_COUNT) errors.push(`Arcane Core must contain ${ARCANE_CORE_NODE_COUNT} nodes`)
  const ids = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => {
    if (branch.nodes.length !== ARCANE_CORE_NODE_COUNT_PER_BRANCH) errors.push(`${branch.id}: must contain exactly ${ARCANE_CORE_NODE_COUNT_PER_BRANCH} nodes`)
    for (const ring of ARCANE_CORE_RING_INDICES) {
      const ringNodes = branch.nodes.filter((node) => node.ring === ring)
      if (ringNodes.length !== 9 || ringNodes.filter((node) => node.nodeType === 'major').length !== 1 || ringNodes.filter((node) => node.nodeType !== 'major').length !== 8) errors.push(`${branch.id}/ring-${ring}: must contain eight standard nodes and one major`)
      if (ringNodes.filter((node) => node.nodeType === 'minor').length !== 4 || ringNodes.filter((node) => node.nodeType === 'perk').length !== 4) errors.push(`${branch.id}/ring-${ring}: must contain four Stat nodes and four Mechanics nodes`)
      if (ringNodes.some((node) => node.nodeType === 'major' ? node.maxRank !== 1 || node.rankCost !== ARCANE_CORE_MAJOR_COST_BY_RING[ring] : node.maxRank !== 5 || node.rankCost !== ARCANE_CORE_STANDARD_RANK_COST_BY_RING[ring])) errors.push(`${branch.id}/ring-${ring}: invalid rank cost or cap`)
      const angles = new Set<number>()
      ringNodes.forEach((node) => {
        if (ids.has(node.id)) errors.push(`${node.id}: duplicate node id`)
        ids.add(node.id)
        if (node.branchId !== branch.id || node.ring !== ring || !Number.isFinite(node.angleDeg) || typeof node.resolveEffects !== 'function') errors.push(`${node.id}: invalid V7 node shape`)
        if (angles.has(node.angleDeg)) errors.push(`${branch.id}/ring-${ring}: duplicate node angle ${node.angleDeg}`)
        angles.add(node.angleDeg)
        const effects = node.resolveEffects(node.maxRank)
        if (!Object.values(effects).some((value) => Array.isArray(value) ? value.length > 0 : value && Object.keys(value).length > 0)) errors.push(`${node.id}: resolver has no authored effect`)
        const ruleIds = (effects.rules ?? []).map((rule) => rule.id)
        if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${node.id}: duplicate rule id`)
      })
      ringNodes.filter((node) => node.nodeType !== 'major').forEach((node) => {
        if (!node.name.trim() || !node.description.trim()) errors.push(`${node.id}: V7 node requires a player-facing name and description`)
        if (/Basic Attack|Block Chance|Shield/i.test(`${node.name} ${node.description}`)) errors.push(`${node.id}: V7 node references removed player mechanics`)
      })
      const major = ringNodes.find((node) => node.nodeType === 'major')
      if (!major || !major.name.trim() || !major.description.trim()) errors.push(`${branch.id}/ring-${ring}: V7 Major requires a player-facing name and description`)
      if (major && /Basic Attack|Block Chance|Shield/i.test(`${major.name} ${major.description}`)) errors.push(`${major.id}: V7 node references removed player mechanics`)
    }
  })
  if (JSON.stringify(ARCANE_CORE_RING_INDICES.map((ring) => ARCANE_CORE_FULL_RING_COST_BY_RING[ring])) !== JSON.stringify([212, 1344, 2016, 2688, 3360, 4032, 5376, 6720]) || ARCANE_CORE_TOTAL_COST_PER_CORE !== 25748 || ARCANE_CORE_TOTAL_TREE_COST !== 102992) errors.push('Arcane Core V7 cost capacities are invalid')
  if (JSON.stringify(ARCANE_CORE_RING_INDICES.map((ring) => ARCANE_CORE_RING_GATES[ring])) !== JSON.stringify([0, 20, 25, 30, 32, 34, 36, 38])) errors.push('Arcane Core ring gates are invalid')
  if (JSON.stringify(ARCANE_CORE_RING_INDICES.map((ring) => ARCANE_CORE_MAJOR_GATES[ring])) !== JSON.stringify([30, 35, 35, 40, 40, 40, 40, 40])) errors.push('Arcane Core major gates are invalid')
  return errors
}
