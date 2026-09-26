import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import type { GameState, ItemId, ResearchSlotId, SchoolId, SpellId, TransmutationRecipeId } from '../../game/types'
import { getSpellBrowserEntries, type SpellBrowserFilters } from './spellBrowserSelectors'
import { SpellInspector } from './SpellInspector'
import { MagicSchoolsHeader } from './MagicSchoolsHeader'
import { SchoolProgressOverview } from './SchoolProgressOverview'
import { SpellLibrary } from './SpellLibrary'
import { CombatSpellLoadout } from './CombatSpellLoadout'
import { SpellLoadoutDndProvider, type SpellDragPayload, type SpellDropTarget } from './SpellLoadoutDnd'

type LibraryCategory = 'All' | 'Damage' | 'Defense' | 'Control' | 'Utility'
type ScreenFilters = SpellBrowserFilters & { category: LibraryCategory }

const DEFAULT_FILTERS: ScreenFilters = { school: 'fire', search: '', showUnlockedOnly: false, type: 'All Types', sort: 'Unlock Level', category: 'All' }

export function MagicSchoolsScreenV2() {
  const selectedState = useGameStore(useShallow((state) => ({
    schools: state.schools,
    spellRanks: state.progress.spellRanks,
    magicLevelCap: state.progress.magicLevelCap,
    equipment: state.equipment,
    artifactProgress: state.artifactProgress,
    arcaneCore: state.arcaneCore,
    channelingAcolytes: state.activities.channeling.acolytesAssigned,
    researchReservations: Object.entries(state.activities.research.slots).map(([slotId, job]) => `${slotId}:${job?.itemId ?? ''}:${job?.targetSchoolId ?? ''}:${job?.acolyteAssigned ? 1 : 0}`).sort().join('|'),
    transmutationReservations: Object.entries(state.activities.transmutation.jobs).filter(([, job]) => Boolean(job?.acolyteAssigned)).map(([recipeId, job]) => `${recipeId}:1`).sort().join('|'),
    autoCast: state.activities.autoCast,
    playerHealth: state.player.health,
    playerMaxHealth: state.player.maxHealth,
    playerMana: state.player.mana,
    playerMaxMana: state.player.maxMana,
    playerMaxFocus: state.player.maxFocus,
    combatEnemyId: state.combat.enemyId,
    combatEnemyHp: state.combat.enemyHp,
    combatEnemyMaxHp: state.combat.enemyMaxHp,
    combatEnemyBarrier: state.combat.enemyBarrier,
    combatPlayerBarrier: state.combat.playerBarrier,
    combatEnemyInstanceKey: state.combat.enemyInstanceKey,
    combatPlayerStatuses: state.combat.playerStatuses,
    combatEnemyStatuses: state.combat.enemyStatuses,
    combatActive: state.combat.active,
    activeSpellLoadout: state.combat.activeSpellLoadout,
    allowFocusOverCap: state.debug.allowFocusOverCap,
  })))
  const { schools, equipment, artifactProgress, arcaneCore, combatActive, activeSpellLoadout, allowFocusOverCap } = selectedState
  const progress = useMemo(() => ({ spellRanks: selectedState.spellRanks, magicLevelCap: selectedState.magicLevelCap }), [selectedState.spellRanks, selectedState.magicLevelCap])
  const research = useMemo(() => {
    const slots = { 'research-1': null, 'research-2': null, 'research-3': null, 'research-4': null } as GameState['activities']['research']['slots']
    selectedState.researchReservations.split('|').filter(Boolean).forEach((entry) => {
      const [slotId, itemId, targetSchoolId, acolyteAssigned] = entry.split(':')
      if (!slotId || !itemId || !targetSchoolId || Number(acolyteAssigned) <= 0) return
      slots[slotId as ResearchSlotId] = { itemId: itemId as ItemId, targetSchoolId: targetSchoolId as SchoolId, requestedQuantity: 0, remainingQuantity: 0, progressMs: 0, acolyteAssigned: true, status: 'prepared' }
    })
    return { slots }
  }, [selectedState.researchReservations])
  const transmutation = useMemo(() => ({ jobs: Object.fromEntries(selectedState.transmutationReservations.split('|').filter(Boolean).map((entry) => {
    const [recipeId, acolyteAssigned] = entry.split(':')
    return [recipeId as TransmutationRecipeId, { acolyteAssigned: Number(acolyteAssigned) > 0, progressMs: 0 }]
  })) }) as GameState['activities']['transmutation'], [selectedState.transmutationReservations])
  const activities = useMemo(() => ({ channeling: { acolytesAssigned: selectedState.channelingAcolytes }, research, transmutation, autoCast: selectedState.autoCast }), [selectedState.channelingAcolytes, research, transmutation, selectedState.autoCast])
  const player = useMemo(() => ({ health: selectedState.playerHealth, maxHealth: selectedState.playerMaxHealth, mana: selectedState.playerMana, maxMana: selectedState.playerMaxMana, maxFocus: selectedState.playerMaxFocus }), [selectedState.playerHealth, selectedState.playerMaxHealth, selectedState.playerMana, selectedState.playerMaxMana, selectedState.playerMaxFocus])
  const combat = useMemo(() => ({ active: selectedState.combatActive, activeSpellLoadout: selectedState.activeSpellLoadout, enemyId: selectedState.combatEnemyId, enemyHp: selectedState.combatEnemyHp, enemyMaxHp: selectedState.combatEnemyMaxHp, enemyBarrier: selectedState.combatEnemyBarrier, playerBarrier: selectedState.combatPlayerBarrier, enemyInstanceKey: selectedState.combatEnemyInstanceKey, playerStatuses: selectedState.combatPlayerStatuses, enemyStatuses: selectedState.combatEnemyStatuses }), [selectedState.combatActive, selectedState.activeSpellLoadout, selectedState.combatEnemyId, selectedState.combatEnemyHp, selectedState.combatEnemyMaxHp, selectedState.combatEnemyBarrier, selectedState.combatPlayerBarrier, selectedState.combatEnemyInstanceKey, selectedState.combatPlayerStatuses, selectedState.combatEnemyStatuses])
  const addSpell = useGameStore((state) => state.addSpellToSelectedPreset)
  const addSpellAt = useGameStore((state) => state.addSpellToSelectedPresetAt)
  const swapSlots = useGameStore((state) => state.swapSelectedPresetSlots)
  const removeSpell = useGameStore((state) => state.removeSpellFromSelectedPreset)
  const navigationIntent = useNavigationIntent()
  const attention = useProfileAttention(getActiveProfileId())
  const [filters, setFilters] = useState<ScreenFilters>(() => ({ ...DEFAULT_FILTERS, school: navigationIntent.schoolId ?? DEFAULT_FILTERS.school }))
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(() => navigationIntent.schoolSpellId)
  const [rankPathOpen, setRankPathOpen] = useState(false)
  const [automationRequest, setAutomationRequest] = useState<SpellId | null>(null)
  const browserState = useMemo(() => ({ schools, progress: { spellRanks: selectedState.spellRanks }, equipment, artifactProgress, arcaneCore, activities, player, combat, debug: { allowFocusOverCap } }), [schools, selectedState.spellRanks, equipment, artifactProgress, arcaneCore, activities, player, combat, allowFocusOverCap])
  const selectedSchool = filters.school === 'all' ? 'fire' : filters.school
  const schoolEntries = useMemo(() => getSpellBrowserEntries({ progress: { spellRanks: selectedState.spellRanks } }, { ...filters, school: selectedSchool, showUnlockedOnly: false, type: 'All Types' }), [selectedState.spellRanks, filters, selectedSchool])
  const selectedEntry = schoolEntries.find((entry) => entry.id === selectedEntryId) ?? null
  const selectedPreset = useGameStore((state) => state.spellPresets.presets.find((preset) => preset.id === state.spellPresets.selectedPresetId) ?? null)
  const activeLoadout = combatActive && activeSpellLoadout ? activeSpellLoadout.slots : selectedPreset?.slots ?? []
  const equippedSpellIds = useMemo(() => new Set(activeLoadout.map((slot) => slot.spellId)), [activeLoadout])
  const unseenSpellIds = useMemo(() => new Set(attention.unseenSpells), [attention.unseenSpells])

  useEffect(() => {
    if (navigationIntent.schoolId && navigationIntent.schoolId !== filters.school) setFilters((current) => ({ ...current, school: navigationIntent.schoolId! }))
    if (navigationIntent.schoolSpellId) setSelectedEntryId(navigationIntent.schoolSpellId)
  }, [navigationIntent.schoolId, navigationIntent.schoolSpellId])

  useEffect(() => {
    if (selectedEntry && selectedEntry.school === selectedSchool) return
    setSelectedEntryId(schoolEntries[0]?.id ?? null)
  }, [selectedEntry, selectedSchool, schoolEntries])

  const selectSchool = (schoolId: SchoolId) => {
    dismissGameTooltips()
    setFilters((current) => ({ ...current, school: schoolId, search: '', category: 'All' }))
    setRankPathOpen(false)
    setNavigationIntent({ schoolId })
  }
  const selectSpell = (id: SpellId | string) => {
    dismissGameTooltips()
    clearAttention(getActiveProfileId(), 'spell', id)
    setSelectedEntryId(id)
    setRankPathOpen(false)
    setNavigationIntent({ schoolSpellId: id as SpellId, schoolId: selectedSchool })
  }
  const equipSpell = (spellId: SpellId) => {
    const result = addSpell(spellId)
    if (result.ok) setSelectedEntryId(spellId)
  }
  const selectLoadoutSpell = (spellId: SpellId) => {
    const spell = SPELLS[spellId]
    if (!spell) return
    dismissGameTooltips()
    clearAttention(getActiveProfileId(), 'spell', spellId)
    setFilters((current) => ({ ...current, school: spell.school, search: '', category: 'All' }))
    setSelectedEntryId(spellId)
    setRankPathOpen(false)
    setNavigationIntent({ schoolId: spell.school, schoolSpellId: spellId })
  }
  const commitSpellDrop = useCallback((payload: SpellDragPayload, target: SpellDropTarget) => {
    if (combatActive) return
    if (payload.source === 'loadout') {
      swapSlots(payload.fromIndex, target.index)
      return
    }
    addSpellAt(payload.spellId, Math.min(target.index, activeLoadout.length))
  }, [combatActive, activeLoadout.length, swapSlots, addSpellAt])

  return <div className="screen-content schools-screen">
    <MagicSchoolsHeader schools={schools} selectedSchool={selectedSchool} onSelect={selectSchool} />
    <SchoolProgressOverview state={{ schools, progress }} schoolId={selectedSchool} />
    <SpellLoadoutDndProvider onCommit={commitSpellDrop}><ScreenGrid screen="schools" panels={[
      { id: 'schools-library', content: <SpellLibrary state={browserState} school={selectedSchool} entries={schoolEntries} filters={filters} selectedEntryId={selectedEntryId} newSpells={unseenSpellIds} equippedSpellIds={equippedSpellIds} canEdit={!combatActive} onFiltersChange={setFilters} onSelect={selectSpell} onEquip={equipSpell} onRemove={removeSpell} onConfigureAutomation={(spellId) => { selectLoadoutSpell(spellId); setAutomationRequest(spellId) }} /> },
      { id: 'schools-inspector', content: <InspectorTransition identity={selectedEntry?.id} accent={selectedEntry ? SCHOOLS[selectedEntry.school].color : undefined} fill><SpellInspector entry={selectedEntry} state={browserState} rankPathOpen={rankPathOpen} equippedSlotIndex={selectedEntry?.kind === 'spell' ? activeLoadout.findIndex((slot) => slot.spellId === selectedEntry.spellId) : null} canEdit={!combatActive} onEquip={equipSpell} onRemove={removeSpell} onToggleRankPath={() => { dismissGameTooltips(); setRankPathOpen((open) => !open) }} /></InspectorTransition> },
      { id: 'schools-loadout', content: <CombatSpellLoadout onSelectSpell={selectLoadoutSpell} automationSpellId={automationRequest} onAutomationRequestHandled={() => setAutomationRequest(null)} /> },
    ]} /></SpellLoadoutDndProvider>
  </div>
}
