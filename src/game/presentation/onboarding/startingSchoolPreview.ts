import { ITEMS } from '../../content/items/items'
import { STARTING_SCHOOL_CONFIG } from '../../content/onboarding/startingSchool'
import { getSchoolTotalXpForLevel } from '../../core/balance/schoolXpCurve'
import { getArtifactEffectiveStats } from '../../systems/artifacts/artifactProgression'
import { getSpellsForSchool } from '../../systems/spells/spellProgression'
import type { GameState, SchoolId } from '../../types'
import { buildSpellDetailPresentation, getInspectorInlineEffectRows, type SpellDetailPresentation } from '../spells/spellDetailPresentation'

export interface StartingSchoolSpellPreview {
  id: string
  name: string
  description: string
  detail: SpellDetailPresentation
  effectRows: ReturnType<typeof getInspectorInlineEffectRows>
}

export interface StartingSchoolPreview {
  schoolId: SchoolId
  artifactId: keyof typeof ITEMS
  artifactName: string
  artifactStats: ReturnType<typeof getArtifactEffectiveStats>
  spells: StartingSchoolSpellPreview[]
}

/** Builds the same read model used by Spell Inspector for the post-choice profile without mutating live state. */
export function getStartingSchoolPreview(state: GameState, schoolId: SchoolId): StartingSchoolPreview {
  const config = STARTING_SCHOOL_CONFIG[schoolId]
  const starterSpells = getSpellsForSchool(schoolId).slice(0, 3)
  const previewState: GameState = {
    ...state,
    schools: {
      ...state.schools,
      [schoolId]: { ...state.schools[schoolId], level: 10, xp: getSchoolTotalXpForLevel(10) },
    },
    equipment: { ...state.equipment, weapon: config.artifactId },
    artifactProgress: { ...state.artifactProgress },
    progress: {
      ...state.progress,
      spellRanks: {
        ...state.progress.spellRanks,
        ...Object.fromEntries(starterSpells.map((spell) => [spell.id, 1])),
      },
    },
    combat: {
      ...state.combat,
      active: false,
      activeSpellLoadout: null,
      enemyId: null,
      playerStatuses: [],
      enemyStatuses: [],
    },
    player: { ...state.player, mana: state.player.maxMana },
  }

  return {
    schoolId,
    artifactId: config.artifactId,
    artifactName: ITEMS[config.artifactId].name,
    artifactStats: getArtifactEffectiveStats(previewState, config.artifactId),
    spells: starterSpells.map((spell) => {
      const detail = buildSpellDetailPresentation(previewState, spell.id, 1)
      return { id: spell.id, name: spell.name, description: spell.description, detail, effectRows: detail.effects.flatMap(getInspectorInlineEffectRows) }
    }),
  }
}
