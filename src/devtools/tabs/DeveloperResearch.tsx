import { Button, Card, Status } from '../../components/ui'
import { BALANCE } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import { formatDuration, formatNumber, formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { getResearchBatchEtaMs, getResearchEffectiveDuration, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchFocusReserved, getResearchJob, getResearchJobStatus, getResearchJobXpPerItem, getResearchManaPerSecond, getResearchNextLevelEtaMs, getResearchXpPerHour } from '../../game/systems/research/researchSelectors'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import type { ResearchSlotId, SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
const formatEta = (etaMs: number | null) => etaMs === null ? '—' : formatDuration(Math.max(0, etaMs))
const slotLabel = (slotId: ResearchSlotId) => `Research slot ${RESEARCH_SLOT_ORDER.indexOf(slotId) + 1}`

export function DeveloperResearch() {
  const state = useGameStore()
  const prepareFixture = () => { state.clearPreparedResearch(); schoolIds.forEach((school) => { const itemId = SCHOOLS[school].fragment; state.addItem(itemId, 100); state.prepareResearch(itemId, school, 50) }); RESEARCH_SLOT_ORDER.forEach((slotId, index) => state.setResearchEchoes(slotId, index === 0 ? 2 : 1)) }
  const setSchoolLevel = (schoolId: SchoolId, level: number) => state.setSchoolLevelDebug(schoolId, level)
  const setSchoolXp = (schoolId: SchoolId, xp: number) => state.setSchoolXpDebug(schoolId, xp)
  const setAtCurrentLevelStart = (schoolId: SchoolId) => { const info = getSchoolProgressInfo(state, schoolId); state.setSchoolLevelDebug(schoolId, info.level) }
  const setBeforeNextLevel = (schoolId: SchoolId) => { const info = getSchoolProgressInfo(state, schoolId); if (info.nextLevelXp !== null) state.setSchoolXpDebug(schoolId, info.nextLevelXp - 1) }
  const setNextLevel = (schoolId: SchoolId) => { const info = getSchoolProgressInfo(state, schoolId); if (info.nextLevelXp !== null) state.setSchoolLevelDebug(schoolId, info.level + 1) }

  return <div className="developer-tab-grid">
    <Card title="Research progression"><p className="muted">Research grants XP directly to the selected Magic School. Use the activity cards below to see live rates, durations, and level timing.</p><div className="developer-summary-grid"><Summary label="Research Echoes" value={`${getResearchEchoesAssigned(state)} / ${getResearchEchoCapacity(state)}`} /><Summary label="Focus reserved" value={formatNumber(getResearchFocusReserved(state))} /><Summary label="Prepared batches" value={`${RESEARCH_SLOT_ORDER.filter((slotId) => Boolean(getResearchJob(state, slotId))).length} / ${BALANCE.research.maxPreparedSlots}`} /><Summary label="XP gain" value="Shown per batch" /></div><div className="button-row"><Button variant="secondary" onClick={prepareFixture}>Prepare Test Research</Button><Button variant="ghost" onClick={state.clearPreparedResearch}>Clear prepared Research</Button></div></Card>
    <Card title="Magic School XP state"><div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>{formatNumber(info.xp)} XP · Level {info.level} / {info.cap} · {info.atCap ? 'At cap' : `${formatNumber(info.xpIntoLevel)} / ${formatNumber(info.xpRequiredForLevel ?? 0)} XP in level`}</small></div><NumberField label={`${SCHOOLS[schoolId].name} XP`} value={info.xp} onChange={(value) => setSchoolXp(schoolId, value)} /><NumberField label={`${SCHOOLS[schoolId].name} level`} value={info.level} onChange={(value) => setSchoolLevel(schoolId, value)} /><div className="button-row"><Button variant="ghost" onClick={() => setAtCurrentLevelStart(schoolId)}>Exact level start</Button><Button variant="ghost" onClick={() => setBeforeNextLevel(schoolId)} disabled={info.nextLevelXp === null}>1 XP before next</Button><Button variant="secondary" onClick={() => setNextLevel(schoolId)} disabled={info.nextLevelXp === null}>Set next level</Button></div></div> })}</div></Card>
    <Card title="Research activity inspector"><div className="developer-research-slots">{RESEARCH_SLOT_ORDER.map((slotId) => { const job = getResearchJob(state, slotId); if (!job) return <Status key={slotId}>{slotLabel(slotId)} · EMPTY</Status>; const status = getResearchJobStatus(state, slotId); const eta = getResearchNextLevelEtaMs(state, slotId); const batchEta = getResearchBatchEtaMs(job); return <div key={slotId}><span><strong>{slotLabel(slotId)} · {ITEMS[job.itemId].name} → {SCHOOLS[job.targetSchoolId].name}</strong><small>{formatReadableId(status)} · {job.remainingQuantity} items remaining · {formatEta(batchEta)} batch time</small></span><div className="developer-detail-grid"><span>XP / ITEM<strong>{formatNumber(getResearchJobXpPerItem(job))}</strong></span><span>XP / HOUR<strong>{formatNumber(getResearchXpPerHour(job))}</strong></span><span>ITEM TIME<strong>{formatEta(getResearchEffectiveDuration(job))}</strong></span><span>MANA / SECOND<strong>{formatNumber(getResearchManaPerSecond(job))}</strong></span><span>NEXT LEVEL<strong>{eta.beyondBatch ? 'Beyond this batch' : formatEta(eta.etaMs)}</strong></span></div><div className="button-row"><NumberField label={`${slotLabel(slotId)} Echoes`} value={job.echoesAssigned} onChange={(value) => state.setResearchEchoes(slotId, value)} /><Button variant="success" onClick={() => state.forceResearchCycle(slotId)}>Complete one cycle</Button><Button variant="ghost" onClick={() => state.removePreparedResearch(slotId)}>Remove batch</Button></div></div> })}</div></Card>
  </div>
}
