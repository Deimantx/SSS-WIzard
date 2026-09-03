import { useMemo } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { RECIPES } from '../../game/content/recipes/recipes'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../game/content/traits/traits'
import { validateGameContent } from '../../game/content/validateGameContent'
import { useGameStore } from '../../store/gameStore'
import { selectRawFreeFocus, selectUsedFocus } from '../../store/selectors'
import { Summary } from './DeveloperTabPrimitives'
import { DeveloperAdvancedSection } from '../components/DeveloperBrowser'
import { getProfileSaveDiagnostics } from '../../persistence/profileSaveManager'
import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { getSpellPower } from '../../game/systems/spells/spellPower'

const formatTimestamp = (value: number | null) => value === null ? '—' : new Date(value).toLocaleTimeString()
const formatCandidate = (candidate: ReturnType<typeof getProfileSaveDiagnostics>['primary']) => {
  if (!candidate.present) return 'missing'
  if (!candidate.ok) return `invalid${candidate.error ? ` · ${candidate.error}` : ''}`
  return `V${candidate.saveVersion ?? '?'} · valid · ${formatTimestamp(candidate.savedAt)}`
}

export function DeveloperDiagnostics({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  const state = useGameStore()
  const profileSession = useProfileSession()
  const saveSession = useSaveDiagnosticsStore()
  const activeProfileId = profileSession.activeProfileId
  const saveDiagnostics = activeProfileId ? getProfileSaveDiagnostics(activeProfileId) : null
  const used = useGameStore(selectUsedFocus)
  const rawFree = useGameStore(selectRawFreeFocus)
  const regen = getManaRegenBreakdown(state)
  const capacity = getManaCapacityBreakdown(state)
  const spellPower = getSpellPower(state)
  const contentValidation = useMemo(() => validateGameContent(), [])
  const debugActive = Object.values(state.debug).some((value) => typeof value === 'boolean' ? value : value > 0)
  const hasInvalidNumber = [state.player.health, state.player.mana, state.player.maxMana, state.player.maxFocus, spellPower, regen.total, capacity.total].some((value) => !Number.isFinite(value))
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
  return <div className="developer-tab-grid"><Card title="Runtime diagnostics"><div className="developer-summary-grid"><Summary label="Save version" value={`v${state.saveVersion}`} /><Summary label="Debug state" value={debugActive ? 'Active' : 'Clean'} /><Summary label="Mana" value={`${Math.floor(state.player.mana)} / ${state.player.maxMana}`} /><Summary label="Mana regen" value={`+${regen.total}/s`} /><Summary label="Capacity order" value={`${capacity.preAmplification} × ${capacity.astralExpansionMultiplier}`} /><Summary label="Focus" value={`${used} used / ${rawFree} available`} /><Summary label="Notifications" value={state.notifications.length} /><Summary label="Combat" value={state.combat.enemyId ?? 'None'} /></div><div className="developer-diagnostics"><span>Finite numeric state <b>{hasInvalidNumber ? 'FAILED' : 'OK'}</b></span><span>Serialized debug overrides <b>excluded</b></span><span>Developer regen source <b>+{regen.developerBonus}/s</b></span><span>Developer capacity source <b>+{capacity.developerCapacityBonus}</b></span></div></Card><Card title="Content counts and consistency"><div className="developer-summary-grid"><Summary label="Items" value={Object.keys(ITEMS).length} /><Summary label="Equipment" value={Object.values(ITEMS).filter((item) => item.kind === 'equipment').length} /><Summary label="Materials" value={Object.values(ITEMS).filter((item) => item.kind === 'material').length} /><Summary label="Monsters" value={Object.keys(MONSTERS).length} /><Summary label="Bosses" value={Object.values(MONSTERS).filter(isBossMonster).length} /><Summary label="Spells" value={Object.keys(SPELLS).length} /><Summary label="Statuses" value={Object.keys(STATUS_DEFINITIONS).length} /><Summary label="Traits" value={Object.keys(TRAIT_DEFINITIONS).length} /><Summary label="Recipes" value={Object.keys(RECIPES).length} /><Summary label="Dungeons" value={Object.keys(DUNGEONS).length} /></div><div className="developer-diagnostics"><span>CONTENT VALIDATION <b>{contentValidation.length === 0 ? 'PASS' : `FAILED · ${contentValidation.length} errors`}</b></span>{contentValidation.length > 0 && <span>{contentValidation.join(' · ')}</span>}</div></Card><Card title="Save diagnostics" className="developer-save-diagnostics"><div className="developer-diagnostics developer-save-status"><span>Active profile <b>{activeProfileId ?? 'None selected'}</b></span><span>Save health <b>{saveSession.health.toUpperCase()}</b></span><span>Current version <b>V{state.saveVersion}</b></span><span>Last successful save <b>{formatTimestamp(saveSession.lastSuccessfulSaveAt)}</b></span><span>Primary <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.primary) : '—'}</b></span><span>Backup 1 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup1) : '—'}</b></span><span>Backup 2 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup2) : '—'}</b></span><span>Backup 3 <b>{saveDiagnostics ? formatCandidate(saveDiagnostics.backup3) : '—'}</b></span><span>Recovery snapshot <b>{saveDiagnostics?.recovery.present ? 'present' : 'missing'}</b></span><span>Last save failure <b>{saveSession.lastFailure ?? 'None'}</b></span><span>Regression guard <b>{saveSession.lastRegressionFailure ?? 'No issues'}</b></span></div><div className="button-row"><Button variant="ghost" disabled={!diagnosticReport} onClick={() => diagnosticReport && copy('Save diagnostics', diagnosticReport)}>Copy Save Diagnostics</Button></div></Card><Card title="Safety actions" className="developer-danger-card"><p className="muted">These actions affect only the current debug session unless you explicitly save normal gameplay state.</p><div className="button-row"><Button variant="danger" onClick={() => state.resetDebugOverrides()}>Reset Debug Overrides</Button><Status tone={hasInvalidNumber ? 'warning' : 'success'}>{hasInvalidNumber ? 'INVALID NUMBER DETECTED' : 'No invalid numbers detected'}</Status></div></Card><Card title="Technical reference"><DeveloperAdvancedSection title="Raw current game state"><div className="button-row"><Button variant="ghost" onClick={() => copy('Current game state', state)}>Copy current state snapshot</Button></div><pre className="developer-json">{JSON.stringify(state, null, 2)}</pre></DeveloperAdvancedSection><DeveloperAdvancedSection title="Raw authored content"><pre className="developer-json">{JSON.stringify({ spell: SPELLS['fire-bolt'], monster: MONSTERS['forest-wisp'], status: STATUS_DEFINITIONS.burning }, null, 2)}</pre></DeveloperAdvancedSection></Card></div>
}
