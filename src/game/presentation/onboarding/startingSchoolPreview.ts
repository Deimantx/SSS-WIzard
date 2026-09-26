import { ITEMS } from '../../content/items/items'
import { STARTING_SCHOOL_CONFIG } from '../../content/onboarding/startingSchool'
import { getSpellsForSchool } from '../../systems/spells/spellProgression'
import type { ArtifactId, SchoolId, SpellId } from '../../types'

export interface StartingSchoolSpellPreview {
  id: SpellId
  name: string
  school: SchoolId
}

export interface StartingSchoolPreview {
  schoolId: SchoolId
  artifactId: ArtifactId
  artifactName: string
  spells: StartingSchoolSpellPreview[]
}

/** Builds the compact, non-mutating choice read model from authored starter content. */
export function getStartingSchoolPreview(schoolId: SchoolId): StartingSchoolPreview {
  const config = STARTING_SCHOOL_CONFIG[schoolId]
  const starterSpells = getSpellsForSchool(schoolId).slice(0, 3)
  return {
    schoolId,
    artifactId: config.artifactId,
    artifactName: ITEMS[config.artifactId].name,
    spells: starterSpells.map((spell) => ({ id: spell.id, name: spell.name, school: spell.school })),
  }
}
