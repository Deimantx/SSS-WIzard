import { SPELLS } from '../../game/data/spells'
import { SCHOOLS } from '../../game/data/schools'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { useGameStore } from '../../store/gameStore'
import type { CombatEffect, SpellId } from '../../game/types'
import { Button, Card } from '../../components/ui'
import { formatTime } from '../../game/utils'

const effectSummary = (effect: CombatEffect) => {
  if (effect.type === 'deal-damage') return `${effect.magnitude.type === 'flat' ? effect.magnitude.value : 'scaling'} ${effect.damageType} damage`
  if (effect.type === 'heal') return 'heal'
  if (effect.type === 'gain-barrier') return 'barrier'
  if (effect.type === 'apply-status') return STATUS_DEFINITIONS[effect.statusId].name
  if (effect.type === 'modify-action-timer') return `${effect.amountMs}ms delay`
  return effect.type.replace(/-/g, ' ')
}

export function SpellBarPanel() { const combat = useGameStore((state) => state.combat); const progress = useGameStore((state) => state.progress); const activities = useGameStore((state) => state.activities); const cast = useGameStore((state) => state.castSpell); const toggle = useGameStore((state) => state.toggleAutoCast); return <Card title="Spell Bar" className="spell-card"><div className="spell-list">{(Object.keys(SPELLS) as SpellId[]).map((id) => { const spell = SPELLS[id]; const unlocked = progress.unlockedSpells.includes(id); const auto = activities.autoCast[id]; const summary = spell.effects.map(effectSummary).join(' · '); return <div className={`spell-row ${unlocked ? '' : 'locked'}`} key={id}><div className="spell-mini" style={{ color: SCHOOLS[spell.school].color }}>{SCHOOLS[spell.school].glyph}</div><div className="spell-copy"><strong>{spell.name}</strong><small>{unlocked ? `${spell.manaCost} Mana · ${summary} · ${spell.autoCastFocus} Focus` : `Unlock ${SCHOOLS[spell.school].name} Level ${spell.unlockLevel}`}</small></div><Button variant={auto ? 'success' : 'ghost'} disabled={!unlocked || !combat.active} onClick={() => toggle(id)}>{auto ? 'Auto ON' : 'Auto-Cast'}</Button><Button disabled={!unlocked || !combat.active || combat.spellCooldowns[id] > 0} onClick={() => cast(id)}>{combat.spellCooldowns[id] > 0 ? formatTime(combat.spellCooldowns[id]) : 'Cast'}</Button></div> })}</div></Card> }
