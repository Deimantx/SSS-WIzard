import { Card, Button, Status } from '../../../components/ui'
import { ITEMS } from '../../../game/data/items'
import { MANA_PILLARS, MANA_PILLAR_IDS, getManaPillarLevelCost } from '../../../game/data/manaPillars'
import type { ItemId, ManaPillarId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

const effectValue = (pillarId: ManaPillarId, level: number) => {
  const pillar = MANA_PILLARS[pillarId]
  const value = level * pillar.valuePerLevel
  if (pillar.effect === 'flat-regen') return `+${value} Mana/s`
  if (pillar.effect === 'flat-capacity') return `+${value} Max Mana`
  return `+${value}%`
}

function PillarCard({ pillarId }: { pillarId: ManaPillarId }) {
  const pillar = MANA_PILLARS[pillarId]
  const level = useGameStore((state) => state.progress.channeling.pillars[pillarId].level)
  const inventory = useGameStore((state) => state.inventory)
  const protectedItems = useGameStore((state) => state.protectedItems)
  const equipment = useGameStore((state) => state.equipment)
  const upgrade = useGameStore((state) => state.upgradeManaPillar)
  const mastered = level >= pillar.maxLevel
  const cost = getManaPillarLevelCost(level + 1)
  const isProtected = (itemId: ItemId) => Boolean(protectedItems[itemId] || Object.values(equipment).includes(itemId))
  const requiredItems = [...pillar.fragmentRequirements, 'life-essence' as const]
  const blocked = requiredItems.find(isProtected)
  const missing = cost && requiredItems.find((itemId) => (inventory[itemId] ?? 0) < (itemId === 'life-essence' ? cost.lifeEssence : cost.fragment))
  const canUpgrade = Boolean(cost && !blocked && !missing && !mastered)
  const reason = mastered ? 'Further attunement has not yet been discovered.' : blocked ? `${ITEMS[blocked].name} is protected.` : missing ? `Need more ${ITEMS[missing].name}.` : ''
  return <article className="mana-pillar-card">
    <div className="mana-pillar-head"><div><span className="eyebrow">{pillar.name.toUpperCase()}</span><h3>{pillar.name}</h3></div><Status tone={mastered ? 'success' : 'active'}>Rank I</Status></div>
    <p className="muted">{pillar.description}</p>
    <div className="mana-pillar-level"><span>Level {level} / {pillar.maxLevel}</span><div className="mana-pillar-marks" aria-label={`Pillar progress ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    <div className="mana-pillar-effect"><span>{pillar.effectLabel}</span><strong>{effectValue(pillarId, level)}</strong></div>
    <div className="mana-pillar-next"><span>{mastered ? 'RANK II' : 'NEXT LEVEL'}</span><strong>{mastered ? 'Not yet available' : effectValue(pillarId, level + 1)}</strong></div>
    {!mastered && cost && <div className="mana-pillar-costs"><span className="eyebrow">COST · OWNED / REQUIRED</span>{requiredItems.map((itemId) => { const required = itemId === 'life-essence' ? cost.lifeEssence : cost.fragment; const owned = inventory[itemId] ?? 0; const protectedItem = isProtected(itemId); return <span className={protectedItem || owned < required ? 'missing' : ''} key={itemId}><span>{ITEMS[itemId].name}</span><strong>{protectedItem ? 'PROTECTED' : `${owned} / ${required}`}</strong></span> })}</div>}
    <Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} onClick={() => upgrade(pillarId)}>{mastered ? 'MASTERED' : 'Upgrade'}</Button>
    {reason && <small className={`mana-pillar-reason ${mastered ? 'complete' : ''}`}>{reason}</small>}
  </article>
}

export function ManaPillarsPanel() {
  const pillars = useGameStore((state) => state.progress.channeling.pillars)
  const mastered = MANA_PILLAR_IDS.filter((id) => pillars[id].rank === 1 && pillars[id].level >= MANA_PILLARS[id].maxLevel).length
  return <Card title="Pillars of Mana" action={<span className="muted">Pillars Mastered {mastered} / {MANA_PILLAR_IDS.length}</span>}>
    <p className="mana-pillars-intro">Strengthen the foundations that govern the tower's Mana economy.</p>
    <div className="mana-pillars-grid">{MANA_PILLAR_IDS.map((id) => <PillarCard key={id} pillarId={id} />)}</div>
  </Card>
}
