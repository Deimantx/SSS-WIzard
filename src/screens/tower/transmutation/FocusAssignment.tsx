import { Button, Card, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { RECIPES, RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { canAssignTransmutationEcho, getRecipeEffectiveDuration, getRecipeOutputPerHour, getRecipeProgressPercent, getRecipeStatus, getTransmutationEchoCapacity, getTransmutationEchoFocusCost, getTransmutationEchoesAssigned, getTransmutationFocusReserved, getTransmutationSpeedMultiplier } from '../../../game/systems/transmutation/transmutationSelectors'
import { formatNumber, formatTime } from '../../../game/utils'
import type { GameState, RecipeId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

export function FocusAssignment({ selectedRecipeId }: { selectedRecipeId: RecipeId }) {
  const state = useGameStore()
  const add = useGameStore((current) => current.assignTransmutationEcho)
  const remove = useGameStore((current) => current.removeTransmutationEcho)
  const clear = useGameStore((current) => current.clearTransmutationAssignments)
  const recipe = RECIPES[selectedRecipeId]
  const job = state.activities.transmutation.jobs[selectedRecipeId]
  const selectedEchoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const totalEchoes = getTransmutationEchoesAssigned(state)
  const capacity = getTransmutationEchoCapacity(state)
  const transmutationFocus = getTransmutationFocusReserved(totalEchoes)
  const canAdd = canAssignTransmutationEcho(state)
  const addReason = totalEchoes >= capacity ? `Transmutation Echo capacity reached: ${capacity} / ${capacity}. Remove an Echo from another recipe first.` : `Not enough free Focus. Each Transmutation Echo requires ${getTransmutationEchoFocusCost()} Focus.`

  return <Card className="transmutation-focus" title="FOCUS ASSIGNMENT" action={<Status tone={totalEchoes ? 'active' : 'neutral'}>{totalEchoes} / {capacity} ECHOES</Status>}>
    <div className="transmutation-focus-header"><div><span className="eyebrow">ECHOES</span><strong>{totalEchoes} / {capacity}</strong></div><div><span className="eyebrow">FOCUS</span><strong>{formatNumber(transmutationFocus)} RESERVED</strong></div></div>
    <div className="transmutation-focus-selected">
      <div className="transmutation-focus-selected-name"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><strong>{recipe.name.toUpperCase()}</strong></div>
      <div className="transmutation-echo-control"><Button variant="ghost" ariaLabel={`Remove Echo from ${recipe.name}`} tooltip="Remove one Echo. Progress is preserved." onClick={() => remove(selectedRecipeId)} disabled={selectedEchoes <= 0}>-</Button><strong>{selectedEchoes} / {capacity}</strong><Button variant="secondary" ariaLabel={`Assign Echo to ${recipe.name}`} tooltip={canAdd ? <TooltipContent title="Arcane Echo" description={`Each Echo reserves ${getTransmutationEchoFocusCost()} Focus and adds another 1x base crafting speed.`} /> : <TooltipContent title="Cannot assign Echo" description={addReason} />} onClick={() => add(selectedRecipeId)} disabled={!canAdd}>+</Button></div>
      <div className="transmutation-focus-stats"><span>{selectedEchoes} Echo{selectedEchoes === 1 ? '' : 'es'}</span><span>{getTransmutationFocusReserved(selectedEchoes)} Focus</span><span>{getTransmutationSpeedMultiplier(selectedEchoes)}.0x Speed</span><span>{formatTime(getRecipeEffectiveDuration(recipe, selectedEchoes))} / item</span><span>{Math.round(getRecipeOutputPerHour(recipe, selectedEchoes))} / hour</span></div>
    </div>
    <div className="transmutation-active-heading"><span className="eyebrow">ACTIVE ASSIGNMENTS</span>{totalEchoes > 0 && <Button variant="ghost" onClick={clear} tooltip="Release every Transmutation Echo. Partial progress is preserved.">CLEAR ALL</Button>}</div>
    {totalEchoes === 0 ? <div className="transmutation-empty-assignments"><strong>NO ECHOES ASSIGNED</strong><span>Select a recipe and assign an Arcane Echo to begin production.</span></div> : <div className="transmutation-assignment-list">{RECIPE_ORDER.map((recipeId) => <AssignmentRow key={recipeId} recipeId={recipeId} state={state} onAdd={add} onRemove={remove} />)}</div>}
  </Card>
}

function AssignmentRow({ recipeId, state, onAdd, onRemove }: { recipeId: RecipeId; state: GameState; onAdd: (recipeId: RecipeId) => void; onRemove: (recipeId: RecipeId) => void }) {
  const recipe = RECIPES[recipeId]
  const job = state.activities.transmutation.jobs[recipeId]
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  if (!echoes) return null
  const status = getRecipeStatus(state, recipe)
  const canAdd = canAssignTransmutationEcho(state)
  return <div className="transmutation-assignment-row"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><span><strong>{recipe.name}</strong><Progress value={getRecipeProgressPercent(recipe, job?.progressMs ?? 0)} tone="gold" /></span><small>{echoes} Echo{echoes === 1 ? '' : 'es'} - {status.replace('-', ' ')}</small><Button variant="ghost" ariaLabel={`Remove Echo from ${recipe.name}`} tooltip="Remove one Echo. Progress is preserved." onClick={() => onRemove(recipeId)}>-</Button><Button variant="ghost" ariaLabel={`Add Echo to ${recipe.name}`} tooltip="Assign one more Echo if Focus and capacity allow." onClick={() => onAdd(recipeId)} disabled={!canAdd}>+</Button></div>
}
