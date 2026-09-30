import type { GuildRankId, GuildSkillNodeId } from '../../types'
import { GUILD_STANDINGS } from './guildStandings'
import type { GuildStandingId } from './guildStandings'

export type GuildSkillBranch = 'scholarship' | 'transmutation' | 'tower-operations' | 'guild-service' | 'milestones' | 'hunter' | 'quartermaster' | 'tower'
export type GuildSkillEffect =
  | 'research-speed' | 'research-xp' | 'registered-research-speed' | 'research-commission-reputation'
  | 'transmutation-output' | 'transmutation-speed' | 'transmutation-cost' | 'production-commission-reputation' | 'transmutation-commission-reputation'
  | 'arcane-flux' | 'arcane-flux-capacity' | 'channeling-output' | 'mixed-efficiency' | 'channeling-commission-reputation'
  | 'guild-reputation' | 'delivery-efficiency' | 'registry-efficiency' | 'project-efficiency' | 'repeat-study-reputation' | 'mixed-commission-reputation'
  | 'commission-choice' | 'bonus-acolyte' | 'arcane-efficiency' | 'quality-access' | 'masterful-coordination' | 'grand-standing'

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
  minimumStandingId?: GuildStandingId
  legacy?: boolean
}

const regular: readonly Omit<GuildSkillNodeDefinition, 'id' | 'branch' | 'maxRank'>[][] = [
  [
    { name: 'Measured Inquiry', description: '+0.75% Research speed per rank.', effect: 'research-speed' },
    { name: 'Peer Review', description: '+1.5% Research experience per rank.', effect: 'research-xp' },
    { name: 'Structured Methodology', description: '+0.5% Research speed and experience per rank.', effect: 'research-speed' },
    { name: 'Archive Cross-Reference', description: '+1% Research speed for targets recorded in the Registry per rank.', effect: 'registered-research-speed' },
    { name: 'Faculty Mentorship', description: '+1% Research Commission reputation per rank.', effect: 'research-commission-reputation' },
    { name: 'Scholarly Discipline', description: '+0.5% Research speed and +1% experience per rank.', effect: 'research-speed' },
  ],
  [
    { name: 'Efficient Arrays', description: '+1% Transmutation speed per rank.', effect: 'transmutation-speed' },
    { name: 'Resonance Handling', description: '+1% extra output chance per rank.', effect: 'transmutation-output' },
    { name: 'Stable Catalysis', description: '-1% Transmutation Resonance cost per rank.', effect: 'transmutation-cost' },
    { name: 'Production Discipline', description: '+1% Production Commission reputation per rank.', effect: 'production-commission-reputation' },
    { name: 'Conversion Discipline', description: '+1% Transmutation Commission reputation per rank.', effect: 'transmutation-commission-reputation' },
    { name: 'Precision Arrays', description: '+0.5% Transmutation speed and output chance per rank.', effect: 'transmutation-speed' },
  ],
  [
    { name: 'Leyline Assistance', description: '+1% Arcane Flux production per rank.', effect: 'arcane-flux' },
    { name: 'Flux Reservoir Methods', description: '+2% Arcane Flux capacity per rank.', effect: 'arcane-flux-capacity' },
    { name: 'Channeling Rota', description: '+1% Channeling output per rank.', effect: 'channeling-output' },
    { name: 'Acolyte Coordination', description: '+0.5% Research and Transmutation speed per rank.', effect: 'mixed-efficiency' },
    { name: 'Tower Scheduling', description: '+0.5% Research, Transmutation, and Flux production per rank.', effect: 'mixed-efficiency' },
    { name: 'Channeling Faculty', description: '+1% Channeling Commission reputation per rank.', effect: 'channeling-commission-reputation' },
  ],
  [
    { name: 'Faculty Letters', description: '+1% Guild reputation from regular Commissions per rank.', effect: 'guild-reputation' },
    { name: 'Efficient Delivery', description: '-1% Supply and Delivery quantities per rank.', effect: 'delivery-efficiency' },
    { name: 'Registry Stewardship', description: '-5% consumptive Registry quantities per rank.', effect: 'registry-efficiency' },
    { name: 'Project Logistics', description: '-2% effective Project material requirements per rank.', effect: 'project-efficiency' },
    { name: 'Study Coordination', description: '+2% repeat Study reputation per rank.', effect: 'repeat-study-reputation' },
    { name: 'Commission Office Practice', description: '+1% Mixed Commission reputation per rank.', effect: 'mixed-commission-reputation' },
  ],
]

