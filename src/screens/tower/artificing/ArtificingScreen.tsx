import { Search, Hammer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, GameTooltip, Status } from '../../../components/ui'
import { ItemIcon } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER } from '../../../game/content/recipes/artificingRecipes'
import { isRecipeUnlocked, getRecipeUnlockRequirement } from '../../../game/content/recipes/recipeUnlocks'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { InspectorTransition } from '../../../ui/game-feel/InspectorTransition'
import { TowerFrame } from '../TowerFrame'
import type { ItemId, RecipeId } from '../../../game/types'

const slots = ['all', 'weapon', 'offhand', 'armor', 'helmet', 'cape', 'amulet', 'ring'] as const
export function ArtificingScreen() {
  const state = useGameStore()
  const craft = useGameStore((s) => s.craftArtificingRecipe)
  const preferences = useUiPreferences()
  const [selected, setSelectedState] = useState<RecipeId | null>(preferences.screenState.artificing?.selectedRecipeId as RecipeId | null ?? null)
  const setSelected = (id: RecipeId | null) => { setSelectedState(id); setUiPreferences({ screenState: { artificing: { ...(preferences.screenState.artificing ?? { slotFilter: 'all', weaponHandsFilter: 'all', offhandPresentationFilter: 'all', sourceDungeonFilter: 'all', craftableOnly: false, ownershipFilter: 'all' }), selectedRecipeId: id } } }) }
  const [search, setSearch] = useState('')
  const [slot, setSlot] = useState<(typeof slots)[number]>('all')
  const recipes = useMemo(() => ARTIFICING_RECIPE_ORDER.map((id) => ARTIFICING_RECIPES[id]).filter((recipe) => recipe.name.toLowerCase().includes(search.toLowerCase()) && (slot === 'all' || ITEMS[recipe.output.itemId].equipmentSlot === slot)), [search, slot])
  const recipe = selected ? ARTIFICING_RECIPES[selected as keyof typeof ARTIFICING_RECIPES] : undefined
  const panels = [{ id: 'artificing-catalog', content: <Catalog recipes={recipes} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} slot={slot} setSlot={setSlot} state={state} /> }, { id: 'artificing-detail', content: <InspectorTransition identity={selected ?? 'none'} accent={recipe ? ITEMS[recipe.output.itemId].color : undefined}><ForgeDetail recipe={recipe} state={state} craft={craft} /></InspectorTransition> }]
  if (recipe) panels.push({ id: 'artificing-inspection', content: <EquipmentInspection itemId={recipe.output.itemId} /> })
  return <TowerFrame eyebrow="WIZARD TOWER · ARTIFICING" title="Arcane Forge" description="Forge magical equipment from elemental and dungeon materials. Each craft creates exactly one item."><EditableGrid screen="tower-artificing" panels={panels} /></TowerFrame>
}

function Catalog({ recipes, selected, setSelected, search, setSearch, slot, setSlot, state }: any) { return <Card className="artificing-catalog" title="EQUIPMENT CATALOG"><label className="artificing-search"><Search size={15} /><input aria-label="Search equipment" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment" /></label><div className="artificing-filters">{slots.map((value: string) => <button key={value} type="button" className={slot === value ? 'active' : ''} onClick={() => setSlot(value)}>{value.toUpperCase()}</button>)}</div><div className="artificing-item-grid">{recipes.map((recipe: any) => { const item = ITEMS[recipe.output.itemId as ItemId]; const unlocked = isRecipeUnlocked(state, recipe); return <GameTooltip key={recipe.id} content={`${recipe.name} · ${unlocked ? 'Available to craft' : getRecipeUnlockRequirement(recipe)}`}><button type="button" className={`artificing-item-card ${selected === recipe.id ? 'selected' : ''}`} onClick={() => setSelected(recipe.id)}><ItemIcon itemId={item.id} size="tile" /><span>{recipe.name}</span><small>{state.inventory[item.id] ?? 0} owned</small></button></GameTooltip> })}</div></Card> }
function ForgeDetail({ recipe, state, craft }: any) { if (!recipe) return <Card className="artificing-detail" title="FORGE DETAIL"><div className="artificing-empty"><Hammer size={28} /><strong>SELECT EQUIPMENT</strong><span>Choose a blueprint from the catalog to inspect its requirements.</span></div></Card>; const item = ITEMS[recipe.output.itemId as ItemId]; const unlocked = isRecipeUnlocked(state, recipe); const canCraft = unlocked && recipe.ingredients.every((i: any) => getConsumableQuantity(state, i.itemId as ItemId) >= i.quantity); return <Card className="artificing-detail" title="FORGE DETAIL"><div className="artificing-detail-hero"><ItemIcon itemId={item.id} size="large" /><div><span className="eyebrow">{item.equipmentSlot?.toUpperCase()}</span><h2>{item.name}</h2><span>OWNED ×{state.inventory[item.id] ?? 0}</span></div></div><p>{item.description}</p>{!unlocked && <Status tone="locked">{getRecipeUnlockRequirement(recipe)}</Status>}<div className="artificing-material-list">{recipe.ingredients.map((ingredient: any) => { const owned = getConsumableQuantity(state, ingredient.itemId as ItemId); const ingredientItem = ITEMS[ingredient.itemId as ItemId]; return <GameTooltip key={ingredient.itemId} content={ingredientItem.description}><div className={owned >= ingredient.quantity ? 'complete' : 'missing'}><ItemIcon itemId={ingredient.itemId} size="tiny" /><span>{ingredientItem.name}</span><strong>{owned} / {ingredient.quantity}</strong></div></GameTooltip> })}</div><button type="button" className="button primary artificing-craft-button" disabled={!canCraft} onClick={() => craft(recipe.id)}>CRAFT</button></Card> }
function EquipmentInspection({ itemId }: { itemId: ItemId }) { const item = ITEMS[itemId]; return <Card className="artificing-inspection" title="EQUIPMENT INSPECTION"><div className="artificing-inspection-head"><ItemIcon itemId={itemId} size="tile" /><div><h2>{item.name}</h2><span>{item.equipmentSlot} · {item.weaponHands ? `${item.weaponHands}H weapon` : item.equipmentPresentation ?? ''}</span></div></div><p>{item.description}</p><div className="artificing-stat-grid">{Object.entries(item.stats ?? {}).filter(([key]) => key !== 'resistances').map(([key, value]) => <span key={key}><small>{key.replace(/[A-Z]/g, (m) => ` ${m}`).toUpperCase()}</small><strong>{typeof value === 'number' && value < 1 ? `${Math.round(value * 100)}%` : String(value)}</strong></span>)}</div></Card> }
