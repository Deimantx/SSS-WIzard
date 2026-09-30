import { GUILD_SKILL_NODES, GUILD_REGULAR_PROGRAM_IDS } from '../../content/guild/guildSkills'
import type { GameState, GuildSkillNodeId } from '../../types'
import type { GuildSkillBranch } from '../../content/guild/guildSkills'
import { canPurchaseGuildSkillNode } from '../../systems/guild/guildSelectors'

export const GUILD_ADVANCEMENT_DEPARTMENTS = [
  { id: 'scholarship', label: 'Scholarship', summary: 'Research & knowledge' },
  { id: 'transmutation', label: 'Transmutation', summary: 'Arrays & output' },
  { id: 'tower-operations', label: 'Tower Operations', summary: 'Flux & coordination' },
  { id: 'guild-service', label: 'Guild Service', summary: 'Reputation & logistics' },
] as const satisfies readonly { id: GuildSkillBranch; label: string; summary: string }[]

export const getGuildAdvancementDepartmentView = (state: Pick<GameState, 'progress'>) => GUILD_ADVANCEMENT_DEPARTMENTS.map((department) => {
  const programs = GUILD_REGULAR_PROGRAM_IDS.filter((id) => GUILD_SKILL_NODES[id].branch === department.id)
  const investedRanks = programs.reduce((sum, id) => sum + Math.max(0, state.progress.guildSkillNodeRanks[id] ?? 0), 0)
  return { ...department, programs, investedRanks, totalRanks: programs.reduce((sum, id) => sum + GUILD_SKILL_NODES[id].maxRank, 0) }
})

export const getGuildAdvancementProgramStatus = (state: Pick<GameState, 'progress'>, id: GuildSkillNodeId) => {
  const node = GUILD_SKILL_NODES[id]
  const rank = Math.max(0, Math.min(node.maxRank, Math.floor(state.progress.guildSkillNodeRanks[id] ?? 0)))
  const canPurchase = canPurchaseGuildSkillNode(state, id)
  return { rank, maxRank: node.maxRank, canPurchase, status: rank >= node.maxRank ? 'maxed' as const : rank > 0 ? 'invested' as const : canPurchase ? 'available' as const : 'locked' as const }
}

export const getGuildAdvancementProgramsForDepartment = (branch: GuildSkillBranch) => GUILD_REGULAR_PROGRAM_IDS.filter((id) => GUILD_SKILL_NODES[id].branch === branch)
