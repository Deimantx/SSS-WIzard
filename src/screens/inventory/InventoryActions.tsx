import { Check, LockKeyhole, ShieldCheck, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import type { GameState, ItemId } from '../../game/types'
import { canDestroyItem, canSellItem, getActionableQuantity, getEquippedReservedQuantity } from '../../store/actions/inventoryActions'
import { getResearchReservedQuantity } from '../../game/systems/research/researchReservations'
import { InventoryQuantitySlider, clampInventoryQuantity } from './InventoryQuantitySelector'

const protectionTooltip = 'Protect this stack from Research, Transmutation, Guild donations, selling, and destruction.'
const sellTooltip = 'Convert items into Gold. Protected and equipped copies cannot be sold.'
const destroyTooltip = 'Permanently remove items without receiving anything.'

type InventoryActionsProps = {
  itemId: ItemId | null
  inventory: GameState['inventory']
  protectedItems: GameState['protectedItems']
  equipment: GameState['equipment']
  activities: GameState['activities']
  toggleProtection: (itemId: ItemId) => void
  equipItem: (itemId: ItemId) => void
  sellItem: (itemId: ItemId, quantity: number) => void
  destroyItem: (itemId: ItemId, quantity: number) => void
}

export function InventoryActions({ itemId, inventory, protectedItems, equipment, activities, toggleProtection, equipItem, sellItem, destroyItem }: InventoryActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [quantityEditing, setQuantityEditing] = useState(false)
  const [quantityDraft, setQuantityDraft] = useState('1')
  const [destroyConfirming, setDestroyConfirming] = useState(false)
  const item = itemId ? ITEMS[itemId] : null
  const maximum = itemId ? getActionableQuantity({ inventory, protectedItems, equipment, activities }, itemId) : 0

  useEffect(() => {
    setQuantity(1)
    setQuantityDraft('1')
    setQuantityEditing(false)
    setDestroyConfirming(false)
  }, [itemId])

  useEffect(() => {
    setQuantity((current) => {
      const next = clampInventoryQuantity(current, maximum)
      if (next !== current) setDestroyConfirming(false)
      return next
    })
    if (maximum < 1) setQuantityEditing(false)
  }, [maximum])

  useEffect(() => {
    if (!destroyConfirming) return
    const timeout = window.setTimeout(() => setDestroyConfirming(false), 6000)
    return () => window.clearTimeout(timeout)
  }, [destroyConfirming])

  useEffect(() => {
    if (!destroyConfirming) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDestroyConfirming(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [destroyConfirming])

  if (!itemId || !item) {
    return <div className="inventory-actions-content"><ActionHeader /><div className="inventory-actions-empty"><div className="inventory-empty-mark">◇</div><strong>SELECT AN ITEM</strong><span>Select an item to manage it.</span></div></div>
  }

  const owned = Math.max(0, Math.floor(inventory[itemId] ?? 0))
  const equipped = Object.values(equipment).includes(itemId)
  const manuallyProtected = Boolean(protectedItems[itemId])
  const reserved = getEquippedReservedQuantity({ equipment }, itemId)
  const researchReserved = getResearchReservedQuantity({ activities }, itemId)
  const sellable = canSellItem({ inventory, protectedItems, equipment, activities }, itemId)
  const destroyable = canDestroyItem({ inventory, protectedItems, equipment, activities }, itemId)
  const reason = manuallyProtected
    ? 'Unprotect this item before selling or destroying it.'
    : reserved > 0 && maximum === 0
      ? 'The equipped copy cannot be sold or destroyed.'
      : researchReserved > 0 && maximum === 0
        ? 'Prepared Research quantity is reserved until its cycles complete or the batch is removed.'
        : maximum === 0
        ? 'No actionable copies available.'
        : null

  const updateQuantity = (value: number) => {
    setQuantity(clampInventoryQuantity(value, maximum))
    setDestroyConfirming(false)
  }
  const beginQuantityEdit = () => {
    if (maximum < 1) return
    setQuantityDraft(String(quantity))
    setQuantityEditing(true)
  }
  const commitQuantityEdit = () => {
    updateQuantity(Number.parseInt(quantityDraft, 10))
    setQuantityEditing(false)
  }
  const cancelQuantityEdit = () => {
    setQuantityDraft(String(quantity))
    setQuantityEditing(false)
  }
  const toggleItemProtection = () => {
    setDestroyConfirming(false)
    toggleProtection(itemId)
  }
  const equipSelectedItem = () => {
    setDestroyConfirming(false)
    equipItem(itemId)
  }

  const saleValue = item.sellValue === null ? null : quantity * item.sellValue
  const quantityLabel = manuallyProtected ? 'PROTECTED' : maximum < 1 ? '0 AVAILABLE' : `${quantity} / ${maximum}`
  const quantityTooltip = <TooltipContent title="QUANTITY"><p>{quantity} selected<br />{maximum} actionable copies<br />{owned} owned{reserved > 0 ? <><br />{reserved} equipped</> : null}{researchReserved > 0 ? <><br />{researchReserved} prepared for Research</> : null}</p></TooltipContent>

  return <div className="inventory-actions-content">
    <ActionHeader
      equipped={equipped}
      manuallyProtected={manuallyProtected}
      itemName={item.name}
      equipment={item.kind === 'equipment'}
      owned={owned}
      onToggleProtection={toggleItemProtection}
      onEquip={equipSelectedItem}
    />
    <InventoryQuantitySlider value={quantity} max={maximum} disabled={maximum < 1} onChange={updateQuantity} />
    <div className="inventory-action-values">
      {destroyConfirming ? <div className="inventory-action-value inventory-actions-confirming" role="status" aria-live="assertive" aria-label="Destroy confirmation required. This action cannot be undone."><span>DESTROY</span><strong>NO REWARD</strong></div> : <GameTooltip block content={item.sellValue === null ? <TooltipContent title="SALE VALUE"><p>This item cannot be sold.</p></TooltipContent> : <TooltipContent title="SALE VALUE"><p>{item.sellValue.toLocaleString()} Gold each<br />{quantity} selected<br />Total: {saleValue?.toLocaleString()} Gold</p></TooltipContent>}><div className="inventory-action-value inventory-action-sale" tabIndex={0}><span>SALE VALUE</span>{item.sellValue === null ? <strong className="inventory-action-unavailable">CANNOT SELL</strong> : <strong className="inventory-action-gold">{saleValue?.toLocaleString()} GOLD</strong>}</div></GameTooltip>}
      <GameTooltip block content={quantityTooltip}><div className="inventory-action-value inventory-action-quantity"><span>QUANTITY</span>{quantityEditing ? <div className="inventory-action-quantity-edit"><input className="inventory-action-quantity-input" type="number" min={1} max={Math.max(1, maximum)} step={1} inputMode="numeric" value={quantityDraft} aria-label="Selected quantity" onChange={(event) => setQuantityDraft(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitQuantityEdit() } if (event.key === 'Escape') { event.preventDefault(); cancelQuantityEdit() } }} onBlur={commitQuantityEdit} autoFocus /><span>/ {maximum}</span></div> : <button type="button" className="inventory-action-quantity-button" disabled={maximum < 1} onClick={beginQuantityEdit}>{quantityLabel}</button>}</div></GameTooltip>
    </div>
    {reason && <p className="inventory-action-note">{manuallyProtected ? 'PROTECTED · ' : ''}{reason}</p>}
    <div className="inventory-actions-buttons">
      {destroyConfirming ? <><Button variant="ghost" onClick={() => setDestroyConfirming(false)}>CANCEL</Button><Button variant="danger" disabled={!destroyable || quantity < 1} ariaLabel="Confirm destroy" onClick={() => { destroyItem(itemId, quantity); setDestroyConfirming(false) }}>CONFIRM DESTROY</Button></> : <><Button className="inventory-action-sell" variant="secondary" disabled={!sellable || quantity < 1} tooltip={<span>{sellable ? sellTooltip : reason ?? 'This item cannot be sold.'}</span>} onClick={() => sellItem(itemId, quantity)}>SELL</Button><Button variant="danger" disabled={!destroyable || quantity < 1} tooltip={<span>{destroyable ? destroyTooltip : item.actionRestrictionReason ?? reason ?? 'This item cannot be destroyed.'}</span>} onClick={() => setDestroyConfirming(true)}>DESTROY</Button></>}
    </div>
  </div>
}

function ActionHeader({ equipped = false, manuallyProtected = false, itemName, equipment = false, owned = 0, onToggleProtection, onEquip }: { equipped?: boolean; manuallyProtected?: boolean; itemName?: string; equipment?: boolean; owned?: number; onToggleProtection?: () => void; onEquip?: () => void }) {
  return <div className="inventory-actions-head"><h2>ITEM ACTIONS</h2>{itemName && <div className="inventory-actions-head-controls">{equipment && (equipped ? <Button className="inventory-action-header-button" variant="success" disabled><Check size={13} /> EQUIPPED</Button> : <Button className="inventory-action-header-button" disabled={owned < 1} onClick={onEquip}>EQUIP</Button>)}<Button className="inventory-action-header-button" variant={equipped || manuallyProtected ? 'success' : 'secondary'} disabled={equipped} ariaLabel={equipped ? `${itemName} is automatically protected while equipped` : manuallyProtected ? `Unprotect ${itemName}` : `Protect ${itemName}`} tooltip={<span>{equipped ? 'Equipped items are always protected.' : protectionTooltip}</span>} onClick={onToggleProtection}>{equipped ? <><LockKeyhole size={13} /> PROTECTED</> : manuallyProtected ? <><Unlock size={13} /> UNPROTECT</> : <><ShieldCheck size={13} /> PROTECT</>}</Button></div>}</div>
}
