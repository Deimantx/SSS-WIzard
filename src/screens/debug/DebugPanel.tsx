import { CircleHelp } from 'lucide-react'
import { Button } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'

export function DebugPanel() {
  const open = useGameStore((state) => state.ui.showDebug)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setSchoolDebug = useGameStore((state) => state.setSchoolDebug)
  const setLevelCap = useGameStore((state) => state.setLevelCap)
  const unlockAll = useGameStore((state) => state.unlockAllSpells)
  const setThreat = useGameStore((state) => state.setThreat)
  const addItem = useGameStore((state) => state.addItem)
  const engage = useGameStore((state) => state.engageBoss)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const enter = useGameStore((state) => state.enterDungeon)
  const preset = useGameStore((state) => state.preset)

  if (!open) return null

  return <aside className="debug-panel">
    <div className="debug-head"><div><span>DEVELOPER TOOLS</span><strong>Current save mutation</strong></div><CircleHelp size={16} /></div>
    <p>Changes here modify the current save.</p>
    <div className="debug-buttons">
      <Button variant="ghost" onClick={() => { setPlayer({ health: 100, mana: 100 }); setThreat(20) }}>Fill HP / Mana</Button>
      <Button variant="ghost" onClick={() => setPlayer({ baseMaxFocus: 140 })}>Max Focus 140</Button>
      <Button variant="ghost" onClick={() => setPlayer({ godMode: true })}>God Mode</Button>
      <Button variant="ghost" onClick={() => setSchoolDebug('fire', 180, 10)}>Fire Level 10</Button>
      <Button variant="ghost" onClick={() => setLevelCap(20)}>Set Cap 20</Button>
      <Button variant="ghost" onClick={unlockAll}>Unlock all spells</Button>
      <Button variant="ghost" onClick={() => { addItem('fire-fragment', 12); addItem('wisp-essence', 8); addItem('grove-bark', 4) }}>Add materials</Button>
      <Button variant="ghost" onClick={() => { enter(); setThreat(20) }}>Combat ready</Button>
      <Button variant="danger" onClick={kill}>Kill current enemy</Button>
      <Button variant="success" onClick={() => { enter(); setThreat(20); engage('grove-sentinel') }}>Spawn Sentinel</Button>
      <Button variant="danger" onClick={() => preset('main-boss')}>Spawn Forest Heart</Button>
    </div>
    <div className="debug-presets"><span>Presets</span><button onClick={() => preset('fresh')}>Fresh</button><button onClick={() => preset('research')}>Research Ready</button><button onClick={() => preset('combat')}>Combat Ready</button><button onClick={() => preset('boss')}>Boss Ready</button><button onClick={() => preset('guild')}>Guild Ready</button><button onClick={() => preset('main-boss')}>Main Boss</button><button onClick={() => preset('chapter-complete')}>Chapter Complete</button></div>
  </aside>
}
