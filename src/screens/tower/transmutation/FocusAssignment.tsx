import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Card, Progress } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../../game/content/recipes/recipes'
import { ITEMS } from '../../../game/content/items/items'
import { getRecipeCurrentEffectiveDuration, getRecipeCurrentOutputPerHour, getRecipeFluxDemandPerSecond, getRecipeProgressPercent, getRecipeStatus, getRecipeUnlockReason, getTransmutationEchoCapacity, getTransmutationEchoesAssigned, getTransmutationJob, canAssignTransmutationEcho } from '../../../game/systems/transmutation/transmutationSelectors'
import type { GameState, TransmutationRecipeId } from '../../../game/types'
import { formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { didTransmutationCycleWrap, getTransmutationCompletionSound } from '../../../ui/game-feel/craftCompletion'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'

export function FocusAssignment({ selectedRecipeId, onSelect }: { selectedRecipeId: TransmutationRecipeId; onSelect: (recipeId: TransmutationRecipeId) => void }) {
  const state = useGameStore()
  const add = useGameStore((current) => current.assignTransmutationAcolyte)
  const remove = useGameStore((current) => current.removeTransmutationAcolyte)
  const clear = useGameStore((current) => current.clearTransmutationAcolytes)
  const recipe = RECIPES[selectedRecipeId]
  const job = getTransmutationJob(state, selectedRecipeId)
  const selectedEchoes = (job?.acolyteAssigned ?? ((job?.echoesAssigned ?? 0) > 0)) ? 1 : 0
  const totalEchoes = getTransmutationEchoesAssigned(state)
  const capacity = getTransmutationEchoCapacity(state)
  const status = getRecipeStatus(state, recipe)
  const locked = status === 'locked'
  const canAdd = !locked && canAssignTransmutationEcho(state)
  const addReason = locked ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : totalEchoes >= capacity ? `Acolyte capacity reached: ${capacity} / ${capacity}.` : 'No free Acolytes. Unassign a worker from another Tower job.'
  const pipCount = Math.min(10, Math.max(0, capacity))
  const focusBodyRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(focusBodyRef, { dependencies: [selectedRecipeId, totalEchoes, capacity] })
  const selectedCycle = getRecipeCurrentEffectiveDuration(recipe, selectedEchoes, state)
  const selectedOutput = getRecipeCurrentOutputPerHour(recipe, selectedEchoes, state)
  const selectedFlux = getRecipeFluxDemandPerSecond(recipe, selectedEchoes, state)
  const changeFocus = (action: () => void) => {
    action()
    const anchor = document.querySelector<HTMLElement>('.transmutation-focus-selected, .transmutation-focus-pool')
    const rect = anchor?.getBoundingClientRect()
    emitGameFeelEvent({ type: 'focus', x: rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth * 0.6, y: rect && rect.height > 0 ? rect.top + rect.height / 2 : 150, color: 'var(--ui-secondary)', intensity: 0.9 })
  }
  const addWithFeel = (recipeId: TransmutationRecipeId) => changeFocus(() => add(recipeId))
  const removeWithFeel = (recipeId: TransmutationRecipeId) => changeFocus(() => remove(recipeId))
  const clearWithFeel = () => changeFocus(clear)

  return <Card className="transmutation-focus" title="ACOLYTE ASSIGNMENT">
    <div ref={focusBodyRef} className="transmutation-focus-body smart-scroll-region">
      <div className="transmutation-focus-pool"><div className="transmutation-focus-pool-heading"><strong>ACOLYTES {totalEchoes} / {capacity}</strong><span>Shared Tower workforce</span></div><div className="transmutation-echo-pips" aria-label={`${totalEchoes} of ${capacity} Transmutation Acolytes assigned`}>{Array.from({ length: pipCount }, (_, index) => <i className={index < totalEchoes ? 'filled' : ''} key={index} />)}</div></div>
      <div className={`transmutation-focus-selected ${locked ? 'locked' : ''}`}>
        <div className="transmutation-focus-selected-name"><ItemIcon itemId={recipe.output.itemId} size="tiny" /><div><span className="eyebrow">SELECTED</span><strong>{recipe.name} <small className={`transmutation-focus-selected-status ${status}`}>{statusLabel(status)}</small></strong>{locked ? <small className="transmutation-focus-locked-note">{addReason}</small> : selectedEchoes > 0 ? <small className="transmutation-focus-selected-metrics">ACOLYTE · {formatTime(selectedCycle ?? recipe.baseDurationMs)} · {formatOutputRate(selectedOutput)} · {formatFluxDemand(selectedFlux)}</small> : <small className="transmutation-focus-selected-metrics">NO ACOLYTE · Assign an Acolyte to begin production.</small>}</div></div>
        {!locked && <div className="transmutation-echo-control"><Button variant="ghost" ariaLabel={`Remove Acolyte from ${recipe.name}`} tooltip="Remove the Acolyte. Progress is preserved." onClick={() => removeWithFeel(selectedRecipeId)} disabled={selectedEchoes <= 0}><Minus size={13} aria-hidden="true" /></Button><strong>{selectedEchoes}</strong><Button variant="secondary" ariaLabel={`Assign Acolyte to ${recipe.name}`} tooltip={canAdd ? <TooltipContent title="Assign Acolyte" description="Acolytes are shared across Channeling, Research, and Transmutation." /> : <TooltipContent title="Cannot assign Acolyte" description={addReason} />} onClick={() => addWithFeel(selectedRecipeId)} disabled={!canAdd}><Plus size={13} aria-hidden="true" /></Button></div>}
      </div>
      <div className="transmutation-active-heading"><span className="eyebrow">ACTIVE ASSIGNMENTS</span>{totalEchoes > 0 && <Button variant="ghost" onClick={clearWithFeel} tooltip="Release all Transmutation Acolytes. Partial recipe progress is preserved.">CLEAR ALL</Button>}</div>
      {totalEchoes === 0 ? <div className="transmutation-empty-assignments"><strong>NO ACOLYTES ASSIGNED</strong><span>Select a recipe and assign an Acolyte to begin production.</span></div> : <div className="transmutation-assignment-list">{RECIPE_ORDER.map((recipeId) => <AssignmentRow key={recipeId} recipeId={recipeId} state={state} selected={recipeId === selectedRecipeId} onSelect={onSelect} onAdd={addWithFeel} onRemove={removeWithFeel} />)}</div>}
    </div>
  </Card>
}

function AssignmentRow({ recipeId, state, selected, onSelect, onAdd, onRemove }: { recipeId: TransmutationRecipeId; state: GameState; selected: boolean; onSelect: (recipeId: TransmutationRecipeId) => void; onAdd: (recipeId: TransmutationRecipeId) => void; onRemove: (recipeId: TransmutationRecipeId) => void }) {
  const recipe = RECIPES[recipeId]
  const job = getTransmutationJob(state, recipeId)
  const echoes = (job?.acolyteAssigned ?? ((job?.echoesAssigned ?? 0) > 0)) ? 1 : 0
  const status = getRecipeStatus(state, recipe)
  const rowRef = useRef<HTMLDivElement>(null)
  const progress = Math.max(0, job?.progressMs ?? 0)
  const previousProgress = useRef<number | null>(null)
  const pulseSerial = useRef(0)
  const pulseTimer = useRef<number | null>(null)
  const [completionPulseKey, setCompletionPulseKey] = useState<number | null>(null)
  useEffect(() => () => { if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current) }, [])
  useEffect(() => {
    const previous = previousProgress.current
    previousProgress.current = progress
    const running = status === 'active' || status === 'flux-limited' || status === 'waiting-flux' || status === 'waiting-materials'
    if (!didTransmutationCycleWrap({ previousProgress: previous, currentProgress: progress, durationMs: recipe.baseDurationMs, echoes, running })) return
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return
    const item = ITEMS[recipe.output.itemId]
    emitGameFeelEvent({ type: 'craft-complete', x: rect.left + rect.width * 0.28, y: rect.top + rect.height * 0.5, color: item.color, intensity: item.kind === 'equipment' ? 1.25 : 0.9, sound: getTransmutationCompletionSound(item.kind) })
    const pulseKey = ++pulseSerial.current
    setCompletionPulseKey(pulseKey)
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current)
    pulseTimer.current = window.setTimeout(() => { setCompletionPulseKey(null); pulseTimer.current = null }, 300)
  }, [echoes, progress, recipe, status])
  if (!echoes) return null
  const canAdd = status !== 'locked' && canAssignTransmutationEcho(state)
  const addReason = status === 'locked' ? getRecipeUnlockReason(recipe) ?? 'This recipe is locked.' : 'Assign an Acolyte if workforce capacity allows.'
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(recipeId) } }
  const outputPerHour = getRecipeCurrentOutputPerHour(recipe, echoes, state)
  const fluxDemand = getRecipeFluxDemandPerSecond(recipe, echoes, state)
  return <div ref={rowRef} role="button" tabIndex={0} className={`transmutation-assignment-row ${selected ? 'selected' : ''} ${completionPulseKey !== null ? 'craft-complete' : ''}`} onClick={() => onSelect(recipeId)} onKeyDown={handleKeyDown} aria-label={`Select ${recipe.name}, ${echoes} Acolyte assigned`}><ItemIcon itemId={recipe.output.itemId} size="tiny" /><span className="transmutation-assignment-copy"><strong>{recipe.name}</strong><small>{echoes}A · {statusLabel(status)}</small><small className="transmutation-assignment-metrics">{formatOutputRate(outputPerHour)} · {formatFluxDemand(fluxDemand)}</small><Progress value={getRecipeProgressPercent(recipe, progress)} tone="gold" running={status === 'active' || status === 'flux-limited'} completionPulseKey={completionPulseKey ?? undefined} /></span><span className="transmutation-assignment-owned">OWNED {formatOwned(state.inventory[recipe.output.itemId] ?? 0)}</span><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Remove Acolyte from ${recipe.name}`} tooltip="Remove the Acolyte. Progress is preserved." onClick={() => onRemove(recipeId)}><Minus size={12} aria-hidden="true" /></Button></span><span onClick={(event) => event.stopPropagation()}><Button variant="ghost" ariaLabel={`Add Acolyte to ${recipe.name}`} tooltip={canAdd ? addReason : addReason} onClick={() => onAdd(recipeId)} disabled={!canAdd}><Plus size={12} aria-hidden="true" /></Button></span></div>
}

function formatOwned(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString()
}

function formatOutputRate(value: number) {
  const safe = Math.max(0, value)
  const formatted = safe >= 10 ? Math.round(safe).toLocaleString() : safe.toFixed(1).replace(/\.0$/, '')
  return `${formatted} / hr`
}

function formatFluxDemand(value: number) {
  const safe = Math.max(0, value)
  const formatted = safe >= 10 ? safe.toFixed(1).replace(/\.0$/, '') : safe < 0.01 ? safe.toFixed(3) : safe.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return `${formatted} Flux/s`
}

function statusLabel(status: ReturnType<typeof getRecipeStatus>) { return status.replace('-', ' ').toUpperCase() }
