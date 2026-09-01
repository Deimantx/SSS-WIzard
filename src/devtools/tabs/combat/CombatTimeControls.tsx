import { Button } from '../../../components/ui'
import { COMBAT_TIME_SCALES } from '../../../store/actions/debugActions'
import { useGameStore } from '../../../store/gameStore'

export function CombatTimeControls() {
  const debug = useGameStore((state) => state.debug)
  const setPaused = useGameStore((state) => state.setDebugCombatPaused)
  const setScale = useGameStore((state) => state.setDebugCombatTimeScale)
  const step = useGameStore((state) => state.advanceCombatDebug)
  return <div className="developer-time-controls">
    <div className="button-row"><Button variant={debug.combatPaused ? 'success' : 'secondary'} onClick={() => setPaused(!debug.combatPaused)}>{debug.combatPaused ? 'Resume Combat' : 'Pause Combat'}</Button><span className="muted">Combat clock only; Channeling, Research, and Transmutation continue normally.</span></div>
    <div className="developer-scale-row" aria-label="Combat time scale">{COMBAT_TIME_SCALES.map((scale) => <button key={scale} className={debug.combatTimeScale === scale ? 'active' : ''} aria-pressed={debug.combatTimeScale === scale} onClick={() => setScale(scale)}>{scale}×</button>)}</div>
    <div className="button-row"><Button variant="ghost" onClick={() => step(100)}>Step 100ms</Button><Button variant="ghost" onClick={() => step(500)}>Step 500ms</Button><Button variant="ghost" onClick={() => step(1000)}>Step 1s</Button></div>
  </div>
}
