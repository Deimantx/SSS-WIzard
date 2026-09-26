import { useMemo, useState } from 'react'
import { Button, Card, Status } from '../../components/ui'
import { CHRONICLE_CHAPTERS, CHRONICLE_OBJECTIVES, type ChronicleObjectiveDefinition } from '../../game/content/chronicles/chronicles'
import { getChronicleConditionProgress, getChronicleConditionValueLabel, getChronicleRewardSummary } from '../../game/presentation/chronicles/chroniclePresentation'
import { getChronicleActiveChapter, getChronicleChapterProgress, getChronicleMainObjective, getChronicleObjectiveStatus, type ChronicleObjectiveStatus } from '../../game/systems/chronicles/chronicleRuntime'
import type { ChronicleChapterId, ChronicleEventId, ChronicleObjectiveId, ChronicleTrack, GuildRankId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Summary } from './DeveloperTabPrimitives'
import { DeveloperAdvancedSection } from '../components/DeveloperBrowser'
import { toggleChronicleObjectiveTracking, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

const statusLabel: Record<ChronicleObjectiveStatus, string> = { completed: 'Complete', current: 'Current', available: 'Available', locked: 'Locked' }
const events: readonly { id: ChronicleEventId; label: string }[] = [
  { id: 'first-fragment-transmuted', label: 'First Fragment Transmuted' },
  { id: 'first-research-batch-completed', label: 'First Research Batch Completed' },
  { id: 'first-guardian-combat-completed', label: 'First Guardian Combat Completed' },
  { id: 'first-wt2-kill', label: 'First World Tier 2 Kill' },
]

export function DeveloperChronicles() {
  const state = useGameStore()
  const uiPreferences = useUiPreferences()
  const [chapterId, setChapterId] = useState<ChronicleChapterId>('first-frontier')
  const [selectedId, setSelectedId] = useState<ChronicleObjectiveId | null>(null)
  const [feedback, setFeedback] = useState('')
  const [track, setTrack] = useState<ChronicleTrack>('main')
  const [guildRank, setGuildRank] = useState<GuildRankId>('initiate')
  const chapterObjectives = useMemo(() => CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId), [chapterId])
  const selected = chapterObjectives.find((objective) => objective.id === selectedId) ?? getChronicleMainObjective(state, chapterId) ?? chapterObjectives[0]
  const chapterProgress = getChronicleChapterProgress(state, chapterId)

  const run = (label: string, action: () => void) => {
    action()
    setFeedback(label)
  }

  return <div className="developer-tab-stack developer-chronicles-tab">
    <Card title="Chronicles · tester workspace">
      <div className="developer-summary-grid"><Summary label="Current chapter" value={CHRONICLE_CHAPTERS.find((chapter) => chapter.id === chapterId)?.name ?? chapterId} /><Summary label="Chapter progress" value={`${chapterProgress.completed} / ${chapterProgress.total} · ${chapterProgress.percent}%`} /><Summary label="Current objective" value={getChronicleMainObjective(state, chapterId)?.title ?? 'Complete'} /><Summary label="Event flags" value={Object.values(state.progress.chronicle.eventFlags).filter(Boolean).length} /></div>
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => run('Reconciled authored evidence.', state.debugReconcileChronicles)}>Reconcile Now</Button><Button variant="ghost" onClick={() => run('Skipped the current main objective.', state.debugSkipCurrentChronicleObjective)}>Complete Current</Button><Button variant="ghost" disabled={!selected} onClick={() => selected && run('Completed the selected objective.', () => state.debugCompleteChronicleObjective(selected.id))}>Complete Selected</Button><Button variant="ghost" disabled={!selected} onClick={() => selected && run('Completed prerequisites for the selected objective.', () => state.debugCompleteChroniclePrerequisites(selected.id))}>Complete Prerequisites</Button><Button variant="secondary" onClick={() => run('Chapter unlocked for testing.', () => state.debugUnlockChronicleChapter(chapterId))}>Unlock Chapter</Button><Button variant="secondary" onClick={() => run('Required objectives completed.', () => state.debugCompleteChronicleRequiredObjectives(chapterId))}>Complete Required</Button><Button variant="ghost" onClick={() => run('Optional objectives completed.', () => state.debugCompleteChronicleOptionalObjectives(chapterId))}>Complete Optional</Button><Button variant="ghost" disabled={!selected} onClick={() => selected && run(toggleChronicleObjectiveTracking(selected.id) ? 'Selected objective tracking toggled.' : 'Tracking limit reached.', () => undefined)}>{selected && uiPreferences.screenState.chronicles.trackedObjectiveIds.includes(selected.id) ? 'Untrack Selected' : 'Track Selected'}</Button><Button variant="ghost" onClick={() => { setChapterId(getChronicleActiveChapter(state)); setSelectedId(null); setFeedback('Jumped to active chapter.') }}>Jump to Active Chapter</Button><Button variant="ghost" onClick={() => { const locked = chapterObjectives.find((objective) => getChronicleObjectiveStatus(state, objective) === 'locked'); if (locked) { setSelectedId(locked.id); setFeedback(`Showing locked objective: ${locked.title}.`) } else setFeedback('No locked objective in this chapter.') }}>Simulate Locked</Button></div>
      <div className="developer-button-grid"><label>TRACK<select aria-label="Chronicle track" value={track} onChange={(event) => setTrack(event.target.value as ChronicleTrack)}>{(['main', 'combat', 'magic', 'tower', 'guild', 'region'] as const).map((entry) => <option value={entry} key={entry}>{entry.toUpperCase()}</option>)}</select></label><Button variant="secondary" onClick={() => run(`${track.toUpperCase()} track completed.`, () => state.debugCompleteChronicleTrack(chapterId, track))}>Complete Track</Button><Button variant="danger" onClick={() => run(`${track.toUpperCase()} track reset.`, () => state.debugResetChronicleTrack(chapterId, track))}>Reset Track</Button><label>GUILD RANK<select aria-label="Guild rank" value={guildRank} onChange={(event) => setGuildRank(event.target.value as GuildRankId)}>{(['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master'] as const).map((entry) => <option value={entry} key={entry}>{entry}</option>)}</select></label><Button variant="ghost" onClick={() => run(`Guild rank set to ${guildRank}.`, () => state.debugSetGuildRank(guildRank))}>Set Guild Rank</Button></div>
      {feedback && <Status tone="success">{feedback}</Status>}
    </Card>

    <div className="developer-tab-grid"><Card title="Objective browser"><div className="developer-filter-stack"><label>CHAPTER<select aria-label="Chronicles chapter" value={chapterId} onChange={(event) => { setChapterId(event.target.value as ChronicleChapterId); setSelectedId(null) }}>{CHRONICLE_CHAPTERS.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.name}</option>)}</select></label></div><div className="developer-chronicle-list">{chapterObjectives.map((objective) => { const status = getChronicleObjectiveStatus(state, objective); const condition = getChronicleConditionProgress(state, objective); return <button type="button" key={objective.id} className={`developer-chronicle-row${selected?.id === objective.id ? ' active' : ''}`} onClick={() => setSelectedId(objective.id)}><span><strong>{objective.title}</strong><small>{objective.track.toUpperCase()} · {getChronicleConditionValueLabel(condition)}</small></span><Status tone={status === 'completed' ? 'success' : status === 'current' ? 'active' : status === 'locked' ? 'locked' : 'neutral'}>{statusLabel[status]}</Status></button> })}</div></Card><ChronicleInspector objective={selected} state={state} run={run} /></div>

    <Card title="Chronicle event flags"><div className="developer-chronicle-events">{events.map((event) => { const enabled = state.progress.chronicle.eventFlags[event.id] === true; return <div key={event.id}><span><strong>{event.label}</strong><small>Authoritative runtime event flag</small></span><div className="button-row"><Button variant={enabled ? 'success' : 'secondary'} onClick={() => run(`${event.label} set.`, () => state.debugSetChronicleEvent(event.id, true))}>SET</Button><Button variant="ghost" disabled={!enabled} onClick={() => run(`${event.label} cleared.`, () => state.debugSetChronicleEvent(event.id, false))}>CLEAR</Button></div></div> })}</div></Card>

    <Card title="Reset Chronicle state"><p className="muted">Reset clears Chronicle latches and event flags only. Gameplay rewards already granted are retained because they may have been spent elsewhere.</p><div className="button-row"><Button variant="danger" onClick={() => run(`${CHRONICLE_CHAPTERS.find((chapter) => chapter.id === chapterId)?.name ?? 'Chapter'} reset.`, () => state.debugResetChronicleChapter(chapterId))}>Reset Current Chapter</Button><Button variant="danger" onClick={() => run('All Chronicle state reset.', state.debugResetAllChronicles)}>Reset All Chronicles</Button><Button variant="secondary" onClick={() => run(`Completed ${CHRONICLE_CHAPTERS.find((chapter) => chapter.id === chapterId)?.name ?? 'chapter'}.`, () => state.debugCompleteChronicleChapter(chapterId))}>Complete Chapter</Button></div></Card>

    <DeveloperAdvancedSection title="Advanced Chronicle diagnostics"><pre className="developer-json">{JSON.stringify({ ui: { activeFilters: { status: uiPreferences.screenState.chronicles.statusFilters, tracks: uiPreferences.screenState.chronicles.trackFilters }, trackedObjectiveIds: uiPreferences.screenState.chronicles.trackedObjectiveIds, sort: uiPreferences.screenState.chronicles.sort, grouping: uiPreferences.screenState.chronicles.group, hideCompleted: uiPreferences.screenState.chronicles.hideCompleted, selectedChapter: chapterId, selectedObjectiveId: selected?.id ?? null }, progression: { completedObjectiveIds: state.progress.chronicle.completedObjectiveIds, grantedUnlockRewardIds: state.progress.chronicle.grantedUnlockRewardIds, eventFlags: state.progress.chronicle.eventFlags } }, null, 2)}</pre></DeveloperAdvancedSection>
  </div>
}

