import { ClipboardList, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip, Progress } from '../../components/ui'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { formatGuildCommissionObjective, getGuildCommissionProgress } from '../../game/presentation/guild/guildPresentation'
import type { GuildCommissionCategory, GuildCommissionQuality } from '../../game/types'

const categoryLabel: Record<GuildCommissionCategory, string> = { supply: 'SUPPLY', channeling: 'CHANNELING', production: 'PRODUCTION', research: 'RESEARCH', transmutation: 'TRANSMUTATION', mixed: 'MIXED' }
const qualityLabel: Record<GuildCommissionQuality, string> = { routine: 'ROUTINE', special: 'SPECIAL', prestigious: 'PRESTIGIOUS' }

export function GuildRecommendedContracts({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const guild = state.progress.arcaneGuild
  const active = guild.activeCommission
  const activeProgress = active ? getGuildCommissionProgress(active) : null
  const previews = guild.availableCommissions.slice(0, 2)

  return <Card className="guild-v3-panel guild-overview-commissions">
    <div className="guild-v3-panel-heading">
      <div><span className="guild-v3-kicker">GUILD WORK</span><h2>Guild Commissions</h2><p>Complete repeatable noncombat work to build Guild Reputation.</p></div>
      <ClipboardList size={18} aria-hidden="true" />
    </div>
    {active ? <div className="guild-overview-active-commission">
      <div className="guild-overview-work-label"><span>ACTIVE COMMISSION</span><span className={`guild-commission-quality ${active.quality}`}>{qualityLabel[active.quality]}</span></div>
      <strong>{formatGuildCommissionObjective(active)}</strong>
      <Progress value={Math.min(100, (activeProgress?.current ?? 0) / Math.max(1, activeProgress?.target ?? 1) * 100)} tone="gold" />
      <div className="guild-overview-work-meta"><span>{categoryLabel[active.category]} · {activeProgress?.current.toLocaleString()} / {activeProgress?.target.toLocaleString()}</span><b>+{active.reputationReward.toLocaleString()} Reputation</b></div>
    </div> : <div className="guild-v3-commission-preview">
      <span className="guild-overview-work-heading">NEXT OFFERS</span>
      {previews.length ? previews.map((commission) => <div className="guild-overview-commission-row" key={commission.id}>
        <div><strong>{formatGuildCommissionObjective(commission)}</strong><span>{categoryLabel[commission.category]} · {qualityLabel[commission.quality]}</span></div>
        <b>+{commission.reputationReward.toLocaleString()} REP</b>
      </div>) : <p className="guild-overview-empty">The Guild board has no available offers.</p>}
    </div>}
    <GameTooltip content="Open the Guild Commission board."><Button variant="secondary" onClick={() => onNavigate('contracts')}>Open Commissions</Button></GameTooltip>
  </Card>
}

export function GuildAdvancementSummary({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const available = getGuildPointsAvailable(state)
  const invested = getGuildPointsSpent(state)
  const nextMajor = getGuildAdvancementPointEconomy().majorMilestones.find(({ pointsRequired }) => pointsRequired > invested)?.pointsRequired ?? null

  return <Card className="guild-v3-advancement-summary">
    <div className="guild-advancement-summary-copy"><span className="guild-v3-kicker">ADVANCEMENT BOARD</span><h2>Guild Advancement</h2><p>Spend Advancement Points on permanent Guild service bonuses.</p></div>
    <div className="guild-advancement-metrics" aria-label="Guild Advancement points">
      <div><span>AVAILABLE</span><strong>{available.toLocaleString()}</strong></div>
      <div><span>INVESTED</span><strong>{invested.toLocaleString()}</strong></div>
      <div><span>NEXT MAJOR</span><strong>{nextMajor?.toLocaleString() ?? '—'}</strong></div>
    </div>
    <GameTooltip content="Open the Guild Advancement Board and choose a permanent service bonus."><Button variant="secondary" onClick={() => onNavigate('skills')}><Sparkles size={14} /> Open Advancement Board</Button></GameTooltip>
  </Card>
}
