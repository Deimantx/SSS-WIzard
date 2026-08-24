import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { selectFreeFocus, selectManaRegen, selectUsedFocus } from '../../store/selectors'
import { useGameStore } from '../../store/gameStore'
import { formatNumber } from '../../game/utils'
import { ChannelingPanel } from './ChannelingPanel'
import { FocusPanel } from './FocusPanel'
import { CondensationPanel } from './CondensationPanel'
import { ResearchPanel } from './ResearchPanel'
import { TransmutationPanel } from './TransmutationPanel'

export function TowerScreenV2() { const player = useGameStore((state) => state.player); const used = useGameStore(selectUsedFocus); const free = useGameStore(selectFreeFocus); const manaRegen = useGameStore(selectManaRegen); return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">ROOM 01 · WIZARD TOWER</div><h1>The tower is awake.</h1><p>Keep the tower working while the wizard fights below. Every automated room reserves Focus.</p></div><div className="focus-summary"><span>FOCUS RESERVATION</span><strong>{formatNumber(used)} <small>/ {player.maxFocus}</small></strong><em>{formatNumber(free)} free · +{manaRegen}/s</em></div></div><EditableGrid screen="tower" panels={[{ id: 'tower-channeling', content: <ChannelingPanel /> }, { id: 'tower-focus', content: <FocusPanel /> }, { id: 'tower-condensation', content: <CondensationPanel /> }, { id: 'tower-research', content: <ResearchPanel /> }, { id: 'tower-transmutation', content: <TransmutationPanel /> }]} /></div> }
