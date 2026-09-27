import { useEffect, useState } from 'react'
import { TowerFrame } from '../TowerFrame'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { ITEMS } from '../../../game/content/items/items'
import { getVisibleArtificingRecipes } from '../../../game/systems/artificing/artificingSelectors'
import type { ArtificingRecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { clearAttention } from '../../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../../profiles/profileSessionStore'
import { ScreenGrid } from '../../../components/layout/ScreenGrid'
import { InspectorTransition } from '../../../ui/game-feel/InspectorTransition'
import { EquipmentCatalog } from './EquipmentCatalog'
import { ArtificingDetail } from './ArtificingDetail'
import { setNavigationIntent, useNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { SigilsWorkspace } from './sigils/SigilsWorkspace'

export function ArtificingScreen() {
  const mode = useUiPreferences().screenState.artificing.mode
  const navigationIntent = useNavigationIntent()
  useEffect(() => { if (mode === 'sigils' && navigationIntent.artificingSigilInstanceId) setNavigationIntent({ artificingSigilInstanceId: null }) }, [mode, navigationIntent.artificingSigilInstanceId])
  return <TowerFrame
    className={`artificing-screen ${mode === 'sigils' ? 'sigils-screen' : ''}`}
    eyebrow="WIZARD TOWER · ARTIFICING"
    title="Arcane Forge"
    description={mode === 'sigils' ? 'Forge Sigils and tune your collection. Equip and manage them in Equipment.' : 'Forge permanent Artifacts, or refine combat-born Sigils.'}
  >
    <div className="artificing-mode-switch">
      <button className={mode === 'artifacts' ? 'active' : ''} onClick={() => setUiPreferences({ screenState: { artificing: { mode: 'artifacts' } } })}>ARTIFACTS</button>
      <button className={mode === 'sigils' ? 'active' : ''} onClick={() => setUiPreferences({ screenState: { artificing: { mode: 'sigils' } } })}>SIGILS</button>
    </div>
    {mode === 'sigils' ? <><button className="sigils-open-equipment" type="button" onClick={() => { setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: null, equipmentSigilSlot: null }); useGameStore.getState().setScreen('equipment') }}>OPEN SIGIL EQUIPMENT</button><SigilsWorkspace initialMode={navigationIntent.artificingSigilInstanceId ? 'storage' : 'forge'} initialSelectedId={navigationIntent.artificingSigilInstanceId} hideModeTabs /></> : <ArtifactsWorkspace />}
  </TowerFrame>
}

function ArtifactsWorkspace() {
  const state = useGameStore()
  const preferences = useUiPreferences().screenState.artificing
  const navigationIntent = useNavigationIntent()
  const intentRecipeId = navigationIntent.artificingRecipeId && Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, navigationIntent.artificingRecipeId) ? navigationIntent.artificingRecipeId : null
  const [query, setQuery] = useState('')
  const visible = getVisibleArtificingRecipes(state, preferences, query)
  const visibleIds = visible.map((entry) => entry.id).join('|')
  const selected = intentRecipeId ?? preferences.selectedRecipeId
  const recipe = selected && ARTIFICING_RECIPES[selected] && (Boolean(intentRecipeId) || visible.some(entry => entry.id === selected)) ? ARTIFICING_RECIPES[selected] : null

  useEffect(() => {
    if (intentRecipeId) {
      setQuery('')
      setUiPreferences({ screenState: { artificing: { selectedRecipeId: intentRecipeId, slotFilter: 'all', kindFilter: 'all', ownershipFilter: 'all' } } })
      setNavigationIntent({ artificingRecipeId: null })
      return
    }
    if (selected && (!Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, selected) || !visibleIds.split('|').includes(selected))) {
      setUiPreferences({ screenState: { artificing: { selectedRecipeId: visible[0]?.id ?? null } } })
    }
  }, [intentRecipeId, selected, visibleIds])

  const select = (id: ArtificingRecipeId) => {
    clearAttention(getActiveProfileId(), 'recipe', id)
    setUiPreferences({ screenState: { artificing: { selectedRecipeId: id } } })
  }
  const panels = [
    { id: 'artificing-catalog', content: <EquipmentCatalog selected={recipe?.id ?? null} onSelect={select} query={query} onQueryChange={setQuery} /> },
    { id: 'artificing-detail', content: <InspectorTransition identity={recipe?.id ?? 'none'} accent={recipe ? ITEMS[recipe.output.itemId].color : undefined}><ArtificingDetail recipe={recipe} /></InspectorTransition> },
  ]
  return <ScreenGrid screen="tower-artificing" panels={panels} />
}
