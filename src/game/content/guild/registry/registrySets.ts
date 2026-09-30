import type { ItemId } from '../../../types'
import type { GuildStandingId } from '../guildStandings'

export interface ArcaneRegistrySetDefinition {
  id: string
  name: string
  description: string
  entryIds: readonly ItemId[]
  minimumStandingId: GuildStandingId
  reputationReward: number
  advancementPointsReward: number
}

const set = (id: string, name: string, description: string, entryIds: ItemId[], minimumStandingId: GuildStandingId, reputationReward = 100): ArcaneRegistrySetDefinition => ({ id, name, description, entryIds, minimumStandingId, reputationReward, advancementPointsReward: 2 })

export const ARCANE_REGISTRY_SETS: readonly ArcaneRegistrySetDefinition[] = [
  set('ember-fundamentals', 'Ember Fundamentals', 'Materials and tools that establish a Fire practice.', ['fire-fragment', 'ember-staff'], 'initiate-2', 35),
  set('fourfold-resonance', 'Fourfold Resonance', 'A record of each elemental resonance fragment.', ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'], 'initiate-2', 75),
  set('artificer-primer', 'Artificer’s Primer', 'A first record of magical equipment and its making.', ['artifact-essence', 'ember-staff'], 'initiate-2', 50),
  set('prismatic-foundation', 'Prismatic Foundation', 'Record the rare material and catalyst behind advanced synthesis.', ['prismatic-fragment', 'artifact-essence'], 'initiate-2', 90),
  set('frontier-field-notes', 'Frontier Field Notes', 'Pair field-collected essence with elemental resonance records.', ['life-essence', 'earth-fragment', 'air-fragment'], 'initiate-2', 65),
  set('tidal-fundamentals', 'Tidal Fundamentals', 'Water resonance and the first instrument shaped for it.', ['water-fragment', 'tideglass-wand'], 'apprentice-4'),
  set('earthen-fundamentals', 'Earthen Fundamentals', 'Earth resonance and its stone-bound focus.', ['earth-fragment', 'stoneheart-scepter'], 'apprentice-4'),
  set('aeric-fundamentals', 'Aeric Fundamentals', 'Air resonance and the light implements that channel it.', ['air-fragment', 'windthread-wand'], 'apprentice-4'),
  set('frontier-armaments', 'Frontier Armaments', 'A field catalogue of weapons made for the frontier.', ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand'], 'adept-5'),
  set('defensive-wards', 'Defensive Wards', 'Protective garments recovered and crafted for tower expeditions.', ['wispweave-robe', 'wispveil-hood', 'convergence-robe'], 'adept-5'),
  set('howling-den-records', 'Howling Den Records', 'Life essence and common elemental materials used in field records.', ['life-essence', 'fire-fragment', 'air-fragment'], 'adept-5'),
  set('catacomb-records', 'Catacomb Records', 'Research catalysts and rare finds catalogued from dangerous sites.', ['artifact-essence', 'prismatic-fragment', 'black-portal-shard'], 'adept-5'),
  set('research-catalysts', 'Research Catalysts', 'Materials used to support focused study.', ['artifact-essence', 'life-essence', 'prismatic-fragment'], 'magister-2'),
  set('transmutation-primer', 'Transmutation Primer', 'The four elemental inputs and a refined synthesis catalyst.', ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment'], 'magister-2'),
  set('crystal-studies', 'Crystal Studies', 'Crystal stock and its supporting essence.', ['tier-1-crystal-cache', 'artifact-essence', 'life-essence'], 'magister-2'),
  set('sigil-studies', 'Sigil Studies', 'A survey of arcane foci and the materials used to record them.', ['prismatic-fragment', 'black-portal-shard', 'waystone-circlet'], 'magister-2'),
  set('guardian-studies', 'Guardian Studies', 'Field essences and relic implements from guardian expeditions.', ['life-essence', 'reliquary-scepter', 'rootheart-scepter'], 'magister-2'),
  set('advanced-artificing', 'Advanced Artificing', 'Rare materials and later-generation equipment.', ['prismatic-fragment', 'artifact-essence', 'galeshard-staff', 'pyrebound-staff'], 'circle-master-1'),
  set('first-frontier-compendium', 'First Frontier Compendium', 'A cross-section of materials and equipment found across the first frontier.', ['life-essence', 'black-portal-shard', 'convergence-robe', 'waystone-circlet'], 'circle-master-4'),
  set('arcane-guild-master-catalog', 'Arcane Guild Master Catalog', 'A broad final index of elemental, refined, field, and crafted records.', ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment', 'artifact-essence', 'life-essence', 'black-portal-shard'], 'circle-master-5'),
]
