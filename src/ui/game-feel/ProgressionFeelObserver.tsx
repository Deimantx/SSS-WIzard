import { useEffect, useRef } from 'react'
import { SPELLS } from '../../game/content/spells/spells'
import { RECIPES, RECIPE_ORDER } from '../../game/content/recipes/recipes'
import { isSpellUnlocked } from '../../game/systems/spells'
import { isRecipeUnlocked } from '../../game/systems/transmutation/transmutationSelectors'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { emitGameFeelEvent } from './gameFeelStore'

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
  const previousProfile = useRef(profileKey)
  const previous = useRef<{ recipes: string[]; spells: string[] } | null>(null)

  useEffect(() => {
    if (!progress) return
    if (previousProfile.current !== profileKey) {
      previousProfile.current = profileKey
      previous.current = null
      return
    }
    const current = { recipes: getUnlockedRecipeIds(progress), spells: getUnlockedSpellIds(progress) }
    if (!previous.current) {
      previous.current = current
      return
    }
    const newRecipes = getNewIds(previous.current.recipes, current.recipes)
    const newSpells = getNewIds(previous.current.spells, current.spells)
    previous.current = current
    const totalNew = newRecipes.length + newSpells.length
    if (!totalNew) return
    const point = getAnchorPoint(newRecipes, newSpells)
    emitGameFeelEvent({ type: 'unlock', ...point, intensity: Math.min(1.5, 1 + totalNew * 0.12) })
  }, [profileKey, progress])

  return null
}
