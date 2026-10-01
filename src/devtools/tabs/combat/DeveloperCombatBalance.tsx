import { useMemo, useRef, useState } from 'react'
import { Button, Card, GameTooltip, Progress, SearchInput, SelectMenu, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { isBossMonster, MONSTERS } from '../../../game/content/monsters'
import { DUNGEONS } from '../../../game/content/dungeons/dungeons'
import { RESONANCE_TYPES } from '../../../game/content/resonance/resonance'
import {
  buildCombatFarmingBenchmarkBuildSummary,
  COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS,
  COMBAT_BALANCE_BENCHMARK_VERSION,
  getCombatFarmingBenchmarkTargets,
  normalizeCombatFarmingBenchmarkDuration,
  runCombatFarmingBenchmarkMatrix,
  type CombatFarmingBenchmarkBuildSummary,
  type CombatFarmingBenchmarkResult,
} from '../../../game/analysis/combat/combatFarmingBenchmark'
import { COMBAT_LOCATIONS, type CombatLocationId } from '../../../game/content/world-navigation'
import type { MonsterId, WorldTierId } from '../../../game/types'
import { buildThreatKillsToBossAudit } from '../../../game/analysis/combat/combatPowerAudit'
import { buildCombatV2Act1GlobalAudit, buildCombatV2ContentAudit, buildCombatV2MonsterWorldTierComparison, COMBAT_V2_AUDIT_MONSTER_IDS, COMBAT_V2_AUDIT_REGIONS, type CombatV2AuditRegionId } from '../../../game/systems/combat/combatContentAudit'
import { WORLD_TIER_IDS } from '../../../game/content/world-tier/worldTiers'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'
import type { DeveloperCopy } from '../DeveloperCombat'
import { Summary } from '../DeveloperTabPrimitives'

const BENCHMARK_LOCATIONS = Object.values(COMBAT_LOCATIONS).filter((location) => location.dungeonId && getCombatFarmingBenchmarkTargets(location.id).length > 0)
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
  const header = ['Target', 'Difficulty', 'WT', 'Survival', 'Avg Kill', 'Kills/h', 'Fire/h', 'Water/h', 'Earth/h', 'Air/h', 'Total Res/h', 'Life Essence/h', 'Artifact Essence/h', 'Sigils/h', 'Crystal Caches/h', 'Arcane Points/h', 'End HP', 'End Mana', 'Incoming DPS']
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
    formatNumber(result.lifeEssencePerHour),
    formatNumber(result.artifactEssencePerHour),
    formatNumber(result.sigilDropsPerHour),
    formatNumber(result.expectedCrystalCachesPerHour),
    formatNumber(result.arcanePointsPerHour),
    formatNumber(result.endingHealth),
    formatNumber(result.endingMana),
    formatDecimal(result.damageTakenPerSecond),
  ])
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
  const [tierScope, setTierScope] = useState<TierScope>('both')
  const [targetScope, setTargetScope] = useState<TargetScope>('all')
  const [results, setResults] = useState<CombatFarmingBenchmarkResult[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [running, setRunning] = useState(false)
  const [buildSummary, setBuildSummary] = useState<CombatFarmingBenchmarkBuildSummary>(() => buildCombatFarmingBenchmarkBuildSummary(useGameStore.getState()))
  const [auditWorldTier, setAuditWorldTier] = useState<WorldTierId>(1)
  const benchmarkTargets = useMemo(() => getCombatFarmingBenchmarkTargets(benchmarkLocationId, true), [benchmarkLocationId])
  const benchmarkLocation = COMBAT_LOCATIONS[benchmarkLocationId]
  const benchmarkBossId = benchmarkLocation?.dungeonId ? DUNGEONS[benchmarkLocation.dungeonId]?.boss : null
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
    worldTiers.forEach((worldTier) => {
      const boss = results.find((result) => result.worldTier === worldTier && result.targetEnemyId === benchmarkBossId && result.valid)
      const normalTimes = results.filter((result) => result.worldTier === worldTier && result.targetEnemyId !== benchmarkBossId && result.valid && result.averageKillTimeMs !== null).map((result) => result.averageKillTimeMs as number)
      if (!boss?.averageKillTimeMs || normalTimes.length === 0) return
      const ratio = boss.averageKillTimeMs / Math.max(...normalTimes)
      if (ratio < 1.5 || ratio > 5) notes.push(`${benchmarkLocation?.name ?? 'Location'} WT${worldTier}: boss / strongest-normal TTK is ${ratio.toFixed(2)}×; review this outlier.`)
    })
    return notes
  }, [benchmarkBossId, benchmarkLocation?.name, results, worldTiers])
  const comparisons = useMemo(() => benchmarkTargets.map((targetEnemyId) => {
    const wt1 = results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === 1)
    const wt2 = results.find((result) => result.targetEnemyId === targetEnemyId && result.worldTier === 2)
    if (!wt1 || !wt2) return { targetEnemyId, wt1, wt2, ratio: null }
    return { targetEnemyId, wt1, wt2, ratio: wt1.totalResonancePerHour > 0 ? wt2.totalResonancePerHour / wt1.totalResonancePerHour : null }
  }), [benchmarkTargets, results])

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
    void runCombatFarmingBenchmarkMatrix({ sourceState, locationId: benchmarkLocationId, targetEnemyIds: targetIds, worldTiers, durationMs }, {
      isCancelled: () => cancelRequested.current,
      onProgress: setProgress,
      onResult: (result) => setResults((current) => [...current, result]),
    }).finally(() => {
      if (runId.current === currentRunId) setRunning(false)
    })
  }

  const cancelBenchmark = () => { cancelRequested.current = true }
  const exportPayload = buildExportPayload(benchmarkLocationId, buildSummary, durationMs, targetIds, worldTiers, results)
  const contentAudit = useMemo(() => buildCombatV2ContentAudit(auditWorldTier), [auditWorldTier])
  const visibleAuditRows = useMemo(() => {
    const query = auditSearch.trim().toLowerCase()
    return contentAudit.filter((row) => (auditRegion === 'all' || row.region === auditRegion)
      && (!auditWarningsOnly || row.warnings.length > 0)
      && (!query || `${row.id} ${row.name} ${row.location}`.toLowerCase().includes(query)))
  }, [auditRegion, auditSearch, auditWarningsOnly, contentAudit])
  const powerComparison = useMemo(() => buildCombatV2MonsterWorldTierComparison(comparisonMonsterId), [comparisonMonsterId])
  const threatAudit = useMemo(() => buildThreatKillsToBossAudit(), [])
  const globalAudit = useMemo(() => buildCombatV2Act1GlobalAudit(auditWorldTier), [auditWorldTier])

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
      <p className="muted">Targeted boss zones use canonical enemy Power for kill Threat and the authored World Tier requirement multiplier. Median is the middle target in authored progression order.</p>
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
        <SummaryTooltip title="Benchmark location" description="Select a targeted zone. Each target is measured with canonical combat simulation against the cloned build."><div className="developer-balance-field"><span>LOCATION</span><SelectMenu<CombatLocationId> ariaLabel="Benchmark location" value={benchmarkLocationId} onChange={(next) => { setBenchmarkLocationId(next); setTargetScope('all') }} options={BENCHMARK_LOCATIONS.map((location) => ({ value: location.id, label: location.name }))} /></div></SummaryTooltip>
        <SummaryTooltip title="Benchmark duration" description="Simulated combat time per target and World Tier. Custom runs are capped at 60 minutes."><div className="developer-balance-field"><span>DURATION</span><SelectMenu ariaLabel="Benchmark duration" value={durationPreset} onChange={setDurationPreset} options={[...COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })), { value: 'custom' as const, label: 'CUSTOM' }]} /></div></SummaryTooltip>
        {durationPreset === 'custom' && <label className="developer-balance-field">CUSTOM MINUTES<SearchInput ariaLabel="Custom benchmark minutes" type="number" step={1} value={String(customMinutes)} onChange={(value) => setCustomMinutes(Math.max(1, Math.min(60, Number(value) || 1)))} /></label>}
        <SummaryTooltip title="World Tier scope" description="WT2 is simulated in the clone even when the live profile has not unlocked it. The live profile is never changed."><div className="developer-balance-field"><span>WORLD TIER</span><div className="developer-balance-segmented">{(['both', 1, 2] as const).map((scope) => <Button key={String(scope)} variant={tierScope === scope ? 'primary' : 'secondary'} ariaPressed={tierScope === scope} onClick={() => setTierScope(scope)}>{scope === 'both' ? 'WT1 + WT2' : `WT${scope}`}</Button>)}</div></div></SummaryTooltip>
        <SummaryTooltip title="Target scope" description={`Targets use the authored order for ${benchmarkLocation?.name ?? 'this zone'}, with its boss added as a separate TTK measurement.`}><div className="developer-balance-field"><span>TARGETS</span><SelectMenu<TargetScope> ariaLabel="Benchmark target scope" value={targetScope} onChange={setTargetScope} options={[{ value: 'all', label: 'ALL TARGETS IN LOCATION' }, ...benchmarkTargets.map((targetEnemyId) => ({ value: targetEnemyId, label: `${MONSTERS[targetEnemyId]?.name ?? targetEnemyId}${isBossMonster(MONSTERS[targetEnemyId]) ? ' · BOSS TTK' : ' ONLY'}` }))]} /></div></SummaryTooltip>
      </div>
      <div className="developer-balance-actions"><Button onClick={runBenchmark} disabled={!canRun || running} tooltip="Run the real combat simulation for each selected target and tier in a cloned GameState.">RUN BENCHMARK</Button><Button variant="danger" onClick={cancelBenchmark} disabled={!running} tooltip="Stop after the current simulation job and keep completed rows visible.">CANCEL</Button><span className="developer-balance-progress-label">{running ? `Running ${progress.completed} / ${progress.total}` : progress.total > 0 ? `${progress.completed} / ${progress.total} COMPLETE` : 'READY'}</span></div>
      {progress.total > 0 && <Progress value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} label="Matrix progress" right={`${progress.completed} / ${progress.total}`} running={running} />}
    </Card>

    <Card title="Results" action={<div className="developer-balance-copy-actions"><Button variant="secondary" onClick={() => void copy('Balance table', buildTableText(results))} disabled={results.length === 0}>COPY TABLE</Button><Button variant="secondary" onClick={() => void copy('Balance JSON', exportPayload)} disabled={results.length === 0}>COPY JSON</Button></div>}>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['TARGET', 'DIFFICULTY', 'WT', 'SURVIVAL', 'AVG KILL', 'KILLS/H', 'FIRE/H', 'WATER/H', 'EARTH/H', 'AIR/H'].map((label) => <th key={label}>{label}</th>)}<th><SummaryTooltip title="Total Resonance per hour" description="Fire + Water + Earth + Air per simulated hour. No elemental weighting is applied."><span>TOTAL RES/H</span></SummaryTooltip></th><th>LIFE ESSENCE/H</th><th>ARTIFACT ESSENCE/H</th><th>SIGILS/H</th><th>EXPECTED CACHES/H</th><th>ARCANE POINTS/H</th><th>END HP</th><th>END MANA</th><th>INCOMING DPS</th></tr></thead><tbody>{results.map((result) => <tr key={`${result.targetEnemyId}-${result.worldTier}`}><th scope="row">{MONSTERS[result.targetEnemyId]?.name ?? result.targetEnemyId}</th><td><Status tone="neutral">{difficultyLabel(result.difficulty)}</Status></td><td><strong>WT{result.worldTier}</strong></td><td><span className={result.survived ? 'developer-balance-positive' : 'developer-balance-warning'}>{resultStatus(result)}</span>{resultFlags(result) && <small>{resultFlags(result)}</small>}</td><td>{formatDuration(result.averageKillTimeMs)}</td><td>{formatNumber(result.killsPerHour)}</td><td>{formatNumber(result.resonancePerHour.fire)}</td><td>{formatNumber(result.resonancePerHour.water)}</td><td>{formatNumber(result.resonancePerHour.earth)}</td><td>{formatNumber(result.resonancePerHour.air)}</td><td><strong>{formatNumber(result.totalResonancePerHour)}</strong></td><td>{formatNumber(result.lifeEssencePerHour)}</td><td>{formatNumber(result.artifactEssencePerHour)}</td><td>{formatNumber(result.sigilDropsPerHour)}</td><td>{formatNumber(result.expectedCrystalCachesPerHour)}</td><td>{formatNumber(result.arcanePointsPerHour)}</td><td>{formatNumber(result.endingHealth)}</td><td>{formatNumber(result.endingMana)}</td><td>{formatDecimal(result.damageTakenPerSecond)}</td></tr>)}{results.length === 0 && <tr><td colSpan={19} className="muted developer-balance-empty">No benchmark rows yet. Run a matrix to measure the current build.</td></tr>}</tbody></table></div>
    </Card>

    <Card title="WT1 ↔ WT2 comparison">
      <div className="developer-balance-comparison-grid">{comparisons.filter((comparison) => comparison.wt1 || comparison.wt2).map((comparison) => <div className="developer-balance-comparison" key={comparison.targetEnemyId}><strong>{MONSTERS[comparison.targetEnemyId]?.name ?? comparison.targetEnemyId}</strong><span>WT1 {comparison.wt1 ? `${formatNumber(comparison.wt1.totalResonancePerHour)} / h` : '—'}</span><span>WT2 {comparison.wt2 ? `${formatNumber(comparison.wt2.totalResonancePerHour)} / h` : '—'}</span><em>WT2 / WT1: {comparison.ratio === null ? '—' : `${comparison.ratio.toFixed(2)}×`}</em></div>)}{results.length === 0 && <p className="muted">Same-target deltas appear after both tiers finish.</p>}</div>
    </Card>

    <Card title="Neutral observations">
      {observations.length > 0 ? <ul className="developer-balance-observations">{observations.map((observation, index) => <li key={`${observation}-${index}`}>{observation}</li>)}</ul> : <p className="muted">No derived observations yet. This panel reports measurements only; it never changes balance values.</p>}
    </Card>
  </div>
}
