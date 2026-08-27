import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'
import { formatTime } from '../../game/utils'

export function BestiaryStats({ monster }: { monster: MonsterDefinition }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">COMBAT STATS</span><div className="bestiary-stat-grid"><div><span>MAX HEALTH</span><strong>{monster.maxHealth.toLocaleString()}</strong></div><div><span>BASIC DAMAGE</span><strong>{monster.attackDamage.toLocaleString()}</strong></div><div><span>ATTACK INTERVAL</span><strong>{formatTime(monster.attackIntervalMs)}</strong></div></div></section>
}
