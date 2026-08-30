import { Bug, Crown, Sparkles } from 'lucide-react'
import type { MonsterDefinition } from '../../game/content/monsters'

export function MonsterPortrait({ monster, boss = false }: { monster?: MonsterDefinition | null; boss?: boolean }) {
  return <div className={`combat-monster-portrait${boss ? ' is-boss' : ''}`} style={{ '--enemy-accent': monster?.color ?? 'var(--ui-accent)' } as React.CSSProperties}>{monster?.image ? <img src={monster.image} alt="" /> : <><span className="combat-portrait-aura" />{boss ? <Crown size={50} strokeWidth={1.1} aria-hidden="true" /> : monster ? <Bug size={48} strokeWidth={1.1} aria-hidden="true" /> : <Sparkles size={42} strokeWidth={1.1} aria-hidden="true" />}</>}</div>
}
