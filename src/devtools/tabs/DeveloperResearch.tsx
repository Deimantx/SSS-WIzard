import { Button, Card, Status } from '../../components/ui'
import { BALANCE, SCHOOL_LEVEL_XP } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getResearchBatchEtaMs, getResearchEffectiveDuration, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchFocusReserved, getResearchJob, getResearchJobStatus, getResearchJobXpPerItem, getResearchManaPerSecond, getResearchNextLevelEtaMs, getResearchXpPerHour } from '../../game/systems/research/researchSelectors'
import { getSchoolLevelStartXp, getSchoolProgressInfo } from '../../game/systems/schools'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import type { ResearchSlotId, SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
const formatEta = (etaMs: number | null) => etaMs === null ? '—' : `${Math.ceil(etaMs / 1000)}s`

export function DeveloperResearch() {
  const state = useGameStore()
  const prepare = state.prepareResearch
  const clear = state.clearPreparedResearch
  const setEchoes = state.setResearchEchoes
  const setSchoolDebug = state.setSchoolDebug

  const prepareFixture = () => {
    clear()
    schoolIds.forEach((school) => {
      const itemId = SCHOOLS[school].fragment
      state.addItem(itemId, 100)
      prepare(itemId, school, 50)
    })
    RESEARCH_SLOT_ORDER.forEach((slotId, index) => setEchoes(slotId, index === 0 ? 2 : 1))
  }
  const setSchoolLevel = (schoolId: SchoolId, level: number) => {
    const safeLevel = Math.max(1, Math.floor(level))
    setSchoolDebug(schoolId, getSchoolLevelStartXp(safeLevel), safeLevel)
  }
  const setSchoolXp = (schoolId: SchoolId, xp: number) => setSchoolDebug(schoolId, Math.max(0, Math.floor(xp)))
  const setAtCurrentLevelStart = (schoolId: SchoolId) => {
    const info = getSchoolProgressInfo(state, schoolId)
    setSchoolDebug(schoolId, info.levelStartXp, info.level)
  }
  const setBeforeNextLevel = (schoolId: SchoolId) => {
    const info = getSchoolProgressInfo(state, schoolId)
    if (info.nextLevelXp !== null) setSchoolDebug(schoolId, Math.max(info.levelStartXp, info.nextLevelXp - 1), info.level)
  }
  const setNextLevel = (schoolId: SchoolId) => {
    const info = getSchoolProgressInfo(state, schoolId)
    if (info.nextLevelXp !== null) setSchoolDebug(schoolId, info.nextLevelXp, info.level + 1)
  }

  return <div className="developer-tab-grid">
    <Card title="Research progression">
      <p className="muted">Research awards XP directly to the target Magic School. There is no separate Research XP registry in the current runtime.</p>
      <div className="developer-summary-grid"><Summary label="Research Echoes" value={`${getResearchEchoesAssigned(state)} / ${getResearchEchoCapacity(state)}`} /><Summary label="Focus reserved" value={getResearchFocusReserved(state)} /><Summary label="Prepared batches" value={`${RESEARCH_SLOT_ORDER.filter((slotId) => Boolean(getResearchJob(state, slotId))).length} / ${BALANCE.research.maxPreparedSlots}`} /><Summary label="Formula" value={`level × ${SCHOOL_LEVEL_XP(1)}`} /></div>
      <div className="button-row"><Button variant="secondary" onClick={prepareFixture}>DEV FIXTURE · Prepare four batches</Button><Button variant="ghost" onClick={clear}>Clear prepared Research</Button></div>
    </Card>

    <Card title="Magic School XP state">
      <div className="developer-research-school-list">{schoolIds.map((schoolId) => {
        const info = getSchoolProgressInfo(state, schoolId)
        return <div className="developer-research-school" key={schoolId}>
          <div><strong>{SCHOOLS[schoolId].name}</strong><small>{info.xp} XP · Level {info.level} / {info.cap} · {info.atCap ? 'at cap' : `${info.xpIntoLevel} / ${info.xpRequiredForLevel} XP in level`}</small></div>
          <NumberField label={`${SCHOOLS[schoolId].name} XP`} value={info.xp} onChange={(value) => setSchoolXp(schoolId, value)} />
          <NumberField label={`${SCHOOLS[schoolId].name} level`} value={info.level} onChange={(value) => setSchoolLevel(schoolId, value)} />
          <div className="button-row"><Button variant="ghost" onClick={() => setAtCurrentLevelStart(schoolId)}>Exact level start</Button><Button variant="ghost" onClick={() => setBeforeNextLevel(schoolId)} disabled={info.nextLevelXp === null}>1 XP before next</Button><Button variant="secondary" onClick={() => setNextLevel(schoolId)} disabled={info.nextLevelXp === null}>Set next level</Button></div>
        </div>
      })}</div>
      <p className="developer-debug-note">Authored curve: <code>SCHOOL_LEVEL_XP(level) = level × {SCHOOL_LEVEL_XP(1)}</code>. Level start and cap calculations come from the runtime school selector.</p>
    </Card>

    <Card title="Research activity inspector">
      <div className="developer-research-slots">{RESEARCH_SLOT_ORDER.map((slotId) => {
        const job = getResearchJob(state, slotId)
        if (!job) return <Status key={slotId}>{slotId} · EMPTY</Status>
        const status = getResearchJobStatus(state, slotId)
        const eta = getResearchNextLevelEtaMs(state, slotId)
        const batchEta = getResearchBatchEtaMs(job)
        return <div key={slotId}>
          <span><strong>{slotId} · {ITEMS[job.itemId].name} → {SCHOOLS[job.targetSchoolId].name}</strong><small>{status} · {job.remainingQuantity} remaining · {Math.floor(job.progressMs)} / {BALANCE.research.durationPerItemMs} ms ({formatEta(batchEta)} batch ETA)</small></span>
          <div className="developer-detail-grid"><span>XP / ITEM<strong>{getResearchJobXpPerItem(job)}</strong></span><span>XP / HOUR<strong>{getResearchXpPerHour(job).toFixed(1)}</strong></span><span>EFFECTIVE ITEM<strong>{formatEta(getResearchEffectiveDuration(job))}</strong></span><span>MANA / SEC<strong>{getResearchManaPerSecond(job).toFixed(2)}</strong></span><span>NEXT LEVEL<strong>{eta.beyondBatch ? 'Beyond batch' : formatEta(eta.etaMs)}</strong></span></div>
          <div className="button-row"><NumberField label={`${slotId} Echoes`} value={job.echoesAssigned} onChange={(value) => setEchoes(slotId as ResearchSlotId, value)} /><Button variant="success" onClick={() => state.forceResearchCycle(slotId as ResearchSlotId)}>DEBUG ONLY · Force one cycle</Button><Button variant="ghost" onClick={() => state.removePreparedResearch(slotId as ResearchSlotId)}>Remove batch</Button></div>
        </div>
      })}</div>
      <div className="developer-diagnostics"><span>Per item duration <b>{BALANCE.research.durationPerItemMs} ms</b></span><span>Mana per item <b>{BALANCE.research.manaCostPerItem}</b></span><span>Matching XP <b>{BALANCE.research.matchingXp}</b></span><span>Non-matching XP <b>{BALANCE.research.nonMatchingXp}</b></span></div>
    </Card>
  </div>
}
