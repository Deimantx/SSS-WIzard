import { useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { createInitialState } from '../../store/initialState'
import { SCHOOLS } from '../../game/content/schools/schools'
import { TRANSMUTATION_RECIPE_ORDER } from '../../game/content/recipes/transmutationRecipes'
import type { SchoolId } from '../../game/types'
import { captureTestSnapshot, discardTestSnapshot, hasTestSnapshot, restoreTestSnapshot } from '../sessionTestSnapshot'
import { OFFLINE_BANK_PRESETS, toOfflineDurationMs, type OfflineBankUnit } from '../../game/systems/offline-bank/offlineBankDuration'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { useShallow } from 'zustand/react/shallow'
import { getDeveloperToolsState, setDeveloperTestSessionActive } from '../developerToolsStore'

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export function DeveloperOfflineBank() {
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const addOfflineBank = useGameStore((state) => state.debugAddOfflineBank)
  const setOfflineBank = useGameStore((state) => state.debugSetOfflineBank)
  const clearOfflineBank = useGameStore((state) => state.debugClearOfflineBank)
  const [amount, setAmount] = useState('1')
  const [unit, setUnit] = useState<OfflineBankUnit>('hours')
  const [feedback, setFeedback] = useState('')
  const apply = (mode: 'add' | 'set') => {
    const duration = toOfflineDurationMs(Number(amount), unit)
    if (mode === 'add') addOfflineBank(duration)
    else setOfflineBank(duration)
    setFeedback(`${mode === 'add' ? 'Added' : 'Set'} ${formatDuration(duration)}.`)
  }
  return <div className="developer-tab-stack">
    <Card title="Offline Bank">
      <p className="muted">Banked time represents a real absence between profile sessions. This fixture changes only the runtime bank.</p>
      <div className="developer-summary-grid"><div className="developer-summary"><span>Current bank</span><strong>{formatDuration(offlineBankMs)}</strong></div><div className="developer-summary"><span>Storage limit</span><strong>Finite</strong></div></div>
      <div className="developer-form-grid"><label>Amount<input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as OfflineBankUnit)}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></label></div>
      <div className="button-row">{OFFLINE_BANK_PRESETS.map((preset) => <Button key={preset.label} variant="ghost" onClick={() => { addOfflineBank(toOfflineDurationMs(preset.amount, preset.unit)); setFeedback(`${preset.label} added.`) }}>{preset.label}</Button>)}<Button onClick={() => apply('add')}>ADD TIME</Button><Button variant="secondary" onClick={() => apply('set')}>SET TIME</Button><Button variant="danger" onClick={() => { clearOfflineBank(); setFeedback('Offline Bank cleared.') }}>CLEAR</Button></div>
      {feedback && <Status tone="success">{feedback}</Status>}
    </Card>
  </div>
}

