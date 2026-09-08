import { Button } from '../../../components/ui'
import { ITEMS } from '../../../game/content/items/items'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { ARTIFACTS } from '../../../game/content/artifacts/artifacts'
import { useGameStore } from '../../../store/gameStore'

export function ActiveArtificingCraft() {
  const activity = useGameStore(state => state.activities.artificing)
  const cancel = useGameStore(state => state.cancelArtificingCraft)
  const job = activity.activeJob ?? (activity.activeRecipeId ? { kind: 'recipe' as const, recipeId: activity.activeRecipeId } : null)
  if (!job) return null
  const recipe = job.kind === 'recipe' ? ARTIFICING_RECIPES[job.recipeId] : null
  const artifactId = job.kind === 'artifact-forge' ? job.artifactId : null
  const artifactName = artifactId ? ITEMS[artifactId].name : null
  const label = job.kind === 'artifact-forge' ? `FORGING ${artifactName} · TIER ${ARTIFACTS[artifactId!]?.tier} ARTIFACT` : `CRAFTING · ${ITEMS[recipe!.output.itemId].name}`
  return <div className="artificing-active-craft">
    <span className="eyebrow">{label}</span>
    <div className="artificing-progress-track"><div className="artificing-progress-fill" style={{ width: `${Math.min(100, activity.progressMs / 5000 * 100)}%` }} /></div>
    <div className="artificing-craft-actions"><small>{(activity.progressMs / 1000).toFixed(1)}s / 5.0s</small><Button variant="ghost" tooltip="Cancel this job and return all committed materials." onClick={cancel}>CANCEL</Button></div>
  </div>
}
