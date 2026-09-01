import type { MonsterDefinition } from '../../game/content/monsters'
import { formatTime } from '../../game/utils'

export function BestiaryAbilities({ monster }: { monster: MonsterDefinition }) {
  const actions = Object.values(monster.actions)
  return <section className="bestiary-section"><span className="bestiary-section-label">ACTIONS</span>{actions.length === 0 ? <p className="bestiary-muted">No recorded Actions.</p> : <div className="bestiary-ability-list">{actions.map((action) => <div key={action.id}><div><strong>{action.name}</strong><small>Action Time: {formatTime(action.actionTimeMs)}</small></div><span>{action.description}</span></div>)}</div>}</section>
}
