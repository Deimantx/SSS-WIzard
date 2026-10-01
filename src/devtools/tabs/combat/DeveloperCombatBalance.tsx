import { useMemo, useRef, useState } from 'react'
import { Button, Card, GameTooltip, Progress, SearchInput, SelectMenu, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { isBossMonster, MONSTERS } from '../../../game/content/monsters'
import { RESONANCE_TYPES } from '../../../game/content/resonance/resonance'
import {
  buildCombatFarmingBenchmarkBuildSummary,
  COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS,
  COMBAT_BALANCE_BENCHMARK_VERSION,
  getCombatFarmingBenchmarkTargets,
  getCombatBenchmarkMode,
  getCombatBenchmarkWorldTiers,
  normalizeCombatFarmingBenchmarkDuration,
  runCombatFarmingBenchmarkMatrix,
  runCombatDungeonRunBenchmark,
  runCombatBossCycleBenchmark,
  type CombatFarmingBenchmarkBuildSummary,
  type CombatFarmingBenchmarkResult,
  type CombatDungeonRunBenchmarkResult,
  type CombatBossCycleBenchmarkResult,
} from '../../../game/analysis/combat/combatFarmingBenchmark'
import { COMBAT_LOCATIONS, type CombatLocationId } from '../../../game/content/combat-locations'
import type { MonsterId, WorldTierId } from '../../../game/types'
import { buildThreatKillsToBossAudit } from '../../../game/analysis/combat/combatPowerAudit'
import { buildCombatV2RegionalGlobalAudit, buildCombatV2ContentAudit, buildCombatV2MonsterWorldTierComparison, COMBAT_V2_AUDIT_MONSTER_IDS, COMBAT_V2_AUDIT_REGIONS, type CombatV2AuditRegionId } from '../../../game/systems/combat/combatContentAudit'
import { WORLD_TIER_IDS } from '../../../game/content/world-tier/worldTiers'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'
import type { DeveloperCopy } from '../DeveloperCombat'
import { Summary } from '../DeveloperTabPrimitives'

const BENCHMARK_LOCATIONS = Object.values(COMBAT_LOCATIONS).filter((location) => location.id && (getCombatFarmingBenchmarkTargets(location.id).length > 0 || getCombatBenchmarkMode(location.id) === 'dungeon-run'))
const DURATION_PRESET_IDS = COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.map((preset) => preset.id)
type DurationPresetId = typeof DURATION_PRESET_IDS[number] | 'custom'
type TierScope = 'all' | WorldTierId
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
  const header = ['Target', 'Difficulty', 'WT', 'Survival', 'Avg Kill', 'Kills/h', 'Fire/h', 'Water/h', 'Earth/h', 'Air/h', 'Total Res/h', 'Life Essence/h', 'Artifact Essence/h', 'Sigils/h', 'Crystal Caches/h', 'Arcane Points/h', 'End HP', 'End Mana', 'Incoming DPS']
  const rows = results.map((result) => {
    const farm = result.mode === 'target-farm'
    return [
    MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId,
    difficultyLabel(result.difficulty),
    `WT${result.worldTier}`,
    `${resultStatus(result)}${resultFlags(result) ? ` (${resultFlags(result)})` : ''}`,
    formatDuration(result.averageKillTimeMs),
    farm ? formatNumber(result.killsPerHour) : '—',
    farm ? formatNumber(result.resonancePerHour.fire) : '—',
    farm ? formatNumber(result.resonancePerHour.water) : '—',
    farm ? formatNumber(result.resonancePerHour.earth) : '—',
    farm ? formatNumber(result.resonancePerHour.air) : '—',
    farm ? formatNumber(result.totalResonancePerHour) : '—',
    farm ? formatNumber(result.lifeEssencePerHour) : '—',
    farm ? formatNumber(result.artifactEssencePerHour) : '—',
    farm ? formatNumber(result.sigilDropsPerHour) : '—',
    farm ? formatNumber(result.expectedCrystalCachesPerHour) : '—',
    farm ? formatNumber(result.arcanePointsPerHour) : '—',
    formatNumber(result.endingHealth),
    formatNumber(result.endingMana),
    formatDecimal(result.damageTakenPerSecond),
  ]
  })
  return [header, ...rows].map((row) => row.join('\t')).join('\n')
}

const buildExportPayload = (locationId: CombatLocationId, build: CombatFarmingBenchmarkBuildSummary, durationMs: number, targetIds: MonsterId[], worldTiers: WorldTierId[], results: CombatFarmingBenchmarkResult[]) => ({
  benchmarkVersion: COMBAT_BALANCE_BENCHMARK_VERSION,
  location: { id: locationId, name: COMBAT_LOCATIONS[locationId]?.name ?? locationId },
  build,
  durationMs,
  targetIds,
  worldTiers,
  results,
})

const SummaryTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => <GameTooltip content={<TooltipContent title={title} description={description} />}>{children}</GameTooltip>

