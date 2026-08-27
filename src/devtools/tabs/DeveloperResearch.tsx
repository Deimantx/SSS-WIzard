import { Button, Card, Status } from '../../components/ui'
import { BALANCE } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getPreparedResearchCount, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchFocusReserved, getResearchJobStatus } from '../../game/systems/research/researchSelectors'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import type { ResearchSlotId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperResearch() {
  const state = useGameStore()
  const prepare = state.prepareResearch
  const clear = state.clearPreparedResearch
  const setEchoes = state.setResearchEchoes
  const preset = () => {
    clear()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school) => { state.addItem(`${school}-fragment`, 100); prepare(`${school}-fragment`, school, 50) })
    RESEARCH_SLOT_ORDER.forEach((slotId, index) => setEchoes(slotId, index === 0 ? 2 : 1))
  }
  const assign = (slotId: ResearchSlotId, amount: number) => setEchoes(slotId, amount)
  return <div className="developer-tab-grid">
    <Card title="Research runtime"><div className="developer-summary-grid"><Summary label="Prepared batches" value={`${getPreparedResearchCount(state)} / ${BALANCE.research.maxPreparedSlots}`} /><Summary label="Research Echoes" value={`${getResearchEchoesAssigned(state)} / ${getResearchEchoCapacity(state)}`} /><Summary label="Focus reserved" value={getResearchFocusReserved(state)} /><Summary label="Mana" value={Math.floor(state.player.mana)} /></div><div className="button-row"><Button variant="secondary" onClick={preset}>Prepare four test batches</Button><Button variant="ghost" onClick={clear}>Clear prepared Research</Button></div></Card>
    <Card title="Slot controls"><div className="developer-research-slots">{RESEARCH_SLOT_ORDER.map((slotId) => { const job = state.activities.research.slots[slotId]; if (!job) return <Status key={slotId}> {slotId} EMPTY </Status>; return <div key={slotId}><span><strong>{ITEMS[job.itemId].name} → {SCHOOLS[job.targetSchoolId].name}</strong><small>{getResearchJobStatus(state, slotId)} · {job.remainingQuantity} remaining</small></span><NumberField label={`${slotId} Echoes`} value={job.echoesAssigned} onChange={(value) => assign(slotId, value)} /><Button variant="success" onClick={() => state.forceResearchCycle(slotId)}>Force one cycle</Button></div> })}</div></Card>
  </div>
}
