import { useMemo, useState } from 'react'
import { Button, Card, SelectMenu, Status } from '../../../components/ui'
import { MONSTERS, MONSTER_IDS } from '../../../game/content/monsters'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER, type CombatLocationId } from '../../../game/content/combat-locations'
import { buildCombatV2ContentAudit, buildCombatV2GlobalAudit } from '../../../game/systems/combat/combatContentAudit'
import { buildThreatKillsToBossAudit } from '../../../game/analysis/combat/combatPowerAudit'
import { buildCombatFarmingBenchmarkBuildSummary, runCombatFarmingBenchmarkMatrix, type CombatFarmingBenchmarkResult } from '../../../game/analysis/combat/combatFarmingBenchmark'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'

const fmt = (value: number) => Math.round(value).toLocaleString()

export function DeveloperCombatBalance() {
  const [locationId, setLocationId] = useState<CombatLocationId>('whispering-woods')
  const [results, setResults] = useState<CombatFarmingBenchmarkResult[]>([])
  const [running, setRunning] = useState(false)
  const location = COMBAT_LOCATIONS[locationId]
  const targets = useMemo(() => location.monsterPool.filter((id) => MONSTERS[id]), [location])
  const rows = useMemo(() => buildCombatV2ContentAudit(), [])
  const global = useMemo(() => buildCombatV2GlobalAudit(), [])
  const threat = useMemo(() => buildThreatKillsToBossAudit(), [])
  const run = async () => {
    if (running || targets.length === 0) return
    setRunning(true); setResults([])
    try {
      const result = await runCombatFarmingBenchmarkMatrix({ sourceState: useGameStore.getState(), locationId, targetEnemyIds: targets, durationMs: 60_000 }, { onResult: (entry) => setResults((current) => [...current, entry]) })
      setResults(result.results)
    } finally { setRunning(false) }
  }
  return <div className="developer-tab-stack">
    <Card title="Combat content audit" action={<Status tone={rows.some((row) => row.warnings.length) ? 'warning' : 'success'}>{rows.filter((row) => row.warnings.length).length} WARNINGS</Status>}>
      <p className="muted">Single canonical profile per authored enemy. Values use the monster definition and shared combat Power resolver.</p>
      <div className="developer-summary-grid"><div className="developer-summary"><span>Monsters audited</span><strong>{rows.length}</strong></div><div className="developer-summary"><span>Missing affinity</span><strong>{global.implicitAffinityCount}</strong></div><div className="developer-summary"><span>Generic traits</span><strong>{global.genericEquippedTraitCount}</strong></div><div className="developer-summary"><span>Flat periodic effects</span><strong>{global.defaultFlatPeriodicDamageCount + global.defaultFlatPeriodicHealCount}</strong></div></div>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>LOCATION</th><th>MONSTER</th><th>POWER</th><th>HP</th><th>DEFENSE</th><th>BASIC DAMAGE</th><th>BASIC DPS</th><th>WARNINGS</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.location}</td><th scope="row">{row.name}</th><td>{fmt(row.power)}</td><td>{fmt(row.hp)}</td><td>{fmt(row.defense)}</td><td>{fmt(row.basicDamage)}</td><td>{fmt(row.basicDps)}</td><td>{row.warnings.join(' / ') || 'OK'}</td></tr>)}</tbody></table></div>
    </Card>
    <Card title="Threat kills to boss"><p className="muted">Targeted locations use authored Threat requirements and canonical enemy Power for Threat per kill.</p><div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>LOCATION</th><th>REQUIRED</th><th>WEAKEST / KILL</th><th>MEDIAN / KILL</th><th>STRONGEST / KILL</th><th>KILLS AT MEDIAN</th><th>WARNINGS</th></tr></thead><tbody>{threat.map((row) => <tr key={row.locationId}><th scope="row">{row.location}</th><td>{fmt(row.threatRequired)}</td><td>{fmt(row.weakestThreatPerKill)}</td><td>{fmt(row.medianThreatPerKill)}</td><td>{fmt(row.strongestThreatPerKill)}</td><td>{row.killsUsingMedian}</td><td>{row.warnings.join(' / ') || 'OK'}</td></tr>)}</tbody></table></div></Card>
    <Card title="Farming benchmark" action={<Button onClick={() => void run()} disabled={running || targets.length === 0}>{running ? 'RUNNING...' : 'RUN 1 MINUTE'}</Button>}>
      <p className="muted">Benchmarks run one authored enemy profile for each normal target in the selected location.</p>
      <label className="developer-select-field">LOCATION<SelectMenu<CombatLocationId> ariaLabel="Benchmark location" value={locationId} onChange={(value) => { setLocationId(value); setResults([]) }} options={COMBAT_LOCATION_ORDER.filter((id) => COMBAT_LOCATIONS[id].monsterPool.length > 0).map((id) => ({ value: id, label: COMBAT_LOCATIONS[id].name }))} /></label>
      <div className="developer-summary-grid"><div className="developer-summary"><span>Build spell power</span><strong>{fmt(buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()).spellPower)}</strong></div><div className="developer-summary"><span>Targets</span><strong>{targets.length}</strong></div></div>
      {results.length > 0 && <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>TARGET</th><th>VALID</th><th>SURVIVED</th><th>KILLS</th><th>AVG KILL</th><th>DAMAGE TAKEN / SEC</th></tr></thead><tbody>{results.map((row) => <tr key={row.targetEnemyId}><th scope="row">{MONSTERS[row.targetEnemyId]?.name ?? row.targetEnemyId}</th><td>{row.valid ? 'YES' : row.invalidReason ?? 'NO'}</td><td>{row.survived ? 'YES' : 'NO'}</td><td>{row.kills}</td><td>{row.averageKillTimeMs === null ? '?' : `${(row.averageKillTimeMs / 1000).toFixed(1)}s`}</td><td>{fmt(row.damageTakenPerSecond)}</td></tr>)}</tbody></table></div>}
    </Card>
  </div>
}
