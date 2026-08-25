import type { ReactNode } from 'react'
import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../../game/content/items/items'
import { MANA_PILLARS } from '../../../game/content/channeling/manaPillars'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { SCHOOLS } from '../../../game/content/schools/schools'
import type { ItemId } from '../../../game/types'
import { ItemIcon } from './ItemIcon'

export function ItemTooltip({ itemId, owned, protectedItem = false, equipped = false, children }: { itemId: ItemId; owned: number; protectedItem?: boolean; equipped?: boolean; children: ReactNode }) {
  const item = ITEMS[itemId]
  const uses = RECIPES[itemId] ? [RECIPES[itemId].name] : Object.values(RECIPES).filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.itemId === itemId)).map((recipe) => recipe.name)
  const pillarUse = itemId === 'life-essence' || Object.values(MANA_PILLARS).some((pillar) => pillar.fragmentRequirements.includes(itemId))
  const accent = item.category === 'elemental' ? 'elemental' : item.category === 'boss-loot' ? 'warning' : item.kind === 'equipment' ? 'success' : 'neutral'
  return <GameTooltip block accent={accent} content={<TooltipContent title={item.name.toUpperCase()} description={categoryLabel(item.category)}><div className="item-tooltip-heading"><ItemIcon itemId={itemId} size="tiny" /><span>{item.description}</span></div><TooltipRow label="Quantity" value={owned} />{equipped ? <TooltipRow label="State" value="Equipped" /> : <TooltipRow label="Protected" value={protectedItem ? 'Yes' : 'No'} />}{item.researchSchool && <div className="tooltip-section"><small>RESEARCH</small><TooltipRow label={SCHOOLS[item.researchSchool].name} value={`${getResearchXp(itemId, item.researchSchool)} XP`} /><TooltipRow label="Other Schools" value={`${getResearchXp(itemId, item.researchSchool === 'fire' ? 'water' : 'fire')} XP`} /></div>} {item.stats && Object.keys(item.stats).length > 0 && <div className="tooltip-section"><small>EQUIPMENT STATS</small>{Object.entries(item.stats).map(([key, value]) => <TooltipRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div>}<div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div>{(uses.length > 0 || pillarUse || item.researchSchool) && <div className="tooltip-section"><small>USED IN</small>{uses.map((use) => <p key={use}>{use}</p>)}{pillarUse && <p>Pillars of Mana</p>}{item.researchSchool && <p>Research</p>}</div>}</TooltipContent>}>{children}</GameTooltip>
}

function categoryLabel(category: string) { return category.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') }
export function friendlyStatLabel(key: string) { return ({ basicDamage: 'Basic Attack Damage', maxHealth: 'Max Health', maxMana: 'Max Mana', manaRegen: 'Mana Regen', maxFocus: 'Max Focus', barrierReceived: 'Barrier Received', fireSpellDamagePct: 'Fire Spell Damage', waterBarrierPct: 'Water Barrier', earthSpellDamagePct: 'Earth Spell Damage', airSpellDamagePct: 'Air Spell Damage' } as Record<string, string>)[key] ?? key }
export function formatStat(key: string, value: number) { return `${value >= 0 ? '+' : ''}${key.endsWith('Pct') ? `${Math.round(value * 100)}%` : value}` }
function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
