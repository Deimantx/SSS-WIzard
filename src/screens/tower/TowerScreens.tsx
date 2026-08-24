import { useMemo } from 'react'
import { deriveFocusReservations } from '../../game/engine'
import { RECIPES } from '../../game/data/recipes'
import { ITEMS } from '../../game/data/items'
import { SCHOOLS } from '../../game/data/schools'
import { selectFreeFocus, selectUsedFocus } from '../../store/selectors'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Progress, Status } from '../../components/ui'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { ChannelingPanel } from './ChannelingPanel'
import { CondensationPanel } from './CondensationPanel'
import { FocusPanel } from './FocusPanel'
import { ResearchPanel } from './ResearchPanel'
import { TransmutationPanel } from './TransmutationPanel'

export function TowerChannelingScreen() {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  return <TowerFrame eyebrow="WIZARD TOWER · CHANNELING" title="The tower draws from the leyline." description="Draw Mana into the tower and decide whether the channel should run unattended."><EditableGrid screen="tower-channeling" panels={[{ id: 'channeling-main', content: <ChannelingPanel /> }, { id: 'channeling-stats', content: <Card title="Channeling stats"><div className="tower-stat-list"><span>Current Mana<strong>{Math.floor(player.mana)} / {player.maxMana}</strong></span><span>Auto Channel<strong>{activities.autoChannel ? 'Active' : 'Paused'}</strong></span><span>Focus reserved<strong>{activities.autoChannel ? '10' : '0'}</strong></span></div><Progress value={player.mana / player.maxMana * 100} label="Mana reserves" right={`${Math.floor(player.mana)} / ${player.maxMana}`} /></Card> }]} /></TowerFrame>
}

export function TowerFocusScreen() {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const reservations = useMemo(() => deriveFocusReservations({ activities, progress }), [activities, progress])
  return <TowerFrame eyebrow="WIZARD TOWER · FOCUS" title="Focus is the tower’s limiting spell." description="Review every reservation before you automate another system."><EditableGrid screen="tower-focus" panels={[{ id: 'focus-summary', content: <FocusPanel /> }, { id: 'focus-reservations', content: <Card title="Reservation ledger"><div className="tower-focus-hero"><strong>{free} free</strong><span>{used} / {player.maxFocus} reserved</span></div><Progress value={used / player.maxFocus * 100} tone="violet" label="Focus allocation" right={`${used} / ${player.maxFocus}`} /><div className="reservation-list">{reservations.length ? reservations.map((reservation) => <div className="reservation" key={reservation.id}><span className="reservation-dot" /><span>{reservation.label}</span><strong>{reservation.amount}</strong></div>) : <div className="empty-state small">No automated activities are reserving Focus.</div>}</div></Card> }]} /></TowerFrame>
}

export function TowerCondensationScreen() {
  const condense = useGameStore((state) => state.activities.condense)
  const inventory = useGameStore((state) => state.inventory)
  return <TowerFrame eyebrow="WIZARD TOWER · ELEMENTAL CONDENSATION" title="Turn Mana into elemental matter." description="Choose a fragment to condense. The activity continues while you visit other screens."><EditableGrid screen="tower-condensation" panels={[{ id: 'condensation-elements', content: <CondensationPanel /> }, { id: 'condensation-status', content: <Card title="Condensation status" action={<Status tone={condense.running ? 'active' : 'neutral'}>{condense.running ? 'Running' : 'Paused'}</Status>}><div className="tower-stat-list"><span>Selected element<strong>{SCHOOLS[condense.element].name}</strong></span><span>Fragments banked<strong>{inventory[SCHOOLS[condense.element].fragment] ?? 0}</strong></span><span>Focus reservation<strong>35</strong></span></div><p className="muted">Pause or resume the activity from the primary condensation panel.</p></Card> }]} /></TowerFrame>
}

export function TowerResearchScreen() {
  const job = useGameStore((state) => state.activities.research)
  const inventory = useGameStore((state) => state.inventory)
  return <TowerFrame eyebrow="WIZARD TOWER · ARCANE CRUCIBLE" title="Research turns fragments into understanding." description="Destroy material to deepen a Magic School. Queued research survives navigation and low Mana."><EditableGrid screen="tower-research" panels={[{ id: 'research-config', content: <ResearchPanel /> }, { id: 'research-queue', content: <Card title="Research queue" action={<Status tone={job.running ? 'active' : 'neutral'}>{job.running ? 'Running' : job.status}</Status>}><div className="tower-stat-list"><span>Target<strong>{job.targetSchoolId ? SCHOOLS[job.targetSchoolId].name : 'Not configured'}</strong></span><span>Item remaining<strong>{job.itemId ? `${job.remainingQuantity} × ${ITEMS[job.itemId].name}` : '—'}</strong></span><span>Available<strong>{job.itemId ? inventory[job.itemId] ?? 0 : '—'}</strong></span></div><p className="muted">The queue pauses safely at a Magic School cap or when its item is protected.</p></Card> }]} /></TowerFrame>
}

export function TowerTransmutationScreen() {
  const activity = useGameStore((state) => state.activities.transmutation)
  const recipe = activity.recipeId ? RECIPES[activity.recipeId] : RECIPES['ember-staff']
  return <TowerFrame eyebrow="WIZARD TOWER · TRANSMUTATION" title="Turn gathered materials into equipment." description="Choose a recipe and let the transmutation chamber work while the rest of the tower remains active."><EditableGrid screen="tower-transmutation" panels={[{ id: 'transmutation-recipes', content: <TransmutationPanel /> }, { id: 'transmutation-detail', content: <Card title="Recipe detail"><div className="recipe-detail-summary"><div className="recipe-item">{ITEMS[recipe.output].icon}</div><div><strong>{recipe.name}</strong><p className="muted">{activity.running ? 'Transmutation is in progress.' : 'Select a recipe in the primary panel to begin.'}</p></div></div><div className="cost-line">{recipe.ingredients.map((ingredient) => <span key={ingredient.itemId}>{ITEMS[ingredient.itemId].name} <strong>{ingredient.quantity}</strong></span>)}</div><Status tone={activity.running ? 'active' : 'neutral'}>{activity.running ? 'Running' : 'Ready'}</Status></Card> }]} /></TowerFrame>
}

function TowerFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>{children}</div>
}
