import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { ItemIcon } from '../ui/item'
import { getArtifactMajorPresentation, getArtifactMinorCurrentTotalPresentation, getArtifactMinorNextRankPresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactMinorRank, getArtifactRankPurchaseEligibility, getArtifactTotalInvestedRanks } from '../../game/systems/artifacts/artifactProgression'
import { RESONANCE_METADATA, type ResonanceType } from '../../game/content/resonance/resonance'
import { ARTIFACTS, type ArtifactMajorMilestoneDefinition, type ArtifactMinorNodeDefinition } from '../../game/content/artifacts/artifacts'
import type { ArtifactId, ItemId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

function ResonanceIcon({ type }: { type: ResonanceType }) {
  return <span className={`artifact-resonance-icon artifact-resonance-${type}`} aria-hidden="true">✦</span>
}

function RequirementCard({ requirement }: { requirement: ReturnType<typeof getArtifactRankPurchaseEligibility>['requirements'][number] }) {
  const icon = requirement.kind === 'item' ? <ItemIcon itemId={requirement.id as ItemId} size="tile" /> : <ResonanceIcon type={requirement.id as ResonanceType} />
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

function EffectBlock({ title, details }: { title: string; details: string[] }) {
  return <div className="artifact-inspector-effect-list"><strong>{title}</strong>{details.length ? details.map((detail, index) => <span key={`${detail}-${index}`}>{detail}</span>) : <span>No active effect</span>}</div>
}

function MinorInspector({ state, artifactId, node, onUpdated }: { state: GameStore; artifactId: ArtifactId; node: ArtifactMinorNodeDefinition; onUpdated: () => void }) {
  const rank = getArtifactMinorRank(state, artifactId, node.id)
  const eligibility = getArtifactRankPurchaseEligibility(state, artifactId, node.id)
  const current = getArtifactMinorCurrentTotalPresentation(node, rank)
  const next = getArtifactMinorNextRankPresentation(node, rank)
  const failure = eligibility.requirements.find((requirement) => !requirement.sufficient)
  const buyTooltip = eligibility.canPurchase ? `Purchase Minor rank ${eligibility.nextRank}.` : failure ? `Need ${(failure.required - failure.owned).toLocaleString()} more ${failure.label}.` : eligibility.failureReason === 'artifact-not-owned' ? 'Forge this Artifact before investing ranks.' : 'This node cannot be purchased.'
  return <section className="artifact-node-inspector" aria-label="Artifact Minor rank inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-minor"><span /></span><div><div className="artifact-inspector-kicker"><span>RANK NODE</span><span>{rank} / {node.maxRank}</span></div><h3 className="artifact-inspector-title">{node.name}</h3></div></div><p className="artifact-inspector-summary">{node.description}</p><EffectBlock title="CURRENT TOTAL" details={current.details} />{next && <EffectBlock title={`NEXT RANK · ${rank + 1}`} details={next.details} />}{eligibility.cost && <div className="artifact-inspector-requirements"><strong>RANK {eligibility.nextRank} REQUIREMENTS</strong>{eligibility.requirements.map((requirement) => <RequirementCard key={`${requirement.kind}-${requirement.id}`} requirement={requirement} />)}</div>}{eligibility.nextRank ? <GameTooltip content={<TooltipContent title={buyTooltip} description="Costs are checked atomically across Essence, fragments, Prismatic Fragments, and Resonance." />}><span className="artifact-inspector-action"><Button variant="primary" disabled={!eligibility.canPurchase} onClick={() => { if (state.purchaseArtifactRank(artifactId, node.id)) onUpdated() }}>BUY RANK {eligibility.nextRank}</Button></span></GameTooltip> : <Button variant="secondary" disabled>MAX RANK</Button>}</section>
}

function MajorInspector({ state, artifactId, major }: { state: GameStore; artifactId: ArtifactId; major: ArtifactMajorMilestoneDefinition }) {
  const total = getArtifactTotalInvestedRanks(state, artifactId)
  const active = total >= major.unlockAtTotalRanks
  const presentation = getArtifactMajorPresentation(major)
  return <section className="artifact-node-inspector" aria-label="Artifact milestone inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-major"><span /></span><div><div className="artifact-inspector-kicker"><span>MILESTONE</span><span>{major.unlockAtTotalRanks} TOTAL</span></div><h3 className="artifact-inspector-title">{major.name}</h3></div></div><p className="artifact-inspector-summary">{active ? 'ACTIVE · PERMANENT EFFECT' : `Invest ${Math.max(0, major.unlockAtTotalRanks - total)} more Minor ranks to unlock.`}</p><EffectBlock title="EFFECTS" details={presentation.details} /><div className={`artifact-inspector-state artifact-inspector-state-${active ? 'active' : 'locked'}`}><span>PROGRESS</span><strong>{total} / {major.unlockAtTotalRanks} TOTAL RANKS</strong></div></section>
}

export function ArtifactInspectorEmpty({ investedRanks, nextMilestone }: { investedRanks: number; nextMilestone: number | null }) {
  return <div className="artifact-node-inspector-empty"><span className="artifact-empty-glyph">✦</span><strong>SELECT A NODE</strong><p>Inspect cumulative bonuses, the next rank, material requirements, or a milestone effect.</p><span className="artifact-inspector-status">{investedRanks} ranks invested · {nextMilestone === null ? 'ALL MILESTONES ACTIVE' : `NEXT MILESTONE AT ${nextMilestone}`}</span></div>
}
