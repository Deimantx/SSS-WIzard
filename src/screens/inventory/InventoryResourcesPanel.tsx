import { Droplets, Flame, Mountain, Wind } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { RESONANCE_METADATA, RESONANCE_TYPES, type ResonanceType } from '../../game/content/resonance/resonance'
import { formatResonanceAmount } from '../../game/presentation/resonance/resonancePresentation'
import { useGameStore } from '../../store/gameStore'

const ICONS: Record<ResonanceType, typeof Flame> = { fire: Flame, water: Droplets, earth: Mountain, air: Wind }

export function InventoryResourcesPanel() {
  const resonance = useGameStore(useShallow((state) => state.resonance))

  return <Card title="RESOURCES" className="inventory-resources-panel" action={<span className="inventory-resources-meta">PERSISTENT MAGICAL BALANCES</span>}>
    <div className="inventory-resources-grid">
      {RESONANCE_TYPES.map((type) => {
        const Icon = ICONS[type]
        const metadata = RESONANCE_METADATA[type]
        return <GameTooltip key={type} block content={<TooltipContent title={metadata.label} description="A persistent magical progression balance. It is separate from stackable Inventory items." />} accent="elemental">
          <div className={`inventory-resource-row resonance-${type}`} tabIndex={0}>
            <span className="inventory-resource-icon"><Icon size={17} aria-hidden="true" /></span>
            <strong>{metadata.label}</strong>
            <b>{formatResonanceAmount(resonance[type])}</b>
          </div>
        </GameTooltip>
      })}
    </div>
    <p className="inventory-resources-note">Resonance is an account balance. Life Essence, Artifact Essence, fragments, equipment, and other materials remain normal Inventory items below.</p>
  </Card>
}
