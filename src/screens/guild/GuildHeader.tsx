import { Crown, Shield, Sparkles } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../components/ui'
import { getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'
import { GUILD_STANDINGS, getGuildStanding } from '../../game/content/guild/guildStandings'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import type { GuildPromotionProgress } from '../../game/systems/guild/guildSelectors'

const tabs: readonly { id: GuildScreenTab; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Rank readiness and recommended contracts' },
  { id: 'commissions', label: 'Commissions', hint: 'Commission Board and Guild Studies' },
  { id: 'standing', label: 'Standing', hint: 'Twenty-five reputation grades and macro promotions' },
  { id: 'advancement', label: 'Advancement', hint: 'Invest Advancement Points in permanent Guild programs' },
  { id: 'registry', label: 'Registry', hint: 'Register items with the Guild and complete scholarly sets' },
  { id: 'projects', label: 'Projects', hint: 'Contribute materials to permanent Guild improvements' },
]

export function GuildHeader({ state, promotion: _promotion }: { state: GameStore; promotion: GuildPromotionProgress }) {
  const { progress } = state
  const currentStanding = getGuildStanding(progress.guildReputation)
  const nextStanding = GUILD_STANDINGS.find((standing) => standing.reputation > progress.guildReputation) ?? null
  const standingSpan = nextStanding ? nextStanding.reputation - currentStanding.reputation : 0
  const rankProgress = nextStanding && standingSpan > 0 ? Math.max(0, Math.min(100, (progress.guildReputation - currentStanding.reputation) / standingSpan * 100)) : 100
  return <header className="guild-v3-header">
      <div className="guild-v3-identity">
        <div className="guild-v3-crest" aria-hidden="true"><Shield size={30} strokeWidth={1.4} /><Sparkles className="guild-v3-crest-spark" size={12} /></div>
        <div className="guild-v3-identity-copy">
          <div className="guild-v3-kicker">ARCANE GUILD · ARCANE SERVICE</div>
          <div className="guild-v3-title-row"><h1>Arcane Guild</h1><Status tone="success">Guild unlocked</Status></div>
          <p>Coordinate fieldwork, earn Reputation, and invest in lasting Guild services.</p>
          <div className="guild-v3-rank-line"><Crown size={14} /><strong>{currentStanding.name}</strong><span>Guild Standing</span><span className="guild-v3-separator">/</span><span>{nextStanding ? `Next: ${nextStanding.name}` : 'Maximum Standing'}</span></div>
        </div>
      </div>
      <div className="guild-v3-header-summary">
        <div className="guild-v3-header-metrics" aria-label="Guild summary">
          <div><span>REPUTATION</span><strong>{progress.guildReputation.toLocaleString()}{nextStanding ? ` / ${nextStanding.reputation.toLocaleString()}` : ''}</strong></div>
          <div><span>ADVANCEMENT POINTS</span><strong>{progress.guildPointsEarned.toLocaleString()}</strong><small>{getGuildPointsAvailable(state)} available</small></div>
          <div><span>COMMISSIONS</span><strong>{progress.arcaneGuild.completedCommissions.toLocaleString()}</strong><small>completed</small></div>
        </div>
        <GameTooltip content={nextStanding ? `Reputation progress toward ${nextStanding.name} (${nextStanding.reputation.toLocaleString()} REP). Macro promotion requirements are shown in the Standing register.` : 'Maximum Guild Standing reached.'} block>
          <div className="guild-v3-rank-meter">
            <div><span>STANDING PROGRESS</span><strong>{Math.round(rankProgress)}%</strong></div>
            <Progress value={rankProgress} tone="gold" />
          </div>
        </GameTooltip>
      </div>
    </header>
}

export function GuildTabs({ activeTab, onTabChange, commissionCount = 0 }: { activeTab: GuildScreenTab; onTabChange: (tab: GuildScreenTab) => void; commissionCount?: number }) {
  return <nav className="guild-v3-tabs" aria-label="Guild sections" role="tablist">
    {tabs.map((tab) => <GameTooltip key={tab.id} content={tab.hint} block><Button variant={activeTab === tab.id ? 'primary' : 'ghost'} className={`guild-v3-tab${activeTab === tab.id ? ' active' : ''}`} ariaPressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === 'commissions' && <span className="guild-v3-tab-count">{commissionCount}</span>}</Button></GameTooltip>)}
  </nav>
}
