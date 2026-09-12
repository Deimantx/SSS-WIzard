import type { ItemId } from '../../../game/types'
import { ITEMS } from '../../../game/content/items/items'
import { resolveGameAssetIcon } from '../../../ui/icons/gameAssetIcons'

export function ItemIcon({ itemId, size = 'tile' }: { itemId: ItemId; size?: 'tiny' | 'tile' | 'large' }) {
  const item = ITEMS[itemId]
  const asset = resolveGameAssetIcon({ kind: 'item', id: itemId })
  const image = asset ?? item.image
  return <span className={`item-icon item-icon-${size}`} style={{ color: item.color }} aria-hidden="true">{image ? <img src={image} alt="" draggable={false} /> : item.icon}</span>
}
