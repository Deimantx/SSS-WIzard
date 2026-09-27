import { Crown, Shield, Sparkles } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { getGuildContractClaimCount, getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import type { GuildPromotionProgress } from '../../game/systems/guild/guildSelectors'

const tabs: readonly { id: GuildScreenTab; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Rank readiness and recommended contracts' },
  { id: 'contracts', label: 'Contracts', hint: 'All active Guild contracts and rewards' },
  { id: 'skills', label: 'Skill Tree', hint: 'Spend Guild Points across three branches' },
]

export function GuildHeader({ state, promotion }: { state: GameStore; promotion: GuildPromotionProgress }) {
  const { progress } = state
  const reputationRequirement = promotion.requirements.find((requirement) => requirement.id === 'reputation')
  const rankProgress = reputationRequirement?.target ? Math.min(100, reputationRequirement.current / reputationRequirement.target * 100) : 100
  return <header className="guild-v3-header">
      <div className="guild-v3-identity">
        <div className="guild-v3-crest" aria-hidden="true"><Shield size={30} strokeWidth={1.4} /><Sparkles className="guild-v3-crest-spark" size={12} /></div>
        <div className="guild-v3-identity-copy">
          <div className="guild-v3-kicker">THE VERDANT CIRCLE · FIELD COMMAND</div>
          <div className="guild-v3-title-row"><h1>Verdant Circle</h1><Status tone="success">Guild unlocked</Status></div>
          <p>Coordinate fieldwork, earn reputation, and shape the tower’s guild specialization.</p>
          <div className="guild-v3-rank-line"><Crown size={14} /><strong>{promotion.currentRank.name}</strong><span>Current rank</span><span className="guild-v3-separator">/</span><span>{promotion.nextRank ? `Next: ${promotion.nextRank.name}` : 'Circle complete'}</span></div>
        </div>
      </div>
      <div className="guild-v3-header-summary">
        <div className="guild-v3-header-metrics" aria-label="Guild summary">
          <div><span>REPUTATION</span><strong>{progress.guildReputation.toLocaleString()}{reputationRequirement ? ` / ${reputationRequirement.target.toLocaleString()}` : ''}</strong></div>
          <div><span>GUILD POINTS</span><strong>{progress.guildPointsEarned.toLocaleString()}</strong><small>{getGuildPointsAvailable(state)} available</small></div>
          <div><span>CONTRACTS</span><strong>{getGuildContractClaimCount(state)}</strong><small>claimed</small></div>
        </div>
        <GameTooltip content="Reputation progress toward the next Guild rank." block>
          <div className="guild-v3-rank-meter">
            <div><span>RANK PROGRESS</span><strong>{Math.round(rankProgress)}%</strong></div>
            <Progress value={rankProgress} tone="gold" />
          </div>
        </GameTooltip>
      </div>
    </header>
}

export function GuildTabs({ activeTab, onTabChange }: { activeTab: GuildScreenTab; onTabChange: (tab: GuildScreenTab) => void }) {
  return <nav className="guild-v3-tabs" aria-label="Guild sections" role="tablist">
    {tabs.map((tab) => <GameTooltip key={tab.id} content={tab.hint} block><Button variant={activeTab === tab.id ? 'primary' : 'ghost'} className={`guild-v3-tab${activeTab === tab.id ? ' active' : ''}`} ariaPressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === 'contracts' && <span className="guild-v3-tab-count">{GUILD_REQUEST_IDS.length}</span>}</Button></GameTooltip>)}
  </nav>
}
