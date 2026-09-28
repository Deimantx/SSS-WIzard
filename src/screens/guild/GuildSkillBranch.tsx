import { GUILD_SKILL_BRANCHES, GUILD_SKILL_NODES, type GuildSkillBranch as GuildSkillBranchId } from '../../game/content/guild/guildSkills'
import { GUILD_BRANCH_PRESENTATION } from '../../game/presentation/guild/guildPresentation'
import type { GameStore } from '../../store/gameStore'
import { GuildSkillNode } from './GuildSkillNode'

export function GuildSkillBranch({ state, branch }: { state: GameStore; branch: GuildSkillBranchId }) {
  const nodes = Object.values(GUILD_SKILL_NODES).filter((node) => node.branch === branch)
  const meta = GUILD_BRANCH_PRESENTATION[branch]
  return <section className={`guild-v3-skill-branch ${meta.accent}`} aria-labelledby={`guild-branch-${branch}`}><header><div><span className="guild-v3-branch-index">0{GUILD_SKILL_BRANCHES.indexOf(branch) + 1}</span><div><h3 id={`guild-branch-${branch}`}>{meta.label}</h3><p>{meta.subtitle}</p></div></div><span className="guild-v3-label">{nodes.length} NODES</span></header><div className="guild-v3-branch-path">{nodes.map((node, index) => <div key={node.id} className="guild-v3-branch-step"><GuildSkillNode state={state} nodeId={node.id} major={branch === 'milestones'} />{index < nodes.length - 1 && <span className="guild-v3-branch-connector" aria-hidden="true" />}</div>)}</div></section>
}
