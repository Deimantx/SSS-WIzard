import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BALANCE, SCHOOL_LEVEL_XP } from '../game/data/balance'
import { ITEMS, MONSTERS, RESEARCH_ITEMS, SCHOOLS, SPELLS } from '../game/data/content'
import { appendLog, canReserveFocus, completeResearchCycle, freeFocus, getSchoolLevel, grantSchoolXp, manaRegenPerSecond, playerBasicDamage, pushNotification, usedFocus } from '../game/engine'
import type { ElementId, GameState, ItemId, MonsterId, ScreenId, SchoolId, SpellId } from '../game/types'
import { clamp, uid } from '../game/utils'

const SAVE_KEY = 'sss-wizard-save-v1'

export interface GameActions {
  tick: (deltaMs: number) => void
  setScreen: (screen: ScreenId) => void
  channelMana: () => void
  toggleAutoChannel: () => void
  toggleCondense: (element?: ElementId) => void
  toggleResearch: (itemId: ItemId) => void
  toggleTransmutation: () => void
  castSpell: (spellId: SpellId) => void
  toggleAutoCast: (spellId: SpellId) => void
  enterDungeon: () => void
  leaveDungeon: () => void
  engageBoss: (bossId: 'grove-sentinel' | 'forest-heart') => void
  killCurrentEnemy: () => void
  saveGame: () => void
  resetSave: () => void
  setDebug: (enabled: boolean) => void
  toggleEditMode: () => void
  dismissNotification: (id: string) => void
  setPlayer: (changes: Partial<GameState['player']>) => void
  setSchoolDebug: (school: SchoolId, xp: number, level?: number) => void
  setThreat: (amount: number) => void
  addItem: (itemId: ItemId, quantity: number) => void
  unlockAllSpells: () => void
  preset: (name: 'fresh' | 'research' | 'combat' | 'boss' | 'main-boss') => void
  resumeFromHidden: (elapsedMs: number) => void
}

export type GameStore = GameState & GameActions

export const makeInitialState = (): GameState => ({
  saveVersion: 1,
  player: { health: BALANCE.player.maxHealth, maxHealth: BALANCE.player.maxHealth, mana: BALANCE.mana.startingMana, maxMana: BALANCE.mana.maxMana, maxFocus: BALANCE.focus.startingMax, godMode: false },
  schools: { fire: { xp: 0, level: 1 }, water: { xp: 0, level: 1 }, earth: { xp: 0, level: 1 }, air: { xp: 0, level: 1 } },
  inventory: { 'apprentice-wand': 1 },
  equipment: { weapon: 'apprentice-wand', focus: null },
  activities: { autoChannel: false, condense: { running: false, element: 'fire', progressMs: 0 }, research: { running: false, itemId: null, progressMs: 0 }, transmutation: { running: false, recipeId: null, progressMs: 0 }, autoCast: { 'fire-bolt': false, 'water-ward': false, 'earth-spike': false, 'air-lance': false } },
  combat: { active: false, dungeonId: null, enemyId: null, enemyHp: 0, enemyMaxHp: 0, enemyBarrier: 0, playerAttackTimerMs: 0, enemyAttackTimerMs: 0, encounterTimerMs: 0, spellCooldowns: { 'fire-bolt': 0, 'water-ward': 0, 'earth-spike': 0, 'air-lance': 0 }, playerStatuses: [], threatCleared: 0, inBossFight: false, log: [], lastDamageDealt: 0, lastDamageTaken: 0 },
  progress: { magicLevelCap: BALANCE.mainBoss.startingMagicLevelCap, unlockedSpells: [], discoveredMonsters: [], lifetimeKills: 0, firstBossKill: false, firstMainBossKill: false, guildUnlocked: false, emberStaffUnlocked: false, forestHeartUnlocked: false, autoHuntBossUnlocked: false, guildRank: 'outsider', requestProgress: {} },
  ui: { screen: 'home', showDebug: false, editMode: false, reducedMotion: false },
  offlineBankMs: 0,
  lastSavedAt: Date.now(),
  notifications: [],
  channelCooldownMs: 0,
})

const readSave = (): Partial<GameState> | null => {
  if (typeof localStorage === 'undefined') return null
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<GameState> | null
    if (!parsed || parsed.saveVersion !== 1) return null
    return parsed
  } catch { return null }
}

