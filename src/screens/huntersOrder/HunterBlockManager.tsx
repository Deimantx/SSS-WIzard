import { Button, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { MONSTERS } from '../../game/content/monsters'
import { DEFAULT_HUNTER_GROUND_ID } from '../../game/content/huntersOrder/hunterGrounds'
import { getEligibleHunterContractMembers, getHunterBlockSlotCount, getHunterBlockableTargets } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { useGameStore } from '../../store/gameStore'
import type { GameState } from '../../game/types'

export function HunterBlockManager({ state, open, onClose }: { state: GameState; open: boolean; onClose: () => void }) {
  const order = state.progress.huntersOrder
  const active = order.activeContract
  const blockSlots = getHunterBlockSlotCount(state)
  const blocked = new Set(order.blockedTargets)
  const blockableTargets = getHunterBlockableTargets(state)
  const methods = useGameStore.getState()
  return <ModalPortal open={open} onClose={onClose} backdropClassName="hunter-block-modal-backdrop" surfaceClassName="hunter-block-modal" ariaLabel="Target Blocks"><header><div><span className="eyebrow">ORDER BOARD CONTROL</span><h2>TARGET BLOCKS</h2><p>{order.blockedTargets.length} / {blockSlots} slots used</p></div><Button variant="ghost" onClick={onClose}>CLOSE</Button></header><div role="region" className="hunter-block-list" aria-label="Blockable targets">{blockableTargets.map((id) => { const isBlocked = blocked.has(id); const isActive = Boolean(active && getEligibleHunterContractMembers(state, active, active.huntingGroundId ?? DEFAULT_HUNTER_GROUND_ID).includes(id)); const leavesNoQuarry = !isBlocked && blockableTargets.filter((targetId) => targetId !== id && !blocked.has(targetId)).length < 1; return <div className="hunter-block-row" key={id}><div><strong>{MONSTERS[id]?.name ?? id}</strong>{isBlocked && <Status tone="warning">BLOCKED FROM FUTURE CONTRACTS</Status>}{isActive && <span>ACTIVE CONTRACT TARGET</span>}</div><GameTooltip content={isBlocked ? 'Return this quarry to future contract offers.' : isActive ? 'The active contract target cannot be blocked.' : leavesNoQuarry ? 'At least one regular quarry must remain eligible.' : 'Exclude this quarry from future offers.'}><Button variant={isBlocked ? 'secondary' : 'ghost'} disabled={isActive || (!isBlocked && (order.blockedTargets.length >= blockSlots || leavesNoQuarry))} onClick={() => methods.setHunterTargetBlocked(id, !isBlocked)}>{isBlocked ? 'UNBLOCK' : 'BLOCK'}</Button></GameTooltip></div>})}</div><footer>{order.blockedTargets.length > 0 && <Button variant="secondary" onClick={() => methods.clearHunterTargetBlocks()}>CLEAR ALL BLOCKS</Button>}<Button variant="primary" onClick={onClose}>DONE</Button></footer></ModalPortal>
}
