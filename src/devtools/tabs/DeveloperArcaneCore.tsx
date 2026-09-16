import { useMemo, useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_RANK_COSTS } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { formatArcaneCoreModifierValue, getArcaneCoreModifierLabel } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { validateArcaneCoreCatalog } from '../../game/systems/arcaneCore/arcaneCoreValidation'
import { getArcaneCoreNodeProgress } from '../../game/systems/arcaneCore/arcaneCoreProgression'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperArcaneCore() {
  const state = useGameStore()
  const [selectedNodeId, setSelectedNodeId] = useState(ARCANE_CORE_BRANCHES[0]?.nodes[0]?.id ?? '')
  const nodes = useMemo(() => ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes.map((node) => ({ ...node, branchName: branch.name }))), [])
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]
  const selectedProgress = selectedNode ? getArcaneCoreNodeProgress(state.arcaneCore, selectedNode.id) : null
  const diagnostics = validateArcaneCoreCatalog()
  const unlocked = Object.values(state.arcaneCore.nodes).filter((node) => node.unlocked).length
  const setPoints = state.setArcaneCorePoints
  const setEssence = state.setArcaneEssence

  return <div className="developer-tab-stack developer-arcane-core-tab">
    <Card title="Arcane Core · tester controls" action={<Status tone="warning">DEV SESSION ONLY</Status>}>
      <div className="developer-summary-grid"><Summary label="Core Points" value={state.arcaneCore.corePoints} /><Summary label="Arcane Essence" value={state.arcaneCore.arcaneEssence} /><Summary label="Nodes online" value={`${unlocked} / 256`} /><Summary label="Rank costs" value={ARCANE_CORE_RANK_COSTS.join(' · ')} /></div>
      <div className="developer-form-grid"><NumberField label="Set Core Points" value={state.arcaneCore.corePoints} onChange={setPoints} min={0} /><NumberField label="Set Arcane Essence" value={state.arcaneCore.arcaneEssence} onChange={setEssence} min={0} /></div>
      <div className="button-row"><Button onClick={() => state.grantArcaneCorePoints(1)}>+1 Core Point</Button><Button onClick={() => state.grantArcaneCorePoints(10)}>+10 Core Points</Button><Button variant="secondary" onClick={() => state.grantArcaneEssence(1)}>+1 Essence</Button><Button variant="secondary" onClick={() => state.grantArcaneEssence(100)}>+100 Essence</Button><Button variant="ghost" onClick={() => { setPoints(0); setEssence(0) }}>Clear wallet</Button></div>
    </Card>
    <Card title="Progression flags" className="developer-debug-card">
      <p className="muted">Runtime-only flags make authored routes and costs testable without altering the profile save.</p>
      <div className="developer-arcane-core-toggle-grid"><GameTooltip content="Remove Core Point and Essence costs for Arcane Core actions during this session."><label className="developer-check-row"><input type="checkbox" checked={state.debug.arcaneCoreFreeCosts} onChange={(event) => state.setDebugArcaneCoreFreeCosts(event.target.checked)} /> Free Core costs</label></GameTooltip><GameTooltip content="Allow nodes to unlock without completed prerequisite routes during this session."><label className="developer-check-row"><input type="checkbox" checked={state.debug.arcaneCoreIgnorePrerequisites} onChange={(event) => state.setDebugArcaneCoreIgnorePrerequisites(event.target.checked)} /> Ignore prerequisites</label></GameTooltip></div>
    </Card>
    <div className="developer-tab-grid">
      <Card title="Node controls"><label className="developer-select-field">SELECT NODE<select aria-label="Developer Arcane Core node" value={selectedNode?.id ?? ''} onChange={(event) => setSelectedNodeId(event.target.value)}>{nodes.map((node) => <option value={node.id} key={node.id}>{node.branchName} · {node.name}</option>)}</select></label>{selectedNode && selectedProgress && <div className="developer-summary-grid"><Summary label="Status" value={selectedProgress.unlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={`${selectedProgress.rank} / 5`} /><Summary label="Effect" value={`${getArcaneCoreModifierLabel(selectedNode.effect.key)} ${formatArcaneCoreModifierValue(selectedNode.effect.key, selectedNode.effect.perRank)}`} /><Summary label="Route" value={selectedNode.prerequisites.length ? selectedNode.prerequisiteMode : 'Starter'} /></div>}<div className="button-row"><Button disabled={!selectedNode} onClick={() => selectedNode && state.unlockArcaneCoreNode(selectedNode.id)}>UNLOCK</Button><Button disabled={!selectedNode} onClick={() => selectedNode && state.rankUpArcaneCoreNode(selectedNode.id)}>+1 RANK</Button><Button variant="secondary" disabled={!selectedNode} onClick={() => selectedNode && state.maxArcaneCoreNode(selectedNode.id)}>MAX NODE</Button><Button variant="ghost" disabled={!selectedNode} onClick={() => selectedNode && state.refundArcaneCoreNode(selectedNode.id)}>REFUND CASCADE</Button></div></Card>
      <Card title="Branch / reset controls" className="developer-debug-card"><div className="developer-button-grid">{ARCANE_CORE_BRANCHES.map((branch) => <Button key={branch.id} variant="secondary" onClick={() => state.maxArcaneCoreBranch(branch.id)}>MAX {branch.name.toUpperCase()}</Button>)}<Button onClick={() => state.maxAllArcaneCore()}>MAX ALL BRANCHES</Button><Button variant="ghost" onClick={() => state.resetArcaneCore()}>RESET ALL CORE</Button></div></Card>
    </div>
    <Card title="Reward simulation"><p className="muted">Small grants mirror authored normal-kill and boss-defeat Arcane Core rewards for focused tester checks.</p><div className="button-row"><Button variant="secondary" onClick={() => state.grantArcaneEssence(1)}>SIMULATE NORMAL KILL · +1 ESSENCE</Button><Button variant="secondary" onClick={() => { state.grantArcaneCorePoints(1); state.grantArcaneEssence(10) }}>SIMULATE BOSS DEFEAT · +1 CORE / +10 ESSENCE</Button></div></Card>
    <Card title="Catalog diagnostics" className="developer-debug-card"><div className="developer-summary-grid"><Summary label="Branches" value={ARCANE_CORE_BRANCHES.length} /><Summary label="Nodes" value={nodes.length} /><Summary label="Validation errors" value={diagnostics.length} /><Summary label="State entries" value={Object.keys(state.arcaneCore.nodes).length} /></div><Status tone={diagnostics.length === 0 ? 'success' : 'warning'}>{diagnostics.length === 0 ? 'CATALOG VALID' : 'CATALOG NEEDS REVIEW'}</Status>{diagnostics.length > 0 && <pre className="developer-json">{diagnostics.join('\n')}</pre>}</Card>
  </div>
}
