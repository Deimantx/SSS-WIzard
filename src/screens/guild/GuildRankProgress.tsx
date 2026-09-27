import { Check, Crown, LockKeyhole, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { getGuildRankProgressPresentation } from '../../game/presentation/guild/guildPresentation'
import type { GameStore } from '../../store/gameStore'

export function GuildRankProgress({ state }: { state: GameStore }) {
  const { progress } = state
  const { promotion, status, requirementsComplete, requirementCount } = getGuildRankProgressPresentation(state)
  const statusCopy = status === 'ready' ? 'Promotion ready' : status === 'highest' ? 'Highest rank reached' : 'Promotion locked'
  return <Card className="guild-v3-panel guild-v3-rank-panel">
    <div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">RANK DOSSIER</span><h2>Guild progression</h2><p>Build a case for the next sigil through reputation, contracts, and Chronicle milestones.</p></div><Status tone={status === 'ready' ? 'success' : status === 'highest' ? 'active' : 'locked'}>{statusCopy}</Status></div>
    <div className="guild-v3-promotion-callout">
      <div className="guild-v3-promotion-emblem"><Crown size={22} /></div>
      <div className="guild-v3-promotion-copy"><span className="guild-v3-label">CURRENT PATH</span><strong>{promotion.nextRank ? `${promotion.currentRank.name} → ${promotion.nextRank.name}` : promotion.currentRank.name}</strong><small>{status === 'highest' ? 'Every authored Guild rank is active.' : `${requirementsComplete} of ${requirementCount} requirements complete`}</small></div>
      <Button variant={status === 'ready' ? 'success' : 'secondary'} disabled={status !== 'ready'} onClick={state.promoteGuild}>{promotion.nextRank ? `Promote to ${promotion.nextRank.name}` : 'Highest rank'}</Button>
    </div>
    {promotion.nextRank && <div className="guild-v3-requirements" aria-label="Promotion requirements">{promotion.requirements.map((requirement) => <GameTooltip key={requirement.id} block content={`${requirement.label}: ${requirement.current} of ${requirement.target}${requirement.complete ? ' · Complete' : ' · Incomplete'}`}><div className={`guild-v3-requirement${requirement.complete ? ' complete' : ''}`}><div className="guild-v3-requirement-head"><span>{requirement.complete ? <Check size={13} /> : <LockKeyhole size={13} />}{requirement.label}</span><strong>{requirement.current.toLocaleString()} / {requirement.target.toLocaleString()}</strong></div><Progress value={requirement.target > 0 ? requirement.current / requirement.target * 100 : 100} tone={requirement.complete ? 'green' : 'gold'} /></div></GameTooltip>)}</div>}
    <div className="guild-v3-rank-ladder" aria-label="Guild rank ladder"><span className="guild-v3-label">RANK LADDER</span><div>{GUILD_RANKS.map((rank) => { const current = rank.id === promotion.currentRank.id; const reached = rank.order <= promotion.currentRank.order; return <div key={rank.id} className={`guild-v3-rank-step${current ? ' current' : ''}${reached ? ' reached' : ''}`}><span>{reached ? <Check size={12} /> : <span className="guild-v3-rank-dot" />}</span><strong>{rank.name}</strong></div> })}</div></div>
    <div className="guild-v3-rank-foot"><span><Sparkles size={14} /> Promotion rewards are authored in the Guild rank registry.</span><span>{progress.guildReputation.toLocaleString()} reputation</span></div>
  </Card>
}
