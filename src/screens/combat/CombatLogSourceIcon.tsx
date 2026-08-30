import { Crown, Sparkles, WandSparkles } from 'lucide-react'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { MonsterPortrait } from './MonsterPortrait'

export function CombatLogSourceIcon({ entry }: { entry: CombatLogEntry }) {
  if (entry.source.kind === 'enemy') return <span className="combat-log-source-portrait"><MonsterPortrait monster={MONSTERS[entry.source.monsterId]} boss={isBossMonster(MONSTERS[entry.source.monsterId])} /></span>
  if (entry.source.kind === 'player') return <span className="combat-log-source-player"><WandSparkles size={15} aria-hidden="true" /></span>
  return <span className="combat-log-source-system">{entry.category === 'death' ? <Crown size={15} aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />}</span>
}
