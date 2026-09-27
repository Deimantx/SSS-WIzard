import { ArrowRight, ClipboardList, Crown, Sparkles } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { GUILD_BRANCH_PRESENTATION, getGuildRecommendedRequestIds, getGuildSkillBranchProgress } from '../../game/presentation/guild/guildPresentation'
import { GUILD_SKILL_BRANCHES } from '../../game/content/guild/guildSkills'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { GuildContractCard } from './GuildContractCard'

export function GuildRecommendedContracts({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const recommended = getGuildRecommendedRequestIds(state)
  return <section className="guild-v3-recommended-column">
    <div className="guild-v3-section-heading">
      <div><span className="guild-v3-kicker">ACTIVE BOARD</span><h2>Recommended contracts</h2><p>The shortest route to your next Guild milestone.</p></div>
      <Button variant="ghost" onClick={() => onNavigate('contracts')}>View all <ArrowRight size={14} /></Button>
    </div>
    <div className="guild-v3-recommended-list">{recommended.map((requestId) => <GuildContractCard key={requestId} state={state} requestId={requestId} />)}</div>
  </section>
}

export function GuildSpecializationSummary({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  return <Card className="guild-v3-specialization-summary">
    <div className="guild-v3-section-heading">
      <div><span className="guild-v3-kicker">SPECIALIZATION CANOPY</span><h2>Shape the Circle</h2><p>Guild Points unlock permanent bonuses. Respec is available outside active combat.</p></div>
      <Button variant="secondary" onClick={() => onNavigate('skills')}><Crown size={14} /> Open skill tree</Button>
    </div>
    <div className="guild-v3-specialization-tiles">
      {GUILD_SKILL_BRANCHES.map((branch, index) => {
        const progress = getGuildSkillBranchProgress(state, branch)
        const presentation = GUILD_BRANCH_PRESENTATION[branch]
        const Icon = index === 0 ? ClipboardList : index === 1 ? Sparkles : Crown
        return <div key={branch}><Icon size={17} /><strong>{presentation.label} {progress.purchased} / {progress.total}</strong><span>{presentation.subtitle}</span></div>
      })}
    </div>
  </Card>
}
