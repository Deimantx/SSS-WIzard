import { ClipboardList } from 'lucide-react'
import { GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import type { GameStore } from '../../store/gameStore'
import { GuildContractCard } from './GuildContractCard'

export function GuildContractsTab({ state }: { state: GameStore }) {
  return <section className="guild-v3-tab-content guild-v3-contracts-view"><div className="guild-v3-section-heading"><div><span className="guild-v3-kicker">VERDANT CIRCLE · CONTRACT BOARD</span><h2>Active contracts</h2><p>Complete field work, then claim each reward once to convert progress into reputation and Guild Points.</p></div><div className="guild-v3-board-stamp"><ClipboardList size={16} /> {GUILD_REQUEST_IDS.length} authored contracts</div></div><div className="guild-v3-contract-grid">{GUILD_REQUEST_IDS.map((requestId) => <GuildContractCard key={requestId} state={state} requestId={requestId} />)}</div></section>
}
