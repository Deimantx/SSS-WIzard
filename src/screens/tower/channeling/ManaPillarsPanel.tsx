import { Card, Button, Status } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemRequirementTile } from '../../../components/ui/item/ItemRequirementTile'
import { getItemSourceLabel, ITEMS } from '../../../game/data/items'
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

function PillarMastery({ pillars }: { pillars: ReturnType<typeof useGameStore.getState>['progress']['channeling']['pillars'] }) {
  const labels: Record<ManaPillarId, string> = { 'leyline-conduit': 'Leyline Conduit', 'arcane-reservoir': 'Arcane Reservoir', 'mana-resonance': 'Mana Resonance', 'astral-expansion': 'Astral Expansion', 'echo-attunement': 'Echo Attunement' }
  return <div className="mana-mastery-indicators" aria-label="Rank I pillar mastery">{MANA_PILLAR_IDS.map((id) => { const level = pillars[id].level; const mastered = pillars[id].rank === 1 && level >= MANA_PILLARS[id].maxLevel; return <GameTooltip key={id} content={<TooltipContent title={labels[id]} description={`Rank I · Level ${level} / ${MANA_PILLARS[id].maxLevel}${mastered ? ' · Mastered' : ''}`} />} accent={mastered ? 'success' : 'neutral'}><span className={`mana-mastery-indicator mastery-${id} ${mastered ? 'filled' : ''}`} aria-label={`${labels[id]} Rank I Level ${level} of ${MANA_PILLARS[id].maxLevel}${mastered ? ', Mastered' : ''}`} /></GameTooltip> })}</div>
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
  const missingItems = cost ? requiredItems.filter((itemId) => (inventory[itemId] ?? 0) < (itemId === 'life-essence' ? cost.lifeEssence : cost.fragment)) : []
  const canUpgrade = Boolean(cost && !blocked && missingItems.length === 0 && !mastered)
  const reason = mastered ? 'Further attunement has not yet been discovered.' : blocked ? 'Missing required materials. One or more materials are protected.' : missingItems.length ? 'Missing required materials.' : ''
  const buttonLabel = mastered ? 'Mastered' : blocked ? 'Protected Material' : missingItems.length ? 'Missing Materials' : 'Upgrade'
  return <article className={`mana-pillar-card pillar-${pillarId}`}>
    <div className="mana-pillar-head"><h3>{pillar.name}</h3><Status tone={mastered ? 'success' : 'active'}>{mastered ? 'RANK I MASTERED' : 'RANK I'}</Status></div>
    <p className="muted">{pillar.description}</p>
    <div className="mana-pillar-level"><span>LEVEL {level} / {pillar.maxLevel}</span><div className="mana-pillar-marks" aria-label={`Pillar progress ${level} of ${pillar.maxLevel}`}>{Array.from({ length: pillar.maxLevel }, (_, index) => <i className={index < level ? 'filled' : ''} key={index} />)}</div></div>
    <div className="mana-pillar-effect-row"><div><span>CURRENT</span><strong>{effectValue(pillarId, level)}</strong></div><b aria-hidden="true">→</b><div><span>{mastered ? 'RANK II' : 'NEXT'}</span><strong>{mastered ? '???' : effectValue(pillarId, level + 1)}</strong></div></div>
    {!mastered && cost && <div className="mana-pillar-costs"><span className="eyebrow">COST · OWNED / REQUIRED</span><div className="mana-pillar-requirements">{requiredItems.map((itemId) => { const required = itemId === 'life-essence' ? cost.lifeEssence : cost.fragment; const owned = inventory[itemId] ?? 0; return <ItemRequirementTile key={itemId} itemId={itemId} owned={owned} required={required} protectedItem={isProtected(itemId)} /> })}</div></div>}
    <GameTooltip block disabled={canUpgrade} content={reason}><Button variant={canUpgrade ? 'secondary' : 'ghost'} disabled={!canUpgrade} ariaLabel={reason || buttonLabel} onClick={() => upgrade(pillarId)}>{buttonLabel}</Button></GameTooltip>
  </article>
}

export function ManaPillarsPanel() {
  const pillars = useGameStore((state) => state.progress.channeling.pillars)
  const inventory = useGameStore((state) => state.inventory)
  const mastered = MANA_PILLAR_IDS.filter((id) => pillars[id].rank === 1 && pillars[id].level >= MANA_PILLARS[id].maxLevel).length
  const groups: { label: string; ids: readonly ManaPillarId[] }[] = [{ label: 'Foundation Pillars', ids: ['leyline-conduit', 'arcane-reservoir'] }, { label: 'Amplification Pillars', ids: ['mana-resonance', 'astral-expansion', 'echo-attunement'] }]
  return <Card title="Pillars of Mana" action={<div className="mana-mastery-summary"><span>RANK I MASTERY</span><strong>{mastered} / {MANA_PILLAR_IDS.length}</strong><PillarMastery pillars={pillars} /></div>}>
    <p className="mana-pillars-intro">Strengthen the foundations that govern the tower's Mana economy.</p>
    <div className="channeling-material-strip"><span className="eyebrow">AVAILABLE MATERIALS</span><div>{FRAGMENT_ORDER.map((element) => { const itemId = SCHOOLS[element].fragment; return <GameTooltip key={element} content={<TooltipContent title={ITEMS[itemId].name} description={ITEMS[itemId].description}><div className="tooltip-section"><small>AVAILABLE</small><p>{inventory[itemId] ?? 0}</p></div><div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div></TooltipContent>} accent="elemental"><span className={`material-chip material-${element}`}><i>{SCHOOLS[element].glyph}</i>{SCHOOLS[element].name}<strong>{inventory[itemId] ?? 0}</strong></span></GameTooltip> })}<GameTooltip content={<TooltipContent title="Life Essence" description={ITEMS['life-essence'].description}><div className="tooltip-section"><small>AVAILABLE</small><p>{inventory['life-essence'] ?? 0}</p></div><div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel('life-essence')}</p></div></TooltipContent>} accent="success"><span className="material-chip material-life"><i>✧</i>Life Essence<strong>{inventory['life-essence'] ?? 0}</strong></span></GameTooltip></div></div>
    {groups.map((group) => <section className="mana-pillar-group" key={group.label}><h3>{group.label}</h3><div className={`mana-pillars-grid ${group.ids.length === 2 ? 'foundation-grid' : 'amplification-grid'}`}>{group.ids.map((id) => <PillarCard key={id} pillarId={id} />)}</div></section>)}
  </Card>
}
