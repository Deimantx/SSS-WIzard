import { Check, LockKeyhole } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { GUILD_SKILL_NODES } from '../../game/content/guild/guildSkills'
import { getGuildSkillNodePresentation } from '../../game/presentation/guild/guildPresentation'
import { canPurchaseGuildSkillNode } from '../../game/systems/guild/guildSelectors'
import type { GuildSkillNodeId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

export function GuildSkillNode({ state, nodeId, major = false }: { state: GameStore; nodeId: GuildSkillNodeId; major?: boolean }) {
  const { node, rank, purchased, capped } = getGuildSkillNodePresentation(state, nodeId)
  const available = canPurchaseGuildSkillNode(state, nodeId)
  const requirement = node.requiredInvestedPoints !== undefined ? `Requires ${node.requiredInvestedPoints} points invested across the board.` : node.requiredRank ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId ?? node.id]?.requiredRank ?? node.requiredRank} Guild standing.` : node.prerequisiteId ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId].name}.` : 'Available to invest.'
  const actionLabel = capped ? 'Max' : available ? `Invest · ${rank}/${node.maxRank}` : 'Locked'
  return <GameTooltip block wide content={<span>{node.description} {requirement}{node.maxRank > 1 ? ` Current rank: ${rank} of ${node.maxRank}.` : ''}</span>}><article className={`guild-v3-skill-node${purchased ? ' owned' : ''}${available ? ' available' : ''}${major ? ' major' : ''}`}>
    <div className="guild-v3-node-marker">{purchased ? <Check size={15} /> : available ? <span /> : <LockKeyhole size={14} />}</div>
    <div className="guild-v3-node-copy"><div className="guild-v3-node-name"><strong>{node.name}</strong>{major && <span>MAJOR</span>}{node.maxRank > 1 && <small>{rank}/{node.maxRank}</small>}</div><p>{node.description}</p>{!available && !capped && <small>{node.requiredInvestedPoints ? `${node.requiredInvestedPoints} points invested` : node.requiredRank ? `Requires ${node.requiredRank} rank` : node.prerequisiteId ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId].name}` : 'Requires 1 Advancement Point'}</small>}</div>
    <Button variant={capped ? 'success' : available ? 'primary' : 'secondary'} disabled={!available} onClick={() => state.purchaseGuildSkillNode(node.id)}>{actionLabel}</Button>
  </article></GameTooltip>
}
