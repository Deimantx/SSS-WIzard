import { CHRONICLE_CHAPTERS, CHRONICLE_OBJECTIVES, CHRONICLE_OBJECTIVE_BY_ID, type ChronicleObjectiveDefinition } from '../../content/chronicles/chronicles'
import { getChronicleConditionProgress, getChronicleConditionProgressForCondition, getChronicleRewardSummary, type ChronicleConditionProgress } from './chroniclePresentation'
import { getChronicleObjectiveStatus, isChronicleChapterAvailable, isChronicleObjectiveComplete, type ChronicleObjectiveStatus } from '../../systems/chronicles/chronicleRuntime'
import type { ChronicleChapterId, ChronicleObjectiveId, ChronicleTrack, GameState, ScreenId } from '../../types'
import type { ChronicleStatusFilter, UiPreferences } from '../../../ui/preferences/uiPreferencesTypes'

export type ChronicleLockReason =
  | { type: 'required-objective'; objectiveId: ChronicleObjectiveId; title: string; complete: boolean }
  | { type: 'any-objective'; objectiveIds: ChronicleObjectiveId[]; titles: string[]; complete: boolean }
  | { type: 'condition'; label: string; current: number; target: number; complete: boolean }

export interface ChronicleObjectiveReadModel {
  id: ChronicleObjectiveId
  chapterId: ChronicleChapterId
  chapterName: string
  track: ChronicleTrack
  title: string
  description: string
  status: ChronicleObjectiveStatus
  required: boolean
  optional: boolean
  tracked: boolean
  progress: ChronicleConditionProgress & { percent: number }
  lockReasons: ChronicleLockReason[]
  rewards: string[]
  navigateTo?: ScreenId
  authoredIndex: number
}

export interface ChronicleReadQuery {
  search: string
  statusFilters: ChronicleStatusFilter[]
  trackFilters: ChronicleTrack[]
  hideCompleted: boolean
  showLocked: boolean
  showOptional: boolean
}

export const CHRONICLE_TRACKS: readonly ChronicleTrack[] = ['main', 'combat', 'magic', 'tower', 'guild', 'region']
export const CHRONICLE_TRACK_LABELS: Record<ChronicleTrack, string> = { main: 'Main', combat: 'Combat', magic: 'Magic', tower: 'Tower', guild: 'Guild', region: 'Region' }
export const CHRONICLE_STATUS_LABELS: Record<ChronicleObjectiveStatus, string> = { current: 'Current', available: 'Available', locked: 'Locked', completed: 'Complete' }

const completionPercent = (progress: ChronicleConditionProgress) => progress.target > 0 ? Math.min(100, Math.round(progress.current / progress.target * 100)) : progress.complete ? 100 : 0

export const getChronicleLockReasons = (state: GameState, objective: ChronicleObjectiveDefinition): ChronicleLockReason[] => {
  const reasons: ChronicleLockReason[] = []
  const chapter = CHRONICLE_CHAPTERS.find((entry) => entry.id === objective.chapterId)
  if (objective.track === 'main' && chapter && !isChronicleChapterAvailable(state, chapter.id) && chapter.unlockCondition) {
    const progress = getChronicleConditionProgressForCondition(state, chapter.unlockCondition)
    reasons.push({ type: 'condition', ...progress })
  }
  for (const objectiveId of objective.prerequisiteIds ?? []) {
    const prerequisite = CHRONICLE_OBJECTIVE_BY_ID[objectiveId]
    reasons.push({ type: 'required-objective', objectiveId, title: prerequisite?.title ?? objectiveId, complete: isChronicleObjectiveComplete(state, objectiveId) })
  }
  if (objective.unlockAnyPrerequisiteIds?.length) {
    reasons.push({ type: 'any-objective', objectiveIds: objective.unlockAnyPrerequisiteIds, titles: objective.unlockAnyPrerequisiteIds.map((id) => CHRONICLE_OBJECTIVE_BY_ID[id]?.title ?? id), complete: objective.unlockAnyPrerequisiteIds.some((id) => isChronicleObjectiveComplete(state, id)) })
  }
  if (objective.unlockCondition && !isChronicleObjectiveComplete(state, objective.id)) {
    const progress = getChronicleConditionProgressForCondition(state, objective.unlockCondition)
    if (!progress.complete) reasons.push({ type: 'condition', ...progress })
  }
  return reasons.filter((reason) => reason.type === 'required-objective' ? !reason.complete : reason.type === 'any-objective' ? !reason.complete : !reason.complete)
}

