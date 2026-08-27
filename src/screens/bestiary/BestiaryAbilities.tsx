import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'
import { formatTime } from '../../game/utils'

export function BestiaryAbilities({ monster }: { monster: MonsterDefinition }) {
  const attacks = Object.values(monster.specialAttacks)
  return <section className="bestiary-section"><span className="bestiary-section-label">SPECIAL ATTACKS</span>{attacks.length === 0 ? <p className="bestiary-muted">No authored special attacks.</p> : <div className="bestiary-ability-list">{attacks.map((attack) => <div key={attack.id}><div><strong>{attack.name}</strong><small>Telegraph: {formatTime(attack.telegraphMs)}</small></div><span>{attack.description}</span></div>)}</div>}</section>
}
