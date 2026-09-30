import { Archive, BriefcaseBusiness, Building2, Crown, GraduationCap, LayoutDashboard, Shield, Sparkles } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../components/ui'
import { getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'
import { GUILD_STANDINGS, getGuildStanding } from '../../game/content/guild/guildStandings'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import type { GuildPromotionProgress } from '../../game/systems/guild/guildSelectors'
import { formatGuildCommissionObjective } from '../../game/presentation/guild/guildPresentation'

const tabs: readonly { id: GuildScreenTab; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Rank readiness and recommended contracts' },
  { id: 'commissions', label: 'Commissions', hint: 'Commission Board and Guild Studies' },
  { id: 'standing', label: 'Standing', hint: 'Twenty-five reputation grades and macro promotions' },
  { id: 'advancement', label: 'Advancement', hint: 'Invest Advancement Points in permanent Guild programs' },
  { id: 'registry', label: 'Registry', hint: 'Register items with the Guild and complete scholarly sets' },
  { id: 'projects', label: 'Projects', hint: 'Contribute materials to permanent Guild improvements' },
]

export function GuildHeader({ state, promotion: _promotion, onOpenCommissions }: { state: GameStore; promotion: GuildPromotionProgress; onOpenCommissions?: () => void }) {
  const { progress } = state
  const currentStanding = getGuildStanding(progress.guildReputation)
  const nextStanding = GUILD_STANDINGS.find((standing) => standing.reputation > progress.guildReputation) ?? null
  const standingSpan = nextStanding ? nextStanding.reputation - currentStanding.reputation : 0
  const rankProgress = nextStanding && standingSpan > 0 ? Math.max(0, Math.min(100, (progress.guildReputation - currentStanding.reputation) / standingSpan * 100)) : 100
  const active = progress.arcaneGuild.activeCommission
  const objectiveTotal = active?.objectives.reduce((sum, objective) => sum + objective.target, 0) ?? 0
  const objectiveProgress = active?.objectives.reduce((sum, objective) => sum + objective.progress, 0) ?? 0
  const registered = Object.keys(progress.arcaneRegistry.registeredEntries).length
  return <header className="guild-v3-header">
      <div className="guild-v3-identity">
        <div className="guild-v3-crest" aria-hidden="true"><Shield size={30} strokeWidth={1.4} /><Sparkles className="guild-v3-crest-spark" size={12} /></div>
        <div className="guild-v3-identity-copy">
          <div className="guild-v3-kicker">ARCANE GUILD · ARCANE SERVICE</div>
          <div className="guild-v3-title-row"><h1>Arcane Guild</h1><Status tone="success">Guild unlocked</Status></div>
          <p>Arcane Service · research, commissions, and lasting Guild works.</p>
          <div className="guild-v3-rank-line"><Crown size={14} /><strong>{currentStanding.name}</strong><span>Guild Standing</span></div>
        </div>
      </div>
      <div className="guild-v3-header-summary">
        <div className="guild-v3-header-metrics" aria-label="Guild summary">
          <div><span>REPUTATION</span><strong>{progress.guildReputation.toLocaleString()}{nextStanding ? ` / ${nextStanding.reputation.toLocaleString()}` : ''}</strong></div>
          <div><span>ADVANCEMENT POINTS</span><strong>{progress.guildPointsEarned.toLocaleString()}</strong><small>{getGuildPointsAvailable(state)} available</small></div>
          <div><span>COMMISSIONS</span><strong>{progress.arcaneGuild.completedCommissions.toLocaleString()}</strong><small>completed</small></div>
          <div><span>REGISTRY</span><strong>{registered.toLocaleString()}</strong><small>registered</small></div>
        </div>
        <GameTooltip content={nextStanding ? `Reputation progress toward ${nextStanding.name} (${nextStanding.reputation.toLocaleString()} REP). Macro promotion requirements are shown in the Standing register.` : 'Maximum Guild Standing reached.'} block>
          <div className="guild-v3-rank-meter">
            <div><span>STANDING PROGRESS</span><strong>{Math.round(rankProgress)}%</strong></div>
            <Progress value={rankProgress} tone="gold" />
          </div>
        </GameTooltip>
      </div>
      {active && <div className="guild-v3-active-commission"><div><span>ACTIVE COMMISSION · {(active.category ?? 'service').toUpperCase()}</span><strong>{formatGuildCommissionObjective(active)}</strong></div><div><strong>{objectiveProgress} / {objectiveTotal}</strong><small>progress</small></div><div><strong>+{active.reputationReward.toLocaleString()} REP</strong><small>reward</small></div><GameTooltip content="Open the Commission Board to inspect objectives or claim completed work."><Button variant="secondary" onClick={onOpenCommissions}>Open Commission</Button></GameTooltip></div>}
    </header>
}

export function GuildTabs({ activeTab, onTabChange, commissionCount = 0 }: { activeTab: GuildScreenTab; onTabChange: (tab: GuildScreenTab) => void; commissionCount?: number }) {
  const icons = { overview: LayoutDashboard, commissions: BriefcaseBusiness, standing: GraduationCap, advancement: Sparkles, registry: Archive, projects: Building2 }
  return <nav className="guild-v3-tabs" aria-label="Guild sections" role="tablist">
    {tabs.map((tab) => { const Icon = icons[tab.id]; return <GameTooltip key={tab.id} content={tab.hint} block><Button variant={activeTab === tab.id ? 'primary' : 'ghost'} className={`guild-v3-tab${activeTab === tab.id ? ' active' : ''}`} ariaPressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)}><Icon size={15} />{tab.label}{tab.id === 'commissions' && <span className="guild-v3-tab-count">{commissionCount}</span>}</Button></GameTooltip>})}
  </nav>
}
