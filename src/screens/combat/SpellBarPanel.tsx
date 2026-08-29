import { SCHOOLS } from '../../game/data/schools'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatSpellRank, getAllSpellsInOrder, getSpellAutoCastFocusCost, getSpellRank } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import type { CombatEffect, SpellId } from '../../game/types'
import { Button, Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { formatTime } from '../../game/utils'

const effectSummary = (effect: CombatEffect) => {
  if (effect.type === 'deal-damage') return effect.magnitude.type === 'flat' ? `${effect.magnitude.value} ${effect.damageType} damage` : effect.magnitude.type === 'school-level' ? `${effect.magnitude.base} + ${effect.magnitude.perLevel}/level ${effect.damageType} damage` : `${effect.damageType} damage`
  if (effect.type === 'heal') return effect.magnitude.type === 'flat' ? `Heal ${effect.magnitude.value}` : 'Scaling heal'
  if (effect.type === 'gain-barrier') return effect.magnitude.type === 'flat' ? `Barrier ${effect.magnitude.value}` : 'Scaling barrier'
  if (effect.type === 'apply-status') return STATUS_DEFINITIONS[effect.statusId].name
  if (effect.type === 'modify-action-timer') return `${effect.amountMs}ms delay`
  return effect.type.replace(/-/g, ' ')
}

export function SpellBarPanel() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const cast = useGameStore((state) => state.castSpell)
  const toggle = useGameStore((state) => state.toggleAutoCast)
  return <Card title="Spell Bar" className="spell-card"><div className="spell-list">{getAllSpellsInOrder().map((spell) => {
    const id = spell.id as SpellId
    const rank = getSpellRank({ progress }, id)
    const focusCost = getSpellAutoCastFocusCost({ progress }, id)
    const unlocked = rank !== null
    const auto = activities.autoCast[id]
    const summary = spell.effects.map(effectSummary).join(' · ')
    const tooltip = <TooltipContent title={`${spell.name} · ${unlocked ? formatSpellRank(rank) : 'Locked'}`} description={spell.description}><div className="tooltip-section"><small>CASTING</small><p>{spell.manaCost} Mana · {formatTime(spell.cooldownMs)} Cooldown · {unlocked ? `Auto-Cast ${focusCost} Focus` : `Unlock ${SCHOOLS[spell.school].name} Level ${spell.unlockLevel}`}</p></div><div className="tooltip-section"><small>EFFECTS</small><p>{summary}</p></div></TooltipContent>
    return <GameTooltip key={id} block accent={unlocked ? 'elemental' : 'warning'} content={tooltip}><div className={`spell-row ${unlocked ? '' : 'locked'}`}>
      <div className="spell-mini" style={{ color: SCHOOLS[spell.school].color }}>{SCHOOLS[spell.school].glyph}</div>
      <div className="spell-copy"><strong>{spell.name} {unlocked && <small>{formatSpellRank(rank)}</small>}</strong><small>{unlocked ? `${spell.manaCost} Mana · ${summary} · Auto-Cast ${focusCost} Focus` : `LOCKED · Unlock ${SCHOOLS[spell.school].name} Level ${spell.unlockLevel}`}</small></div>
      <Button variant={auto ? 'success' : 'ghost'} disabled={!unlocked || !combat.active} onClick={() => toggle(id)}>{auto ? 'Auto ON' : 'Auto-Cast'}</Button>
      <Button disabled={!unlocked || !combat.active || combat.spellCooldowns[id] > 0} onClick={() => cast(id)}>{combat.spellCooldowns[id] > 0 ? formatTime(combat.spellCooldowns[id]) : 'Cast'}</Button>
    </div></GameTooltip>
  })}</div></Card>
}