export function DeveloperScenarios() {
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'warning' } | null>(null)
  const [snapshotReady, setSnapshotReady] = useState(hasTestSnapshot)
  const prepareCombatLoadout = () => {
    let state = useGameStore.getState()
    state.debugUnlockSpellRankOne('fire-bolt')
    state = useGameStore.getState()
    const existing = state.spellPresets.presets.find((preset) => preset.id === 'developer-scenario-loadout')
    const presetId = existing?.id ?? state.createSpellPreset('Scenario Loadout')
    state = useGameStore.getState()
    state.selectSpellPresetForEditing(presetId)
    if (!existing?.slots.some((slot) => slot.spellId === 'fire-bolt')) useGameStore.getState().addSpellToSelectedPreset('fire-bolt')
    useGameStore.getState().selectSpellPreset(presetId)
  }
  const scenarios = [
    { id: 'fresh-start', group: 'Foundation', label: 'Fresh Start', summary: ['Reset runtime game data to a new profile state', 'No normal profile save is written'], run: () => useGameStore.setState(createInitialState()) },
    { id: 'forest-heart', group: 'Combat', label: 'Forest Heart Ready', summary: ['Resolve the authored Whispering Woods threat', 'Prepare the Forest Heart encounter with an unlocked Spell loadout'], run: () => { prepareCombatLoadout(); const state = useGameStore.getState(); state.despawnDebugEnemy(); state.fastResolveDebugEnemies(100, 'whispering-woods'); useGameStore.getState().jumpDebugToBoss('whispering-woods'); return useGameStore.getState().combat.enemyId === 'forest-heart' } },
    { id: 'greatbear', group: 'Combat', label: 'Howling Den / Greatbear Ready', summary: ['Resolve Forest Heart to satisfy the authored Howling Den unlock', 'Clear the Den threat and prepare the Greatbear encounter'], run: () => { prepareCombatLoadout(); let state = useGameStore.getState(); state.despawnDebugEnemy(); state.fastResolveDebugEnemies(100, 'whispering-woods'); useGameStore.getState().jumpDebugToBoss('whispering-woods'); if (useGameStore.getState().combat.enemyId !== 'forest-heart') return false; useGameStore.getState().killCurrentEnemy(); state = useGameStore.getState(); state.fastResolveDebugEnemies(100, 'howling-den'); useGameStore.getState().jumpDebugToBoss('howling-den'); return useGameStore.getState().combat.enemyId === 'corrupted-greatbear' } },
    { id: 'hunter-first', group: 'Hunter’s Order', label: 'Hunter’s Order — First Contract', summary: ['Unlock the Order through its tester action', 'Generate and accept a routine monster contract'], run: () => { let state = useGameStore.getState(); if (state.progress.huntersOrder.activeContract) { state.debugGrantHunterMarks(100); state.skipHunterContract() } state = useGameStore.getState(); state.debugSetHunterRngSeed(341); state.debugSetHuntersOrderUnlocked(true); state.debugRegenerateHunterContractBoard({ archetype: 'monster', tier: 'routine' }); const contract = useGameStore.getState().progress.huntersOrder.availableContracts[0]; return Boolean(contract && useGameStore.getState().acceptHunterContract(contract.id)) } },
    { id: 'gloamridge-contract', group: 'Hunter’s Order', label: 'Gloamridge — Active Contract', summary: ['Prepare a Warden rank and region contract', 'Accept the authored Gloamridge / Hunters Ground target'], run: () => { let state = useGameStore.getState(); if (state.progress.huntersOrder.activeContract) { state.debugGrantHunterMarks(100); state.skipHunterContract() } state = useGameStore.getState(); state.debugSetHunterRank('warden'); state.debugSetHunterRngSeed(912); state.debugRegenerateHunterContractBoard({ archetype: 'region', tier: 'special' }); const contract = useGameStore.getState().progress.huntersOrder.availableContracts[0]; return Boolean(contract?.targetSpec.type === 'region' && contract.targetSpec.dungeonId === 'hunters-ground' && useGameStore.getState().acceptHunterContract(contract.id)) } },
    { id: 'nightglass-apex', group: 'Hunter’s Order', label: 'Nightglass Apex Ready', summary: ['Generate the authored prestigious Nightglass contract', 'Accept it and prepare the Apex threat threshold'], run: () => { let state = useGameStore.getState(); if (state.progress.huntersOrder.activeContract) { state.debugGrantHunterMarks(100); state.skipHunterContract() } state = useGameStore.getState(); if (!state.debugGrantNightglassBossContract()) return false; const contract = useGameStore.getState().progress.huntersOrder.availableContracts.find((entry) => entry.targetSpec.type === 'boss' && entry.targetSpec.monsterId === 'nightglass-alpha'); if (!contract || !useGameStore.getState().acceptHunterContract(contract.id)) return false; useGameStore.getState().debugSetHunterApexThreatReady(); return true } },
    { id: 'guild-early', group: 'Arcane Guild', label: 'Arcane Guild — Early Progression', summary: ['Unlock Arcane Guild through its tester action', 'Generate its accessible commission board'], run: () => { const state = useGameStore.getState(); state.setTutorialStageForDebug('complete'); state.debugSetArcaneGuildUnlocked(true); state.debugRegenerateGuildCommissionBoard() } },
    { id: 'guild-advancement', group: 'Arcane Guild', label: 'Arcane Guild — Advancement Test', summary: ['Prepare Magister rank and Advancement Points', 'Generate a prestigious commission board'], run: () => { const state = useGameStore.getState(); state.setTutorialStageForDebug('complete'); state.debugSetArcaneGuildUnlocked(true); state.debugSetGuildRank('magister'); state.debugGrantGuildPoint(12); state.debugRegenerateGuildCommissionBoard({ quality: 'prestigious' }) } },
    { id: 'research-stress', group: 'Tower Systems', label: 'Research Stress Test', summary: ['Prepare one authored fragment batch for each School', 'Assign available Acolytes through Research actions'], run: () => { const state = useGameStore.getState(); state.clearPreparedResearch(); (Object.keys(SCHOOLS) as SchoolId[]).forEach((school) => { const itemId = SCHOOLS[school].fragment; state.addItem(itemId, 100); state.prepareResearch(itemId, school, 50) }); state.assignOneResearchAcolyteEach() } },
    { id: 'transmutation-stress', group: 'Tower Systems', label: 'Transmutation Stress Test', summary: ['Prepare authored inputs and elemental Resonance', 'Generate Arcane Flux, then assign the Prismatic recipe'], run: () => { const state = useGameStore.getState(); state.clearPreparedResearch(); state.clearTransmutationAssignments(); (['fire', 'water', 'earth', 'air'] as const).forEach((type) => state.debugGrantResonance(type, 10_000)); for (const itemId of ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'life-essence'] as const) state.addItem(itemId, 10_000); state.setDebugArcaneFluxCapacity(100_000); state.setDebugAcolyteTotalOverride(100); state.setDebugIgnoreAcolyteLimit(true); state.setChannelingAcolytesDebug(100); state.tick(60_000); const recipeId = TRANSMUTATION_RECIPE_ORDER.find((id) => id === 'prismatic-fragment'); if (!recipeId) return false; useGameStore.getState().assignMaxTransmutationAcolytes(recipeId) } },
  ] as const
  const run = (scenario: typeof scenarios[number]) => {
    try {
      if (!getDeveloperToolsState().testSessionActive) {
        if (!hasTestSnapshot()) captureTestSnapshot()
        setSnapshotReady(hasTestSnapshot())
        setDeveloperTestSessionActive(true)
      }
      const result = scenario.run()
      if (result === false) setFeedback({ text: `${scenario.label}: the authored action could not prepare this state from the current profile.`, tone: 'warning' })
      else setFeedback({ text: `${scenario.label} prepared through existing game actions.`, tone: 'success' })
    } catch (error) {
      setFeedback({ text: `${scenario.label} failed: ${error instanceof Error ? error.message : 'Unknown scenario error'}`, tone: 'warning' })
    }
  }
  return <div className="developer-tab-stack developer-scenario-lab">
    <Card title="Developer Scenario Lab"><div className="developer-scenario-intro"><div>{getDeveloperToolsState().testSessionActive ? <Status tone="warning">DEV TEST SESSION · AUTOSAVE PAUSED</Status> : <Status tone="active">REAL GAME ACTIONS</Status>}<p className="muted">Prepare focused test states with authored content and existing store/system actions. Each scenario automatically captures a session snapshot and pauses profile saves. Restore the snapshot to end the test session.</p></div><div className="developer-snapshot-actions"><Button variant="secondary" tooltip="Stores the current game data in memory for this browser session only." disabled={getDeveloperToolsState().testSessionActive} onClick={() => { captureTestSnapshot(); setSnapshotReady(true); setFeedback({ text: 'Test snapshot captured in session memory.', tone: 'success' }) }}>Capture test snapshot</Button><Button variant="primary" tooltip="Restores the in-memory snapshot, recalculates derived resources, and resumes profile saving." disabled={!snapshotReady} onClick={() => { const restored = restoreTestSnapshot(); if (restored) setDeveloperTestSessionActive(false); setSnapshotReady(hasTestSnapshot()); setFeedback({ text: restored ? 'Test snapshot restored. Developer Test Session ended and profile saving resumed.' : 'No session snapshot is available.', tone: restored ? 'success' : 'warning' }) }}>Restore snapshot &amp; end test session</Button><Button variant="ghost" tooltip="Discards the in-memory snapshot. This is disabled during a Developer Test Session." disabled={!snapshotReady || getDeveloperToolsState().testSessionActive} onClick={() => { discardTestSnapshot(); setSnapshotReady(false); setFeedback({ text: 'Test snapshot discarded.', tone: 'success' }) }}>Discard snapshot</Button></div></div>{feedback && <Status tone={feedback.tone}>{feedback.text}</Status>}</Card>
    {[...new Set(scenarios.map(({ group }) => group))].map((group) => <Card key={group} title={group}><div className="developer-scenario-grid">{scenarios.filter((scenario) => scenario.group === group).map((scenario) => <article className="developer-scenario-card" key={scenario.id}><div><span className="eyebrow">SESSION FIXTURE</span><h3>{scenario.label}</h3><ul>{scenario.summary.map((item) => <li key={item}>{item}</li>)}</ul></div><Button variant="secondary" tooltip={`Run ${scenario.label} through current game actions.`} onClick={() => run(scenario)}>RUN SCENARIO</Button></article>)}</div></Card>)}
  </div>
}

