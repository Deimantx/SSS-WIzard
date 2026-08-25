import { Card, Status } from '../../../components/ui'
import { ITEMS } from '../../../game/data/items'
import { RECIPES } from '../../../game/data/recipes'
import { useGameStore } from '../../../store/gameStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { TransmutationPanel } from '../TransmutationPanel'
import { TowerFrame } from '../TowerFrame'

export function TransmutationScreen() {
  const activity = useGameStore((state) => state.activities.transmutation)
  const recipe = activity.recipeId ? RECIPES[activity.recipeId] : RECIPES['ember-staff']
  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Turn gathered materials into equipment." description="Choose a recipe and let the transmutation chamber work while the rest of the tower remains active."><EditableGrid screen="tower-transmutation" panels={[{ id: 'transmutation-recipes', content: <TransmutationPanel /> }, { id: 'transmutation-detail', content: <Card title="Recipe detail"><div className="recipe-detail-summary"><div className="recipe-item">{ITEMS[recipe.output].icon}</div><div><strong>{recipe.name}</strong><p className="muted">{activity.running ? 'Transmutation is in progress.' : 'Select a recipe in the primary panel to begin.'}</p></div></div><div className="cost-line">{recipe.ingredients.map((ingredient) => <span key={ingredient.itemId}>{ITEMS[ingredient.itemId].name} <strong>{ingredient.quantity}</strong></span>)}</div><Status tone={activity.running ? 'active' : 'neutral'}>{activity.running ? 'Running' : 'Ready'}</Status></Card> }]} /></TowerFrame>
}