const hydrate = (): GameState => {
  const base = makeInitialState()
  const saved = readSave()
  if (!saved) return base
  return {
    ...base, ...saved,
    player: { ...base.player, ...(saved.player ?? {}) },
    schools: { ...base.schools, ...(saved.schools ?? {}) },
    inventory: { ...base.inventory, ...(saved.inventory ?? {}) },
    equipment: { ...base.equipment, ...(saved.equipment ?? {}) },
    activities: { ...base.activities, ...(saved.activities ?? {}), condense: { ...base.activities.condense, ...(saved.activities?.condense ?? {}) }, research: { ...base.activities.research, ...(saved.activities?.research ?? {}) }, transmutation: { ...base.activities.transmutation, ...(saved.activities?.transmutation ?? {}) }, autoCast: { ...base.activities.autoCast, ...(saved.activities?.autoCast ?? {}) } },
    combat: { ...base.combat, ...(saved.combat ?? {}), spellCooldowns: { ...base.combat.spellCooldowns, ...(saved.combat?.spellCooldowns ?? {}) } },
    progress: { ...base.progress, ...(saved.progress ?? {}) },
    ui: { ...base.ui, ...(saved.ui ?? {}) },
    notifications: [],
  }
}

const warn = (state: GameState, text: string) => pushNotification(state, text, 'warning')

const spawnEnemy = (state: GameState, enemyId: MonsterId, boss = false) => {
  const monster = MONSTERS[enemyId]
  state.combat.enemyId = enemyId
  state.combat.enemyHp = monster.maxHealth
  state.combat.enemyMaxHp = monster.maxHealth
  state.combat.enemyBarrier = monster.traits.some((trait) => trait.effect === 'barrier') ? Math.round(monster.maxHealth * 0.18) : 0
  state.combat.enemyAttackTimerMs = monster.attackIntervalMs
  state.combat.playerAttackTimerMs = 0
  state.combat.encounterTimerMs = 0
  state.combat.inBossFight = boss
  if (!state.progress.discoveredMonsters.includes(enemyId)) state.progress.discoveredMonsters.push(enemyId)
  appendLog(state, `${monster.name} enters the clearing.`)
}

const spawnNormal = (state: GameState) => {
  const pool: MonsterId[] = ['forest-wisp', 'thornling', 'stone-root']
  spawnEnemy(state, pool[state.progress.lifetimeKills % pool.length])
}

const killEnemy = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const drops = requireLoot(state, enemyId)
  state.combat.enemyId = null
  state.combat.enemyHp = 0
  state.combat.encounterTimerMs = BALANCE.dungeon.encounterDelayMs
  state.combat.lastDamageDealt = 0
  if (monster.boss) {
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    if (enemyId === 'grove-sentinel' && !state.progress.firstBossKill) {
      state.progress.firstBossKill = true
      state.progress.guildUnlocked = true
      state.progress.emberStaffUnlocked = true
      state.progress.forestHeartUnlocked = true
      state.progress.autoHuntBossUnlocked = true
      pushNotification(state, 'Grove Sentinel defeated · Guild unlocked', 'success')
      pushNotification(state, 'Ember Staff recipe and Forest Heart unlocked', 'success')
    } else if (enemyId === 'forest-heart' && !state.progress.firstMainBossKill) {
      state.progress.firstMainBossKill = true
      state.progress.magicLevelCap = BALANCE.mainBoss.firstBossMagicLevelCap
      pushNotification(state, 'Magic School cap increased to 20', 'success')
      pushNotification(state, 'FIRST CHAPTER COMPLETE · Heartseed acquired', 'success')
    }
    appendLog(state, `${monster.name} defeated. Threat Cleared resets.`)
  } else {
    state.progress.lifetimeKills += 1
    state.combat.threatCleared += 1
    state.progress.requestProgress['kill-monsters'] = state.progress.lifetimeKills
    appendLog(state, `${monster.name} defeated${drops ? ` · ${drops}` : ''}`)
    if (state.combat.threatCleared === BALANCE.dungeon.whisperingWoodsThreatRequired) pushNotification(state, 'Grove Sentinel is ready', 'success')
  }
}

