import { AlertTriangle, Droplets, Shield, Skull, Sparkles, Swords, Zap } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { useCombatAlertsStore } from '../../game/ui/combatAlertsStore'
import type { CombatAlert } from '../../game/presentation/combat/combatAlertPresentation'

const icons: Record<CombatAlert['category'], typeof Sparkles> = {
  'enemy-action': Swords,
  boss: Zap,
  status: AlertTriangle,
  trait: Sparkles,
  resource: Droplets,
  barrier: Shield,
  death: Skull,
  system: Sparkles,
}

export function CombatAlerts() {
  const alerts = useCombatAlertsStore((state) => state.alerts)
  if (!alerts.length) return null
  return <div className="combat-alert-stack" aria-live="polite" aria-label="Combat alerts">
    {alerts.map((alert) => <CombatAlertRow key={alert.id} alert={alert} />)}
  </div>
}

function CombatAlertRow({ alert }: { alert: CombatAlert }) {
  const Icon = icons[alert.category] ?? Sparkles
  return <GameTooltip block wide content={<TooltipContent title={alert.title} description={alert.detail}><div className="tooltip-row"><span>PRIORITY</span><b>{alert.priority.toUpperCase()}</b></div></TooltipContent>}>
    <div className={`combat-alert-row combat-alert-${alert.priority} combat-alert-semantic-${alert.semantic}`} tabIndex={0} role="status">
      <span className="combat-alert-icon"><Icon size={14} aria-hidden="true" /></span>
      <span className="combat-alert-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span>
    </div>
  </GameTooltip>
}
