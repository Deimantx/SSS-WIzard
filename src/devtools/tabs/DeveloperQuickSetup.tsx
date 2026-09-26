import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { getMonsterDungeon } from '../../game/content/contentRelations'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../game/content/monsters'
import { RECIPES, RECIPE_ORDER, isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import { formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { getArtificingCatalogRecipeState } from '../../game/systems/artificing/artificingSelectors'
import { getRecipeStatus } from '../../game/systems/transmutation/transmutationSelectors'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getAllSpellsInOrder } from '../../game/systems/spells'
import { OFFLINE_BANK_PRESETS, toOfflineDurationMs, type OfflineBankUnit } from '../../game/systems/offline-bank/offlineBankDuration'
import type { ArtificingRecipeId, ItemId, MonsterId, RecipeId, SchoolId, TutorialStage } from '../../game/types'
import { formatOfflineBank } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { DEVELOPER_LOADOUTS, type DeveloperEquipmentLoadout } from '../developerLoadouts'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { PROFILE_RESET_CONFIRMATION } from '../developerProfileReset'
import { getQuickTestingResourceGrants, QUICK_TESTING_RESOURCE_TARGETS } from '../developerQuickTesting'

const defaultRecipe = RECIPE_ORDER.find((id) => RECIPES[id].ingredients.length > 0) ?? RECIPE_ORDER[0]
const tutorialStages: readonly { id: TutorialStage; label: string }[] = [
  { id: 'choose-school', label: 'Choose School' },
  { id: 'combat', label: 'Combat' },
  { id: 'first-kill', label: 'First Kill' },
  { id: 'tower-work', label: 'Tower Work' },
  { id: 'channeling', label: 'Channeling' },
  { id: 'transmutation', label: 'Transmutation' },
  { id: 'research', label: 'Research' },
  { id: 'complete', label: 'Complete' },
]

const loadoutItemCounts = (loadout: DeveloperEquipmentLoadout) => Object.values(loadout.slots).reduce<Record<string, number>>((counts, itemId) => {
  if (itemId) counts[itemId] = (counts[itemId] ?? 0) + 1
  return counts
}, {})

export function DeveloperQuickSetup() {
  const state = useGameStore()
  const profileSession = useProfileSession()
  const hasActiveProfile = Boolean(profileSession.activeProfileId)
  const [enemyQuery, setEnemyQuery] = useState('')
  const [selectedEnemy, setSelectedEnemy] = useState<MonsterId | null>(MONSTER_IDS[0] ?? null)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeId>(defaultRecipe)
  const [recipeFeedback, setRecipeFeedback] = useState('')
  const [offlineAmount, setOfflineAmount] = useState('1')
  const [offlineUnit, setOfflineUnit] = useState<OfflineBankUnit>('hours')
  const [offlineBankFeedback, setOfflineBankFeedback] = useState<{ text: string; tone: 'success' | 'warning' } | null>(null)
  const enemyOptions = useMemo(() => MONSTER_IDS.filter((id) => {
    const monster = MONSTERS[id]
    const dungeon = getMonsterDungeon(id)
    return `${monster.name} ${dungeon?.dungeonName ?? ''} ${dungeon?.role ?? ''} ${id}`.toLowerCase().includes(enemyQuery.trim().toLowerCase())
  }), [enemyQuery])
  useEffect(() => {
    setSelectedEnemy((current) => current !== null && enemyOptions.includes(current) ? current : enemyOptions[0] ?? null)
  }, [enemyOptions])
  const selectedDungeon = selectedEnemy ? getMonsterDungeon(selectedEnemy) : undefined
  const selectedRecipeDefinition = RECIPES[selectedRecipe]
  const recipeCategory = 'category' in selectedRecipeDefinition ? selectedRecipeDefinition.category : 'artificing'
  const recipeStatus = 'category' in selectedRecipeDefinition
    ? getRecipeStatus(state, selectedRecipeDefinition)
    : getArtificingCatalogRecipeState(state, selectedRecipe as ArtificingRecipeId)?.status ?? 'LOCKED'

  const loadLoadout = (loadout: DeveloperEquipmentLoadout) => {
    Object.keys(state.equipment).forEach((position) => state.unequipItem(position as keyof typeof state.equipment))
    Object.entries(loadoutItemCounts(loadout)).forEach(([itemId, count]) => {
      const typedItemId = itemId as ItemId
      const missing = Math.max(0, count - (useGameStore.getState().inventory[typedItemId] ?? 0))
      if (missing > 0) state.addItem(typedItemId, missing)
    })
    Object.entries(loadout.slots).forEach(([position, itemId]) => { if (itemId) state.equipItem(itemId, position as keyof typeof state.equipment) })
  }
  const restoreHealth = () => state.setPlayer({ health: state.player.maxHealth })
  const restoreMana = () => state.setPlayer({ mana: state.player.maxMana })
  const [quickTestingFeedback, setQuickTestingFeedback] = useState('')
  const prepareQuickTesting = () => {
    const grants = getQuickTestingResourceGrants(useGameStore.getState().inventory)
    grants.forEach(([itemId, amount]) => state.addItem(itemId, amount))
    setQuickTestingFeedback(grants.length > 0 ? 'Allowlisted testing resources prepared at 10,000 each.' : 'Allowlisted testing resources already meet the 10,000 target.')
  }
  const grantMissingRecipeIngredients = () => {
    if (isTransmutationRecipeId(selectedRecipe)) state.grantTransmutationIngredients(selectedRecipe)
    else state.grantArtificingIngredients(selectedRecipe)
    setRecipeFeedback(`Missing ingredients granted for: ${selectedRecipeDefinition.name}`)
  }
  const unlockRankOneSpells = () => getAllSpellsInOrder().forEach((spell) => state.debugUnlockSpellRankOne(spell.id))
  const resetCurrentProfile = () => { if (window.confirm(PROFILE_RESET_CONFIRMATION)) state.resetSave() }
  const addOfflinePreset = (amount: number, unit: OfflineBankUnit, label: string) => {
    state.debugAddOfflineBank(toOfflineDurationMs(amount, unit))
    setOfflineBankFeedback({ text: `${label} added.`, tone: 'success' })
  }
  const applyOfflineCustom = (mode: 'add' | 'set') => {
    const amount = offlineAmount.trim() === '' ? Number.NaN : Number(offlineAmount)
    const invalid = !Number.isFinite(amount) || amount < 0
    const durationMs = toOfflineDurationMs(amount, offlineUnit)
    if (mode === 'add') state.debugAddOfflineBank(durationMs)
    else state.debugSetOfflineBank(durationMs)
    setOfflineBankFeedback({ text: invalid ? `Invalid amount safely normalized. Offline Bank ${mode === 'add' ? 'unchanged' : 'set to 0'}.` : `Offline Bank ${mode === 'add' ? 'updated' : 'set'}.`, tone: invalid ? 'warning' : 'success' })
  }
  const clearOfflineBank = () => {
    state.debugClearOfflineBank()
    setOfflineBankFeedback({ text: 'Offline Bank cleared.', tone: 'success' })
  }

  return <div className="developer-tab-stack">
    <Card title="Quick Setup" className="developer-quick-setup">
      <p className="muted">Use focused tester actions against the current profile. Gameplay state changes stay explicit and canonical.</p>
      <div className="developer-quick-grid">
        <section className="developer-quick-testing"><h3>QUICK TESTING READY</h3><p className="muted">Ensures only these resources reach at least 10,000. It does not change story, progression, equipment, spells, or Black Portal Shards.</p><div className="developer-owned-list">{Object.entries(QUICK_TESTING_RESOURCE_TARGETS).map(([itemId, target]) => <span key={itemId}>{formatReadableId(itemId)}<strong>≥ {target.toLocaleString()}</strong></span>)}</div><Button variant="primary" onClick={prepareQuickTesting}>QUICK TESTING READY</Button>{quickTestingFeedback && <Status tone="success">{quickTestingFeedback}</Status>}</section>
        <section><h3>Player</h3><div className="button-row"><Button onClick={restoreHealth}>Full Health</Button><Button onClick={restoreMana}>Full Mana</Button><Button variant="secondary" onClick={state.clearPlayerStatuses}>Clear Player Statuses</Button><Button variant="secondary" onClick={state.clearPlayerBarrier}>Clear Player Barrier</Button><Button variant={state.debug.playerImmortal ? 'success' : 'secondary'} onClick={() => state.setDebugPlayerImmortal(!state.debug.playerImmortal)}>God Mode: {state.debug.playerImmortal ? 'ON' : 'OFF'}</Button></div></section>
        <section><h3>Fresh Start / Reset</h3><p className="muted">Reset the persisted gameplay state for the currently selected profile. UI appearance and custom layouts are preserved.</p><Button variant="danger" disabled={!hasActiveProfile} onClick={resetCurrentProfile}>Reset Current Profile Progress</Button></section>
        <section><h3>Tutorial controls</h3><p className="muted">Exercise the authored onboarding path without changing save migrations.</p><div className="button-row"><Button variant="danger" onClick={state.resetTutorialForDebug}>Reset Tutorial</Button><Button variant="secondary" onClick={state.skipTutorialForDebug}>Skip Tutorial</Button></div><div className="button-row">{(['fire', 'water', 'earth', 'air'] as SchoolId[]).map((schoolId) => <Button key={schoolId} variant={state.progress.startingSchoolId === schoolId ? 'success' : 'ghost'} onClick={() => state.debugChooseStartingSchool(schoolId)}>Choose {SCHOOLS[schoolId].name}</Button>)}</div><label>Tutorial stage<select aria-label="Developer tutorial stage" value={state.progress.tutorialStage} onChange={(event) => state.setTutorialStageForDebug(event.target.value as TutorialStage)}>{tutorialStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label><div className="button-row"><Button variant="secondary" onClick={() => state.setTutorialStageForDebug('tower-work')}>Re-run Tower Work Unlock</Button><Button variant="ghost" onClick={() => state.grantStarterArtifactForDebug(state.progress.startingSchoolId ?? 'fire')}>Grant Starter Artifact</Button></div><small className="muted">Current: {state.progress.tutorialStage} · Starting school: {state.progress.startingSchoolId ?? 'none'}</small></section>
        <section><h3>Loadouts</h3><p className="muted">Each loadout uses its explicit authored slot map.</p><div className="developer-button-grid">{DEVELOPER_LOADOUTS.map((loadout) => <Button key={loadout.id} variant="secondary" onClick={() => loadLoadout(loadout)}>{loadout.label}</Button>)}</div></section>
        <section><h3>Resources &amp; Magic</h3><label>Recipe<select aria-label="Quick Setup recipe" value={selectedRecipe} onChange={(event) => { setSelectedRecipe(event.target.value as RecipeId); setRecipeFeedback('') }}>{RECIPE_ORDER.map((id) => { const recipe = RECIPES[id]; const category = 'category' in recipe ? recipe.category : 'artificing'; const status = 'category' in recipe ? getRecipeStatus(state, recipe) : getArtificingCatalogRecipeState(state, id as ArtificingRecipeId)?.status ?? 'LOCKED'; return <option value={id} key={id}>{recipe.name} · {formatReadableId(category)} · {formatReadableId(status)}</option> })}</select></label><div className="button-row"><Button variant="secondary" onClick={grantMissingRecipeIngredients} disabled={selectedRecipeDefinition.ingredients.length === 0}>Grant Missing Ingredients</Button><Button variant="secondary" onClick={unlockRankOneSpells}>Unlock Rank-I Spells</Button><Button variant="secondary" onClick={state.resetSpellCooldowns}>Reset Spell Cooldowns</Button><Button variant="ghost" onClick={state.resetDebugOverrides}>Clear Debug Overrides</Button></div><small className="muted">Selected recipe: {selectedRecipeDefinition.name} · {formatReadableId(recipeCategory)} · {formatReadableId(recipeStatus)}</small>{recipeFeedback && <Status tone="success">{recipeFeedback}</Status>}</section>
      </div>
    </Card>

    <Card title="Offline Bank" className="developer-offline-bank">
      <div className="developer-offline-bank-current"><span>Current Offline Bank</span><strong>{formatOfflineBank(state.offlineBankMs)}</strong></div>
      <div className="developer-button-grid">{OFFLINE_BANK_PRESETS.map((preset) => <Button key={preset.label} variant="secondary" uiSound="none" onClick={() => addOfflinePreset(preset.amount, preset.unit, preset.label)}>{preset.label}</Button>)}</div>
      <div className="developer-form-grid developer-offline-bank-form">
        <label>Amount<input type="number" step="any" inputMode="decimal" aria-label="Offline Bank amount" value={offlineAmount} onChange={(event) => setOfflineAmount(event.target.value)} /></label>
        <label>Unit<select aria-label="Offline Bank unit" value={offlineUnit} onChange={(event) => setOfflineUnit(event.target.value as OfflineBankUnit)}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></label>
      </div>
      <div className="button-row developer-offline-bank-actions"><Button variant="primary" uiSound="none" onClick={() => applyOfflineCustom('add')}>ADD</Button><Button variant="secondary" uiSound="none" onClick={() => applyOfflineCustom('set')}>SET</Button><Button variant="ghost" uiSound="none" onClick={clearOfflineBank}>CLEAR</Button></div>
      {offlineBankFeedback && <Status tone={offlineBankFeedback.tone}>{offlineBankFeedback.text}</Status>}
      <small className="muted">Tester-only controls. Values are validated and safely clamped by the store.</small>
    </Card>

    <Card title="Quick Combat" className="developer-quick-combat">
      <div className="developer-form-grid"><label>Search enemies<input aria-label="Search quick combat enemies" value={enemyQuery} onChange={(event) => setEnemyQuery(event.target.value)} placeholder="Enemy, dungeon, normal or boss..." /></label><label>Enemy<select aria-label="Quick combat enemy" value={selectedEnemy ?? ''} disabled={enemyOptions.length === 0} onChange={(event) => setSelectedEnemy(event.target.value as MonsterId)}>{enemyOptions.length === 0 ? <option value="">No matching enemies</option> : enemyOptions.map((id) => { const monster = MONSTERS[id]; const dungeon = getMonsterDungeon(id); return <option value={id} key={id}>{monster.name} · {dungeon?.dungeonName} · {dungeon?.role === 'boss' ? 'Boss' : 'Normal'}</option> })}</select></label></div>
      {selectedEnemy && <div className="developer-quick-selection"><strong>{MONSTERS[selectedEnemy].name}</strong><span>{selectedDungeon?.dungeonName} · {isBossMonster(MONSTERS[selectedEnemy]) ? 'Boss' : 'Normal enemy'}</span></div>}
      {selectedEnemy === null && <Status tone="warning">No matching enemies</Status>}
      <div className="button-row"><Button onClick={() => selectedEnemy && state.spawnDebugEnemy(selectedEnemy, selectedDungeon?.dungeonId)} disabled={selectedEnemy === null}>Spawn Enemy</Button><Button variant="danger" onClick={state.killCurrentEnemy}>Kill Current Enemy</Button><Button variant="secondary" onClick={() => state.setEnemyHealthPercent(10)}>Set HP to 10%</Button><Button variant="secondary" onClick={() => state.setEnemyHealthPercent(50)}>Set HP to 50%</Button><Button variant="ghost" onClick={state.clearEnemyStatuses}>Clear Enemy Statuses</Button><Button variant="secondary" onClick={() => state.jumpDebugToBoss(selectedDungeon?.dungeonId)} disabled={selectedEnemy === null || !selectedDungeon}>Jump to Boss</Button></div>
      {state.combat.enemyId && <Status tone="warning">Active enemy: {MONSTERS[state.combat.enemyId]?.name ?? state.combat.enemyId}</Status>}
    </Card>
    <Card title="Current test context"><div className="developer-summary-grid"><div className="developer-summary"><span>Dungeon</span><strong>{state.combat.dungeonId ? DUNGEONS[state.combat.dungeonId].name : 'No dungeon'}</strong></div><div className="developer-summary"><span>Enemy</span><strong>{state.combat.enemyId ? MONSTERS[state.combat.enemyId]?.name : 'None'}</strong></div><div className="developer-summary"><span>Fire School</span><strong>Level {state.schools.fire.level}</strong></div><div className="developer-summary"><span>Water School</span><strong>{SCHOOLS.water.name} · Level {state.schools.water.level}</strong></div></div></Card>
  </div>
}