const ids = [
  ['scholarship-measured-inquiry', 'scholarship-peer-review', 'scholarship-structured-methodology', 'scholarship-archive-cross-reference', 'scholarship-faculty-mentorship', 'scholarship-scholarly-discipline'],
  ['transmutation-efficient-arrays', 'transmutation-resonance-handling', 'transmutation-stable-catalysis', 'transmutation-production-discipline', 'transmutation-conversion-discipline', 'transmutation-precision-arrays'],
  ['tower-leyline-assistance-v4', 'tower-flux-reservoir-methods', 'tower-channeling-rota', 'tower-acolyte-coordination', 'tower-scheduling', 'tower-channeling-faculty'],
  ['service-faculty-letters', 'service-efficient-delivery', 'service-registry-stewardship', 'service-project-logistics', 'service-study-coordination', 'service-commission-office-practice'],
] as const
const branches: readonly GuildSkillBranch[] = ['scholarship', 'transmutation', 'tower-operations', 'guild-service']

const regularNodes = Object.fromEntries(regular.flatMap((group, groupIndex) => group.map((node, index) => {
  const id = ids[groupIndex][index] as GuildSkillNodeId
  return [id, { ...node, id, branch: branches[groupIndex], maxRank: 4, minimumStandingId: GUILD_STANDINGS[groupIndex * 6 + index + 1].id }]
}))) as Record<GuildSkillNodeId, GuildSkillNodeDefinition>

const majors: readonly GuildSkillNodeDefinition[] = [
  { id: 'major-favored-contractor', branch: 'milestones', name: 'Favored Contractor', description: '+1 Commission Board choice, up to the six-offer cap.', effect: 'commission-choice', maxRank: 1, requiredInvestedPoints: 10 },
  { id: 'major-efficient-procurement', branch: 'milestones', name: 'Efficient Procurement', description: 'Additional 5% reduction to Supply and Delivery targets.', effect: 'delivery-efficiency', maxRank: 1, requiredInvestedPoints: 20 },
  { id: 'major-expanded-quarters', branch: 'milestones', name: 'Expanded Quarters', description: '+1 Acolyte capacity.', effect: 'bonus-acolyte', maxRank: 1, requiredInvestedPoints: 30 },
  { id: 'major-arcane-efficiency', branch: 'milestones', name: 'Arcane Efficiency', description: '+2% Research and Transmutation speed.', effect: 'arcane-efficiency', maxRank: 1, requiredInvestedPoints: 42 },
  { id: 'major-guild-connections', branch: 'milestones', name: 'Guild Connections', description: 'Unlocks one Commission quality tier early.', effect: 'quality-access', maxRank: 1, requiredInvestedPoints: 54 },
  { id: 'major-project-stewardship', branch: 'milestones', name: 'Project Stewardship', description: 'Additional 5% reduction to Project material requirements.', effect: 'project-efficiency', maxRank: 1, requiredInvestedPoints: 66 },
  { id: 'major-coordination', branch: 'milestones', name: 'Masterful Coordination', description: '+2% Research, Transmutation, and Flux production.', effect: 'masterful-coordination', maxRank: 1, requiredInvestedPoints: 80 },
  { id: 'major-grand-standing', branch: 'milestones', name: 'Grand Arcane Standing', description: '+3% Guild reputation and Arcane Flux production.', effect: 'grand-standing', maxRank: 1, requiredInvestedPoints: 94 },
]

// Legacy ids remain in the schema so older V2 documents can be parsed; migration moves
// their ranks into the equivalent V4 programs before normal saves are validated.
const legacy: GuildSkillNodeDefinition[] = [
  ['hunter-arcane-quarry', 'research-speed'], ['hunter-resonant-pursuit', 'research-xp'], ['hunter-trophy-hunter', 'guild-reputation'],
  ['quartermaster-careful-harvest', 'transmutation-output'], ['quartermaster-relic-appraisal', 'transmutation-speed'], ['quartermaster-cache-appraisal', 'transmutation-speed'],
  ['tower-leyline-assistance', 'arcane-flux'], ['tower-efficient-arrays', 'research-speed'], ['tower-expanded-quarters', 'bonus-acolyte'],
  ['guild-peer-review', 'research-xp'], ['guild-resonance-etching', 'transmutation-speed'], ['guild-calibrated-rota', 'arcane-flux'],
].map(([id, effect]) => ({ id: id as GuildSkillNodeId, branch: 'guild-service', name: 'Legacy Guild Program', description: 'Migrated from an earlier Advancement Board.', effect: effect as GuildSkillEffect, maxRank: 5, legacy: true }))

export const GUILD_SKILL_NODES: Record<GuildSkillNodeId, GuildSkillNodeDefinition> = Object.assign({}, regularNodes, Object.fromEntries(majors.map((node) => [node.id, node])), Object.fromEntries(legacy.map((node) => [node.id, node])))
export const GUILD_REGULAR_PROGRAM_IDS = Object.keys(regularNodes) as GuildSkillNodeId[]
export const GUILD_MAJOR_PROGRAM_IDS = majors.map((node) => node.id)
export const GUILD_SKILL_BRANCHES: readonly GuildSkillBranch[] = branches
export const GUILD_SKILL_NODE_IDS = Object.keys(GUILD_SKILL_NODES) as GuildSkillNodeId[]