export function DeveloperCombatBalance({ copy }: { copy: DeveloperCopy }) {
  const [benchmarkLocationId, setBenchmarkLocationId] = useState<CombatLocationId>('whispering-woods')
  const [durationPreset, setDurationPreset] = useState<DurationPresetId>('5m')
  const [customMinutes, setCustomMinutes] = useState(5)
  const [tierScope, setTierScope] = useState<TierScope>('all')
  const [targetScope, setTargetScope] = useState<TargetScope>('all')
  const [results, setResults] = useState<CombatFarmingBenchmarkResult[]>([])
  const [dungeonRunResult, setDungeonRunResult] = useState<CombatDungeonRunBenchmarkResult | null>(null)
  const [bossCycleResult, setBossCycleResult] = useState<CombatBossCycleBenchmarkResult | null>(null)
  const [bossCycleEnabled, setBossCycleEnabled] = useState(false)
  const [bossCycleCount, setBossCycleCount] = useState(1)
  const [bossCycleTarget, setBossCycleTarget] = useState<MonsterId>('forest-wisp')
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [running, setRunning] = useState(false)
  const [buildSummary, setBuildSummary] = useState<CombatFarmingBenchmarkBuildSummary>(() => buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()))
  const [auditWorldTier, setAuditWorldTier] = useState<WorldTierId>(1)
  const benchmarkTargets = useMemo(() => getCombatFarmingBenchmarkTargets(benchmarkLocationId, true), [benchmarkLocationId])
  const targetFarmTargets = useMemo(() => benchmarkTargets.filter((targetId) => !isBossMonster(MONSTERS[targetId])), [benchmarkTargets])
  const benchmarkMode = getCombatBenchmarkMode(benchmarkLocationId)
  const benchmarkLocation = COMBAT_LOCATIONS[benchmarkLocationId]
  const benchmarkBossId = benchmarkLocation?.bossId ?? null
  const [auditRegion, setAuditRegion] = useState<CombatV2AuditRegionId>('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditWarningsOnly, setAuditWarningsOnly] = useState(false)
  const [comparisonMonsterId, setComparisonMonsterId] = useState<MonsterId>('meridian-splitter')
  const cancelRequested = useRef(false)
  const runId = useRef(0)

  const durationMs = normalizeCombatFarmingBenchmarkDuration(durationPreset === 'custom'
    ? customMinutes * 60 * 1_000
    : COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.find((preset) => preset.id === durationPreset)?.durationMs ?? 5 * 60 * 1_000)
  const targetIds = useMemo(() => targetScope === 'all' ? benchmarkTargets : benchmarkTargets.includes(targetScope) ? [targetScope] : benchmarkTargets, [benchmarkTargets, targetScope])
  const worldTiers = useMemo<WorldTierId[]>(() => getCombatBenchmarkWorldTiers(tierScope), [tierScope])
  const canRun = (benchmarkMode === 'dungeon-run' || targetIds.length > 0) && durationMs > 0
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
      const lowerTier = WORLD_TIER_IDS.filter((tier) => tier > 1).find((tier) => {
        const higher = byKey.get(`${pairKey}:${tier}`)
        return wt1?.valid && higher?.valid && higher.totalResonancePerHour < wt1.totalResonancePerHour
      })
      if (wt1 && lowerTier && !seen.has(pairKey)) {
        notes.push(`${monsterName}: WT${lowerTier} total Resonance/h is lower than WT1.`)
        seen.add(pairKey)
      }
    })
    worldTiers.forEach((worldTier) => {
      const boss = results.find((result) => result.worldTier === worldTier && result.targetEnemyId === benchmarkBossId && result.valid)
      const normalTimes = results.filter((result) => result.worldTier === worldTier && result.targetEnemyId !== benchmarkBossId && result.valid && result.averageKillTimeMs !== null).map((result) => result.averageKillTimeMs as number)
      if (!boss?.averageKillTimeMs || normalTimes.length === 0) return
      const ratio = boss.averageKillTimeMs / Math.max(...normalTimes)
      if (ratio < 1.5 || ratio > 5) notes.push(`${benchmarkLocation?.name ?? 'Location'} WT${worldTier}: boss / strongest-normal TTK is ${ratio.toFixed(2)}×; review this outlier.`)
    })
    return notes
  }, [benchmarkBossId, benchmarkLocation?.name, results, worldTiers])
  const comparisons = useMemo(() => targetFarmTargets.map((targetEnemyId) => {
    const baseline = results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === 1)
    const tiers = WORLD_TIER_IDS.filter((tier) => tier !== 1).map((tier) => ({ tier, result: results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === tier) }))
    const wt2 = tiers.find((row) => row.tier === 2)?.result
    return { targetEnemyId, baseline, tiers, wt1: baseline, wt2, ratio: baseline && wt2 && baseline.totalResonancePerHour > 0 ? wt2.totalResonancePerHour / baseline.totalResonancePerHour : null }
  }).filter((row) => row.baseline || row.tiers.some((tier) => tier.result)), [targetFarmTargets, results])

  const refreshBuildSnapshot = () => setBuildSummary(buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()))

  const runBenchmark = () => {
    if (!canRun || running) return
    const currentRunId = runId.current + 1
    runId.current = currentRunId
    cancelRequested.current = false
    const sourceState = useGameStore.getState()
    setBuildSummary(buildCombatFarmingBenchmarkBuildSummary(sourceState))
    setResults([])
    setDungeonRunResult(null)
    setBossCycleResult(null)
    if (benchmarkMode === 'dungeon-run') {
      const result = runCombatDungeonRunBenchmark({ sourceState, locationId: benchmarkLocationId, worldTier: worldTiers[0], maxDurationMs: durationMs })
      setDungeonRunResult(result)
      setProgress({ completed: result?.completed ? 1 : 0, total: 1 })
      return
    }
    if (bossCycleEnabled) {
      const cycle = runCombatBossCycleBenchmark({ sourceState, locationId: benchmarkLocationId, targetEnemyId: bossCycleTarget, worldTier: worldTiers[0], cycles: bossCycleCount })
      setBossCycleResult(cycle)
      setProgress({ completed: cycle?.cyclesCompleted ?? 0, total: bossCycleCount })
      setRunning(false)
      return
    }
    setProgress({ completed: 0, total: targetIds.length * worldTiers.length })
    setRunning(true)
    void runCombatFarmingBenchmarkMatrix({ sourceState, locationId: benchmarkLocationId, targetEnemyIds: targetIds, worldTiers, durationMs }, {
      isCancelled: () => cancelRequested.current,
      onProgress: setProgress,
      onResult: (result) => setResults((current) => [...current, result]),
    }).finally(() => {
      if (runId.current === currentRunId) setRunning(false)
    })
  }

  const cancelBenchmark = () => { cancelRequested.current = true }
  const exportPayload = { ...buildExportPayload(benchmarkLocationId, buildSummary, durationMs, targetIds, worldTiers, results), buildSource: 'Current Sandbox', mode: benchmarkMode, dungeonRunResult, bossCycleResult }
  const contentAudit = useMemo(() => buildCombatV2ContentAudit(auditWorldTier), [auditWorldTier])
  const visibleAuditRows = useMemo(() => {
    const query = auditSearch.trim().toLowerCase()
    return contentAudit.filter((row) => (auditRegion === 'all' || row.region === auditRegion)
      && (!auditWarningsOnly || row.warnings.length > 0)
      && (!query || `${row.id} ${row.name} ${row.location}`.toLowerCase().includes(query)))
  }, [auditRegion, auditSearch, auditWarningsOnly, contentAudit])
  const powerComparison = useMemo(() => buildCombatV2MonsterWorldTierComparison(comparisonMonsterId), [comparisonMonsterId])
  const threatAudit = useMemo(() => buildThreatKillsToBossAudit(), [])
  const globalAudit = useMemo(() => buildCombatV2RegionalGlobalAudit(auditWorldTier), [auditWorldTier])
  const targetFarmResults = results.filter((result) => result.mode === 'target-farm')
  const isolatedBossResults = results.filter((result) => result.mode === 'isolated-boss-ttk')

  return <div className="developer-balance-lab">
    <Card title="Combat V2 content power and safety audit" action={<div className="developer-balance-copy-actions"><Status tone={visibleAuditRows.some((row) => row.warnings.length > 0) ? 'warning' : 'success'}>{visibleAuditRows.filter((row) => row.warnings.length > 0).length} WARNINGS</Status><Button variant="secondary" onClick={() => void copy('Combat V2 Audit', { worldTier: auditWorldTier, region: auditRegion, rows: visibleAuditRows })}>COPY AUDIT</Button></div>}>
      <p className="muted">Combat V2 authored profiles across the tutorial, First Frontier, Elemental Scar, Shattered Meridian, and Black Sigil Reach. Values use canonical World Tier resolution.</p>
      <div className="developer-summary-grid"><Summary label="Monsters audited" value={visibleAuditRows.length} /><Summary label="Bosses" value={visibleAuditRows.filter((row) => MONSTERS[row.id]?.bestiaryCategory === 'boss').length} /><Summary label="Physical Components" value={visibleAuditRows.reduce((sum, row) => sum + row.physicalComponentCount, 0)} /><Summary label="Implicit Affinity" value={visibleAuditRows.filter((row) => !MONSTERS[row.id]?.primaryAffinity).length} /><Summary label="Generic Equipped Traits" value={visibleAuditRows.reduce((sum, row) => sum + row.genericEquippedTraitCount, 0)} /><Summary label="Flat Enemy Periodic Payloads" value={visibleAuditRows.reduce((sum, row) => sum + row.defaultFlatPeriodicCount, 0)} /><Summary label="Sustain Warnings" value={visibleAuditRows.filter((row) => row.warnings.some((warning) => warning.toLowerCase().includes('sustain') || warning.toLowerCase().includes('healing') || warning.toLowerCase().includes('barrier'))).length} /><Summary label="Description Warnings" value={visibleAuditRows.reduce((sum, row) => sum + row.genericActionDescriptionCount, 0)} /></div>
      <div className="button-row">{WORLD_TIER_IDS.map((tier) => <GameTooltip key={tier} content={<TooltipContent title={`Audit World Tier ${tier}`} description="Recalculate enemy Health, Basic damage, and Power using the canonical World Tier profile." />}><Button variant={auditWorldTier === tier ? 'primary' : 'secondary'} ariaPressed={auditWorldTier === tier} onClick={() => setAuditWorldTier(tier)}>WT{tier}</Button></GameTooltip>)}</div>
      <div className="developer-balance-segmented" aria-label="Combat V2 audit region filter">{COMBAT_V2_AUDIT_REGIONS.map((region) => <Button key={region.id} variant={auditRegion === region.id ? 'primary' : 'secondary'} ariaPressed={auditRegion === region.id} onClick={() => setAuditRegion(region.id)}>{region.label}</Button>)}</div>
      <div className="developer-balance-controls"><label className="developer-balance-field"><span>MONSTER SEARCH</span><SearchInput ariaLabel="Search audited monsters" value={auditSearch} onChange={setAuditSearch} /></label><Button variant={auditWarningsOnly ? 'primary' : 'secondary'} ariaPressed={auditWarningsOnly} onClick={() => setAuditWarningsOnly((current) => !current)}>WARNINGS ONLY</Button></div>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['LOCATION', 'MONSTER', 'AFFINITY', 'DAMAGE PROFILE', 'POWER', 'HP', 'BASIC DAMAGE', 'INTERVAL', 'BASIC DPS', 'REPEATABLE DIRECT ×', 'REPEATABLE DOT ×', 'PERIODIC HEAL %', 'REPEATABLE HEAL %', 'REPEATABLE BARRIER %', 'REPEATABLE SUSTAIN %', 'ONCE HEAL %', 'ONCE BARRIER %', 'ONCE SUSTAIN %', 'MAX CONTROL', 'PHYSICAL', 'FLAT DOT', 'FLAT HOT', 'GENERIC TRAITS', 'WARNINGS'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{visibleAuditRows.map((row) => <tr key={row.id}><td>{row.location}</td><th scope="row">{MONSTERS[row.id]?.name ?? row.id}</th><td>{row.affinity.toUpperCase()}</td><td>{row.damageProfile.map((element) => element.toUpperCase()).join(' · ')}</td><td>{row.power}</td><td>{formatNumber(row.hp)}</td><td>{formatDecimal(row.basicDamage)}</td><td>{(row.basicIntervalMs / 1000).toFixed(1)}s</td><td>{formatDecimal(row.basicDps)}</td><td>{row.maxRepeatableDirectCoefficient.toFixed(2)}</td><td>{row.periodicDamageCoefficient.toFixed(2)}</td><td>{(row.periodicHealPercent * 100).toFixed(1)}%</td><td>{(row.repeatableHealPercent * 100).toFixed(1)}%</td><td>{(row.repeatableBarrierPercent * 100).toFixed(1)}%</td><td>{(row.repeatableSustainPercent * 100).toFixed(1)}%</td><td>{(row.onceOnlyHealPercent * 100).toFixed(1)}%</td><td>{(row.onceOnlyBarrierPercent * 100).toFixed(1)}%</td><td>{(row.onceOnlySustainPercent * 100).toFixed(1)}%</td><td>{(row.maxControlMs / 1000).toFixed(1)}s</td><td>{row.physicalComponentCount}</td><td>{row.defaultFlatPeriodicDamageCount}</td><td>{row.defaultFlatPeriodicHealCount}</td><td>{row.genericEquippedTraitCount}</td><td>{row.warnings.length ? <span className="developer-balance-warning">{row.warnings.join(' · ')}</span> : <span className="developer-balance-positive">OK</span>}</td></tr>)}{visibleAuditRows.length === 0 && <tr><td colSpan={24} className="muted">No Combat V2 rows in this region.</td></tr>}</tbody></table></div>
    </Card>
    <Card title="Combat V2 reference profile matrix">
      <p className="muted">Authored progression order, boss role, mitigation, and Zone Affix context for the currently filtered audit rows.</p>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['REGION', 'LOCATION', 'ORDER', 'BOSS', 'MONSTER', 'WT', 'POWER', 'HP', 'DEFENSE', 'BASIC DAMAGE', 'INTERVAL', 'BASIC DPS', 'DAMAGE PROFILE', 'ZONE AFFIX'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{visibleAuditRows.map((row) => <tr key={`profile-${row.id}`}><td>{row.region}</td><td>{row.location}</td><td>{row.order || '—'}</td><td>{row.boss ? 'YES' : '—'}</td><th scope="row">{row.name}</th><td>WT{auditWorldTier}</td><td>{formatNumber(row.power)}</td><td>{formatNumber(row.hp)}</td><td>{formatNumber(row.defense)}</td><td>{formatDecimal(row.basicDamage)}</td><td>{(row.basicIntervalMs / 1000).toFixed(1)}s</td><td>{formatDecimal(row.basicDps)}</td><td>{row.damageProfile.map((element) => element.toUpperCase()).join(' · ')}</td><td>{row.zoneAffix ?? '—'}</td></tr>)}{visibleAuditRows.length === 0 && <tr><td colSpan={14} className="muted">No rows match this audit view.</td></tr>}</tbody></table></div>
    </Card>
    <Card title="Threat kills-to-boss matrix">
      <p className="muted">Targeted boss zones use canonical enemy Power for kill Threat and the authored World Tier requirement multiplier. Median uses the middle Threat-per-kill value after sorting target Power.</p>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['REGION', 'LOCATION', 'WT', 'REQUIRED', 'WEAKEST / KILL', 'MEDIAN / KILL', 'STRONGEST / KILL', 'KILLS AT MEDIAN', 'WT1 DRIFT', 'WARNINGS'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{threatAudit.map((row) => <tr key={`${row.locationId}-${row.worldTier}`}><td>{row.region}</td><th scope="row">{row.location}</th><td>WT{row.worldTier}</td><td>{formatNumber(row.threatRequired)}</td><td>{formatNumber(row.weakestThreatPerKill)}</td><td>{formatNumber(row.medianThreatPerKill)}</td><td>{formatNumber(row.strongestThreatPerKill)}</td><td>{row.killsUsingMedian}</td><td>{row.worldTier === 1 ? '—' : `${row.worldTierDriftPercent.toFixed(1)}%`}</td><td>{row.warnings.length ? <span className="developer-balance-warning">{row.warnings.join(' · ')}</span> : <span className="developer-balance-positive">OK</span>}</td></tr>)}</tbody></table></div>
    </Card>
    <Card title="World Tier power comparison">
      <div className="developer-balance-controls"><label className="developer-balance-field"><span>MONSTER</span><SelectMenu<MonsterId> ariaLabel="Monster World Tier comparison" value={comparisonMonsterId} onChange={setComparisonMonsterId} options={COMBAT_V2_AUDIT_MONSTER_IDS.map((id) => ({ value: id, label: MONSTERS[id]?.name ?? id }))} /></label></div>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['WORLD TIER', 'POWER', 'HP', 'BASIC DAMAGE', 'DEFENSE'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{powerComparison.map((row) => <tr key={row.worldTier}><th scope="row">WT{row.worldTier}</th><td>{formatNumber(row.power)}</td><td>{formatNumber(row.hp)}</td><td>{formatDecimal(row.basicDamage)}</td><td>{formatNumber(row.defense)}</td></tr>)}</tbody></table></div>
    </Card>
    <Card title="Combat Balance Lab" action={<Status tone="active">ANALYSIS ONLY</Status>}>
      <div className="developer-balance-intro"><p className="muted">Canonical combat farming measurements for the selected targeted zone. Results are transient and run against a cloned current build.</p><Button variant="secondary" onClick={refreshBuildSnapshot} tooltip="Refresh the build identity used as the benchmark source. This never equips or changes the live profile.">CURRENT BUILD</Button></div>
    </Card>

    <Card title="Build snapshot">
      <div className="developer-summary-grid developer-balance-summary-grid">
        <Summary label="Max HP" value={formatNumber(buildSummary.maxHealth)} />
        <Summary label="Max Mana" value={formatNumber(buildSummary.maxMana)} />
        <Summary label="Spell Power" value={formatNumber(buildSummary.spellPower)} />
        <Summary label="Defense" value={formatNumber(buildSummary.defense)} />
        <Summary label="Crit" value={`${(buildSummary.critChance * 100).toFixed(1)}%`} />
        <Summary label="Cooldown Recovery" value={`${(buildSummary.cooldownRecovery * 100).toFixed(0)}%`} />
        <Summary label="World Tier" value={`WT${buildSummary.worldTier}`} />
        <Summary label="Guardian" value={buildSummary.guardianName ?? 'None'} />
        <Summary label="Spell preset" value={buildSummary.selectedSpellPresetName ?? 'None'} />
        <Summary label="Arcane Core" value={formatNumber(buildSummary.arcaneCorePoints)} />
      </div>
      <div className="developer-balance-build-lines">
        <span><strong>Equipment</strong> {buildSummary.equipment.map((entry) => `${entry.slot}: ${entry.name}`).join(' · ')}</span>
        <span><strong>Schools</strong> {RESONANCE_TYPES.map((school) => `${school.toUpperCase()} ${buildSummary.schoolLevels[school]}`).join(' · ')}</span>
        <span><strong>Spells</strong> {buildSummary.equippedSpells.join(' · ') || 'None'}</span>
        <span><strong>Artifacts</strong> {buildSummary.artifacts.join(' · ') || 'None'}</span>
        <span><strong>Sigils</strong> {buildSummary.sigils.join(' · ') || 'None'}</span>
        <span><strong>Crystals</strong> {buildSummary.crystals.join(' · ') || 'None'}</span>
      </div>
    </Card>

    <Card title="Benchmark setup">
      <div className="developer-balance-controls">
        <SummaryTooltip title="Benchmark location" description="Targeted zones measure selected normal targets or an isolated boss. Sequence dungeons simulate the complete authored run."><div className="developer-balance-field"><span>LOCATION</span><SelectMenu<CombatLocationId> ariaLabel="Benchmark location" value={benchmarkLocationId} onChange={(next) => { setBenchmarkLocationId(next); setTargetScope('all'); setBossCycleTarget(getCombatFarmingBenchmarkTargets(next)[0] ?? 'forest-wisp') }} options={BENCHMARK_LOCATIONS.map((location) => ({ value: location.id, label: location.name }))} /></div></SummaryTooltip>
        <SummaryTooltip title="Benchmark duration" description="Simulated combat time per target and World Tier. Custom runs are capped at 60 minutes."><div className="developer-balance-field"><span>DURATION</span><SelectMenu ariaLabel="Benchmark duration" value={durationPreset} onChange={setDurationPreset} options={[...COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })), { value: 'custom' as const, label: 'CUSTOM' }]} /></div></SummaryTooltip>
        {durationPreset === 'custom' && <label className="developer-balance-field">CUSTOM MINUTES<SearchInput ariaLabel="Custom benchmark minutes" type="number" step={1} value={String(customMinutes)} onChange={(value) => setCustomMinutes(Math.max(1, Math.min(60, Number(value) || 1)))} /></label>}
        <SummaryTooltip title="World Tier scope" description="All tiers run on a cloned analysis state, including tiers the live profile has not unlocked."><div className="developer-balance-field"><span>WORLD TIER</span><div className="developer-balance-segmented">{(['all', ...WORLD_TIER_IDS] as const).map((scope) => <Button key={String(scope)} variant={tierScope === scope ? 'primary' : 'secondary'} ariaPressed={tierScope === scope} onClick={() => setTierScope(scope)}>{scope === 'all' ? 'ALL WT' : `WT${scope}`}</Button>)}</div></div></SummaryTooltip>
        <SummaryTooltip title="Target scope" description={`Targets use the authored order for ${benchmarkLocation?.name ?? 'this zone'}, with its boss added as a separate TTK measurement.`}><div className="developer-balance-field"><span>TARGETS</span><SelectMenu<TargetScope> ariaLabel="Benchmark target scope" value={targetScope} onChange={setTargetScope} options={[{ value: 'all', label: 'ALL TARGETS IN LOCATION' }, ...benchmarkTargets.map((targetEnemyId) => ({ value: targetEnemyId, label: `${MONSTERS[targetEnemyId]?.name ?? targetEnemyId}${isBossMonster(MONSTERS[targetEnemyId]) ? ' · BOSS TTK' : ' ONLY'}` }))]} /></div></SummaryTooltip>
      </div>
      <p className="muted">{benchmarkMode === 'dungeon-run' ? 'DUNGEON RUN: the canonical sequence is simulated once from its first authored encounter through its boss.' : 'TARGET FARM: normal targets repeat as a measured farm. Boss targets are isolated TTK measurements.'}</p>
      {benchmarkMode === 'target-farm' && benchmarkBossId && <div className="developer-balance-controls"><Button variant={bossCycleEnabled ? 'primary' : 'secondary'} ariaPressed={bossCycleEnabled} onClick={() => setBossCycleEnabled((value) => !value)}>BOSS CYCLE</Button>{bossCycleEnabled && <><label className="developer-balance-field"><span>NORMAL TARGET</span><SelectMenu<MonsterId> ariaLabel="Boss cycle normal target" value={bossCycleTarget} onChange={setBossCycleTarget} options={getCombatFarmingBenchmarkTargets(benchmarkLocationId).map((id) => ({ value: id, label: MONSTERS[id]?.name ?? id }))} /></label><label className="developer-balance-field"><span>CYCLES</span><SearchInput ariaLabel="Boss cycle count" type="number" step={1} value={String(bossCycleCount)} onChange={(value) => setBossCycleCount(Math.max(1, Math.min(20, Number(value) || 1)))} /></label></>}</div>}
      <div className="developer-balance-actions"><Button onClick={runBenchmark} disabled={!canRun || running} tooltip={benchmarkMode === 'dungeon-run' ? 'Simulate the full authored Dungeon sequence through its boss.' : 'Run the combat simulation for selected targets and tiers in a cloned GameState.'}>RUN {benchmarkMode === 'dungeon-run' ? 'DUNGEON RUN' : 'BENCHMARK'}</Button><Button variant="danger" onClick={cancelBenchmark} disabled={!running} tooltip="Stop after the current simulation job and keep completed rows visible.">CANCEL</Button><span className="developer-balance-progress-label">{running ? `Running ${progress.completed} / ${progress.total}` : progress.total > 0 ? `${progress.completed} / ${progress.total} COMPLETE` : 'READY'}</span></div>
      {progress.total > 0 && <Progress value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} label="Matrix progress" right={`${progress.completed} / ${progress.total}`} running={running} />}
    </Card>

    <Card title={benchmarkMode === 'dungeon-run' ? 'Full Dungeon Run' : bossCycleEnabled ? 'Targeted Boss Cycle' : 'Target Farm Results'} action={<div className="developer-balance-copy-actions"><Button variant="secondary" onClick={() => void copy('Balance table', buildTableText(results))} disabled={results.length === 0}>COPY TABLE</Button><Button variant="secondary" onClick={() => void copy('Balance JSON', exportPayload)} disabled={results.length === 0 && !dungeonRunResult && !bossCycleResult}>COPY JSON</Button></div>}>
      {dungeonRunResult && <div className="developer-summary-grid"><Summary label="Run" value={dungeonRunResult.completed ? 'COMPLETE' : dungeonRunResult.failureReason ?? 'INCOMPLETE'} /><Summary label="Runs / hour" value={formatDecimal(dungeonRunResult.runsPerHour)} /><Summary label="Sequence" value={`${dungeonRunResult.kills} / ${dungeonRunResult.sequence.length} encounters`} /><Summary label="Deaths / failures" value={`${dungeonRunResult.deaths} / ${dungeonRunResult.failures}`} /><Summary label="Run time" value={formatDuration(dungeonRunResult.simulatedDurationMs)} /><Summary label="WT" value={`WT${dungeonRunResult.worldTier}`} /><Summary label="Resonance / hour" value={formatNumber(RESONANCE_TYPES.reduce((sum, type) => sum + dungeonRunResult.resonancePerHour[type], 0))} /><Summary label="Essence / hour" value={`${formatNumber(dungeonRunResult.lifeEssencePerHour)} / ${formatNumber(dungeonRunResult.artifactEssencePerHour)}`} /><Summary label="Sigils / caches / AP per hour" value={`${formatNumber(dungeonRunResult.sigilsPerHour)} / ${formatNumber(dungeonRunResult.crystalCachesPerHour)} / ${formatNumber(dungeonRunResult.arcanePointsPerHour)}`} /><Summary label="End HP / Mana" value={`${formatNumber(dungeonRunResult.endingHealth)} / ${formatNumber(dungeonRunResult.endingMana)}`} /><Summary label="Guardian damage / active" value={`${formatNumber(dungeonRunResult.guardianDamage)} / ${formatDuration(dungeonRunResult.guardianActiveTimeMs)}`} /><Summary label="Guardian mana/sec / suppressed" value={`${formatDecimal(dungeonRunResult.guardianManaPerSecond)} / ${formatDuration(dungeonRunResult.guardianSuppressedTimeMs)}`} /><Summary label="Ward state" value={`${dungeonRunResult.wardCountAtEnd} active`} /></div>}
      {bossCycleResult && <div className="developer-summary-grid"><Summary label="Cycles" value={`${bossCycleResult.cyclesCompleted} / ${bossCycleResult.cyclesRequested}`} /><Summary label="Normal kills before boss" value={formatDecimal(bossCycleResult.averageNormalKillsBeforeBoss)} /><Summary label="Average cycle time" value={formatDuration(bossCycleResult.averageBossCycleTimeMs)} /><Summary label="Bosses / hour" value={formatDecimal(bossCycleResult.bossesPerHour)} /><Summary label="Boss TTK" value={formatDuration(bossCycleResult.bossTtkMs)} /><Summary label="Total cycle time" value={formatDuration(bossCycleResult.cycleTimeMs)} /><Summary label="Resonance / hour" value={formatNumber(RESONANCE_TYPES.reduce((sum, type) => sum + bossCycleResult.resonancePerHour[type], 0))} /><Summary label="Life / Artifact Essence per hour" value={`${formatNumber(bossCycleResult.lifeEssencePerHour)} / ${formatNumber(bossCycleResult.artifactEssencePerHour)}`} /><Summary label="Sigils / Caches / AP per hour" value={`${formatNumber(bossCycleResult.sigilDropsPerHour)} / ${formatNumber(bossCycleResult.expectedCrystalCachesPerHour)} / ${formatNumber(bossCycleResult.arcanePointsPerHour)}`} /><Summary label="Damage taken / survival" value={`${formatNumber(bossCycleResult.damageTaken)} / ${bossCycleResult.survived ? 'SURVIVED' : 'DEFEATED'}`} /></div>}
      {benchmarkMode !== 'dungeon-run' && <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['TARGET', 'DIFFICULTY', 'WT', 'SURVIVAL', 'AVG KILL / TTK', 'KILLS/H', 'FIRE/H', 'WATER/H', 'EARTH/H', 'AIR/H'].map((label) => <th key={label}>{label}</th>)}<th><SummaryTooltip title="Total Resonance per hour" description="Fire + Water + Earth + Air per simulated hour. No elemental weighting is applied."><span>TOTAL RES/H</span></SummaryTooltip></th><th>LIFE ESSENCE/H</th><th>ARTIFACT ESSENCE/H</th><th>SIGILS/H</th><th>EXPECTED CACHES/H</th><th>ARCANE POINTS/H</th><th>END HP</th><th>END MANA</th><th>INCOMING DPS</th></tr></thead><tbody>{results.map((result) => { const farm = result.mode === 'target-farm'; return <tr key={`${result.targetEnemyId}-${result.worldTier}`}><th scope="row">{MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId}</th><td><Status tone={farm ? 'neutral' : 'warning'}>{farm ? difficultyLabel(result.difficulty) : 'ISOLATED BOSS TTK'}</Status></td><td><strong>WT{result.worldTier}</strong></td><td><span className={result.survived ? 'developer-balance-positive' : 'developer-balance-warning'}>{resultStatus(result)}</span></td><td>{formatDuration(result.averageKillTimeMs)}</td><td>{farm ? formatNumber(result.killsPerHour) : '—'}</td><td>{farm ? formatNumber(result.resonancePerHour.fire) : '—'}</td><td>{farm ? formatNumber(result.resonancePerHour.water) : '—'}</td><td>{farm ? formatNumber(result.resonancePerHour.earth) : '—'}</td><td>{farm ? formatNumber(result.resonancePerHour.air) : '—'}</td><td><strong>{farm ? formatNumber(result.totalResonancePerHour) : '—'}</strong></td><td>{farm ? formatNumber(result.lifeEssencePerHour) : '—'}</td><td>{farm ? formatNumber(result.artifactEssencePerHour) : '—'}</td><td>{farm ? formatNumber(result.sigilDropsPerHour) : '—'}</td><td>{farm ? formatNumber(result.expectedCrystalCachesPerHour) : '—'}</td><td>{farm ? formatNumber(result.arcanePointsPerHour) : '—'}</td><td>{formatNumber(result.endingHealth)}</td><td>{formatNumber(result.endingMana)}</td><td>{formatDecimal(result.damageTakenPerSecond)}</td></tr>})}{results.length === 0 && <tr><td colSpan={19} className="muted developer-balance-empty">No benchmark rows yet. Run a matrix to measure the current build.</td></tr>}</tbody></table></div>}
    </Card>

    <Card title="WT1 baseline comparison across all tiers">
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>TARGET</th><th>METRIC</th><th>WT1 BASELINE</th>{WORLD_TIER_IDS.filter((tier) => tier !== 1).map((tier) => <th key={tier}>WT{tier} / WT1</th>)}</tr></thead><tbody>{comparisons.flatMap((comparison) => {
        const metrics: Array<[string, (result: CombatFarmingBenchmarkResult) => number]> = [['Total Resonance/h', (r) => r.totalResonancePerHour], ['Life Essence/h', (r) => r.lifeEssencePerHour], ['Artifact Essence/h', (r) => r.artifactEssencePerHour], ['Sigils/h', (r) => r.sigilDropsPerHour], ['Expected Crystal Caches/h', (r) => r.expectedCrystalCachesPerHour], ['Arcane Points/h', (r) => r.arcanePointsPerHour], ['Kills/h', (r) => r.killsPerHour]]
        return metrics.map(([label, read]) => <tr key={`${comparison.targetEnemyId}-${label}`}><th scope="row">{MONSTERS[comparison.targetEnemyId]?.name ?? comparison.targetEnemyId}</th><td>{label}</td><td>{comparison.baseline ? formatNumber(read(comparison.baseline)) : '—'}</td>{WORLD_TIER_IDS.filter((tier) => tier !== 1).map((tier) => { const tierResult = comparison.tiers.find((entry) => entry.tier === tier)?.result; const baselineValue = comparison.baseline ? read(comparison.baseline) : 0; return <td key={tier}>{tierResult && comparison.baseline && baselineValue > 0 ? `${(read(tierResult) / baselineValue).toFixed(2)}×` : '—'}</td>})}</tr>)
      })}{comparisons.length === 0 && <tr><td colSpan={7} className="muted">Run the same target at WT1 and higher tiers to compare its rates.</td></tr>}</tbody></table></div>
    </Card>

    <Card title="Guardian contribution">
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>TARGET</th><th>WT</th><th>SPELL DAMAGE</th><th>GUARDIAN DAMAGE</th><th>DOT DAMAGE</th><th>OTHER PLAYER DAMAGE</th><th>GUARDIAN / MIN</th><th>GUARDIAN SHARE</th><th>GUARDIAN MANA / SEC</th><th>SUPPRESSED TIME</th></tr></thead><tbody>{results.map((result) => <tr key={`guardian-${result.targetEnemyId}-${result.worldTier}`}><th scope="row">{MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId}</th><td>WT{result.worldTier}</td><td>{formatNumber(result.spellDamage)}</td><td>{formatNumber(result.guardianDamage)}</td><td>{formatNumber(result.dotDamage)}</td><td>{formatNumber(result.otherPlayerDamage)}</td><td>{formatNumber(result.guardianDamagePerMinute)}</td><td>{(result.guardianDamageShare * 100).toFixed(1)}%</td><td>{formatDecimal(result.guardianManaPerSecond)}</td><td>{formatDuration(result.guardianSuppressedTimeMs)}</td></tr>)}{results.length === 0 && <tr><td colSpan={10} className="muted">Guardian contribution appears with target benchmark results.</td></tr>}</tbody></table></div>
    </Card>

    <Card title="Neutral observations">
      {observations.length > 0 ? <ul className="developer-balance-observations">{observations.map((observation, index) => <li key={`${observation}-${index}`}>{observation}</li>)}</ul> : <p className="muted">No derived observations yet. This panel reports measurements only; it never changes balance values.</p>}
    </Card>
  </div>
}
