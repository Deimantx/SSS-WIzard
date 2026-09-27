import { Crown, Shield, Sparkles } from 'lucide-react'
import { Button, GameTooltip, Status } from '../../components/ui'
import { GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { getGuildContractClaimCount } from '../../game/systems/guild/guildSelectors'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import type { GuildPromotionProgress } from '../../game/systems/guild/guildSelectors'

const tabs: readonly { id: GuildScreenTab; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Rank readiness and recommended contracts' },
  { id: 'contracts', label: 'Contracts', hint: 'All active Guild contracts and rewards' },
  { id: 'skills', label: 'Skill Tree', hint: 'Spend Guild Points across three branches' },
]

export function GuildHeader({ state, promotion, activeTab, onTabChange }: { state: GameStore; promotion: GuildPromotionProgress; activeTab: GuildScreenTab; onTabChange: (tab: GuildScreenTab) => void }) {
  const { progress } = state
  return <>
    <header className="guild-v3-header">
      <div className="guild-v3-identity">
        <div className="guild-v3-crest" aria-hidden="true"><Shield size={30} strokeWidth={1.4} /><Sparkles className="guild-v3-crest-spark" size={12} /></div>
        <div className="guild-v3-identity-copy">
          <div className="guild-v3-kicker">THE VERDANT CIRCLE · FIELD COMMAND</div>
          <div className="guild-v3-title-row"><h1>Verdant Circle</h1><Status tone="success">Guild unlocked</Status></div>
          <p>Coordinate fieldwork, earn reputation, and shape the tower’s guild specialization.</p>
          <div className="guild-v3-rank-line"><Crown size={14} /><strong>{promotion.currentRank.name}</strong><span>Current rank</span><span className="guild-v3-separator">/</span><span>{promotion.nextRank ? `Next: ${promotion.nextRank.name}` : 'Circle complete'}</span></div>
        </div>
      </div>
      <div className="guild-v3-header-metrics" aria-label="Guild summary">
        <div><span>REPUTATION</span><strong>{progress.guildReputation.toLocaleString()}</strong></div>
        <div><span>GUILD POINTS</span><strong>{progress.guildPointsEarned.toLocaleString()}</strong></div>
        <div><span>CLAIMS</span><strong>{getGuildContractClaimCount(state)}</strong></div>
      </div>
    </header>
    <nav className="guild-v3-tabs" aria-label="Guild sections" role="tablist">
      {tabs.map((tab) => <GameTooltip key={tab.id} content={tab.hint} block><Button variant={activeTab === tab.id ? 'primary' : 'ghost'} className={`guild-v3-tab${activeTab === tab.id ? ' active' : ''}`} ariaPressed={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === 'contracts' && <span className="guild-v3-tab-count">{GUILD_REQUEST_IDS.length}</span>}</Button></GameTooltip>)}
    </nav>
  </>
}
