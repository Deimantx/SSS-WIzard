import type { ElementId } from '../../content/elements/elements'
import type { GameState } from '../../types'

export interface ElementalWardPresentation {
  element: ElementId
  name: string
  sourceId: string
  reduction: number
  reductionPercent: number
  remainingMs: number | null
  durationMs: number | null
  expiresAt: number | null
  active: boolean
}

const titleCase = (value: string) => `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`

export const getActiveElementalWardPresentations = (state: Pick<GameState, 'combat'>): ElementalWardPresentation[] => {
  const now = Math.max(0, state.combat.arcaneCoreRuntime.elapsedMs || 0)
  const strongestByElement = new Map<ElementId, (typeof state.combat.elementalDamageReductions)[number]>()
  for (const ward of state.combat.elementalDamageReductions ?? []) {
    if (ward.expiresAt !== undefined && ward.expiresAt <= now) continue
    const existing = strongestByElement.get(ward.element)
    const longer = (ward.expiresAt ?? Number.POSITIVE_INFINITY) > (existing?.expiresAt ?? Number.POSITIVE_INFINITY)
    const sameExpiry = (ward.expiresAt ?? null) === (existing?.expiresAt ?? null)
    if (!existing || ward.reduction > existing.reduction || (ward.reduction === existing.reduction && (longer || (sameExpiry && ward.sourceId.localeCompare(existing.sourceId) < 0)))) strongestByElement.set(ward.element, ward)
  }
  return [...strongestByElement.values()].map((ward) => ({
    element: ward.element,
    name: `${titleCase(ward.element)} Ward`,
    sourceId: ward.sourceId,
    reduction: ward.reduction,
    reductionPercent: Math.round(ward.reduction * 100),
    remainingMs: ward.expiresAt === undefined ? null : Math.max(0, ward.expiresAt - now),
    durationMs: ward.durationMs ?? (ward.sourceId === `${ward.element}-ward` ? 20_000 : null),
    expiresAt: ward.expiresAt ?? null,
    active: true,
  }))
}
