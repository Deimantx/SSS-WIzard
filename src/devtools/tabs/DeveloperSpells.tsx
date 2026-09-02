import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getAllSpellsInOrder, getSpellAutoCastFocusCost, getSpellRank } from '../../game/systems/spells'
import type { SchoolId, SpellId, SpellType } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'

type SpellFilter = 'all' | SchoolId | SpellType | 'locked' | 'unlocked' | 'auto-cast'
const schoolFilters: readonly FilterOption<SpellFilter>[] = (Object.keys(SCHOOLS) as SchoolId[]).map((id) => ({ value: id, label: SCHOOLS[id].name.toUpperCase() }))
const spellTypes = [...new Set(Object.values(SPELLS).map((spell) => spell.type))] as SpellType[]
const typeFilters: readonly FilterOption<SpellFilter>[] = spellTypes.map((id) => ({ value: id, label: id.toUpperCase() }))
const FILTERS: readonly FilterOption<SpellFilter>[] = [{ value: 'all', label: 'ALL' }, ...schoolFilters, ...typeFilters, { value: 'locked', label: 'LOCKED' }, { value: 'unlocked', label: 'UNLOCKED' }, { value: 'auto-cast', label: 'AUTO-CAST' }]

export function DeveloperSpells() {
  const state = useGameStore()
  const unlock = state.debugUnlockSpellRankOne
  const lock = state.debugLockSpell
  const cast = state.castSpell
  const toggleAutoCast = state.toggleAutoCast
  const resetCooldowns = state.resetSpellCooldowns
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SpellFilter>('all')
  const [selected, setSelected] = useState<SpellId | null>('fire-bolt')
  const options = useMemo(() => getAllSpellsInOrder().filter((spell) => {
    const rank = getSpellRank(state, spell.id)
    const matchesFilter = filter === 'all' || filter === spell.school || filter === spell.type || (filter === 'locked' && rank === null) || (filter === 'unlocked' && rank !== null) || (filter === 'auto-cast' && state.activities.autoCast[spell.id])
    return matchesFilter && `${spell.id} ${spell.name} ${spell.description}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [filter, query, state])
  const selectedSpell = selected ? SPELLS[selected] : null
  useEffect(() => { if (options.length === 0) setSelected(null); else if (!selected || !options.some((spell) => spell.id === selected)) setSelected(options[0].id) }, [options, selected])

  return <div className="developer-tab-stack"><Card title="Spell browser" className="developer-browser-card">
    <div className="developer-filter-stack"><label>Search spells<input aria-label="Search spells" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, description..." /></label><div className="developer-filter-label">SCHOOL / TYPE / STATE<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer spell filter" /></div></div>
    <DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{options.length} authored spells</strong><small>Spell registry and school registry are runtime sources.</small></div><DeveloperBrowser items={options.map((spell) => { const rank = getSpellRank(state, spell.id); return { id: spell.id, label: spell.name, icon: SCHOOLS[spell.school].glyph, accent: SCHOOLS[spell.school].color, meta: `${spell.id} · ${SCHOOLS[spell.school].name} · ${spell.type} · ${spell.manaCost} Mana · ${spell.cooldownMs} ms`, status: <Status tone={rank ? 'success' : 'locked'}>{rank ? `RANK ${rank}` : 'LOCKED'}</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as SpellId)} emptyMessage="No matching spells." /></>} inspector={selectedSpell && selected ? <>
      <div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: SCHOOLS[selectedSpell.school].color }}>{SCHOOLS[selectedSpell.school].glyph}</span><div><h2>{selectedSpell.name}</h2><code>{selected}</code></div><Status tone={getSpellRank(state, selected) ? 'success' : 'locked'}>{getSpellRank(state, selected) ? 'UNLOCKED' : 'LOCKED'}</Status></div>
      <DeveloperSection title="Spell definition"><p className="muted">{selectedSpell.description}</p><div className="developer-detail-grid"><span>SCHOOL<strong>{selectedSpell.school}</strong></span><span>TYPE<strong>{selectedSpell.type}</strong></span><span>UNLOCK LEVEL<strong>{selectedSpell.unlockLevel}</strong></span><span>RANK<strong>{getSpellRank(state, selected) ?? '—'}</strong></span><span>MANA<strong>{selectedSpell.manaCost}</strong></span><span>COOLDOWN<strong>{selectedSpell.cooldownMs} ms</strong></span><span>AUTO-CAST FOCUS<strong>{getSpellAutoCastFocusCost(state, selected) ?? 'locked'}</strong></span><span>AUTO-CAST<strong>{state.activities.autoCast[selected] ? 'enabled' : 'disabled'}</strong></span></div><pre className="developer-json">{JSON.stringify(selectedSpell.effects, null, 2)}</pre><pre className="developer-json">{JSON.stringify(selectedSpell.autoCondition ?? null, null, 2)}</pre></DeveloperSection>
      <DeveloperSection title="Combat Lab actions"><div className="button-row"><Button onClick={() => unlock(selected)}>Unlock Rank I</Button><Button variant="danger" onClick={() => lock(selected)} disabled={!getSpellRank(state, selected)}>Lock spell</Button><Button variant="secondary" onClick={() => cast(selected)} disabled={!getSpellRank(state, selected)}>Cast selected</Button><Button variant={state.activities.autoCast[selected] ? 'success' : 'secondary'} onClick={() => toggleAutoCast(selected)} disabled={!getSpellRank(state, selected)}>{state.activities.autoCast[selected] ? 'Disable Auto-Cast' : 'Enable Auto-Cast'}</Button><Button variant="ghost" onClick={resetCooldowns}>Reset cooldowns</Button><Button variant="secondary" onClick={() => state.spawnDebugEnemy('forest-wisp', 'whispering-woods')}>Start Woods encounter</Button></div></DeveloperSection>
    </> : <div className="developer-browser-empty"><strong>No matching spells</strong><small>Change the search or filter.</small></div>} />
  </Card></div>
}
