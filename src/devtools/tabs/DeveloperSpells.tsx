import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { formatAutoCastCondition, formatCombatEffect, formatDuration, formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { getAllSpellsInOrder, getSpellAutoCastFocusCost, getSpellRank } from '../../game/systems/spells'
import type { SchoolId, SpellId, SpellType } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperAdvancedSection, DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { DeveloperSchools } from './DeveloperSchools'

type SpellFilter = 'all' | SchoolId | SpellType | 'locked' | 'unlocked' | 'auto-cast'
const schoolFilters: readonly FilterOption<SpellFilter>[] = (Object.keys(SCHOOLS) as SchoolId[]).map((id) => ({ value: id, label: SCHOOLS[id].name.toUpperCase() }))
const spellTypes = [...new Set(Object.values(SPELLS).map((spell) => spell.type))] as SpellType[]
const typeFilters: readonly FilterOption<SpellFilter>[] = spellTypes.map((id) => ({ value: id, label: formatReadableId(id).toUpperCase() }))
const FILTERS: readonly FilterOption<SpellFilter>[] = [{ value: 'all', label: 'ALL' }, ...schoolFilters, ...typeFilters, { value: 'locked', label: 'LOCKED' }, { value: 'unlocked', label: 'UNLOCKED' }, { value: 'auto-cast', label: 'AUTO-CAST' }]

export function DeveloperSpells() {
  const [view, setView] = useState<'spells' | 'schools'>('spells')
  const state = useGameStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SpellFilter>('all')
  const [selected, setSelected] = useState<SpellId | null>('fire-bolt')
  const options = useMemo(() => getAllSpellsInOrder().filter((spell) => {
    const rank = getSpellRank(state, spell.id)
    const matchesFilter = filter === 'all' || filter === spell.school || filter === spell.type || (filter === 'locked' && rank === null) || (filter === 'unlocked' && rank !== null) || (filter === 'auto-cast' && state.activities.autoCast[spell.id])
    return matchesFilter && `${spell.name} ${spell.description} ${spell.school} ${spell.type}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [filter, query, state])
  const selectedSpell = selected ? SPELLS[selected] : null
  useEffect(() => { if (options.length === 0) setSelected(null); else if (!selected || !options.some((spell) => spell.id === selected)) setSelected(options[0].id) }, [options, selected])

  if (view === 'schools') return <div className="developer-tab-stack"><SpellSchoolsSwitcher view={view} setView={setView} /><DeveloperSchools /></div>
  return <div className="developer-tab-stack">
    <SpellSchoolsSwitcher view={view} setView={setView} />
    <Card title="Spell browser" className="developer-browser-card">
      <div className="developer-filter-stack"><label>Search spells<input aria-label="Search spells" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, school, effect..." /></label><div className="developer-filter-label">SCHOOL / TYPE / STATE<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer spell filter" /></div></div>
      <DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{options.length} authored spells</strong><small>Choose a spell to inspect its player-facing effects and tester actions.</small></div><DeveloperBrowser items={options.map((spell) => { const rank = getSpellRank(state, spell.id); return { id: spell.id, label: spell.name, icon: SCHOOLS[spell.school].glyph, accent: SCHOOLS[spell.school].color, meta: `${SCHOOLS[spell.school].name} · ${formatReadableId(spell.type)} · ${spell.manaCost} Mana · ${formatDuration(spell.cooldownMs)}`, status: <Status tone={rank ? 'success' : 'locked'}>{rank ? `RANK ${rank}` : 'LOCKED'}</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as SpellId)} emptyMessage="No matching spells." /></>} inspector={selectedSpell && selected ? <SpellInspector spellId={selected} /> : <div className="developer-browser-empty"><strong>No matching spells</strong><small>Change the search or filter.</small></div>} />
    </Card>
  </div>
}

function SpellSchoolsSwitcher({ view, setView }: { view: 'spells' | 'schools'; setView: (view: 'spells' | 'schools') => void }) {
  return <div className="developer-local-tabs" role="tablist" aria-label="Magic developer sections"><button role="tab" aria-selected={view === 'spells'} className={view === 'spells' ? 'active' : ''} onClick={() => setView('spells')}>SPELLS</button><button role="tab" aria-selected={view === 'schools'} className={view === 'schools' ? 'active' : ''} onClick={() => setView('schools')}>SCHOOLS</button></div>
}

function SpellInspector({ spellId }: { spellId: SpellId }) {
  const state = useGameStore()
  const spell = SPELLS[spellId]
  const school = SCHOOLS[spell.school]
  const rank = getSpellRank(state, spellId)
  const autoCastCost = getSpellAutoCastFocusCost(state, spellId)
  return <>
    <div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: school.color }}>{school.glyph}</span><div><h2>{spell.name}</h2><small className="muted">{school.name} · {formatReadableId(spell.type)}</small></div><Status tone={rank ? 'success' : 'locked'}>{rank ? 'UNLOCKED' : 'LOCKED'}</Status></div>
    <DeveloperSection title="Spell details"><p className="muted">{spell.description}</p><div className="developer-detail-grid"><span>SCHOOL<strong>{school.name}</strong></span><span>TYPE<strong>{formatReadableId(spell.type)}</strong></span><span>UNLOCKS AT<strong>Level {spell.unlockLevel}</strong></span><span>RANK<strong>{rank ? `Rank ${rank}` : 'Locked'}</strong></span><span>MANA COST<strong>{spell.manaCost}</strong></span><span>COOLDOWN<strong>{formatDuration(spell.cooldownMs)}</strong></span><span>AUTO-CAST FOCUS<strong>{autoCastCost === null ? 'Unavailable' : `${autoCastCost} Focus`}</strong></span><span>AUTO-CAST<strong>{state.activities.autoCast[spellId] ? 'Enabled' : 'Disabled'}</strong></span></div></DeveloperSection>
    <DeveloperSection title="Effects"><div className="developer-relation-list">{spell.effects.map((effect, index) => <span key={`${spellId}-effect-${index}`}><strong>Effect {index + 1}</strong><small>{formatCombatEffect(effect)}</small></span>)}</div></DeveloperSection>
    <DeveloperSection title="Auto-Cast condition"><p className="muted">{formatAutoCastCondition(spell.autoCondition)}</p></DeveloperSection>
    <DeveloperSection title="Tester actions"><div className="button-row"><Button onClick={() => state.debugUnlockSpellRankOne(spellId)}>Unlock Rank I</Button><Button variant="danger" onClick={() => state.debugLockSpell(spellId)} disabled={!rank}>Lock spell</Button><Button variant="secondary" onClick={() => state.castSpell(spellId)} disabled={!rank}>Cast selected</Button><Button variant={state.activities.autoCast[spellId] ? 'success' : 'secondary'} onClick={() => state.toggleAutoCast(spellId)} disabled={!rank}>{state.activities.autoCast[spellId] ? 'Disable Auto-Cast' : 'Enable Auto-Cast'}</Button><Button variant="ghost" onClick={state.resetSpellCooldowns}>Reset cooldowns</Button></div></DeveloperSection>
    <DeveloperAdvancedSection title="Advanced spell details"><span>Content identifier: <code>{spell.id}</code></span><span>Auto-Cast rule type: <code>{spell.autoCondition?.type ?? 'always'}</code></span></DeveloperAdvancedSection>
  </>
}
