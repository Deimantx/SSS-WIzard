/** Maximum interval used by one internal simulation step. */
export const SIMULATION_QUANTUM_MS = 100

/** Foreground callers are protected from accidentally simulating a huge delta at once. */
export const MAX_SIMULATION_DELTA_MS = 1000
