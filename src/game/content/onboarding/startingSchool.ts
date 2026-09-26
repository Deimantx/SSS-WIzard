import type { ArtifactId, MonsterId, SchoolId } from '../../types'

export interface StartingSchoolConfig {
  schoolId: SchoolId
  artifactId: ArtifactId
  firstTargetMonsterId: MonsterId
}

export const STARTING_SCHOOL_CONFIG: Record<SchoolId, StartingSchoolConfig> = {
  fire: { schoolId: 'fire', artifactId: 'ember-staff', firstTargetMonsterId: 'cinder-moth' },
  water: { schoolId: 'water', artifactId: 'tideglass-wand', firstTargetMonsterId: 'dewbound-sprite' },
  earth: { schoolId: 'earth', artifactId: 'stoneheart-scepter', firstTargetMonsterId: 'thornling' },
  air: { schoolId: 'air', artifactId: 'windthread-wand', firstTargetMonsterId: 'forest-wisp' },
}
