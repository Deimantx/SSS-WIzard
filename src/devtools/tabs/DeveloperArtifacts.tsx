import { useEffect, useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { ITEMS } from '../../game/content/items/items'
import { getArtifactAvailablePoints, getArtifactLevel, getArtifactLevelCap, getArtifactProgress, getArtifactSpentPoints, getArtifactTotalPoints } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { setArtifactDevPanelVisible, useDeveloperToolsStore } from '../developerToolsStore'
import { DeveloperAdvancedSection, DeveloperSection } from '../components/DeveloperBrowser'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const artifactIds = Object.keys(ARTIFACTS).filter((id): id is ArtifactId => Boolean(ARTIFACTS[id as ArtifactId]))

export function DeveloperArtifacts() {
  const state = useGameStore()
  const session = useDeveloperToolsStore()
  const [selectedId, setSelectedId] = useState<ArtifactId>(artifactIds[0] ?? 'ember-staff')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const definition = ARTIFACTS[selectedId]
  const item = ITEMS[selectedId]
  const progress = getArtifactProgress(state, selectedId)
  const level = getArtifactLevel(state, selectedId)
  const cap = getArtifactLevelCap(state, selectedId)
  const nodes = definition?.nodes ?? []
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]
  useEffect(() => { setSelectedNodeId(ARTIFACTS[selectedId]?.nodes[0]?.id ?? '') }, [selectedId])
  if (!definition || !item) return null

  return <div className="developer-tab-stack developer-artifacts-tab">
    <Card title="Artifacts · path tester">
      <div className="developer-artifact-selector"><label htmlFor="developer-artifact-target">ARTIFACT TARGET</label><select id="developer-artifact-target" aria-label="Developer artifact target" value={selectedId} onChange={(event) => setSelectedId(event.target.value as ArtifactId)}>{artifactIds.map((id) => <option key={id} value={id}>{ITEMS[id]?.name ?? id}</option>)}</select><Button variant={session.showArtifactDevPanel ? 'secondary' : 'ghost'} ariaLabel="Show Artifact Path Dev Panel" tooltip="Show or hide compact developer controls inside an open Artifact Path." onClick={() => setArtifactDevPanelVisible(!session.showArtifactDevPanel)}>{session.showArtifactDevPanel ? 'HIDE PATH MINI PANEL' : 'SHOW PATH MINI PANEL'}</Button></div>
      <div className="developer-summary-grid"><Summary label="Level / cap" value={`${level} / ${cap}`} /><Summary label="Absolute max" value={definition.maxLevel} /><Summary label="Available points" value={getArtifactAvailablePoints(state, selectedId)} /><Summary label="Spent points" value={getArtifactSpentPoints(state, selectedId)} /><Summary label="Total points" value={getArtifactTotalPoints(state, selectedId)} /><Summary label="Attuned" value={progress.attunedNodeIds.length} /><Summary label="Allocated nodes" value={progress.allocatedNodeIds.length} /><Summary label="Capstones" value={`${progress.allocatedNodeIds.filter((id) => definition.nodes.find((node) => node.id === id)?.type === 'capstone').length} / ${definition.nodes.filter((node) => node.type === 'capstone').length}`} /></div>
      <div className="developer-artifact-gate-status"><Status tone={state.progress.forestHeartUnlocked ? 'success' : 'locked'}>{state.progress.forestHeartUnlocked ? 'FOREST HEART CLEARED' : 'FOREST HEART GATE PENDING'}</Status><span>{state.progress.guildUnlocked ? 'Guild progression available' : 'Early progression state'}</span></div>
    </Card>

    <div className="developer-tab-grid">
      <Card title="Level and point controls" className="developer-debug-card">
        <DeveloperSection title="Level"><NumberField label="Set valid level" value={level} onChange={(value) => state.debugSetArtifactLevel(selectedId, value)} /><div className="button-row"><Button tooltip="Increase the selected Artifact by one developer level." onClick={() => state.debugIncreaseArtifactLevel(selectedId)}>+1 LEVEL</Button><Button tooltip="Set the selected Artifact to its current progression cap." onClick={() => state.debugSetArtifactLevel(selectedId, cap)}>MAX TO CAP</Button><Button variant="secondary" tooltip="Set the selected Artifact to its authored absolute maximum." onClick={() => state.debugSetArtifactLevel(selectedId, definition.maxLevel)}>MAX ABSOLUTE</Button><Button variant="ghost" tooltip="Return the selected Artifact to level one." onClick={() => state.debugSetArtifactLevel(selectedId, 1)}>RESET LEVEL</Button></div></DeveloperSection>
        <DeveloperSection title="Path points"><div className="button-row"><Button tooltip="Grant one temporary developer point to the selected Artifact." onClick={() => state.debugGrantArtifactPoints(selectedId, 1)}>+1 POINT</Button><Button tooltip="Fill the selected Artifact with a large temporary point pool for path testing." onClick={() => state.debugRefillArtifactPoints(selectedId)}>REFILL POINTS</Button><Button variant="ghost" tooltip="Refund allocated points through the normal respec behavior." onClick={() => state.debugResetArtifactPath(selectedId)}>RESPEC PATH</Button></div></DeveloperSection>
      </Card>

      <Card title="Node controls" className="developer-debug-card">
        <DeveloperSection title="Selected node"><div className="developer-artifact-node-picker"><ItemIcon itemId={selectedId} size="tile" /><select aria-label="Developer selected artifact node" value={selectedNode?.id ?? ''} onChange={(event) => setSelectedNodeId(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.name} · {node.type}</option>)}</select></div><div className="button-row"><Button disabled={!selectedNode} tooltip="Allocate the selected node with ordinary eligibility and resource checks." onClick={() => selectedNode && state.debugAllocateArtifactNode(selectedId, selectedNode.id)}>NORMAL UNLOCK</Button><Button disabled={!selectedNode} variant="secondary" tooltip="Force the selected node allocated and attuned without paying its requirements." onClick={() => selectedNode && state.debugForceArtifactNode(selectedId, selectedNode.id)}>FORCE SELECTED</Button><Button disabled={!selectedNode} variant="ghost" tooltip="Lock the selected node when no allocated child depends on it." onClick={() => selectedNode && state.debugLockArtifactNode(selectedId, selectedNode.id)}>LOCK IF SAFE</Button></div></DeveloperSection>
        <DeveloperSection title="Path batch"><div className="button-row"><Button tooltip="Force every non-capstone node on the selected path." onClick={() => state.debugUnlockArtifactNodes(selectedId, 'non-capstone')}>UNLOCK NON-CAPSTONES</Button><Button tooltip="Force every node on the selected path, including capstones." onClick={() => state.debugUnlockArtifactNodes(selectedId, 'all')}>UNLOCK ALL NODES</Button><Button variant="ghost" tooltip="Force only capstone nodes on the selected path." onClick={() => state.debugUnlockArtifactNodes(selectedId, 'capstones')}>FORCE CAPSTONES</Button></div></DeveloperSection>
      </Card>
    </div>

    <Card title="Artifact override switches" className="developer-debug-card developer-artifact-overrides">
      <p className="muted">DEV ONLY · These switches apply to the current session, are visibly marked, and are excluded from profile saves.</p>
      <div className="developer-artifact-toggle-grid"><OverrideToggle label="Ignore dungeon / boss gates" checked={state.debug.artifactIgnoreDungeonGate} onChange={state.setDebugArtifactIgnoreDungeonGate} /><OverrideToggle label="Ignore level cap" checked={state.debug.artifactIgnoreLevelCap} onChange={state.setDebugArtifactIgnoreLevelCap} /><OverrideToggle label="Ignore node prerequisites" checked={state.debug.artifactIgnoreNodePrerequisites} onChange={state.setDebugArtifactIgnoreNodePrerequisites} /><OverrideToggle label="Allow beyond normal limit" checked={state.debug.artifactAllowBeyondLimit} onChange={state.setDebugArtifactAllowBeyondLimit} /><OverrideToggle label="Free upgrade mode" checked={state.debug.artifactFreeUpgrade} onChange={state.setDebugArtifactFreeUpgrade} /></div>
    </Card>

    <Card title="Batch and tester actions">
      <div className="button-row"><Button tooltip="Max every currently owned Artifact to its current dungeon progression cap." onClick={() => state.debugMaxArtifactLevels(false)}>MAX ALL CURRENT CAPS</Button><Button tooltip="Max every currently owned Artifact to its absolute authored level." onClick={() => state.debugMaxArtifactLevels(true)}>MAX ALL ABSOLUTE</Button><Button variant="secondary" tooltip="Grant every Artifact, set them to maximum level, and force every path node." onClick={() => state.debugUnlockAllArtifactPaths()}>UNLOCK ALL PATHS</Button><Button variant="ghost" tooltip="Reset allocated nodes and temporary point pools on every Artifact path." onClick={() => state.debugResetAllArtifactPaths()}>RESET ALL PATHS</Button><Button variant="ghost" tooltip="Grant a tester quantity of every Artifact forge, upgrade, and catalyst material." onClick={() => state.debugGrantArtifactMaterials()}>GRANT ARTIFACT MATERIALS</Button></div>
      <div className="button-row developer-artifact-qol"><Button tooltip="Jump to the Artificing screen where the selected Artifact can open its path." onClick={() => state.setScreen('tower-artificing')}>OPEN ARTIFICTING</Button><Status tone="warning">DEV SESSION ONLY</Status></div>
    </Card>

    <DeveloperAdvancedSection title="Advanced Artifact diagnostics"><div className="developer-detail-grid"><span>Artifact ID<strong>{selectedId}</strong></span><span>Selected node<strong>{selectedNode?.id ?? 'none'}</strong></span><span>Owned<strong>{state.inventory[selectedId] ?? 0}</strong></span><span>Forge gate<strong>{state.progress.emberStaffUnlocked ? 'progressed' : 'pending'}</strong></span></div><pre className="developer-json">{JSON.stringify({ artifactId: selectedId, level, cap, progress, debug: { artifactIgnoreDungeonGate: state.debug.artifactIgnoreDungeonGate, artifactIgnoreLevelCap: state.debug.artifactIgnoreLevelCap, artifactIgnoreNodePrerequisites: state.debug.artifactIgnoreNodePrerequisites, artifactAllowBeyondLimit: state.debug.artifactAllowBeyondLimit } }, null, 2)}</pre></DeveloperAdvancedSection>
  </div>
}

function OverrideToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (enabled: boolean) => void }) {
  return <GameTooltip content={`${label}. DEV ONLY session override.`}><label className={`developer-artifact-toggle${checked ? ' active' : ''}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span>{checked && <Status tone="warning">ON</Status>}</label></GameTooltip>
}
