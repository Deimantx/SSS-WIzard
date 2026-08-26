import { Check, LockKeyhole, ShieldCheck, Unlock, Coins } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import { canDestroyItem, canSellItem, getActionableQuantity, getEquippedReservedQuantity } from '../../store/actions/inventoryActions'
import { InventoryQuantitySelector } from './InventoryQuantitySelector'

type ActionMode = 'manage' | 'sell' | 'destroy'

const protectionTooltip = 'Protect this stack from Research, Transmutation, Guild donations, selling, and destruction.'
const sellTooltip = 'Convert items into Gold. Protected and equipped copies cannot be sold.'
const destroyTooltip = 'Permanently remove items without receiving anything.'

export function InventoryActions({ itemId, inventory, protectedItems, equipment, currencies, toggleProtection, equipItem, sellItem, destroyItem }: { itemId: ItemId | null; inventory: GameState['inventory']; protectedItems: GameState['protectedItems']; equipment: GameState['equipment']; currencies: GameState['currencies']; toggleProtection: (itemId: ItemId) => void; equipItem: (itemId: ItemId) => void; sellItem: (itemId: ItemId, quantity: number) => void; destroyItem: (itemId: ItemId, quantity: number) => void }) {
  const [mode, setMode] = useState<ActionMode>('manage')
  const [quantity, setQuantity] = useState(1)
  const [confirming, setConfirming] = useState(false)
  const item = itemId ? ITEMS[itemId] : null
  const maximum = itemId ? getActionableQuantity({ inventory, protectedItems, equipment }, itemId) : 0

  useEffect(() => {
    setMode('manage')
    setConfirming(false)
    setQuantity(1)
  }, [itemId])

  useEffect(() => {
    setQuantity((current) => maximum > 0 ? Math.max(1, Math.min(maximum, current)) : 0)
  }, [maximum])

  useEffect(() => {
    if (!confirming) return
    const timeout = window.setTimeout(() => setConfirming(false), 6500)
    return () => window.clearTimeout(timeout)
  }, [confirming])

  if (!itemId || !item) return <div className="inventory-actions-content inventory-actions-empty"><div className="inventory-empty-mark">◇</div><strong>SELECT AN ITEM</strong><span>Select an item to manage it.</span></div>

  const owned = Math.max(0, Math.floor(inventory[itemId] ?? 0))
  const equipped = Object.values(equipment).includes(itemId)
  const manuallyProtected = Boolean(protectedItems[itemId])
  const reserved = getEquippedReservedQuantity({ equipment }, itemId)
  const sellable = canSellItem({ inventory, protectedItems, equipment }, itemId)
  const destroyable = canDestroyItem({ inventory, protectedItems, equipment }, itemId)
  const reason = manuallyProtected ? 'Unprotect this item before selling or destroying it.' : reserved > 0 && maximum === 0 ? 'The equipped copy cannot be sold or destroyed.' : maximum === 0 ? 'No actionable copies available.' : null
  const quantityLabel = `${quantity} ${item.name}${quantity === 1 ? '' : 's'}`
  const setActionMode = (next: ActionMode) => { setMode(next); setConfirming(false); setQuantity((current) => maximum > 0 ? Math.max(1, Math.min(maximum, current)) : 0) }

  return <div className="inventory-actions-content">
    <div className="inventory-actions-summary"><ItemIcon itemId={itemId} size="tiny" /><div><strong>{item.name}</strong><span>Owned ×{owned.toLocaleString()}{reserved > 0 ? ` · Equipped ×${reserved}` : ''}</span></div></div>
    {mode === 'manage' ? <>
      <div className="inventory-actions-primary">
        <Button variant={equipped ? 'success' : manuallyProtected ? 'success' : 'secondary'} disabled={equipped} ariaLabel={equipped ? `${item.name} is automatically protected while equipped` : manuallyProtected ? `Unprotect ${item.name}` : `Protect ${item.name}`} tooltip={<span>{equipped ? 'Equipped items are always protected.' : protectionTooltip}</span>} onClick={() => toggleProtection(itemId)}>{equipped ? <><LockKeyhole size={14} /> PROTECTED</> : manuallyProtected ? <><Unlock size={14} /> UNPROTECT</> : <><ShieldCheck size={14} /> PROTECT</>}</Button>
        {item.kind === 'equipment' && (equipped ? <Button variant="success" disabled><Check size={14} /> EQUIPPED</Button> : <Button onClick={() => equipItem(itemId)} disabled={owned < 1}>EQUIP</Button>)}
      </div>
      <div className="inventory-action-meta"><span>SELL VALUE</span>{item.sellValue === null ? <strong className="inventory-action-unavailable">CANNOT BE SOLD</strong> : <strong className="inventory-action-gold">{item.sellValue.toLocaleString()} GOLD EACH</strong>}</div>
      {reason && <p className="inventory-action-note">{manuallyProtected ? 'PROTECTED · ' : ''}{reason}</p>}
      <div className="inventory-actions-destructive">
        <Button variant="secondary" disabled={!sellable} tooltip={<span>{sellable ? sellTooltip : reason ?? 'This item cannot be sold.'}</span>} onClick={() => setActionMode('sell')}>SELL</Button>
        <Button variant="danger" disabled={!destroyable} tooltip={<span>{destroyable ? destroyTooltip : item.actionRestrictionReason ?? reason ?? 'This item cannot be destroyed.'}</span>} onClick={() => setActionMode('destroy')}>DESTROY</Button>
      </div>
    </> : <ActionQuantityMode mode={mode} itemId={itemId} itemName={item.name} quantity={quantity} maximum={maximum} sellValue={item.sellValue} confirming={confirming} onQuantityChange={setQuantity} onCancel={() => setActionMode('manage')} onSell={() => { sellItem(itemId, quantity); setMode('manage') }} onDestroyRequest={() => setConfirming(true)} onDestroyConfirm={() => { destroyItem(itemId, quantity); setMode('manage'); setConfirming(false) }} />}
    <div className="inventory-actions-gold"><Coins size={14} /><span>GOLD</span><strong>{Math.max(0, Math.floor(currencies.gold)).toLocaleString()}</strong></div>
  </div>
}

