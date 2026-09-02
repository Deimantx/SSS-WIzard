import type { EnemyCombatStatRow } from '../../game/presentation/combat'
import { GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'

/** Renders canonical enemy stat rows with the same contextual tooltip in every view. */
export function EnemyCombatStatList({ rows, className = 'enemy-combat-stat-grid', rowClassName = 'enemy-combat-stat-row' }: { rows: EnemyCombatStatRow[]; className?: string; rowClassName?: string }) {
  return <div className={className}>{rows.map((row) => <GameTooltip key={row.id} block content={<TooltipContent title={row.label} description={row.description} />}><div tabIndex={0} className={rowClassName}><span>{row.label}</span><strong>{row.value}</strong></div></GameTooltip>)}</div>
}
