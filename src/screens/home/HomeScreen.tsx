import { Check, ChevronRight, Target } from 'lucide-react'
import { CHRONICLE_OBJECTIVES } from '../../game/content/chronicles/chronicles'
import { getChronicleDisplayObjectives, getChronicleMainObjective, isChronicleChapterComplete, isChronicleObjectiveComplete } from '../../game/systems/chronicles/chronicleRuntime'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'
import { formatNumber, formatOfflineBank } from '../../game/utils'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { SchoolMasteryPanel } from '../../components/game/schools/SchoolMasteryPanel'
import { CurrentArcaneWork } from './CurrentArcaneWork'
import { selectTotalAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes'

export function HomeScreenV2() {
  const gameState = useGameStore((state) => state)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const tower = useGameStore((state) => state.tower)
  const combat = useGameStore((state) => state.combat)
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const setScreen = useGameStore((state) => state.setScreen)
  const mainObjective = getChronicleMainObjective(gameState)
  const chapterComplete = isChronicleChapterComplete(gameState, 'first-frontier')
  const objectives = getChronicleDisplayObjectives(gameState)
  const completedCount = CHRONICLE_OBJECTIVES.filter((item) => isChronicleObjectiveComplete(gameState, item.id)).length
  const objective = mainObjective?.title ?? 'Complete First Frontier'
  const objectiveDescription = mainObjective?.description ?? 'First Frontier is complete. The tower has learned what waits beyond the woods.'
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · OVERVIEW</div><h1>Good evening, apprentice.</h1><p>One wizard. One tower. Combat is yours; Acolytes keep the Tower working.</p></div><Button variant="secondary" onClick={() => setScreen('tower-channeling')}>Open Channeling <ChevronRight size={15} /></Button></div><ScreenGrid screen="home" panels={[
    { id: 'home-objective', content: <div className={`objective-card ${chapterComplete ? 'success' : 'violet'}`}><div className="objective-icon"><Target size={22} /></div><div className="objective-copy"><span>MAIN OBJECTIVE</span><h2>{objective}</h2><p>{objectiveDescription}</p></div><div className="objective-state"><Status tone={chapterComplete ? 'success' : 'active'}>{chapterComplete ? 'COMPLETE' : 'IN PROGRESS'}</Status></div></div> },
    { id: 'home-checklist', content: <Card title="Chronicles" action={<span className="muted">{completedCount} / {CHRONICLE_OBJECTIVES.length}</span>}><div className="chronicle-track-list">{(['main', 'combat', 'magic', 'tower'] as const).map((track) => { const trackObjectives = objectives.filter((item) => item.track === track); if (!trackObjectives.length) return null; return <section className="chronicle-track" key={track}><header><span>{track}</span><small>{trackObjectives.filter((item) => isChronicleObjectiveComplete(gameState, item.id)).length} complete</small></header>{trackObjectives.map((item) => { const done = isChronicleObjectiveComplete(gameState, item.id); return <button type="button" key={item.id} className={`chronicle-objective ${done ? 'done' : ''}`} onClick={() => item.navigateTo && setScreen(item.navigateTo)}><span>{done ? <Check size={14} /> : <i />}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><ChevronRight size={14} /></button> })}</section> })}</div></Card> },
    { id: 'home-wizard', content: <Card title="The wizard"><div className="wizard-portrait"><div className="wizard-orbit orbit-one" /><div className="wizard-orbit orbit-two" /><div className="wizard-silhouette">♙</div><div className="wizard-sigil">✦</div></div><div className="wizard-details"><h3>Apprentice of the Tower</h3><p>Magic School cap <strong>{progress.magicLevelCap}</strong> · {selectUsedAcolytes({ activities, tower } as never)} / {selectTotalAcolytes({ activities, tower } as never)} Acolytes assigned</p><div className="metric-row"><div className="metric"><span>Active systems</span><strong>{Number(combat.active) + Number(selectUsedAcolytes({ activities, tower } as never) > 0)}</strong></div><div className="metric"><span>Lifetime kills</span><strong>{formatNumber(progress.lifetimeKills)}</strong></div><div className="metric"><span>Offline Bank</span><strong>{formatOfflineBank(offlineBankMs)}</strong></div></div></div></Card> },
    { id: 'home-school-mastery', content: <SchoolMasteryPanel /> },
    { id: 'home-arcane-work', content: <CurrentArcaneWork /> },
  ]} /></div>
}
