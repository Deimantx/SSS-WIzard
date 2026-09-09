import { useState, type CSSProperties } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemRequirementTile } from '../../../components/ui/item/ItemRequirementTile'
import { MANA_PILLARS, MANA_PILLAR_IDS, getManaPillarLevelCost, type ManaPillarDefinition } from '../../../game/content/channeling/manaPillars'
import { getManaPillarLevel } from '../../../game/engine/channelingEngine'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getEquippedReservedQuantity } from '../../../game/core/equipment/equipmentRules'
import type { ItemId, ManaPillarId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

const PILLAR_CATEGORIES: Record<ManaPillarId, 'FOUNDATION' | 'AMPLIFICATION'> = {
  'leyline-conduit': 'FOUNDATION',
  'arcane-reservoir': 'FOUNDATION',
  'mana-resonance': 'AMPLIFICATION',
  'astral-expansion': 'AMPLIFICATION',
  'echo-attunement': 'AMPLIFICATION',
}

const PILLAR_ACCENTS: Record<ManaPillarId, string> = {
  'leyline-conduit': '#64b7ff',
  'arcane-reservoir': '#d5a36b',
  'mana-resonance': '#ff9a66',
  'astral-expansion': '#d6a878',
  'echo-attunement': '#b08aff',
}

export function ManaPillarsPanel() {
  const [selectedPillarId, setSelectedPillarId] = useState<ManaPillarId>('leyline-conduit')
  const state = useGameStore()
  const mastered = MANA_PILLAR_IDS.filter((id) => getManaPillarLevel(state, id) >= MANA_PILLARS[id].maxLevel).length

  return <Card className="mana-pillars-panel" title="PILLARS OF MANA" action={<div className="mana-mastery-summary"><span>RANK I MASTERY</span><strong>{mastered} / {MANA_PILLAR_IDS.length}</strong><PillarMastery pillars={state.progress.channeling.pillars} /></div>}>
    <p className="mana-pillars-intro">Strengthen the foundations that govern the tower's Mana economy.</p>
    <div className="mana-pillar-bonus-summary"><span>ACTIVE BONUSES</span><strong>Regen {summaryEffect(state, 'leyline-conduit')} · Capacity {summaryEffect(state, 'arcane-reservoir')} · Resonance {summaryEffect(state, 'mana-resonance')} · Max Mana {summaryEffect(state, 'astral-expansion')} · Echo {summaryEffect(state, 'echo-attunement')}</strong></div>
    <div className="mana-pillar-selector-grid" aria-label="Mana Pillars">
      {MANA_PILLAR_IDS.map((pillarId) => <PillarSelector key={pillarId} pillarId={pillarId} selected={selectedPillarId === pillarId} onSelect={() => setSelectedPillarId(pillarId)} />)}
    </div>
    <SelectedPillarInspector pillarId={selectedPillarId} />
  </Card>
}

function PillarMastery({ pillars }: { pillars: ReturnType<typeof useGameStore.getState>['progress']['channeling']['pillars'] }) {
  return <div className="mana-mastery-indicators" aria-label="Rank I pillar mastery">{MANA_PILLAR_IDS.map((id) => { const level = pillars[id].level; const mastered = pillars[id].rank === 1 && level >= MANA_PILLARS[id].maxLevel; return <GameTooltip key={id} content={<TooltipContent title={MANA_PILLARS[id].name} description={`Rank I · Level ${level} / ${MANA_PILLARS[id].maxLevel}${mastered ? ' · Mastered' : ''}`} />} accent={mastered ? 'success' : 'neutral'}><span className={`mana-mastery-indicator mastery-${id} ${mastered ? 'filled' : ''}`} aria-label={`${MANA_PILLARS[id].name} Rank I Level ${level} of ${MANA_PILLARS[id].maxLevel}${mastered ? ', Mastered' : ''}`} /></GameTooltip> })}</div>
}

function PillarSelector({ pillarId, selected, onSelect }: { pillarId: ManaPillarId; selected: boolean; onSelect: () => void }) {
  const state = useGameStore()
  const pillar = MANA_PILLARS[pillarId]
  const level = getManaPillarLevel(state, pillarId)
  const mastered = level >= pillar.maxLevel
  const description = `${pillar.description} ${pillarTooltip(pillar)} Current level: ${level} / ${pillar.maxLevel}${mastered ? ' · Rank I mastered.' : ''}`
  return <GameTooltip block content={<TooltipContent title={pillar.name} description={description} />} accent="mana">
    <button type="button" className={`mana-pillar-selector ${selected ? 'is-selected' : ''} ${mastered ? 'is-mastered' : ''}`} onClick={onSelect} aria-pressed={selected} style={{ '--pillar-accent': PILLAR_ACCENTS[pillarId] } as CSSProperties}>
      <span className="mana-pillar-selector-mark" aria-hidden="true" /><span className="mana-pillar-selector-copy"><strong>{pillar.name}</strong><small>{PILLAR_CATEGORIES[pillarId]} · Lv {level} / {pillar.maxLevel}</small><b>{effectValue(pillar, level)}</b></span>{mastered && <Status tone="success">MASTERED</Status>}
    </button>
  </GameTooltip>
}

function SelectedPillarInspector({ pillarId }: { pillarId: ManaPillarId }) {
  const state = useGameStore()
  const pillar = MANA_PILLARS[pillarId]
  const level = getManaPillarLevel(state, pillarId)
  const mastered = level >= pillar.maxLevel
  const cost = mastered ? null : getManaPillarLevelCost(level + 1)
  const requiredItems: ItemId[] = [...pillar.fragmentRequirements, 'life-essence']
  const protectedMaterial = requiredItems.find((itemId) => Boolean(state.protectedItems[itemId]))
  const missingMaterial = cost ? requiredItems.find((itemId) => getConsumableQuantity(state, itemId) < requiredFor(itemId, cost.fragment, cost.lifeEssence)) : undefined
  const canUpgrade = Boolean(cost && !mastered && !protectedMaterial && !missingMaterial)
  const reason = mastered ? 'Rank I already mastered.' : protectedMaterial ? 'Required material is protected.' : missingMaterial ? 'Missing required materials.' : ''

  return <section className={`mana-pillar-selected pillar-${pillarId}`} style={{ '--pillar-accent': PILLAR_ACCENTS[pillarId] } as CSSProperties}>
    <div className="mana-pillar-selected-head"><div className="mana-pillar-selected-identity"><span className="mana-pillar-selected-mark" aria-hidden="true" /><div><span className="eyebrow">RANK I · {PILLAR_CATEGORIES[pillarId]} PILLAR</span><h3>{pillar.name}</h3><span className="mana-pillar-selected-level">LEVEL {level} / {pillar.maxLevel}</span></div></div>{mastered && <Status tone="success">MASTERED</Status>}</div>
    <p className="mana-pillar-selected-description">{pillar.description}</p>
    <div className="mana-pillar-level"><span>LEVEL PROGRESSION</span><div className="mana-pillar-marks" aria-label={`${pillar.name} progress ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    {mastered ? <div className="mana-pillar-selected-effect is-mastered"><div><span>CURRENT</span><strong>{effectValue(pillar, level)}</strong></div><p>RANK I MASTERED<br /><small>Further attunement has not yet been discovered.</small></p></div> : <GameTooltip block content={<TooltipContent title={pillar.effectLabel} description={pillarTooltip(pillar)} />} accent="mana"><div className="mana-pillar-selected-effect"><div><span>CURRENT</span><strong>{effectValue(pillar, level)}</strong></div><b aria-hidden="true">→</b><div><span>NEXT</span><strong>{effectValue(pillar, level + 1)}</strong></div></div></GameTooltip>}
    {!mastered && cost && <div className="mana-pillar-selected-costs"><span className="eyebrow">COST · OWNED / AVAILABLE / REQUIRED</span><div className="mana-pillar-requirements">{requiredItems.map((itemId) => <ItemRequirementTile key={itemId} itemId={itemId} owned={state.inventory[itemId] ?? 0} available={getConsumableQuantity(state, itemId)} equipped={getEquippedReservedQuantity(state, itemId)} required={requiredFor(itemId, cost.fragment, cost.lifeEssence)} protectedItem={Boolean(state.protectedItems[itemId])} />)}</div></div>}
    <GameTooltip block disabled={canUpgrade} content={reason}><Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} ariaLabel={reason || `Upgrade ${pillar.name}`} onClick={() => state.upgradeManaPillar(pillarId)}>{mastered ? 'RANK I MASTERED' : 'UPGRADE'}</Button></GameTooltip>
  </section>
}

function effectValue(pillar: ManaPillarDefinition, level: number) {
  const value = Math.max(0, Math.min(pillar.maxLevel, Math.floor(level))) * pillar.valuePerLevel
  if (pillar.effect === 'flat-regen') return `+${value} Mana/s`
  if (pillar.effect === 'flat-capacity') return `+${value} Max Mana`
  return `+${value}%`
}

function summaryEffect(state: ReturnType<typeof useGameStore.getState>, pillarId: ManaPillarId) {
  return effectValue(MANA_PILLARS[pillarId], getManaPillarLevel(state, pillarId))
}

function requiredFor(itemId: ItemId, fragment: number, lifeEssence: number) {
  return itemId === 'life-essence' ? lifeEssence : fragment
}

function pillarTooltip(pillar: ManaPillarDefinition) {
  if (pillar.effect === 'flat-regen') return 'Adds passive Mana regeneration.'
  if (pillar.effect === 'flat-capacity') return 'Adds flat Max Mana capacity.'
  if (pillar.effect === 'passive-regen-percent') return 'Amplifies passive non-Echo Mana regeneration.'
  if (pillar.effect === 'capacity-percent') return 'Adds +1% Max Mana amplification per level, reaching +10% at Rank I Lv10.'
  return 'Increases Mana generated by Arcane Echoes.'
}
