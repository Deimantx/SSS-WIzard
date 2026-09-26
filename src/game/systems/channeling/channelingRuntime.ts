import { BALANCE } from '../../core/balance/balance'
import { MANA_PILLARS } from '../../content/channeling/manaPillars'
import type { GameState, ManaPillarId } from '../../types'
import { clamp } from '../../utils'

export interface ArcaneFluxProductionBreakdown {
  assignedAcolytes: number
  basePerAcolyte: number
  leylineConduit: number
  acolyteAttunementMultiplier: number
  fluxResonanceMultiplier: number
  discoveryMultiplier: number
  total: number
}

export interface ArcaneFluxCapacityBreakdown {
  base: number
  arcaneReservoirBonus: number
  deepReservoirBonus: number
  developerCapacityBonus: number
  preAmplification: number
  astralExpansionMultiplier: number
  total: number
}

const level = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => Math.max(0, Math.min(10, state.progress.channeling.pillars[id]?.level ?? 0))
const channelingAcolytes = (state: Pick<GameState, 'activities'>) => Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0))

export const getArcaneFluxCapacityBreakdown = (state: Pick<GameState, 'progress' | 'tower'> & Partial<Pick<GameState, 'debug'>>): ArcaneFluxCapacityBreakdown => {
  const base = BALANCE.channeling.baseArcaneFluxCapacity
  const arcaneReservoirBonus = level(state, 'arcane-reservoir') * 100
  const deepReservoirBonus = state.progress.channeling.discoveries['deep-reservoir'] ? 250 : 0
  const developerCapacityBonus = Math.max(0, Math.floor(state.debug?.arcaneFluxCapacityOverride ?? 0))
  const preAmplification = base + arcaneReservoirBonus + deepReservoirBonus + developerCapacityBonus
  const astralExpansionMultiplier = 1 + level(state, 'astral-expansion') * 0.02
  return { base, arcaneReservoirBonus, deepReservoirBonus, developerCapacityBonus, preAmplification, astralExpansionMultiplier, total: Math.floor(preAmplification * astralExpansionMultiplier) }
}

export const getArcaneFluxProductionBreakdown = (state: Pick<GameState, 'activities' | 'progress'>): ArcaneFluxProductionBreakdown => {
  const assignedAcolytes = channelingAcolytes(state)
  const basePerAcolyte = BALANCE.channeling.baseFluxPerAcolytePerSecond
  const leylineConduit = level(state, 'leyline-conduit') * 0.25
  const acolyteAttunementMultiplier = 1 + level(state, 'echo-attunement') * 0.02
  const fluxResonanceMultiplier = 1 + level(state, 'mana-resonance') * 0.03
  const discoveryMultiplier = (state.progress.channeling.discoveries['stable-leyline'] ? 1.05 : 1) * (state.progress.channeling.discoveries['echo-resonance'] ? 1.1 : 1)
  const total = assignedAcolytes * (basePerAcolyte + leylineConduit) * acolyteAttunementMultiplier * fluxResonanceMultiplier * discoveryMultiplier
  return { assignedAcolytes, basePerAcolyte, leylineConduit, acolyteAttunementMultiplier, fluxResonanceMultiplier, discoveryMultiplier, total }
}

export const getArcaneFluxProductionPerSecond = getArcaneFluxProductionBreakdown

export const advanceArcaneFlux = (state: GameState, deltaMs: number, productionOverride?: number) => {
  const delta = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0)
  const before = Math.max(0, state.tower.resources.arcaneFlux)
  const generated = Math.max(0, productionOverride ?? getArcaneFluxProductionBreakdown(state).total) * delta / 1000
  const capacity = getArcaneFluxCapacityBreakdown(state).total
  state.tower.resources.arcaneFlux = clamp(before + generated, 0, capacity)
  const gained = state.tower.resources.arcaneFlux - before
  state.progress.channeling.totalFluxGenerated = Math.max(0, (state.progress.channeling.totalFluxGenerated ?? 0) + gained)
  if (!state.progress.channeling.discoveries['echo-resonance']) {
    state.progress.channeling.fiveEchoSustainMs = channelingAcolytes(state) >= 3 ? state.progress.channeling.fiveEchoSustainMs + deltaMs : 0
  }
  return { gained }
}

export const getChannelingPillarLevel = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => level(state, id)
export const getChannelingPillarDefinition = (id: ManaPillarId) => MANA_PILLARS[id]
