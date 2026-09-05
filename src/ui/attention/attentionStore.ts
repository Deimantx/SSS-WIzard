import { isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import { useSyncExternalStore } from 'react'
import type { ItemId, MonsterId, RecipeId, SpellId } from '../../game/types'

export type AttentionKind = 'item' | 'monster' | 'spell' | 'recipe'
export interface ProfileAttentionState {
  unseenItems: ItemId[]
  unseenMonsters: MonsterId[]
  unseenSpells: SpellId[]
  unseenRecipes: RecipeId[]
}

const STORAGE_PREFIX = 'sss-wizard-profile-attention-v1:'
const emptyAttention = (): ProfileAttentionState => ({ unseenItems: [], unseenMonsters: [], unseenSpells: [], unseenRecipes: [] })
const EMPTY_ATTENTION = emptyAttention()
const cache = new Map<string, ProfileAttentionState>()
const listeners = new Set<() => void>()
const keyFor = (profileKey: string) => `${STORAGE_PREFIX}${profileKey}`
const fieldFor: Record<AttentionKind, keyof ProfileAttentionState> = { item: 'unseenItems', monster: 'unseenMonsters', spell: 'unseenSpells', recipe: 'unseenRecipes' }

const load = (profileKey: string) => {
  const cached = cache.get(profileKey)
  if (cached) return cached
  let value = emptyAttention()
  try {
    const raw = window.localStorage.getItem(keyFor(profileKey))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileAttentionState>
      value = { unseenItems: Array.isArray(parsed.unseenItems) ? parsed.unseenItems as ItemId[] : [], unseenMonsters: Array.isArray(parsed.unseenMonsters) ? parsed.unseenMonsters as MonsterId[] : [], unseenSpells: Array.isArray(parsed.unseenSpells) ? parsed.unseenSpells as SpellId[] : [], unseenRecipes: Array.isArray(parsed.unseenRecipes) ? parsed.unseenRecipes as RecipeId[] : [] }
    }
  } catch { /* Presentation attention is optional when storage is unavailable. */ }
  cache.set(profileKey, value)
  return value
}
const save = (profileKey: string, value: ProfileAttentionState) => {
  cache.set(profileKey, value)
  try { window.localStorage.setItem(keyFor(profileKey), JSON.stringify(value)) } catch { /* Storage can be unavailable in private contexts. */ }
  listeners.forEach((listener) => listener())
}

export const getProfileAttention = (profileKey: string | null) => profileKey ? load(profileKey) : EMPTY_ATTENTION
export const subscribeProfileAttention = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const useProfileAttention = (profileKey: string | null) => useSyncExternalStore(subscribeProfileAttention, () => getProfileAttention(profileKey), () => getProfileAttention(profileKey))

export const markAttention = (profileKey: string | null, kind: AttentionKind, id: string) => {
  if (!profileKey || !id) return
  const current = load(profileKey)
  const field = fieldFor[kind]
  if ((current[field] as readonly string[]).includes(id)) return
  save(profileKey, { ...current, [field]: [...current[field], id] } as ProfileAttentionState)
}
export const clearAttention = (profileKey: string | null, kind: AttentionKind, id: string) => {
  if (!profileKey) return
  const current = load(profileKey)
  const field = fieldFor[kind]
  if (!(current[field] as readonly string[]).includes(id)) return
  save(profileKey, { ...current, [field]: current[field].filter((entry) => entry !== id) } as ProfileAttentionState)
}
export const clearProfileAttention = (profileKey: string | null) => {
  if (!profileKey) return
  cache.delete(profileKey)
  try { window.localStorage.removeItem(keyFor(profileKey)) } catch { /* Storage can be unavailable in private contexts. */ }
  listeners.forEach((listener) => listener())
}
export const resetProfileAttention = clearProfileAttention
export const hasUnseenAttention = (attention: ProfileAttentionState, destination: 'inventory' | 'collection' | 'bestiary' | 'schools' | 'transmutation' | 'artificing') => destination === 'inventory' || destination === 'collection' ? attention.unseenItems.length > 0 : destination === 'bestiary' ? attention.unseenMonsters.length > 0 : destination === 'schools' ? attention.unseenSpells.length > 0 : attention.unseenRecipes.some(id => destination === 'transmutation' ? isTransmutationRecipeId(id) : !isTransmutationRecipeId(id))
