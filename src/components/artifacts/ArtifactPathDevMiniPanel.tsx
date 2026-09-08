import { Button, GameTooltip } from '../ui'
import { getArtifactLevel, getArtifactLevelCap, getArtifactNodeEligibility, getArtifactAvailablePoints } from '../../game/systems/artifacts/artifactProgression'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import type { ArtifactId, GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { setArtifactDevPanelVisible, useDeveloperToolsStore } from '../../devtools/developerToolsStore'

export function ArtifactPathDevMiniPanel({ state, artifactId, selectedNodeId }: { state: GameState; artifactId: ArtifactId; selectedNodeId: string | null }) {
  const session = useDeveloperToolsStore()
  const actions = useGameStore()
  const definition = ARTIFACTS[artifactId]
  if (!session.showArtifactDevPanel || !definition) return null
  const level = getArtifactLevel(state, artifactId)
  const cap = getArtifactLevelCap(state, artifactId)
  const selectedNode = selectedNodeId ? definition.nodes.find((node) => node.id === selectedNodeId) : null
  const selectedEligibility = selectedNode ? getArtifactNodeEligibility(state, artifactId, selectedNode.id) : null
  return <aside className="artifact-path-dev-mini" aria-label="Artifact Path developer panel">
    <div className="artifact-path-dev-mini-header"><div><span className="eyebrow">DEV ONLY</span><strong>PATH CONTROL</strong></div><GameTooltip content="Hide the compact developer panel in Artifact Path"><button type="button" className="icon-button" aria-label="Hide Artifact Path Dev Panel" onClick={() => setArtifactDevPanelVisible(false)}>×</button></GameTooltip></div>
    <div className="artifact-path-dev-mini-summary"><span>LV {level} / {definition.maxLevel}</span><span>CAP {cap}</span><span>{getArtifactAvailablePoints(state, artifactId)} PTS</span></div>
    <div className="artifact-path-dev-mini-actions">
      <Button className="artifact-dev-mini-button" tooltip="Raise this Artifact one level without starting an Artificing job." onClick={() => actions.debugIncreaseArtifactLevel(artifactId)}>+1 LEVEL</Button>
      <Button className="artifact-dev-mini-button" tooltip="Set this Artifact to its currently available progression cap." onClick={() => actions.debugSetArtifactLevel(artifactId, cap)}>MAX TO CAP</Button>
      <Button className="artifact-dev-mini-button" variant="secondary" tooltip="Set this Artifact to its authored absolute maximum level." onClick={() => actions.debugSetArtifactLevel(artifactId, definition.maxLevel)}>MAX ABSOLUTE</Button>
      <Button className="artifact-dev-mini-button" variant="ghost" tooltip="Grant one temporary developer Artifact Point." onClick={() => actions.debugGrantArtifactPoints(artifactId, 1)}>+1 POINT</Button>
      <Button className="artifact-dev-mini-button" variant="ghost" disabled={!selectedNode} tooltip="Unlock the selected node, bypassing its normal requirements." onClick={() => selectedNode && actions.debugForceArtifactNode(artifactId, selectedNode.id)}>FORCE SELECTED</Button>
      <Button className="artifact-dev-mini-button" variant="ghost" disabled={!selectedNode} tooltip={selectedEligibility?.canAllocate ? 'Allocate the selected node using normal progression rules.' : 'The selected node is not currently eligible.'} onClick={() => selectedNode && actions.debugAllocateArtifactNode(artifactId, selectedNode.id)}>NORMAL ALLOCATE</Button>
      <Button className="artifact-dev-mini-button" variant="danger" tooltip="Reset allocated nodes for this path. Catalyst attunements remain as in normal respec." onClick={() => actions.debugResetArtifactPath(artifactId)}>RESET PATH</Button>
    </div>
    <div className="artifact-path-dev-mini-flags"><span>Overrides are session-only</span><span>{state.debug.artifactIgnoreDungeonGate || state.debug.artifactIgnoreLevelCap || state.debug.artifactIgnoreNodePrerequisites || state.debug.artifactAllowBeyondLimit ? 'ACTIVE' : 'OFF'}</span></div>
  </aside>
}
