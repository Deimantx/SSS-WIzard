import { Card, Button, Status } from '../../../components/ui'
import { ITEMS } from '../../../game/data/items'
import { FRAGMENT_ORDER, SCHOOLS } from '../../../game/data/schools'
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

const materialSource = (itemId: ItemId) => itemId === 'life-essence' ? 'Combat → all monsters' : 'Wizard Tower → Condensation'

function ItemRequirementTile({ itemId, owned, required, protectedItem }: { itemId: ItemId; owned: number; required: number; protectedItem: boolean }) {
  const item = ITEMS[itemId]
  const missing = Math.max(0, required - owned)
  const stateClass = protectedItem ? 'is-protected' : missing > 0 ? 'missing' : 'sufficient'
  const details = [item.name, `Owned: ${owned}`, `Required: ${required}`, `Missing: ${missing}`, `Source: ${materialSource(itemId)}`, protectedItem ? 'Protected item / Cannot be consumed by this upgrade.' : ''].filter(Boolean).join('\n')
  return <span className={`item-requirement-tile ${stateClass}`} tabIndex={0} role="img" aria-label={`${item.name}, ${owned} owned, ${required} required${protectedItem ? ', protected' : ''}`} title={details}>
    <span className="item-requirement-icon" style={{ color: item.color }}>{item.icon}</span>
    <strong>{owned}</strong><small>/ {required}</small>
    {protectedItem && <i className="item-requirement-lock" aria-hidden="true">🔒</i>}
  </span>
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
  const reason = mastered ? 'Further attunement has not yet been discovered.' : blocked ? `${ITEMS[blocked].name} is protected.` : missing ? `Need ${((missing === 'life-essence' ? cost?.lifeEssence : cost?.fragment) ?? 0) - (inventory[missing] ?? 0)} more ${ITEMS[missing].name}.` : ''
  const buttonLabel = mastered ? 'Mastered' : blocked ? 'Protected Material' : missing ? 'Missing Materials' : 'Upgrade'
  return <article className={`mana-pillar-card pillar-${pillarId}`}>
    <div className="mana-pillar-head"><h3>{pillar.name}</h3><Status tone={mastered ? 'success' : 'active'}>{mastered ? 'RANK I MASTERED' : 'RANK I'}</Status></div>
    <p className="muted">{pillar.description}</p>
    <div className="mana-pillar-level"><span>LEVEL {level} / {pillar.maxLevel}</span><div className="mana-pillar-marks" aria-label={`Pillar progress ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    <div className="mana-pillar-effect-row"><div><span>CURRENT</span><strong>{effectValue(pillarId, level)}</strong></div><b aria-hidden="true">→</b><div><span>{mastered ? 'RANK II' : 'NEXT'}</span><strong>{mastered ? '???' : effectValue(pillarId, level + 1)}</strong></div></div>
    {!mastered && cost && <div className="mana-pillar-costs"><span className="eyebrow">COST · OWNED / REQUIRED</span><div className="mana-pillar-requirements">{requiredItems.map((itemId) => { const required = itemId === 'life-essence' ? cost.lifeEssence : cost.fragment; const owned = inventory[itemId] ?? 0; return <ItemRequirementTile key={itemId} itemId={itemId} owned={owned} required={required} protectedItem={isProtected(itemId)} /> })}</div></div>}
    <Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} title={reason || undefined} ariaLabel={reason || undefined} onClick={() => upgrade(pillarId)}>{buttonLabel}</Button>
  </article>
}

export function ManaPillarsPanel() {
  const pillars = useGameStore((state) => state.progress.channeling.pillars)
  const inventory = useGameStore((state) => state.inventory)
  const mastered = MANA_PILLAR_IDS.filter((id) => pillars[id].rank === 1 && pillars[id].level >= MANA_PILLARS[id].maxLevel).length
  const groups: { label: string; ids: readonly ManaPillarId[] }[] = [{ label: 'Foundation Pillars', ids: ['leyline-conduit', 'arcane-reservoir'] }, { label: 'Amplification Pillars', ids: ['mana-resonance', 'astral-expansion', 'echo-attunement'] }]
  return <Card title="Pillars of Mana" action={<span className="mana-mastery-summary">RANK I MASTERY <strong>{mastered} / {MANA_PILLAR_IDS.length}</strong></span>}>
    <p className="mana-pillars-intro">Strengthen the foundations that govern the tower's Mana economy.</p>
    <div className="channeling-material-strip"><span className="eyebrow">AVAILABLE MATERIALS</span><div>{FRAGMENT_ORDER.map((element) => <span className={`material-chip material-${element}`} key={element}><i>{SCHOOLS[element].glyph}</i>{SCHOOLS[element].name}<strong>{inventory[SCHOOLS[element].fragment] ?? 0}</strong></span>)}<span className="material-chip material-life"><i>✧</i>Life Essence<strong>{inventory['life-essence'] ?? 0}</strong></span></div></div>
    {groups.map((group) => <section className="mana-pillar-group" key={group.label}><h3>{group.label}</h3><div className={`mana-pillars-grid ${group.ids.length === 2 ? 'foundation-grid' : 'amplification-grid'}`}>{group.ids.map((id) => <PillarCard key={id} pillarId={id} />)}</div></section>)}
  </Card>
}
