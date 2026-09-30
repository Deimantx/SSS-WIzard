export type ElementId = 'fire' | 'water' | 'air' | 'earth' | 'arcane'

export type ElementMatchup = 'strong' | 'neutral' | 'resisted'

export interface ElementDefinition {
  id: ElementId
  name: string
  uiLabel: string
  icon: string
  damageMultipliers: Partial<Record<ElementId, number>>
}

const element = (id: ElementId, name: string, icon: string, damageMultipliers: ElementDefinition['damageMultipliers'] = {}): ElementDefinition => ({ id, name, uiLabel: name, icon, damageMultipliers })

/** Authored elemental matchups. Unlisted pairs are neutral, allowing new elements to opt in incrementally. */
export const ELEMENT_DEFINITIONS: Record<ElementId, ElementDefinition> = {
  fire: element('fire', 'Fire', 'flame', { earth: 1.5, water: 0.5 }),
  water: element('water', 'Water', 'water', { fire: 1.5, air: 0.5 }),
  air: element('air', 'Air', 'wind', { water: 1.5, earth: 0.5 }),
  earth: element('earth', 'Earth', 'mountain', { air: 1.5, fire: 0.5 }),
  arcane: element('arcane', 'Arcane', 'sparkles'),
}

export const ELEMENT_IDS = Object.keys(ELEMENT_DEFINITIONS) as ElementId[]

export const isElementId = (value: unknown): value is ElementId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(ELEMENT_DEFINITIONS, value)

export const getElementMultiplier = (attackingElement: ElementId, defendingAffinity: ElementId | null | undefined): number => {
  if (!defendingAffinity) return 1
  const multiplier = ELEMENT_DEFINITIONS[attackingElement]?.damageMultipliers[defendingAffinity] ?? 1
  return Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 1
}

export const getElementMatchup = (attackingElement: ElementId, defendingAffinity: ElementId | null | undefined): ElementMatchup => {
  const multiplier = getElementMultiplier(attackingElement, defendingAffinity)
  return multiplier > 1 ? 'strong' : multiplier < 1 ? 'resisted' : 'neutral'
}

export const getElementCounter = (affinity: ElementId): ElementId | null =>
  ELEMENT_IDS.find((elementId) => getElementMultiplier(elementId, affinity) > 1) ?? null

export const getElementResistance = (affinity: ElementId): ElementId | null =>
  ELEMENT_IDS.find((elementId) => getElementMultiplier(elementId, affinity) < 1) ?? null

/** Affinities a starter element can advantage, used by the first-zone onboarding map. */
export const getAdvantagedAffinities = (attackingElement: ElementId): ElementId[] =>
  ELEMENT_IDS.filter((defendingAffinity) => getElementMultiplier(attackingElement, defendingAffinity) > 1)

export const getTutorialCounterAffinity = (starterElement: ElementId): ElementId | null =>
  getAdvantagedAffinities(starterElement)[0] ?? null