function ActionQuantityMode({ mode, itemId, itemName, quantity, maximum, sellValue, confirming, onQuantityChange, onCancel, onSell, onDestroyRequest, onDestroyConfirm }: { mode: Exclude<ActionMode, 'manage'>; itemId: ItemId; itemName: string; quantity: number; maximum: number; sellValue: number | null; confirming: boolean; onQuantityChange: (quantity: number) => void; onCancel: () => void; onSell: () => void; onDestroyRequest: () => void; onDestroyConfirm: () => void }) {
  const isSell = mode === 'sell'
  const receive = quantity * (sellValue ?? 0)
  return <div className={`inventory-action-mode inventory-action-mode-${mode}`}>
    <div className="inventory-action-mode-title">{isSell ? 'SELL' : 'DESTROY'} · {itemName.toUpperCase()}</div>
    <InventoryQuantitySelector quantity={quantity} maximum={maximum} accent={mode} onChange={onQuantityChange} />
    {isSell ? <div className="inventory-action-preview"><span>{sellValue?.toLocaleString() ?? '0'} GOLD EACH</span><strong>YOU RECEIVE <b>{receive.toLocaleString()} GOLD</b></strong></div> : <div className="inventory-action-preview"><span>NO REWARD</span>{confirming && <div className="inventory-action-confirmation" role="status"><strong>DESTROY {quantity} {itemName}{quantity === 1 ? '' : 'S'} PERMANENTLY?</strong><small>THIS ACTION CANNOT BE UNDONE</small></div>}</div>}
    <div className="inventory-action-mode-buttons"><Button variant="ghost" onClick={onCancel}>CANCEL</Button>{isSell ? <Button variant="secondary" disabled={maximum < 1} onClick={onSell}>SELL {quantity}</Button> : confirming ? <Button variant="danger" disabled={maximum < 1} onClick={onDestroyConfirm}>CONFIRM DESTROY {quantity}</Button> : <Button variant="danger" disabled={maximum < 1} onClick={onDestroyRequest}>DESTROY {quantity}</Button>}</div>
  </div>
}
