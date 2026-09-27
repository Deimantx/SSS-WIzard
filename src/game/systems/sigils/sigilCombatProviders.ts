/** Public Sigil combat-provider boundary. Runtime execution lives beside it so
 * modifier and trigger systems can share the same authored provider view. */
export { getActiveSigilCombatProviders, processSigilSpecialCombatEvent } from './sigilCombatRuntime'
export type { ActiveSigilCombatProvider } from './sigilCombatRuntime'
