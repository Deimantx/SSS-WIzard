import React from 'react'
import { Archive, Check, Crown, GraduationCap, LockKeyhole, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'
import { ARCANE_REGISTRY_SETS } from '../../game/content/guild/registry/registrySets'
import { GUILD_PROJECTS } from '../../game/content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { getGuildPointsAvailable, getGuildPromotionProgress, getGuildStandingProgress } from '../../game/systems/guild/guildSelectors'
import type { GameStore } from '../../store/gameStore'

const macroRanks = GUILD_RANKS.filter((rank) => rank.id !== 'outsider')
const roman = ['I', 'II', 'III', 'IV', 'V']

export function GuildStandingTab({ state }: { state: GameStore }) {
  const standing = getGuildStandingProgress(state)
  const promotion = getGuildPromotionProgress(state)
  const [selectedRankId, setSelectedRankId] = React.useState(standing.current.rankId)
  const selectedRank = macroRanks.find((rank) => rank.id === selectedRankId) ?? macroRanks[0]
  const selectedGrades = GUILD_STANDINGS.filter((entry) => entry.rankId === selectedRank.id)
  const selectedGrade = selectedGrades.find((entry) => entry.id === standing.current.id) ?? selectedGrades[0]
  const reachedCount = GUILD_STANDINGS.filter((entry) => state.progress.guildReputation >= entry.reputation).length
  const progressPercent = standing.next ? standing.progress * 100 : 100
  const record = [
    ['Commissions complete', state.progress.arcaneGuild.completedCommissions],
    ['AP available', getGuildPointsAvailable(state)],
    ['Registry Sets', `${state.progress.arcaneRegistry.completedSetIds.length} / ${ARCANE_REGISTRY_SETS.length}`],
    ['Projects complete', `${state.progress.arcaneGuild.completedProjectIds.length} / ${GUILD_PROJECTS.length}`],
    ['Studies complete', `${state.progress.arcaneGuild.completedChainIds.length} / ${GUILD_COMMISSION_CHAINS.length}`],
  ] as const
  return <section className="guild-standing-workspace" aria-label="Guild Standing record">
    <div className="guild-standing-dossier-column">
      <Card className="guild-standing-dossier">
        <div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">GUILD STANDING REGISTER · {reachedCount} / 25 REACHED</span><h2>{standing.current.name}</h2></div><Status tone="active">Current Standing</Status></div>
        <div className="guild-standing-hero-line"><GraduationCap size={19} /><strong>{standing.current.name}</strong><span>›</span><b>{standing.next?.name ?? 'Maximum Standing'}</b><em>{Math.round(progressPercent)}%</em></div>
        <div className="guild-standing-progress-copy"><span>{standing.reputation.toLocaleString()} / {standing.next?.reputation.toLocaleString() ?? standing.current.reputation.toLocaleString()} Reputation</span><strong>{standing.next ? `${Math.max(0, standing.next.reputation - standing.reputation).toLocaleString()} remaining` : 'Standing complete'}</strong></div>
        <Progress value={progressPercent} tone="gold" />
        <div className="guild-standing-macro-list" role="tablist" aria-label="Guild Standing categories">{macroRanks.map((rank) => {
          const grades = GUILD_STANDINGS.filter((entry) => entry.rankId === rank.id)
          const reached = grades.filter((entry) => state.progress.guildReputation >= entry.reputation).length
          const active = selectedRank.id === rank.id
          return <GameTooltip key={rank.id} content={`${rank.name}: ${reached} of 5 grades reached`} block><Button role="tab" ariaPressed={active} className={`guild-standing-macro${active ? ' active' : ''}`} variant={active ? 'primary' : 'ghost'} onClick={() => setSelectedRankId(rank.id)}><span>{rank.name}</span><strong>{Math.min(5, reached)} / 5</strong><i aria-hidden="true">{grades.map((grade) => <b key={grade.id} className={state.progress.guildReputation >= grade.reputation ? 'filled' : ''} />)}</i></Button></GameTooltip>
        })}</div>
        <div className="guild-standing-grade-heading"><div><span className="guild-v3-kicker">{selectedRank.name.toUpperCase()} GRADES</span><strong>{selectedGrade.name} · {selectedGrade.reputation.toLocaleString()} REP</strong></div><Status tone={state.progress.guildReputation >= selectedGrade.reputation ? 'success' : 'locked'}>{state.progress.guildReputation >= selectedGrade.reputation ? 'Reached' : 'Locked'}</Status></div>
        <div className="guild-standing-grade-list">{selectedGrades.map((grade) => {
          const reached = state.progress.guildReputation >= grade.reputation
          const current = standing.current.id === grade.id
          return <div key={grade.id} className={`guild-standing-grade${reached ? ' reached' : ''}${current ? ' current' : ''}`}><span className="guild-standing-grade-state">{reached ? <Check size={14} /> : <LockKeyhole size={14} />}</span><div><strong>{grade.name}</strong><small>{grade.reputation.toLocaleString()} Reputation threshold</small></div><span className="guild-standing-rep">{reached ? 'REACHED' : 'LOCKED'}</span></div>
        })}</div>
        <div className="guild-standing-unlock"><div className="guild-standing-unlock-icon"><Sparkles size={16} /></div><div><span className="guild-v3-kicker">{selectedGrade.name.toUpperCase()} UNLOCK</span><strong>{selectedGrade.unlock}</strong></div><small>{selectedGrade.reputation.toLocaleString()} REP</small></div>
        {promotion.nextRank && <div className="guild-standing-promotion"><div className="guild-standing-promo-heading"><span className="guild-v3-kicker">MACRO PROMOTION</span><strong><Crown size={15} /> {promotion.currentRank.name} → {promotion.nextRank.name}</strong></div><div className="guild-standing-promotion-req">{promotion.requirements.map((requirement) => <span key={requirement.id} className={requirement.complete ? 'complete' : ''}>{requirement.complete ? '✓' : '○'} {requirement.label} <b>{requirement.current.toLocaleString()} / {requirement.target.toLocaleString()}</b></span>)}<GameTooltip content={promotion.eligible ? `Promote to ${promotion.nextRank.name} and receive the authored promotion reward.` : 'Complete every listed milestone to qualify for promotion.'}><Button variant={promotion.eligible ? 'primary' : 'secondary'} disabled={!promotion.eligible} onClick={state.promoteGuild}>Promote</Button></GameTooltip></div></div>}
      </Card>
    </div>
    <aside className="guild-standing-side">
      <Card className="guild-standing-next"><span className="guild-v3-kicker">NEXT STANDING</span><h2>{standing.next?.name ?? 'Standing complete'}</h2><strong>{standing.next?.reputation.toLocaleString() ?? '208,000'} REP</strong><p>{standing.next?.unlock ?? 'You have reached the highest Guild Standing.'}</p><Progress value={progressPercent} tone="gold" /></Card>
      <Card className="guild-standing-record"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">SERVICE HISTORY</span><h2>Guild Record</h2></div><Archive size={17} /></div>{record.map(([label, value]) => <div className="guild-standing-record-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</Card>
    </aside>
  </section>
}
