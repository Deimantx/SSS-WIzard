import type { GuildRankId, GuildSkillNodeId } from '../../types'

export type GuildSkillBranch = 'hunter' | 'quartermaster' | 'tower'
export type GuildSkillEffect = 'combat-arcane-points' | 'combat-resonance' | 'boss-essence' | 'life-essence' | 'artifact-essence' | 'crystal-cache-chance' | 'arcane-flux' | 'transmutation-speed' | 'bonus-acolyte'

export interface GuildSkillNodeDefinition {
  id: GuildSkillNodeId
  branch: GuildSkillBranch
  name: string
  description: string
  effect: GuildSkillEffect
  prerequisiteId?: GuildSkillNodeId
  requiredRank?: GuildRankId
}

export const GUILD_SKILL_NODES: Record<GuildSkillNodeId, GuildSkillNodeDefinition> = {
  'hunter-arcane-quarry': { id: 'hunter-arcane-quarry', branch: 'hunter', name: 'Arcane Quarry', description: '+5% Arcane Points from Combat.', effect: 'combat-arcane-points' },
  'hunter-resonant-pursuit': { id: 'hunter-resonant-pursuit', branch: 'hunter', name: 'Resonant Pursuit', description: '+5% combat Resonance rewards.', effect: 'combat-resonance', prerequisiteId: 'hunter-arcane-quarry' },
  'hunter-trophy-hunter': { id: 'hunter-trophy-hunter', branch: 'hunter', name: 'Trophy Hunter', description: '+10% Life Essence and Artifact Essence from bosses.', effect: 'boss-essence', prerequisiteId: 'hunter-resonant-pursuit', requiredRank: 'apprentice' },
  'quartermaster-careful-harvest': { id: 'quartermaster-careful-harvest', branch: 'quartermaster', name: 'Careful Harvest', description: '+5% Life Essence from Combat.', effect: 'life-essence' },
  'quartermaster-relic-appraisal': { id: 'quartermaster-relic-appraisal', branch: 'quartermaster', name: 'Relic Appraisal', description: '+5% Artifact Essence from dungeon enemies.', effect: 'artifact-essence', prerequisiteId: 'quartermaster-careful-harvest' },
  'quartermaster-cache-appraisal': { id: 'quartermaster-cache-appraisal', branch: 'quartermaster', name: 'Cache Appraisal', description: '+10% relative Crystal Cache drop chance.', effect: 'crystal-cache-chance', prerequisiteId: 'quartermaster-relic-appraisal', requiredRank: 'apprentice' },
  'tower-leyline-assistance': { id: 'tower-leyline-assistance', branch: 'tower', name: 'Leyline Assistance', description: '+5% Arcane Flux production.', effect: 'arcane-flux' },
  'tower-efficient-arrays': { id: 'tower-efficient-arrays', branch: 'tower', name: 'Efficient Arrays', description: '+5% Transmutation crafting speed.', effect: 'transmutation-speed', prerequisiteId: 'tower-leyline-assistance' },
  'tower-expanded-quarters': { id: 'tower-expanded-quarters', branch: 'tower', name: 'Expanded Quarters', description: '+1 total Acolyte.', effect: 'bonus-acolyte', prerequisiteId: 'tower-efficient-arrays', requiredRank: 'apprentice' },
}

export const GUILD_SKILL_BRANCHES: readonly GuildSkillBranch[] = ['hunter', 'quartermaster', 'tower']
export const GUILD_SKILL_NODE_IDS = Object.keys(GUILD_SKILL_NODES) as GuildSkillNodeId[]
