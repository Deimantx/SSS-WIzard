import type { ReactNode } from 'react'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../../game/content/items/items'
import { SCHOOLS } from '../../../game/content/schools/schools'
import type { ItemId } from '../../../game/types'
import { GameTooltip, TooltipContent } from '../tooltip/Tooltip'
import { getInventoryCategoryLabel, getInventorySubcategoryLabel, getItemUses } from '../../../screens/inventory/inventoryMetadata'
import { ItemIcon } from './ItemIcon'

export function ItemTooltip({ itemId, owned, protectedItem = false, equipped = false, recentlyGained, children }: { itemId: ItemId; owned: number; protectedItem?: boolean; equipped?: boolean; recentlyGained?: number; children: ReactNode }) {
  const item = ITEMS[itemId]
  const uses = getItemUses(itemId)
  const accent = item.inventoryCategory === 'equipment' ? 'success' : item.inventoryCategory === 'loot' ? 'warning' : item.materialSubtype === 'elemental' ? 'elemental' : 'neutral'
  const category = getInventorySubcategoryLabel(itemId) ? `${getInventorySubcategoryLabel(itemId)} Material` : getInventoryCategoryLabel(itemId)
  return <GameTooltip block accent={accent} content={<TooltipContent title={item.name.toUpperCase()} description={category}>
    <div className="item-tooltip-heading"><ItemIcon itemId={itemId} size="tiny" /><span>{item.description}</span></div>
    <TooltipRow label="Owned" value={owned.toLocaleString()} />
    {recentlyGained !== undefined && <TooltipRow label="Recently gained" value={`+${recentlyGained.toLocaleString()}`} />}
    {equipped ? <TooltipRow label="State" value="Equipped" /> : <TooltipRow label="Protected" value={protectedItem ? 'Yes' : 'No'} />}
    {item.researchSchool && <div className="tooltip-section"><small>RESEARCH</small>{(Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>).map((schoolId) => <TooltipRow key={schoolId} label={SCHOOLS[schoolId].name} value={`${getResearchXp(itemId, schoolId)} XP`} />)}</div>}
    {item.stats && Object.keys(item.stats).length > 0 && <div className="tooltip-section"><small>STATS</small>{Object.entries(item.stats).filter(([, value]) => value !== 0).map(([key, value]) => <TooltipRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</div>}
    <div className="tooltip-section"><small>SOURCE</small><p>{getItemSourceLabel(itemId)}</p></div>
    {uses.length > 0 && <div className="tooltip-section"><small>USED IN</small>{uses.map((use) => <p key={`${use.destination}-${use.label}`}>{use.label}</p>)}</div>}
  </TooltipContent>}>{children}</GameTooltip>
}

export function friendlyStatLabel(key: string) {
  const labels: Record<string, string> = { basicDamage: 'Basic Attack Damage', maxHealth: 'Max Health', maxMana: 'Max Mana', manaRegen: 'Mana Regen', maxFocus: 'Max Focus', barrierReceived: 'Barrier Received', fireSpellDamagePct: 'Fire Spell Damage', waterBarrierPct: 'Water Barrier', earthSpellDamagePct: 'Earth Spell Damage', airSpellDamagePct: 'Air Spell Damage' }
  return labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())
}

export function formatStat(key: string, value: number) {
  return `${value >= 0 ? '+' : ''}${key.endsWith('Pct') ? `${Math.round(value * 100)}%` : value}`
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
