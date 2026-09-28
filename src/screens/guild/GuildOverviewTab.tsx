import { ClipboardList, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'
import { formatGuildCommissionObjective } from '../../game/presentation/guild/guildPresentation'

export function GuildRecommendedContracts({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  return <Card className="guild-v3-panel"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">GUILD WORK</span><h2>Noncombat commissions</h2><p>Repeatable work orders build Reputation across delivery, production, Research, and Transmutation.</p></div><ClipboardList size={18} /></div><div className="guild-v3-commission-preview">{state.progress.arcaneGuild.availableCommissions.slice(0, 2).map((commission) => <div key={commission.id}><strong>{formatGuildCommissionObjective(commission)}</strong><span>{commission.quality.toUpperCase()} · +{commission.reputationReward.toLocaleString()} Reputation</span></div>)}</div><GameTooltip content="Open all available Guild work orders."><Button variant="secondary" onClick={() => onNavigate('contracts')}>Open Commissions</Button></GameTooltip></Card>
}

export function GuildAdvancementSummary({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  return <Card className="guild-v3-advancement-summary"><div><span className="guild-v3-kicker">ADVANCEMENT BOARD</span><h2>Invest in your wizard’s progression.</h2><p>Permanent Guild services support Research, Transmutation, Arcane Flux, and Acolytes.</p></div><div><span>AVAILABLE POINTS</span><strong>{getGuildPointsAvailable(state)}</strong></div><GameTooltip content="Open the Guild Advancement Board and choose a permanent service node."><Button variant="secondary" onClick={() => onNavigate('skills')}><Sparkles size={14} /> View Board</Button></GameTooltip></Card>
}
