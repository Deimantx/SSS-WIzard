import type { MonsterDefinition } from '../../game/content/monsters'
import { buildEnemyCombatStatRows, getMonsterDossierCombatStats } from '../../game/presentation/combat'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyCombatStatList } from '../../components/combat/EnemyCombatStatList'

export function BestiaryStats({ monster }: { monster: MonsterDefinition }) {
  const stats = getMonsterDossierCombatStats(monster)
  const rows = buildEnemyCombatStatRows(stats)
  const combatRows = rows.filter((row) => row.group === 'core' || row.group === 'offense' || row.group === 'utility')
  const defenseRows = rows.filter((row) => row.group === 'defense')
  const resistanceRows = rows.filter((row) => row.group === 'resistance')
  const defenceRows = [...defenseRows, ...resistanceRows]
  return <>
    <section className="bestiary-section"><span className="bestiary-section-label">COMBAT STATS</span><EnemyCombatStatList rows={combatRows} className="bestiary-stat-grid" rowClassName="bestiary-stat-row" /></section>
    <section className="bestiary-section"><span className="bestiary-section-label">DEFENCES</span><div className="bestiary-defence-grid"><EnemyCombatStatList rows={defenceRows} className="bestiary-defence-stat-list" rowClassName="bestiary-defence-row bestiary-defence-stat-row" />
      {(monster.damageImmunities ?? []).map((type) => <div className="bestiary-defence-row is-immunity" key={`damage-${type}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}
      {(monster.statusImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status immunities" description="These authored status effects cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status effects</span><strong>{monster.statusImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
      {(monster.statusTagImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status category immunities" description="These authored status categories cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status categories</span><strong>{monster.statusTagImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
    </div></section>
  </>
}

function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
