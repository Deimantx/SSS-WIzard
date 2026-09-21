import { useMemo, useRef, useState } from 'react'
import { Button, Card, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MONSTERS } from '../../../game/content/monsters'
import { RESONANCE_TYPES } from '../../../game/content/resonance/resonance'
import {
  buildCombatFarmingBenchmarkBuildSummary,
  COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS,
  COMBAT_BALANCE_BENCHMARK_VERSION,
  getCombatFarmingBenchmarkTargets,
  normalizeCombatFarmingBenchmarkDuration,
  runCombatFarmingBenchmarkMatrix,
  WHISPERING_WOODS_BENCHMARK_LOCATION,
  type CombatFarmingBenchmarkBuildSummary,
  type CombatFarmingBenchmarkResult,
} from '../../../game/analysis/combat/combatFarmingBenchmark'
import type { MonsterId, WorldTierId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import type { DeveloperCopy } from '../DeveloperCombat'
import { Summary } from '../DeveloperTabPrimitives'

const LOCATION_ID = 'whispering-woods' as const
const TARGETS = getCombatFarmingBenchmarkTargets(LOCATION_ID)
const DURATION_PRESET_IDS = COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.map((preset) => preset.id)
type DurationPresetId = typeof DURATION_PRESET_IDS[number] | 'custom'
type TierScope = 'both' | WorldTierId
type TargetScope = 'all' | MonsterId

const formatNumber = (value: number) => Math.round(value).toLocaleString()
const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 })
const formatDuration = (durationMs: number | null) => {
  if (durationMs === null) return '—'
  const totalSeconds = Math.max(0, Math.round(durationMs / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}
const difficultyLabel = (difficulty: CombatFarmingBenchmarkResult['difficulty']) => difficulty?.toUpperCase() ?? 'INVALID'
const resultStatus = (result: CombatFarmingBenchmarkResult) => {
  if (!result.valid) return 'INVALID'
  if (!result.survived) return `DIED @ ${formatDuration(result.timeToDeathMs)}`
  return 'SURVIVED'
}
const resultFlags = (result: CombatFarmingBenchmarkResult) => [
  result.kills === 0 ? 'NO KILLS' : null,
  result.startingMana > 0 && result.minimumMana <= 0 ? 'MANA STARVED' : null,
].filter(Boolean).join(' · ')

const buildTableText = (results: CombatFarmingBenchmarkResult[]) => {
  const header = ['Target', 'Difficulty', 'WT', 'Survival', 'Avg Kill', 'Kills/h', 'Fire/h', 'Water/h', 'Earth/h', 'Air/h', 'Total Res/h', 'End HP', 'End Mana', 'Incoming DPS']
  const rows = results.map((result) => [
    MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId,
    difficultyLabel(result.difficulty),
    `WT${result.worldTier}`,
    `${resultStatus(result)}${resultFlags(result) ? ` (${resultFlags(result)})` : ''}`,
    formatDuration(result.averageKillTimeMs),
    formatNumber(result.killsPerHour),
    formatNumber(result.resonancePerHour.fire),
    formatNumber(result.resonancePerHour.water),
    formatNumber(result.resonancePerHour.earth),
    formatNumber(result.resonancePerHour.air),
    formatNumber(result.totalResonancePerHour),
    formatNumber(result.endingHealth),
    formatNumber(result.endingMana),
    formatDecimal(result.damageTakenPerSecond),
  ])
  return [header, ...rows].map((row) => row.join('\t')).join('\n')
}

const buildExportPayload = (build: CombatFarmingBenchmarkBuildSummary, durationMs: number, targetIds: MonsterId[], worldTiers: WorldTierId[], results: CombatFarmingBenchmarkResult[]) => ({
  benchmarkVersion: COMBAT_BALANCE_BENCHMARK_VERSION,
  location: { id: LOCATION_ID, name: WHISPERING_WOODS_BENCHMARK_LOCATION.name },
  build,
  durationMs,
  targetIds,
  worldTiers,
  results,
})

const SummaryTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => <GameTooltip content={<TooltipContent title={title} description={description} />}>{children}</GameTooltip>

export function DeveloperCombatBalance({ copy }: { copy: DeveloperCopy }) {
  const [durationPreset, setDurationPreset] = useState<DurationPresetId>('5m')
  const [customMinutes, setCustomMinutes] = useState(5)
  const [tierScope, setTierScope] = useState<TierScope>('both')
  const [targetScope, setTargetScope] = useState<TargetScope>('all')
  const [results, setResults] = useState<CombatFarmingBenchmarkResult[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [running, setRunning] = useState(false)
  const [buildSummary, setBuildSummary] = useState<CombatFarmingBenchmarkBuildSummary>(() => buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()))
  const cancelRequested = useRef(false)
  const runId = useRef(0)

  const durationMs = normalizeCombatFarmingBenchmarkDuration(durationPreset === 'custom'
    ? customMinutes * 60 * 1_000
    : COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.find((preset) => preset.id === durationPreset)?.durationMs ?? 5 * 60 * 1_000)
  const targetIds = useMemo(() => targetScope === 'all' ? TARGETS : [targetScope], [targetScope])
  const worldTiers = useMemo<WorldTierId[]>(() => tierScope === 'both' ? [1, 2] : [tierScope], [tierScope])
  const canRun = targetIds.length > 0 && durationMs > 0
  const observations = useMemo(() => {
    const notes: string[] = []
    const byKey = new Map(results.map((result) => [`${result.targetEnemyId}:${result.worldTier}`, result]))
    const seen = new Set<string>()
    results.forEach((result) => {
      const monsterName = MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId
      if (!result.valid && result.invalidReason) notes.push(`${monsterName} WT${result.worldTier}: ${result.invalidReason}`)
      if (!result.survived && result.valid && result.timeToDeathMs !== null) notes.push(`${monsterName} WT${result.worldTier}: target died before the requested duration.`)
      if (result.valid && result.kills === 0) notes.push(`${monsterName} WT${result.worldTier}: no completed kills.`)
      const intendedElements = RESONANCE_TYPES.filter((type) => (MONSTERS[result.targetEnemyId]?.resonanceYield?.[type] ?? 0) > 0)
      if (result.valid && intendedElements.length > 0 && intendedElements.every((type) => result.resonancePerHour[type] === 0)) notes.push(`${monsterName} WT${result.worldTier}: zero intended Resonance element measured.`)
      const pairKey = result.targetEnemyId
      const wt1 = byKey.get(`${pairKey}:1`)
      const wt2 = byKey.get(`${pairKey}:2`)
      if (wt1 && wt2 && wt1.valid && wt2.valid && wt2.totalResonancePerHour < wt1.totalResonancePerHour && !seen.has(pairKey)) {
        notes.push(`${monsterName}: WT2 total Resonance/h is lower than WT1.`)
        seen.add(pairKey)
      }
    })
    return notes
  }, [results])
  const comparisons = useMemo(() => TARGETS.map((targetEnemyId) => {
    const wt1 = results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === 1)
    const wt2 = results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === 2)
    if (!wt1 || !wt2) return { targetEnemyId, wt1, wt2, ratio: null }
    return { targetEnemyId, wt1, wt2, ratio: wt1.totalResonancePerHour > 0 ? wt2.totalResonancePerHour / wt1.totalResonancePerHour : null }
  }), [results])

  const refreshBuildSnapshot = () => setBuildSummary(buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()))

  const runBenchmark = () => {
    if (!canRun || running) return
    const currentRunId = runId.current + 1
    runId.current = currentRunId
    cancelRequested.current = false
    const sourceState = useGameStore.getState()
    setBuildSummary(buildCombatFarmingBenchmarkBuildSummary(sourceState))
    setResults([])
    setProgress({ completed: 0, total: targetIds.length * worldTiers.length })
    setRunning(true)
    void runCombatFarmingBenchmarkMatrix({ sourceState, locationId: LOCATION_ID, targetEnemyIds: targetIds, worldTiers, durationMs }, {
      isCancelled: () => cancelRequested.current,
      onProgress: setProgress,
      onResult: (result) => setResults((current) => [...current, result]),
    }).finally(() => {
      if (runId.current === currentRunId) setRunning(false)
    })
  }

  const cancelBenchmark = () => { cancelRequested.current = true }
  const exportPayload = buildExportPayload(buildSummary, durationMs, targetIds, worldTiers, results)

  return <div className="developer-balance-lab">
    <Card title="Combat Balance Lab" action={<Status tone="active">ANALYSIS ONLY</Status>}>
      <div className="developer-balance-intro"><p className="muted">Canonical combat farming measurements for Whispering Woods. Results are transient and run against a cloned current build.</p><Button variant="secondary" onClick={refreshBuildSnapshot} tooltip="Refresh the build identity used as the benchmark source. This never equips or changes the live profile.">CURRENT BUILD</Button></div>
    </Card>

    <Card title="Build snapshot">
      <div className="developer-summary-grid developer-balance-summary-grid">
        <Summary label="Max HP" value={formatNumber(buildSummary.maxHealth)} />
        <Summary label="Max Mana" value={formatNumber(buildSummary.maxMana)} />
        <Summary label="Max Focus" value={formatNumber(buildSummary.maxFocus)} />
        <Summary label="Guardian" value={buildSummary.guardianName ?? 'None'} />
        <Summary label="Spell preset" value={buildSummary.selectedSpellPresetName ?? 'None'} />
        <Summary label="Arcane Core" value={formatNumber(buildSummary.arcaneCorePoints)} />
      </div>
      <div className="developer-balance-build-lines">
        <span><strong>Equipment</strong> {buildSummary.equipment.map((entry) => `${entry.slot}: ${entry.name}`).join(' · ')}</span>
        <span><strong>Schools</strong> {RESONANCE_TYPES.map((school) => `${school.toUpperCase()} ${buildSummary.schoolLevels[school]}`).join(' · ')}</span>
      </div>
    </Card>

    <Card title="Benchmark setup">
      <div className="developer-balance-controls">
        <SummaryTooltip title="Benchmark duration" description="Simulated combat time per target and World Tier. Custom runs are capped at 60 minutes."><label className="developer-balance-field">DURATION<select aria-label="Benchmark duration" value={durationPreset} onChange={(event) => setDurationPreset(event.target.value as DurationPresetId)}>{COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}<option value="custom">CUSTOM</option></select></label></SummaryTooltip>
        {durationPreset === 'custom' && <label className="developer-balance-field">CUSTOM MINUTES<input aria-label="Custom benchmark minutes" type="number" min={1} max={60} value={customMinutes} onChange={(event) => setCustomMinutes(Math.max(1, Math.min(60, Number(event.target.value) || 1)))} /></label>}
        <SummaryTooltip title="World Tier scope" description="WT2 is simulated in the clone even when the live profile has not unlocked it. The live profile is never changed."><div className="developer-balance-field"><span>WORLD TIER</span><div className="developer-balance-segmented">{(['both', 1, 2] as const).map((scope) => <Button key={String(scope)} variant={tierScope === scope ? 'primary' : 'secondary'} ariaPressed={tierScope === scope} onClick={() => setTierScope(scope)}>{scope === 'both' ? 'WT1 + WT2' : `WT${scope}`}</Button>)}</div></div></SummaryTooltip>
        <SummaryTooltip title="Target scope" description="Targets use the authored Whispering Woods order. Forest Heart is excluded from this normal farming matrix."><label className="developer-balance-field">TARGETS<select aria-label="Benchmark target scope" value={targetScope} onChange={(event) => setTargetScope(event.target.value as TargetScope)}><option value="all">ALL WHISPERING WOODS TARGETS</option>{TARGETS.map((targetEnemyId) => <option key={targetEnemyId} value={targetEnemyId}>{MONSTERS[targetEnemyId]?.name ?? targetEnemyId} ONLY</option>)}</select></label></SummaryTooltip>
      </div>
      <div className="developer-balance-actions"><Button onClick={runBenchmark} disabled={!canRun || running} tooltip="Run the real combat simulation for each selected target and tier in a cloned GameState.">RUN BENCHMARK</Button><Button variant="danger" onClick={cancelBenchmark} disabled={!running} tooltip="Stop after the current simulation job and keep completed rows visible.">CANCEL</Button><span className="developer-balance-progress-label">{running ? `Running ${progress.completed} / ${progress.total}` : progress.total > 0 ? `${progress.completed} / ${progress.total} COMPLETE` : 'READY'}</span></div>
      {progress.total > 0 && <Progress value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} label="Matrix progress" right={`${progress.completed} / ${progress.total}`} running={running} />}
    </Card>

    <Card title="Results" action={<div className="developer-balance-copy-actions"><Button variant="secondary" onClick={() => void copy('Balance table', buildTableText(results))} disabled={results.length === 0}>COPY TABLE</Button><Button variant="secondary" onClick={() => void copy('Balance JSON', exportPayload)} disabled={results.length === 0}>COPY JSON</Button></div>}>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['TARGET', 'DIFFICULTY', 'WT', 'SURVIVAL', 'AVG KILL', 'KILLS/H', 'FIRE/H', 'WATER/H', 'EARTH/H', 'AIR/H'].map((label) => <th key={label}>{label}</th>)}<th><SummaryTooltip title="Total Resonance per hour" description="Fire + Water + Earth + Air per simulated hour. No elemental weighting is applied."><span>TOTAL RES/H</span></SummaryTooltip></th><th>END HP</th><th>END MANA</th><th>INCOMING DPS</th></tr></thead><tbody>{results.map((result) => <tr key={`${result.targetEnemyId}-${result.worldTier}`}><th scope="row">{MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId}</th><td><Status tone="neutral">{difficultyLabel(result.difficulty)}</Status></td><td><strong>WT{result.worldTier}</strong></td><td><span className={result.survived ? 'developer-balance-positive' : 'developer-balance-warning'}>{resultStatus(result)}</span>{resultFlags(result) && <small>{resultFlags(result)}</small>}</td><td>{formatDuration(result.averageKillTimeMs)}</td><td>{formatNumber(result.killsPerHour)}</td><td>{formatNumber(result.resonancePerHour.fire)}</td><td>{formatNumber(result.resonancePerHour.water)}</td><td>{formatNumber(result.resonancePerHour.earth)}</td><td>{formatNumber(result.resonancePerHour.air)}</td><td><strong>{formatNumber(result.totalResonancePerHour)}</strong></td><td>{formatNumber(result.endingHealth)}</td><td>{formatNumber(result.endingMana)}</td><td>{formatDecimal(result.damageTakenPerSecond)}</td></tr>)}{results.length === 0 && <tr><td colSpan={14} className="muted">No benchmark rows yet. Run a matrix to measure the current build.</td></tr>}</tbody></table></div>
    </Card>

    <Card title="WT1 ↔ WT2 comparison">
      <div className="developer-balance-comparison-grid">{comparisons.filter((comparison) => comparison.wt1 || comparison.wt2).map((comparison) => <div className="developer-balance-comparison" key={comparison.targetEnemyId}><strong>{MONSTERS[comparison.targetEnemyId]?.name ?? comparison.targetEnemyId}</strong><span>WT1 {comparison.wt1 ? `${formatNumber(comparison.wt1.totalResonancePerHour)} / h` : '—'}</span><span>WT2 {comparison.wt2 ? `${formatNumber(comparison.wt2.totalResonancePerHour)} / h` : '—'}</span><em>WT2 / WT1: {comparison.ratio === null ? '—' : `${comparison.ratio.toFixed(2)}×`}</em></div>)}{results.length === 0 && <p className="muted">Same-target deltas appear after both tiers finish.</p>}</div>
    </Card>

    <Card title="Neutral observations">
      {observations.length > 0 ? <ul className="developer-balance-observations">{observations.map((observation, index) => <li key={`${observation}-${index}`}>{observation}</li>)}</ul> : <p className="muted">No derived observations yet. This panel reports measurements only; it never changes balance values.</p>}
    </Card>
  </div>
}
