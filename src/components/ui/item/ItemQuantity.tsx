import { GameValue } from '../../../ui/game-feel/GameValue'

export function formatItemQuantity(value: number) {
  const quantity = Math.max(0, value)
  if (quantity >= 1_000_000) return `${trimCompact(quantity / 1_000_000)}M`
  if (quantity >= 1_000) return `${trimCompact(quantity / 1_000)}K`
  return Math.floor(quantity).toLocaleString()
}

function trimCompact(value: number) {
  return value >= 100 ? Math.round(value).toString() : value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

export function ItemQuantity({ value, compact = false, className = '' }: { value: number; compact?: boolean; className?: string }) {
  return <GameValue value={value} tone="neutral" className={`item-quantity ${className}`} formatted={<>×{compact ? formatItemQuantity(value) : Math.max(0, Math.floor(value)).toLocaleString()}</>} />
}
