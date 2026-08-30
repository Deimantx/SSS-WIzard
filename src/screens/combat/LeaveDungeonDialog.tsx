import { LogOut, X } from 'lucide-react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { Button, ModalPortal } from '../../components/ui'

export function LeaveDungeonDialog({ onClose }: { onClose: () => void }) {
  const combat = useGameStore((state) => state.combat)
  const leave = useGameStore((state) => state.leaveDungeon)
  const dungeon = DUNGEONS[combat.dungeonId ?? 'whispering-woods']

  return <ModalPortal open onClose={onClose} backdropClassName="combat-modal-backdrop" surfaceClassName="combat-confirm-dialog" ariaLabelledBy="leave-dungeon-title">
    <header><div><span className="combat-subsection-label">RUN CONTROL</span><h2 id="leave-dungeon-title">LEAVE {dungeon.name.toUpperCase()}?</h2></div><Button icon variant="ghost" ariaLabel="Close leave confirmation" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header>
    <div className="combat-confirm-copy"><strong>Threat Cleared will reset:</strong><span>{formatNumber(combat.threatCleared)} → 0</span><p>The current encounter will end. Your Spell configuration and other progress remain safe.</p></div>
    <footer><Button variant="ghost" onClick={onClose}>STAY</Button><Button variant="danger" onClick={() => { leave(); onClose() }}><LogOut size={14} /> LEAVE DUNGEON</Button></footer>
  </ModalPortal>
}
