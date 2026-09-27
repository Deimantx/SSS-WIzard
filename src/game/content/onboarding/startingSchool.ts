import type { ArtifactId, SchoolId } from '../../types'

export interface StartingSchoolConfig {
  schoolId: SchoolId
  artifactId: ArtifactId
}

export const STARTING_SCHOOL_CONFIG: Record<SchoolId, StartingSchoolConfig> = {
  fire: { schoolId: 'fire', artifactId: 'ember-staff' },
  water: { schoolId: 'water', artifactId: 'tideglass-wand' },
  earth: { schoolId: 'earth', artifactId: 'stoneheart-scepter' },
  air: { schoolId: 'air', artifactId: 'windthread-wand' },
}
