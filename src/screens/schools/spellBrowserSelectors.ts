import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { getSpellRank, SCHOOL_ORDER } from '../../game/systems/spells'
import type { CombatEffect } from '../../game/systems/combat/combatTypes'
import type { GameState, SchoolId, SpellId } from '../../game/types'
import { SPELL_CATALOG_PLACEHOLDERS, type SpellCatalogPlaceholder } from './spellCatalogPlaceholders'

export type SpellCatalogTag = 'Damage' | 'Healing' | 'Barrier' | 'Buff' | 'Control' | 'DoT'
export type SpellBrowserSchoolFilter = 'all' | SchoolId
export type SpellBrowserTypeFilter = 'All Types' | SpellCatalogTag
export type SpellBrowserSort = 'Unlock Level' | 'Name' | 'School'

export interface SpellBrowserFilters {
  school: SpellBrowserSchoolFilter
  search: string
  showUnlockedOnly: boolean
  type: SpellBrowserTypeFilter
  sort: SpellBrowserSort
}

export interface SpellBrowserSpellEntry {
  kind: 'spell'
  id: SpellId
  spellId: SpellId
  school: SchoolId
  unlockLevel: number
  unlocked: boolean
  rank: ReturnType<typeof getSpellRank>
  tags: SpellCatalogTag[]
}

export interface SpellBrowserPlaceholderEntry {
  kind: 'placeholder'
  id: string
  school: SchoolId
  unlockLevel: number
  unlocked: false
  rank: null
  tags: []
  placeholder: SpellCatalogPlaceholder
}

export type SpellBrowserEntry = SpellBrowserSpellEntry | SpellBrowserPlaceholderEntry

const TAG_ORDER: readonly SpellCatalogTag[] = ['Damage', 'Healing', 'Barrier', 'Buff', 'Control', 'DoT']

export const getSpellCatalogTags = (spell: typeof SPELLS[SpellId]): SpellCatalogTag[] => {
  const tags = new Set<SpellCatalogTag>()
  spell.effects.forEach((effect: CombatEffect) => {
    if (effect.type === 'deal-damage') tags.add('Damage')
    if (effect.type === 'heal') tags.add('Healing')
    if (effect.type === 'gain-barrier') tags.add('Barrier')
    if (effect.type === 'apply-status') {
      const status = STATUS_DEFINITIONS[effect.statusId]
      if (status?.classification === 'buff' || status?.tags.includes('buff')) tags.add('Buff')
      if (status?.tags.includes('control')) tags.add('Control')
      if (status?.tags.includes('dot') || status?.periodic) tags.add('DoT')
    }
    if ('tags' in effect && effect.tags?.includes('control')) tags.add('Control')
    if ('tags' in effect && effect.tags?.includes('dot')) tags.add('DoT')
    if ('tags' in effect && effect.tags?.includes('buff')) tags.add('Buff')
  })
  if (spell.type === 'dot') tags.add('DoT')
  if (spell.type === 'buff') tags.add('Buff')
  return TAG_ORDER.filter((tag) => tags.has(tag))
}

const spellSearchText = (spell: typeof SPELLS[SpellId], tags: readonly SpellCatalogTag[]) => {
  const statuses = spell.effects.flatMap((effect) => effect.type === 'apply-status' ? [STATUS_DEFINITIONS[effect.statusId]?.name ?? '', STATUS_DEFINITIONS[effect.statusId]?.description ?? ''] : [])
  return [spell.name, spell.description, ...tags, ...statuses].join(' ').toLocaleLowerCase()
}

const compareSchool = (left: SchoolId, right: SchoolId) => SCHOOL_ORDER.indexOf(left) - SCHOOL_ORDER.indexOf(right)

export const getSpellBrowserEntries = (state: Pick<GameState, 'progress'>, filters: SpellBrowserFilters): SpellBrowserEntry[] => {
  const query = filters.search.trim().toLocaleLowerCase()
  const realEntries: Array<SpellBrowserSpellEntry & { authoredIndex: number }> = Object.values(SPELLS).map((spell, authoredIndex) => {
    const rank = getSpellRank(state, spell.id)
    return { kind: 'spell' as const, id: spell.id, spellId: spell.id, school: spell.school, unlockLevel: spell.unlockLevel, unlocked: rank !== null, rank, tags: rank !== null ? getSpellCatalogTags(spell) : [], authoredIndex }
  }).filter((entry) => {
    if (filters.school !== 'all' && entry.school !== filters.school) return false
    if (filters.showUnlockedOnly && !entry.unlocked) return false
    if (filters.type !== 'All Types' && (!entry.unlocked || !entry.tags.includes(filters.type))) return false
    // Locked spell metadata is intentionally not part of this branch. This is
    // the boundary that prevents search and accessibility output from leaking it.
    if (query && (!entry.unlocked || !spellSearchText(SPELLS[entry.spellId], entry.tags).includes(query))) return false
    return true
  })
  const placeholders: Array<SpellBrowserPlaceholderEntry & { authoredIndex: number }> = SPELL_CATALOG_PLACEHOLDERS.map((placeholder, authoredIndex) => ({ kind: 'placeholder' as const, id: placeholder.id, school: placeholder.school, unlockLevel: placeholder.requiredLevel, unlocked: false as const, rank: null, tags: [] as [], placeholder, authoredIndex: Object.keys(SPELLS).length + authoredIndex })).filter((entry) => {
    if (filters.school !== 'all' && entry.school !== filters.school) return false
    if (filters.showUnlockedOnly || filters.type !== 'All Types' || query) return false
    return true
  })
  const entries = [...realEntries, ...placeholders]
  return entries.sort((left, right) => {
    if (filters.sort === 'Name') {
      const leftName = left.kind === 'spell' && left.unlocked ? SPELLS[left.spellId].name : '???'
      const rightName = right.kind === 'spell' && right.unlocked ? SPELLS[right.spellId].name : '???'
      return leftName.localeCompare(rightName) || compareSchool(left.school, right.school) || left.authoredIndex - right.authoredIndex
    }
    if (filters.sort === 'School') return compareSchool(left.school, right.school) || left.unlockLevel - right.unlockLevel || left.authoredIndex - right.authoredIndex
    return left.unlockLevel - right.unlockLevel || compareSchool(left.school, right.school) || left.authoredIndex - right.authoredIndex
  }).map(({ authoredIndex: _authoredIndex, ...entry }) => entry)
}
