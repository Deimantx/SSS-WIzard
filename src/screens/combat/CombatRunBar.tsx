import { Crown, LogOut } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { COMBAT_LOCATION_TYPE_METADATA, getCombatLocationByDungeonId } from '../../game/content/world-navigation'
import { useGameStore } from '../../store/gameStore'
import { Button, Progress } from '../../components/ui'
import type { DungeonId } from '../../game/types'

export function CombatRunBar({ selectedDungeonId, onRequestLeave }: { selectedDungeonId: DungeonId; onRequestLeave: () => void }) {
  const combat = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    targetEnemyId: state.combat.targetEnemyId,
    inBossFight: state.combat.inBossFight,
    dungeonSequenceIndex: state.combat.dungeonSequenceIndex,
  })))
  const dungeonId = combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId
  const dungeon = DUNGEONS[dungeonId]
  const location = getCombatLocationByDungeonId(dungeonId)
  const targeted = location?.encounterMode === 'targeted'
  const sequence = location?.encounterMode === 'sequence' && dungeon.encounterSequence ? dungeon.encounterSequence : null
  const activeTarget = targeted && combat.targetEnemyId ? MONSTERS[combat.targetEnemyId] : null
  const activeEncounter = !targeted && combat.enemyId ? MONSTERS[combat.enemyId] : null

  if (!combat.active) {
    return <section className="combat-run-bar is-idle is-mode-tower"><div className="combat-run-context"><span className="combat-subsection-label">NO ACTIVE COMBAT</span><strong>{location?.name ?? dungeon.name}</strong><small>{sequence ? 'Enter the dungeon to begin the fixed run.' : 'Select a Location and target to begin.'}</small></div></section>
  }

  if (sequence) {
    const index = Math.min(sequence.length, Math.max(0, combat.dungeonSequenceIndex ?? 0))
    const totalSteps = sequence.length + 1
    const currentMonsterId = combat.enemyId ?? (index < sequence.length ? sequence[index] : dungeon.boss)
    const currentMonster = MONSTERS[currentMonsterId]
    return <section className="combat-run-bar is-active is-mode-sequence"><div className="combat-run-context"><span className="combat-subsection-label">CURRENT LOCATION</span><strong>{dungeon.name}</strong><small>{COMBAT_LOCATION_TYPE_METADATA[location?.type ?? 'dungeon'].label}</small></div><div className="combat-run-sequence"><div className="combat-run-metric-head"><span>DUNGEON RUN</span><strong>{index + 1} / {totalSteps}</strong></div><Progress value={(index + 1) / totalSteps * 100} tone="mana" /><small>CURRENT ENCOUNTER · {currentMonster?.name ?? 'Unknown'}</small></div><div className="combat-run-boss"><span className="combat-subsection-label"><Crown size={12} aria-hidden="true" /> FINAL BOSS</span><strong>{MONSTERS[dungeon.boss].name}</strong><small>{index >= sequence.length ? 'FIGHTING' : `STEP ${index + 1} OF ${totalSteps}`}</small></div><div className="combat-run-actions"><Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button></div></section>
  }

  const huntingMonster = activeTarget ?? activeEncounter
  const huntStatus = combat.inBossFight ? 'RESUMES AFTER BOSS' : targeted && combat.enemyId && combat.enemyId === combat.targetEnemyId ? 'CURRENT TARGET' : targeted ? 'NEXT ENCOUNTER' : 'CURRENT ENCOUNTER'
  return <section className={`combat-run-bar is-active is-mode-${combat.enemyId ? 'normal-hunt' : 'encounter-delay'}`}><div className="combat-run-context"><span className="combat-subsection-label">CURRENT LOCATION</span><strong>{dungeon.name}</strong><small>{COMBAT_LOCATION_TYPE_METADATA[location?.type ?? 'dungeon'].label}</small></div>{huntingMonster && <div className="combat-run-target"><span className="combat-subsection-label">HUNTING</span><strong>{huntingMonster.name}</strong><small>{huntStatus}</small></div>}<div className="combat-run-actions"><Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button></div></section>
}
