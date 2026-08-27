import { useEffect, useState, type CSSProperties } from 'react'
import { Button, Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../../game/content/items/items'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { BALANCE } from '../../../game/core/balance/balance'
import { getPreparedResearchCount, getResearchAvailableQuantity } from '../../../game/systems/research/researchSelectors'
import { getResearchReservedQuantity } from '../../../game/systems/research/researchReservations'
import type { ItemId, SchoolId } from '../../../game/types'
import { clamp, formatNumber, formatTime } from '../../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'

const SCHOOL_ORDER = Object.keys(SCHOOLS) as SchoolId[]

export function ResearchInspector({ itemId }: { itemId: ItemId | null }) {
  const preferences = useUiPreferences()
  const targetSchoolId = preferences.screenState.research.targetSchoolId
  const state = useGameStore()
  const [quantity, setQuantity] = useState(1)
  const item = itemId ? ITEMS[itemId] : null
  const available = itemId ? getResearchAvailableQuantity(state, itemId) : 0
  const reserved = itemId ? getResearchReservedQuantity(state, itemId) : 0
  const safeQuantity = Math.min(Math.max(0, available), quantity)
  const xpPerItem = itemId && item ? getResearchXp(itemId, targetSchoolId) : 0
  const targetAtCap = Boolean(targetSchoolId && state.schools[targetSchoolId].level >= state.progress.magicLevelCap)
  const canMerge = Boolean(itemId && Object.values(state.activities.research.slots).some((job) => job?.itemId === itemId && job.targetSchoolId === targetSchoolId))
  const uniqueSlotFull = !canMerge && getPreparedResearchCount(state) >= BALANCE.research.maxPreparedSlots

  useEffect(() => {
    setQuantity((current) => available > 0 ? clamp(current || 1, 1, available) : 0)
  }, [itemId, available])

  const chooseTarget = (nextTarget: SchoolId) => setUiPreferences({ screenState: { research: { targetSchoolId: nextTarget } } })
  const prepare = useGameStore((current) => current.prepareResearch)
  const disabled = !item || safeQuantity < 1 || available < 1 || Boolean(state.protectedItems[itemId ?? 'fire-fragment']) || uniqueSlotFull
  const tooltip = uniqueSlotFull
    ? <TooltipContent title="Prepared slots full" description={`All ${BALANCE.research.maxPreparedSlots} Research slots are occupied. Remove a batch or choose an existing item and target to merge.`} />
    : targetAtCap
    ? <TooltipContent title="LEVEL CAP" description="This batch can be prepared, but cannot progress until the cap increases." />
    : disabled ? <TooltipContent title="Cannot prepare" description={available < 1 ? 'No unreserved quantity is available.' : 'Choose a valid quantity and target school.'} />
      : <TooltipContent title="Prepare Research" description="Reserve this quantity without consuming it. Assign Research Echoes in Prepared Research." />

  if (!itemId || !item) return <Card className="research-inspector" title="ITEM INSPECTION"><div className="research-inspector-body"><div className="empty-state small">Select a Researchable Item to inspect its affinity, target school value, and quantity.</div></div></Card>

  return <Card className="research-inspector" title="ITEM INSPECTION">
    <div className="research-inspector-body">
      <div className="research-inspection-hero"><div className="research-inspection-icon" style={{ '--research-accent': item.color } as CSSProperties}><ItemIcon itemId={itemId} size="tile" /></div><div><span className="eyebrow">{item.researchSchool ? SCHOOLS[item.researchSchool].name.toUpperCase() : 'RESEARCH' } AFFINITY</span><h2>{item.name}</h2><div className="research-inspection-stats"><span><small>OWNED</small><strong>{formatNumber(state.inventory[itemId] ?? 0)}</strong></span><span><small>AVAILABLE</small><strong>{formatNumber(available)}</strong></span><span><small>RESERVED</small><strong>{formatNumber(reserved)}</strong></span></div></div></div>
    <p className="research-inspection-description">{item.description}</p>
    <div className="research-source-line"><span>SOURCE</span><strong>{getItemSourceLabel(itemId)}</strong></div>
    <section className="research-inspector-section"><span className="eyebrow">TARGET SCHOOL</span><div className="research-target-grid">{SCHOOL_ORDER.map((schoolId) => <GameTooltip key={schoolId} block content={<TooltipContent title={SCHOOLS[schoolId].name} description={`${getResearchXp(itemId, schoolId)} XP per researched ${item.name}.`} />}><button type="button" aria-pressed={targetSchoolId === schoolId} className={`research-target-button ${targetSchoolId === schoolId ? 'selected' : ''}`} style={{ '--school-color': SCHOOLS[schoolId].color } as CSSProperties} onClick={() => chooseTarget(schoolId)}>{SCHOOLS[schoolId].name.toUpperCase()}</button></GameTooltip>)}</div>{targetAtCap && <div className="research-cap-note"><Status tone="warning">LEVEL CAP</Status><span>This batch can be prepared, but cannot progress until the cap increases.</span></div>}</section>
    <section className="research-inspector-section"><span className="eyebrow">RESEARCH VALUE</span><div className="research-value-grid"><Metric label="XP / ITEM" value={String(xpPerItem)} /><Metric label="BASE TIME" value={formatTime(BALANCE.research.durationPerItemMs)} /><Metric label="MANA / ITEM" value={String(BALANCE.research.manaCostPerItem)} /></div></section>
    <section className="research-inspector-section"><div className="research-quantity-heading"><span className="eyebrow">QUANTITY</span><strong>{safeQuantity} / {available}</strong></div><div className="research-quantity-controls"><input aria-label="Research quantity" type="number" min={available > 0 ? 1 : 0} max={available} value={safeQuantity} disabled={available < 1} onChange={(event) => setQuantity(available > 0 ? clamp(Number(event.target.value) || 1, 1, available) : 0)} /><span>/ {available}</span><Button variant="ghost" onClick={() => setQuantity(available)} disabled={available < 1}>MAX</Button></div><input className="research-quantity-slider" aria-label="Research quantity slider" type="range" min={available > 0 ? 1 : 0} max={Math.max(available, 1)} value={safeQuantity} disabled={available < 1} onChange={(event) => setQuantity(Number(event.target.value))} /></section>
    <div className="research-inspector-total"><Metric label="TOTAL XP" value={formatNumber(safeQuantity * xpPerItem)} /><Metric label="BASE TIME" value={formatTime(safeQuantity * BALANCE.research.durationPerItemMs)} /><Metric label="TOTAL MANA" value={formatNumber(safeQuantity * BALANCE.research.manaCostPerItem)} /></div>
    <GameTooltip block content={tooltip} accent={targetAtCap ? 'warning' : 'elemental'} disabled={!disabled && !targetAtCap}><Button variant="primary" className="research-prepare-button" onClick={() => prepare(itemId, targetSchoolId, safeQuantity)} disabled={disabled}>PREPARE</Button></GameTooltip>
    </div>
  </Card>
}

function Metric({ label, value }: { label: string; value: string }) { return <span className="research-metric"><small>{label}</small><strong>{value}</strong></span> }
