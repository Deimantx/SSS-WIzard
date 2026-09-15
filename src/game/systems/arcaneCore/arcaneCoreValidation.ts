import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_RANK_COSTS } from '../../content/arcaneCore/arcaneCoreBalance'

export const validateArcaneCoreCatalog = () => {
  const errors: string[] = []
  const expected = new Set(['power', 'vitality', 'focus', 'control'])
  if (ARCANE_CORE_BRANCHES.length !== expected.size || new Set(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).size !== expected.size || ARCANE_CORE_BRANCHES.some((branch) => !expected.has(branch.id))) errors.push('Arcane Core must contain exactly Power, Vitality, Focus, and Control branches')
  const ids = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => {
    if (branch.nodes.length < 60) errors.push(`${branch.id}: fewer than 60 purchasable nodes`)
    const coords = new Set<string>()
    branch.nodes.forEach((node) => {
      if (ids.has(node.id)) errors.push(`${node.id}: duplicate node id`)
      ids.add(node.id)
      const coordinate = `${node.x}:${node.y}`
      if (coords.has(coordinate)) errors.push(`${branch.id}: duplicate node coordinate ${coordinate}`)
      coords.add(coordinate)
      if (node.branchId !== branch.id || !Number.isFinite(node.x) || !Number.isFinite(node.y)) errors.push(`${node.id}: invalid branch or coordinates`)
      if (node.maxRank !== 5 || node.prerequisites.includes(node.id)) errors.push(`${node.id}: invalid max rank or self prerequisite`)
      node.prerequisites.forEach((prerequisite) => { if (!branch.nodes.some((candidate) => candidate.id === prerequisite)) errors.push(`${node.id}: missing prerequisite ${prerequisite}`) })
      if (!Number.isFinite(node.effect.perRank) || node.effect.perRank <= 0) errors.push(`${node.id}: invalid effect value`)
    })
    const nodeIds = new Set(branch.nodes.map((node) => node.id))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (id: string) => {
      if (visiting.has(id)) { errors.push(`${branch.id}: prerequisite cycle`); return }
      if (visited.has(id)) return
      visiting.add(id)
      branch.nodes.find((node) => node.id === id)?.prerequisites.forEach(visit)
      visiting.delete(id)
      visited.add(id)
    }
    nodeIds.forEach(visit)
    if (!branch.nodes.some((node) => node.prerequisites.length === 0)) errors.push(`${branch.id}: no root-connected starter node`)
    if (branch.nodes.filter((node) => node.prerequisites.length === 0).length < 2) errors.push(`${branch.id}: must expose multiple starter paths`)
  })
  if (ARCANE_CORE_RANK_COSTS.some((cost) => !Number.isFinite(cost) || cost <= 0) || ARCANE_CORE_RANK_COSTS.length !== 5) errors.push('invalid Arcane Essence rank costs')
  return errors
}
