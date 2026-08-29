import { Check, ChevronRight, Target } from 'lucide-react'
import type { ItemId } from '../../game/types'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'
import { formatNumber, formatOfflineBank } from '../../game/utils'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { getResearchEchoesAssigned } from '../../game/systems/research/researchSelectors'
import { SchoolMasteryPanel } from '../../components/game/schools/SchoolMasteryPanel'
import { CurrentArcaneWork } from './CurrentArcaneWork'

export function HomeScreenV2() {
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const combat = useGameStore((state) => state.combat)
  const inventory = useGameStore((state) => state.inventory)
  const equipment = useGameStore((state) => state.equipment)
  const schools = useGameStore((state) => state.schools)
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const setScreen = useGameStore((state) => state.setScreen)
  const hasAuto = Object.values(activities.autoCast).some(Boolean)
  const hasEquipment = Object.values(equipment).some((id) => id && (['ember-staff', 'tide-focus', 'stoneweave-robe', 'windthread-charm'] as ItemId[]).includes(id))
  const permanentFocus = Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)
  const woodsComplete = (progress.bossKillsByBoss[DUNGEONS['whispering-woods'].boss] ?? 0) > 0
  const denComplete = (progress.bossKillsByBoss[DUNGEONS['howling-den'].boss] ?? 0) > 0
  const chapterComplete = (progress.bossKillsByBoss[DUNGEONS['abandoned-catacombs'].boss] ?? 0) > 0 || progress.firstMainBossKill
  const objectives = [
    { label: 'Assign your first Arcane Echo', done: activities.channeling.echoesAssigned > 0 },
    { label: 'Transmute a Fragment', done: Object.entries(inventory).some(([id, quantity]) => id.endsWith('fragment') && Boolean(quantity)) },
    { label: 'Research a Fragment', done: Object.values(schools).some((school) => school.xp > 0) },
    { label: 'Reach School Level 2', done: Object.values(schools).some((school) => school.level >= 2) },
    { label: 'Unlock a Spell', done: progress.unlockedSpells.length > 0 },
    { label: 'Enter Whispering Woods', done: combat.active || progress.lifetimeKills > 0 },
    { label: 'Defeat a monster', done: progress.lifetimeKills > 0 },
    { label: 'Enable Auto-Cast', done: hasAuto },
    { label: 'Run Research during Combat', done: combat.active && getResearchEchoesAssigned({ activities }) > 0 },
    { label: `Reach ${DUNGEONS['whispering-woods'].threatRequired} Threat`, done: combat.threatCleared >= DUNGEONS['whispering-woods'].threatRequired || woodsComplete },
    { label: 'Defeat Forest Heart', done: woodsComplete },
    { label: 'Unlock Howling Den', done: woodsComplete },
    { label: 'Craft and equip an elemental item', done: hasEquipment },
    { label: 'Complete a Guild Request', done: Object.values(progress.requestClaims).some(Boolean) },
    { label: 'Reach School Level 4', done: Object.values(schools).some((school) => school.level >= 4) },
    { label: 'Unlock a second spell', done: progress.unlockedSpells.some((spell) => ['ignite', 'flow-mend', 'stoneguard', 'quickening'].includes(spell)) },
    { label: 'Defeat Corrupted Greatbear', done: denComplete },
    { label: 'Complete the first three dungeons', done: chapterComplete },
  ]
  const objective = chapterComplete ? 'First Chapter Complete' : denComplete ? 'Enter Abandoned Catacombs' : woodsComplete ? 'Clear Howling Den' : 'Clear Whispering Woods'
  const objectiveDescription = chapterComplete ? 'The first three dungeons are complete. The tower has learned what waits beyond the woods.' : denComplete ? "Enter the Abandoned Catacombs and confront Archmage Edrin's Shade." : woodsComplete ? 'Defeat Corrupted Greatbear to unlock the Abandoned Catacombs.' : `Reach ${DUNGEONS['whispering-woods'].threatRequired} Threat Cleared and defeat Forest Heart.`
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · OVERVIEW</div><h1>Good evening, apprentice.</h1><p>One wizard. One tower. Every system is competing for the same Focus.</p></div><Button variant="secondary" onClick={() => setScreen('tower-channeling')}>Open Channeling <ChevronRight size={15} /></Button></div><EditableGrid screen="home" panels={[
    { id: 'home-objective', content: <div className={`objective-card ${chapterComplete ? 'success' : 'violet'}`}><div className="objective-icon"><Target size={22} /></div><div className="objective-copy"><span>MAIN OBJECTIVE</span><h2>{objective}</h2><p>{objectiveDescription}{!chapterComplete && woodsComplete && ` Permanent Focus gained: +${permanentFocus}.`}</p></div><div className="objective-state"><Status tone={chapterComplete ? 'success' : 'active'}>{chapterComplete ? 'COMPLETE' : `CAP ${progress.magicLevelCap}`}</Status></div></div> },
    { id: 'home-checklist', content: <Card title="Chapter checklist" action={<span className="muted">{objectives.filter((item) => item.done).length} / {objectives.length}</span>}><div className="objective-list">{objectives.map((item) => <div key={item.label} className={item.done ? 'done' : ''}><span>{item.done ? <Check size={14} /> : <i />}</span>{item.label}</div>)}</div></Card> },
    { id: 'home-wizard', content: <Card title="The wizard"><div className="wizard-portrait"><div className="wizard-orbit orbit-one" /><div className="wizard-orbit orbit-two" /><div className="wizard-silhouette">♙</div><div className="wizard-sigil">✦</div></div><div className="wizard-details"><h3>Apprentice of the Tower</h3><p>Magic School cap <strong>{progress.magicLevelCap}</strong> · {formatNumber(player.maxFocus)} Max Focus</p><div className="metric-row"><div className="metric"><span>Active systems</span><strong>{Number(combat.active) + Number(getResearchEchoesAssigned({ activities }) > 0) + Number(Object.values(activities.transmutation.jobs).some((job) => (job?.echoesAssigned ?? 0) > 0))}</strong></div><div className="metric"><span>Lifetime kills</span><strong>{formatNumber(progress.lifetimeKills)}</strong></div><div className="metric"><span>Offline Bank</span><strong>{formatOfflineBank(offlineBankMs)}</strong></div></div></div></Card> },
    { id: 'home-school-mastery', content: <SchoolMasteryPanel /> },
    { id: 'home-arcane-work', content: <CurrentArcaneWork /> },
  ]} /></div>
}
