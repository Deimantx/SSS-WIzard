import { AlertTriangle, CircleDot, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { actorCannotAct, actorCannotCastSpells } from '../../game/systems/combat/statusRuntime'
import { getCombatFocusReadiness, getSpellPresetFocusProjection, getSpellPresetSignature } from '../../game/systems/spells'
import type { SpellPresetProjectionState } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, SelectMenu, Status, type SelectMenuOption } from '../../components/ui'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatSpellTile } from './CombatSpellTile'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'

export function CombatSpellDeck() {
  const [presetNotice, setPresetNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const arcaneCore = useGameStore((state) => state.arcaneCore)
  const activities = useGameStore(useShallow((state) => ({
    channeling: state.activities.channeling,
    research: state.activities.research,
    transmutation: state.activities.transmutation,
    artificing: state.activities.artificing,
    autoCast: state.activities.autoCast,
    autoCastPriority: state.activities.autoCastPriority,
  })))
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const combat = useGameStore(useShallow((state) => ({ active: state.combat.active, enemyId: state.combat.enemyId, activeSpellLoadout: state.combat.activeSpellLoadout })))
  const presets = useGameStore((state) => state.spellPresets.presets)
  const selectedPresetId = useGameStore((state) => state.spellPresets.selectedPresetId)
  const debugAllowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const playerMana = useGameStore((state) => state.player.mana)
  const playerCannotCast = useGameStore((state) => actorCannotCastSpells(state, 'player'))
  const hasTarget = useGameStore((state) => Boolean(state.combat.enemyId))
  const ignoreCooldowns = useGameStore((state) => state.debug.ignoreSpellCooldowns)
  const infiniteMana = useGameStore((state) => state.debug.infiniteMana)
  const selectSpellPreset = useGameStore((state) => state.selectSpellPreset)
  const setScreen = useGameStore((state) => state.setScreen)
  const playerStunned = useGameStore((state) => actorCannotAct(state, 'player'))
  const state = useMemo(() => {
    const live = useGameStore.getState()
    return {
      schools,
      equipment,
      artifactProgress,
      arcaneCore,
      progress,
      activities,
      player: { health: live.player.health, maxHealth: live.player.maxHealth, mana: live.player.mana, maxMana: live.player.maxMana, maxFocus: live.player.maxFocus },
      combat: { active: live.combat.active, activeSpellLoadout: live.combat.activeSpellLoadout, enemyId: live.combat.enemyId, enemyHp: live.combat.enemyHp, enemyMaxHp: live.combat.enemyMaxHp, enemyBarrier: live.combat.enemyBarrier, playerBarrier: live.combat.playerBarrier, enemyInstanceKey: live.combat.enemyInstanceKey, playerStatuses: live.combat.playerStatuses, enemyStatuses: live.combat.enemyStatuses },
      debug: { allowFocusOverCap: debugAllowFocusOverCap },
    }
  }, [schools, equipment, artifactProgress, arcaneCore, progress, activities, debugAllowFocusOverCap, combat])
  const focusState = useMemo<SpellPresetProjectionState>(() => ({ activities, progress, equipment, artifactProgress, arcaneCore, player: { maxFocus }, debug: { allowFocusOverCap: debugAllowFocusOverCap }, combat }), [activities, progress, equipment, artifactProgress, arcaneCore, maxFocus, debugAllowFocusOverCap, combat])
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? null
  const selectedProjection = selectedPreset ? getSpellPresetFocusProjection(focusState, selectedPreset) : null
  const activeLoadout = combat.activeSpellLoadout
  const activeSignature = activeLoadout?.signature ?? ''
  const selectedSignature = selectedProjection ? getSpellPresetSignature(selectedProjection.validSlots) : ''
  const nextBattle = Boolean(combat.active && activeLoadout && selectedPreset && selectedProjection?.canApply && (activeLoadout.presetId !== selectedPreset.id || activeSignature !== selectedSignature))
  const displaySlots = combat.active && activeLoadout ? activeLoadout.slots : selectedProjection?.validSlots ?? []
  const focus = getCombatFocusReadiness(focusState, combat.active && activeLoadout ? activeLoadout.slots : selectedProjection?.validSlots ?? [])
  const presetOptions = useMemo<SelectMenuOption<string>[]>(() => presets.map((preset) => ({ value: preset.id, label: preset.name })), [presets])
  const globalBlocker = playerStunned ? 'stunned' : !combat.active ? 'inactive' : null
  const banner = globalBlocker === 'stunned'
    ? 'PLAYER STUNNED · MANUAL SPELLS TEMPORARILY DISABLED'
    : globalBlocker === 'inactive'
      ? 'MANUAL CASTING DISABLED · ENTER A LOCATION'
      : combat.active && !combat.enemyId ? 'ENCOUNTER DOWNTIME · SELF-CAST SPELLS REMAIN AVAILABLE' : null
  const autoPriority = useMemo(() => displaySlots.filter((slot) => slot.autoCast).map((slot) => slot.spellId), [displaySlots])
  useSmartScrollState(gridRef, { dependencies: [displaySlots.map((slot) => `${slot.spellId}:${slot.autoCast ? 1 : 0}`).join('|')] })

  useEffect(() => () => { if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current) }, [])

  const showPresetNotice = (message: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    setPresetNotice(message)
    noticeTimer.current = window.setTimeout(() => setPresetNotice(null), 4200)
  }
  const choosePreset = (value: string) => {
    const result = selectSpellPreset(value as NonNullable<typeof selectedPresetId>)
    if (result.ok) { setPresetNotice(null); return }
    if (result.reason === 'focus') showPresetNotice(`Preset requires ${result.requiredExtraFocus ?? 0} more Focus.`)
    else if (result.reason === 'empty') showPresetNotice('This preset has no available Spells to select.')
    else showPresetNotice('This preset is no longer available.')
  }
  const openPresetManager = () => { dismissGameTooltips(); setScreen('schools') }

  return <Card className="combat-spell-deck">
    <header className="combat-spell-deck-toprow">
      <div className="combat-spell-deck-heading"><strong>COMBAT SPELL DECK</strong><small>{combat.active && activeLoadout ? `ACTIVE: ${activeLoadout.presetName}` : selectedPreset ? `SELECTED: ${selectedPreset.name}` : 'NO PRESET SELECTED'}</small></div>
      <div className="combat-preset-control"><div className="combat-preset-control-label"><span className="combat-subsection-label">NEXT BATTLE PRESET</span><small>{nextBattle ? `Will activate next battle · ${selectedPreset?.name ?? 'none'}` : combat.active ? 'Frozen for this enemy encounter.' : 'Selected slots become active when battle begins.'}</small></div><div className="combat-preset-control-row"><SelectMenu options={presetOptions} value={selectedPresetId ?? ''} onChange={choosePreset} ariaLabel="Next battle spell preset" /><GameTooltip content={<TooltipContent title="Manage Presets" description="Build, reorder, and configure the eight combat slots." />}><Button className="combat-preset-manage" variant="secondary" onClick={openPresetManager}><Settings2 size={13} /> MANAGE</Button></GameTooltip></div></div>
      <div className="combat-focus-summary"><span>COMBAT FOCUS</span><strong className="ui-focus">{focus.combatFocusRequired} Required</strong></div>
    </header>
    <div className="combat-spell-content-row">
      {(banner || presetNotice) && <div className="combat-spell-status-region">
        {banner && <div className={`combat-spell-banner${combat.active && !combat.enemyId ? ' is-neutral' : ''}`} role="status"><CircleDot size={13} aria-hidden="true" />{banner}</div>}
        {presetNotice && <div className="combat-spell-preset-notice" role="alert"><AlertTriangle size={13} aria-hidden="true" />{presetNotice}</div>}
      </div>}
      <div className="combat-spell-grid-region">{displaySlots.length ? <div ref={gridRef} className="combat-spell-grid smart-scroll-region">{displaySlots.map((slot) => <CombatSpellTile key={slot.spellId} spellId={slot.spellId} autoCast={slot.autoCast} autoCastPriority={slot.autoCast ? autoPriority.indexOf(slot.spellId) + 1 : null} presentationState={state} globalBlocker={globalBlocker} globalRuntime={{ playerMana, playerCannotAct: playerStunned, playerCannotCast, combatActive: combat.active, hasTarget, inLoadout: true, ignoreCooldowns, infiniteMana, unlocked: true }} onOpenPresetManager={openPresetManager} />)}</div> : <div className="combat-spell-empty"><CircleDot size={20} aria-hidden="true" /><strong>{selectedPreset ? 'No available Spells in this preset.' : 'Create a combat preset to fill the deck.'}</strong><span>Choose up to eight slots in Preset Manager.</span></div>}</div>
      <footer className="combat-spell-deck-foot"><div className="combat-spell-deck-foot-left"><Status tone={focus.ready ? 'success' : 'warning'}>{autoPriority.length} AUTO · {Math.max(0, displaySlots.length - autoPriority.length)} MANUAL · {focus.combatFocusRequired} Combat Focus {focus.ready ? 'READY' : `${focus.missingFocus} SHORT`}</Status></div><small>{displaySlots.length}/8 slots · {combat.active && activeLoadout ? 'ACTIVE SNAPSHOT' : 'PREPARED'}</small></footer>
    </div>
  </Card>
}
