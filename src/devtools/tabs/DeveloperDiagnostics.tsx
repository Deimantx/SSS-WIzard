import { useMemo } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { getPlayerManaCapacityBreakdown, getPlayerManaRegenBreakdown } from '../../game/systems/mana/playerMana'
import { getAcolyteCapacityBreakdown } from '../../game/systems/acolytes/acolyteCapacity'
import { selectFreeAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes/acolyteAssignments'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { RECIPES } from '../../game/content/recipes/recipes'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../game/content/traits/traits'
import { validateGameContent } from '../../game/content/validateGameContent'
import { useGameStore } from '../../store/gameStore'
import { Summary } from './DeveloperTabPrimitives'
import { DeveloperAdvancedSection } from '../components/DeveloperBrowser'
import { getProfileSaveDiagnostics } from '../../persistence/profileSaveManager'
import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { getSpellPower } from '../../game/systems/spells/spellPower'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { COMBAT_PERFORMANCE_TOGGLE_LABELS, getCombatRenderRates, resetCombatPerformanceToggles, setCombatPerformanceToggle, useCombatPerformanceMetrics, useCombatPerformanceToggles, type CombatPerformanceToggleId } from '../../screens/combat/performance/combatPerformanceDiagnostics'

const formatTimestamp = (value: number | null) => value === null ? '—' : new Date(value).toLocaleTimeString()
const formatCandidate = (candidate: ReturnType<typeof getProfileSaveDiagnostics>['primary']) => {
  if (!candidate.present) return 'missing'
  if (!candidate.ok) return `invalid${candidate.error ? ` · ${candidate.error}` : ''}`
  return `V${candidate.saveVersion ?? '?'} · valid · ${formatTimestamp(candidate.savedAt)}`
}
const metricLabel = (value: number | null, suffix = '') => value === null ? '—' : `${value}${suffix}`

export function DeveloperDiagnostics({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  const state = useGameStore()
  const combatPerformance = useCombatPerformanceMetrics()
  const combatPerformanceToggles = useCombatPerformanceToggles()
  const combatRenderRates = useMemo(() => getCombatRenderRates(), [combatPerformance])
  const profileSession = useProfileSession()
  const saveSession = useSaveDiagnosticsStore()
  const activeProfileId = profileSession.activeProfileId
  const saveDiagnostics = activeProfileId ? getProfileSaveDiagnostics(activeProfileId) : null
  const used = selectUsedAcolytes(state)
  const free = selectFreeAcolytes(state)
  const regen = getPlayerManaRegenBreakdown(state)
  const capacity = getPlayerManaCapacityBreakdown(state)
  const acolytes = getAcolyteCapacityBreakdown(state)
  const spellPower = getSpellPower(state)
  const contentValidation = useMemo(() => validateGameContent(), [])
  const debugActive = Object.values(state.debug).some((value) => typeof value === 'boolean' ? value : value > 0)
  const hasInvalidNumber = [state.player.health, state.player.mana, state.player.maxMana, spellPower, regen.total, capacity.total, state.tower.resources.arcaneFlux].some((value) => !Number.isFinite(value))
  const diagnosticReport = saveDiagnostics && saveSession.activeProfileId ? {
    profileId: saveSession.activeProfileId,
    health: saveSession.health,
    currentSaveVersion: state.saveVersion,
    primary: saveDiagnostics.primary,
    backup1: saveDiagnostics.backup1,
    backup2: saveDiagnostics.backup2,
    backup3: saveDiagnostics.backup3,
    recoverySnapshotPresent: saveDiagnostics.recovery.present,
    suspectSnapshotPresent: saveDiagnostics.suspect.present,
    lastSuccessfulSaveAt: saveSession.lastSuccessfulSaveAt,
    lastFailure: saveSession.lastFailure,
    lastRegressionGuardFailure: saveSession.lastRegressionFailure,
  } : null
  return <div className="developer-tab-grid">
    <Card title="Runtime diagnostics"><div className="developer-summary-grid"><Summary label="Save version" value={`v${state.saveVersion}`} /><Summary label="Debug state" value={debugActive ? 'Active' : 'Clean'} /><Summary label="Mana" value={`${formatResourceAmount(state.player.mana)} / ${formatResourceAmount(state.player.maxMana)}`} /><Summary label="Mana regen" value={`+${formatResourceAmount(regen.total)}/s`} /><Summary label="Mana capacity" value={capacity.total} /><Summary label="Acolytes" value={`${used} assigned / ${free} available / ${acolytes.total} total`} /><Summary label="Arcane Flux" value={`${Math.floor(state.tower.resources.arcaneFlux)}`} /><Summary label="Notifications" value={state.notifications.length} /><Summary label="Combat" value={state.combat.enemyId ?? 'None'} /></div><div className="developer-diagnostics"><span>Finite numeric state <b>{hasInvalidNumber ? 'FAILED' : 'OK'}</b></span><span>Serialized debug overrides <b>excluded</b></span><span>Developer regen source <b>+{formatResourceAmount(regen.developer)}/s</b></span><span>Developer capacity source <b>+{capacity.developer}/flat</b></span></div></Card>
    <CombatPerformanceDiagnosticsCard metrics={combatPerformance} toggles={combatPerformanceToggles} renderRates={combatRenderRates} />
    <Card title="Content counts and consistency"><div className="developer-summary-grid"><Summary label="Items" value={Object.keys(ITEMS).length} /><Summary label="Equipment" value={Object.values(ITEMS).filter((item) => item.kind === 'equipment').length} /><Summary label="Materials" value={Object.values(ITEMS).filter((item) => item.kind === 'material').length} /><Summary label="Monsters" value={Object.keys(MONSTERS).length} /><Summary label="Bosses" value={Object.values(MONSTERS).filter(isBossMonster).length} /><Summary label="Spells" value={Object.keys(SPELLS).length} /><Summary label="Statuses" value={Object.keys(STATUS_DEFINITIONS).length} /><Summary label="Traits" value={Object.keys(TRAIT_DEFINITIONS).length} /><Summary label="Recipes" value={Object.keys(RECIPES).length} /><Summary label="Dungeons" value={Object.keys(DUNGEONS).length} /></div><div className="developer-diagnostics"><span>CONTENT VALIDATION <b>{contentValidation.length === 0 ? 'PASS' : `FAILED · ${contentValidation.length} errors`}</b></span>{contentValidation.length > 0 && <span>{contentValidation.join(' · ')}</span>}</div></Card>
    <Card title="Save diagnostics" className="developer-save-diagnostics"><div className="developer-diagnostics developer-save-status"><span>Active profile <b>{activeProfileId ?? 'None selected'}</b></span><span>Save health <b>{saveSession.health.toUpperCase()}</b></span><span>Current version <b>V{state.saveVersion}</b></span><span>Last successful save <b>{formatTimestamp(saveSession.lastSuccessfulSaveAt)}</b></span><span>Primary <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.primary) : '—'}</b></span><span>Backup 1 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup1) : '—'}</b></span><span>Backup 2 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup2) : '—'}</b></span><span>Backup 3 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup3) : '—'}</b></span><span>Recovery snapshot <b>{saveDiagnostics?.recovery.present ? 'present' : 'missing'}</b></span><span>Last save failure <b>{saveSession.lastFailure ?? 'None'}</b></span><span>Regression guard <b>{saveSession.lastRegressionFailure ?? 'No issues'}</b></span></div><div className="button-row"><Button variant="ghost" disabled={!diagnosticReport} onClick={() => diagnosticReport && copy('Save diagnostics', diagnosticReport)}>Copy Save Diagnostics</Button></div></Card>
    <Card title="Safety actions" className="developer-danger-card"><p className="muted">These actions affect only the current debug session unless you explicitly save normal gameplay state.</p><div className="button-row"><Button variant="danger" onClick={() => state.resetDebugOverrides()}>Reset Debug Overrides</Button><Status tone={hasInvalidNumber ? 'warning' : 'success'}>{hasInvalidNumber ? 'INVALID NUMBER DETECTED' : 'No invalid numbers detected'}</Status></div></Card>
    <Card title="Technical reference"><DeveloperAdvancedSection title="Raw current game state"><div className="button-row"><Button variant="ghost" onClick={() => copy('Current game state', state)}>Copy current state snapshot</Button></div><pre className="developer-json">{JSON.stringify(state, null, 2)}</pre></DeveloperAdvancedSection><DeveloperAdvancedSection title="Raw authored content"><pre className="developer-json">{JSON.stringify({ spell: SPELLS['fire-bolt'], monster: MONSTERS['forest-wisp'], status: STATUS_DEFINITIONS.burning }, null, 2)}</pre></DeveloperAdvancedSection></Card>
  </div>
}

