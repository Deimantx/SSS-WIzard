import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { SIGIL_QUALITIES } from '../../game/content/sigils/sigilQualities'
import { useGameStore } from '../../store/gameStore'
import { setUiPreferences } from '../preferences/uiPreferencesStore'
import { setNavigationIntent } from '../navigation/navigationIntent'
import { playUiSound } from '../game-feel/audio/uiAudioEngine'
import { getLootReveals, pauseLootReveal, removeLootReveal, resumeLootReveal, subscribeLootReveals } from './lootRevealStore'
import type { LootRevealEvent } from './lootRevealTypes'
import type { SigilSetId, SigilSlot } from '../../game/types'

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
  return <div className="loot-reveal-layer" aria-live="polite">{reveals.slice(0, 3).map((reveal) => <LootRevealCard key={reveal.id} reveal={reveal} onOpenInventory={() => { removeLootReveal(reveal.id); setScreen('inventory') }} onOpenSigil={() => { removeLootReveal(reveal.id); const sigil = reveal.sigils.find((entry) => !entry.autoSalvaged); if (sigil) { setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: sigil.instanceId, equipmentSigilSlot: sigil.slot as SigilSlot }); setScreen('equipment') } else { const salvaged = reveal.sigils[0]; setNavigationIntent({ sigilSetId: (salvaged?.setId as SigilSetId | undefined) ?? null }); setUiPreferences({ screenState: { collection: { primaryTab: 'sigils' } } }); setScreen('collection') } }} />)}</div>
}

function LootRevealCard({ reveal, onOpenInventory, onOpenSigil }: { reveal: LootRevealEvent; onOpenInventory: () => void; onOpenSigil: () => void }) {
  const isNew = reveal.items.some((item) => item.isNewDiscovery)
  const hasSigils = reveal.sigils.length > 0
  const hasStorableSigil = reveal.sigils.some((sigil) => !sigil.autoSalvaged)
  const visibleItems = reveal.items.slice(0, 4)
  const accent = ITEMS[reveal.items[0]?.itemId]?.color ?? 'var(--ui-accent)'
  return <div className={`loot-reveal-card ${isNew || hasSigils ? 'is-new' : ''}`} style={{ '--loot-accent': accent } as CSSProperties} onMouseEnter={() => pauseLootReveal(reveal.id)} onMouseLeave={() => resumeLootReveal(reveal.id)} onFocus={() => pauseLootReveal(reveal.id)} onBlur={() => resumeLootReveal(reveal.id)}>
    <span className="loot-reveal-heading"><span>✦ {isNew ? 'NEW DISCOVERY' : 'LOOT ACQUIRED'}</span><small>{hasSigils ? hasStorableSigil ? 'VIEW SIGIL' : 'VIEW SET' : 'VIEW INVENTORY'}</small></span>
    <span className="loot-reveal-items">{visibleItems.map((item) => <span className="loot-reveal-item" key={item.itemId}><ItemIcon itemId={item.itemId} size="tiny" /><strong>{ITEMS[item.itemId].name}</strong><b>+{item.quantity.toLocaleString()}</b></span>)}{reveal.items.length > visibleItems.length && <span className="loot-reveal-more">+{reveal.items.length - visibleItems.length} more</span>}{reveal.sigils.map((sigil) => <span className="loot-reveal-item loot-reveal-sigil" key={sigil.instanceId}><strong>T{sigil.tier} {SIGIL_QUALITIES.find(({ id }) => id === sigil.quality)?.label ?? sigil.quality} Sigil</strong><b>{sigil.autoSalvaged ? `AUTO-SALVAGED · +${sigil.dustGranted} DUST` : 'Added to Storage'}</b></span>)}</span>
    {isNew && <span className="loot-reveal-discovery">Added to Collection</span>}
    <span className="loot-reveal-source">{reveal.sourceLabel} · {reveal.sourceDetail}</span>
    <span className="loot-reveal-actions"><button type="button" className="loot-reveal-action primary" onClick={hasSigils ? onOpenSigil : onOpenInventory}>{hasSigils ? hasStorableSigil ? 'VIEW SIGIL' : 'VIEW SET' : 'VIEW INVENTORY'}</button>{hasSigils && reveal.items.length > 0 && <button type="button" className="loot-reveal-action" onClick={onOpenInventory}>VIEW INVENTORY</button>}</span>
  </div>
}
