import { SCHOOLS } from '../../game/content/schools/schools'
import { STARTING_SCHOOL_CONFIG } from '../../game/content/onboarding/startingSchool'
import { getSchoolTotalXpForLevel } from '../../game/core/balance/schoolXpCurve'
import { grantItem } from '../../game/systems/inventory/itemAcquisition'
import { equipItemAction } from './equipmentActions'
import { getDefaultSpellAutomationConfig, getNextSpellPresetId } from '../../game/systems/spells'
import { getSpellsForSchool, syncSpellUnlocksForSchool } from '../../game/systems/spells/spellProgression'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import { getTutorialCounterAffinity } from '../../game/content/elements/elements'
import { COMBAT_LOCATIONS } from '../../game/content/combat-locations'
import type { GameState, SchoolId, TutorialStage } from '../../game/types'

/** Commits the authored fresh-profile opening in one state mutation. */
export const chooseStartingSchoolAction = (state: GameState, schoolId: SchoolId) => {
  if (state.progress.startingSchoolId !== null || !SCHOOLS[schoolId]) return false

  ;(['fire', 'water', 'earth', 'air'] as const).forEach((id) => {
    state.schools[id].xp = id === schoolId ? getSchoolTotalXpForLevel(10) : 0
    state.schools[id].level = id === schoolId ? 10 : 1
    syncSpellUnlocksForSchool(state, id)
  })

  const starterConfig = STARTING_SCHOOL_CONFIG[schoolId]
  const artifactId = starterConfig.artifactId
  grantItem(state, artifactId, 1)
  const equipmentResult = equipItemAction(state, artifactId, 'weapon')
  if (!equipmentResult.ok) state.equipment.weapon = artifactId

  const starterSpells = STARTING_SCHOOL_CONFIG[schoolId].starterSpellIds.map((id) => getSpellsForSchool(schoolId).find((spell) => spell.id === id)).filter((spell): spell is NonNullable<typeof spell> => Boolean(spell && state.progress.spellRanks[spell.id] !== undefined))
  const presetId = getNextSpellPresetId(state.spellPresets.presets)
  const slots = starterSpells.map((spell) => ({ spellId: spell.id, autoCast: true, automation: getDefaultSpellAutomationConfig(spell.id, true, false) }))
  state.spellPresets.presets.push({ id: presetId, name: `${SCHOOLS[schoolId].name} Initiate`, slots })
  state.spellPresets.selectedPresetId = presetId

  state.progress.startingSchoolId = schoolId
  state.progress.tutorialStage = 'combat'
  state.player.mana = state.player.maxMana
  state.ui.screen = 'combat'
  const counterAffinity = getTutorialCounterAffinity(schoolId)
  const counterLocation = counterAffinity ? Object.values(COMBAT_LOCATIONS).find((location) => ['stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin'].includes(location.id) && location.primaryElement === counterAffinity && location.type === 'combat-zone') : undefined
  state.ui.lastEnteredCombatLocationId = counterLocation?.id ?? 'whispering-woods'
  reconcileChronicleProgress(state)
  return true
}

/** Tester-only onboarding controls. These mutate the same progress fields used by the live tutorial. */
export const resetTutorialAction = (state: GameState) => {
  state.progress.startingSchoolId = null
  state.progress.tutorialStage = 'choose-school'
  state.ui.screen = 'home'
}

export const setTutorialStageAction = (state: GameState, stage: TutorialStage) => {
  state.progress.tutorialStage = stage
  if (stage === 'choose-school') state.progress.startingSchoolId = null
}

export const chooseStartingSchoolDebugAction = (state: GameState, schoolId: SchoolId) => {
  state.progress.startingSchoolId = null
  state.progress.tutorialStage = 'choose-school'
  return chooseStartingSchoolAction(state, schoolId)
}

export const skipTutorialAction = (state: GameState) => {
  if (state.progress.startingSchoolId === null) chooseStartingSchoolAction(state, 'fire')
  state.progress.tutorialStage = 'complete'
  state.ui.screen = 'home'
}

export const grantStarterArtifactAction = (state: GameState, schoolId: SchoolId) => {
  grantItem(state, STARTING_SCHOOL_CONFIG[schoolId].artifactId, 1)
}