export const buildChronicleReadModel = (state: GameState, chapterId: ChronicleChapterId, trackedObjectiveIds: ChronicleObjectiveId[] = []): ChronicleObjectiveReadModel[] => {
  const tracked = new Set(trackedObjectiveIds)
  const chapterName = CHRONICLE_CHAPTERS.find((entry) => entry.id === chapterId)?.name ?? chapterId
  return CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId).map((objective) => {
    const progress = getChronicleConditionProgress(state, objective)
    const status = getChronicleObjectiveStatus(state, objective)
    return { id: objective.id, chapterId: objective.chapterId, chapterName, track: objective.track, title: objective.title, description: objective.description, status, required: objective.track === 'main' && !objective.optional, optional: objective.optional === true || objective.track !== 'main', tracked: tracked.has(objective.id), progress: { ...progress, percent: completionPercent(progress) }, lockReasons: getChronicleLockReasons(state, objective), rewards: getChronicleRewardSummary(objective), navigateTo: objective.navigateTo, authoredIndex: CHRONICLE_OBJECTIVES.indexOf(objective) }
  })
}

const searchText = (objective: ChronicleObjectiveReadModel) => [
  objective.title,
  objective.description,
  objective.progress.label,
  CHRONICLE_TRACK_LABELS[objective.track],
  objective.chapterName,
  ...objective.rewards,
  ...objective.lockReasons.flatMap((reason) => reason.type === 'any-objective' ? reason.titles : reason.type === 'required-objective' ? [reason.title] : [reason.label]),
].join(' ').toLocaleLowerCase()

export const filterChronicleReadModel = (models: ChronicleObjectiveReadModel[], query: ChronicleReadQuery) => {
  const search = query.search.trim().toLocaleLowerCase()
  const tracks = new Set(query.trackFilters)
  const statuses = new Set(query.statusFilters)
  return models.filter((objective) => {
    if (search && !searchText(objective).includes(search)) return false
    if (tracks.size > 0 && !tracks.has(objective.track)) return false
    if (!statuses.has(objective.status)) return false
    if (query.hideCompleted && objective.status === 'completed') return false
    if (!query.showLocked && objective.status === 'locked') return false
    if (!query.showOptional && objective.optional) return false
    return true
  })
}

export const sortChronicleReadModel = (models: ChronicleObjectiveReadModel[], sort: UiPreferences['screenState']['chronicles']['sort']) => [...models].sort((a, b) => {
  if (sort === 'authored') return a.authoredIndex - b.authoredIndex
  if (sort === 'progress') return b.progress.percent - a.progress.percent || a.authoredIndex - b.authoredIndex
  if (sort === 'track') return CHRONICLE_TRACK_LABELS[a.track].localeCompare(CHRONICLE_TRACK_LABELS[b.track]) || a.authoredIndex - b.authoredIndex
  if (sort === 'reward') return b.rewards.length - a.rewards.length || a.authoredIndex - b.authoredIndex
  const score = (objective: ChronicleObjectiveReadModel) => (objective.tracked ? 5000 : 0) + (objective.status === 'current' ? 10000 : objective.status === 'available' ? 2500 : objective.status === 'locked' ? 1000 : 0) + objective.progress.percent
  return score(b) - score(a) || a.authoredIndex - b.authoredIndex
})

export const groupChronicleReadModel = (models: ChronicleObjectiveReadModel[], group: UiPreferences['screenState']['chronicles']['group']) => {
  if (group === 'none') return [{ id: 'all', label: 'All Objectives', models }]
  const groups = new Map<string, ChronicleObjectiveReadModel[]>()
  for (const model of models) {
    const id = group === 'track' ? model.track : model.status
    groups.set(id, [...(groups.get(id) ?? []), model])
  }
  const order = group === 'track' ? CHRONICLE_TRACKS : ['current', 'available', 'locked', 'completed']
  return order.filter((id) => groups.has(id)).map((id) => ({ id, label: group === 'track' ? CHRONICLE_TRACK_LABELS[id as ChronicleTrack] : id[0].toUpperCase() + id.slice(1), models: groups.get(id) ?? [] }))
}
