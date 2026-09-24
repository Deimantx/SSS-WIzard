import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { getArtifactEffectsPresentation, getArtifactMajorPresentation, getArtifactMinorPresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactMinorRank, getArtifactRankCost, getArtifactTotalInvestedRanks } from '../../game/systems/artifacts/artifactProgression'
import { ARTIFACTS, type ArtifactMajorMilestoneDefinition, type ArtifactMinorNodeDefinition } from '../../game/content/artifacts/artifacts'
import { ITEMS } from '../../game/content/items/items'
import type { ArtifactId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'

export function ArtifactNodeInspector({ state, artifactId, nodeId, onUpdated }: { state: GameStore; artifactId: ArtifactId; nodeId: string; onUpdated: () => void }) {
  const definition = ARTIFACTS[artifactId]
  const minor = definition?.minorNodes.find((node) => node.id === nodeId)
  const major = definition?.majorMilestones.find((node) => node.id === nodeId)
  if (!definition || (!minor && !major)) return null
  if (minor) return <MinorInspector state={state} artifactId={artifactId} node={minor} onUpdated={onUpdated} />
  return <MajorInspector state={state} artifactId={artifactId} major={major!} />
}

function MinorInspector({ state, artifactId, node, onUpdated }: { state: GameStore; artifactId: ArtifactId; node: ArtifactMinorNodeDefinition; onUpdated: () => void }) {
  const rank = getArtifactMinorRank(state, artifactId, node.id)
  const cost = rank < node.maxRank ? getArtifactRankCost(artifactId, node.id, rank + 1) : null
  const presentation = getArtifactMinorPresentation(node, rank)
  const canBuy = rank < node.maxRank && Boolean(cost) && (state.debug.artifactFreeRankPurchase || ((state.inventory['artifact-essence'] ?? 0) >= (cost?.artifactEssence ?? Infinity) && (!cost?.fragment || (state.inventory[cost.fragment.itemId] ?? 0) >= cost.fragment.quantity) && (!cost?.prismaticFragment || (state.inventory['prismatic-fragment'] ?? 0) >= cost.prismaticFragment)))
  return <section className="artifact-node-inspector" aria-label="Minor Artifact rank inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-minor">●</span><div><div className="artifact-inspector-kicker"><span>MINOR NODE</span><span>{rank} / 10</span></div><h3 className="artifact-inspector-title">{node.name}</h3></div></div><p className="artifact-inspector-summary">{node.description}</p><div className="artifact-inspector-effect-list"><strong>EFFECTS</strong>{presentation.details.map((detail) => <span key={detail}>{detail}</span>)}</div>{cost && <div className="artifact-inspector-requirements"><strong>NEXT RANK COST</strong><span>{cost.artifactEssence.toLocaleString()} Artifact Essence</span>{cost.fragment && <span>{cost.fragment.quantity.toLocaleString()} {ITEMS[cost.fragment.itemId]?.name ?? cost.fragment.itemId}</span>}{cost.prismaticFragment && <span>{cost.prismaticFragment.toLocaleString()} Prismatic Fragment</span>}{Object.entries(cost.resonance).map(([type, amount]) => <GameTooltip key={type} content={<TooltipContent title="Resonance cost" description="This rank consumes the required resonance atomically." />}><span>{type.toUpperCase()} · {amount}</span></GameTooltip>)}</div>}{cost && <Button variant="primary" disabled={!canBuy} tooltip={!canBuy ? 'Not enough materials or resonance for this rank.' : 'Purchase one Minor rank.'} onClick={() => { if (state.purchaseArtifactRank(artifactId, node.id)) onUpdated() }}>{rank >= node.maxRank ? 'MAX RANK' : `PURCHASE RANK ${rank + 1}`}</Button>}{!cost && <Button variant="secondary" disabled>MAX RANK</Button>}</section>
}

function MajorInspector({ state, artifactId, major }: { state: GameStore; artifactId: ArtifactId; major: ArtifactMajorMilestoneDefinition }) {
  const total = getArtifactTotalInvestedRanks(state, artifactId)
  const active = total >= major.unlockAtTotalRanks
  const presentation = getArtifactMajorPresentation(major)
  return <section className="artifact-node-inspector" aria-label="Major Artifact milestone inspector"><div className="artifact-inspector-node-heading"><span className="artifact-inspector-node-icon artifact-inspector-node-icon-major">◆</span><div><div className="artifact-inspector-kicker"><span>MAJOR MILESTONE</span><span>{major.unlockAtTotalRanks} TOTAL</span></div><h3 className="artifact-inspector-title">{major.name}</h3></div></div><p className="artifact-inspector-summary">{active ? 'ACTIVE' : `Invest ${Math.max(0, major.unlockAtTotalRanks - total)} more Minor ranks to unlock this milestone.`}</p><div className="artifact-inspector-effect-list"><strong>EFFECTS</strong>{presentation.details.map((detail) => <span key={detail}>{detail}</span>)}</div><div className={`artifact-inspector-state artifact-inspector-state-${active ? 'active' : 'locked'}`}><span>PROGRESS</span><strong>{total} / {major.unlockAtTotalRanks} TOTAL RANKS</strong></div></section>
}

export function ArtifactInspectorEmpty({ investedRanks, nextMilestone }: { investedRanks: number; nextMilestone: number | null }) {
  return <div className="artifact-node-inspector-empty"><span className="artifact-empty-glyph">◇</span><strong>SELECT A NODE</strong><p>Choose a Minor circle or Major square to inspect effects, costs, and milestone progress.</p><span className="artifact-inspector-status">{investedRanks} ranks invested · {nextMilestone === null ? 'ALL MAJORS ACTIVE' : `NEXT MAJOR AT ${nextMilestone}`}</span></div>
}