export function DeveloperV4TesterPlaceholder({ title, description, systems }: { title: string; description: string; systems: string[] }) {
  return <div className="developer-tab-stack"><Card title={title}><Status tone="active">V4 TESTER SURFACE</Status><p className="muted">{description}</p><div className="developer-detail-grid">{systems.map((system) => <span key={system}>{system}<strong>Canonical integration target</strong></span>)}</div><p className="muted">This workspace is registered and routed through the V4 shell. Its production read models remain the source of truth while the dedicated mutation controls are migrated.</p></Card></div>
}

export function DeveloperDashboardOverview() {
  const snapshot = useGameStore(useShallow((state) => ({
    health: state.player.health,
    maxHealth: state.player.maxHealth,
    mana: state.player.mana,
    maxMana: state.player.maxMana,
    enemyId: state.combat.enemyId,
    active: state.combat.active,
    worldTier: state.worldTier.current,
    flux: state.tower.resources.arcaneFlux,
    notifications: state.notifications.length,
  })))
  return <div className="developer-tab-stack"><Card title="Session overview"><div className="developer-summary-grid"><div className="developer-summary"><span>Health</span><strong>{formatResourceAmount(snapshot.health)} / {formatResourceAmount(snapshot.maxHealth)}</strong></div><div className="developer-summary"><span>Mana</span><strong>{formatResourceAmount(snapshot.mana)} / {formatResourceAmount(snapshot.maxMana)}</strong></div><div className="developer-summary"><span>Combat</span><strong>{snapshot.active ? 'ACTIVE' : 'IDLE'}</strong></div><div className="developer-summary"><span>World Tier</span><strong>{snapshot.worldTier}</strong></div><div className="developer-summary"><span>Arcane Flux</span><strong>{Math.floor(snapshot.flux)}</strong></div><div className="developer-summary"><span>Active enemy</span><strong>{snapshot.enemyId ?? 'None'}</strong></div></div></Card><Card title="Quick actions"><div className="button-row"><Button onClick={() => { const state = useGameStore.getState(); state.setPlayer({ health: state.player.maxHealth }) }}>HEAL</Button><Button variant="secondary" onClick={() => { const state = useGameStore.getState(); state.setPlayer({ mana: state.player.maxMana }) }}>FILL MANA</Button><Button variant="ghost" onClick={() => useGameStore.getState().resetDebugOverrides()}>CLEAR DEBUG OVERRIDES</Button></div></Card></div>
}

export function DeveloperSettings() {
  return <div className="developer-tab-stack"><Card title="Developer settings"><Status tone="active">SESSION ONLY</Status><p className="muted">Technical identifiers, selection context, and presentation preferences will persist in Developer session storage and never in the gameplay save.</p></Card></div>
}
