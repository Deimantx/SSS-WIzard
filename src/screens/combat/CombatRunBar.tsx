import { Crown, LogOut, Swords } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DUNGEONS, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { COMBAT_LOCATION_TYPE_METADATA, getCombatLocationByDungeonId } from '../../game/content/world-navigation'
import { canManuallyEngageDungeonBoss, isAutoHuntEnabledForDungeon, isBossCurrentlyActive } from '../../game/systems/combat/combatBossSelectors'
import { selectAutoHuntUnlocked } from '../../store/selectors'
import { useGameStore } from '../../store/gameStore'
import { Button, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { DungeonId } from '../../game/types'

type CombatRunMode = 'tower' | 'normal-hunt' | 'boss-ready' | 'boss-queued' | 'boss-fight' | 'encounter-delay'

export function CombatRunBar({ selectedDungeonId, onRequestLeave }: { selectedDungeonId: DungeonId; onRequestLeave: () => void }) {
  const combat = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    targetEnemyId: state.combat.targetEnemyId,
    inBossFight: state.combat.inBossFight,
    dungeonSequenceIndex: state.combat.dungeonSequenceIndex,
    threatCleared: state.combat.threatCleared,
    pendingBossId: state.combat.pendingBossId,
  })))
  const progress = useGameStore(useShallow((state) => ({
    bossKillsByBoss: state.progress.bossKillsByBoss,
    autoHuntBossByDungeon: state.progress.autoHuntBossByDungeon,
    autoHuntBossUnlocked: state.progress.autoHuntBossUnlocked,
    firstBossKill: state.progress.firstBossKill,
  })))
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const engageBoss = useGameStore((state) => state.engageBoss)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const dungeonId = combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId
  const dungeon = DUNGEONS[dungeonId]
  const location = getCombatLocationByDungeonId(dungeonId)
  const selectedUnlocked = isDungeonUnlocked(dungeon, progress)
  const boss = MONSTERS[dungeon.boss]
  const bossCurrentlyActive = isBossCurrentlyActive({ combat })
  const threatThreshold = combat.threatCleared >= dungeon.threatRequired
  const nearBoss = combat.active && combat.threatCleared >= Math.max(0, dungeon.threatRequired - 2)
  const queued = Boolean(combat.active && combat.pendingBossId === dungeon.boss)
  const bossReady = Boolean(combat.active && threatThreshold && !bossCurrentlyActive && !queued)
  const manualBossEngageAvailable = canManuallyEngageDungeonBoss({ combat, progress }, dungeon)
  const autoHuntEnabled = isAutoHuntEnabledForDungeon({ progress }, dungeonId)
  const mode: CombatRunMode = !combat.active ? 'tower' : bossCurrentlyActive ? 'boss-fight' : queued ? 'boss-queued' : !combat.enemyId && bossReady ? 'boss-ready' : combat.enemyId ? 'normal-hunt' : 'encounter-delay'
  const threatState = mode === 'boss-fight' ? 'FIGHT' : mode === 'boss-queued' ? 'QUEUED' : mode === 'boss-ready' ? 'READY' : threatThreshold ? 'THRESHOLD' : 'BUILDING'
  const modeLabel = mode === 'boss-fight' || mode === 'boss-ready' || mode === 'boss-queued' ? 'BOSS ENCOUNTER' : mode === 'encounter-delay' ? 'ENCOUNTER DELAY' : 'NORMAL HUNT'
  const bossStatus = bossCurrentlyActive ? 'FIGHTING' : queued ? 'QUEUED' : bossReady ? 'READY' : nearBoss ? 'BOSS APPROACHING' : 'INCOMING'
  const autoHuntDisabled = !selectedUnlocked || !autoHuntUnlocked
  const autoHuntDescription = !selectedUnlocked ? 'This Location is locked. Unlock it before enabling Auto Hunt.' : !autoHuntUnlocked ? 'Auto Hunt unlocks after the first dungeon boss kill.' : `When enabled, ${boss.name} is queued after ${dungeon.threatRequired} Threat Cleared.`
  const threatLabel = `${combat.threatCleared} / ${dungeon.threatRequired}`
  const bossDominant = bossReady || mode === 'boss-queued' || mode === 'boss-fight'
  const thresholdReached = Boolean(combat.active && threatThreshold)
  const targeted = location?.encounterMode === 'targeted'
  const sequence = location?.encounterMode === 'sequence' && dungeon.encounterSequence ? dungeon.encounterSequence : null
  const activeTarget = targeted && combat.targetEnemyId ? MONSTERS[combat.targetEnemyId] : null
  const previousThreat = useRef(combat.threatCleared)
  const [thresholdFlash, setThresholdFlash] = useState(false)
  useEffect(() => {
    if (thresholdReached && previousThreat.current < dungeon.threatRequired) {
      setThresholdFlash(true)
      const timer = window.setTimeout(() => setThresholdFlash(false), 650)
      previousThreat.current = combat.threatCleared
      return () => window.clearTimeout(timer)
    }
    previousThreat.current = combat.threatCleared
  }, [combat.threatCleared, dungeon.threatRequired, thresholdReached])

  if (!combat.active) return <section className="combat-run-bar is-idle is-mode-tower"><div className="combat-run-context"><span className="combat-subsection-label">NO ACTIVE COMBAT</span><strong>{location?.name ?? dungeon.name}</strong><small>{sequence ? 'Enter the dungeon to begin the fixed run.' : 'Select a Location and target to begin.'}</small></div></section>

  if (sequence) {
    const index = Math.min(sequence.length, Math.max(0, combat.dungeonSequenceIndex ?? 0))
    const totalSteps = sequence.length + 1
    const currentMonsterId = combat.enemyId ?? (index < sequence.length ? sequence[index] : dungeon.boss)
    const currentMonster = MONSTERS[currentMonsterId]
    return <section className="combat-run-bar is-active is-mode-sequence"><div className="combat-run-context"><span className="combat-subsection-label">CURRENT LOCATION</span><strong>{dungeon.name}</strong><small>{COMBAT_LOCATION_TYPE_METADATA[location?.type ?? 'dungeon'].label}</small></div><div className="combat-run-sequence"><div className="combat-run-metric-head"><span>DUNGEON RUN</span><strong>{index + 1} / {totalSteps}</strong></div><Progress value={(index + 1) / totalSteps * 100} tone="mana" /><small>CURRENT ENCOUNTER · {currentMonster?.name ?? 'Unknown'}</small></div><div className="combat-run-boss"><span className="combat-subsection-label"><Crown size={12} aria-hidden="true" /> FINAL BOSS</span><strong>{boss.name}</strong><small>{index >= sequence.length ? 'FIGHTING' : `STEP ${index + 1} OF ${totalSteps}`}</small></div><div className="combat-run-actions"><Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button></div></section>
  }

  const targetStatus = combat.inBossFight ? 'RESUMES AFTER BOSS' : combat.enemyId && combat.enemyId === combat.targetEnemyId ? 'CURRENT TARGET' : 'NEXT ENCOUNTER'
  return <section className={`combat-run-bar is-active${nearBoss ? ' is-near-boss' : ''}${thresholdFlash ? ' is-threshold-flash' : ''} is-mode-${mode}`}><div className="combat-run-context"><span className="combat-subsection-label">CURRENT LOCATION</span><strong>{dungeon.name}</strong><small>{COMBAT_LOCATION_TYPE_METADATA[location?.type ?? 'dungeon'].label} · {modeLabel}</small></div>{targeted && activeTarget && <div className="combat-run-target"><span className="combat-subsection-label">HUNTING</span><strong>{activeTarget.name}</strong><small>{targetStatus}</small></div>}<div className="combat-run-threat"><div className="combat-run-metric-head"><span>THREAT · {threatState}</span><strong>{threatLabel}</strong></div><Progress value={combat.threatCleared / Math.max(1, dungeon.threatRequired) * 100} tone="warning" /><small>{threatThreshold ? `${dungeon.threatRequired} / ${dungeon.threatRequired} threshold reached` : nearBoss ? 'Boss encounter approaching' : 'Building toward Boss encounter'}</small></div><div className={`combat-run-boss${bossDominant ? ' is-dominant' : ''}`}><span className="combat-subsection-label"><Crown size={12} aria-hidden="true" /> BOSS</span><strong>{boss.name}</strong><small>{bossStatus}</small></div><div className="combat-run-boss-controls">{manualBossEngageAvailable && <Button variant="danger" onClick={() => engageBoss(dungeon.boss)}><Swords size={14} /><span className="combat-run-engage-label-long">ENGAGE {boss.name.toUpperCase()}</span><span className="combat-run-engage-label-short">ENGAGE BOSS</span></Button>}<GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntDescription} />}><button type="button" className={`combat-toggle combat-run-toggle${autoHuntEnabled ? ' is-on' : ''}`} disabled={autoHuntDisabled} onClick={() => toggleAutoHunt(dungeonId)}><span>AUTO HUNT</span><strong>{autoHuntDisabled ? 'LOCKED' : autoHuntEnabled ? 'ON' : 'OFF'}</strong></button></GameTooltip></div><div className="combat-run-actions"><Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button></div></section>
}
