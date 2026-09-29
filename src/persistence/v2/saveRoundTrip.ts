import type { GameState } from '../../game/types'
import { loadPersistedGameStateV1 } from './saveLoader'
import { serializeGameStateV1 } from './saveSerializer'
import { parsePersistedGameStateV1 } from './saveSchema'

const canonical = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]))
    : value

export const persistedGameStatesEqual = (left: unknown, right: unknown) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))

const collectChanges = (before: unknown, after: unknown, path = '', changes: Array<{ path: string; before: unknown; after: unknown; classification: 'AUTHORITATIVE_CHANGE' }> = []) => {
  if (changes.length >= 50 || persistedGameStatesEqual(before, after)) return changes
  if (Array.isArray(before) && Array.isArray(after)) {
    for (let index = 0; index < Math.max(before.length, after.length) && changes.length < 50; index += 1) collectChanges(before[index], after[index], path ? `${path}.${index}` : String(index), changes)
    return changes
  }
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of keys) collectChanges((before as Record<string, unknown>)[key], (after as Record<string, unknown>)[key], path ? `${path}.${key}` : key, changes)
  } else changes.push({ path: path || '$', before, after, classification: 'AUTHORITATIVE_CHANGE' })
  return changes
}

export const validateV2RoundTrip = (encoded: string, expected?: GameState) => {
  try {
    const parsed = parsePersistedGameStateV1(encoded)
    const loaded = loadPersistedGameStateV1(parsed)
    const serialized = serializeGameStateV1(loaded, parsed.savedAt)
    const expectedDocument = expected ? serializeGameStateV1(expected, parsed.savedAt) : parsed
    const ok = persistedGameStatesEqual(expectedDocument, serialized)
    const changes = ok ? [] : collectChanges(expectedDocument, serialized)
    return { ok, state: ok ? loaded : null, error: ok ? null : 'Authoritative gameplay state changed during V2 round-trip.', report: { classification: ok ? 'MATCH' as const : 'AUTHORITATIVE_CHANGE' as const, changes, summary: ok ? 'V2 save round-trip preserves authoritative gameplay state.' : 'V2 save round-trip changed authoritative gameplay state.' } }
  } catch (error) {
    return { ok: false, state: null, error: error instanceof Error ? error.message : 'Save data could not be validated.', report: { classification: 'STRUCTURAL_INVALID' as const, changes: [], summary: 'Save data does not match the V2 schema.' } }
  }
}
