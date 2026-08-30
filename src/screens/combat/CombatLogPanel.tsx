import { ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Tabs } from '../../components/ui'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { MAX_COMBAT_LOG_ENTRIES, useCombatLogStore } from '../../game/ui/combatLogStore'
import { useGameStore } from '../../store/gameStore'
import { CombatLogRow, LegacyCombatLogRow } from './CombatLogRow'

type LogFilter = 'ALL' | 'PLAYER' | 'ENEMY' | 'SYSTEM'
const logFilters: LogFilter[] = ['ALL', 'PLAYER', 'ENEMY', 'SYSTEM']

export function CombatLogPanel() {
  const entries = useCombatLogStore((state) => state.entries)
  const legacyLog = useGameStore((state) => state.combat.log)
  const [filter, setFilter] = useState<LogFilter>('ALL')
  const [newEvents, setNewEvents] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const latestSequence = useRef(entries[0]?.sequence ?? 0)
  const newestTimestampMs = entries[0]?.timestampMs ?? Date.now()
  const filteredEntries = useMemo(() => entries.filter((entry) => filter === 'ALL' || filter === 'PLAYER' && entry.source.kind === 'player' || filter === 'ENEMY' && entry.source.kind === 'enemy' || filter === 'SYSTEM' && entry.source.kind === 'system'), [entries, filter])

  useEffect(() => {
    const currentSequence = entries[0]?.sequence ?? latestSequence.current
    if (currentSequence <= latestSequence.current) return
    const scrolledAway = (scrollRef.current?.scrollTop ?? 0) > 16
    setNewEvents((count) => scrolledAway ? count + (currentSequence - latestSequence.current) : 0)
    latestSequence.current = currentSequence
  }, [entries])

  const scrollTop = () => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setNewEvents(0) }
  return <Card className="combat-log-panel"><header className="combat-log-head"><div><span className="combat-subsection-label">LIVE FEED</span><h2>COMBAT LOG</h2></div><span className="combat-log-count">{entries.length ? `LIVE · ${MAX_COMBAT_LOG_ENTRIES} EVENTS` : 'READY'}</span></header><div className="combat-log-filter-row"><Tabs items={logFilters} active={filter} onChange={setFilter} />{newEvents > 0 && <button type="button" className="combat-log-new-events" onClick={scrollTop}><ChevronUp size={12} /> {newEvents} NEW EVENTS</button>}</div><div ref={scrollRef} className="combat-log-scroll" onScroll={(event) => { if (event.currentTarget.scrollTop <= 16) setNewEvents(0) }}>{entries.length ? filteredEntries.length ? filteredEntries.map((entry, index) => <CombatLogRow key={entry.id} entry={entry} newestTimestampMs={newestTimestampMs} latest={index === 0} />) : <div className="combat-log-empty">No events match this source filter.</div> : legacyLog.length ? legacyLog.map((message, index) => <LegacyCombatLogRow key={`${message}-${index}`} message={message} latest={index === 0} />) : <div className="combat-log-empty">No combat events yet. Enter a Dungeon to begin.</div>}</div></Card>
}
