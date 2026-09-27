import { ClipboardList } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { GUILD_REQUEST_IDS } from '../../game/content/guild/guildRequests'
import { GUILD_REQUEST_KIND_LABELS, getGuildRequestPresentation } from '../../game/presentation/guild/guildPresentation'
import type { GuildRequestKind } from '../../game/types'
import type { GameStore } from '../../store/gameStore'
import { GuildContractCard } from './GuildContractCard'

export type GuildContractStatusFilter = 'all' | 'active' | 'ready' | 'claimed'
export type GuildContractKindFilter = 'all' | GuildRequestKind

const statusFilters: readonly { id: GuildContractStatusFilter; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Show every authored Guild contract.' },
  { id: 'active', label: 'Active', hint: 'Show contracts that still need progress.' },
  { id: 'ready', label: 'Ready', hint: 'Show completed contracts waiting for reward claim.' },
  { id: 'claimed', label: 'Claimed', hint: 'Show contracts whose rewards were already claimed.' },
]

const kindFilters: readonly { id: GuildContractKindFilter; label: string; hint: string }[] = [
  { id: 'all', label: 'All types', hint: 'Show every contract category.' },
  { id: 'donation', label: GUILD_REQUEST_KIND_LABELS.donation, hint: 'Material donation contracts.' },
  { id: 'dungeon-kills', label: GUILD_REQUEST_KIND_LABELS['dungeon-kills'], hint: 'Dungeon hunt contracts.' },
  { id: 'monster-kills', label: GUILD_REQUEST_KIND_LABELS['monster-kills'], hint: 'Monster bounty contracts.' },
  { id: 'boss-kill', label: GUILD_REQUEST_KIND_LABELS['boss-kill'], hint: 'Boss expedition contracts.' },
]

export function GuildContractsControls({ statusFilter, kindFilter, onStatusChange, onKindChange }: { statusFilter: GuildContractStatusFilter; kindFilter: GuildContractKindFilter; onStatusChange: (filter: GuildContractStatusFilter) => void; onKindChange: (filter: GuildContractKindFilter) => void }) {
  return <Card className="guild-v3-contract-controls">
    <div className="guild-v3-filter-group" role="group" aria-label="Contract status">
      <span className="guild-v3-label">STATUS</span>
      <div className="guild-v3-filter-buttons">
        {statusFilters.map((filter) => <GameTooltip key={filter.id} content={filter.hint} block><Button variant={statusFilter === filter.id ? 'primary' : 'ghost'} ariaPressed={statusFilter === filter.id} onClick={() => onStatusChange(filter.id)}>{filter.label}</Button></GameTooltip>)}
      </div>
    </div>
    <div className="guild-v3-filter-group" role="group" aria-label="Contract category">
      <span className="guild-v3-label">CATEGORY</span>
      <div className="guild-v3-filter-buttons">
        {kindFilters.map((filter) => <GameTooltip key={filter.id} content={filter.hint} block><Button variant={kindFilter === filter.id ? 'secondary' : 'ghost'} ariaPressed={kindFilter === filter.id} onClick={() => onKindChange(filter.id)}>{filter.label}</Button></GameTooltip>)}
      </div>
    </div>
  </Card>
}

export function GuildContractsBoard({ state, statusFilter, kindFilter }: { state: GameStore; statusFilter: GuildContractStatusFilter; kindFilter: GuildContractKindFilter }) {
  const visibleRequestIds = GUILD_REQUEST_IDS.filter((requestId) => {
    const { request, complete, claimed } = getGuildRequestPresentation(state, requestId)
    const statusMatches = statusFilter === 'all' || statusFilter === 'active' && !complete && !claimed || statusFilter === 'ready' && complete && !claimed || statusFilter === 'claimed' && claimed
    return statusMatches && (kindFilter === 'all' || request.kind === kindFilter)
  })

  return <section className="guild-v3-tab-content guild-v3-contracts-view">
    <div className="guild-v3-section-heading">
      <div><span className="guild-v3-kicker">VERDANT CIRCLE · CONTRACT BOARD</span><h2>Active contracts</h2><p>Complete field work, then claim each reward once to convert progress into reputation and Guild Points.</p></div>
      <div className="guild-v3-board-stamp"><ClipboardList size={16} /> {visibleRequestIds.length} shown / {GUILD_REQUEST_IDS.length} authored</div>
    </div>
    {visibleRequestIds.length > 0 ? <div className="guild-v3-contract-grid">{visibleRequestIds.map((requestId) => <GuildContractCard key={requestId} state={state} requestId={requestId} />)}</div> : <div className="guild-v3-empty-filter-state">No contracts match the selected filters.</div>}
  </section>
}
