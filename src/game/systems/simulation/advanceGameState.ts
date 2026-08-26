import { BALANCE } from '../../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../../content/channeling/channelingDiscoveries'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { RECIPES } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
import { SPELLS } from '../../content/spells/spells'
import { advanceChanneling } from '../../engine/channelingEngine'
import { appendLog, completeResearchCycle, playerBasicDamage, pushNotification, recalculateDerivedStats, spellDamageMultiplier } from '../../engine'
import { addStatus, applyBarrier, damageEnemy, damagePlayer, executeEnemyAction, executeSpecial, finishEnemy, spawnNextEnemy } from '../combat/combatRuntime'
import type { GameState, ItemId, SpellEffect, SpellId, StatusEffect } from '../../types'
import { clamp } from '../../utils'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'

export interface AdvanceContext {
  mode: 'live' | 'banked'
  suppressRoutineNotifications?: boolean
  report?: SimulationReportCollector
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
}

const shouldNotifyRoutine = (context: AdvanceContext) => context.mode === 'live' && !context.suppressRoutineNotifications
const spellUnlocked = (state: GameState, spellId: SpellId) => state.progress.unlockedSpells.includes(spellId)
const isEquipped = (state: GameState, itemId: keyof typeof state.inventory) => Object.values(state.equipment).includes(itemId)
const isProtected = (state: GameState, itemId: keyof typeof state.inventory) => Boolean(state.protectedItems[itemId]) || isEquipped(state, itemId)

const applySpellEffect = (state: GameState, spellId: SpellId, effect: SpellEffect) => {
  const spell = SPELLS[spellId]
  if (effect.type === 'damage') damageEnemy(state, (effect.amount + state.schools[spell.school].level * 2) * spellDamageMultiplier(state, spell.school), 'spell')
  if (effect.type === 'heal') state.player.health = Math.min(state.player.maxHealth, state.player.health + effect.amount)
  if (effect.type === 'barrier') applyBarrier(state, effect.amount)
  if (effect.type === 'dot') {
    damageEnemy(state, 10 * spellDamageMultiplier(state, spell.school), 'spell')
    addStatus(state.combat.enemyStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.damagePerTick, tickIntervalMs: effect.tickMs, nextTickMs: effect.tickMs })
  }
  if (effect.type === 'buff') addStatus(state.combat.playerStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.value })
}

const meetsAutoCondition = (state: GameState, spellId: SpellId) => {
  const condition = SPELLS[spellId].autoCondition
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'health-below') return state.player.health / Math.max(1, state.player.maxHealth) * 100 < condition.percent
  const barrier = state.combat.playerStatuses.find((status) => status.id === 'barrier')?.value ?? 0
  return barrier < condition.value
}

