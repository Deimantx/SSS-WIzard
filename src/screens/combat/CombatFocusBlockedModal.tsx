import { AlertTriangle, X } from 'lucide-react'
import { Button, ModalPortal } from '../../components/ui'
import type { CombatFocusBlockSnapshot } from '../../game/ui/combatEntryBlockStore'
import { formatNumber } from '../../game/utils'

interface CombatFocusBlockedModalProps {
  snapshot: CombatFocusBlockSnapshot | null
  onClose: () => void
  onManageFocus: () => void
}

export function CombatFocusBlockedModal({ snapshot, onClose, onManageFocus }: CombatFocusBlockedModalProps) {
  if (!snapshot) return null
  return <ModalPortal open onClose={onClose} onEscape={onClose} onBackdropClick={onClose} backdropClassName="combat-focus-block-backdrop" surfaceClassName="combat-focus-block-modal" ariaLabelledBy="combat-focus-block-title" ariaDescribedBy="combat-focus-block-description">
    <header className="combat-focus-block-head">
      <div><span className="combat-subsection-label">COMBAT START BLOCKED</span><h2 id="combat-focus-block-title"><AlertTriangle size={18} aria-hidden="true" /> NOT ENOUGH FOCUS</h2></div>
      <Button icon variant="ghost" ariaLabel="Close" onClick={onClose}><X size={16} aria-hidden="true" /></Button>
    </header>
    <p id="combat-focus-block-description" className="combat-focus-block-copy">{snapshot.activeNonCombatFocus > 0 ? 'Combat cannot start because the prepared Auto-Cast loadout requires more Focus than is currently available. Free Focus from another active system or increase Max Focus, then try again.' : 'This combat loadout requires more Focus than your current Max Focus.'}</p>
    <div className="combat-focus-block-metrics">
      <Metric label="COMBAT FOCUS REQUIRED" value={`${formatNumber(snapshot.combatFocusRequired)} FOCUS`} />
      <Metric label="AVAILABLE FOR COMBAT" value={`${formatNumber(snapshot.availableForCombat)} FOCUS`} />
      <Metric label="MISSING FOCUS" value={`${formatNumber(snapshot.missingFocus)} FOCUS`} warning />
      <Metric label="MAX FOCUS" value={formatNumber(snapshot.maxFocus)} />
      <Metric label="ACTIVE ELSEWHERE" value={formatNumber(snapshot.activeNonCombatFocus)} />
    </div>
    <div className="combat-focus-block-loadout"><span>LOADOUT</span><strong>{snapshot.loadoutName}</strong></div>
    <footer className="combat-focus-block-foot"><Button variant="secondary" onClick={onManageFocus}>MANAGE FOCUS</Button><Button variant="primary" data-autofocus="true" onClick={onClose}>CLOSE</Button></footer>
  </ModalPortal>
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={warning ? 'is-warning' : undefined}><span>{label}</span><strong>{value}</strong></div>
}
