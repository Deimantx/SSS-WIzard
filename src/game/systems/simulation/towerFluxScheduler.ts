import type { GameState } from '../../types'
import { stabilizeResourceValue } from '../../presentation/resources/resourcePresentation'

export type TowerFluxConsumerSystem = 'research' | 'transmutation'

export interface TowerFluxWorkRequest {
  key: string
  system: TowerFluxConsumerSystem
  sourceId: string
  requestedProgressMs: number
  fluxPerCycle: number
  cycleDurationMs: number
  requestedFlux: number
}

export interface TowerFluxAllocation {
  key: string
  fundedProgressMs: number
  fluxSpent: number
}

export interface TowerFluxFundingResult {
  requestedFlux: number
  spentFlux: number
  fundingRatio: number
  allocations: Record<string, TowerFluxAllocation>
}

export const TOWER_FLUX_EPSILON = 1e-9
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0

export const requestedFluxForProgress = (fluxPerCycle: number, requestedProgressMs: number, cycleDurationMs: number) => finite(fluxPerCycle) * finite(requestedProgressMs) / Math.max(1, finite(cycleDurationMs))

/** Shares the stored Tower Flux buffer proportionally across all active jobs. */
export const allocateTowerFlux = (state: Pick<GameState, 'tower'>, requests: readonly TowerFluxWorkRequest[]): TowerFluxFundingResult => {
  const normalized = requests.map((request) => ({ ...request, requestedProgressMs: finite(request.requestedProgressMs), fluxPerCycle: finite(request.fluxPerCycle), cycleDurationMs: Math.max(1, finite(request.cycleDurationMs)), requestedFlux: finite(request.requestedFlux) }))
  const requestedFlux = normalized.reduce((sum, request) => sum + request.requestedFlux, 0)
  const availableFlux = finite(state.tower.resources.arcaneFlux)
  const fundingRatio = requestedFlux <= TOWER_FLUX_EPSILON ? 1 : Math.min(1, Math.max(0, availableFlux / requestedFlux))
  const allocations: Record<string, TowerFluxAllocation> = {}
  let spentFlux = 0
  normalized.forEach((request) => {
    const fundedProgressMs = request.fluxPerCycle <= TOWER_FLUX_EPSILON ? request.requestedProgressMs : request.requestedProgressMs * fundingRatio
    const fluxSpent = request.fluxPerCycle <= TOWER_FLUX_EPSILON ? 0 : request.requestedFlux * fundingRatio
    allocations[request.key] = { key: request.key, fundedProgressMs, fluxSpent }
    spentFlux += fluxSpent
  })
  state.tower.resources.arcaneFlux = stabilizeResourceValue(Math.max(0, availableFlux - spentFlux))
  return { requestedFlux, spentFlux, fundingRatio, allocations }
}

export const estimateTowerFluxFundingRatio = (availableFlux: number, productionPerSecond: number, requestedFluxPerSecond: number, tickMs: number) => {
  const demand = finite(requestedFluxPerSecond) * Math.max(0, finite(tickMs)) / 1000
  if (demand <= TOWER_FLUX_EPSILON) return 1
  return Math.min(1, Math.max(0, (finite(availableFlux) + finite(productionPerSecond) * Math.max(0, finite(tickMs)) / 1000) / demand))
}
