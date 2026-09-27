import { Button } from '../../../components/ui'
import { ActiveSigilTraits, SigilSetSummary, SigilSocket } from '../../../components/sigils/SigilPresentation'
import { getSigilSlotRoman } from '../../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilSlot } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

export function EquipmentSigilLoadout({ onOpenVault }: { onOpenVault: (slot?: SigilSlot, instanceId?: string | null) => void }) {
  const storage = useGameStore((state) => state.sigils.storage)
  const equipped = useGameStore((state) => state.sigils.equipped)
  const sigilState = useGameStore((state) => state.sigils)
  const equippedCount = Object.values(equipped).filter(Boolean).length

  return <section className="equipment-sigil-loadout" aria-labelledby="equipment-sigil-heading">
    <div className="equipment-sigil-heading">
      <div><span className="eyebrow">SIX ENGRAVED CHANNELS</span><h3 id="equipment-sigil-heading">ARCANE SIGILS</h3><p>Equipped Sigils shape your stats, Set bonuses, and combat Traits.</p></div>
      <Button variant="secondary" onClick={() => onOpenVault()}>MANAGE SIGILS</Button>
    </div>
    <div className="equipment-sigil-sockets">{([1, 2, 3, 4, 5, 6] as SigilSlot[]).map((slot) => {
      const instanceId = equipped[slot]
      const sigil = instanceId ? storage[instanceId] : undefined
      return <SigilSocket key={slot} slot={slot} sigil={sigil} storage={storage} equipped={equipped} onClick={() => onOpenVault(slot, instanceId)} />
    })}</div>
    <div className="equipment-sigil-footer"><span>{equippedCount} / 6 CHANNELS ACTIVE</span><SigilSetSummary state={{ sigils: sigilState }} compact /></div>
    <ActiveSigilTraits state={{ sigils: sigilState }} />
  </section>
}
