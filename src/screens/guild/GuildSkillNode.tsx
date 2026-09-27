import { Check, LockKeyhole } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { GUILD_SKILL_NODES } from '../../game/content/guild/guildSkills'
import { getGuildSkillNodePresentation } from '../../game/presentation/guild/guildPresentation'
import { canPurchaseGuildSkillNode } from '../../game/systems/guild/guildSelectors'
import type { GuildSkillNodeId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

export function GuildSkillNode({ state, nodeId, major = false }: { state: GameStore; nodeId: GuildSkillNodeId; major?: boolean }) {
  const { node, purchased } = getGuildSkillNodePresentation(state, nodeId)
  const available = canPurchaseGuildSkillNode(state, nodeId)
  const requirement = node.requiredRank ? `Requires ${node.requiredRank} rank.` : node.prerequisiteId ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId].name}.` : 'Available to purchase.'
  const actionLabel = purchased ? 'Owned' : available ? 'Invest · 1 GP' : 'Locked'
  return <GameTooltip block wide content={<span>{node.description} {requirement}</span>}><article className={`guild-v3-skill-node${purchased ? ' owned' : ''}${available ? ' available' : ''}${major ? ' major' : ''}`}>
    <div className="guild-v3-node-marker">{purchased ? <Check size={15} /> : available ? <span /> : <LockKeyhole size={14} />}</div>
    <div className="guild-v3-node-copy"><div className="guild-v3-node-name"><strong>{node.name}</strong>{major && <span>MAJOR</span>}</div><p>{node.description}</p>{!purchased && !available && <small>{node.requiredRank ? `Requires ${node.requiredRank} rank` : node.prerequisiteId ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId].name}` : 'Requires 1 Guild Point'}</small>}</div>
    <Button variant={purchased ? 'success' : available ? 'primary' : 'secondary'} disabled={purchased || !available} onClick={() => state.purchaseGuildSkillNode(node.id)}>{actionLabel}</Button>
  </article></GameTooltip>
}
