import type { ArtifactId, SchoolId, SpellId } from '../../types'

export interface StartingSchoolConfig {
  schoolId: SchoolId
  artifactId: ArtifactId
  starterSpellIds: readonly SpellId[]
}

export const STARTING_SCHOOL_CONFIG: Record<SchoolId, StartingSchoolConfig> = {
  fire: { schoolId: 'fire', artifactId: 'ember-staff', starterSpellIds: ['fire-bolt', 'searing-touch', 'flame-burst'] },
  water: { schoolId: 'water', artifactId: 'tideglass-wand', starterSpellIds: ['water-bolt', 'mending-waters', 'frost-touch'] },
  earth: { schoolId: 'earth', artifactId: 'stoneheart-scepter', starterSpellIds: ['stone-shard', 'stone-skin', 'earthen-barrier'] },
  air: { schoolId: 'air', artifactId: 'windthread-wand', starterSpellIds: ['wind-blade', 'lightning-spark', 'gust'] },
}
