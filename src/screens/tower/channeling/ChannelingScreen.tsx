import { useCallback, useState } from 'react'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../../store/gameStore'
import { CHANNELING_DISCOVERIES } from '../../../game/data/channelingDiscoveries'
import { ManaCorePanel } from './ManaCorePanel'
import { ArcaneEchoPanel } from './ArcaneEchoPanel'
import { ManaPillarsPanel } from './ManaPillarsPanel'
import { ArcaneDiscoveriesModal } from './ArcaneDiscoveriesModal'
import { ArcaneDiscoveriesStrip } from './ArcaneDiscoveriesStrip'
import { getChannelingExpandedLayout, type ChannelingExpandedState } from './channelingLayout'

export function ChannelingScreen() {
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false)
  const [expanded, setExpanded] = useState<ChannelingExpandedState>({ manaCore: false, echoes: false })
  const discoveries = useGameStore((state) => state.progress.channeling.discoveries)
  const completed = CHANNELING_DISCOVERIES.filter(({ id }) => discoveries[id]).length
  const togglePanel = (panel: keyof ChannelingExpandedState) => setExpanded((current) => ({ ...current, [panel]: !current[panel] }))
  const channelingLayoutTransform = useCallback((layout: Parameters<typeof getChannelingExpandedLayout>[0]) => getChannelingExpandedLayout(layout, expanded), [expanded])
  return <div className="screen-content channeling-screen">
    <div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · CHANNELING</div><h1>Channeling Chamber</h1><p>The tower draws from the leyline. Reserve Focus for Echoes and build a stronger Mana engine.</p></div></div>
    <ArcaneDiscoveriesStrip completed={completed} total={CHANNELING_DISCOVERIES.length} onOpen={() => setDiscoveriesOpen(true)} />
    <EditableGrid screen="tower-channeling" layoutTransform={channelingLayoutTransform} panels={[
      { id: 'channeling-mana-core', content: <ManaCorePanel expanded={expanded.manaCore} onToggle={() => togglePanel('manaCore')} /> },
      { id: 'channeling-echoes', content: <ArcaneEchoPanel details={expanded.echoes} onToggle={() => togglePanel('echoes')} /> },
      { id: 'channeling-pillars', content: <ManaPillarsPanel /> },
    ]} />
    {discoveriesOpen && <ArcaneDiscoveriesModal onClose={() => setDiscoveriesOpen(false)} />}
  </div>
}
