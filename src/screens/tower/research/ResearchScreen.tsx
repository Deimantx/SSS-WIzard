import { useEffect } from 'react'
import { getResearchableItemIds, ITEMS } from '../../../game/content/items/items'
import type { ItemId } from '../../../game/types'
import { setUiPreferences, useUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../../store/gameStore'
import { RESEARCH_SLOT_ORDER } from '../../../game/systems/research/researchReservations'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { TowerFrame } from '../TowerFrame'
import { PreparedResearch } from './PreparedResearch'
import { ResearchInspector } from './ResearchInspector'
import { ResearchLibrary } from './ResearchLibrary'
import { SchoolMasteryPanel } from '../../../components/game/schools/SchoolMasteryPanel'

export function ResearchScreen() {
  const preferences = useUiPreferences()
  const preparedItemSignature = useGameStore((state) => RESEARCH_SLOT_ORDER.map((slotId) => state.activities.research.slots[slotId]?.itemId ?? '').join('|'))
  const researchableInventorySignature = useGameStore((state) => getResearchableItemIds().map((itemId) => `${itemId}:${state.inventory[itemId] ?? 0}`).join('|'))
  const storedItemId = preferences.screenState.research.selectedItemId
  const filter = preferences.screenState.research.affinityFilter
  const preparedIds = new Set(preparedItemSignature.split('|').filter(Boolean) as ItemId[])
  const ownedIds = new Set(researchableInventorySignature.split('|').filter((entry) => Number(entry.split(':')[1]) > 0).map((entry) => entry.split(':')[0] as ItemId))
  const visibleIds = getResearchableItemIds().filter((itemId) => (ownedIds.has(itemId) || preparedIds.has(itemId)) && (filter === 'all' || ITEMS[itemId].researchSchool === filter))
  const selectedItemId = storedItemId && visibleIds.includes(storedItemId) ? storedItemId : visibleIds[0] ?? null

  useEffect(() => {
    if (selectedItemId !== storedItemId) {
      const native = selectedItemId ? ITEMS[selectedItemId].researchSchool : null
      setUiPreferences({ screenState: { research: { selectedItemId, ...(native ? { targetSchoolId: native } : {}) } } })
    }
  }, [selectedItemId, storedItemId])

  const selectItem = (itemId: ItemId) => setUiPreferences({ screenState: { research: { selectedItemId: itemId, targetSchoolId: ITEMS[itemId].researchSchool ?? 'fire' } } })
  return <TowerFrame eyebrow="WIZARD TOWER · ARCANE CRUCIBLE" title="Research turns fragments into understanding." description="Prepare materials, direct their essence into a Magic School, and assign Arcane Echoes to accelerate the Crucible."><EditableGrid screen="tower-research" panels={[{ id: 'research-school-mastery', content: <SchoolMasteryPanel className="research-school-mastery" compact /> }, { id: 'research-library', content: <ResearchLibrary selectedItemId={selectedItemId} onSelect={selectItem} /> }, { id: 'research-inspector', content: <ResearchInspector itemId={selectedItemId} /> }, { id: 'research-prepared', content: <PreparedResearch /> }]} /></TowerFrame>
}
