import { BookOpen, Check, ChevronRight, Target } from 'lucide-react'
import { useState } from 'react'
import { CHRONICLE_CHAPTERS } from '../../game/content/chronicles/chronicles'
import { getChronicleActiveChapter, getChronicleChapterProgress, getChronicleMainObjective } from '../../game/systems/chronicles/chronicleRuntime'
import { buildChronicleReadModel, sortChronicleReadModel } from '../../game/presentation/chronicles/chronicleReadModel'
import { useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'
import { formatNumber, formatOfflineBank } from '../../game/utils'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { SchoolMasteryPanel } from '../../components/game/schools/SchoolMasteryPanel'
import { CurrentArcaneWork } from './CurrentArcaneWork'
import { ChroniclesModal } from './ChroniclesModal'
import { selectTotalAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes'

const trackLabel = (track: string) => track.toUpperCase()

export function HomeScreenV2() {
  const gameState = useGameStore((state) => state)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const tower = useGameStore((state) => state.tower)
  const combat = useGameStore((state) => state.combat)
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const [chroniclesOpen, setChroniclesOpen] = useState(false)
  const uiPreferences = useUiPreferences()
  const activeChapterId = getChronicleActiveChapter(gameState)
  const chapter = CHRONICLE_CHAPTERS.find((entry) => entry.id === activeChapterId) ?? CHRONICLE_CHAPTERS[0]
  const chapterProgress = getChronicleChapterProgress(gameState, chapter.id)
  const mainObjective = getChronicleMainObjective(gameState, chapter.id)
  const overviewObjectives = sortChronicleReadModel(buildChronicleReadModel(gameState, chapter.id, uiPreferences.screenState.chronicles.trackedObjectiveIds).filter((item) => item.status === 'current' || item.status === 'available'), 'recommended').slice(0, 3)
  const chapterComplete = chapterProgress.requiredCompleted === chapterProgress.requiredTotal && chapterProgress.requiredTotal > 0
  const objective = mainObjective?.title ?? `Complete ${chapter.name}`
  const objectiveDescription = mainObjective?.description ?? chapter.description

  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · OVERVIEW</div><h1>Good evening, apprentice.</h1><p>One wizard. One tower. Combat is yours; Acolytes keep the Tower working.</p></div></div><ScreenGrid screen="home" panels={[
    { id: 'home-objective', content: <div className={`objective-card ${chapterComplete ? 'success' : 'violet'}`}><div className="objective-icon"><Target size={22} /></div><div className="objective-copy"><span>MAIN OBJECTIVE · {chapter.name.toUpperCase()}</span><h2>{objective}</h2><p>{objectiveDescription}</p></div><div className="objective-state"><Status tone={chapterComplete ? 'success' : 'active'}>{chapterComplete ? 'COMPLETE' : 'IN PROGRESS'}</Status></div></div> },
    { id: 'home-school-mastery', content: <SchoolMasteryPanel /> },
    { id: 'home-chronicles', content: <Card title="Chronicles" action={<div className="home-chronicles-actions"><Button variant="ghost" onClick={() => setChroniclesOpen(true)}><BookOpen size={14} /> Open Chronicles</Button><Button variant="secondary" onClick={() => setChroniclesOpen(true)}>Manage Objectives</Button></div>}><div className="home-chronicles-summary"><div className="home-chronicles-progress"><div><span className="eyebrow">{chapter.name}</span><strong>{chapterProgress.requiredCompleted} / {chapterProgress.requiredTotal} required · {chapterProgress.requiredPercent}%</strong><strong>{chapterProgress.optionalCompleted} / {chapterProgress.optionalTotal} optional</strong></div><span className="home-chronicles-progress-bar"><i style={{ width: `${chapterProgress.requiredPercent}%` }} /></span></div><div className="home-chronicles-goals">{overviewObjectives.length ? overviewObjectives.map((item) => { const status = item.status; const condition = item.progress; return <button type="button" key={item.id} className={`home-chronicle-goal ${status === 'current' ? 'current' : ''}`} onClick={() => { setChroniclesOpen(true) }}><span className="home-chronicle-goal-icon">{status === 'current' ? <Target size={14} /> : <Check size={14} />}</span><span><small>{trackLabel(item.track)} · {condition.label}</small><strong>{item.title}</strong></span><ChevronRight size={14} /></button> }) : <div className="home-chronicles-complete"><Check size={16} /><span><strong>Every visible goal is complete.</strong><small>Open Chronicles to review the chapter history.</small></span></div>}</div><div className="home-chronicles-footer"><span>Required progress drives chapter completion</span><Button variant="secondary" onClick={() => setChroniclesOpen(true)}>View Full Chronicle <ChevronRight size={14} /></Button></div></div></Card> },
    { id: 'home-wizard', content: <Card title="The wizard"><div className="wizard-portrait"><div className="wizard-orbit orbit-one" /><div className="wizard-orbit orbit-two" /><div className="wizard-silhouette">♙</div><div className="wizard-sigil">✦</div></div><div className="wizard-details"><h3>Apprentice of the Tower</h3><p>Magic School cap <strong>{progress.magicLevelCap}</strong> · {selectUsedAcolytes({ activities, tower } as never)} / {selectTotalAcolytes({ activities, tower } as never)} Acolytes assigned</p><div className="metric-row"><div className="metric"><span>Active systems</span><strong>{Number(combat.active) + Number(selectUsedAcolytes({ activities, tower } as never) > 0)}</strong></div><div className="metric"><span>Lifetime kills</span><strong>{formatNumber(progress.lifetimeKills)}</strong></div><div className="metric"><span>Offline Bank</span><strong>{formatOfflineBank(offlineBankMs)}</strong></div></div></div></Card> },
    { id: 'home-arcane-work', content: <CurrentArcaneWork /> },
  ]} /><ChroniclesModal open={chroniclesOpen} onClose={() => setChroniclesOpen(false)} /></div>
}
