import { Button, Card } from '../../../components/ui'
import { useMemo } from 'react'
import { DUNGEONS } from '../../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../../game/content/monsters'
import { getCombatMetricSnapshot } from '../../../game/telemetry/combat/combatTelemetrySelectors'
import { useCombatTelemetryStore } from '../../../game/telemetry/combat/combatTelemetryStore'
import { clearCombatLogUi, useCombatLogStore } from '../../../game/ui/combatLogStore'
import { useGameStore } from '../../../store/gameStore'
import type { DeveloperCopy } from '../DeveloperCombat'
import { Summary } from '../DeveloperTabPrimitives'
import type { CombatTelemetryScope } from '../../../game/telemetry/combat/combatTelemetryTypes'
import { useShallow } from 'zustand/react/shallow'

const seconds = (ms: number) => `${(Math.max(0, ms) / 1000).toFixed(1)}s`
const metricValue = (value: number) => Math.round(value * 100) / 100

export function DeveloperCombatTelemetry({ copy }: { copy: DeveloperCopy }) {
  const telemetryStructure = useCombatTelemetryStore(useShallow((state) => {
    const run = state.run ?? state.lastRun
    const encounter = state.encounter
    return {
      runId: run?.scopeId ?? null,
      runPlayer: run?.player ?? null,
      runEnemy: run?.enemy ?? null,
      encounterId: encounter?.scopeId ?? null,
      encounterPlayer: encounter?.player ?? null,
      encounterEnemy: encounter?.enemy ?? null,
    }
  }))
  const runEngagedMs = useCombatTelemetryStore((state) => (state.run ?? state.lastRun)?.engagedMs ?? 0)
  const encounterEngagedMs = useCombatTelemetryStore((state) => state.encounter?.engagedMs ?? 0)
  const entries = useCombatLogStore((state) => state.entries)
  const combat = useGameStore((state) => state.combat)
  const player = useGameStore((state) => state.player)
  const debug = useGameStore((state) => state.debug)
  const resetMeasurement = useCombatTelemetryStore((state) => state.resetMeasurement)
  const run = useMemo<CombatTelemetryScope | null>(() => telemetryStructure.runId && telemetryStructure.runPlayer && telemetryStructure.runEnemy ? { scopeId: telemetryStructure.runId, startedAtSequence: 0, aggregateRevision: 0, engagedMs: runEngagedMs, elapsedMs: 0, player: telemetryStructure.runPlayer, enemy: telemetryStructure.runEnemy, barrierLayers: [] } : null, [runEngagedMs, telemetryStructure])
  const encounter = useMemo<CombatTelemetryScope | null>(() => telemetryStructure.encounterId && telemetryStructure.encounterPlayer && telemetryStructure.encounterEnemy ? { scopeId: telemetryStructure.encounterId, startedAtSequence: 0, aggregateRevision: 0, engagedMs: encounterEngagedMs, elapsedMs: 0, player: telemetryStructure.encounterPlayer, enemy: telemetryStructure.encounterEnemy, barrierLayers: [] } : null, [encounterEngagedMs, telemetryStructure])
  const playerDamage = getCombatMetricSnapshot(run, 'player', 'damage')
  const enemyDamage = getCombatMetricSnapshot(run, 'enemy', 'damage')
  const playerTaken = getCombatMetricSnapshot(run, 'player', 'taken')
  const playerHealing = getCombatMetricSnapshot(run, 'player', 'healing')
  const dungeon = DUNGEONS[combat.dungeonId ?? 'whispering-woods']
  const copyState = () => copy('Combat state', { combat, player: { health: player.health, maxHealth: player.maxHealth, mana: player.mana, maxMana: player.maxMana }, debugCombatOverrides: { playerImmortal: debug.playerImmortal, enemyImmortal: debug.enemyImmortal, infiniteMana: debug.infiniteMana, ignoreSpellCooldowns: debug.ignoreSpellCooldowns, disablePlayerBasicAttack: debug.disablePlayerBasicAttack, disableAutoCast: debug.disableAutoCast, freezePlayerActions: debug.freezePlayerActions, freezeEnemyActions: debug.freezeEnemyActions, combatPaused: debug.combatPaused, combatTimeScale: debug.combatTimeScale }, currentEnemyDefinition: combat.enemyId ? MONSTERS[combat.enemyId] : null, currentDungeonDefinition: dungeon })
  const copyTelemetry = () => { const current = useCombatTelemetryStore.getState(); return copy('Telemetry', { run: current.run, lastRun: current.lastRun, encounter: current.encounter }) }
  return <div className="developer-tab-grid">
    <Card title="Combat measurement"><div className="developer-summary-grid"><Summary label="Run engaged" value={seconds(run?.engagedMs ?? 0)} /><Summary label="Encounter engaged" value={seconds(encounter?.engagedMs ?? 0)} /><Summary label="Player damage" value={metricValue(playerDamage.total)} /><Summary label="Player DPS" value={metricValue(playerDamage.rate)} /><Summary label="Enemy damage" value={metricValue(enemyDamage.total)} /><Summary label="Incoming DPS" value={metricValue(playerTaken.rate)} /><Summary label="Player healing" value={metricValue(playerHealing.total)} /><Summary label="Player HPS" value={metricValue(playerHealing.rate)} /><Summary label="Barrier granted" value={metricValue(run?.player.barrierGranted ?? 0)} /><Summary label="Barrier absorbed" value={metricValue(run?.player.barrierAbsorbed ?? 0)} /></div></Card>
    <Card title="Telemetry controls"><div className="button-row"><Button variant="secondary" onClick={resetMeasurement}>Reset Combat Measurement</Button><Button variant="ghost" onClick={clearCombatLogUi}>Clear Combat Log</Button><Button onClick={copyState}>Copy Combat State</Button><Button onClick={copyTelemetry}>Copy Telemetry JSON</Button><Button onClick={() => copy('Last 50 events', entries.slice(0, 50))}>Copy Last 50 Combat Events</Button></div><p className="muted">Uses the live Combat telemetry aggregator. Resetting measurement does not alter dungeon progression.</p></Card>
    <Card title="Recent combat events"><div className="developer-event-list">{entries.slice(0, 50).map((entry) => <div key={entry.id}><strong>{entry.category}</strong><span>{entry.sourceId} · {entry.amount ?? entry.healthDamage ?? 0}</span></div>)}{entries.length === 0 && <p className="muted">No recent events.</p>}</div></Card>
  </div>
}
