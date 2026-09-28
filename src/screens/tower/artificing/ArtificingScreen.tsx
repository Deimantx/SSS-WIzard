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
import { Button } from '../../../components/ui'
import { SigilsWorkspace } from './sigils/SigilsWorkspace'

export function ArtificingScreen() {
  const mode = useUiPreferences().screenState.artificing.mode
  const navigationIntent = useNavigationIntent()
  useEffect(() => {
    if (navigationIntent.artificingSigilInstanceId) {
      setUiPreferences({ screenState: { artificing: { mode: 'sigils', sigilTab: navigationIntent.artificingSigilTab ?? 'refinement' } } })
    }
  }, [navigationIntent.artificingSigilInstanceId, navigationIntent.artificingSigilTab])
  return <TowerFrame
    className={'artificing-screen ' + (mode === 'sigils' ? 'sigils-screen' : '')}
    eyebrow="WIZARD TOWER · ARTIFICING"
    title={mode === 'sigils' ? 'Arcane Sigil Workshop' : 'Artifact Forge'}
    description={mode === 'sigils' ? 'Forge, refine, and attune combat-born Sigils.' : 'Craft permanent equipment foundations.'}
  >
    <div className="artificing-mode-switch" role="tablist" aria-label="Artificing category">
      <Button type="button" variant="ghost" role="tab" aria-selected={mode === 'artifacts'} ariaPressed={mode === 'artifacts'} className={mode === 'artifacts' ? 'active' : ''} onClick={() => setUiPreferences({ screenState: { artificing: { mode: 'artifacts' } } })}>ARTIFACTS</Button>
      <Button type="button" variant="ghost" role="tab" aria-selected={mode === 'sigils'} ariaPressed={mode === 'sigils'} className={mode === 'sigils' ? 'active' : ''} onClick={() => setUiPreferences({ screenState: { artificing: { mode: 'sigils' } } })}>SIGILS</Button>
    </div>
    {mode === 'sigils' ? <>
      <Button variant="secondary" className="sigils-open-equipment" type="button" onClick={() => { setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: null, equipmentSigilSlot: null }); useGameStore.getState().setScreen('equipment') }}>OPEN SIGIL EQUIPMENT</Button>
      <SigilsWorkspace />
    </> : <ArtifactsWorkspace />}
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
