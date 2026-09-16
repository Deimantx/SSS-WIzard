import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { getActiveGuardian, getSelectedGuardian, isSummoningUnlocked } from '../../game/systems/summoning/summoningSelectors'
import { useGameStore } from '../../store/gameStore'
import { formatResourceRate } from '../../game/presentation/resources/resourcePresentation'

export function CombatGuardianIndicator() {
  const unlocked = useGameStore((state) => isSummoningUnlocked(state))
  const guardians = useGameStore((state) => state.guardians)
  const combat = useGameStore((state) => state.combat)
  const selected = getSelectedGuardian({ guardians })
  const active = getActiveGuardian({ combat })

  if (!unlocked || !selected || (!active && !combat.active)) return null

  const outOfMana = !active && combat.active && Boolean(combat.enemyId) && combat.guardian.suppressedForEncounter
  const label = active ? 'ACTIVE' : outOfMana ? 'OUT OF MANA' : 'BOUND · NEXT ENCOUNTER'
  const description = active
    ? `${active.name} is active and drains ${formatResourceRate(active.manaPerSecond)} Mana per second while this enemy encounter continues.`
    : outOfMana
      ? `${selected.name} has faded for this encounter. It returns when the next enemy encounter begins.`
      : `${selected.name} is selected and will join when the next enemy encounter begins.`
  const guardian = active ?? selected

  return <GameTooltip block accent={outOfMana ? 'warning' : 'elemental'} content={<TooltipContent title={`${guardian.name} · ${label}`} description={description} />}><div className={`combat-guardian-indicator${outOfMana ? ' is-suppressed' : active ? ' is-active' : ' is-bound'}`} role="status"><span className="combat-guardian-indicator-icon" style={{ '--guardian-color': guardian.ui.color } as React.CSSProperties}>{guardian.ui.icon}</span><span className="combat-guardian-indicator-copy"><strong>{guardian.name.toUpperCase()}</strong><small>{label}{active ? ` · ${formatResourceRate(active.manaPerSecond)} Mana/s` : outOfMana ? ' · Returns next encounter' : ''}</small></span></div></GameTooltip>
}
