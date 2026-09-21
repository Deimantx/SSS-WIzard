import { Droplets, Flame, Mountain, Wind } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { RESONANCE_METADATA, RESONANCE_TYPES, type ResonanceType } from '../../game/content/resonance/resonance'
import { formatResonanceAmount } from '../../game/presentation/resonance/resonancePresentation'
import { useGameStore } from '../../store/gameStore'

const ICONS: Record<ResonanceType, typeof Flame> = { fire: Flame, water: Droplets, earth: Mountain, air: Wind }

export function CombatResonanceSummary() {
  const resonance = useGameStore(useShallow((state) => state.resonance))
  return <Card className="combat-resonance-summary">
    <div className="combat-resonance-summary-head"><div><span className="combat-subsection-label">RESONANCE HARVEST</span><small>Persisted magical balance</small></div><span className="combat-resonance-summary-note">COMBAT RESOURCE</span></div>
    <div className="combat-resonance-summary-values">{RESONANCE_TYPES.map((type) => {
      const Icon = ICONS[type]
      return <GameTooltip key={type} content={<TooltipContent title={RESONANCE_METADATA[type].label} description="Harvested from authored enemy defeats. Resonance is separate from Inventory and Arcane Points." />} accent="elemental"><div className={`combat-resonance-value resonance-${type}`} tabIndex={0}><Icon size={15} aria-hidden="true" /><span>{RESONANCE_METADATA[type].shortLabel}</span><strong>{formatResonanceAmount(resonance[type])}</strong></div></GameTooltip>
    })}</div>
  </Card>
}
