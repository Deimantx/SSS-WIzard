import { ShieldCheck, Unlock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { getItemSourceLabel, getResearchXp, ITEMS } from '../../game/content/items/items'
import { MANA_PILLARS } from '../../game/content/channeling/manaPillars'
import { RECIPES } from '../../game/content/recipes/recipes'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { GameState, ItemId } from '../../game/types'
import { friendlyStatLabel, formatStat } from '../../components/ui/item/ItemTooltip'

export function InventoryDetail({ itemId, inventory, protectedItems, equipment, toggleProtection, equipItem }: { itemId: ItemId | null; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; toggleProtection: (itemId: ItemId) => void; equipItem: (itemId: ItemId) => void }) {
  if (!itemId) return <div className="inventory-detail-empty"><strong>No items match this view.</strong><span>Try another filter or search term.</span></div>
  const item = ITEMS[itemId]
  const quantity = inventory[itemId] ?? 0
  const equipped = Object.values(equipment).includes(itemId)
  const protectedItem = Boolean(protectedItems[itemId]) || equipped
  const uses = Object.values(RECIPES).filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.itemId === itemId) || recipe.output === itemId)
  const pillarUse = itemId === 'life-essence' ? Object.values(MANA_PILLARS) : Object.values(MANA_PILLARS).filter((pillar) => pillar.fragmentRequirements.includes(itemId))
  return <div className="inventory-detail-content">
    <div className="inventory-detail-head"><div className="inventory-detail-icon"><ItemIcon itemId={itemId} size="large" /></div><div><span className="inventory-detail-category">{categoryLabel(item.category)}</span><h2>{item.name}</h2><div className="inventory-detail-badges"><Status tone={equipped ? 'success' : protectedItem ? 'warning' : 'neutral'}>{equipped ? 'Equipped' : protectedItem ? 'Protected' : 'Available'}</Status>{item.kind === 'equipment' && !equipped && <Status>Un-equipped</Status>}</div></div></div>
    <p className="inventory-detail-description">{item.description}</p>
    <div className="inventory-detail-stats"><DetailRow label="Quantity" value={quantity} /><DetailRow label="Source" value={getItemSourceLabel(itemId)} /></div>
    {item.researchSchool && <section className="inventory-detail-section"><span className="inventory-detail-label">RESEARCH VALUE</span><DetailRow label={`${SCHOOLS[item.researchSchool].name} School`} value={`${getResearchXp(itemId, item.researchSchool)} XP`} /><DetailRow label="Other Schools" value={`${getResearchXp(itemId, item.researchSchool === 'fire' ? 'water' : 'fire')} XP`} /></section>}
    {item.stats && Object.keys(item.stats).length > 0 && <section className="inventory-detail-section"><span className="inventory-detail-label">EQUIPMENT STATS</span>{Object.entries(item.stats).map(([key, value]) => <DetailRow key={key} label={friendlyStatLabel(key)} value={formatStat(key, value)} />)}</section>}
    {(uses.length > 0 || pillarUse.length > 0 || item.researchSchool) && <section className="inventory-detail-section"><span className="inventory-detail-label">USED IN</span>{uses.map((recipe) => <span className="inventory-use-row" key={recipe.id}>{recipe.name}{recipe.output === itemId ? ' · crafted output' : ' · ingredient'}</span>)}{pillarUse.length > 0 && <span className="inventory-use-row">Pillars of Mana · {pillarUse.map((pillar) => pillar.name).join(', ')}</span>}{item.researchSchool && <span className="inventory-use-row">Research · any Magic School</span>}</section>}
    <section className="inventory-detail-section inventory-detail-actions"><span className="inventory-detail-label">ACTIONS</span>{item.kind === 'equipment' && !equipped && <Button onClick={() => equipItem(itemId)} disabled={quantity <= 0}>Equip</Button>}{equipped ? <div className="inventory-equipped-note"><Status tone="success">EQUIPPED</Status><span>Equipped items are automatically protected.</span></div> : <Button variant={protectedItem ? 'success' : 'secondary'} onClick={() => toggleProtection(itemId)}>{protectedItem ? <><Unlock size={14} /> Unprotect</> : <><ShieldCheck size={14} /> Protect</>}</Button>}</section>
  </div>
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) { return <span className="inventory-detail-row"><span>{label}</span><strong>{value}</strong></span> }
function categoryLabel(category: string) { return category.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') }