function CombatPerformanceDiagnosticsCard({ metrics, toggles, renderRates }: { metrics: ReturnType<typeof useCombatPerformanceMetrics>; toggles: ReturnType<typeof useCombatPerformanceToggles>; renderRates: Record<string, number> }) {
  return <Card title="Combat performance diagnostics"><div className="developer-summary-grid"><Summary label="Current FPS" value={metricLabel(metrics.currentFps)} /><Summary label="1s average" value={metricLabel(metrics.averageFps1s)} /><Summary label="5s average" value={metricLabel(metrics.averageFps5s)} /><Summary label="Worst frame" value={metricLabel(metrics.worstFrameMs, ' ms')} /><Summary label="Approx. 1% low" value={metricLabel(metrics.approxOnePercentLow, ' FPS')} /><Summary label="Frames >16.7ms" value={metrics.framesOver16_7ms} /><Summary label="Frames >20ms" value={metrics.framesOver20ms} /><Summary label="Frames >33ms" value={metrics.framesOver33ms} /><Summary label="Active timelines" value={metrics.activeVisualTimelines} /><Summary label="RAF subscribers" value={metrics.rafSubscribers} /><Summary label="Corrections / 5s" value={metrics.timelineCorrections5s} /><Summary label="Hard resets / 5s" value={metrics.timelineHardResets5s} /><Summary label="Avg drift" value={`${metrics.timelineAverageDriftMs.toFixed(1)} ms`} /><Summary label="Max drift" value={`${metrics.timelineMaxDriftMs.toFixed(1)} ms`} /><Summary label="Backward / 5s" value={metrics.timelineBackwardCorrections5s} /></div><div className="developer-diagnostics"><span>Visual clock subscribers <b>shared RAF</b></span><span>Metrics are DEV-only and transient <b>not saved</b></span></div><div className="developer-check-grid">{(Object.keys(COMBAT_PERFORMANCE_TOGGLE_LABELS) as CombatPerformanceToggleId[]).map((id) => <GameTooltip key={id} content={`Temporarily disable ${COMBAT_PERFORMANCE_TOGGLE_LABELS[id]} to isolate its frame cost.`}><label className="developer-check-row"><input type="checkbox" checked={toggles[id]} onChange={(event) => setCombatPerformanceToggle(id, event.target.checked)} /><span>{COMBAT_PERFORMANCE_TOGGLE_LABELS[id]}</span></label></GameTooltip>)}</div><div className="button-row"><Button variant="ghost" onClick={resetCombatPerformanceToggles}>Reset Combat Isolation Toggles</Button></div><DeveloperAdvancedSection title="Combat component render rates"><div className="developer-diagnostics">{Object.entries(renderRates).map(([name, rate]) => <span key={name}>{name} <b>{rate.toFixed(1)} /s</b></span>)}</div></DeveloperAdvancedSection></Card>
}
