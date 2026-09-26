import { SCHOOLS } from '../../game/content/schools/schools'
import { STARTING_SCHOOL_CONFIG } from '../../game/content/onboarding/startingSchool'
import { getSchoolTotalXpForLevel } from '../../game/core/balance/schoolXpCurve'
import { grantItem } from '../../game/systems/inventory/itemAcquisition'
import { equipItemAction } from './equipmentActions'
import { getDefaultSpellAutomationConfig, getNextSpellPresetId, syncAutoCastRuntimeForLoadout } from '../../game/systems/spells'
import { getSpellsForSchool, syncSpellUnlocksForSchool } from '../../game/systems/spells/spellProgression'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
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

  const starterSpells = getSpellsForSchool(schoolId).filter((spell) => state.progress.spellRanks[spell.id] !== undefined).slice(0, 3)
  const presetId = getNextSpellPresetId(state.spellPresets.presets)
  const slots = starterSpells.map((spell) => ({ spellId: spell.id, autoCast: true, automation: getDefaultSpellAutomationConfig(spell.id, true, false) }))
  state.spellPresets.presets.push({ id: presetId, name: `${SCHOOLS[schoolId].name} Initiate`, slots })
  state.spellPresets.selectedPresetId = presetId
  syncAutoCastRuntimeForLoadout(state, slots)

  state.progress.startingSchoolId = schoolId
  state.progress.tutorialStage = 'combat'
  state.player.mana = state.player.maxMana
  state.ui.screen = 'combat'
  state.ui.lastEnteredCombatDungeonId = 'whispering-woods'
  state.combat.targetEnemyId = starterConfig.firstTargetMonsterId
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
