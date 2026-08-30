import { LogOut, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../components/ui'

export function LeaveDungeonDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const combat = useGameStore((state) => state.combat)
  const leave = useGameStore((state) => state.leaveDungeon)
  const dungeon = DUNGEONS[combat.dungeonId ?? 'whispering-woods']
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')]
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { window.clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [onClose])
  return <div className="combat-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div ref={dialogRef} className="combat-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dungeon-title"><header><div><span className="combat-subsection-label">RUN CONTROL</span><h2 id="leave-dungeon-title">LEAVE {dungeon.name.toUpperCase()}?</h2></div><Button icon variant="ghost" ariaLabel="Close leave confirmation" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header><div className="combat-confirm-copy"><strong>Threat Cleared will reset:</strong><span>{formatNumber(combat.threatCleared)} → 0</span><p>The current encounter will end. Your Spell configuration and other progress remain safe.</p></div><footer><Button variant="ghost" onClick={onClose}>STAY</Button><Button variant="danger" onClick={() => { leave(); onClose() }}><LogOut size={14} /> LEAVE DUNGEON</Button></footer></div></div>
}
