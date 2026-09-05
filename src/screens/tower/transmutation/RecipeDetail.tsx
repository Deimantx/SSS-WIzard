import { isTransmutationRecipeId } from '../../../game/content/recipes/recipes'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { LockKeyhole } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Card, Status } from '../../../components/ui'
import { ItemIcon, ItemRequirementTile, ItemUsesDialog } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getVisibleItemUsesForTransmutation } from '../../../game/presentation/transmutation/transmutationUsedInReadModel'
import { getRecipeConsumableRequirements, getRecipeCurrentEffectiveDuration, getRecipeCurrentOutputPerHour, getRecipeCurrentSpeedMultiplier, getRecipeManaDemandPerSecond, getRecipeMaterialCapacity, getRecipeStatus, getRecipeUnlockReason, getTransmutationFocusReserved, getTransmutationJob, type RecipeConsumableRequirement, type RecipeMaterialCapacity, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import type { TransmutationRecipeId } from '../../../game/types'
import { formatNumber, formatSignedRate, formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

export function RecipeDetail({ recipe, onSelectRecipe }: { recipe: RecipeDefinition; onSelectRecipe?: (recipeId: TransmutationRecipeId) => void }) {
  const state = useGameStore()
  const [usesDialogOpen, setUsesDialogOpen] = useState(false)
  const job = getTransmutationJob(state, recipe.id)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const status = getRecipeStatus(state, recipe)
  const item = ITEMS[recipe.output.itemId]
  const uses = getVisibleItemUsesForTransmutation(state, recipe.output.itemId)
  const requirements = getRecipeConsumableRequirements(state, recipe)
  const currentCycle = getRecipeCurrentEffectiveDuration(recipe, echoes)
  const currentSpeed = getRecipeCurrentSpeedMultiplier(echoes)
  const currentOutput = getRecipeCurrentOutputPerHour(recipe, echoes)
  const materialCapacity = recipe.category === 'elemental' || recipe.category === 'material' ? getRecipeMaterialCapacity(requirements) : null

  return <Card className="transmutation-detail" title="RECIPE DETAIL">
    <div className="transmutation-detail-content">
      <div className="transmutation-detail-hero"><div className="transmutation-detail-icon"><ItemIcon itemId={recipe.output.itemId} size="large" /></div><div className="transmutation-detail-title"><span className="eyebrow">{recipe.category.toUpperCase()}</span><h2>{recipe.name}</h2><span className="transmutation-owned">OWNED ×{formatNumber(state.inventory[recipe.output.itemId] ?? 0)}</span></div><Status tone={statusTone(status)}>{statusLabel(status)}</Status></div>
      <p className="transmutation-detail-description">{recipe.description}</p>

      {status === 'locked' && <div className="transmutation-lock-reason"><LockKeyhole size={15} aria-hidden="true" /><span>{getRecipeUnlockReason(recipe)}</span></div>}

      <DetailSection title="BASE RECIPE"><div className="transmutation-stat-grid"><DetailStat label="TIME" value={formatTime(recipe.baseDurationMs)} /><DetailStat label="MANA" value={formatNumber(recipe.manaCost)} /><DetailStat label="OUTPUT" value={`×${recipe.output.quantity} ${item.name}`} /></div></DetailSection>

      {status !== 'locked' && <DetailSection title="CURRENT PRODUCTION"><CurrentProduction echoes={echoes} currentCycle={currentCycle} currentSpeed={currentSpeed} currentOutput={currentOutput} /></DetailSection>}

      {requirements.length > 0 && <DetailSection title="MATERIAL REQUIREMENTS"><div className="transmutation-requirements-grid">{requirements.map((requirement) => <ItemRequirementTile key={requirement.itemId} itemId={requirement.itemId} owned={requirement.owned} available={requirement.available} equipped={requirement.equipped} required={requirement.required} protectedItem={requirement.protected} />)}</div></DetailSection>}

      {materialCapacity && (materialCapacity.cycles !== null || materialCapacity.missing.length > 0) && <MaterialCapacity capacity={materialCapacity} outputQuantity={recipe.output.quantity} />}

      {recipe.manaCost > 0 && <section className="transmutation-detail-section transmutation-mana-requirement"><span className="eyebrow">MANA / CYCLE</span><strong>{formatNumber(recipe.manaCost)} · {formatSignedRate(-getRecipeManaDemandPerSecond(recipe, echoes))} demand</strong><Status tone={status === 'waiting-mana' ? 'warning' : status === 'mana-limited' ? 'warning' : 'success'}>{status === 'waiting-mana' ? 'WAITING' : status === 'mana-limited' ? 'LIMITED' : 'FUNDED'}</Status></section>}

      <UsedInSummary uses={uses} onOpen={() => setUsesDialogOpen(true)} />
    </div>
    <ItemUsesDialog itemId={recipe.output.itemId} uses={uses} open={usesDialogOpen} onClose={() => setUsesDialogOpen(false)} onSelectRecipe={(id) => { if (isTransmutationRecipeId(id)) onSelectRecipe?.(id); else { setUiPreferences({ screenState: { artificing: { selectedRecipeId: id } } }); state.setScreen('tower-artificing') } }} />
  </Card>
}

function UsedInSummary({ uses, onOpen }: { uses: ReturnType<typeof getVisibleItemUsesForTransmutation>; onOpen: () => void }) {
  return <section className="transmutation-detail-section transmutation-used-in-summary"><div className="transmutation-used-in-row"><span className="transmutation-used-in-label">USED IN · {uses.length > 0 ? `${uses.length} ${uses.length === 1 ? 'use' : 'uses'}` : 'NONE'}</span>{uses.length > 0 && <button type="button" className="button ghost" onClick={onOpen}>VIEW</button>}</div></section>
}

function CurrentProduction({ echoes, currentCycle, currentSpeed, currentOutput }: { echoes: number; currentCycle: number | null; currentSpeed: number; currentOutput: number }) {
  if (!echoes) return <div className="transmutation-production-paused"><Status>PAUSED</Status><span>Assign an Arcane Echo to begin production.</span></div>
  return <div className="transmutation-current-summary"><DetailStat label="ECHOES" value={String(echoes)} /><DetailStat label="SPEED" value={`${currentSpeed}×`} /><DetailStat label="EFFECTIVE TIME" value={currentCycle === null ? '—' : formatTime(currentCycle)} /><DetailStat label="OUTPUT / H" value={formatNumber(currentOutput)} /><DetailStat label="FOCUS" value={String(getTransmutationFocusReserved(echoes))} /></div>
}

function MaterialCapacity({ capacity, outputQuantity }: { capacity: RecipeMaterialCapacity; outputQuantity: number }) {
  return <section className="transmutation-detail-section transmutation-material-capacity"><span className="eyebrow">PRODUCTION CAPACITY</span><div className="transmutation-capacity-grid">{capacity.cycles !== null && <DetailStat label="CAN CRAFT" value={`${formatNumber(capacity.cycles)} ${capacity.cycles === 1 ? 'craft' : 'crafts'}${outputQuantity > 1 ? ` · ${formatNumber(capacity.cycles * outputQuantity)} output` : ''}`} />}{capacity.limitingItemId && <DetailStat label="LIMITING MATERIAL" value={ITEMS[capacity.limitingItemId].name} />}</div>{capacity.missing.length > 0 && <div className="transmutation-missing-materials"><small>MISSING</small>{capacity.missing.map((missing) => <span key={missing.itemId}><ItemIcon itemId={missing.itemId} size="tiny" />{ITEMS[missing.itemId].name} ×{formatNumber(missing.quantity)}</span>)}</div>}</section>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="transmutation-detail-section"><span className="eyebrow">{title}</span>{children}</section> }
function DetailStat({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span> }
function statusTone(status: TransmutationStatus): 'neutral' | 'success' | 'warning' | 'active' | 'locked' { return status === 'locked' ? 'locked' : status === 'active' ? 'active' : status === 'mana-limited' || status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral' }
function statusLabel(status: TransmutationStatus) { return status.replace('-', ' ').toUpperCase() }
