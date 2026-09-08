import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { getArtifactNodePresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactNodeEligibility, getArtifactProgress } from '../../game/systems/artifacts/artifactProgression'
import { ARTIFACTS, type ArtifactNodeDefinition } from '../../game/content/artifacts/artifacts'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS } from '../../game/content/monsters'
import type { ArtifactId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

const typeLabel = (type: ArtifactNodeDefinition['type']) => type === 'capstone' ? 'CAPSTONE' : type.toUpperCase()
const glyphFor = (type: ArtifactNodeDefinition['type']) => type === 'minor' ? '●' : type === 'major' ? '◆' : '★'

export function ArtifactNodeInspector({ state, artifactId, node, onAllocated }: { state: GameStore; artifactId: ArtifactId; node: ArtifactNodeDefinition; onAllocated: () => void }) {
  const definition = ARTIFACTS[artifactId]
  const progress = getArtifactProgress(state, artifactId)
  const eligibility = getArtifactNodeEligibility(state, artifactId, node.id)
  const presentation = getArtifactNodePresentation(node)
  const branch = node.branch === 'shared' ? 'Core Path' : definition?.branches.find((entry) => entry.id === node.branch)?.name ?? node.branch
  const requirements = [
    `Artifact level ${node.requiresLevel}`,
    `${node.pointCost} Artifact Point${node.pointCost === 1 ? '' : 's'}`,
    ...(node.prerequisites ?? []).map((id) => `After ${definition?.nodes.find((entry) => entry.id === id)?.name ?? 'a prior Node'}`),
    ...(node.requiresBossKill ? [`Defeat ${MONSTERS[node.requiresBossKill]?.name ?? 'required boss'}`] : []),
    ...(node.catalyst ? [`${ITEMS[node.catalyst.itemId]?.name ?? 'Catalyst'} ×${node.catalyst.quantity}${progress.attunedNodeIds.includes(node.id) ? ' · Attuned' : ''}`] : []),
  ]
  const allocated = eligibility.status === 'allocated'
  const attuned = progress.attunedNodeIds.includes(node.id)
  const actionLabel = allocated ? 'ALLOCATED' : node.catalyst && !attuned ? 'ATTUNE & ALLOCATE' : 'ALLOCATE NODE'
  return <section className="artifact-node-inspector" aria-label="Artifact node inspector">
    <div className="artifact-inspector-node-heading"><span className={`artifact-inspector-node-icon artifact-inspector-node-icon-${node.type}`} aria-hidden="true">{glyphFor(node.type)}</span><div><div className="artifact-inspector-kicker"><span>{typeLabel(node.type)}</span><span>{branch.toUpperCase()}</span></div><h3 className="artifact-inspector-title">{node.name}</h3></div></div>
    <p className="artifact-inspector-summary">{presentation.summary}</p>
    {presentation.details.length > 0 && <div className="artifact-inspector-effect-list"><strong>EFFECTS</strong>{presentation.details.map((detail) => <span key={detail}>{detail}</span>)}</div>}
    <div className="artifact-inspector-requirements"><strong>REQUIREMENTS</strong>{requirements.map((requirement) => <GameTooltip key={requirement} content={<TooltipContent title="Path requirement" description={requirement} />}><span>{requirement}</span></GameTooltip>)}</div>
    <div className={`artifact-inspector-state artifact-inspector-state-${eligibility.status}`}><span>PATH STATE</span><strong>{eligibilityLabel(eligibility.status, node, eligibility.missingPrerequisiteIds)}</strong></div>
    <Button variant={allocated ? 'secondary' : 'primary'} disabled={!eligibility.canAllocate || allocated} tooltip={eligibility.canAllocate ? undefined : eligibilityLabel(eligibility.status, node, eligibility.missingPrerequisiteIds)} onClick={() => { if (state.allocateArtifactNode(artifactId, node.id)) onAllocated() }}>{actionLabel}</Button>
  </section>
}

export function ArtifactInspectorEmpty({ level, availablePoints }: { level: number; availablePoints: number }) {
  return <div className="artifact-node-inspector-empty"><span className="artifact-empty-glyph">◇</span><strong>SELECT A NODE</strong><p>Choose a node in the path to inspect its effects, requirements, and unlock state.</p><span className="artifact-inspector-status">Level {level} · {availablePoints} points available</span></div>
}

function eligibilityLabel(status: ReturnType<typeof getArtifactNodeEligibility>['status'], node: ArtifactNodeDefinition, missingPrerequisiteIds: string[]) {
  switch (status) {
    case 'allocated': return 'ALLOCATED'
    case 'attuned': return 'ATTUNED · AVAILABLE'
    case 'available': return 'AVAILABLE'
    case 'unowned': return 'ARTIFACT NOT OWNED'
    case 'missingLevel': return `REQUIRES LEVEL ${node.requiresLevel}`
    case 'missingPoints': return `NEED ${node.pointCost} POINT${node.pointCost === 1 ? '' : 'S'}`
    case 'missingPrerequisites': return `REQUIRES ${missingPrerequisiteIds.length} PRIOR NODE${missingPrerequisiteIds.length === 1 ? '' : 'S'}`
    case 'missingBoss': return 'BOSS GATE LOCKED'
    case 'missingCatalyst': return 'CATALYST REQUIRED'
  }
}
