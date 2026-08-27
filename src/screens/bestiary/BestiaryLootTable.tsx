import { Status } from '../../components/ui'
import { GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { formatDropChance, formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import type { GameState } from '../../game/types'
import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'

export function BestiaryLootTable({ monster, progress }: { monster: MonsterDefinition; progress: GameState['progress'] }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">LOOT TABLE</span><div className="bestiary-loot-list">{monster.loot.map((drop) => { const collected = progress.discoveredItems.includes(drop.itemId); const item = ITEMS[drop.itemId]; return <div className="bestiary-loot-row" key={drop.itemId}><GameTooltip content={<TooltipContent title={item.name} description={item.description} />}><ItemIcon itemId={drop.itemId} size="tiny" /></GameTooltip><div><strong>{item.name}</strong><small>{formatDropQuantity(drop.min, drop.max)} · {formatDropChance(drop.chance)}</small></div><Status tone={collected ? 'success' : 'locked'}>{collected ? 'COLLECTED' : 'NOT COLLECTED'}</Status></div>})}</div></section>
}
