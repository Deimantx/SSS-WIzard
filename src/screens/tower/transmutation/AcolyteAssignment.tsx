import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Card, Progress } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { ITEMS } from '../../../game/content/items/items'
import { canAssignTransmutationAcolyte, getRecipeCurrentEffectiveDuration, getRecipeCurrentOutputPerHour, getRecipeFluxDemandPerSecond, getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationAcolyteCapacity, getTransmutationAcolytesAssigned, getTransmutationJob } from '../../../game/systems/transmutation/transmutationSelectors'
import type { GameState, TransmutationRecipeId } from '../../../game/types'
import { formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { didTransmutationCycleWrap, getTransmutationCompletionSound } from '../../../ui/game-feel/craftCompletion'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'

export function AcolyteAssignment({ selectedRecipeId, onSelect }: { selectedRecipeId: TransmutationRecipeId; onSelect: (recipeId: TransmutationRecipeId) => void }) {
  const state = useGameStore()
  const add = useGameStore((current) => current.assignTransmutationAcolyte)
  const remove = useGameStore((current) => current.removeTransmutationAcolyte)
  const clear = useGameStore((current) => current.clearTransmutationAcolytes)
  const recipe = RECIPES[selectedRecipeId]
  const job = getTransmutationJob(state, selectedRecipeId)
  const selectedAcolytes = job?.acolyteAssigned ? 1 : 0
  const totalAcolytes = getTransmutationAcolytesAssigned(state)
  const capacity = getTransmutationAcolyteCapacity(state)
  const status = getRecipeStatus(state, recipe)
  const locked = status === 'locked'
  const canAdd = !locked && canAssignTransmutationAcolyte(state)
  const addReason = locked ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : totalAcolytes >= capacity ? `Acolyte capacity reached: ${capacity} / ${capacity}.` : 'No free Acolytes. Unassign a worker from another Tower job.'
  const pipCount = Math.min(10, Math.max(0, capacity))
  const selectedCycle = getRecipeCurrentEffectiveDuration(recipe, selectedAcolytes, state)
  const selectedOutput = getRecipeCurrentOutputPerHour(recipe, selectedAcolytes, state)
  const selectedFlux = getRecipeFluxDemandPerSecond(recipe, selectedAcolytes, state)
  return <Card className="transmutation-acolytes" title="ACOLYTE ASSIGNMENT"><div className="transmutation-acolyte-body smart-scroll-region"><div className="transmutation-acolyte-pool"><div className="transmutation-acolyte-pool-heading"><strong>ACOLYTES {totalAcolytes} / {capacity}</strong><span>Shared Tower workforce</span></div><div className="transmutation-acolyte-pips" aria-label={`${totalAcolytes} of ${capacity} Transmutation Acolytes assigned`}>{Array.from({ length: pipCount }, (_, index) => <i className={index < totalAcolytes ? 'filled' : ''} key={index} />)}</div></div><div className={`transmutation-acolyte-selected ${locked ? 'locked' : ''}`}><div className="transmutation-acolyte-selected-name"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><div><span className="eyebrow">SELECTED</span><strong>{recipe.name} <small className={`transmutation-acolyte-selected-status ${status}`}>{statusLabel(status)}</small></strong>{locked ? <small className="transmutation-acolyte-locked-note">{addReason}</small> : selectedAcolytes > 0 ? <small className="transmutation-acolyte-selected-metrics">ACOLYTE · {formatTime(selectedCycle ?? recipe.baseDurationMs)} · {formatOutputRate(selectedOutput)} · {formatFluxDemand(selectedFlux)}</small> : <small className="transmutation-acolyte-selected-metrics">NO ACOLYTE · Assign an Acolyte to begin production.</small>}</div></div>{!locked && <div className="transmutation-acolyte-control"><Button variant="ghost" ariaLabel={`Remove Acolyte from ${recipe.name}`} tooltip="Remove the Acolyte. Progress is preserved." onClick={() => remove(selectedRecipeId)} disabled={selectedAcolytes <= 0}><Minus size={13} aria-hidden="true" /></Button><strong>{selectedAcolytes}</strong><Button variant="secondary" ariaLabel={`Assign Acolyte to ${recipe.name}`} tooltip={canAdd ? <TooltipContent title="Assign Acolyte" description="Acolytes are shared across Channeling, Research, and Transmutation." /> : <TooltipContent title="Cannot assign Acolyte" description={addReason} />} onClick={() => add(selectedRecipeId)} disabled={!canAdd}><Plus size={13} aria-hidden="true" /></Button></div>}</div><div className="transmutation-active-heading"><span className="eyebrow">ACTIVE ASSIGNMENTS</span>{totalAcolytes > 0 && <Button variant="ghost" onClick={clear} tooltip="Release all Transmutation Acolytes. Partial recipe progress is preserved.">CLEAR ALL</Button>}</div>{totalAcolytes === 0 ? <div className="transmutation-empty-assignments"><strong>NO ACOLYTES ASSIGNED</strong><span>Select a recipe and assign an Acolyte to begin production.</span></div> : <div className="transmutation-assignment-list">{RECIPE_ORDER.map((recipeId) => <AssignmentRow key={recipeId} recipeId={recipeId} state={state} selected={recipeId === selectedRecipeId} onSelect={onSelect} onAdd={add} onRemove={remove} />)}</div>}</div></Card>
}

function AssignmentRow({ recipeId, state, selected, onSelect, onAdd, onRemove }: { recipeId: TransmutationRecipeId; state: GameState; selected: boolean; onSelect: (recipeId: TransmutationRecipeId) => void; onAdd: (recipeId: TransmutationRecipeId) => void; onRemove: (recipeId: TransmutationRecipeId) => void }) {
  const recipe = RECIPES[recipeId]
  const job = getTransmutationJob(state, recipeId)
  const acolytes = job?.acolyteAssigned ? 1 : 0
  const status = getRecipeStatus(state, recipe)
  const rowRef = useRef<HTMLDivElement>(null)
  const previousProgress = useRef<number | null>(null)
  const [completionPulseKey, setCompletionPulseKey] = useState<number | null>(null)
  const progress = Math.max(0, job?.progressMs ?? 0)
  useEffect(() => {
    const previous = previousProgress.current
    previousProgress.current = progress
    const running = status === 'active' || status === 'flux-limited' || status === 'waiting-flux' || status === 'waiting-materials'
    if (!didTransmutationCycleWrap({ previousProgress: previous, currentProgress: progress, durationMs: recipe.baseDurationMs, acolytes, running })) return
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return
    const item = ITEMS[recipe.output.itemId]
    const pulseKey = Date.now()
    setCompletionPulseKey(pulseKey)
    window.setTimeout(() => setCompletionPulseKey(null), 300)
    emitGameFeelEvent({ type: 'craft-complete', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color: item.color, intensity: 0.9, sound: item.kind === 'equipment' ? 'craft' : false })
    void getTransmutationCompletionSound(item.kind)
  }, [acolytes, progress, recipe, status])
  if (!acolytes) return null
  const canAdd = status !== 'locked' && canAssignTransmutationAcolyte(state)
  const outputPerHour = getRecipeCurrentOutputPerHour(recipe, acolytes, state)
  const fluxDemand = getRecipeFluxDemandPerSecond(recipe, acolytes, state)
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(recipeId) } }
  return <div ref={rowRef} role="button" tabIndex={0} className={`transmutation-assignment-row ${selected ? 'selected' : ''} ${completionPulseKey !== null ? 'craft-complete' : ''}`} onClick={() => onSelect(recipeId)} onKeyDown={handleKeyDown} aria-label={`Select ${recipe.name}, ${acolytes} Acolyte assigned`}><ItemIcon itemId={recipe.output.itemId} size="tiny" /><span className="transmutation-assignment-copy"><strong>{recipe.name}</strong><small>{acolytes} ACOLYTE · {statusLabel(status)}</small><small className="transmutation-assignment-metrics">{formatOutputRate(outputPerHour)} · {formatFluxDemand(fluxDemand)}</small><Progress value={getRecipeProgressPercent(recipe, progress)} tone="gold" running={status === 'active' || status === 'flux-limited'} completionPulseKey={completionPulseKey ?? undefined} /></span><span className="transmutation-assignment-owned">OWNED {formatOwned(state.inventory[recipe.output.itemId] ?? 0)}</span><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Remove Acolyte from ${recipe.name}`} tooltip="Remove the Acolyte. Progress is preserved." onClick={() => onRemove(recipeId)}><Minus size={12} aria-hidden="true" /></Button></span><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Add Acolyte to ${recipe.name}`} tooltip="Assign an Acolyte if workforce capacity allows." onClick={() => onAdd(recipeId)} disabled={!canAdd}><Plus size={12} aria-hidden="true" /></Button></span></div>
}

const formatOwned = (value: number) => Math.max(0, Math.floor(value)).toLocaleString()
const formatOutputRate = (value: number) => `${value >= 10 ? Math.round(value).toLocaleString() : value.toFixed(1).replace(/\.0$/, '')} / hr`
const formatFluxDemand = (value: number) => `${value >= 10 ? value.toFixed(1).replace(/\.0$/, '') : value < 0.01 ? value.toFixed(3) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} Flux/s`
function statusLabel(status: ReturnType<typeof getRecipeStatus>) { return status.replace('-', ' ').toUpperCase() }
