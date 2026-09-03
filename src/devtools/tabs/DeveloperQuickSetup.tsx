import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { getMonsterDungeon } from '../../game/content/contentRelations'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../game/content/monsters'
import { RECIPES, RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { getRecipeStatus } from '../../game/systems/transmutation/transmutationSelectors'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getAllSpellsInOrder } from '../../game/systems/spells'
import type { MonsterId, RecipeId } from '../../game/types'
import type { DeveloperFixtureId } from '../../store/gameStore'
import { useGameStore } from '../../store/gameStore'
import { DEVELOPER_LOADOUTS, type DeveloperEquipmentLoadout } from '../developerLoadouts'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { PROFILE_RESET_CONFIRMATION } from '../developerProfileReset'

const materialIds = (Object.keys(ITEMS) as Array<keyof typeof ITEMS>).filter((itemId) => ITEMS[itemId].kind === 'material')
const defaultRecipe = RECIPE_ORDER.find((id) => RECIPES[id].ingredients.length > 0) ?? RECIPE_ORDER[0]
const fixtureButtons: readonly { id: DeveloperFixtureId; label: string; description: string }[] = [
  { id: 'fresh', label: 'Fresh Game', description: 'Reset to the clean starting state.' },
  { id: 'whispering-woods-ready', label: 'Whispering Woods Ready', description: 'Woods encounter ready at boss threshold.' },
  { id: 'howling-den-ready', label: 'Howling Ready', description: 'Howling Den unlocked and ready at its threshold.' },
  { id: 'catacombs-ready', label: 'Catacombs Ready', description: 'Abandoned Catacombs unlocked and ready.' },
  { id: 'edrin-ready', label: 'Edrin Ready', description: 'Archmage Edrin Shade is spawned for testing.' },
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

  const applyFixture = (fixture: DeveloperFixtureId) => {
    if (fixture === 'fresh' && !window.confirm('Replace the current gameplay state with a Fresh Game fixture?')) return
    state.applyDeveloperFixture(fixture)
  }
  const loadLoadout = (loadout: DeveloperEquipmentLoadout) => {
    Object.keys(state.equipment).forEach((position) => state.unequipItem(position as keyof typeof state.equipment))
    Object.entries(loadoutItemCounts(loadout)).forEach(([itemId, count]) => {
      const missing = Math.max(0, count - (useGameStore.getState().inventory[itemId as keyof typeof ITEMS] ?? 0))
      if (missing > 0) state.addItem(itemId as keyof typeof ITEMS, missing)
    })
    Object.entries(loadout.slots).forEach(([position, itemId]) => { if (itemId) state.equipItem(itemId, position as keyof typeof state.equipment) })
  }
  const restoreHealth = () => state.setPlayer({ health: state.player.maxHealth })
  const restoreMana = () => state.setPlayer({ mana: state.player.maxMana })
  const grantResources = () => materialIds.forEach((itemId) => state.addItem(itemId, 100))
  const grantMissingRecipeIngredients = () => {
    state.grantTransmutationIngredients(selectedRecipe)
    setRecipeFeedback(`Missing ingredients granted for: ${selectedRecipeDefinition.name}`)
  }
  const unlockRankOneSpells = () => getAllSpellsInOrder().forEach((spell) => state.debugUnlockSpellRankOne(spell.id))
  const resetCurrentProfile = () => { if (window.confirm(PROFILE_RESET_CONFIRMATION)) state.resetSave() }

  return <div className="developer-tab-stack">
    <Card title="Quick Setup" className="developer-quick-setup">
      <p className="muted">Tester fixtures compose the existing game actions and preserve authored dungeon unlock requirements.</p>
      <div className="developer-quick-grid">
        <section><h3>Player</h3><div className="button-row"><Button onClick={restoreHealth}>Full Health</Button><Button onClick={restoreMana}>Full Mana</Button><Button variant="secondary" onClick={state.clearPlayerStatuses}>Clear Player Statuses</Button><Button variant="secondary" onClick={state.clearPlayerBarrier}>Clear Player Barrier</Button><Button variant={state.debug.playerImmortal ? 'success' : 'secondary'} onClick={() => state.setDebugPlayerImmortal(!state.debug.playerImmortal)}>God Mode: {state.debug.playerImmortal ? 'ON' : 'OFF'}</Button></div></section>
        <section><h3>Fixtures</h3><div className="developer-fixture-list">{fixtureButtons.map((fixture) => <div key={fixture.id}><div><strong>{fixture.label}</strong><small>{fixture.description}</small></div><Button variant={fixture.id === 'fresh' ? 'danger' : 'secondary'} onClick={() => applyFixture(fixture.id)}>{fixture.id === 'fresh' ? 'Reset Fresh Game' : `Load ${fixture.label}`}</Button></div>)}</div></section>
        <section><h3>Fresh Start / Reset</h3><p className="muted">Reset the persisted gameplay state for the currently selected profile. UI appearance and custom layouts are preserved.</p><Button variant="danger" disabled={!hasActiveProfile} onClick={resetCurrentProfile}>Reset Current Profile Progress</Button></section>
        <section><h3>Loadouts</h3><p className="muted">Each loadout uses its explicit authored slot map.</p><div className="developer-button-grid">{DEVELOPER_LOADOUTS.map((loadout) => <Button key={loadout.id} variant="secondary" onClick={() => loadLoadout(loadout)}>{loadout.label}</Button>)}</div></section>
        <section><h3>Resources &amp; Magic</h3><label>Recipe<select aria-label="Quick Setup recipe" value={selectedRecipe} onChange={(event) => { setSelectedRecipe(event.target.value as RecipeId); setRecipeFeedback('') }}>{RECIPE_ORDER.map((id) => { const recipe = RECIPES[id]; const recipeStatus = getRecipeStatus(state, recipe); return <option value={id} key={id}>{recipe.name} · {formatReadableId(recipe.category)} · {formatReadableId(recipeStatus)}</option> })}</select></label><div className="button-row"><Button onClick={grantResources}>+100 Relevant Materials</Button><Button variant="secondary" onClick={grantMissingRecipeIngredients} disabled={selectedRecipeDefinition.ingredients.length === 0}>Grant Missing Ingredients</Button><Button variant="secondary" onClick={unlockRankOneSpells}>Unlock Rank-I Spells</Button><Button variant="secondary" onClick={state.resetSpellCooldowns}>Reset Spell Cooldowns</Button><Button variant="ghost" onClick={state.resetDebugOverrides}>Clear Debug Overrides</Button></div><small className="muted">Selected recipe: {selectedRecipeDefinition.name} · {formatReadableId(selectedRecipeDefinition.category)} · {formatReadableId(getRecipeStatus(state, selectedRecipeDefinition))}</small>{recipeFeedback && <Status tone="success">{recipeFeedback}</Status>}</section>
      </div>
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
