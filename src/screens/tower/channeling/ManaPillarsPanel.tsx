import { useRef, useState, type CSSProperties } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemRequirementTile } from '../../../components/ui/item/ItemRequirementTile'
import { MANA_PILLARS, MANA_PILLAR_IDS, getManaPillarLevelCost, type ManaPillarDefinition } from '../../../game/content/channeling/manaPillars'
import { getConsumableQuantity } from '../../../game/core/inventory/inventoryConsumption'
import { getEquippedReservedQuantity } from '../../../game/core/equipment/equipmentRules'
import type { GameState, ItemId, ManaPillarId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'

type ManaPillars = GameState['progress']['channeling']['pillars']

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const pillars = useGameStore((state) => state.progress.channeling.pillars)
  const mastered = MANA_PILLAR_IDS.filter((id) => getSafePillarLevel(pillars, id) >= MANA_PILLARS[id].maxLevel).length
  useSmartScrollState(scrollRef, { resetKey: selectedPillarId, dependencies: [pillars, mastered] })

  return <Card className="mana-pillars-panel" title="LEYLINE PILLARS" action={<div className="mana-mastery-summary"><span>RANK I MASTERY</span><strong>{mastered} / {MANA_PILLAR_IDS.length}</strong><PillarMastery pillars={pillars} /></div>}>
    <div ref={scrollRef} className="mana-pillars-panel-scroll" data-scroll-owner="mana-pillars" tabIndex={0}>
    <p className="mana-pillars-intro">Strengthen the leyline foundations that govern Arcane Flux production and storage.</p>
    <div className="mana-pillar-bonus-summary"><span>ACTIVE BONUSES</span><strong>Production {summaryEffect(pillars, 'leyline-conduit')} · Capacity {summaryEffect(pillars, 'arcane-reservoir')} · Flux Resonance {summaryEffect(pillars, 'mana-resonance')} · Flux Capacity {summaryEffect(pillars, 'astral-expansion')} · Acolyte {summaryEffect(pillars, 'echo-attunement')}</strong></div>
    <div className="mana-pillar-selector-grid" aria-label="Mana Pillars">
      {MANA_PILLAR_IDS.map((pillarId) => <PillarSelector key={pillarId} pillarId={pillarId} selected={selectedPillarId === pillarId} onSelect={() => setSelectedPillarId(pillarId)} />)}
    </div>
    <SelectedPillarInspector pillarId={selectedPillarId} />
    </div>
  </Card>
}

function PillarMastery({ pillars }: { pillars: ManaPillars }) {
  return <div className="mana-mastery-indicators" aria-label="Rank I pillar mastery">{MANA_PILLAR_IDS.map((id) => { const level = getSafePillarLevel(pillars, id); const mastered = level >= MANA_PILLARS[id].maxLevel; return <GameTooltip key={id} content={<TooltipContent title={MANA_PILLARS[id].name} description={`Rank I · Level ${level} / ${MANA_PILLARS[id].maxLevel}${mastered ? ' · Mastered' : ''}`} />} accent={mastered ? 'success' : 'neutral'}><span className={`mana-mastery-indicator mastery-${id} ${mastered ? 'filled' : ''}`} aria-label={`${MANA_PILLARS[id].name} Rank I Level ${level} of ${MANA_PILLARS[id].maxLevel}${mastered ? ', Mastered' : ''}`} /></GameTooltip> })}</div>
}

