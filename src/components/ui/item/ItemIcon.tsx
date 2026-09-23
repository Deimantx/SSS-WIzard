import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import type { ItemId } from '../../../game/types'
import { ITEMS } from '../../../game/content/items/items'
import { resolveGameAssetIcon } from '../../../ui/icons/gameAssetIcons'

export const ItemIcon = forwardRef<HTMLSpanElement, Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children' | 'style'> & { itemId: ItemId; size?: 'tiny' | 'tile' | 'large'; className?: string; style?: CSSProperties }>(function ItemIcon({ itemId, size = 'tile', className = '', style, ...nativeProps }, ref) {
  const item = ITEMS[itemId]
  const asset = resolveGameAssetIcon({ kind: 'item', id: itemId })
  const image = asset ?? item.image
  return <span {...nativeProps} ref={ref} className={`item-icon item-icon-${size} ${className}`.trim()} style={{ ...style, color: style?.color ?? item.color }} aria-hidden={nativeProps['aria-hidden'] ?? 'true'}>{image ? <img src={image} alt="" draggable={false} /> : item.icon}</span>
})
