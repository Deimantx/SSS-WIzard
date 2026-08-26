import type { ItemId } from '../../../game/types'
import { ITEMS } from '../../../game/content/items/items'

export function ItemIcon({ itemId, size = 'tile' }: { itemId: ItemId; size?: 'tiny' | 'tile' | 'large' }) {
  const item = ITEMS[itemId]
  return <span className={`item-icon item-icon-${size}`} style={{ color: item.color }} aria-hidden="true">{item.image ? <img src={item.image} alt="" /> : item.icon}</span>
}
