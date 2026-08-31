import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameTooltip, SelectMenu, Tabs, type SelectMenuOption } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { presentCombatLogEntry } from '../../game/presentation/combat'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { MAX_FULL_COMBAT_LOG_ENTRIES, useCombatLogStore } from '../../game/ui/combatLogStore'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { CombatLogFontSize } from '../../ui/preferences/uiPreferencesTypes'
import { CombatLogRow } from './CombatLogRow'
import { useCombatDefeatStore } from '../../game/ui/combatDefeatStore'

type LogFilter = 'ALL' | 'PLAYER' | 'ENEMY' | 'SYSTEM'
const logFilters: LogFilter[] = ['ALL', 'PLAYER', 'ENEMY', 'SYSTEM']
const fontOptions: readonly SelectMenuOption<CombatLogFontSize>[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
]

export function FullCombatLogDrawer({ onClose }: { onClose: () => void }) {
  const entries = useCombatLogStore((state) => state.entries)
  const fontSize = useUiPreferences().screenState.combat.combatLogFontSize
  const defeatSnapshot = useCombatDefeatStore((state) => state.snapshot)
  const [filter, setFilter] = useState<LogFilter>('ALL')
  const [search, setSearch] = useState('')
  const [newEvents, setNewEvents] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const latestSequence = useRef(entries[0]?.sequence ?? 0)
  const newestTimestampMs = entries[0]?.timestampMs ?? Date.now()
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (filter !== 'ALL' && entry.source.kind !== filter.toLowerCase()) return false
      if (!query) return true
      const presentation = presentCombatLogEntry(entry, newestTimestampMs)
      return [presentation.sourceLabel, presentation.actionLabel, presentation.message, presentation.result, entry.category, entry.sourceId, entry.actionId, entry.statusId].filter(Boolean).join(' ').toLowerCase().includes(query)
    })
  }, [entries, filter, newestTimestampMs, search])

  useEffect(() => {
    const currentSequence = entries[0]?.sequence ?? latestSequence.current
    if (currentSequence < latestSequence.current) {
      latestSequence.current = currentSequence
      setNewEvents(0)
      return
    }
    if (currentSequence <= latestSequence.current) return
    const scrolledAway = (scrollRef.current?.scrollTop ?? 0) > 16
    setNewEvents((count) => scrolledAway ? count + (currentSequence - latestSequence.current) : 0)
    latestSequence.current = currentSequence
  }, [entries])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    document.addEventListener('keydown', handleKeyDown)
    drawerRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const scrollTop = () => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setNewEvents(0) }
  const setFontSize = (value: CombatLogFontSize) => setUiPreferences({ screenState: { combat: { combatLogFontSize: value } } })

  useEffect(() => { if (defeatSnapshot) onClose() }, [defeatSnapshot, onClose])

  return createPortal(
    <div className="full-combat-log-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside ref={drawerRef} className={`full-combat-log-drawer combat-log-size-${fontSize}`} role="dialog" aria-label="Full Combat Log">
        <header className="full-combat-log-head">
          <div><span className="combat-subsection-label">COMBAT HISTORY</span><h2>FULL COMBAT LOG</h2></div>
          <div className="full-combat-log-head-actions"><span className="combat-log-count">{entries.length}/{MAX_FULL_COMBAT_LOG_ENTRIES}</span><GameTooltip content={<TooltipContent title="Close Full Combat Log" description="Return to the Combat screen." />}><button data-autofocus="true" type="button" className="full-combat-log-close" aria-label="Close Full Combat Log" onClick={onClose}><X size={16} aria-hidden="true" /></button></GameTooltip></div>
        </header>
        <div className="full-combat-log-controls"><Tabs items={logFilters} active={filter} onChange={setFilter} /><label className="full-combat-log-search"><Search size={13} aria-hidden="true" /><input aria-label="Search full combat log" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events or type" /></label>{newEvents > 0 && <button type="button" className="combat-log-new-events" onClick={scrollTop}>{newEvents} NEW</button>}</div>
        <div className="full-combat-log-font-row"><label>TEXT SIZE <SelectMenu options={fontOptions} value={fontSize} onChange={setFontSize} ariaLabel="Combat Log text size" portalLayer="context" /></label></div>
        <div ref={scrollRef} className="combat-log-scroll full-combat-log-scroll" onScroll={(event) => { if (event.currentTarget.scrollTop <= 16) setNewEvents(0) }}>{filteredEntries.length ? filteredEntries.map((entry, index) => <CombatLogRow key={entry.id} entry={entry} newestTimestampMs={newestTimestampMs} latest={index === 0} />) : <div className="combat-log-empty">{entries.length ? 'No events match the current filters.' : 'No combat events yet. Enter a Dungeon to begin.'}</div>}</div>
      </aside>
    </div>,
    document.body,
  )
}
