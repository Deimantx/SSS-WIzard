import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

export type CombatResourceTone = 'health' | 'mana' | 'barrier'

export function CombatResource({ icon, label, value, percent, tone }: { icon: React.ReactNode; label: string; value: string; percent: number; tone: CombatResourceTone }) {
  const description = tone === 'health' ? 'Current Health. Reaching zero defeats the Wizard.' : tone === 'mana' ? 'Mana is spent to cast Spells.' : 'Barrier absorbs incoming damage before Health.'
  return <GameTooltip block accent={tone === 'health' ? 'danger' : tone === 'mana' ? 'mana' : 'success'} content={<TooltipContent title={label} description={description} />}><div className={`combat-resource combat-resource-${tone}${percent <= 0 ? ' is-empty' : ''}`} aria-label={`${label} ${value}`}><div className="combat-resource-label"><span>{icon}{label}</span><strong>{value}</strong></div><div className="combat-resource-track"><i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div></div></GameTooltip>
}
