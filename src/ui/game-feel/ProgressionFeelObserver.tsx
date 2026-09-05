import { useEffect, useRef } from 'react'
import { SPELLS } from '../../game/content/spells/spells'
import { RECIPES, RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { isSpellUnlocked } from '../../game/systems/spells'
import { isRecipeUnlocked } from '../../game/systems/transmutation/transmutationSelectors'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { emitGameFeelEvent } from './gameFeelStore'
import { enqueueMilestone } from '../rewards/milestoneStore'
import { markAttention } from '../attention/attentionStore'
import { MONSTERS } from '../../game/content/monsters'
import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'

const SCHOOL_IDS = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>
const getSchoolLevels = (schools: GameState['schools']) => SCHOOL_IDS.reduce<Record<string, number>>((levels, schoolId) => { levels[schoolId] = schools[schoolId].level; return levels }, {})

export const getUnlockedRecipeIds = (progress: GameState['progress']) => RECIPE_ORDER.filter((recipeId) => isRecipeUnlocked({ progress }, RECIPES[recipeId]))
export const getUnlockedSpellIds = (progress: GameState['progress']) => Object.values(SPELLS).filter((spell) => isSpellUnlocked({ progress }, spell.id)).map((spell) => spell.id)
export const getNewIds = (previous: readonly string[], current: readonly string[]) => current.filter((id) => !previous.includes(id))

const getAnchorPoint = (recipeIds: readonly string[], spellIds: readonly string[]) => {
  const visibleAnchor = recipeIds.map((id) => document.querySelector(`[data-recipe-id="${id}"]`)).find(Boolean) ?? spellIds.map((id) => document.querySelector(`[data-spell-id="${id}"]`)).find(Boolean)
  const anchorRect = visibleAnchor?.getBoundingClientRect()
  if (anchorRect && anchorRect.width > 0 && anchorRect.height > 0) return { x: anchorRect.left + anchorRect.width / 2, y: anchorRect.top + anchorRect.height / 2 }
  const main = document.querySelector('.main-area')
  const rect = main?.getBoundingClientRect()
  if (rect && rect.width > 0) return { x: rect.left + rect.width * 0.54, y: rect.top + 112 }
  return { x: window.innerWidth * 0.58, y: 120 }
}

export function ProgressionFeelObserver({ profileKey }: { profileKey: string | null }) {
  const progress = useGameStore((state) => state.progress)
  const schools = useGameStore((state) => state.schools)
  const previousProfile = useRef(profileKey)
  const previous = useRef<{ recipes: string[]; spells: string[]; monsters: string[]; schools: Record<string, number> } | null>(null)

  useEffect(() => {
    if (!progress) return
    if (previousProfile.current !== profileKey) {
      previousProfile.current = profileKey
      previous.current = null
      return
    }
    const current = { recipes: getUnlockedRecipeIds(progress), spells: getUnlockedSpellIds(progress), monsters: [...progress.discoveredMonsters], schools: getSchoolLevels(schools) }
    if (!previous.current) {
      previous.current = current
      return
    }
    const newRecipes = getNewIds(previous.current.recipes, current.recipes)
    const newSpells = getNewIds(previous.current.spells, current.spells)
    const newMonsters = getNewIds(previous.current.monsters, current.monsters)
    const newSchools = SCHOOL_IDS.filter((schoolId) => current.schools[schoolId] > (previous.current?.schools[schoolId] ?? current.schools[schoolId]))
    previous.current = current
    newRecipes.forEach((recipeId) => { const recipe = RECIPES[recipeId as keyof typeof RECIPES]; const item = recipe && ITEMS[recipe.output.itemId as keyof typeof ITEMS]; if (!recipe || !item) return; enqueueMilestone({ kind: 'recipe', eyebrow: 'sourceDungeonId' in recipe ? 'ARTIFICING RECIPE UNLOCKED' : 'TRANSMUTATION RECIPE UNLOCKED', title: item.name, detail: 'sourceDungeonId' in recipe ? 'New blueprint available in Artificing' : 'New recipe available in Transmutation' }); markAttention(profileKey, 'recipe', recipeId) })
    newSpells.forEach((spellId) => { const spell = Object.values(SPELLS).find((candidate) => candidate.id === spellId); if (!spell) return; enqueueMilestone({ kind: 'spell', eyebrow: 'SPELL UNLOCKED', title: spell.name, detail: `${spell.school[0].toUpperCase()}${spell.school.slice(1)} School` }); markAttention(profileKey, 'spell', spellId) })
    newMonsters.forEach((monsterId) => { const monster = MONSTERS[monsterId as keyof typeof MONSTERS]; if (!monster) return; enqueueMilestone({ kind: 'monster', eyebrow: 'NEW BESTIARY ENTRY', title: monster.name, detail: 'Added to the Bestiary' }); markAttention(profileKey, 'monster', monsterId) })
    newSchools.forEach((schoolId) => { const school = SCHOOLS[schoolId]; enqueueMilestone({ kind: 'school', eyebrow: 'SCHOOL LEVEL UP', title: `${school.name} School · Level ${current.schools[schoolId]}`, detail: 'New research and spell thresholds may be available' }) })
    const totalNew = newRecipes.length + newSpells.length + newMonsters.length + newSchools.length
    if (!totalNew) return
    const point = getAnchorPoint(newRecipes, newSpells)
    emitGameFeelEvent({ type: 'unlock', ...point, intensity: Math.min(1.5, 1 + totalNew * 0.12) })
  }, [profileKey, progress])

  return null
}
