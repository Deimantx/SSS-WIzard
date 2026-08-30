import { CircleDot, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown, getAllSpellsInOrder, getSpellRank } from '../../game/systems/spells'
import type { SchoolId, SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellPresetDialog } from '../schools/SpellPresetDialog'
import { CombatSpellTile } from './CombatSpellTile'

type SpellFilter = 'all' | SchoolId | 'auto'

export function CombatSpellDeck() {
  const [filter, setFilter] = useState<SpellFilter>('all')
  const [presetOpen, setPresetOpen] = useState(false)
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
  const state = useMemo(() => ({ schools, equipment, progress, activities }), [schools, equipment, progress, activities])
  const focusState = useMemo(() => ({ activities, progress, player: { maxFocus } }), [activities, progress, maxFocus])
  const focus = useMemo(() => getSpellPresetFocusBreakdown(focusState), [focusState])
  const activePreset = useMemo(() => presets.find((preset) => doesCurrentAutoCastMatchPreset({ activities, progress }, preset)), [activities, presets, progress])
  const unlockedSpells = getAllSpellsInOrder().map((spell) => spell.id as SpellId).filter((spellId) => getSpellRank({ progress }, spellId) !== null)
  const visibleSpells = unlockedSpells.filter((spellId) => filter === 'all' || filter === 'auto' && activities.autoCast[spellId] || filter !== 'auto' && SPELLS[spellId].school === filter)
  const globalBlocker = playerStunned ? 'stunned' : !combatActive ? 'inactive' : !enemyId ? 'no-target' : null
  const openPresetManager = () => { dismissGameTooltips(); setPresetOpen(true) }
  const banner = globalBlocker === 'stunned' ? 'PLAYER STUNNED · MANUAL SPELLS TEMPORARILY DISABLED' : globalBlocker === 'inactive' ? 'MANUAL CASTING DISABLED · ENTER A DUNGEON' : globalBlocker === 'no-target' ? 'WAITING FOR NEXT TARGET' : null
  return <Card title="SPELL DECK" className="combat-spell-deck"><div className="combat-spell-deck-head"><div><span className="combat-subsection-label">PRESET</span><strong>{activePreset?.name ?? 'CUSTOM'}</strong><small>{activePreset ? 'Active Auto-Cast configuration' : 'Manual Auto-Cast configuration'}</small></div><div className="combat-focus-summary"><span>AUTO-CAST</span><strong className="ui-focus">{focus.autoCastFocus} Focus</strong><small>{focus.freeFocus} free · {focus.otherFocus} other reserved</small></div><GameTooltip content={<TooltipContent title="Manage Presets" description="Build and apply reusable Auto-Cast configurations." />}><Button variant="secondary" onClick={openPresetManager}><Settings2 size={14} /> MANAGE PRESETS</Button></GameTooltip></div><div className="combat-spell-deck-body">{banner && <div className="combat-spell-banner" role="status"><CircleDot size={13} aria-hidden="true" />{banner}</div>}<div className="combat-spell-filter" role="group" aria-label="Spell Deck filters"><FilterButton value="all" active={filter === 'all'} onClick={setFilter}>ALL</FilterButton>{FRAGMENT_ORDER.map((school) => <FilterButton key={school} value={school} active={filter === school} onClick={setFilter}><span style={{ color: SCHOOLS[school].color }}>{SCHOOLS[school].glyph}</span>{SCHOOLS[school].name.toUpperCase()}</FilterButton>)}<FilterButton value="auto" active={filter === 'auto'} onClick={setFilter}><CircleDot size={12} /> AUTO</FilterButton></div><div className="combat-spell-grid-region">{visibleSpells.length ? <div className="combat-spell-grid">{visibleSpells.map((spellId) => <CombatSpellTile key={spellId} spellId={spellId} presentationState={state} globalBlocker={globalBlocker} />)}</div> : <div className="combat-spell-empty"><CircleDot size={20} aria-hidden="true" /><strong>{filter === 'auto' ? 'No Auto-Cast Spells enabled.' : 'No unlocked Spells in this school.'}</strong></div>}</div></div><div className="combat-spell-deck-foot"><Status tone={focus.freeFocus < 0 ? 'warning' : 'success'}>{focus.autoCastFocus} Focus reserved · {focus.freeFocus} free</Status><small>{debugAllowFocusOverCap ? 'Developer Focus override active.' : `${visibleSpells.length} unlocked Spell${visibleSpells.length === 1 ? '' : 's'} shown`}</small></div><SpellPresetDialog open={presetOpen} onClose={() => setPresetOpen(false)} /></Card>
}

function FilterButton({ value, active, onClick, children }: { value: SpellFilter; active: boolean; onClick: (value: SpellFilter) => void; children: React.ReactNode }) { return <button type="button" className={`combat-filter-button${active ? ' is-active' : ''}`} aria-pressed={active} onClick={() => onClick(value)}>{children}</button> }
