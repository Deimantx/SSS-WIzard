import { useState } from 'react'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../../store/gameStore'
import { CHANNELING_DISCOVERIES } from '../../../game/data/channelingDiscoveries'
import { ManaCorePanel } from './ManaCorePanel'
import { ArcaneEchoPanel } from './ArcaneEchoPanel'
import { ManaPillarsPanel } from './ManaPillarsPanel'
import { ArcaneDiscoveriesModal } from './ArcaneDiscoveriesModal'
import { ArcaneDiscoveriesStrip } from './ArcaneDiscoveriesStrip'

export function ChannelingScreen() {
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false)
  const discoveries = useGameStore((state) => state.progress.channeling.discoveries)
  const completed = CHANNELING_DISCOVERIES.filter(({ id }) => discoveries[id]).length
  return <div className="screen-content channeling-screen">
    <div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · CHANNELING</div><h1>Channeling Chamber</h1><p>The tower draws from the leyline. Reserve Focus for Echoes and build a stronger Mana engine.</p></div></div>
    <ArcaneDiscoveriesStrip completed={completed} total={CHANNELING_DISCOVERIES.length} onOpen={() => setDiscoveriesOpen(true)} />
    <EditableGrid screen="tower-channeling" panels={[
      { id: 'channeling-mana-core', content: <ManaCorePanel /> },
      { id: 'channeling-echoes', content: <ArcaneEchoPanel /> },
      { id: 'channeling-pillars', content: <ManaPillarsPanel /> },
    ]} />
    {discoveriesOpen && <ArcaneDiscoveriesModal onClose={() => setDiscoveriesOpen(false)} />}
  </div>
}
