import { AlertTriangle, CircleDot, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, getSpellPresetSignature } from '../../game/systems/spells'
import type { SpellPresetProjectionState } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, SelectMenu, Status, type SelectMenuOption } from '../../components/ui'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellPresetDialog } from '../schools/SpellPresetDialog'
import { CombatSpellTile } from './CombatSpellTile'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'

export function CombatSpellDeck() {
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetNotice, setPresetNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const arcaneCore = useGameStore((state) => state.arcaneCore)
  const activities = useGameStore((state) => state.activities)
  const player = useGameStore((state) => state.player)
  const combat = useGameStore((state) => state.combat)
  const maxFocus = player.maxFocus
  const presets = useGameStore((state) => state.spellPresets.presets)
  const selectedPresetId = useGameStore((state) => state.spellPresets.selectedPresetId)
  const debugAllowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const selectSpellPreset = useGameStore((state) => state.selectSpellPreset)
  const playerStunned = useGameStore((state) => actorCannotAct(state, 'player'))
  const state = useMemo(() => ({ schools, equipment, artifactProgress, arcaneCore, progress, activities, player, combat, debug: { allowFocusOverCap: debugAllowFocusOverCap } }), [schools, equipment, artifactProgress, arcaneCore, progress, activities, player, combat, debugAllowFocusOverCap])
  const focusState = useMemo<SpellPresetProjectionState>(() => ({ activities, progress, equipment, artifactProgress, arcaneCore, player: { maxFocus }, debug: { allowFocusOverCap: debugAllowFocusOverCap } }), [activities, progress, equipment, artifactProgress, arcaneCore, maxFocus, debugAllowFocusOverCap])
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? null
  const selectedProjection = selectedPreset ? getSpellPresetFocusProjection(focusState, selectedPreset) : null
  const activeLoadout = combat.activeSpellLoadout
  const activeSignature = activeLoadout?.signature ?? ''
  const selectedSignature = selectedPreset ? getSpellPresetSignature(selectedPreset.slots) : ''
  const nextBattle = Boolean(combat.active && activeLoadout && selectedPreset && (activeLoadout.presetId !== selectedPreset.id || activeSignature !== selectedSignature))
  const displaySlots = combat.active && activeLoadout ? activeLoadout.slots : selectedProjection?.validSlots ?? []
  const focus = getSpellPresetFocusBreakdown(focusState)
  const presetOptions = useMemo<SelectMenuOption<string>[]>(() => presets.map((preset) => ({ value: preset.id, label: preset.name })), [presets])
  const globalBlocker = playerStunned ? 'stunned' : !combat.active ? 'inactive' : !combat.enemyId ? 'no-target' : null
  const banner = globalBlocker === 'stunned'
    ? 'PLAYER STUNNED · MANUAL SPELLS TEMPORARILY DISABLED'
    : globalBlocker === 'inactive'
      ? 'MANUAL CASTING DISABLED · ENTER A DUNGEON'
      : globalBlocker === 'no-target' ? 'WAITING FOR NEXT TARGET' : null
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
  const openPresetManager = () => { dismissGameTooltips(); setPresetOpen(true) }

  return <Card className="combat-spell-deck">
    <header className="combat-spell-deck-toprow">
      <div className="combat-spell-deck-heading"><strong>COMBAT SPELL DECK</strong><small>{combat.active && activeLoadout ? `ACTIVE: ${activeLoadout.presetName}` : selectedPreset ? `SELECTED: ${selectedPreset.name}` : 'NO PRESET SELECTED'}</small></div>
      <div className="combat-preset-control"><div className="combat-preset-control-label"><span className="combat-subsection-label">NEXT BATTLE PRESET</span><small>{nextBattle ? `Will activate next battle · ${selectedPreset?.name ?? 'none'}` : combat.active ? 'Frozen for this enemy encounter.' : 'Selected slots become active when battle begins.'}</small></div><div className="combat-preset-control-row"><SelectMenu options={presetOptions} value={selectedPresetId ?? ''} onChange={choosePreset} ariaLabel="Next battle spell preset" /><GameTooltip content={<TooltipContent title="Manage Presets" description="Build, reorder, and configure the eight combat slots." />}><Button className="combat-preset-manage" variant="secondary" onClick={openPresetManager}><Settings2 size={13} /> MANAGE</Button></GameTooltip></div></div>
      <div className="combat-focus-summary"><span>AUTO</span><strong className="ui-focus">{focus.autoCastFocus} Focus</strong></div>
    </header>
    <div className="combat-spell-content-row">
      {(banner || presetNotice) && <div className="combat-spell-status-region">
        {banner && <div className="combat-spell-banner" role="status"><CircleDot size={13} aria-hidden="true" />{banner}</div>}
        {presetNotice && <div className="combat-spell-preset-notice" role="alert"><AlertTriangle size={13} aria-hidden="true" />{presetNotice}</div>}
      </div>}
      <div className="combat-spell-grid-region">{displaySlots.length ? <div ref={gridRef} className="combat-spell-grid smart-scroll-region">{displaySlots.map((slot) => <CombatSpellTile key={slot.spellId} spellId={slot.spellId} autoCast={slot.autoCast} autoCastPriority={slot.autoCast ? autoPriority.indexOf(slot.spellId) + 1 : null} presentationState={state} globalBlocker={globalBlocker} onOpenPresetManager={openPresetManager} />)}</div> : <div className="combat-spell-empty"><CircleDot size={20} aria-hidden="true" /><strong>{selectedPreset ? 'No available Spells in this preset.' : 'Create a combat preset to fill the deck.'}</strong><span>Choose up to eight slots in Preset Manager.</span></div>}</div>
      <footer className="combat-spell-deck-foot"><div className="combat-spell-deck-foot-left"><Status tone={focus.freeFocus < 0 ? 'warning' : 'success'}>{autoPriority.length} AUTO · {Math.max(0, displaySlots.length - autoPriority.length)} MANUAL · {focus.autoCastFocus} Focus reserved</Status></div><small>{displaySlots.length}/8 slots · {combat.active && activeLoadout ? 'ACTIVE SNAPSHOT' : 'PREVIEW'}</small></footer>
    </div>
    <SpellPresetDialog open={presetOpen} onClose={() => setPresetOpen(false)} />
  </Card>
}
