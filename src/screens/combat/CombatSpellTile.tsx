import { AlertTriangle, BookOpen, Clock3, Droplet, Settings2 } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useEffect, type CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { actorCannotAct, actorCannotCastSpells } from '../../game/systems/combat/statusRuntime'
import { getSpellRank, isSpellUnlocked } from '../../game/systems/spells'
import { getCooldownRecoveryMultiplier } from '../../game/systems/combat/combatStats'
import type { CanonicalSpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellCardTooltip } from '../../components/spells/SpellCardTooltip'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { buildSpellDetailPresentation, type SpellPresentationState } from '../../game/presentation/spells/spellDetailPresentation'
import { buildCombatSpellTilePresentation, getCombatSpellTileBlocker, type CombatSpellTileLiveState } from '../../game/presentation/spells/combatSpellTilePresentation'
import { formatCooldownNumber } from '../../game/presentation/combat/combatCooldownPresentation'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { getCombatVisualTimelineProgress, getCombatVisualRate } from './performance/combatTimeline'
import { subscribeCombatVisualFrame } from './performance/combatVisualClock'
import { useCombatPerformanceToggle } from './performance/combatPerformanceDiagnostics'
import { useCombatVisualTimeline } from './CombatActionProgress'
import { useGameStore } from '../../store/gameStore'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'

