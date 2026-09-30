import type { MonsterDefinition } from '../../game/content/monsters'
import { buildEnemyCombatStatRows, getMonsterDossierCombatStats } from '../../game/presentation/combat'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyCombatStatList } from '../../components/combat/EnemyCombatStatList'
import { EnemyResistanceStatList } from '../../components/combat/EnemyResistanceStatList'
import { getElementCounter, getElementResistance, ELEMENT_DEFINITIONS } from '../../game/content/elements/elements'
import { getMonsterPrimaryAffinity, getMonsterDamageProfile } from '../../game/content/monsters/monsterTypes'
import { Flame, Droplets, Wind, Mountain, Sparkles } from 'lucide-react'

const ELEMENT_ICONS = { fire: Flame, water: Droplets, air: Wind, earth: Mountain, arcane: Sparkles }

export function BestiaryStats({ monster }: { monster: MonsterDefinition }) {
  const stats = getMonsterDossierCombatStats(monster)
  const rows = buildEnemyCombatStatRows(stats)
  const combatRows = rows.filter((row) => row.group === 'core' || row.group === 'offense' || row.group === 'utility')
  const defenseRows = rows.filter((row) => row.group === 'defense')
  const resistanceRows = rows.filter((row) => row.group === 'resistance')
  const hasImmunities = (monster.damageImmunities?.length ?? 0) > 0 || (monster.statusImmunities?.length ?? 0) > 0 || (monster.statusTagImmunities?.length ?? 0) > 0
  const affinity = getMonsterPrimaryAffinity(monster)
  const weakness = getElementCounter(affinity)
  const resistance = getElementResistance(affinity)
  const damageProfile = getMonsterDamageProfile(monster)
  return <>
    <section className="bestiary-section"><span className="bestiary-section-label">ELEMENTAL PROFILE</span><div className="bestiary-elemental-profile"><div><small>PRIMARY AFFINITY</small><strong style={{ color: `var(--semantic-damage-${affinity})` }}>{ELEMENT_DEFINITIONS[affinity].name}</strong></div><div><small>WEAK TO</small><strong>{weakness ? ELEMENT_DEFINITIONS[weakness].name : 'None'}</strong></div><div><small>RESISTS</small><strong>{resistance ? ELEMENT_DEFINITIONS[resistance].name : 'None'}</strong></div><div><small>BASIC ATTACK</small><strong>{ELEMENT_DEFINITIONS[monster.basicAttackElement ?? affinity].name}</strong></div><div className="bestiary-damage-profile"><small>DAMAGE PROFILE</small><span>{damageProfile.map((element) => { const Icon = ELEMENT_ICONS[element]; return <GameTooltip key={element} content={<TooltipContent title={`${ELEMENT_DEFINITIONS[element].name} damage`} description={`This creature's authored attacks include ${ELEMENT_DEFINITIONS[element].name} damage.`} />}><span tabIndex={0} aria-label={`${ELEMENT_DEFINITIONS[element].name} damage`} style={{ color: `var(--semantic-damage-${element})` }}><Icon size={14} aria-hidden="true" /><span>{ELEMENT_DEFINITIONS[element].name}</span></span></GameTooltip> })}</span></div></div></section>
    <section className="bestiary-section"><span className="bestiary-section-label">COMBAT STATS</span><EnemyCombatStatList rows={combatRows} className="bestiary-stat-grid" rowClassName="bestiary-stat-row" /></section>
    <section className="bestiary-section"><span className="bestiary-section-label">DEFENCES</span><div className="bestiary-defence-stack">
      <EnemyCombatStatList rows={defenseRows} className="bestiary-defence-core-grid" rowClassName="bestiary-defence-row bestiary-defence-stat-row" />
      {resistanceRows.length > 0 && <EnemyResistanceStatList rows={resistanceRows} stats={stats} className="bestiary-resistance-grid" rowClassName="bestiary-defence-row bestiary-defence-stat-row" />}
      {hasImmunities && <div className="bestiary-immunity-grid">
        {(monster.damageImmunities ?? []).map((type) => <div className="bestiary-defence-row is-immunity" key={`damage-${type}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}
        {(monster.statusImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status immunities" description="These authored status effects cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status effects</span><strong>{monster.statusImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
        {(monster.statusTagImmunities ?? []).length > 0 && <GameTooltip block content={<TooltipContent title="Status category immunities" description="These authored status categories cannot be applied to this creature." />}><div tabIndex={0} className="bestiary-defence-row is-immunity"><span>Status categories</span><strong>{monster.statusTagImmunities!.map(pretty).join(', ')}</strong></div></GameTooltip>}
      </div>}
    </div></section>
  </>
}

function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
