import { ChevronDown, ChevronRight, LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, Status } from '../../../components/ui'
import { ItemIcon, ItemRequirementTile } from '../../../components/ui/item'
import { ITEMS, getItemSourceLabel } from '../../../game/content/items/items'
import type { RecipeDefinition } from '../../../game/content/recipes/recipes'
import { getRecipeConsumableRequirements, getRecipeCurrentEffectiveDuration, getRecipeCurrentOutputPerHour, getRecipeCurrentSpeedMultiplier, getRecipeManaDemandPerSecond, getRecipeStatus, getRecipeUnlockReason, getTransmutationFocusReserved, getTransmutationJob, type TransmutationStatus } from '../../../game/systems/transmutation/transmutationSelectors'
import { formatNumber, formatSignedRate, formatTime } from '../../../game/utils'
import { getItemUses } from '../../inventory/inventoryMetadata'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'

export function RecipeDetail({ recipe }: { recipe: RecipeDefinition }) {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const job = getTransmutationJob(state, recipe.id)
  const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
  const status = getRecipeStatus(state, recipe)
  const item = ITEMS[recipe.output.itemId]
  const uses = getItemUses(recipe.output.itemId)
  const requirements = getRecipeConsumableRequirements(state, recipe)
  const currentCycle = getRecipeCurrentEffectiveDuration(recipe, echoes)
  const currentSpeed = getRecipeCurrentSpeedMultiplier(echoes)
  const currentOutput = getRecipeCurrentOutputPerHour(recipe, echoes)
  const isUsedInOpen = preferences.screenState.transmutation.usedInOpen
  const toggleUsedIn = () => setUiPreferences({ screenState: { transmutation: { usedInOpen: !isUsedInOpen } } })

  return <Card className="transmutation-detail" title="RECIPE DETAIL">
    <div className="transmutation-detail-content">
      <div className="transmutation-detail-hero"><div className="transmutation-detail-icon"><ItemIcon itemId={recipe.output.itemId} size="large" /></div><div className="transmutation-detail-title"><span className="eyebrow">{recipe.category.toUpperCase()}</span><h2>{recipe.name}</h2><span className="transmutation-owned">OWNED ×{formatNumber(state.inventory[recipe.output.itemId] ?? 0)}</span></div><Status tone={statusTone(status)}>{statusLabel(status)}</Status></div>
      <p className="transmutation-detail-description">{recipe.description}</p>

      {status === 'locked' && <div className="transmutation-lock-reason"><LockKeyhole size={15} aria-hidden="true" /><span>{getRecipeUnlockReason(recipe)}</span></div>}

      <DetailSection title="BASE RECIPE"><div className="transmutation-stat-grid"><DetailStat label="TIME" value={formatTime(recipe.baseDurationMs)} /><DetailStat label="MANA" value={formatNumber(recipe.manaCost)} /><DetailStat label="OUTPUT" value={`×${recipe.output.quantity} ${item.name}`} /></div></DetailSection>

      {status !== 'locked' && <DetailSection title="CURRENT PRODUCTION"><CurrentProduction echoes={echoes} currentCycle={currentCycle} currentSpeed={currentSpeed} currentOutput={currentOutput} /></DetailSection>}

      {requirements.length > 0 && <DetailSection title="MATERIAL REQUIREMENTS"><div className="transmutation-requirements-grid">{requirements.map((requirement) => <ItemRequirementTile key={requirement.itemId} itemId={requirement.itemId} owned={requirement.owned} available={requirement.available} equipped={requirement.equipped} required={requirement.required} protectedItem={requirement.protected} source={getItemSourceLabel(requirement.itemId)} />)}</div></DetailSection>}

      {recipe.manaCost > 0 && <section className="transmutation-detail-section transmutation-mana-requirement"><span className="eyebrow">MANA / CYCLE</span><strong>{formatNumber(recipe.manaCost)} · {formatSignedRate(-getRecipeManaDemandPerSecond(recipe, echoes))} demand</strong><Status tone={status === 'waiting-mana' ? 'warning' : status === 'mana-limited' ? 'warning' : 'success'}>{status === 'waiting-mana' ? 'WAITING' : status === 'mana-limited' ? 'LIMITED' : 'FUNDED'}</Status></section>}

      <section className="transmutation-detail-section transmutation-accordion"><button type="button" onClick={toggleUsedIn} aria-expanded={isUsedInOpen}><span className="eyebrow">USED IN {uses.length ? `· ${uses.length}` : ''}</span>{isUsedInOpen ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}</button>{isUsedInOpen && (uses.length ? <div className="transmutation-uses">{uses.map((use) => <span key={`${use.destination}-${use.label}`}><strong>{use.label}</strong><small>{use.detail}</small></span>)}</div> : <p className="muted">No known downstream use yet.</p>)}</section>
    </div>
  </Card>
}

function CurrentProduction({ echoes, currentCycle, currentSpeed, currentOutput }: { echoes: number; currentCycle: number | null; currentSpeed: number; currentOutput: number }) {
  if (!echoes) return <div className="transmutation-production-paused"><Status>PAUSED</Status><span>Assign an Arcane Echo to begin production.</span></div>
  return <div className="transmutation-current-summary"><DetailStat label="ECHOES" value={String(echoes)} /><DetailStat label="SPEED" value={`${currentSpeed}×`} /><DetailStat label="EFFECTIVE TIME" value={currentCycle === null ? '—' : formatTime(currentCycle)} /><DetailStat label="OUTPUT / H" value={formatNumber(currentOutput)} /><DetailStat label="FOCUS" value={String(getTransmutationFocusReserved(echoes))} /></div>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section className="transmutation-detail-section"><span className="eyebrow">{title}</span>{children}</section> }
function DetailStat({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span> }
function statusTone(status: TransmutationStatus): 'neutral' | 'success' | 'warning' | 'active' | 'locked' { return status === 'locked' ? 'locked' : status === 'active' ? 'active' : status === 'mana-limited' || status === 'waiting-mana' || status === 'waiting-materials' ? 'warning' : 'neutral' }
function statusLabel(status: TransmutationStatus) { return status.replace('-', ' ').toUpperCase() }