export function CombatSpellTile({ spellId, autoCast, autoCastPriority, presentationState, globalBlocker, onOpenPresetManager }: { spellId: CanonicalSpellId; autoCast: boolean; autoCastPriority: number | null; presentationState: SpellPresentationState; globalBlocker?: 'inactive' | 'no-target' | 'stunned' | null; onOpenPresetManager: () => void }) {
  const { openContextMenu } = useGameContextMenu()
  const playerMana = useGameStore((state) => state.player.mana)
  const requestManualSpell = useGameStore((state) => state.requestManualSpell)
  const rank = getSpellRank({ progress: presentationState.progress }, spellId) ?? 1
  const spell = SPELLS[spellId]
  const tilePresentation = useMemo(() => buildCombatSpellTilePresentation(presentationState, spellId, rank), [presentationState, rank, spellId])
  const live = useGameStore(useShallow((state) => ({
    cooldownActive: (state.combat.spellCooldowns[spellId] ?? 0) > 0,
    currentCast: state.combat.pendingPlayerSpellCast?.spellId === spell.id,
    manuallyQueued: state.combat.queuedPlayerSpellId === spell.id,
    playerCannotAct: actorCannotAct(state, 'player'),
    playerCannotCast: actorCannotCastSpells(state, 'player'),
    combatActive: state.combat.active,
    inLoadout: Boolean(state.combat.activeSpellLoadout?.slots.some((slot) => slot.spellId === spellId)),
    hasTarget: Boolean(state.combat.enemyId),
    ignoreCooldowns: state.debug.ignoreSpellCooldowns,
    infiniteMana: state.debug.infiniteMana,
    unlocked: isSpellUnlocked(state, spellId),
  })))
  const liveState: CombatSpellTileLiveState = { playerMana, ...live }
  const startFailure = globalBlocker === 'inactive' ? 'inactive' : globalBlocker === 'stunned' ? 'stunned' : getCombatSpellTileBlocker(spellId, tilePresentation, liveState)
  const manuallyQueued = live.manuallyQueued
  const currentCast = live.currentCast
  const manaCost = tilePresentation.manaCost
  const localFailure = startFailure === 'mana' ? `Need ${formatResourceAmount(Math.max(0, manaCost - playerMana))}` : undefined
  const queuedState = manuallyQueued
    ? live.cooldownActive ? 'NEXT, ON COOLDOWN' : startFailure === 'mana' ? 'NEXT, WAITING MANA' : startFailure === 'no-target' ? 'NEXT, WAITING TARGET' : startFailure === 'stunned' || startFailure === 'silenced' ? 'NEXT, WAITING STATUS' : 'NEXT, READY'
    : null
  const stateLabel = currentCast ? 'CASTING' : queuedState ?? (startFailure === 'cooldown' ? 'ON COOLDOWN' : localFailure ?? (startFailure ? startFailure.replace('-', ' ') : 'READY'))
  const label = `${spell.name}, ${autoCast ? `AUTO priority ${autoCastPriority}` : 'manual'}, ${tilePresentation.rankLabel}, ${formatResourceAmount(manaCost)} Mana, ${stateLabel}`
  const openSpellMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: spell.name, meta: `${SCHOOLS[spell.school].name} · ${tilePresentation.rankLabel}` }, sections: [{ id: 'spell', actions: [{ id: 'school', label: 'Open Magic School', icon: BookOpen, onSelect: () => { setNavigationIntent({ schoolSpellId: spellId, schoolId: spell.school }); useGameStore.getState().setScreen('schools') } }, { id: 'manager', label: 'Preset Manager', icon: Settings2, onSelect: onOpenPresetManager }] }] })
  return <div data-spell-id={spellId} data-spell-state={currentCast ? 'casting' : manuallyQueued ? 'queued' : startFailure ?? 'ready'} className={`spell-combat-tile${autoCast ? ' is-auto' : ''}${startFailure && startFailure !== 'cooldown' && !manuallyQueued && !currentCast ? ' is-unavailable' : ''}${live.cooldownActive ? ' is-cooldown' : ''}${currentCast ? ' is-current-cast' : ''}${manuallyQueued ? ' is-manual-queued' : ''}${startFailure === 'mana' && !manuallyQueued ? ' is-mana-starved' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color } as CSSProperties} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openSpellMenu(event.clientX, event.clientY, event.currentTarget) }}>
    <GameTooltip block wide placement="top" accent="elemental" content={<LazySpellCardTooltip spellId={spellId} rank={rank} />}>
      <button type="button" className="spell-combat-cast" aria-label={label} disabled={startFailure === 'locked' || startFailure === 'not-in-loadout'} onClick={() => requestManualSpell(spellId)}><span className="spell-combat-tile-top"><span className="spell-combat-icon"><SpellIcon school={spell.school} spellId={spellId} size="medium" /><CooldownOverlay spellId={spellId} cooldownMs={tilePresentation.cooldownMs} /></span></span><span className="spell-combat-name"><strong>{spell.name}</strong></span><span className="spell-combat-footer"><span className={`ui-mana${localFailure && !manuallyQueued ? ' has-warning' : ''}`}><Droplet size={12} aria-hidden="true" />{formatResourceAmount(manaCost)}{localFailure && !manuallyQueued && <em><AlertTriangle size={10} aria-hidden="true" />{localFailure}</em>}</span><span className="ui-time"><Clock3 size={11} aria-hidden="true" />{tilePresentation.castTimeLabel}</span></span></button>
    </GameTooltip>
    {currentCast && <span className="spell-combat-intent-badge is-casting" aria-hidden="true">CASTING</span>}
    {manuallyQueued && <span className="spell-combat-intent-badge is-next" aria-hidden="true"><strong>NEXT</strong><small>{queuedState?.replace(/^NEXT,?\s*/, '')}</small></span>}
    <div className="spell-combat-auto-slot"><GameTooltip accent="focus" content={<TooltipContent title={autoCast ? 'AUTO' : 'MANUAL'} description={autoCast ? `${tilePresentation.autoCastFocus} Focus reserved. Auto-Cast follows this deck slot order.` : 'Manual slot. It reserves 0 Auto-Cast Focus.'} />}><span className={`spell-combat-auto read-only${autoCast ? ' is-active' : ''}`} aria-label={autoCast ? `AUTO, priority ${autoCastPriority}` : 'MANUAL, no Auto-Cast focus'}>{autoCast ? `AUTO · P${autoCastPriority}` : 'MANUAL'}</span></GameTooltip></div>
  </div>
}

function LazySpellCardTooltip({ spellId, rank }: { spellId: CanonicalSpellId; rank: Parameters<typeof buildSpellDetailPresentation>[2] }) {
  const presentation = useMemo(() => buildSpellDetailPresentation(useGameStore.getState(), spellId, rank), [rank, spellId])
  return <SpellCardTooltip presentation={presentation} />
}

function CooldownOverlay({ spellId, cooldownMs }: { spellId: CanonicalSpellId; cooldownMs: number }) {
  const overlaysEnabled = useCombatPerformanceToggle('cooldownOverlays')
  if (!overlaysEnabled) return null
  return <CooldownOverlayLive spellId={spellId} cooldownMs={cooldownMs} />
}

function CooldownOverlayLive({ spellId, cooldownMs }: { spellId: CanonicalSpellId; cooldownMs: number }) {
  const signal = useGameStore(useShallow((state) => ({ cooldown: state.combat.spellCooldowns[spellId] ?? 0, recovery: getCooldownRecoveryMultiplier(state), paused: state.debug.combatPaused, timeScale: state.debug.combatTimeScale })))
  if (signal.cooldown <= 0) return null
  return <CooldownOverlayActive spellId={spellId} cooldownMs={cooldownMs} signal={signal} />
}

function CooldownOverlayActive({ spellId, cooldownMs, signal }: { spellId: CanonicalSpellId; cooldownMs: number; signal: { cooldown: number; recovery: number; paused: boolean; timeScale: number } }) {
  const rate = getCombatVisualRate(signal.recovery, signal.paused, signal.timeScale)
  const snapshot = { cycleId: spellId, baseWorkMs: Math.max(1, cooldownMs), remainingWorkMs: Math.max(0, signal.cooldown), rate, blocked: signal.paused }
  const timelineRef = useCombatVisualTimeline(snapshot)
  const overlayRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!timelineRef.lastReconciliation?.requiresImmediatePaint || !timelineRef.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, performance.now())
    overlayRef.current?.style.setProperty('--cooldown-percent', `${Math.max(0, Math.min(100, (1 - progress) * 100))}%`)
  }, [cooldownMs, rate, signal.cooldown, signal.paused, timelineRef, snapshot.blocked])
  useEffect(() => subscribeCombatVisualFrame((timestamp) => {
    if (!timelineRef.current || !overlayRef.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, timestamp)
    overlayRef.current.style.setProperty('--cooldown-percent', `${Math.max(0, Math.min(100, (1 - progress) * 100))}%`)
  }), [timelineRef])
  return <span ref={overlayRef} className="spell-combat-cooldown-overlay" aria-hidden="true"><span className="spell-combat-cooldown-number">{formatCooldownNumber(signal.cooldown)}</span></span>
}
