import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { getNavigationIntent, setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { CombatWorldNavigation } from './CombatWorldNavigation'

const renderNavigation = (onEnterLocation = vi.fn(), onHuntTarget = vi.fn(() => true)) => render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={onEnterLocation} onHuntTarget={onHuntTarget} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

describe('CombatWorldNavigation', () => {
  beforeEach(() => { const state = createInitialState(); state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true; useGameStore.setState(state); setNavigationIntent({ combatDungeonId: null, combatMonsterId: null }) })

  it('locks fresh Whispering Woods entry until an elemental tutorial boss is defeated', () => {
    const state = createInitialState()
    useGameStore.setState(state)
    expect(useGameStore.getState().combat.active).toBe(false)
    useGameStore.getState().enterDungeon('whispering-woods')
    expect(useGameStore.getState().combat.active).toBe(false)
    const notifications = useGameStore.getState().notifications
    expect(notifications[notifications.length - 1]?.text).toContain('Defeat any elemental tutorial boss')
  })

  it('shows the type-based location filters with Combat Zones selected by default', () => {
    renderNavigation()

    expect(screen.getByText('WORLD NAVIGATION')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Combat Zones' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Elite Zones' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Hunting Grounds' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Dungeons' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: /All/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Whispering Woods, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Howling Den, ELITE ZONE/ })).toBeNull()
    expect(screen.getByText('WORLD TIER')).toBeTruthy()
    expect(screen.getByText('Browse locations by encounter type.')).toBeTruthy()
    expect(screen.queryByText('CONTINENT')).toBeNull()
    expect(screen.queryByText('REGION')).toBeNull()
    expect(screen.queryByText('CONTINENT I / FIRST FRONTIER / WHISPERING WOODS')).toBeNull()
    expect(screen.queryByText(/LOCATIONS IN REGION/)).toBeNull()
    const tierControl = screen.getByText('WORLD TIER').closest('.combat-world-tier-control')
    expect(tierControl?.classList.contains('is-embedded')).toBe(true)
    expect(tierControl?.querySelector('.card')).toBeNull()
    expect(tierControl?.querySelectorAll('.combat-world-tier-options > .game-tooltip-trigger')).toHaveLength(5)
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
  })

  it('keeps locked locations unavailable in their type category', () => {
    renderNavigation()

    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    expect(screen.getByRole('button', { name: /Howling Den, ELITE ZONE, LOCKED/ })).toBeTruthy()
  })

  it('filters locations by registry element and clears the filter on a second click', () => {
    renderNavigation()
    const fireFilter = screen.getByRole('button', { name: 'Fire' })
    fireEvent.click(fireFilter)
    expect(screen.getByRole('button', { name: /Emberfall Basin, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Galecrest Heights, COMBAT ZONE/ })).toBeNull()
    fireEvent.click(fireFilter)
    expect(screen.getByRole('button', { name: /Galecrest Heights, COMBAT ZONE/ })).toBeTruthy()
  })

  it('moves a mismatched selected location to the first unlocked match', () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'fire'
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)
    expect(screen.getByRole('button', { name: /Stonewake Hollow/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Fire' }))
    expect(screen.getByRole('button', { name: /Whispering Woods/ }).getAttribute('aria-pressed')).toBe('true')
    expect(onSelectLocation).toHaveBeenLastCalledWith('whispering-woods')
  })

  it('clears an incompatible element filter for direct navigation intent', async () => {
    const state = createInitialState()
    state.progress.startingSchoolId = 'earth'
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: 'Fire' }))
    expect(screen.getByRole('button', { name: 'Fire' }).getAttribute('aria-pressed')).toBe('true')
    setNavigationIntent({ combatDungeonId: 'hunters-ground', combatMonsterId: null })
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Gloamridge' })).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Fire' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('shows Elemental Scar locations with Arcane-primary roster enemies', () => {
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: 'Arcane' }))
    expect(screen.queryByText('NO MATCHING LOCATIONS')).toBeNull()
    expect(screen.getByRole('button', { name: /Flooded Reliquary/ })).toBeTruthy()
  })

  it('renders targeted Whispering Woods cards without legacy inspector metrics', () => {
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(vi.fn(), onHuntTarget)

    expect(screen.getByText('SELECT TARGET')).toBeTruthy()
    expect(screen.getByText('CHOOSE A MONSTER TO HUNT')).toBeTruthy()
    expect(screen.getAllByText(/POWER/)).toHaveLength(8)
    expect(screen.queryByText('RESONANCE / KILL')).toBeNull()
    for (const name of ['Forest Wisp', 'Thornling', 'Dewbound Sprite', 'Cinder Moth', 'Stone Root', 'Grove Sentinel', 'Tempest Stag']) expect(screen.getByText(name)).toBeTruthy()
    expect(screen.getByText('ZONE BOSS')).toBeTruthy()
    expect(screen.getByText('Forest Heart')).toBeTruthy()
    expect(screen.queryByText('NORMAL KILLS')).toBeNull()
    expect(screen.queryByText('BOSS CLEARS')).toBeNull()
    expect(screen.queryByText('LOCATION STATUS')).toBeNull()
    expect(screen.queryByText('Repeatable combat content. Encounter tiles are preview-only in Phase 3A.')).toBeNull()
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Cinder MothSTANDARD/ }))
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).not.toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: /HUNT TARGET/ }))
    expect(onHuntTarget).toHaveBeenCalledWith('whispering-woods', 'cinder-moth')
    expect(screen.queryByRole('button', { name: /START FARMING|SWITCH TARGET|RETURN TO COMBAT/ })).toBeNull()
  })

  it('keeps an unauthorized Gloamridge target inspectable while blocking entry with the contract reason', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.reputation = 10000
    state.progress.huntersOrder.activeContract = { id: 'ashen-only', targetSpec: { type: 'monster', monsterId: 'ashen-tracker' }, target: 5, progress: 0, tier: 'routine', reputationReward: 100, marksReward: 3 }
    state.combat.active = true
    state.combat.dungeonId = 'hunters-ground'
    useGameStore.setState(state)
    renderNavigation()

    const target = screen.getByRole('button', { name: /Gloamfang Stalker/ })
    fireEvent.click(target)
    expect(target).toBeTruthy()
    expect(screen.getByText('ACTIVE CONTRACT DOES NOT MATCH THIS TARGET')).toBeTruthy()
    expect(screen.getByRole('button', { name: /HUNT TARGET/ }).hasAttribute('disabled')).toBe(true)
  })

  it('requires a Hunt Contract before entering any Hunter quarry', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'hunters-ground'
    useGameStore.setState(state)
    renderNavigation()

    fireEvent.click(screen.getByRole('button', { name: /Ashen Tracker/ }))
    expect(screen.getByText('HUNT CONTRACT REQUIRED')).toBeTruthy()
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).toHaveProperty('disabled', true)
  })

  it('consumes the direct Hunter Contract intent and keeps the matching target selected', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.activeContract = { id: 'veilwing-route', targetSpec: { type: 'monster', monsterId: 'veilwing-harrier' }, target: 153, progress: 84, tier: 'routine', reputationReward: 306, marksReward: 3 }
    useGameStore.setState(state)
    setNavigationIntent({ combatDungeonId: 'hunters-ground', combatMonsterId: 'veilwing-harrier' })
    renderNavigation()

    expect(screen.getByRole('button', { name: /Veilwing Harrier/ }).getAttribute('aria-pressed')).toBe('true')
    expect(getNavigationIntent()).toMatchObject({ combatDungeonId: null, combatMonsterId: null })
    expect(useGameStore.getState().combat.enemyId).toBeNull()
  })

  it.each([
    ['monster', { type: 'monster', monsterId: 'ashen-tracker' }, ['Ashen Tracker']],
    ['family', { type: 'family', familyId: 'Gloamridge Predators' }, ['Ashen Tracker', 'Gloamfang Stalker']],
    ['alignment', { type: 'alignment', alignmentId: 'Wild' }, ['Ashen Tracker', 'Gloamfang Stalker']],
    ['region', { type: 'region', dungeonId: 'hunters-ground' }, ['Ashen Tracker', 'Gloamfang Stalker', 'Runehorn Brute']],
  ] as const)('enables the canonical eligible quarry list for a %s Contract', (_kind, targetSpec, eligibleNames) => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.activeContract = { id: 'integration-contract', targetSpec, target: 5, progress: 0, tier: 'routine', reputationReward: 100, marksReward: 3 }
    state.combat.active = true
    state.combat.dungeonId = 'hunters-ground'
    useGameStore.setState(state)
    renderNavigation()

    for (const name of ['Ashen Tracker', 'Gloamfang Stalker', 'Runehorn Brute']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
      const hunt = screen.getByRole('button', { name: /HUNT TARGET/ })
      expect(hunt).toHaveProperty('disabled', !eligibleNames.some((eligibleName) => eligibleName === name))
    }
  })

  it('keeps Gloamridge bossless even when legacy threat is high', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'hunters-ground'
    state.combat.threatCleared = Number.MAX_SAFE_INTEGER
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getAllByRole('button', { name: /Gloamridge, HUNTING GROUND/ }).length).toBeGreaterThan(0)
    expect(screen.getByText('NO ACTIVE HUNT CONTRACT')).toBeTruthy()
    expect(screen.queryByText('BOSS READY')).toBeNull()
    expect(screen.queryByText(/THREAT/i)).toBeNull()
    expect(screen.queryByText(/APEX/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /ENGAGE BOSS|AUTO HUNT/i })).toBeNull()
    expect(useGameStore.getState().combat.enemyId).toBeNull()
  })

  it('shows active Contract progress and marks only matching Gloamridge quarry', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.activeContract = { id: 'exact-hunt', targetSpec: { type: 'monster', monsterId: 'ashen-tracker' }, target: 153, progress: 84, tier: 'routine', reputationReward: 306, marksReward: 3 }
    state.combat.active = true
    state.combat.dungeonId = 'hunters-ground'
    state.combat.targetEnemyId = 'ashen-tracker'
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getByText(/ACTIVE HUNTER CONTRACT/)).toBeTruthy()
    expect(screen.getAllByText('Ashen Tracker').length).toBeGreaterThan(0)
    expect(screen.getByText('84 / 153 defeated')).toBeTruthy()
    expect(screen.getByText('+306 Reputation · +3 Marks')).toBeTruthy()
    expect(screen.getByText('CONTRACT TARGET')).toBeTruthy()
    expect(screen.getAllByText('NOT AUTHORIZED').length).toBeGreaterThan(0)
    expect(useGameStore.getState().combat.enemyId).toBeNull()
  })
  it('distinguishes the selected target from the target currently being hunted', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'cinder-moth'
    state.combat.enemyId = 'cinder-moth'
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getByText('HUNTING')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Stone RootSTANDARD/ }))
    expect(screen.getByText('HUNTING')).toBeTruthy()
    expect(screen.getByText('SELECTED')).toBeTruthy()
  })

  it('preserves the selected target when a hunt attempt is blocked', () => {
    const onHuntTarget = vi.fn(() => false)
    renderNavigation(vi.fn(), onHuntTarget)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    fireEvent.click(screen.getByRole('button', { name: 'HUNT TARGET' }))

    expect(onHuntTarget).toHaveBeenCalledWith('whispering-woods', 'forest-wisp')
    expect(screen.getByRole('button', { name: /Forest WispEASY/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'LOOT' })).not.toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'BESTIARY' })).not.toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'HUNT TARGET' })).not.toHaveProperty('disabled', true)
  })

  it('lets the player browse another location while the active run remains unchanged', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(onSelectLocation).toHaveBeenCalledWith('howling-den')
    expect(useGameStore.getState().combat.active).toBe(true)
    expect(useGameStore.getState().combat.dungeonId).toBe('whispering-woods')
    expect(screen.getByRole('heading', { name: 'Howling Den' })).toBeTruthy()
  })

  it('starts a selected Howling Den target through the Inspector action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    const onEnterLocation = vi.fn()
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(onEnterLocation, onHuntTarget)
    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bonehide BoarHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'HUNT TARGET' }))

    expect(onHuntTarget).toHaveBeenCalledWith('howling-den', 'bonehide-boar')
    expect(onEnterLocation).not.toHaveBeenCalled()
    expect(useGameStore.getState().combat.active).toBe(false)
  })

  it('shows one location-level Zone Affix instead of per-target affix labels', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(screen.getByText('ZONE AFFIX')).toBeTruthy()
    expect(screen.getByText('Frenzied')).toBeTruthy()
    expect(screen.queryByText('VICIOUS')).toBeNull()
    expect(screen.queryByText('WARDED')).toBeNull()
    expect(screen.queryByText('ARMORED')).toBeNull()
    expect(screen.queryByText('RELENTLESS')).toBeNull()
    expect(screen.queryByText('REGENERATIVE')).toBeNull()
  })

  it('deep-links the selected Black Sigil target to its exact Bestiary dossier', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    useGameStore.setState(state)
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Hall of Unbound Names, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Nameless CantorHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'hall-of-unbound-names' }), 'nameless-cantor')
  })

  it('renders the Black Gate as a five-step Dungeon run without target or Threat controls', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    useGameStore.setState(state)
    renderNavigation()

    fireEvent.click(screen.getByRole('tab', { name: 'Dungeons' }))
    fireEvent.click(screen.getByRole('button', { name: /The Black Gate, DUNGEON/ }))

    expect(screen.getByText('DUNGEON RUN')).toBeTruthy()
    expect(screen.getByText('5 FIXED STEPS')).toBeTruthy()
    expect(screen.getByText('World Tier 5')).toBeTruthy()
    expect(screen.queryByText('SELECT TARGET')).toBeNull()
    expect(screen.queryByText('ZONE AFFIX')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
    expect(screen.queryByText(/THREAT/)).toBeNull()
  })

  it('keeps Zone Boss threat and Auto Hunt controls in the location inspector', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))

    expect(screen.getByText('ELITE BOSS')).toBeTruthy()
    expect(screen.getByText('Corrupted Greatbear')).toBeTruthy()
    expect(screen.getByText('THREAT 0 / 10.0K')).toBeTruthy()
    expect(screen.getByText('10.0K THREAT TO BOSS')).toBeTruthy()
    expect(screen.queryByText(/MORE KILLS TO BOSS/)).toBeNull()
    const autoHunt = screen.getByRole('button', { name: 'AUTO HUNT OFF' })
    expect(autoHunt).toBeTruthy()

    fireEvent.click(autoHunt)
    expect(useGameStore.getState().progress.autoHuntBossByDungeon['howling-den']).toBe(true)
  })

  it('shows Zone Affix context in Howling Den target loot', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Elite Zones' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, ELITE ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bonehide BoarHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getAllByText(/ZONE AFFIX/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/FRENZIED/)).toBeTruthy()
    expect(screen.queryByText(/MINOR AFFIX/)).toBeNull()
  })

  it('disables targeted Loot without a target and opens the selected target reward view', () => {
    renderNavigation()

    const loot = screen.getByRole('button', { name: 'LOOT' })
    expect(loot).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Cinder MothSTANDARD/ }))
    const enabledLoot = screen.getByRole('button', { name: 'LOOT' })
    expect(enabledLoot).not.toHaveProperty('disabled', true)
    fireEvent.click(enabledLoot)

    expect(screen.getByText('CINDER MOTH — LOOT')).toBeTruthy()
    expect(screen.getByText('ITEM DROPS')).toBeTruthy()
    expect(screen.getByText('RESONANCE')).toBeTruthy()
    expect(screen.getByText('+4')).toBeTruthy()
    expect(screen.queryByText('Shared loot pool from normal encounters.')).toBeNull()
  })

  it('disables targeted Bestiary until a target is selected', () => {
    renderNavigation()

    const bestiary = screen.getByRole('button', { name: 'BESTIARY' })
    expect(bestiary).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    expect(screen.getByRole('button', { name: 'BESTIARY' })).not.toHaveProperty('disabled', true)
  })

  it('deep-links Bestiary to the selected targeted monster', () => {
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /ThornlingEASY/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'whispering-woods' }), 'thornling')
  })

  it('keeps location-level Loot for non-targeted locations', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Dungeons' }))
    fireEvent.click(screen.getByRole('button', { name: /Abandoned Catacombs, DUNGEON/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getByText('LOCATION LOOT')).toBeTruthy()
    expect(screen.getByText('MONSTER LOOT')).toBeTruthy()
  })

  it('exposes the canonical manual Boss Engage action in the active Zone Boss section', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.threatCleared = 5000
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test Loadout', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
    useGameStore.setState(state)
    renderNavigation()

    expect(screen.getByRole('button', { name: 'ENGAGE BOSS' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'ENGAGE BOSS' }))

    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
  })
})
