import { Bug, Crown, Ghost, Leaf, Mountain, PawPrint, Skull, Sparkles, Swords, WandSparkles } from 'lucide-react'
import type { MonsterDefinition } from '../../game/content/monsters'

export function MonsterPortrait({ monster, boss = false }: { monster?: MonsterDefinition | null; boss?: boolean }) {
  const Icon = monster?.ui?.portraitIcon ? portraitIcons[monster.ui.portraitIcon] : boss ? Crown : Bug
  return <div className={`combat-monster-portrait${boss ? ' is-boss' : ''}`} style={{ '--enemy-accent': monster?.color ?? 'var(--ui-accent)' } as React.CSSProperties}>{monster?.image ? <img src={monster.image} alt="" /> : <><span className="combat-portrait-aura" /><Icon size={boss ? 50 : 48} strokeWidth={1.1} aria-hidden="true" /></>}</div>
}

const portraitIcons = { wisp: Sparkles, plant: Leaf, stone: Mountain, guardian: Crown, wolf: PawPrint, claw: Swords, bear: PawPrint, skeleton: Skull, ghost: Ghost, mage: WandSparkles, boss: Crown } as const