const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false) => {
  const spell = SPELLS[spellId]
  if (!spell || state.player.mana < spell.manaCost || state.combat.spellCooldowns[spellId] > 0) return false
  if ((spell.type === 'damage' || spell.type === 'dot') && !state.combat.enemyId) return false
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  applySpellEffect(state, spellId, spell.effect)
  appendLog(state, `${spell.name} cast${spell.type === 'damage' || spell.type === 'dot' ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

const tickStatuses = (state: GameState, delta: number) => {
  const playerStatuses: StatusEffect[] = []
  state.combat.playerStatuses.forEach((status) => {
    const next = { ...status, remainingMs: status.remainingMs - delta, nextTickMs: status.nextTickMs === undefined ? undefined : status.nextTickMs - delta }
    while (next.nextTickMs !== undefined && next.nextTickMs <= 0 && next.remainingMs > 0) {
      if (next.id === 'thorn-wound') damagePlayer(state, next.value)
      next.nextTickMs += next.tickIntervalMs ?? 1000
    }
    if (next.remainingMs > 0) playerStatuses.push(next)
  })
  state.combat.playerStatuses = playerStatuses
  const enemyStatuses: StatusEffect[] = []
  state.combat.enemyStatuses.forEach((status) => {
    const next = { ...status, remainingMs: status.remainingMs - delta, nextTickMs: status.nextTickMs === undefined ? undefined : status.nextTickMs - delta }
    while (next.nextTickMs !== undefined && next.nextTickMs <= 0 && next.remainingMs > 0 && state.combat.enemyId) {
      if (next.id === 'burning') damageEnemy(state, next.value, 'status')
      next.nextTickMs += next.tickIntervalMs ?? 1000
    }
    if (next.remainingMs > 0) enemyStatuses.push(next)
  })
  state.combat.enemyStatuses = enemyStatuses
}

const tickResearch = (state: GameState, delta: number, context: AdvanceContext) => {
  const job = state.activities.research
  if (!job.running) return
  if (!job.itemId || !job.targetSchoolId || job.remainingQuantity <= 0) { job.running = false; if (job.status !== 'paused') job.status = 'idle'; return }
  if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { job.running = false; job.status = 'level-cap'; context.report?.recordResearchStoppedAtCap(); return }
  if (isProtected(state, job.itemId)) { job.running = false; job.status = 'missing-item'; return }
  if (job.progressMs < job.durationPerItemMs) { job.progressMs += delta; job.status = 'running'; return }
  if (state.player.mana < job.manaPerItem) { job.running = true; job.status = 'waiting-mana'; return }
  state.player.mana -= job.manaPerItem
  const completed = completeResearchCycle(state, job.itemId, job.targetSchoolId)
  if (!completed.completed) { job.running = false; job.status = completed.reason === 'cap' ? 'level-cap' : 'missing-item'; if (completed.reason === 'cap') context.report?.recordResearchStoppedAtCap(); return }
  context.report?.recordResearch(job.itemId, job.targetSchoolId, completed.xp ?? 0)
  job.remainingQuantity -= 1
  job.progressMs = 0
  job.status = job.remainingQuantity > 0 ? 'running' : 'completed'
  if (completed.levels && completed.levels.after > completed.levels.before) pushNotification(state, `${SCHOOLS[job.targetSchoolId].name} reached Level ${completed.levels.after}`, 'success')
  if (completed.spellId) pushNotification(state, `${SPELLS[completed.spellId].name} unlocked`, 'success')
  if (job.remainingQuantity <= 0) job.running = false
}

const tickCombat = (state: GameState, delta: number, context: AdvanceContext) => {
  if (!state.combat.active) return
  if (!state.combat.enemyId) { state.combat.encounterTimerMs -= delta; if (state.combat.encounterTimerMs <= 0) spawnNextEnemy(state); return }
  tickStatuses(state, delta)
  const enemy = MONSTERS[state.combat.enemyId]
  const quickening = state.combat.playerStatuses.find((status) => status.id === 'quickening')
  state.combat.playerAttackTimerMs -= delta
  Object.keys(state.combat.spellCooldowns).forEach((id) => { state.combat.spellCooldowns[id as SpellId] = Math.max(0, state.combat.spellCooldowns[id as SpellId] - delta) })
  if (state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
    const damage = damageEnemy(state, playerBasicDamage(state), 'basic')
    appendLog(state, `Basic Attack hits for ${damage}.`)
    const interval = BALANCE.player.basicAttackIntervalMs * (quickening ? 0.75 : 1)
    const delay = state.combat.playerStatuses.find((status) => status.id === 'attack-delay')?.value ?? 0
    state.combat.playerAttackTimerMs = interval + delay
  }
  if (state.combat.enemyId) Object.keys(state.activities.autoCast).forEach((id) => { const spellId = id as SpellId; if (state.activities.autoCast[spellId] && spellUnlocked(state, spellId) && state.combat.spellCooldowns[spellId] <= 0 && meetsAutoCondition(state, spellId)) castSpellInternal(state, spellId, true) })
  if (!state.combat.enemyId) return
  if (state.combat.enemyHp <= 0) { finishEnemy(state, context.report, context.onItemAcquired); return }
  if (enemy.id === 'grove-sentinel' && state.combat.enemyHp <= enemy.maxHealth * 0.4 && !state.combat.enemySpecialUsed['ancient-growth']) { state.combat.enemySpecialUsed['ancient-growth'] = true; state.combat.enemyBarrier += 80; appendLog(state, 'Ancient Growth triggers · +80 Barrier.') }
  if (enemy.id === 'forest-heart' && state.combat.enemyHp <= enemy.maxHealth * 0.5 && !state.combat.enemySpecialUsed['living-core']) { state.combat.enemySpecialUsed['living-core'] = true; state.combat.enemyIntervalMs = Math.round(state.combat.enemyIntervalMs * 0.85); appendLog(state, 'Living Core triggers · attack speed increased.') }
  if (state.combat.enemyTelegraphMs > 0) { state.combat.enemyTelegraphMs -= delta; if (state.combat.enemyTelegraphMs <= 0 && state.combat.enemyTelegraphActionId) { executeSpecial(state, state.combat.enemyTelegraphActionId); state.combat.enemyTelegraphActionId = null; state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs } }
  else { state.combat.enemyActionTimerMs -= delta; if (state.combat.enemyActionTimerMs <= 0) executeEnemyAction(state) }
  if (state.player.health <= 0 && !state.player.godMode) { context.report?.recordPlayerDeath(); state.combat.active = false; state.combat.enemyId = null; state.combat.threatCleared = 0; state.combat.inBossFight = false; pushNotification(state, 'Defeated · recovering in the Tower', 'warning'); appendLog(state, 'The wizard falls. Threat Cleared resets to 0.') }
}

export const advanceGameState = (state: GameState, deltaMs: number, context: AdvanceContext = { mode: 'live' }) => {
  const delta = Math.min(1000, Math.max(0, deltaMs))
  const channelingTick = advanceChanneling(state, delta)
  if (channelingTick.discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
  channelingTick.discoveries.forEach((id) => {
    context.report?.recordDiscovery(id)
    const discovery = CHANNELING_DISCOVERIES.find((entry) => entry.id === id)
    if (discovery) pushNotification(state, `Arcane Discovery: ${discovery.name}`, 'success')
  })
  if (!state.combat.active) state.player.health = clamp(state.player.health + BALANCE.player.healthRegenPerSecond * delta / 1000 * BALANCE.player.outOfCombatRegenMultiplier, 0, state.player.maxHealth)
  const condense = state.activities.condense
  if (condense.running) {
    if (condense.progressMs < BALANCE.condense.durationMs) {
      condense.progressMs = Math.min(BALANCE.condense.durationMs, condense.progressMs + delta)
    }
    if (condense.progressMs >= BALANCE.condense.durationMs && state.player.mana >= BALANCE.condense.manaCost) {
      state.player.mana -= BALANCE.condense.manaCost
      const output = SCHOOLS[condense.element].fragment
      state.inventory[output] = (state.inventory[output] ?? 0) + 1
      context.onItemAcquired?.(output, 1)
      context.report?.recordCondensed(output, 1)
      condense.progressMs = 0
      if (shouldNotifyRoutine(context)) pushNotification(state, `${SCHOOLS[condense.element].name} Fragment condensed`, 'success')
    }
  }
  tickResearch(state, delta, context)
  const transmutation = state.activities.transmutation
  if (transmutation.running && transmutation.recipeId) {
    const recipe = RECIPES[transmutation.recipeId]
    if (!recipe) transmutation.running = false
    else if (transmutation.progressMs < recipe.durationMs) transmutation.progressMs += delta
    else {
      const canCraft = recipe.ingredients.every((ingredient) => (state.inventory[ingredient.itemId] ?? 0) >= ingredient.quantity && !isProtected(state, ingredient.itemId))
      if (canCraft) {
        recipe.ingredients.forEach((ingredient) => { state.inventory[ingredient.itemId] = (state.inventory[ingredient.itemId] ?? 0) - ingredient.quantity })
        state.inventory[recipe.output] = (state.inventory[recipe.output] ?? 0) + 1
        context.onItemAcquired?.(recipe.output, 1)
        context.report?.recordCraft(recipe.id, recipe.output, 1, recipe.ingredients)
        transmutation.running = false
        transmutation.progressMs = 0
        if (shouldNotifyRoutine(context)) pushNotification(state, `${recipe.name} transmuted`, 'success')
      } else {
        transmutation.running = false
        if (shouldNotifyRoutine(context)) pushNotification(state, 'Transmutation stopped · missing or protected ingredients', 'warning')
      }
    }
  }
  tickCombat(state, delta, context)
  return state
}
