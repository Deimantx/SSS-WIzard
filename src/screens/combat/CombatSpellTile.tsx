import { CircleDot, Clock3, Droplet, AlertTriangle } from 'lucide-react'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getSpellCastFailure } from '../../game/engine/spellEngine'
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

export function CombatSpellTile({ spellId, presentationState }: { spellId: SpellId; presentationState: SpellPresentationState }) {
  const combat = useGameStore((state) => state.combat)
  const playerMana = useGameStore((state) => state.player.mana)
  const active = useGameStore((state) => state.activities.autoCast[spellId])
  const cast = useGameStore((state) => state.castSpell)
  const toggle = useGameStore((state) => state.toggleAutoCast)
  const rank = getSpellRank({ progress: presentationState.progress }, spellId)
  const spell = SPELLS[spellId]
  const presentation = buildSpellDetailPresentation(presentationState, spellId, rank ?? 1)
  const cooldown = combat.spellCooldowns[spellId] ?? 0
  const failure = useGameStore((state) => getSpellCastFailure(state, spellId))
  const manualDisabled = Boolean(failure)
  const failureText = failure === 'mana' ? `Need ${Math.max(0, spell.manaCost - playerMana)} Mana` : failure === 'stunned' ? 'Player stunned' : failure === 'inactive' ? 'Enter combat to cast' : failure === 'no-target' ? 'No enemy target' : failure === 'cooldown' ? `${formatTime(cooldown)} remaining` : undefined
  const label = `${spell.name}, ${formatSpellRank(rank ?? 1)}, ${spell.manaCost} Mana, ${cooldown > 0 ? `${formatTime(cooldown)} remaining` : manualDisabled ? failureText ?? 'Unavailable' : 'ready'}`
  return <div className={`spell-combat-tile${active ? ' is-auto' : ''}${cooldown > 0 ? ' is-cooldown' : ''}${failure === 'mana' ? ' is-mana-starved' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color, '--cooldown-percent': `${Math.max(0, Math.min(100, cooldown / Math.max(1, spell.cooldownMs) * 100))}%` } as React.CSSProperties}><GameTooltip block wide placement="top" accent="elemental" content={<SpellCardTooltip presentation={presentation} />}><button type="button" className="spell-combat-cast" aria-label={label} disabled={manualDisabled} onClick={() => cast(spellId)}><span className="spell-combat-tile-top"><span className="spell-combat-icon"><SpellIcon school={spell.school} size="medium" /></span>{cooldown > 0 && <span className="spell-combat-cooldown">{formatTime(cooldown)}</span>}</span><span className="spell-combat-name"><strong>{spell.name}</strong><small>{spell.school.toUpperCase()} · {formatSpellRank(rank ?? 1).toUpperCase()}</small></span><span className="spell-combat-footer"><span className="ui-mana"><Droplet size={12} aria-hidden="true" />{spell.manaCost}</span><span className="ui-time"><Clock3 size={12} aria-hidden="true" />{cooldown > 0 ? formatTime(cooldown) : 'READY'}</span></span>{failureText && failure !== 'cooldown' && <span className="spell-combat-warning"><AlertTriangle size={11} aria-hidden="true" />{failureText}</span>}<span className="spell-combat-cooldown-mask" aria-hidden="true" /></button></GameTooltip><GameTooltip accent="focus" content={<TooltipContent title={active ? 'AUTO-CAST ACTIVE' : 'AUTO-CAST'} description={active ? `${presentation.autoCastFocus} Focus reserved. Condition: ${autoConditionLabel(spell.autoCondition)}.` : `${presentation.autoCastFocus} Focus will be reserved. Condition: ${autoConditionLabel(spell.autoCondition)}.`} />}><button type="button" className={`spell-combat-auto${active ? ' is-active' : ''}`} aria-label={`${active ? 'Disable' : 'Enable'} Auto-Cast for ${spell.name}`} aria-pressed={active} onClick={() => toggle(spellId)}><CircleDot size={14} aria-hidden="true" /></button></GameTooltip></div>
}

function autoConditionLabel(condition: typeof SPELLS[SpellId]['autoCondition']) { if (!condition || condition.type === 'always') return 'Always'; if (condition.type === 'health-below') return `Health below ${condition.percent}%`; return `Barrier below ${condition.value}` }
