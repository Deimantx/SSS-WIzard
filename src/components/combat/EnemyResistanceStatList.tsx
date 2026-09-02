import type { DamageType } from '../../game/types'
import { formatResistanceEffect, type EnemyCombatStatRow, type EnemyCombatStatValues } from '../../game/presentation/combat'
import { GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'

/** Renders canonical resistance rows with the authored damage-type color language. */
export function EnemyResistanceStatList({ rows, stats, className, rowClassName }: { rows: EnemyCombatStatRow[]; stats: EnemyCombatStatValues; className: string; rowClassName: string }) {
  return <div className={className}>{rows.map((row) => {
    const type = row.id.replace('resistance-', '') as DamageType
    const value = stats.resistances[type] ?? 0
    return <GameTooltip key={row.id} block content={<TooltipContent title={row.label} description={row.description} />}><div tabIndex={0} className={`${rowClassName} ${value < 0 ? 'is-weakness' : 'is-resistance'}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>{formatResistanceEffect(value)}</strong></div></GameTooltip>
  })}</div>
}

function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
