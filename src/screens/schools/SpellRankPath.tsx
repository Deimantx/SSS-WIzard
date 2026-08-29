import { Button, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { getAutoCastFocusCostForRank, formatSpellRank, MAX_SPELL_RANK, type SpellRank } from '../../game/systems/spells'

export function SpellRankPath({ currentRank, onClose }: { currentRank: SpellRank; onClose: () => void }) {
  const ranks = Array.from({ length: MAX_SPELL_RANK }, (_, index) => index + 1) as SpellRank[]
  return <aside className="spell-rank-path-drawer" aria-label="Spell rank path">
    <div className="spell-rank-path-head"><div><div className="panel-kicker">PROGRESSION</div><h3>Rank Path</h3></div><Button variant="ghost" ariaLabel="Close rank path" onClick={onClose}>×</Button></div>
    {ranks.map((rank) => <div className={`spell-rank-row${rank === currentRank ? ' is-current' : ''}`} key={rank}><span className="spell-rank-number">{rank === 1 ? 'I' : '?'}</span><div><strong>{rank === 1 ? formatSpellRank(rank) : 'UNKNOWN RANK'}</strong><small>{rank === 1 ? 'Current authored rank' : 'Future rank data is not yet discovered.'}</small></div><Status tone={rank === currentRank ? 'success' : 'locked'}>{rank === currentRank ? 'CURRENT' : `${getAutoCastFocusCostForRank(rank)} Focus`}</Status></div>)}
    <GameTooltip content={<TooltipContent title="Rank upgrades" description="Rank advancement is reserved for a future Tower progression system." />}>
      <span className="spell-rank-path-note">Rank upgrades are not available in this foundation.</span>
    </GameTooltip>
  </aside>
}
