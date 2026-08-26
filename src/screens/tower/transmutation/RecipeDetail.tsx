import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { ITEMS, getItemSourceLabel } from '../../../game/content/items/items'
import { RECIPES, type RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeEffectiveDuration, getRecipeOutputPerHour, getRecipeConsumableRequirements, getRecipeProgressPercent, getRecipeRemainingMs, getRecipeStatus, getRecipeUnlockReason, getTransmutationJob, getTransmutationSpeedMultiplier, isRecipeCraftable } from '../../../game/systems/transmutation/transmutationSelectors'
import { formatNumber, formatTime } from '../../../game/utils'
import { getItemUses } from '../../inventory/inventoryMetadata'
import { useGameStore } from '../../../store/gameStore'

export function RecipeDetail({ recipe }: { recipe: RecipeDefinition }) {
  const state = useGameStore()
  const [usedInOpen, setUsedInOpen] = useState(true)
  const job = getTransmutationJob(state, recipe.id)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const status = getRecipeStatus(state, recipe)
  const requirements = getRecipeConsumableRequirements(state, recipe)
  const item = ITEMS[recipe.output.itemId]
  const uses = getItemUses(recipe.output.itemId)
  const effectiveDuration = getRecipeEffectiveDuration(recipe, echoes)
  const speedMultiplier = getTransmutationSpeedMultiplier(echoes)
  const potentialPerHour = getRecipeOutputPerHour(recipe, speedMultiplier)
  const remainingMs = getRecipeRemainingMs(recipe, job?.progressMs ?? 0)
  const unlockReason = getRecipeUnlockReason(recipe)
  const craftable = isRecipeCraftable(state, recipe)
  return <Card className="transmutation-detail" title="RECIPE DETAIL" action={<Status tone={status === 'locked' ? 'locked' : status === 'active' ? 'active' : status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral'}>{status.replace('-', ' ').toUpperCase()}</Status>}>
    <div className="transmutation-detail-hero"><div className="transmutation-detail-icon"><ItemIcon itemId={recipe.output.itemId} size="large" /></div><div><span className="eyebrow">{recipe.category.toUpperCase()} · OUTPUT</span><h2>{recipe.name}</h2><p>{recipe.description}</p><span className="transmutation-owned">OWNED ×{formatNumber(state.inventory[recipe.output.itemId] ?? 0)}</span></div></div>
    {unlockReason && status === 'locked' && <div className="transmutation-lock-reason"><Status tone="locked">LOCKED</Status><span>{unlockReason}</span></div>}
    <div className="transmutation-stat-grid"><DetailStat label="BASE TIME" value={formatTime(recipe.baseDurationMs)} /><DetailStat label="MANA" value={`${recipe.manaCost}`} /><DetailStat label="OUTPUT" value={`×${recipe.output.quantity}`} /><DetailStat label="CURRENT SPEED" value={`${speedMultiplier}.0×`} /><DetailStat label="EFFECTIVE CYCLE" value={formatTime(effectiveDuration)} /><DetailStat label="POTENTIAL" value={`${formatNumber(potentialPerHour)}/h`} /></div>
    {echoes > 0 && <Progress value={getRecipeProgressPercent(recipe, job?.progressMs ?? 0)} tone="gold" label="CURRENT CYCLE" right={status === 'waiting-mana' ? 'Waiting for Mana' : status === 'waiting-materials' ? 'Waiting for Materials' : formatTime(remainingMs)} />}
    <section className="transmutation-detail-section"><span className="eyebrow">MATERIAL REQUIREMENTS</span>{requirements.length === 0 ? <p className="transmutation-no-materials">No material ingredients · Mana-only recipe.</p> : <div className="transmutation-requirements">{requirements.map((requirement) => <Requirement key={requirement.itemId} {...requirement} />)}</div>}</section>
    <section className="transmutation-detail-section transmutation-mana-requirement"><span className="eyebrow">MANA</span><strong>{formatNumber(state.player.mana)} / {formatNumber(recipe.manaCost)}</strong><Status tone={state.player.mana >= recipe.manaCost ? 'success' : 'warning'}>{state.player.mana >= recipe.manaCost ? 'READY' : 'WAITING'}</Status></section>
    <section className="transmutation-detail-section transmutation-accordion"><button type="button" onClick={() => setUsedInOpen((open) => !open)} aria-expanded={usedInOpen}><span className="eyebrow">USED IN {uses.length ? `· ${uses.length}` : ''}</span>{usedInOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>{usedInOpen && (uses.length ? <div className="transmutation-uses">{uses.map((use) => <span key={`${use.destination}-${use.label}`}><strong>{use.label}</strong><small>{use.detail}</small></span>)}</div> : <p className="muted">Not used by another authored system yet.</p>)}</section>
    <small className={`transmutation-craftability ${craftable ? 'ready' : ''}`}>{craftable ? 'Ready for a completed cycle when an Echo is assigned.' : 'Assignment can wait at full progress until all requirements are available.'}</small>
  </Card>
}

function Requirement({ itemId, required, owned, equipped, available, protected: protectedItem }: ReturnType<typeof getRecipeConsumableRequirements>[number]) {
  const item = ITEMS[itemId]
  const ready = available >= required
  return <GameTooltip block content={<TooltipContent title={item.name} description={item.description}><div className="tooltip-section"><small>CONSUMPTION</small><p>Owned: {owned}<br />Equipped / Reserved: {equipped}<br />Available: {available}<br />Required: {required}</p></div>{protectedItem && <p>PROTECTED · this stack cannot be consumed.</p>}<div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div></TooltipContent>} accent={ready ? 'success' : 'warning'}><span className={`transmutation-requirement ${ready ? 'ready' : 'missing'} ${protectedItem ? 'protected' : ''}`}><ItemIcon itemId={itemId} size="tile" /><span><strong>{item.name}</strong><small>{available} available / {required} required{protectedItem ? ' · PROTECTED' : ''}</small></span><Status tone={ready ? 'success' : 'warning'}>{ready ? 'READY' : 'MISSING'}</Status></span></GameTooltip>
}

function DetailStat({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span> }

import React from 'react'
