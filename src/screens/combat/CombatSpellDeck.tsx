import { AlertTriangle, CircleDot, Search, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, getAllSpellsInOrder, getSpellRank } from '../../game/systems/spells'
import type { SchoolId, SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, SearchInput, SelectMenu, Status, type SelectMenuOption } from '../../components/ui'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellPresetDialog } from '../schools/SpellPresetDialog'
import { CombatSpellTile } from './CombatSpellTile'

type SchoolFilter = 'all' | SchoolId

export function CombatSpellDeck({ onRequiredHeightChange }: { onRequiredHeightChange?: (height: number) => void }) {
  const [school, setSchool] = useState<SchoolFilter>('all')
  const [autoOnly, setAutoOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetNotice, setPresetNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const deckHeadRef = useRef<HTMLDivElement>(null)
  const deckBodyRef = useRef<HTMLDivElement>(null)
  const gridRegionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const deckFootRef = useRef<HTMLDivElement>(null)
  const progress = useGameStore((state) => state.progress)
  const schools = useGameStore((state) => state.schools)
  const equipment = useGameStore((state) => state.equipment)
  const activities = useGameStore((state) => state.activities)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const presets = useGameStore((state) => state.spellPresets.presets)
  const debugAllowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const combatActive = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const playerStunned = useGameStore((state) => actorCannotAct(state, 'player'))
  const applySpellPreset = useGameStore((state) => state.applySpellPreset)
  const state = useMemo(() => ({ schools, equipment, progress, activities }), [schools, equipment, progress, activities])
  const focusState = useMemo(() => ({ activities, progress, player: { maxFocus }, debug: { allowFocusOverCap: debugAllowFocusOverCap } }), [activities, progress, maxFocus, debugAllowFocusOverCap])
  const focus = useMemo(() => getSpellPresetFocusBreakdown(focusState), [focusState])
  const activePreset = useMemo(() => presets.find((preset) => doesCurrentAutoCastMatchPreset({ activities, progress }, preset)), [activities, presets, progress])
  const presetOptions = useMemo<SelectMenuOption<string>[]>(() => [{ value: 'custom', label: 'CUSTOM' }, ...presets.map((preset) => ({ value: preset.id, label: preset.name }))], [presets])
  const schoolOptions = useMemo<SelectMenuOption<SchoolFilter>[]>(() => [{ value: 'all', label: 'All Schools' }, ...FRAGMENT_ORDER.map((schoolId) => ({ value: schoolId, label: <span className="combat-school-option"><span style={{ color: SCHOOLS[schoolId].color }}>{SCHOOLS[schoolId].glyph}</span>{SCHOOLS[schoolId].name}</span> }))], [])
  const query = search.trim().toLocaleLowerCase()
  const unlockedSpells = useMemo(() => getAllSpellsInOrder().map((spell) => spell.id as SpellId).filter((spellId) => getSpellRank({ progress }, spellId) !== null), [progress])
  const visibleSpells = useMemo(() => unlockedSpells.filter((spellId) => {
    const spell = SPELLS[spellId]
    return (!autoOnly || activities.autoCast[spellId]) && (school === 'all' || spell.school === school) && (!query || spell.name.toLocaleLowerCase().includes(query))
  }), [activities, autoOnly, query, school, unlockedSpells])
  const globalBlocker = playerStunned ? 'stunned' : !combatActive ? 'inactive' : !enemyId ? 'no-target' : null
  const banner = globalBlocker === 'stunned' ? 'PLAYER STUNNED · MANUAL SPELLS TEMPORARILY DISABLED' : globalBlocker === 'inactive' ? 'MANUAL CASTING DISABLED · ENTER A DUNGEON' : globalBlocker === 'no-target' ? 'WAITING FOR NEXT TARGET' : null

  const measureRequiredHeight = useCallback(() => {
    if (!onRequiredHeightChange || !deckHeadRef.current || !deckBodyRef.current || !gridRegionRef.current || !deckFootRef.current) return
    const grid = gridRef.current
    const region = gridRegionRef.current
    const rowTops = grid ? [...new Set([...grid.children].map((child) => Math.round((child as HTMLElement).getBoundingClientRect().top)))] : []
    const visibleRows = Math.min(2, Math.max(1, rowTops.length))
    const gridStyle = grid ? getComputedStyle(grid) : null
    const gap = gridStyle ? Number.parseFloat(gridStyle.rowGap) || 0 : 0
    const padding = gridStyle ? (Number.parseFloat(gridStyle.paddingTop) || 0) + (Number.parseFloat(gridStyle.paddingBottom) || 0) : 0
    const tileHeight = grid?.firstElementChild ? (grid.firstElementChild as HTMLElement).getBoundingClientRect().height : 100
    const desiredGridHeight = rowTops.length ? visibleRows * tileHeight + Math.max(0, visibleRows - 1) * gap + padding : Math.max(100, region.scrollHeight)
    const outerHeight = (element: HTMLElement) => { const style = getComputedStyle(element); return element.getBoundingClientRect().height + (Number.parseFloat(style.marginTop) || 0) + (Number.parseFloat(style.marginBottom) || 0) }
    const bodyStaticHeight = [...deckBodyRef.current.children].filter((child) => child !== region).reduce((total, child) => total + outerHeight(child as HTMLElement), 0)
    const cardFrameHeight = outerHeight(deckHeadRef.current) + outerHeight(deckFootRef.current) + 32
    onRequiredHeightChange(Math.ceil(cardFrameHeight + bodyStaticHeight + desiredGridHeight))
  }, [onRequiredHeightChange])

  useLayoutEffect(() => {
    measureRequiredHeight()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measureRequiredHeight)
    if (deckBodyRef.current) observer.observe(deckBodyRef.current)
    if (gridRef.current) observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [measureRequiredHeight, visibleSpells.length, banner, presetNotice])

  useEffect(() => () => { if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current) }, [])

  const showPresetNotice = (message: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    setPresetNotice(message)
    noticeTimer.current = window.setTimeout(() => setPresetNotice(null), 4200)
  }
  const choosePreset = (value: string) => {
    if (value === 'custom') return
    const preset = presets.find((entry) => entry.id === value)
    if (!preset) return
    const result = applySpellPreset(preset.id)
    if (result.ok) { setPresetNotice(null); return }
    if (result.reason === 'focus') {
      const projection = getSpellPresetFocusProjection(focusState, preset)
      showPresetNotice(`Preset requires ${projection.totalAfterApply} Focus. Only ${maxFocus} Focus is available.`)
    } else if (result.reason === 'empty') showPresetNotice('This preset has no available Spells to apply.')
    else showPresetNotice('This preset is no longer available.')
  }
  const openPresetManager = () => { dismissGameTooltips(); setPresetOpen(true) }

  return <Card className="combat-spell-deck">
    <div ref={deckHeadRef} className="combat-spell-deck-head">
      <div className="combat-spell-deck-heading"><strong>SPELL DECK</strong></div>
      <div className="combat-preset-control"><span className="combat-subsection-label">PRESET</span><div className="combat-preset-control-row"><SelectMenu options={presetOptions} value={activePreset?.id ?? 'custom'} onChange={choosePreset} ariaLabel="Combat Auto-Cast preset" /><GameTooltip content={<TooltipContent title="Manage Presets" description="Build, edit, and apply reusable Auto-Cast configurations." />}><Button className="combat-preset-manage" variant="secondary" onClick={openPresetManager}><Settings2 size={13} /> MANAGE</Button></GameTooltip></div><small>{activePreset ? 'Live configuration matches this preset.' : 'CUSTOM · live configuration'}</small></div>
      <div className="combat-focus-summary"><span>AUTO</span><strong className="ui-focus">{focus.autoCastFocus} Focus</strong></div>
    </div>
    <div ref={deckBodyRef} className="combat-spell-deck-body">
      {banner && <div className="combat-spell-banner" role="status"><CircleDot size={13} aria-hidden="true" />{banner}</div>}
      {presetNotice && <div className="combat-spell-preset-notice" role="alert"><AlertTriangle size={13} aria-hidden="true" />{presetNotice}</div>}
      <div className="combat-spell-filter-toolbar" role="group" aria-label="Spell Deck filters"><SearchInput value={search} onChange={setSearch} placeholder="Search Spells…" ariaLabel="Search Spells" /><SelectMenu options={schoolOptions} value={school} onChange={setSchool} ariaLabel="Spell school filter" /><FilterButton active={autoOnly} onClick={() => setAutoOnly((current) => !current)}><CircleDot size={12} /> AUTO ONLY</FilterButton></div>
      <div ref={gridRegionRef} className="combat-spell-grid-region">{visibleSpells.length ? <div ref={gridRef} className="combat-spell-grid">{visibleSpells.map((spellId) => <CombatSpellTile key={spellId} spellId={spellId} presentationState={state} globalBlocker={globalBlocker} />)}</div> : <div className="combat-spell-empty"><CircleDot size={20} aria-hidden="true" /><strong>{autoOnly ? 'No Auto-Cast Spells enabled.' : query ? 'No Spells match the current filters.' : school !== 'all' ? `No unlocked ${SCHOOLS[school].name} Spells.` : 'No unlocked Spells.'}</strong></div>}</div>
    </div>
    <div ref={deckFootRef} className="combat-spell-deck-foot"><Status tone={focus.freeFocus < 0 ? 'warning' : 'success'}>{focus.autoCastFocus} Focus reserved · {focus.freeFocus} free</Status><small>{debugAllowFocusOverCap ? 'Developer Focus override active.' : `${visibleSpells.length} Spell${visibleSpells.length === 1 ? '' : 's'} shown`}</small></div>
    <SpellPresetDialog open={presetOpen} onClose={() => setPresetOpen(false)} />
  </Card>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" className={`combat-filter-button${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>{children}</button> }
