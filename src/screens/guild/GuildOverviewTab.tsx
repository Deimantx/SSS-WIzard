import { Archive, ClipboardList, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'
import { GUILD_COMMISSION_TEMPLATES } from '../../game/content/guild/guildRequests'
import { ITEMS } from '../../game/content/items/items'

export function GuildRecommendedContracts({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  return <Card className="guild-v3-panel"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">GUILD WORK</span><h2>Noncombat commissions</h2><p>Repeatable work orders build Reputation across item delivery, Research, and Transmutation.</p></div><ClipboardList size={18} /></div><div className="guild-v3-commission-preview">{state.progress.arcaneGuild.availableCommissions.slice(0, 2).map((commission) => { const template = GUILD_COMMISSION_TEMPLATES.find((entry) => entry.id === commission.templateId); const label = commission.category === 'delivery' && commission.itemId ? `Deliver ${commission.target} ${ITEMS[commission.itemId].name}` : commission.category === 'research' ? `Complete ${commission.target} Research cycles` : `Complete ${commission.target} Transmutations`; return <div key={commission.id}><strong>{label}</strong><span>{commission.quality} · +{commission.reputationReward} Reputation</span></div> })}</div><GameTooltip content="Open all available Guild work orders."><Button variant="secondary" onClick={() => onNavigate('contracts')}>Open Commissions</Button></GameTooltip></Card>
}

export function GuildSpecializationSummary({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  return <Card className="guild-v3-specialization-summary"><div><span className="guild-v3-kicker">ADVANCEMENT BOARD</span><h2>Invest in your wizard’s profession.</h2><p>Permanent Guild services support Research, Transmutation, Arcane Flux, and Acolytes. No combat specialization is required.</p></div><div><span>AVAILABLE POINTS</span><strong>{getGuildPointsAvailable(state)}</strong></div><GameTooltip content="Open the Guild Advancement Board and choose a permanent service node."><Button variant="secondary" onClick={() => onNavigate('skills')}><Sparkles size={14} /> View Board</Button></GameTooltip></Card>
}
