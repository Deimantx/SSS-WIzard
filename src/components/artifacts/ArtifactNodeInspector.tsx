import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { ItemIcon } from '../ui/item'
import { SpellIcon } from '../spells/SpellIcon'
import { ITEMS } from '../../game/content/items/items'
import { getArtifactEffectLineClassName, getArtifactEffectsPresentation, getArtifactMajorPresentation, getArtifactMinorCurrentTotalPresentation, getArtifactMinorNextRankPresentation, type ArtifactEffectPresentationLine } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactCompletionPercent, getArtifactCurrentResolvedEffects, getArtifactMaxInvestedRanks, getArtifactMinorRank, getArtifactNextMajorMilestone, getArtifactRankPurchaseEligibility, getArtifactTotalInvestedRanks, getArtifactUnlockedMajorMilestones } from '../../game/systems/artifacts/artifactProgression'
import { RESONANCE_METADATA, type ResonanceType } from '../../game/content/resonance/resonance'
import { ARTIFACTS, type ArtifactMajorMilestoneDefinition, type ArtifactMinorNodeDefinition } from '../../game/content/artifacts/artifacts'
import type { ArtifactId, GameState, ItemId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

function RequirementCard({ requirement }: { requirement: ReturnType<typeof getArtifactRankPurchaseEligibility>['requirements'][number] }) {
  const icon = requirement.kind === 'item' ? <ItemIcon itemId={requirement.id as ItemId} size="tiny" /> : <SpellIcon school={requirement.id as ResonanceType} size="small" />
  return <div className={`artifact-requirement-card${requirement.sufficient ? ' sufficient' : ' missing'}`}><span className="artifact-requirement-icon">{icon}</span><span className="artifact-requirement-copy"><strong>{requirement.kind === 'item' ? requirement.label : RESONANCE_METADATA[requirement.id as ResonanceType].label}</strong><small>REQUIRED {requirement.required.toLocaleString()} · OWNED {requirement.owned.toLocaleString()}</small></span><span className="artifact-requirement-state">{requirement.sufficient ? 'READY' : `−${(requirement.required - requirement.owned).toLocaleString()}`}</span></div>
}

export function ArtifactNodeInspector({ state, artifactId, nodeId, onUpdated }: { state: GameStore; artifactId: ArtifactId; nodeId: string; onUpdated: () => void }) {
  const definition = ARTIFACTS[artifactId]
  const minor = definition?.minorNodes.find((node) => node.id === nodeId)
  const major = definition?.majorMilestones.find((node) => node.id === nodeId)
  if (!definition || (!minor && !major)) return null
  if (minor) return <MinorInspector state={state} artifactId={artifactId} node={minor} onUpdated={onUpdated} />
  return <MajorInspector state={state} major={major!} artifactId={artifactId} />
}

function EffectBlock({ title, details }: { title: string; details: ArtifactEffectPresentationLine[] }) {
  return <div className="artifact-inspector-effect-list"><strong>{title}</strong>{details.length ? details.map((line, index) => <span className={getArtifactEffectLineClassName(line)} key={`${line.text}-${index}`}>{line.text}</span>) : <span>No active effect</span>}</div>
}

function MinorInspector({ state, artifactId, node, onUpdated }: { state: GameStore; artifactId: ArtifactId; node: ArtifactMinorNodeDefinition; onUpdated: () => void }) {
  const rank = getArtifactMinorRank(state, artifactId, node.id)
  const eligibility = getArtifactRankPurchaseEligibility(state, artifactId, node.id)
  const current = getArtifactMinorCurrentTotalPresentation(node, rank)
  const next = getArtifactMinorNextRankPresentation(node, rank)
  const failure = eligibility.requirements.find((requirement) => !requirement.sufficient)
  const buyTooltip = eligibility.canPurchase ? `Purchase Minor rank ${eligibility.nextRank}.` : failure ? `Need ${(failure.required - failure.owned).toLocaleString()} more ${failure.label}.` : eligibility.failureReason === 'artifact-not-owned' ? 'Forge this Artifact before investing ranks.' : 'This node cannot be purchased.'
  return <section className="artifact-node-inspector" aria-label="Artifact Minor rank inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-minor"><span /></span><div><div className="artifact-inspector-kicker"><span>RANK NODE</span><span>{rank} / {node.maxRank}</span></div><h3 className="artifact-inspector-title">{node.name}</h3></div></div><p className="artifact-inspector-summary">{node.description}</p><EffectBlock title="CURRENT TOTAL" details={current.effectLines} />{next && <EffectBlock title={`NEXT RANK · ${rank + 1}`} details={next.effectLines} />}{eligibility.cost && <div className="artifact-inspector-requirements"><strong>RANK {eligibility.nextRank} REQUIREMENTS</strong>{eligibility.requirements.map((requirement) => <RequirementCard key={`${requirement.kind}-${requirement.id}`} requirement={requirement} />)}</div>}{eligibility.nextRank ? <GameTooltip content={<TooltipContent title={buyTooltip} description="Costs are checked atomically across Essence, fragments, Prismatic Fragments, and Resonance." />}><span className="artifact-inspector-action"><Button variant="primary" disabled={!eligibility.canPurchase} onClick={() => { if (state.purchaseArtifactRank(artifactId, node.id)) onUpdated() }}>BUY RANK {eligibility.nextRank}</Button></span></GameTooltip> : <Button variant="secondary" disabled>MAX RANK</Button>}</section>
}

function MajorInspector({ state, artifactId, major }: { state: GameStore; artifactId: ArtifactId; major: ArtifactMajorMilestoneDefinition }) {
  const total = getArtifactTotalInvestedRanks(state, artifactId)
  const active = total >= major.unlockAtTotalRanks
  const presentation = getArtifactMajorPresentation(major)
  return <section className="artifact-node-inspector" aria-label="Artifact milestone inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-major"><span /></span><div><div className="artifact-inspector-kicker"><span>MILESTONE</span><span>{major.unlockAtTotalRanks} TOTAL</span></div><h3 className="artifact-inspector-title">{major.name}</h3></div></div><p className="artifact-inspector-summary">{active ? 'ACTIVE · PERMANENT EFFECT' : `Invest ${Math.max(0, major.unlockAtTotalRanks - total)} more Minor ranks to unlock.`}</p><EffectBlock title="EFFECTS" details={presentation.effectLines} /><div className={`artifact-inspector-state artifact-inspector-state-${active ? 'active' : 'locked'}`}><span>PROGRESS</span><strong>{total} / {major.unlockAtTotalRanks} TOTAL RANKS</strong></div></section>
}

export function ArtifactSummaryInspector({ state, artifactId }: { state: Pick<GameState, 'artifactProgress'>; artifactId: ArtifactId }) {
  const definition = ARTIFACTS[artifactId]
  const item = ITEMS[artifactId]
  if (!definition || !item) return null
  const total = getArtifactTotalInvestedRanks(state, artifactId)
  const max = getArtifactMaxInvestedRanks(artifactId)
  const activeMilestones = getArtifactUnlockedMajorMilestones(state, artifactId)
  const next = getArtifactNextMajorMilestone(state, artifactId)
  const presentation = getArtifactEffectsPresentation(getArtifactCurrentResolvedEffects(state, artifactId))
  return <section className="artifact-summary-inspector" aria-label="Artifact Summary"><div className="artifact-summary-inspector-heading"><span className="artifact-summary-icon"><ItemIcon itemId={artifactId} size="tiny" /></span><div><span className="eyebrow">ARTIFACT SUMMARY</span><h3>{item.name}</h3></div></div><EffectBlock title="CURRENT BONUSES" details={presentation.compactEffectLines} />{presentation.specialEffectLines.length > 0 && <EffectBlock title="SIGNATURE EFFECTS" details={presentation.specialEffectLines} />}<div className="artifact-summary-section"><div className="artifact-summary-section-heading"><strong>ACTIVE MILESTONES</strong><span>{activeMilestones.length} / {definition.majorMilestones.length}</span></div>{activeMilestones.length > 0 ? <div className="artifact-summary-milestones">{activeMilestones.map((milestone) => <span key={milestone.id}>{milestone.name}</span>)}</div> : <span className="artifact-summary-muted">None yet</span>}</div><div className="artifact-summary-section"><div className="artifact-summary-section-heading"><strong>PROGRESSION</strong><span>{Math.round(getArtifactCompletionPercent(state, artifactId) * 100)}% COMPLETE</span></div><div className="artifact-summary-progression"><span>{total} / {max} RANKS</span><span>{activeMilestones.length} / {definition.majorMilestones.length} MILESTONES</span></div><div className="artifact-summary-next"><span>NEXT MILESTONE</span><strong>{next ? `${next.unlockAtTotalRanks} TOTAL RANKS` : 'ALL ACTIVE'}</strong>{next && <small>{Math.max(0, next.unlockAtTotalRanks - total)} ranks remaining</small>}</div></div><p className="artifact-summary-hint">Select a node to inspect or upgrade it.</p></section>
}
