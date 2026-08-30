import { ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SelectMenu, Tabs, type SelectMenuOption } from '../../components/ui'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { MAX_COMBAT_LOG_ENTRIES, useCombatLogStore } from '../../game/ui/combatLogStore'
import { useGameStore } from '../../store/gameStore'
import { presentCombatLogEntry } from '../../game/presentation/combat'
import { getSavedScreenLayouts } from '../../ui/layout-editor/layoutEditorStore'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { CombatLogFontSize } from '../../ui/preferences/uiPreferencesTypes'
import { CombatLogRow, LegacyCombatLogRow } from './CombatLogRow'

type LogFilter = 'ALL' | 'PLAYER' | 'ENEMY' | 'SYSTEM'
const logFilters: LogFilter[] = ['ALL', 'PLAYER', 'ENEMY', 'SYSTEM']
const fontOptions: readonly SelectMenuOption<CombatLogFontSize>[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
]

export function CombatLogPanel() {
  const entries = useCombatLogStore((state) => state.entries)
  const legacyLog = useGameStore((state) => state.combat.log)
  const preferences = useUiPreferences().screenState.combat
  const [filter, setFilter] = useState<LogFilter>('ALL')
  const [newEvents, setNewEvents] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const latestSequence = useRef(entries[0]?.sequence ?? 0)
  const newestTimestampMs = entries[0]?.timestampMs ?? Date.now()
  const filteredEntries = useMemo(() => entries.filter((entry) => filter === 'ALL' || filter === 'PLAYER' && entry.source.kind === 'player' || filter === 'ENEMY' && entry.source.kind === 'enemy' || filter === 'SYSTEM' && entry.source.kind === 'system'), [entries, filter])
  const latestPresentation = entries[0] ? presentCombatLogEntry(entries[0], newestTimestampMs) : null
  const latestLine = latestPresentation ? [latestPresentation.message, latestPresentation.result].filter(Boolean).join(' · ') : legacyLog[0] ?? 'No combat events yet. Enter a Dungeon to begin.'

  useEffect(() => {
    const currentSequence = entries[0]?.sequence ?? latestSequence.current
    if (currentSequence <= latestSequence.current) return
    const scrolledAway = (scrollRef.current?.scrollTop ?? 0) > 16
    setNewEvents((count) => scrolledAway ? count + (currentSequence - latestSequence.current) : 0)
    latestSequence.current = currentSequence
  }, [entries])

  const scrollTop = () => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setNewEvents(0) }
  const setFontSize = (fontSize: CombatLogFontSize) => setUiPreferences({ screenState: { combat: { combatLogFontSize: fontSize } } })
  const toggleCollapsed = () => {
    if (!preferences.combatLogCollapsed) {
      const savedHeight = getSavedScreenLayouts('combat')['combat-log']?.h ?? preferences.lastExpandedCombatLogH
      setUiPreferences({ screenState: { combat: { combatLogCollapsed: true, lastExpandedCombatLogH: Math.max(2, savedHeight) } } })
    } else setUiPreferences({ screenState: { combat: { combatLogCollapsed: false } } })
  }

  return <Card className={`combat-log-panel combat-log-size-${preferences.combatLogFontSize}${preferences.combatLogCollapsed ? ' is-collapsed' : ''}`}>
    <header className="combat-log-head"><div><span className="combat-subsection-label">LIVE FEED</span><h2>COMBAT LOG</h2></div><div className="combat-log-head-actions"><span className="combat-log-count">LIVE · {MAX_COMBAT_LOG_ENTRIES} EVENTS</span><button type="button" className="combat-log-collapse" aria-expanded={!preferences.combatLogCollapsed} aria-label={`${preferences.combatLogCollapsed ? 'Expand' : 'Collapse'} Combat Log`} onClick={toggleCollapsed}>{preferences.combatLogCollapsed ? 'EXPAND' : 'COLLAPSE'}</button></div></header>
    {preferences.combatLogCollapsed ? <div className="combat-log-collapsed-latest" aria-live="polite"><span>LAST</span><strong>{latestLine}</strong></div> : <><div className="combat-log-filter-row"><Tabs items={logFilters} active={filter} onChange={setFilter} />{newEvents > 0 && <button type="button" className="combat-log-new-events" onClick={scrollTop}><ChevronUp size={12} /> {newEvents} NEW EVENTS</button>}</div><div className="combat-log-font-row"><label>TEXT SIZE <SelectMenu options={fontOptions} value={preferences.combatLogFontSize} onChange={setFontSize} ariaLabel="Combat Log text size" /></label></div><div ref={scrollRef} className="combat-log-scroll" onScroll={(event) => { if (event.currentTarget.scrollTop <= 16) setNewEvents(0) }}>{entries.length ? filteredEntries.length ? filteredEntries.map((entry, index) => <CombatLogRow key={entry.id} entry={entry} newestTimestampMs={newestTimestampMs} latest={index === 0} />) : <div className="combat-log-empty">No events match this source filter.</div> : legacyLog.length ? legacyLog.map((message, index) => <LegacyCombatLogRow key={`${message}-${index}`} message={message} latest={index === 0} />) : <div className="combat-log-empty">No combat events yet. Enter a Dungeon to begin.</div>}</div></>}
  </Card>
}
