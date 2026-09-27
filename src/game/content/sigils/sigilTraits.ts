import type { SigilSetId } from './sigilSets'

export type SigilTraitId = 'arcane-surge' | 'execution-mark' | 'critical-flow' | 'cinder-echo' | 'predatory-rhythm' | 'last-ward' | 'barrier-rebound' | 'second-skin' | 'mana-echo' | 'efficient-cycle' | 'restorative-echo' | 'overflowing-grace' | 'lingering-bind' | 'tactical-pause'

export interface SigilTraitDefinition {
  id: SigilTraitId
  name: string
  description: string
  allowedSets: readonly SigilSetId[]
  unique?: boolean
}

const traits = (id: SigilTraitId, name: string, description: string, allowedSets: readonly SigilSetId[], unique = false): SigilTraitDefinition => ({ id, name, description, allowedSets, ...(unique ? { unique: true } : {}) })

export const SIGIL_TRAITS: Record<SigilTraitId, SigilTraitDefinition> = {
  'arcane-surge': traits('arcane-surge', 'Arcane Surge', 'Every 6th committed player spell gains +15% outgoing effect.', ['arcane', 'conduit', 'sage', 'tempest']),
  'execution-mark': traits('execution-mark', 'Execution Mark', '+8% outgoing damage against enemies below 25% HP.', ['precision', 'predator', 'arcane']),
  'critical-flow': traits('critical-flow', 'Critical Flow', 'On player Critical Hit, reduce the longest active spell cooldown by 150ms. Internal cooldown: 1s.', ['precision', 'tempest', 'predator']),
  'cinder-echo': traits('cinder-echo', 'Cinder Echo', 'Burn ticks have an 8% chance to repeat at 50% effectiveness.', ['cinder'], true),
  'predatory-rhythm': traits('predatory-rhythm', 'Predatory Rhythm', 'Against a boss, each direct Critical Hit grants 1 stack for 5s, up to 3.', ['predator', 'precision']),
  'last-ward': traits('last-ward', 'Last Ward', 'Once per encounter, when HP falls below 30%, gain Barrier equal to 8% Max HP.', ['vital', 'ward'], true),
  'barrier-rebound': traits('barrier-rebound', 'Barrier Rebound', 'When player Barrier fully breaks, after 2s gain Barrier equal to 5% Max HP.', ['ward', 'vital'], true),
  'second-skin': traits('second-skin', 'Second Skin', 'The first incoming direct hit of an encounter deals 10% less damage.', ['vital', 'ward', 'dominion']),
  'mana-echo': traits('mana-echo', 'Mana Echo', 'Every 8th committed player spell refunds 4% Max Mana.', ['conduit', 'sage', 'arcane']),
  'efficient-cycle': traits('efficient-cycle', 'Efficient Cycle', 'Every 6th committed player spell costs 20% less Mana.', ['sage', 'conduit', 'tempest']),
  'restorative-echo': traits('restorative-echo', 'Restorative Echo', 'Direct healing has an 8% chance to repeat at 35% effectiveness.', ['restoration'], true),
  'overflowing-grace': traits('overflowing-grace', 'Overflowing Grace', '25% of direct overhealing becomes Barrier, capped at 8% Max HP per cast.', ['restoration', 'ward'], true),
  'lingering-bind': traits('lingering-bind', 'Lingering Bind', 'Player-applied non-boss control effects gain +12% duration.', ['dominion']),
  'tactical-pause': traits('tactical-pause', 'Tactical Pause', 'When the player successfully applies a control effect, reduce the longest active spell cooldown by 150ms.', ['dominion', 'tempest']),
}

export const SIGIL_TRAIT_IDS = Object.keys(SIGIL_TRAITS) as SigilTraitId[]
export const getEligibleSigilTraits = (setId: SigilSetId, excluded: readonly SigilTraitId[] = []) => SIGIL_TRAIT_IDS.filter((id) => SIGIL_TRAITS[id].allowedSets.includes(setId) && !excluded.includes(id))
