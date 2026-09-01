import type { MonsterDefinition } from '../../game/content/monsters'
import { formatTime } from '../../game/utils'

export function BestiaryStats({ monster }: { monster: MonsterDefinition }) {
  const resistances = Object.entries(monster.resistances ?? {})
  return <section className="bestiary-section"><span className="bestiary-section-label">COMBAT STATS</span><div className="bestiary-stat-grid"><div><span>MAX HEALTH</span><strong>{monster.maxHealth.toLocaleString()}</strong></div><div><span>BASIC DAMAGE</span><strong>{monster.basicAttackDamage.toLocaleString()}</strong></div><div><span>BASIC ATTACK TIME</span><strong>{formatTime(monster.basicAttackTimeMs)}</strong></div></div><div className="bestiary-resistance-list"><span className="bestiary-section-label">RESISTANCES</span>{resistances.length === 0 ? <small>None recorded.</small> : resistances.map(([damageType, value]) => <span key={damageType}><strong>{damageType}</strong>{value < 0 ? `+${Math.round(-value * 100)}% damage taken` : `${Math.round(value * 100)}% reduced`}</span>)}</div></section>
}
