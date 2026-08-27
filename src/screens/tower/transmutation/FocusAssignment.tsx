import { Minus, Plus } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { Button, Card, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemQuantity } from '../../../components/ui/item'
import { RECIPES, RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { selectFreeFocus } from '../../../game/engine'
import { getRecipeCurrentEffectiveDuration, getRecipeManaDemandPerSecond, getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationEchoCapacity, getTransmutationEchoFocusCost, getTransmutationEchoesAssigned, getTransmutationFocusReserved, getTransmutationJob, canAssignTransmutationEcho } from '../../../game/systems/transmutation/transmutationSelectors'
import type { GameState, RecipeId } from '../../../game/types'
import { formatNumber, formatSignedRate, formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

export function FocusAssignment({ selectedRecipeId, onSelect }: { selectedRecipeId: RecipeId; onSelect: (recipeId: RecipeId) => void }) {
  const state = useGameStore()
  const add = useGameStore((current) => current.assignTransmutationEcho)
  const remove = useGameStore((current) => current.removeTransmutationEcho)
  const clear = useGameStore((current) => current.clearTransmutationAssignments)
  const recipe = RECIPES[selectedRecipeId]
  const job = getTransmutationJob(state, selectedRecipeId)
  const selectedEchoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const totalEchoes = getTransmutationEchoesAssigned(state)
  const capacity = getTransmutationEchoCapacity(state)
  const status = getRecipeStatus(state, recipe)
  const locked = status === 'locked'
  const canAdd = !locked && canAssignTransmutationEcho(state)
  const addReason = locked ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : totalEchoes >= capacity ? `Transmutation Echo capacity reached: ${capacity} / ${capacity}.` : `Not enough free Focus. Each Transmutation Echo requires ${getTransmutationEchoFocusCost()} Focus.`
  const transmutationFocus = getTransmutationFocusReserved(totalEchoes)
  const freeFocus = selectFreeFocus(state)
  const pipCount = Math.min(10, Math.max(0, capacity))

  return <Card className="transmutation-focus" title="FOCUS ASSIGNMENT" action={<Status tone={totalEchoes ? 'active' : 'neutral'}>{totalEchoes} / {capacity} ECHOES</Status>}>
    <div className="transmutation-focus-pool"><div className="transmutation-focus-pool-heading"><div><span className="eyebrow">ECHO POOL</span><strong>{totalEchoes} / {capacity} assigned</strong></div><div className="transmutation-focus-pool-stats"><span>{formatNumber(transmutationFocus)} Focus reserved</span><span>{formatNumber(freeFocus)} Focus free</span></div></div><div className="transmutation-echo-pips" aria-label={`${totalEchoes} of ${capacity} Transmutation Echoes assigned`}>{Array.from({ length: pipCount }, (_, index) => <i className={index < totalEchoes ? 'filled' : ''} key={index} />)}</div></div>
    <div className={`transmutation-focus-selected ${locked ? 'locked' : ''}`}>
      <div className="transmutation-focus-selected-name"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><div><strong>{recipe.name}</strong><small>{statusLabel(status)}</small></div></div>
      {!locked && <div className="transmutation-echo-control"><Button variant="ghost" ariaLabel={`Remove Echo from ${recipe.name}`} tooltip="Remove one Echo. Progress is preserved." onClick={() => remove(selectedRecipeId)} disabled={selectedEchoes <= 0}><Minus size={13} aria-hidden="true" /></Button><strong>{selectedEchoes}</strong><Button variant="secondary" ariaLabel={`Assign Echo to ${recipe.name}`} tooltip={canAdd ? <TooltipContent title="Arcane Echo" description={`Each Echo reserves ${getTransmutationEchoFocusCost()} Focus and adds another 1× base crafting speed.`} /> : <TooltipContent title="Cannot assign Echo" description={addReason ?? 'Cannot assign an Echo.'} />} onClick={() => add(selectedRecipeId)} disabled={!canAdd}><Plus size={13} aria-hidden="true" /></Button></div>}
      {locked ? <GameTooltip block accent="warning" content={<TooltipContent title="Echoes unavailable" description={addReason} />}><div className="transmutation-focus-locked-note">{addReason}</div></GameTooltip> : selectedEchoes > 0 && <div className="transmutation-focus-summary">{getTransmutationFocusReserved(selectedEchoes)} Focus · {selectedEchoes}×</div>}
    </div>
    {!locked && selectedEchoes > 0 && <small className="transmutation-focus-effective-time">Effective cycle {formatTime(getRecipeCurrentEffectiveDuration(recipe, selectedEchoes) ?? recipe.baseDurationMs)} Â· Mana demand {formatSignedRate(-getRecipeManaDemandPerSecond(recipe, selectedEchoes))}/s</small>}
    <div className="transmutation-active-heading"><span className="eyebrow">ACTIVE ASSIGNMENTS</span>{totalEchoes > 0 && <Button variant="ghost" onClick={clear} tooltip="Release all Transmutation Echoes. Partial recipe progress is preserved.">CLEAR ALL</Button>}</div>
    {totalEchoes === 0 ? <div className="transmutation-empty-assignments"><strong>NO ECHOES ASSIGNED</strong><span>Select a recipe and assign an Arcane Echo to begin production.</span></div> : <div className="transmutation-assignment-list">{RECIPE_ORDER.map((recipeId) => <AssignmentRow key={recipeId} recipeId={recipeId} state={state} selected={recipeId === selectedRecipeId} onSelect={onSelect} onAdd={add} onRemove={remove} />)}</div>}
  </Card>
}

function AssignmentRow({ recipeId, state, selected, onSelect, onAdd, onRemove }: { recipeId: RecipeId; state: GameState; selected: boolean; onSelect: (recipeId: RecipeId) => void; onAdd: (recipeId: RecipeId) => void; onRemove: (recipeId: RecipeId) => void }) {
  const recipe = RECIPES[recipeId]
  const job = getTransmutationJob(state, recipeId)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  if (!echoes) return null
  const status = getRecipeStatus(state, recipe)
  const canAdd = status !== 'locked' && canAssignTransmutationEcho(state)
  const addReason = status === 'locked' ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : 'Assign one more Echo if Focus and capacity allow.'
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(recipeId) } }
  return <div role="button" tabIndex={0} className={`transmutation-assignment-row ${selected ? 'selected' : ''}`} onClick={() => onSelect(recipeId)} onKeyDown={handleKeyDown} aria-label={`Select ${recipe.name}, ${echoes} Echoes assigned`}><ItemIcon itemId={recipe.output.itemId} size="tiny" /><span className="transmutation-assignment-copy"><strong>{recipe.name}</strong><small>{echoes}E · {statusLabel(status)}</small><Progress value={getRecipeProgressPercent(recipe, job?.progressMs ?? 0)} tone="gold" /></span><ItemQuantity value={state.inventory[recipe.output.itemId] ?? 0} compact /><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Remove Echo from ${recipe.name}`} tooltip="Remove one Echo. Progress is preserved." onClick={() => onRemove(recipeId)}><Minus size={12} aria-hidden="true" /></Button></span><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Add Echo to ${recipe.name}`} tooltip={canAdd ? addReason : addReason} onClick={() => onAdd(recipeId)} disabled={!canAdd}><Plus size={12} aria-hidden="true" /></Button></span></div>
}

function statusLabel(status: ReturnType<typeof getRecipeStatus>) { return status.replace('-', ' ').toUpperCase() }
