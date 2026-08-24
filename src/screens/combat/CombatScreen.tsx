import { Swords } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../components/ui'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { DungeonPanel } from './DungeonPanel'
import { EnemyPanel } from './EnemyPanel'
import { CombatTimelinePanel } from './CombatTimelinePanel'
import { SpellBarPanel } from './SpellBarPanel'
import { CombatLogPanel } from './CombatLogPanel'

export function CombatScreenV2() { const combat = useGameStore((state) => state.combat); const enter = useGameStore((state) => state.enterDungeon); return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">REGION 01 · WHISPERING WOODS</div><h1>The clearing watches back.</h1><p>Read the enemy sequence, react to telegraphs, then decide which spells deserve Focus.</p></div>{!combat.active && <Button onClick={enter}><Swords size={16} /> Enter Whispering Woods</Button>}</div><EditableGrid screen="combat" panels={[{ id: 'combat-dungeon', content: <DungeonPanel /> }, { id: 'combat-enemy', content: <EnemyPanel /> }, { id: 'combat-timeline', content: <CombatTimelinePanel /> }, { id: 'combat-spells', content: <SpellBarPanel /> }, { id: 'combat-log', content: <CombatLogPanel /> }]} /></div> }