function ChronicleInspector({ objective, state, run }: { objective: ChronicleObjectiveDefinition | undefined; state: ReturnType<typeof useGameStore.getState>; run: (label: string, action: () => void) => void }) {
  if (!objective) return <Card title="Objective details"><p className="muted">No authored objective is available for this chapter.</p></Card>
  const status = getChronicleObjectiveStatus(state, objective)
  const condition = getChronicleConditionProgress(state, objective)
  return <Card title="Selected Chronicle objective"><div className="developer-inspector-title"><div><h2>{objective.title}</h2><small className="muted">{objective.track.toUpperCase()} · {statusLabel[status]}</small></div><Status tone={status === 'completed' ? 'success' : status === 'locked' ? 'locked' : status === 'current' ? 'active' : 'neutral'}>{statusLabel[status]}</Status></div><p>{objective.description}</p><div className="developer-detail-grid"><span>REQUIREMENT<strong>{condition.label}</strong></span><span>PROGRESS<strong>{getChronicleConditionValueLabel(condition)}</strong></span><span>PREREQUISITES<strong>{(objective.prerequisiteIds?.length ?? 0) + (objective.unlockAnyPrerequisiteIds?.length ?? 0)}</strong></span><span>REWARDS<strong>{getChronicleRewardSummary(objective).join(' · ') || 'None'}</strong></span></div><div className="button-row"><Button onClick={() => run('Selected objective completed.', () => state.debugCompleteChronicleObjective(objective.id))}>Complete Selected</Button><Button variant="secondary" onClick={() => run('Selected prerequisites completed.', () => state.debugCompleteChroniclePrerequisites(objective.id))}>Complete Prerequisites</Button></div><DeveloperAdvancedSection title="Authored identifiers"><span>Objective ID: {objective.id}</span><span>Condition type: {objective.condition.type}</span></DeveloperAdvancedSection></Card>
}
