import { AlertTriangle, BookOpen, Clock3, Droplet, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getSpellStartFailure } from '../../game/engine/spellEngine'
import { getSpellRank } from '../../game/systems/spells'
import { formatSpellRank } from '../../game/systems/spells/spellProgression'
import type { CanonicalSpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellCardTooltip } from '../../components/spells/SpellCardTooltip'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { buildSpellDetailPresentation, type SpellPresentationState } from '../../game/presentation/spells/spellDetailPresentation'
import { formatCooldownNumber, getCooldownFraction } from '../../game/presentation/combat/combatCooldownPresentation'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { useGameStore } from '../../store/gameStore'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'

export function CombatSpellTile({ spellId, autoCast, autoCastPriority, presentationState, globalBlocker, onOpenPresetManager }: { spellId: CanonicalSpellId; autoCast: boolean; autoCastPriority: number | null; presentationState: SpellPresentationState; globalBlocker?: 'inactive' | 'no-target' | 'stunned' | null; onOpenPresetManager: () => void }) {
  const { openContextMenu } = useGameContextMenu()
  const playerMana = useGameStore((state) => state.player.mana)
  const requestManualSpell = useGameStore((state) => state.requestManualSpell)
  const rank = getSpellRank({ progress: presentationState.progress }, spellId)
  const spell = SPELLS[spellId]
  const livePresentationState = useGameStore(useShallow((state) => ({
    health: state.player.health,
    maxHealth: state.player.maxHealth,
    mana: state.player.mana,
    maxMana: state.player.maxMana,
    maxFocus: state.player.maxFocus,
    enemyId: state.combat.enemyId,
    enemyHp: state.combat.enemyHp,
    enemyMaxHp: state.combat.enemyMaxHp,
    enemyBarrier: state.combat.enemyBarrier,
    playerBarrier: state.combat.playerBarrier,
    enemyInstanceKey: state.combat.enemyInstanceKey,
    playerStatuses: state.combat.playerStatuses,
    enemyStatuses: state.combat.enemyStatuses,
  })))
  const liveState = useMemo(() => ({
    ...presentationState,
    player: { health: livePresentationState.health, maxHealth: livePresentationState.maxHealth, mana: livePresentationState.mana, maxMana: livePresentationState.maxMana, maxFocus: livePresentationState.maxFocus },
    combat: { enemyId: livePresentationState.enemyId, enemyHp: livePresentationState.enemyHp, enemyMaxHp: livePresentationState.enemyMaxHp, enemyBarrier: livePresentationState.enemyBarrier, playerBarrier: livePresentationState.playerBarrier, enemyInstanceKey: livePresentationState.enemyInstanceKey, playerStatuses: livePresentationState.playerStatuses, enemyStatuses: livePresentationState.enemyStatuses },
  }), [presentationState, livePresentationState])
  const presentation = useMemo(() => buildSpellDetailPresentation(liveState, spellId, rank ?? 1), [liveState, spellId, rank])
  const cooldown = useGameStore((state) => state.combat.spellCooldowns[spellId] ?? 0)
  const previousCooldown = useRef(cooldown)
  const castFeedbackTimer = useRef<number | null>(null)
  const [justResolved, setJustResolved] = useState(false)
  const [justReady, setJustReady] = useState(false)
  const startFailure = useGameStore((state) => getSpellStartFailure(state, spellId))
  const currentCast = useGameStore((state) => state.combat.pendingPlayerSpellCast?.spellId === spell.id)
  const manuallyQueued = useGameStore((state) => state.combat.queuedPlayerSpellId === spell.id)
  const manaCost = presentation.manaCost
  useEffect(() => {
    const previous = previousCooldown.current
    if (previous <= 0 && cooldown > 0) {
      setJustResolved(true)
      setJustReady(false)
      if (castFeedbackTimer.current !== null) window.clearTimeout(castFeedbackTimer.current)
      castFeedbackTimer.current = window.setTimeout(() => { setJustResolved(false); castFeedbackTimer.current = null }, 160)
    } else if (previous > 0 && cooldown <= 0) {
      setJustReady(true)
      if (castFeedbackTimer.current !== null) window.clearTimeout(castFeedbackTimer.current)
      castFeedbackTimer.current = window.setTimeout(() => { setJustReady(false); castFeedbackTimer.current = null }, 180)
    }
    previousCooldown.current = cooldown
  }, [cooldown])
  useEffect(() => () => { if (castFeedbackTimer.current !== null) window.clearTimeout(castFeedbackTimer.current) }, [])
  const manaLabel = formatResourceAmount(manaCost)
  const localFailure = startFailure === 'mana' ? `Need ${formatResourceAmount(Math.max(0, manaCost - playerMana))}` : undefined
  const queuedState = manuallyQueued
    ? cooldown > 0 ? `NEXT, ${formatTime(cooldown)} cooldown` : startFailure === 'mana' ? 'NEXT, WAITING MANA' : startFailure === 'no-target' ? 'NEXT, WAITING TARGET' : startFailure === 'stunned' || startFailure === 'silenced' ? 'NEXT, WAITING STATUS' : 'NEXT, READY'
    : null
  const stateLabel = currentCast ? 'CASTING' : queuedState ?? (startFailure === 'cooldown' ? `${formatTime(cooldown)} remaining` : localFailure ?? (startFailure ? startFailure.replace('-', ' ') : 'READY'))
  const label = `${spell.name}, ${autoCast ? `AUTO priority ${autoCastPriority}` : 'manual'}, ${formatSpellRank(rank ?? 1)}, ${manaLabel} Mana, ${stateLabel}`
  const cooldownFraction = getCooldownFraction(cooldown, presentation.cooldownMs)
  const openSpellMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: spell.name, meta: `${SCHOOLS[spell.school].name} · ${formatSpellRank(rank ?? 1)}` }, sections: [{ id: 'spell', actions: [{ id: 'school', label: 'Open Magic School', icon: BookOpen, onSelect: () => { setNavigationIntent({ schoolSpellId: spellId, schoolId: spell.school }); useGameStore.getState().setScreen('schools') } }, { id: 'manager', label: 'Preset Manager', icon: Settings2, onSelect: onOpenPresetManager }] }] })
  return <div data-spell-id={spellId} data-spell-state={currentCast ? 'casting' : manuallyQueued ? 'queued' : startFailure ?? 'ready'} className={`spell-combat-tile${autoCast ? ' is-auto' : ''}${startFailure && startFailure !== 'cooldown' && !manuallyQueued && !currentCast ? ' is-unavailable' : ''}${cooldown > 0 ? ' is-cooldown' : ''}${currentCast ? ' is-current-cast' : ''}${manuallyQueued ? ' is-manual-queued' : ''}${justResolved ? ' is-casting' : ''}${justReady ? ' is-ready' : ''}${startFailure === 'mana' && !manuallyQueued ? ' is-mana-starved' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color, '--cooldown-percent': `${cooldownFraction * 100}%` } as CSSProperties} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openSpellMenu(event.clientX, event.clientY, event.currentTarget) }}>
    <GameTooltip block wide placement="top" accent="elemental" content={<SpellCardTooltip presentation={presentation} />}>
      <button type="button" className="spell-combat-cast" aria-label={label} disabled={startFailure === 'unknown' || startFailure === 'locked' || startFailure === 'not-in-loadout'} onClick={() => requestManualSpell(spellId)}><span className="spell-combat-tile-top"><span className="spell-combat-icon"><SpellIcon school={spell.school} spellId={spellId} size="medium" />{cooldownFraction > 0 && <span className="spell-combat-cooldown-overlay" aria-hidden="true"><span className="spell-combat-cooldown-number">{formatCooldownNumber(cooldown)}</span></span>}</span></span><span className="spell-combat-name"><strong>{spell.name}</strong></span><span className="spell-combat-footer"><span className={`ui-mana${localFailure && !manuallyQueued ? ' has-warning' : ''}`}><Droplet size={12} aria-hidden="true" />{manaLabel}{localFailure && !manuallyQueued && <em><AlertTriangle size={10} aria-hidden="true" />{localFailure}</em>}</span><span className="ui-time"><Clock3 size={11} aria-hidden="true" />{presentation.castTimeLabel}</span></span></button>
    </GameTooltip>
    {currentCast && <span className="spell-combat-intent-badge is-casting" aria-hidden="true">CASTING</span>}
    {manuallyQueued && <span className="spell-combat-intent-badge is-next" aria-hidden="true"><strong>NEXT</strong><small>{queuedState?.replace(/^NEXT,?\s*/, '')}</small></span>}
    <div className="spell-combat-auto-slot"><GameTooltip accent="focus" content={<TooltipContent title={autoCast ? 'AUTO' : 'MANUAL'} description={autoCast ? `${presentation.autoCastFocus} Focus reserved. Auto-Cast follows this deck slot order.` : 'Manual slot. It reserves 0 Auto-Cast Focus.'} />}><span className={`spell-combat-auto read-only${autoCast ? ' is-active' : ''}`} aria-label={autoCast ? `AUTO, priority ${autoCastPriority}` : 'MANUAL, no Auto-Cast focus'}>{autoCast ? `AUTO · P${autoCastPriority}` : 'MANUAL'}</span></GameTooltip></div>
  </div>
}
