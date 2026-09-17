import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_NODE_COUNT, ARCANE_CORE_NODE_COUNT_PER_BRANCH, ARCANE_CORE_POINTS_PER_CORE, ARCANE_CORE_POINTS_PER_RING, ARCANE_CORE_TOTAL_POINTS } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_RINGS_PER_CORE } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES } from '../../content/arcaneCore/arcaneCoreRings'

export const validateArcaneCoreCatalog = () => {
  const errors: string[] = []
  const branchIds = new Set(['power', 'vitality', 'focus', 'control'])
  if (ARCANE_CORE_BRANCHES.length !== 4 || new Set(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).size !== 4 || ARCANE_CORE_BRANCHES.some((branch) => !branchIds.has(branch.id))) errors.push('Arcane Core must contain exactly four authored branches')
  if (ARCANE_CORE_NODES.length !== ARCANE_CORE_NODE_COUNT) errors.push(`Arcane Core must contain ${ARCANE_CORE_NODE_COUNT} nodes`)
  const ids = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => {
    if (branch.nodes.length !== ARCANE_CORE_NODE_COUNT_PER_BRANCH) errors.push(`${branch.id}: must contain exactly ${ARCANE_CORE_NODE_COUNT_PER_BRANCH} nodes`)
    for (let ring = 1; ring <= ARCANE_CORE_RINGS_PER_CORE; ring += 1) {
      const ringNodes = branch.nodes.filter((node) => node.ring === ring)
      if (ringNodes.length !== 9 || ringNodes.filter((node) => node.nodeType === 'major').length !== 1 || ringNodes.filter((node) => node.nodeType !== 'major').length !== 8) errors.push(`${branch.id}/ring-${ring}: must contain eight standard nodes and one major`)
      if (ringNodes.some((node) => node.nodeType === 'major' ? node.maxRank !== 1 || node.rankCost !== 3 : node.maxRank !== 5 || node.rankCost !== 1)) errors.push(`${branch.id}/ring-${ring}: invalid rank cost or cap`)
      const angles = new Set<number>()
      ringNodes.forEach((node) => {
        if (ids.has(node.id)) errors.push(`${node.id}: duplicate node id`)
        ids.add(node.id)
        if (node.branchId !== branch.id || node.ring !== ring || !Number.isFinite(node.angleDeg) || typeof node.resolveEffects !== 'function') errors.push(`${node.id}: invalid V3 node shape`)
        if (angles.has(node.angleDeg)) errors.push(`${branch.id}/ring-${ring}: duplicate node angle ${node.angleDeg}`)
        angles.add(node.angleDeg)
        const effects = node.resolveEffects(node.maxRank)
        if (!Object.values(effects).some((value) => Array.isArray(value) ? value.length > 0 : value && Object.keys(value).length > 0)) errors.push(`${node.id}: resolver has no authored effect`)
        const ruleIds = (effects.rules ?? []).map((rule) => rule.id)
        if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${node.id}: duplicate rule id`)
      })
    }
  })
  if (ARCANE_CORE_POINTS_PER_RING !== 43 || ARCANE_CORE_POINTS_PER_CORE !== 172 || ARCANE_CORE_TOTAL_POINTS !== 688 || ARCANE_CORE_MAX_LEVEL !== 689) errors.push('Arcane Core point and level capacities must equal the V3 authored topology')
  if (ARCANE_CORE_RING_GATES[1] !== 0 || ARCANE_CORE_RING_GATES[2] !== 20 || ARCANE_CORE_RING_GATES[3] !== 25 || ARCANE_CORE_RING_GATES[4] !== 30) errors.push('Arcane Core ring gates are invalid')
  if (ARCANE_CORE_MAJOR_GATES[1] !== 30 || ARCANE_CORE_MAJOR_GATES[2] !== 35 || ARCANE_CORE_MAJOR_GATES[3] !== 35 || ARCANE_CORE_MAJOR_GATES[4] !== 40) errors.push('Arcane Core major gates are invalid')
  return errors
}
