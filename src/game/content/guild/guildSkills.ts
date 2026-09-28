import type { GuildRankId, GuildSkillNodeId } from '../../types'

export type GuildSkillBranch = 'hunter' | 'quartermaster' | 'tower' | 'milestones'
export type GuildSkillEffect = 'research-speed' | 'research-xp' | 'guild-reputation' | 'transmutation-output' | 'transmutation-speed' | 'arcane-flux' | 'bonus-acolyte' | 'commission-choice' | 'delivery-efficiency' | 'arcane-efficiency' | 'quality-access' | 'masterful-coordination' | 'grand-standing'

export interface GuildSkillNodeDefinition {
  id: GuildSkillNodeId
  branch: GuildSkillBranch
  name: string
  description: string
  effect: GuildSkillEffect
  maxRank: number
  requiredInvestedPoints?: number
  prerequisiteId?: GuildSkillNodeId
  requiredRank?: GuildRankId
}

export const GUILD_SKILL_NODES: Record<GuildSkillNodeId, GuildSkillNodeDefinition> = {
  'hunter-arcane-quarry': { id: 'hunter-arcane-quarry', branch: 'hunter', name: 'Measured Inquiry', description: '+0.5% Research speed per rank.', effect: 'research-speed', maxRank: 5 },
  'hunter-resonant-pursuit': { id: 'hunter-resonant-pursuit', branch: 'hunter', name: 'Resonant Notes', description: '+1% Research XP per rank.', effect: 'research-xp', maxRank: 5, prerequisiteId: 'hunter-arcane-quarry' },
  'hunter-trophy-hunter': { id: 'hunter-trophy-hunter', branch: 'hunter', name: 'Faculty Letters', description: '+1% Guild Reputation from Commissions per rank.', effect: 'guild-reputation', maxRank: 5, prerequisiteId: 'hunter-resonant-pursuit', requiredRank: 'apprentice' },
  'quartermaster-careful-harvest': { id: 'quartermaster-careful-harvest', branch: 'quartermaster', name: 'Resonance Handling', description: '+1% chance for Transmutation to produce one extra item per rank.', effect: 'transmutation-output', maxRank: 5 },
  'quartermaster-relic-appraisal': { id: 'quartermaster-relic-appraisal', branch: 'quartermaster', name: 'Efficient Arrays', description: '+1% Transmutation speed per rank.', effect: 'transmutation-speed', maxRank: 5, prerequisiteId: 'quartermaster-careful-harvest' },
  'quartermaster-cache-appraisal': { id: 'quartermaster-cache-appraisal', branch: 'quartermaster', name: 'Fragment Stewardship', description: '+1% Transmutation speed per rank.', effect: 'transmutation-speed', maxRank: 5, prerequisiteId: 'quartermaster-relic-appraisal', requiredRank: 'apprentice' },
  'tower-leyline-assistance': { id: 'tower-leyline-assistance', branch: 'tower', name: 'Leyline Assistance', description: '+1% Arcane Flux production per rank.', effect: 'arcane-flux', maxRank: 5 },
  'tower-efficient-arrays': { id: 'tower-efficient-arrays', branch: 'tower', name: 'Research Annex', description: '+0.5% Research speed per rank.', effect: 'research-speed', maxRank: 5, prerequisiteId: 'tower-leyline-assistance' },
  'tower-expanded-quarters': { id: 'tower-expanded-quarters', branch: 'tower', name: 'Expanded Quarters', description: '+1 total Acolyte.', effect: 'bonus-acolyte', maxRank: 1, prerequisiteId: 'tower-efficient-arrays', requiredRank: 'apprentice' },
  'guild-peer-review': { id: 'guild-peer-review', branch: 'hunter', name: 'Peer Review', description: '+1% Research XP per rank.', effect: 'research-xp', maxRank: 5 },
  'guild-resonance-etching': { id: 'guild-resonance-etching', branch: 'quartermaster', name: 'Resonance Etching', description: '+1% Transmutation speed per rank.', effect: 'transmutation-speed', maxRank: 5 },
  'guild-calibrated-rota': { id: 'guild-calibrated-rota', branch: 'tower', name: 'Calibrated Rota', description: '+1% Arcane Flux production per rank.', effect: 'arcane-flux', maxRank: 5 },
  'major-favored-contractor': { id: 'major-favored-contractor', branch: 'milestones', name: 'Favored Contractor', description: '+1 Guild Commission choice.', effect: 'commission-choice', maxRank: 1, requiredInvestedPoints: 10 },
  'major-efficient-procurement': { id: 'major-efficient-procurement', branch: 'milestones', name: 'Efficient Procurement', description: 'Reduce eligible delivery Commission quantities by 5%.', effect: 'delivery-efficiency', maxRank: 1, requiredInvestedPoints: 20 },
  'major-arcane-efficiency': { id: 'major-arcane-efficiency', branch: 'milestones', name: 'Arcane Efficiency', description: '+2% Research and Transmutation speed.', effect: 'arcane-efficiency', maxRank: 1, requiredInvestedPoints: 30 },
  'major-guild-connections': { id: 'major-guild-connections', branch: 'milestones', name: 'Guild Connections', description: 'Unlock Special and Prestigious Commissions at earlier standing.', effect: 'quality-access', maxRank: 1, requiredInvestedPoints: 40 },
  'major-coordination': { id: 'major-coordination', branch: 'milestones', name: 'Masterful Coordination', description: '+2% Research and Transmutation speed.', effect: 'masterful-coordination', maxRank: 1, requiredInvestedPoints: 50 },
  'major-grand-standing': { id: 'major-grand-standing', branch: 'milestones', name: 'Grand Arcane Standing', description: '+3% Guild Reputation and Arcane Flux production.', effect: 'grand-standing', maxRank: 1, requiredInvestedPoints: 60 },
}

export const GUILD_SKILL_BRANCHES: readonly GuildSkillBranch[] = ['hunter', 'quartermaster', 'tower', 'milestones']
export const GUILD_SKILL_NODE_IDS = Object.keys(GUILD_SKILL_NODES) as GuildSkillNodeId[]
