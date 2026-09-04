import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { useGameStore } from '../../store/gameStore'
import { playUiSound } from '../game-feel/audio/uiAudioEngine'
import { getLootReveals, pauseLootReveal, removeLootReveal, resumeLootReveal, subscribeLootReveals } from './lootRevealStore'
import type { LootRevealEvent } from './lootRevealTypes'

export function LootRevealLayer() {
  const reveals = useSyncExternalStore(subscribeLootReveals, getLootReveals, getLootReveals)
  const setScreen = useGameStore((state) => state.setScreen)
  const announced = useRef(new Set<string>())
  const lastSoundAt = useRef(0)
  useEffect(() => {
    reveals.forEach((reveal) => {
      if (announced.current.has(reveal.id)) return
      announced.current.add(reveal.id)
      const discovery = reveal.items.some((item) => item.isNewDiscovery)
      const now = performance.now()
      if (discovery || lastSoundAt.current === 0 || now - lastSoundAt.current >= 420) {
        playUiSound(discovery ? 'loot-discovery' : 'loot')
        lastSoundAt.current = now
      }
    })
    if (announced.current.size > 32) announced.current = new Set(reveals.map((reveal) => reveal.id))
  }, [reveals])
  if (!reveals.length) return null
  return <div className="loot-reveal-layer" aria-live="polite">{reveals.slice(0, 3).map((reveal) => <LootRevealCard key={reveal.id} reveal={reveal} onOpenInventory={() => { removeLootReveal(reveal.id); setScreen('inventory') }} />)}</div>
}

function LootRevealCard({ reveal, onOpenInventory }: { reveal: LootRevealEvent; onOpenInventory: () => void }) {
  const isNew = reveal.items.some((item) => item.isNewDiscovery)
  const visibleItems = reveal.items.slice(0, 4)
  const accent = ITEMS[reveal.items[0]?.itemId]?.color ?? 'var(--ui-accent)'
  return <button type="button" className={`loot-reveal-card ${isNew ? 'is-new' : ''}`} style={{ '--loot-accent': accent } as CSSProperties} onMouseEnter={() => pauseLootReveal(reveal.id)} onMouseLeave={() => resumeLootReveal(reveal.id)} onFocus={() => pauseLootReveal(reveal.id)} onBlur={() => resumeLootReveal(reveal.id)} onClick={onOpenInventory} aria-label={`${isNew ? 'New discovery. ' : ''}${reveal.items.map((item) => `${ITEMS[item.itemId].name} plus ${item.quantity}`).join(', ')}. Open Inventory.`}>
    <span className="loot-reveal-heading"><span>✦ {isNew ? 'NEW DISCOVERY' : 'LOOT ACQUIRED'}</span><small>VIEW INVENTORY</small></span>
    <span className="loot-reveal-items">{visibleItems.map((item) => <span className="loot-reveal-item" key={item.itemId}><ItemIcon itemId={item.itemId} size="tiny" /><strong>{ITEMS[item.itemId].name}</strong><b>+{item.quantity.toLocaleString()}</b></span>)}{reveal.items.length > visibleItems.length && <span className="loot-reveal-more">+{reveal.items.length - visibleItems.length} more</span>}</span>
    {isNew && <span className="loot-reveal-discovery">Added to Collection</span>}
    <span className="loot-reveal-source">{reveal.sourceLabel} · {reveal.sourceDetail}</span>
  </button>
}
