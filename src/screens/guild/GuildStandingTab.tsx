import React from 'react'
import { Check, Crown, LockKeyhole } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'
import { getGuildPromotionProgress, getGuildStandingProgress } from '../../game/systems/guild/guildSelectors'
import type { GameStore } from '../../store/gameStore'

const macroRanks = GUILD_RANKS.filter((rank) => rank.id !== 'outsider')

export function GuildStandingTab({ state }: { state: GameStore }) {
  const standing = getGuildStandingProgress(state)
  const promotion = getGuildPromotionProgress(state)
  const [selectedRankId, setSelectedRankId] = React.useState(standing.current.rankId)
  const selectedRank = macroRanks.find((rank) => rank.id === selectedRankId) ?? macroRanks[0]
  const selectedGrades = GUILD_STANDINGS.filter((entry) => entry.rankId === selectedRank.id)
  const reachedCount = GUILD_STANDINGS.filter((entry) => state.progress.guildReputation >= entry.reputation).length
  return <section className="guild-standing-workspace" aria-label="Guild Standing record">
    <Card className="guild-standing-current">
      <div className="guild-standing-current-copy"><span className="guild-v3-kicker">CURRENT STANDING</span><h2>{standing.current.name}</h2><p>{standing.reputation.toLocaleString()} Guild Reputation{standing.next ? ` · ${Math.max(0, standing.next.reputation - standing.reputation).toLocaleString()} to ${standing.next.name}` : ' · standing complete'}</p></div>
      <div className="guild-standing-meter"><Progress value={standing.progress * 100} tone="gold" /><div><span>{standing.next ? `NEXT · ${standing.next.name}` : 'MAXIMUM STANDING'}</span><strong>{standing.next?.reputation.toLocaleString() ?? '52,000'}</strong></div></div>
    </Card>
    <Card className="guild-standing-ladder">
      <div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">FIVE CHAPTERS · FIVE GRADES EACH</span><h2>Standing register</h2><p>Every grade is derived directly from Guild Reputation.</p></div><Status tone="active">{reachedCount} / 25 reached</Status></div>
      <div className="guild-standing-macro-list" role="tablist" aria-label="Guild macro ranks">{macroRanks.map((rank) => {
        const grades = GUILD_STANDINGS.filter((entry) => entry.rankId === rank.id)
        const currentGrade = grades.filter((entry) => state.progress.guildReputation >= entry.reputation).length
        const reached = grades[0].reputation <= state.progress.guildReputation
        return <GameTooltip key={rank.id} content={`${rank.name}: ${currentGrade} of 5 grades reached`} block><Button role="tab" ariaPressed={selectedRank.id === rank.id} className={`guild-standing-macro${selectedRank.id === rank.id ? ' active' : ''}`} variant={selectedRank.id === rank.id ? 'primary' : 'ghost'} onClick={() => setSelectedRankId(rank.id)}><span>{rank.name}</span><strong>{Math.min(5, currentGrade)} / 5</strong><i aria-hidden="true">{grades.map((grade) => <b key={grade.id} className={state.progress.guildReputation >= grade.reputation ? 'filled' : ''} />)}</i>{reached ? <Check size={14} /> : <LockKeyhole size={13} />}</Button></GameTooltip>
      })}</div>
      <div className="guild-standing-grade-list">{selectedGrades.map((grade) => {
        const reached = state.progress.guildReputation >= grade.reputation
        const current = standing.current.id === grade.id
        return <div key={grade.id} className={`guild-standing-grade${reached ? ' reached' : ''}${current ? ' current' : ''}`}><span className="guild-standing-grade-state">{reached ? <Check size={14} /> : <LockKeyhole size={14} />}</span><div><strong>{grade.name}</strong><small>{grade.unlock}</small></div><span className="guild-standing-rep">{grade.reputation.toLocaleString()} REP</span>{current && <Status tone="active">Current</Status>}</div>
      })}</div>
      {promotion.nextRank && <div className="guild-standing-promotion"><div><span className="guild-v3-kicker">MACRO PROMOTION</span><strong><Crown size={15} /> {promotion.currentRank.name} → {promotion.nextRank.name}</strong><p>Promotion milestones award +8 Advancement Points.</p></div><div className="guild-standing-promotion-req">{promotion.requirements.map((requirement) => <span key={requirement.id} className={requirement.complete ? 'complete' : ''}>{requirement.complete ? '✓' : '○'} {requirement.label} {requirement.current.toLocaleString()} / {requirement.target.toLocaleString()}</span>)}<Button variant={promotion.eligible ? 'primary' : 'secondary'} disabled={!promotion.eligible} onClick={state.promoteGuild}>Promote</Button></div></div>}
    </Card>
  </section>
}
