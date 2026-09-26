import { Droplets, Flame, LockKeyhole, Mountain, Wind, Zap } from 'lucide-react'
import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Card, Status } from '../../../components/ui'
import { ItemIcon, ItemRequirementTile, ItemUsesDialog } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { RESONANCE_METADATA, type ResonanceType } from '../../../game/content/resonance/resonance'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { isTransmutationRecipeId, type RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getVisibleItemUsesForTransmutation } from '../../../game/presentation/transmutation/transmutationUsedInReadModel'
import { getRecipeConsumableRequirements, getRecipeCurrentEffectiveDuration, getRecipeCurrentOutputPerHour, getRecipeFluxDemandPerSecond, getRecipeMaterialCapacity, getRecipeStatus, getRecipeUnlockReason, getTransmutationJob, type RecipeMaterialCapacity, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import { getEffectiveTransmutationFluxCost, getEffectiveTransmutationResonanceCost, getEffectiveTransmutationWorkMultiplier } from '../../../game/systems/transmutation/transmutationArrays'
import type { TransmutationRecipeId } from '../../../game/types'
import { formatResourceAmount } from '../../../game/presentation/resources/resourcePresentation'
import { formatNumber, formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'

const RESONANCE_ICONS: Record<ResonanceType, ComponentType<{ size?: number }>> = { fire: Flame, water: Droplets, earth: Mountain, air: Wind }

export function RecipeDetail({ recipe, onSelectRecipe }: { recipe: RecipeDefinition; onSelectRecipe?: (recipeId: TransmutationRecipeId) => void }) {
  const state = useGameStore()
  const [usesDialogOpen, setUsesDialogOpen] = useState(false)
  const job = getTransmutationJob(state, recipe.id)
  const acolytes = job?.acolyteAssigned ? 1 : 0
  const status = getRecipeStatus(state, recipe)
  const item = ITEMS[recipe.output.itemId]
  const uses = getVisibleItemUsesForTransmutation(state, recipe.output.itemId)
  const requirements = getRecipeConsumableRequirements(state, recipe)
  const currentCycle = getRecipeCurrentEffectiveDuration(recipe, acolytes, state)
  const currentSpeed = getEffectiveTransmutationWorkMultiplier(state, acolytes)
  const currentOutput = getRecipeCurrentOutputPerHour(recipe, acolytes, state)
  const materialCapacity = getRecipeMaterialCapacity(requirements)
  const detailScrollRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(detailScrollRef, { resetKey: recipe.id })
  return <Card className="transmutation-detail" title="RECIPE DETAIL"><div ref={detailScrollRef} className="transmutation-detail-content smart-scroll-region"><div className="transmutation-detail-hero"><div className="transmutation-detail-icon"><ItemIcon itemId={recipe.output.itemId} size="large" /></div><div className="transmutation-detail-title"><span className="eyebrow">{recipe.category.toUpperCase()}</span><h2>{recipe.name}</h2><span className="transmutation-owned">OWNED ×{formatNumber(state.inventory[recipe.output.itemId] ?? 0)}</span></div><Status tone={statusTone(status)}>{statusLabel(status)}</Status></div><p className="transmutation-detail-description">{recipe.description}</p>{status === 'locked' && <div className="transmutation-lock-reason"><LockKeyhole size={15} aria-hidden="true" /><span>{getRecipeUnlockReason(recipe)}</span></div>}<DetailSection title="BASE RECIPE"><div className="transmutation-stat-grid"><DetailStat label="TIME" value={formatTime(recipe.baseDurationMs)} /><DetailStat label="OUTPUT" value={`×${recipe.output.quantity} ${item.name}`} /></div></DetailSection><RecipeRequirements recipe={recipe} state={state} requirements={requirements} />{status !== 'locked' && <DetailSection title="CURRENT PRODUCTION"><CurrentProduction acolytes={acolytes} currentCycle={currentCycle} currentSpeed={currentSpeed} currentOutput={currentOutput} fluxRate={getRecipeFluxDemandPerSecond(recipe, acolytes, state)} /></DetailSection>}{materialCapacity.cycles !== null && <MaterialCapacity capacity={materialCapacity} outputQuantity={recipe.output.quantity} />}<UsedInSummary uses={uses} onOpen={() => setUsesDialogOpen(true)} /></div><ItemUsesDialog itemId={recipe.output.itemId} uses={uses} open={usesDialogOpen} onClose={() => setUsesDialogOpen(false)} onSelectRecipe={(id) => { if (isTransmutationRecipeId(id)) onSelectRecipe?.(id); else { setUiPreferences({ screenState: { artificing: { selectedRecipeId: id } } }); state.setScreen('tower-artificing') } }} /></Card>
}

function RecipeRequirements({ recipe, state, requirements }: { recipe: RecipeDefinition; state: ReturnType<typeof useGameStore.getState>; requirements: ReturnType<typeof getRecipeConsumableRequirements> }) {
  const resonanceCosts = getEffectiveTransmutationResonanceCost(state, recipe)
  const fluxRequired = getEffectiveTransmutationFluxCost(state, recipe)
  const resonanceTiles = (Object.entries(resonanceCosts) as Array<[ResonanceType, number]>).filter(([, required]) => required > 0)
  const fluxOwned = state.tower.resources.arcaneFlux
  return <DetailSection title="RECIPE REQUIREMENTS"><div className="transmutation-requirements-grid transmutation-requirement-cards">{resonanceTiles.map(([type, required]) => <ResourceRequirementTile key={type} label={`${SCHOOLS[type].name} Resonance`} icon={RESONANCE_ICONS[type]} color={SCHOOLS[type].color} owned={state.resonance[type] ?? 0} required={required} />)}<ResourceRequirementTile label="Arcane Flux" icon={Zap} color="var(--ui-accent)" owned={fluxOwned} required={fluxRequired} />{requirements.map((requirement) => <ItemRequirementTile key={requirement.itemId} itemId={requirement.itemId} owned={requirement.owned} available={requirement.available} equipped={requirement.equipped} required={requirement.required} protectedItem={requirement.protected} />)}</div></DetailSection>
}

function ResourceRequirementTile({ label, icon: Icon, color, owned, required }: { label: string; icon: ComponentType<{ size?: number }>; color: string; owned: number; required: number }) { const sufficient = owned >= required; return <div className={`transmutation-resource-requirement ${sufficient ? 'sufficient' : 'missing'}`} style={{ '--requirement-accent': color } as React.CSSProperties}><span className="transmutation-resource-icon"><Icon size={18} /></span><span><strong>{label}</strong><small>{formatResourceAmount(owned)} / {formatResourceAmount(required)}</small></span></div> }
function CurrentProduction({ acolytes, currentCycle, currentSpeed, currentOutput, fluxRate }: { acolytes: number; currentCycle: number | null; currentSpeed: number; currentOutput: number; fluxRate: number }) { if (!acolytes) return <div className="transmutation-production-paused"><Status>PAUSED</Status><span>Assign an Acolyte to begin production.</span></div>; return <div className="transmutation-current-summary"><DetailStat label="ACOLYTES" value={String(acolytes)} /><DetailStat label="SPEED" value={`${currentSpeed}×`} /><DetailStat label="EFFECTIVE TIME" value={currentCycle === null ? '—' : formatTime(currentCycle)} /><DetailStat label="OUTPUT / H" value={formatNumber(currentOutput)} /><DetailStat label="FLUX / S" value={formatResourceAmount(fluxRate)} /></div> }
function MaterialCapacity({ capacity, outputQuantity }: { capacity: RecipeMaterialCapacity; outputQuantity: number }) { return <section className="transmutation-detail-section transmutation-material-capacity"><span className="eyebrow">PRODUCTION CAPACITY</span><div className="transmutation-capacity-grid">{capacity.cycles !== null && <DetailStat label="CAN CRAFT" value={`${formatNumber(capacity.cycles)} ${capacity.cycles === 1 ? 'craft' : 'crafts'} · ${formatNumber(capacity.cycles * outputQuantity)} output`} />}{capacity.limitingItemId && <DetailStat label="LIMITING MATERIAL" value={ITEMS[capacity.limitingItemId].name} />}</div>{capacity.missing.length > 0 && <div className="transmutation-missing-materials"><small>MISSING</small>{capacity.missing.map((missing) => <span key={missing.itemId}><ItemIcon itemId={missing.itemId} size="tiny" />{ITEMS[missing.itemId].name} ×{formatNumber(missing.quantity)}</span>)}</div>}</section> }
function UsedInSummary({ uses, onOpen }: { uses: ReturnType<typeof getVisibleItemUsesForTransmutation>; onOpen: () => void }) { return <section className="transmutation-detail-section transmutation-used-in-summary"><div className="transmutation-used-in-row"><span className="transmutation-used-in-label">USED IN · {uses.length > 0 ? `${uses.length} ${uses.length === 1 ? 'use' : 'uses'}` : 'NONE'}</span>{uses.length > 0 && <button type="button" className="button ghost" onClick={onOpen}>VIEW</button>}</div></section> }
function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="transmutation-detail-section"><span className="eyebrow">{title}</span>{children}</section> }
function DetailStat({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span> }
function statusTone(status: TransmutationStatus): 'neutral' | 'success' | 'warning' | 'active' | 'locked' { return status === 'locked' ? 'locked' : status === 'active' ? 'active' : status === 'flux-limited' || status === 'waiting-flux' || status === 'waiting-resonance' || status === 'waiting-materials' ? 'warning' : 'neutral' }
function statusLabel(status: TransmutationStatus) { return status.replace('-', ' ').toUpperCase() }