const requireLoot = (state: GameState, enemyId: MonsterId) => {
  const monster = MONSTERS[enemyId]
  const drops: string[] = []
  monster.loot.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      const amount = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1))
      state.inventory[drop.itemId] = (state.inventory[drop.itemId] ?? 0) + amount
      drops.push(`${amount} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops.join(', ')
}

const finishSpellCast = (state: GameState, spellId: SpellId, quiet = false) => {
  const spell = SPELLS[spellId]
  if (state.player.mana < spell.manaCost || state.combat.enemyId === null) return false
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  if (spell.damage) {
    const damage = spell.damage + state.schools[spell.school].level * 2
    const absorbed = Math.min(state.combat.enemyBarrier, damage)
    state.combat.enemyBarrier -= absorbed
    const dealt = damage - absorbed
    state.combat.enemyHp = Math.max(0, state.combat.enemyHp - dealt)
    state.combat.lastDamageDealt = dealt
    appendLog(state, absorbed ? `${spell.name} hits for ${dealt} (${absorbed} absorbed).` : `${spell.name} hits for ${dealt}.`)
  }
  if (spell.barrier) {
    state.combat.playerStatuses = state.combat.playerStatuses.filter((effect) => effect.id !== 'barrier')
    state.combat.playerStatuses.push({ id: 'barrier', remainingMs: 9000, value: spell.barrier })
    appendLog(state, 'Water Ward forms a barrier.')
  }
  if (spellId === 'air-lance') state.combat.playerStatuses.push({ id: 'attack-delay', remainingMs: 2500, value: 1 })
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  ...hydrate(),
  tick: (deltaMs) => set((state) => {
    const delta = Math.min(1000, Math.max(0, deltaMs))
    state.channelCooldownMs = Math.max(0, state.channelCooldownMs - delta)
    state.player.mana = clamp(state.player.mana + manaRegenPerSecond(state) * delta / 1000, 0, state.player.maxMana)
    Object.keys(state.combat.spellCooldowns).forEach((key) => { state.combat.spellCooldowns[key as SpellId] = Math.max(0, state.combat.spellCooldowns[key as SpellId] - delta) })
    state.combat.playerStatuses = state.combat.playerStatuses.map((effect) => ({ ...effect, remainingMs: effect.remainingMs - delta })).filter((effect) => effect.remainingMs > 0)
    if (!state.combat.active) state.player.health = clamp(state.player.health + BALANCE.player.healthRegenPerSecond * delta / 1000 * BALANCE.player.outOfCombatRegenMultiplier, 0, state.player.maxHealth)

    const condense = state.activities.condense
    if (condense.running) {
      if (condense.progressMs >= BALANCE.condense.durationMs) {
        if (state.player.mana >= BALANCE.condense.manaCost) { state.player.mana -= BALANCE.condense.manaCost; condense.progressMs = 0 }
      } else {
        condense.progressMs += delta
        if (condense.progressMs >= BALANCE.condense.durationMs) { state.inventory[SCHOOLS[condense.element].fragment] = (state.inventory[SCHOOLS[condense.element].fragment] ?? 0) + 1; pushNotification(state, `${SCHOOLS[condense.element].name} Fragment condensed`, 'success') }
      }
    }

    const research = state.activities.research
    if (research.running && research.itemId) {
      const definition = RESEARCH_ITEMS.find((item) => item.itemId === research.itemId)
      const school = definition ? state.schools[definition.school] : null
      if (!definition || (school && school.level >= state.progress.magicLevelCap)) {
        research.progressMs = BALANCE.research.durationPerItemMs
      } else if (research.progressMs >= BALANCE.research.durationPerItemMs) {
        if (state.player.mana >= BALANCE.research.manaCostPerItem && (state.inventory[research.itemId] ?? 0) > 0) {
          state.player.mana -= BALANCE.research.manaCostPerItem
          research.progressMs = 0
        }
      } else {
        research.progressMs += delta
        if (research.progressMs >= BALANCE.research.durationPerItemMs) {
          const result = completeResearchCycle(state, research.itemId)
          if (result.completed && result.school) {
            const schoolName = SCHOOLS[result.school].name
            if (result.levels && result.levels.after > result.levels.before) pushNotification(state, `${schoolName} reached Level ${result.levels.after}`, 'success')
            if (result.levels && result.levels.after >= 2 && result.levels.before < 2) pushNotification(state, `${schoolName} spell unlocked`, 'success')
          }
        }
      }
      if ((state.inventory[research.itemId] ?? 0) <= 0 && research.progressMs >= BALANCE.research.durationPerItemMs) research.running = false
    }

    const transmutation = state.activities.transmutation
    if (transmutation.running) {
      if (transmutation.progressMs < BALANCE.transmutation.durationMs) transmutation.progressMs += delta
      if (transmutation.progressMs >= BALANCE.transmutation.durationMs) {
        const essence = state.inventory['wisp-essence'] ?? 0
        const fire = state.inventory['fire-fragment'] ?? 0
        if (essence >= 4 && fire >= 4) {
          state.inventory['wisp-essence'] = essence - 4
          state.inventory['fire-fragment'] = fire - 4
          state.inventory['ember-staff'] = (state.inventory['ember-staff'] ?? 0) + 1
          state.activities.transmutation.running = false
          state.activities.transmutation.progressMs = 0
          pushNotification(state, 'Ember Staff transmuted', 'success')
        } else state.activities.transmutation.running = false
      }
    }

    if (state.combat.active) {
      if (!state.combat.enemyId) {
        state.combat.encounterTimerMs -= delta
        if (state.combat.encounterTimerMs <= 0) spawnNormal(state)
      } else {
        const enemy = MONSTERS[state.combat.enemyId]
        state.combat.playerAttackTimerMs -= delta
        state.combat.enemyAttackTimerMs -= delta
        if (state.combat.playerAttackTimerMs <= 0) {
          const rawDamage = playerBasicDamage(state)
          const absorbed = Math.min(state.combat.enemyBarrier, rawDamage)
          state.combat.enemyBarrier -= absorbed
          const damage = rawDamage - absorbed
          state.combat.enemyHp = Math.max(0, state.combat.enemyHp - damage)
          state.combat.lastDamageDealt = damage
          if (absorbed) appendLog(state, `Living bark absorbs ${absorbed} damage.`)
          state.combat.playerAttackTimerMs = BALANCE.player.basicAttackIntervalMs
          if (state.combat.enemyHp <= 0) killEnemy(state)
        }
        if (state.combat.enemyId) {
          Object.entries(state.activities.autoCast).forEach(([id, enabled]) => {
            const spellId = id as SpellId
            if (enabled && state.progress.unlockedSpells.includes(spellId) && state.combat.spellCooldowns[spellId] <= 0) finishSpellCast(state, spellId, true)
          })
          if (state.combat.enemyAttackTimerMs <= 0 && state.combat.enemyId) {
            const delay = state.combat.playerStatuses.find((effect) => effect.id === 'attack-delay')
            state.combat.enemyAttackTimerMs = enemy.attackIntervalMs + (delay ? 1000 : 0)
            let damage = enemy.attackDamage
            const barrier = state.combat.playerStatuses.find((effect) => effect.id === 'barrier')
            if (barrier) { const absorbed = Math.min(barrier.value, damage); damage -= absorbed; barrier.value -= absorbed; if (barrier.value <= 0) state.combat.playerStatuses = state.combat.playerStatuses.filter((effect) => effect !== barrier) }
            if (damage > 0) {
              state.player.health = Math.max(0, state.player.health - damage)
              state.combat.lastDamageTaken = damage
              appendLog(state, `${enemy.name} hits for ${damage}.`)
              if (enemy.traits.some((trait) => trait.effect === 'thorn')) state.combat.playerStatuses.push({ id: 'thorn-wound', remainingMs: 6000, value: 2 })
            }
            if (state.player.health <= 0 && !state.player.godMode) {
              state.combat.active = false; state.combat.enemyId = null; state.combat.inBossFight = false; state.combat.threatCleared = 0; state.player.health = 0
              appendLog(state, 'The wizard falls. Threat Cleared resets to 0.')
              pushNotification(state, 'Defeated · recovering in the Tower', 'warning')
            }
          }
        }
      }
    }
    return state
  }),
  setScreen: (screen) => set((state) => { state.ui.screen = screen; return state }),
  channelMana: () => set((state) => { if (state.channelCooldownMs > 0 || state.player.mana >= state.player.maxMana) return state; state.player.mana = clamp(state.player.mana + BALANCE.mana.manualChannelAmount, 0, state.player.maxMana); state.channelCooldownMs = BALANCE.mana.manualChannelCooldownMs; pushNotification(state, '+15 Mana channeled', 'info'); return state }),
  toggleAutoChannel: () => set((state) => { if (state.activities.autoChannel) state.activities.autoChannel = false; else if (canReserveFocus(state, BALANCE.mana.autoChannelFocus)) state.activities.autoChannel = true; else warn(state, `Cannot start Auto Channeling · Requires ${BALANCE.mana.autoChannelFocus} Focus · Free Focus: ${freeFocus(state)}`); return state }),
  toggleCondense: (element = get().activities.condense.element) => set((state) => {
    if (state.activities.condense.running) { state.activities.condense.running = false; return state }
    state.activities.condense.element = element
    if (!canReserveFocus(state, BALANCE.condense.focusCost)) warn(state, `Cannot start Condensation · Requires ${BALANCE.condense.focusCost} Focus · Free Focus: ${freeFocus(state)}`)
    else if (state.player.mana < BALANCE.condense.manaCost) warn(state, 'Cannot start Condensation · Not enough Mana')
    else { state.player.mana -= BALANCE.condense.manaCost; state.activities.condense.running = true; state.activities.condense.progressMs = 0; pushNotification(state, `Condensing ${SCHOOLS[element].name} Fragment`, 'info') }
    return state
  }),
  toggleResearch: (itemId) => set((state) => {
    if (state.activities.research.running) { state.activities.research.running = false; return state }
    const item = RESEARCH_ITEMS.find((entry) => entry.itemId === itemId)
    if (!item || (state.inventory[itemId] ?? 0) < 1) warn(state, 'Cannot start Research · This item is protected or missing')
    else if (state.schools[item.school].level >= state.progress.magicLevelCap) warn(state, 'Level Cap Reached · Research pauses without consuming the fragment')
    else if (!canReserveFocus(state, BALANCE.research.focusCost)) warn(state, `Cannot start Research · Requires ${BALANCE.research.focusCost} Focus · Free Focus: ${freeFocus(state)}`)
    else if (state.player.mana < BALANCE.research.manaCostPerItem) warn(state, 'Cannot start Research · Not enough Mana')
    else { state.player.mana -= BALANCE.research.manaCostPerItem; state.activities.research = { running: true, itemId, progressMs: 0 }; pushNotification(state, `${item.label} research started`, 'info') }
    return state
  }),
  toggleTransmutation: () => set((state) => {
    if (state.activities.transmutation.running) { state.activities.transmutation.running = false; return state }
    if (!state.progress.emberStaffUnlocked) warn(state, 'Ember Staff is unlocked by defeating Grove Sentinel')
    else if (!canReserveFocus(state, BALANCE.transmutation.focusCost)) warn(state, `Cannot start Transmutation · Requires ${BALANCE.transmutation.focusCost} Focus · Free Focus: ${freeFocus(state)}`)
    else if ((state.inventory['wisp-essence'] ?? 0) < 4 || (state.inventory['fire-fragment'] ?? 0) < 4) warn(state, 'Missing: Wisp Essence 4 and Fire Fragment 4')
    else { state.activities.transmutation = { running: true, recipeId: 'ember-staff', progressMs: 0 }; pushNotification(state, 'Ember Staff transmutation started', 'info') }
    return state
  }),
  castSpell: (spellId) => set((state) => {
    if (!state.progress.unlockedSpells.includes(spellId)) return state
    if (!state.combat.active || !state.combat.enemyId) warn(state, 'Enter Whispering Woods before casting')
    else if (state.combat.spellCooldowns[spellId] > 0) warn(state, `${SPELLS[spellId].name} is cooling down`)
    else if (state.player.mana < SPELLS[spellId].manaCost) warn(state, 'Not enough Mana')
    else finishSpellCast(state, spellId)
    return state
  }),
  toggleAutoCast: (spellId) => set((state) => {
    if (!state.progress.unlockedSpells.includes(spellId)) return state
    if (state.activities.autoCast[spellId]) state.activities.autoCast[spellId] = false
    else if (canReserveFocus(state, 15)) { state.activities.autoCast[spellId] = true; pushNotification(state, `${SPELLS[spellId].name} Auto-Cast enabled`, 'success') }
    else warn(state, `Cannot enable Auto-Cast · Requires 15 Focus · Free Focus: ${freeFocus(state)}`)
    return state
  }),
  enterDungeon: () => set((state) => { if (state.combat.active) return state; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 0; state.player.health = Math.max(1, state.player.health); appendLog(state, 'Entered Whispering Woods. Basic Attack is automatic.'); spawnNormal(state); pushNotification(state, 'Whispering Woods entered', 'info'); return state }),
  leaveDungeon: () => set((state) => { if (!state.combat.active) return state; state.combat = { ...makeInitialState().combat, log: ['Left the dungeon. Threat Cleared resets.'] }; return state }),
  engageBoss: (bossId) => set((state) => {
    if (!state.combat.active) { warn(state, 'Enter Whispering Woods first'); return state }
    if (bossId === 'grove-sentinel' && state.combat.threatCleared < BALANCE.dungeon.whisperingWoodsThreatRequired) { warn(state, `Grove Sentinel requires ${BALANCE.dungeon.whisperingWoodsThreatRequired} Threat Cleared`); return state }
    if (bossId === 'forest-heart' && !state.progress.forestHeartUnlocked) { warn(state, 'Defeat Grove Sentinel to reveal Forest Heart'); return state }
    spawnEnemy(state, bossId, true); pushNotification(state, `${MONSTERS[bossId].name} engaged`, 'warning'); return state
  }),
  killCurrentEnemy: () => set((state) => { if (state.combat.enemyId) { state.combat.enemyHp = 0; killEnemy(state) } return state }),
  saveGame: () => set((state) => { const clean = { ...state, notifications: [], lastSavedAt: Date.now() }; if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(clean)); state.lastSavedAt = clean.lastSavedAt; pushNotification(state, 'Game saved', 'success'); return state }),
  resetSave: () => { const fresh = makeInitialState(); if (typeof localStorage !== 'undefined') localStorage.removeItem(SAVE_KEY); set(fresh) },
  setDebug: (enabled) => set((state) => { state.ui.showDebug = enabled; return state }),
  toggleEditMode: () => set((state) => { state.ui.editMode = !state.ui.editMode; return state }),
  dismissNotification: (id) => set((state) => { state.notifications = state.notifications.filter((note) => note.id !== id); return state }),
  setPlayer: (changes) => set((state) => { state.player = { ...state.player, ...changes }; state.player.health = clamp(state.player.health, 0, state.player.maxHealth); state.player.mana = clamp(state.player.mana, 0, state.player.maxMana); return state }),
  setSchoolDebug: (school, xp, level) => set((state) => { state.schools[school].xp = Math.max(0, xp); state.schools[school].level = level ?? getSchoolLevel(xp, state.progress.magicLevelCap); return state }),
  setThreat: (amount) => set((state) => { state.combat.threatCleared = Math.max(0, amount); return state }),
  addItem: (itemId, quantity) => set((state) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) + quantity); return state }),
  unlockAllSpells: () => set((state) => { state.progress.unlockedSpells = ['fire-bolt', 'water-ward', 'earth-spike', 'air-lance']; Object.keys(state.schools).forEach((school) => { state.schools[school as SchoolId].level = Math.max(2, state.schools[school as SchoolId].level); state.schools[school as SchoolId].xp = Math.max(SCHOOL_LEVEL_XP(2), state.schools[school as SchoolId].xp) }); return state }),
  preset: (name) => set((state) => {
    const base = makeInitialState()
    Object.assign(state, base)
    if (name === 'research') { state.inventory['fire-fragment'] = 8; state.player.mana = 100; state.activities.autoChannel = true }
    if (name === 'combat') { state.inventory['fire-fragment'] = 8; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 20, level: 2 }; state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnNormal(state) }
    if (name === 'boss') { state.inventory['fire-fragment'] = 12; state.inventory['wisp-essence'] = 8; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 80, level: 4 }; state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 20; spawnNormal(state) }
    if (name === 'main-boss') { state.inventory['fire-fragment'] = 16; state.inventory['wisp-essence'] = 10; state.progress.unlockedSpells = ['fire-bolt', 'water-ward']; state.schools.fire = { xp: 180, level: 10 }; state.progress.firstBossKill = true; state.progress.guildUnlocked = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnEnemy(state, 'forest-heart', true) }
    return state
  }),
  resumeFromHidden: (elapsedMs) => set((state) => { if (elapsedMs > 1000) { state.offlineBankMs += elapsedMs; pushNotification(state, `${Math.round(elapsedMs / 1000)}s added to Offline Bank`, 'info') } return state }),
})))

export const selectUsedFocus = (state: GameStore) => usedFocus(state)
export const selectFreeFocus = (state: GameStore) => freeFocus(state)
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
