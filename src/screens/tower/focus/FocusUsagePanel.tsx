import { ArrowRight } from 'lucide-react'
import { Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { FOCUS_USAGE_GROUPS, getFocusUsageGroups, type FocusUsageEntry } from '../../../game/systems/focus/focusUsage'
import { formatNumber } from '../../../game/utils'
import { selectUsedFocus } from '../../../store/selectors'
import { useGameStore } from '../../../store/gameStore'
import { getFocusReservationDestination } from './focusNavigation'

const GROUP_LABELS: Record<(typeof FOCUS_USAGE_GROUPS)[number], string> = { channeling: 'CHANNELING', research: 'RESEARCH', transmutation: 'TRANSMUTATION', autocast: 'AUTO-CAST' }

export function FocusUsagePanel() {
  const state = useGameStore()
  const groups = getFocusUsageGroups(state)
  const entries = groups.flatMap((group) => group.entries)
  const used = selectUsedFocus(state)
  const navigate = useGameStore((game) => game.setScreen)
  return <Card className="focus-usage" title="ACTIVE FOCUS USAGE" action={<span className="focus-usage-total">{formatNumber(used)} / {formatNumber(state.player.maxFocus)} RESERVED</span>}>
    <div className="focus-usage-list">
      {entries.length === 0 ? <EmptyUsage maxFocus={state.player.maxFocus} navigate={navigate} /> : groups.map((group) => {
        if (!group.entries.length) return null
        return <section className="focus-usage-group" key={group.sourceType}><div className="focus-usage-group-heading"><span>{GROUP_LABELS[group.sourceType]}</span><strong>{formatNumber(group.amount)} FOCUS</strong></div>{group.entries.map((entry) => <ReservationTile key={entry.id} entry={entry} maxFocus={state.player.maxFocus} onNavigate={() => navigate(getFocusReservationDestination(entry.sourceType))} />)}</section>
      })}
    </div>
  </Card>
}

function ReservationTile({ entry, maxFocus, onNavigate }: { entry: FocusUsageEntry; maxFocus: number; onNavigate: () => void }) {
  const statusTone = entry.status?.startsWith('WAITING') || entry.status === 'LEVEL CAP' || entry.status === 'PROTECTED' ? 'warning' : entry.status === 'ENABLED' || entry.status === 'ACTIVE' || entry.status === 'RUNNING' ? 'active' : 'neutral'
  const utilization = maxFocus > 0 ? Math.round(entry.amount / maxFocus * 100) : 0
  return <GameTooltip block accent={statusTone === 'warning' ? 'warning' : 'focus'} content={<TooltipContent title={entry.label} description="Open the owning system to manage this Focus reservation."><div className="tooltip-section"><small>RESERVATION</small><p>{entry.detail} · {formatNumber(entry.amount)} Focus · {utilization}% of Max Focus</p></div>{entry.status && <div className="tooltip-section"><small>STATUS</small><p>{entry.status}</p></div>}</TooltipContent>}>
    <button type="button" className="focus-reservation-tile" onClick={onNavigate}><span className="focus-reservation-copy"><strong>{entry.label}</strong><small>{entry.detail}</small><span className="focus-reservation-summary"><strong>{formatNumber(entry.amount)} Focus</strong><span>· {utilization}%{entry.status ? ` · ${entry.status}` : ''}</span></span></span><ArrowRight size={15} aria-hidden="true" /></button>
  </GameTooltip>
}

function EmptyUsage({ maxFocus, navigate }: { maxFocus: number; navigate: (screen: 'tower-channeling' | 'tower-research' | 'tower-transmutation' | 'combat') => void }) {
  return <div className="focus-empty-usage"><Status tone="success">ALL FOCUS AVAILABLE</Status><strong>{formatNumber(maxFocus)} / {formatNumber(maxFocus)} FREE</strong><p>No automated systems are reserving Focus. Assign Arcane Echoes or enable Auto-Cast to begin using it.</p><div className="focus-empty-shortcuts">{([['Channeling', 'tower-channeling'], ['Research', 'tower-research'], ['Transmutation', 'tower-transmutation'], ['Auto-Cast', 'combat']] as const).map(([label, screen]) => <GameTooltip key={screen} content={`Open ${label}`}><button type="button" onClick={() => navigate(screen)}>{label}</button></GameTooltip>)}</div></div>
}
