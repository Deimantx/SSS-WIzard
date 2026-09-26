import { BookOpen, Check, ChevronRight, LockKeyhole, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CHRONICLE_CHAPTERS, CHRONICLE_OBJECTIVES, CHRONICLE_OBJECTIVE_BY_ID, type ChronicleObjectiveDefinition } from '../../game/content/chronicles/chronicles'
import { getChronicleConditionProgress, getChronicleConditionValueLabel, getChronicleRewardSummary } from '../../game/presentation/chronicles/chroniclePresentation'
import { getChronicleActiveChapter, getChronicleChapterProgress, getChronicleObjectiveStatus, getChronicleTrackProgress, isChronicleChapterAvailable, isChronicleObjectiveComplete, type ChronicleObjectiveStatus } from '../../game/systems/chronicles/chronicleRuntime'
import type { ChronicleChapterId, ChronicleTrack } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, Status } from '../../components/ui'
import { ModalPortal } from '../../components/ui/ModalPortal'

type ChronicleFilter = 'all' | ChronicleTrack

const trackLabels: Record<ChronicleFilter, string> = { all: 'All', main: 'Main', combat: 'Combat', magic: 'Magic', tower: 'Tower' }
const statusLabels: Record<ChronicleObjectiveStatus, string> = { completed: 'Complete', current: 'Current', available: 'Available', locked: 'Locked' }

export function ChroniclesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore()
  const currentChapter = getChronicleActiveChapter(state)
  const [chapterId, setChapterId] = useState<ChronicleChapterId>(currentChapter)
  const [filter, setFilter] = useState<ChronicleFilter>('all')
  const [selectedId, setSelectedId] = useState<ChronicleObjectiveDefinition['id'] | null>(null)

  useEffect(() => {
    if (open) {
      setChapterId(currentChapter)
      setFilter('all')
      setSelectedId(null)
    }
  }, [open, currentChapter])

  const chapter = CHRONICLE_CHAPTERS.find((entry) => entry.id === chapterId) ?? CHRONICLE_CHAPTERS[0]
  const chapterObjectives = useMemo(() => CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapter.id && (filter === 'all' || objective.track === filter)), [chapter.id, filter])
  const selected = chapterObjectives.find((objective) => objective.id === selectedId) ?? chapterObjectives.find((objective) => getChronicleObjectiveStatus(state, objective) === 'current') ?? chapterObjectives[0]
  const chapterProgress = getChronicleChapterProgress(state, chapter.id)

  const navigate = (objective: ChronicleObjectiveDefinition) => {
    if (objective.navigateTo) state.setScreen(objective.navigateTo)
    onClose()
  }

  return <ModalPortal open={open} onClose={onClose} backdropClassName="chronicles-modal-backdrop" surfaceClassName="chronicles-modal-surface" ariaLabel="Chronicles">
    <div className="chronicles-modal-frame">
      <header className="chronicles-modal-header">
        <div className="chronicles-modal-title"><span className="chronicles-modal-mark"><BookOpen size={19} /></span><div><span className="eyebrow">ARCANE RECORD · PROGRESSION</span><h2>Chronicles</h2><p>Follow the Tower’s authored milestones and choose the next thread worth pursuing.</p></div></div>
        <Button variant="ghost" icon ariaLabel="Close Chronicles" tooltip="Close Chronicles" onClick={onClose}><X size={18} /></Button>
      </header>

      <div className="chronicles-chapter-switcher" role="tablist" aria-label="Chronicle chapters">
        {CHRONICLE_CHAPTERS.map((entry) => { const available = isChronicleChapterAvailable(state, entry.id); const progress = getChronicleChapterProgress(state, entry.id); return <button key={entry.id} type="button" role="tab" aria-selected={chapter.id === entry.id} disabled={!available} className={`chronicles-chapter-tab${chapter.id === entry.id ? ' active' : ''}${!available ? ' locked' : ''}`} onClick={() => { setChapterId(entry.id); setSelectedId(null); setFilter('all') }}><span>{available ? <BookOpen size={14} /> : <LockKeyhole size={14} />}{entry.name}</span><small>{progress.completed}/{progress.total}</small></button> })}
      </div>

      <div className="chronicles-modal-body">
        <section className="chronicles-modal-main">
          <div className="chronicles-chapter-heading"><div><span className="eyebrow">CURRENT CHAPTER</span><h3>{chapter.name}</h3><p>{chapter.description}</p></div><div className="chronicles-progress-readout"><strong>{chapterProgress.percent}%</strong><span>{chapterProgress.completed} / {chapterProgress.total} complete</span></div></div>
          <div className="chronicles-progress-track" aria-label={`${chapterProgress.percent}% chapter progress`}><i style={{ width: `${chapterProgress.percent}%` }} /></div>

          <nav className="chronicles-track-tabs" aria-label="Chronicle tracks">{(['all', 'main', 'combat', 'magic', 'tower'] as const).map((track) => { const progress = track === 'all' ? chapterProgress : getChronicleTrackProgress(state, chapter.id, track); return <button key={track} type="button" className={filter === track ? 'active' : ''} aria-pressed={filter === track} onClick={() => { setFilter(track); setSelectedId(null) }}>{trackLabels[track]} <span>{progress.completed}/{progress.total}</span></button> })}</nav>

          <div className="chronicles-objective-list">{chapterObjectives.map((objective) => { const status = getChronicleObjectiveStatus(state, objective); const condition = getChronicleConditionProgress(state, objective); return <button type="button" key={objective.id} className={`chronicles-objective-card status-${status}${selected?.id === objective.id ? ' selected' : ''}`} onClick={() => setSelectedId(objective.id)}><span className="chronicles-objective-icon">{status === 'completed' ? <Check size={15} /> : status === 'locked' ? <LockKeyhole size={14} /> : <i />}</span><span className="chronicles-objective-copy"><span className="chronicles-objective-meta"><strong>{trackLabels[objective.track]}</strong>{objective.optional && <em>Optional</em>}</span><b>{objective.title}</b><small>{objective.description}</small></span><span className="chronicles-objective-state"><Status tone={status === 'completed' ? 'success' : status === 'current' ? 'active' : status === 'locked' ? 'locked' : 'neutral'}>{statusLabels[status]}</Status><small>{getChronicleConditionValueLabel(condition)}</small></span><ChevronRight size={15} /></button> })}</div>
        </section>

        <aside className="chronicles-detail-pane" aria-label="Chronicle objective details">{selected ? <ChronicleDetail objective={selected} state={state} onNavigate={navigate} /> : <div className="chronicles-empty-detail"><BookOpen size={24} /><strong>Select an objective</strong><span>Its requirement, reward, and destination will appear here.</span></div>}</aside>
      </div>
    </div>
  </ModalPortal>
}

