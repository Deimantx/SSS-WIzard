import type { MonsterDefinition } from '../../game/content/monsters'
import { buildEnemyCombatStatRows, formatResistanceEffect, getMonsterDossierCombatStats } from '../../game/presentation/combat'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyCombatStatList } from '../../components/combat/EnemyCombatStatList'

export function BestiaryStats({ monster }: { monster: MonsterDefinition }) {
  const stats = getMonsterDossierCombatStats(monster)
  const rows = buildEnemyCombatStatRows(stats)
  const resistanceRows = rows.filter((row) => row.group === 'resistance')
  const hasDefences = resistanceRows.length > 0 || (monster.damageImmunities?.length ?? 0) > 0 || (monster.statusImmunities?.length ?? 0) > 0 || (monster.statusTagImmunities?.length ?? 0) > 0
  return <>
    <section className="bestiary-section"><span className="bestiary-section-label">COMBAT STATS</span><EnemyCombatStatList rows={rows.filter((row) => row.group !== 'resistance')} className="bestiary-stat-grid" rowClassName="bestiary-stat-row" /></section>
    {hasDefences && <section className="bestiary-section"><span className="bestiary-section-label">DEFENCES</span><div className="bestiary-defence-list">
      {resistanceRows.map((row) => { const type = row.id.replace('resistance-', ''); const value = stats.resistances[type as keyof typeof stats.resistances] ?? 0; return <div className={`bestiary-defence-row ${value < 0 ? 'is-weakness' : 'is-resistance'}`} key={row.id}><span className={`damage-type damage-${type}`}>{row.label.replace(' Resistance', '')}</span><strong>{formatResistanceEffect(value)}</strong></div> })}
      {(monster.damageImmunities ?? []).map((type) => <div className="bestiary-defence-row is-immunity" key={`damage-${type}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}
      {(monster.statusImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status immunities" description="These authored status effects cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status effects</span><strong>{monster.statusImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
      {(monster.statusTagImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status category immunities" description="These authored status categories cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status categories</span><strong>{monster.statusTagImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
    </div></section>}
  </>
}

function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
