import { ArrowRight, ClipboardList, Crown, Sparkles } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { getGuildRecommendedRequestIds } from '../../game/presentation/guild/guildPresentation'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { GuildContractCard } from './GuildContractCard'
import { GuildRankProgress } from './GuildRankProgress'

export function GuildOverviewTab({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const recommended = getGuildRecommendedRequestIds(state)
  return <div className="guild-v3-overview">
    <div className="guild-v3-overview-grid"><GuildRankProgress state={state} /><section className="guild-v3-recommended-column"><div className="guild-v3-section-heading"><div><span className="guild-v3-kicker">ACTIVE BOARD</span><h2>Recommended contracts</h2><p>The shortest route to your next Guild milestone.</p></div><Button variant="ghost" onClick={() => onNavigate('contracts')}>View all <ArrowRight size={14} /></Button></div><div className="guild-v3-recommended-list">{recommended.map((requestId) => <GuildContractCard key={requestId} state={state} requestId={requestId} />)}</div></section></div>
    <Card className="guild-v3-specialization-summary"><div className="guild-v3-section-heading"><div><span className="guild-v3-kicker">SPECIALIZATION CANOPY</span><h2>Shape the Circle</h2><p>Guild Points unlock permanent bonuses. Respec is available outside active combat.</p></div><Button variant="secondary" onClick={() => onNavigate('skills')}><Crown size={14} /> Open skill tree</Button></div><div className="guild-v3-specialization-tiles"><div><ClipboardList size={17} /><strong>Hunter</strong><span>Combat rewards and resonance</span></div><div><Sparkles size={17} /><strong>Quartermaster</strong><span>Essence and crystal caches</span></div><div><Crown size={17} /><strong>Tower</strong><span>Flux, crafting, and Acolytes</span></div></div></Card>
  </div>
}