function ChronicleDetail({ objective, state, onNavigate }: { objective: ChronicleObjectiveDefinition; state: ReturnType<typeof useGameStore.getState>; onNavigate: (objective: ChronicleObjectiveDefinition) => void }) {
  const status = getChronicleObjectiveStatus(state, objective)
  const condition = getChronicleConditionProgress(state, objective)
  const rewards = getChronicleRewardSummary(objective)
  return <div className="chronicles-detail-content"><div className="chronicles-detail-topline"><Status tone={status === 'completed' ? 'success' : status === 'current' ? 'active' : status === 'locked' ? 'locked' : 'neutral'}>{statusLabels[status]}</Status><span>{objective.optional ? 'Optional thread' : 'Authored objective'}</span></div><h3>{objective.title}</h3><p className="chronicles-detail-description">{objective.description}</p><section className="chronicles-detail-section"><span className="eyebrow">REQUIREMENT</span><strong>{condition.label}</strong><div className="chronicles-requirement-row"><span className="chronicles-mini-progress"><i style={{ width: `${Math.min(100, condition.current / Math.max(1, condition.target) * 100)}%` }} /></span><b>{getChronicleConditionValueLabel(condition)}</b></div></section>{(objective.prerequisiteIds?.length || objective.unlockAnyPrerequisiteIds?.length) ? <section className="chronicles-detail-section"><span className="eyebrow">PREREQUISITES</span><div className="chronicles-prerequisite-list">{[...(objective.prerequisiteIds ?? []), ...(objective.unlockAnyPrerequisiteIds ?? [])].map((id) => <span key={id} className={isChronicleObjectiveComplete(state, id) ? 'complete' : ''}>{isChronicleObjectiveComplete(state, id) ? <Check size={12} /> : <i />}{CHRONICLE_OBJECTIVE_BY_ID[id]?.title ?? id}</span>)}</div></section> : null}{rewards.length > 0 && <section className="chronicles-detail-section"><span className="eyebrow">REWARDS</span><div className="chronicles-reward-list">{rewards.map((reward) => <span key={reward}><Check size={12} />{reward}</span>)}</div></section>}{objective.navigateTo && <Button variant={status === 'current' ? 'primary' : 'secondary'} onClick={() => onNavigate(objective)}>Open Destination <ChevronRight size={14} /></Button>}</div>
}