function PillarSelector({ pillarId, selected, onSelect }: { pillarId: ManaPillarId; selected: boolean; onSelect: () => void }) {
  const pillar = MANA_PILLARS[pillarId]
  const level = useGameStore((state) => getSafePillarLevel(state.progress.channeling.pillars, pillarId))
  const mastered = level >= pillar.maxLevel
  const description = `${pillar.description} ${pillarTooltip(pillar)} Current level: ${level} / ${pillar.maxLevel}${mastered ? ' · Rank I mastered.' : ''}`
  return <GameTooltip block content={<TooltipContent title={pillar.name} description={description} />} accent="mana">
    <button type="button" className={`mana-pillar-selector ${selected ? 'is-selected' : ''} ${mastered ? 'is-mastered' : ''}`} onClick={onSelect} aria-pressed={selected} style={{ '--pillar-accent': PILLAR_ACCENTS[pillarId] } as CSSProperties}>
      <span className="mana-pillar-selector-mark" aria-hidden="true" /><span className="mana-pillar-selector-copy"><strong>{pillar.name}</strong><small>{PILLAR_CATEGORIES[pillarId]} · Lv {level} / {pillar.maxLevel}</small><b>{effectValue(pillar, level)}</b><span className="mana-pillar-selector-levelbar" aria-label={`${pillar.name} level ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</span></span>{mastered && <Status tone="success">MASTERED</Status>}
    </button>
  </GameTooltip>
}

function SelectedPillarInspector({ pillarId }: { pillarId: ManaPillarId }) {
  const pillar = MANA_PILLARS[pillarId]
  const level = useGameStore((state) => getSafePillarLevel(state.progress.channeling.pillars, pillarId))
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const equipment = useGameStore((state) => state.equipment)
  const activities = useGameStore((state) => state.activities)
  const upgrade = useGameStore((state) => state.upgradeManaPillar)
  const consumableState = { inventory, protectedItems, equipment, activities }
  const mastered = level >= pillar.maxLevel
  const cost = mastered ? null : getManaPillarLevelCost(level + 1)
  const requiredItems: ItemId[] = [...pillar.fragmentRequirements, 'life-essence']
  const protectedMaterial = requiredItems.find((itemId) => Boolean(protectedItems[itemId]))
  const missingMaterial = cost ? requiredItems.find((itemId) => getConsumableQuantity(consumableState, itemId) < requiredFor(itemId, cost.fragment, cost.lifeEssence)) : undefined
  const canUpgrade = Boolean(cost && !mastered && !protectedMaterial && !missingMaterial)
  const reason = mastered ? 'Rank I already mastered.' : protectedMaterial ? 'Required material is protected.' : missingMaterial ? 'Missing required materials.' : ''

  return <section className={`mana-pillar-selected pillar-${pillarId}`} style={{ '--pillar-accent': PILLAR_ACCENTS[pillarId] } as CSSProperties}>
    <div className="mana-pillar-selected-head"><div className="mana-pillar-selected-identity"><span className="mana-pillar-selected-mark" aria-hidden="true" /><div><span className="eyebrow">RANK I · {PILLAR_CATEGORIES[pillarId]} PILLAR</span><h3>{pillar.name}</h3><span className="mana-pillar-selected-level">LEVEL {level} / {pillar.maxLevel}</span></div></div>{mastered && <Status tone="success">MASTERED</Status>}</div>
    <p className="mana-pillar-selected-description">{pillar.description}</p>
    <div className="mana-pillar-level"><span>LEVEL PROGRESSION</span><div className="mana-pillar-marks" aria-label={`${pillar.name} progress ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    {mastered ? <div className="mana-pillar-selected-effect is-mastered"><div><span>CURRENT</span><strong>{effectValue(pillar, level)}</strong></div><p>RANK I MASTERED<br /><small>Further attunement has not yet been discovered.</small></p></div> : <GameTooltip block content={<TooltipContent title={pillar.effectLabel} description={pillarTooltip(pillar)} />} accent="mana"><div className="mana-pillar-selected-effect"><div><span>CURRENT</span><strong>{effectValue(pillar, level)}</strong></div><b aria-hidden="true">→</b><div><span>NEXT</span><strong>{effectValue(pillar, level + 1)}</strong></div></div></GameTooltip>}
    {!mastered && cost && <div className="mana-pillar-selected-costs"><span className="eyebrow">COST · OWNED / AVAILABLE / REQUIRED</span><div className="mana-pillar-requirements">{requiredItems.map((itemId) => <ItemRequirementTile key={itemId} itemId={itemId} owned={inventory[itemId] ?? 0} available={getConsumableQuantity(consumableState, itemId)} equipped={getEquippedReservedQuantity({ equipment }, itemId)} required={requiredFor(itemId, cost.fragment, cost.lifeEssence)} protectedItem={Boolean(protectedItems[itemId])} />)}</div></div>}
    <GameTooltip block disabled={canUpgrade} content={reason}><Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} ariaLabel={reason || `Upgrade ${pillar.name}`} onClick={() => upgrade(pillarId)}>{mastered ? 'RANK I MASTERED' : 'UPGRADE'}</Button></GameTooltip>
  </section>
}

function effectValue(pillar: ManaPillarDefinition, level: number) {
  const value = Math.max(0, Math.min(pillar.maxLevel, Math.floor(level))) * pillar.valuePerLevel
  if (pillar.id === 'leyline-conduit') return `+${(value * 0.25).toFixed(2)} Flux/s / Acolyte`
  if (pillar.id === 'arcane-reservoir') return `+${value * 4} Max Flux`
  if (pillar.id === 'mana-resonance') return `+${value * 3}% Flux production`
  if (pillar.id === 'astral-expansion') return `+${value * 2}% Flux capacity`
  if (pillar.id === 'echo-attunement') return `+${value * 2}% Acolyte output`
  if (pillar.effect === 'flat-regen') return `+${value} Flux/s per Acolyte`
  if (pillar.effect === 'flat-capacity') return `+${value} Max Flux`
  return `+${value}%`
}

function getSafePillarLevel(pillars: ManaPillars, pillarId: ManaPillarId) {
  const level = pillars[pillarId]?.level
  return typeof level === 'number' && Number.isFinite(level) ? Math.max(0, Math.min(MANA_PILLARS[pillarId].maxLevel, Math.floor(level))) : 0
}

function summaryEffect(pillars: ManaPillars, pillarId: ManaPillarId) {
  return effectValue(MANA_PILLARS[pillarId], getSafePillarLevel(pillars, pillarId))
}

function requiredFor(itemId: ItemId, fragment: number, lifeEssence: number) {
  return itemId === 'life-essence' ? lifeEssence : fragment
}

function pillarTooltip(pillar: ManaPillarDefinition) {
  if (pillar.id === 'leyline-conduit') return 'Adds +0.25 Arcane Flux/s per assigned Acolyte per level.'
  if (pillar.id === 'arcane-reservoir') return 'Adds +100 Max Arcane Flux per level.'
  if (pillar.id === 'mana-resonance') return 'Adds +3% total Arcane Flux production per level.'
  if (pillar.id === 'astral-expansion') return 'Adds +2% final Arcane Flux capacity per level.'
  if (pillar.id === 'echo-attunement') return 'Adds +2% assigned-Acolyte Channeling output per level.'
  if (pillar.effect === 'flat-regen') return 'Adds passive Mana regeneration.'
  if (pillar.effect === 'flat-capacity') return 'Adds flat Max Flux capacity.'
  if (pillar.effect === 'passive-regen-percent') return 'Amplifies total Arcane Flux production.'
  if (pillar.effect === 'capacity-percent') return 'Adds +2% Arcane Flux capacity per level, reaching +20% at Rank I Lv10.'
  return 'Increases output from each assigned Channeling Acolyte.'
}
