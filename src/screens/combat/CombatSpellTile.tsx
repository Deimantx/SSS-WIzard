import { AlertTriangle, CircleDot, Clock3, Droplet } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { getSpellRank } from '../../game/systems/spells'
import { formatSpellRank } from '../../game/systems/spells/spellProgression'
import type { SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellCardTooltip } from '../../components/spells/SpellCardTooltip'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { buildSpellDetailPresentation, type SpellPresentationState } from '../../game/presentation/spells/spellDetailPresentation'
import { useGameStore } from '../../store/gameStore'

export function CombatSpellTile({ spellId, presentationState, globalBlocker }: { spellId: SpellId; presentationState: SpellPresentationState; globalBlocker?: 'inactive' | 'no-target' | 'stunned' | null }) {
  const playerMana = useGameStore((state) => state.player.mana)
  const active = useGameStore((state) => state.activities.autoCast[spellId])
  const cast = useGameStore((state) => state.castSpell)
  const toggle = useGameStore((state) => state.toggleAutoCast)
  const rank = getSpellRank({ progress: presentationState.progress }, spellId)
  const spell = SPELLS[spellId]
  const presentation = useMemo(() => buildSpellDetailPresentation(presentationState, spellId, rank ?? 1), [presentationState, spellId, rank])
  const cooldown = useGameStore((state) => state.combat.spellCooldowns[spellId] ?? 0)
  const previousCooldown = useRef(cooldown)
  const castFeedbackTimer = useRef<number | null>(null)
  const [justResolved, setJustResolved] = useState(false)
  const combatActive = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const playerStunned = useGameStore((state) => actorCannotAct(state, 'player'))
  useEffect(() => {
    if (previousCooldown.current <= 0 && cooldown > 0) {
      setJustResolved(true)
      if (castFeedbackTimer.current !== null) window.clearTimeout(castFeedbackTimer.current)
      castFeedbackTimer.current = window.setTimeout(() => { setJustResolved(false); castFeedbackTimer.current = null }, 160)
      previousCooldown.current = cooldown
    }
    previousCooldown.current = cooldown
  }, [cooldown])
  useEffect(() => () => { if (castFeedbackTimer.current !== null) window.clearTimeout(castFeedbackTimer.current) }, [])
  const failure = rank === null ? 'locked' : playerStunned || globalBlocker === 'stunned' ? 'stunned' : globalBlocker === 'inactive' || !combatActive ? 'inactive' : globalBlocker === 'no-target' || spell.effects.some((effect) => effect.target === 'opponent') && !enemyId ? 'no-target' : cooldown > 0 ? 'cooldown' : playerMana < spell.manaCost ? 'mana' : null
  const localFailure = failure === 'mana' ? `Need ${Math.max(0, spell.manaCost - playerMana)}` : undefined
  const manualDisabled = Boolean(globalBlocker || failure)
  const stateLabel = cooldown > 0 ? `${formatTime(cooldown)} remaining` : localFailure ?? (manualDisabled ? 'Unavailable' : 'READY')
  const label = `${spell.name}, ${formatSpellRank(rank ?? 1)}, ${spell.manaCost} Mana, ${stateLabel}`
  return <div className={`spell-combat-tile${active ? ' is-auto' : ''}${failure && failure !== 'cooldown' ? ' is-unavailable' : ''}${cooldown > 0 ? ' is-cooldown' : ''}${justResolved ? ' is-casting' : ''}${failure === 'mana' ? ' is-mana-starved' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color, '--cooldown-percent': `${Math.max(0, Math.min(100, cooldown / Math.max(1, spell.cooldownMs) * 100))}%` } as React.CSSProperties}>
    <GameTooltip block wide placement="top" accent="elemental" content={<SpellCardTooltip presentation={presentation} />}>
      <button type="button" className="spell-combat-cast" aria-label={label} disabled={manualDisabled} onClick={() => cast(spellId)}><span className="spell-combat-tile-top"><span className="spell-combat-icon"><SpellIcon school={spell.school} size="medium" /></span></span><span className="spell-combat-name"><strong>{spell.name}</strong></span><span className="spell-combat-footer"><span className={`ui-mana${localFailure ? ' has-warning' : ''}`}><Droplet size={12} aria-hidden="true" />{spell.manaCost}{localFailure && <em><AlertTriangle size={10} aria-hidden="true" />{localFailure}</em>}</span><span className="ui-time"><Clock3 size={12} aria-hidden="true" />{cooldown > 0 ? formatTime(cooldown) : 'READY'}</span></span><span className="spell-combat-cooldown-mask" aria-hidden="true" /></button>
    </GameTooltip>
    <div className="spell-combat-auto-slot"><GameTooltip accent="focus" content={<TooltipContent title={active ? 'AUTO-CAST ACTIVE' : 'AUTO-CAST'} description={active ? `${presentation.autoCastFocus} Focus reserved. Condition: ${autoConditionLabel(spell.autoCondition)}.` : `${presentation.autoCastFocus} Focus will be reserved. Condition: ${autoConditionLabel(spell.autoCondition)}.`} />}><button type="button" className={`spell-combat-auto${active ? ' is-active' : ''}`} aria-label={`${active ? 'Disable' : 'Enable'} Auto-Cast for ${spell.name}`} aria-pressed={active} onClick={() => toggle(spellId)}><CircleDot size={14} aria-hidden="true" /></button></GameTooltip></div>
  </div>
}

function autoConditionLabel(condition: typeof SPELLS[SpellId]['autoCondition']) { if (!condition || condition.type === 'always') return 'Always'; if (condition.type === 'health-below') return `Health below ${condition.percent}%`; return `Barrier below ${condition.value}` }
