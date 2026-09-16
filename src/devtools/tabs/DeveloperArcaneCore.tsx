import { useMemo, useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { formatArcaneCoreNodeEffect } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { getArcaneCoreLevelInfo, getArcaneCoreNodeProgress, isArcaneCoreNodeReachable } from '../../game/systems/arcaneCore/arcaneCoreProgression'
import { validateArcaneCoreCatalog } from '../../game/systems/arcaneCore/arcaneCoreValidation'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperArcaneCore() {
  const state = useGameStore()
  const [selectedNodeId, setSelectedNodeId] = useState(ARCANE_CORE_BRANCHES[0]?.nodes[0]?.id ?? '')
  const nodes = useMemo(() => ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes.map((node) => ({ ...node, branchName: branch.name }))), [])
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]
  const selectedProgress = selectedNode ? getArcaneCoreNodeProgress(state.arcaneCore, selectedNode.id) : null
  const levelInfo = getArcaneCoreLevelInfo(state.arcaneCore)
  const diagnostics = validateArcaneCoreCatalog()
  const purchased = Object.values(state.arcaneCore.nodes).filter((node) => node?.purchased).length
  const purchaseIgnoringPrerequisites = () => {
    if (!selectedNode) return
    state.setDebugArcaneCoreIgnorePrerequisites(true)
    state.purchaseArcaneCoreNode(selectedNode.id)
    state.setDebugArcaneCoreIgnorePrerequisites(false)
  }

  return <div className="developer-tab-stack developer-arcane-core-tab">
    <Card title="Arcane Core · tester controls" action={<Status tone="warning">DEV SESSION ONLY</Status>}>
      <div className="developer-summary-grid"><Summary label="Level" value={levelInfo.level} /><Summary label="Total XP" value={levelInfo.totalXp} /><Summary label="XP to next" value={levelInfo.xpToNextLevel || 'MAX'} /><Summary label="Points earned" value={levelInfo.pointsEarned} /><Summary label="Points spent" value={levelInfo.pointsSpent} /><Summary label="Points available" value={levelInfo.pointsAvailable} /><Summary label="Purchased nodes" value={`${purchased} / ${nodes.length}`} /></div>
      <div className="developer-form-grid"><NumberField label="Set Arcane Core XP" value={levelInfo.totalXp} onChange={state.setArcaneCoreXp} min={0} /><NumberField label="Set Arcane Core Level" value={levelInfo.level} onChange={state.setArcaneCoreLevel} min={1} max={ARCANE_CORE_MAX_LEVEL} /></div>
      <div className="button-row"><Button onClick={() => state.grantArcaneCoreXp(100)}>+100 XP</Button><Button onClick={() => state.grantArcaneCoreXp(1000)}>+1,000 XP</Button><Button variant="secondary" onClick={() => state.setArcaneCoreLevel(ARCANE_CORE_MAX_LEVEL)}>MAX LEVEL</Button><Button variant="primary" onClick={state.maxArcaneCoreLevelAndPurchaseAll}>MAX LEVEL + PURCHASE ALL</Button><Button variant="ghost" onClick={() => { state.setArcaneCoreXp(0); state.resetArcaneCore() }}>RESET XP + ALLOCATION</Button></div>
    </Card>
    <Card title="Progression flags" className="developer-debug-card"><p className="muted">Runtime-only flags make authored routes and costs testable without changing the profile save format.</p><div className="developer-arcane-core-toggle-grid"><GameTooltip content="Remove Core Point costs for Arcane Core purchases during this session."><label className="developer-check-row"><input type="checkbox" checked={state.debug.arcaneCoreFreeCosts} onChange={(event) => state.setDebugArcaneCoreFreeCosts(event.target.checked)} /> Free Core costs</label></GameTooltip><GameTooltip content="Allow Arcane Core nodes to be purchased without completed prerequisite routes during this session."><label className="developer-check-row"><input type="checkbox" checked={state.debug.arcaneCoreIgnorePrerequisites} onChange={(event) => state.setDebugArcaneCoreIgnorePrerequisites(event.target.checked)} /> Ignore prerequisites</label></GameTooltip></div></Card>
    <div className="developer-tab-grid">
      <Card title="Node controls"><label className="developer-select-field">SELECT NODE<select aria-label="Developer Arcane Core node" value={selectedNode?.id ?? ''} onChange={(event) => setSelectedNodeId(event.target.value)}>{nodes.map((node) => <option value={node.id} key={node.id}>{node.branchName} · {node.name}</option>)}</select></label>{selectedNode && selectedProgress && <div className="developer-summary-grid"><Summary label="Status" value={selectedProgress.purchased ? 'Purchased' : isArcaneCoreNodeReachable(state.arcaneCore, selectedNode.id) ? 'Available' : 'Locked'} /><Summary label="Type" value={selectedNode.nodeType} /><Summary label="Cost" value={`${selectedNode.cost} Core Point`} /><Summary label="Effect" value={formatArcaneCoreNodeEffect(selectedNode)} /><Summary label="Route" value={selectedNode.prerequisites.length ? selectedNode.prerequisiteMode : 'Starter'} /></div>}<div className="button-row"><Button disabled={!selectedNode || selectedProgress?.purchased} onClick={() => selectedNode && state.purchaseArcaneCoreNode(selectedNode.id)}>PURCHASE</Button><Button variant="secondary" disabled={!selectedNode || selectedProgress?.purchased} onClick={purchaseIgnoringPrerequisites}>PURCHASE IGNORE ROUTE</Button><Button variant="ghost" disabled={!selectedNode || !selectedProgress?.purchased} onClick={() => selectedNode && state.refundArcaneCoreNode(selectedNode.id)}>REFUND SELECTED</Button></div></Card>
      <Card title="Branch / reset controls" className="developer-debug-card"><div className="developer-button-grid">{ARCANE_CORE_BRANCHES.map((branch) => <Button key={branch.id} variant="secondary" onClick={() => state.purchaseAllArcaneCoreBranch(branch.id)}>PURCHASE {branch.name.toUpperCase()}</Button>)}<Button onClick={state.purchaseAllArcaneCore}>PURCHASE ALL</Button><Button variant="ghost" onClick={state.resetArcaneCore}>RESET ALL ALLOCATION</Button>{ARCANE_CORE_BRANCHES.map((branch) => <Button key={`reset-${branch.id}`} variant="ghost" onClick={() => state.resetArcaneCoreBranch(branch.id)}>RESET {branch.name.toUpperCase()}</Button>)}</div></Card>
    </div>
    <Card title="Catalog diagnostics" className="developer-debug-card"><div className="developer-summary-grid"><Summary label="Branches" value={ARCANE_CORE_BRANCHES.length} /><Summary label="Nodes" value={nodes.length} /><Summary label="Validation errors" value={diagnostics.length} /><Summary label="State entries" value={Object.keys(state.arcaneCore.nodes).length} /></div><Status tone={diagnostics.length === 0 ? 'success' : 'warning'}>{diagnostics.length === 0 ? 'CATALOG VALID' : 'CATALOG NEEDS REVIEW'}</Status>{diagnostics.length > 0 && <pre className="developer-json">{diagnostics.join('\n')}</pre>}</Card>
  </div>
}
