import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { getNavigationIntent, setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { resolveEnemyResonanceReward } from '../../../game/systems/resonance/resonanceRuntime'
import { CombatWorldNavigation } from './CombatWorldNavigation'

const renderNavigation = (onEnterLocation = vi.fn(), onHuntTarget = vi.fn(() => true), tier?: 1 | 2 | 3 | 4 | 5) => {
  const rendered = render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={onEnterLocation} onHuntTarget={onHuntTarget} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)
  if (tier && tier !== 1) fireEvent.click(screen.getByRole('tab', { name: `T${tier}` }))
  return rendered
}

describe('CombatWorldNavigation', () => {
  beforeEach(() => { const state = createInitialState(); state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true; state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1; useGameStore.setState(state); setNavigationIntent({ combatLocationId: null, combatMonsterId: null }) })

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
    renderNavigation(undefined, undefined, 1)

    expect(screen.getByText('WORLD NAVIGATION')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Combat Zones' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Hunting Grounds' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Primary Dungeons' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Special Locations' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: /All/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Stonewake Hollow, COMBAT ZONE/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Howling Den, SPECIAL LOCATION/ })).toBeNull()
    expect(screen.queryByText(/WORLD TIER/i)).toBeNull()
    expect(screen.getByText('Browse the five combat tiers by progression role.')).toBeTruthy()
    expect(screen.queryByText('CONTINENT')).toBeNull()
    expect(screen.queryByText('REGION')).toBeNull()
    expect(screen.queryByText('CONTINENT I / FIRST FRONTIER / WHISPERING WOODS')).toBeNull()
    expect(screen.queryByText(/LOCATIONS IN REGION/)).toBeNull()
    expect(screen.queryByText('CAMPAIGN')).toBeNull()
  })

  it('keeps locked locations unavailable in their type category', () => {
    renderNavigation()

    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    expect(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION, LOCKED/ })).toBeTruthy()
  })

  it('filters locations by registry element and clears the filter on a second click', () => {
    renderNavigation(undefined, undefined, 1)
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
    expect(screen.getByRole('button', { name: /Emberfall Basin/ }).getAttribute('aria-pressed')).toBe('true')
    expect(onSelectLocation).toHaveBeenLastCalledWith('emberfall-basin')
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
    setNavigationIntent({ combatLocationId: 'hunters-ground', combatMonsterId: null })
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Gloamridge' })).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Fire' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps Arcane enemies reachable in special content without replacing elemental lanes', () => {
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('tab', { name: 'T5' }))
    fireEvent.click(screen.getByRole('button', { name: 'Arcane' }))
    expect(screen.queryByText('NO MATCHING LOCATIONS')).toBeNull()
    expect(screen.getByRole('button', { name: /Nullstone Archive/ })).toBeTruthy()
  })

  it('renders targeted Whispering Woods cards without legacy inspector metrics', () => {
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(vi.fn(), onHuntTarget, 2)

    expect(screen.getByText('SELECT TARGET')).toBeTruthy()
    expect(screen.getByText('CHOOSE A MONSTER TO HUNT')).toBeTruthy()
    expect(screen.getAllByText(/POWER/).length).toBeGreaterThan(0)
    expect(screen.queryByText('RESONANCE / KILL')).toBeNull()
    for (const name of ['Forest Wisp', 'Thornling', 'Dewbound Sprite', 'Thorn Maw', 'Stone Root', 'Grove Sentinel', 'Rootbound Stalker']) expect(screen.getByText(name)).toBeTruthy()
    expect(screen.getByText('ZONE BOSS')).toBeTruthy()
    expect(screen.getByText('Forest Heart')).toBeTruthy()
    expect(screen.queryByText('NORMAL KILLS')).toBeNull()
    expect(screen.queryByText('BOSS CLEARS')).toBeNull()
    expect(screen.queryByText('LOCATION STATUS')).toBeNull()
    expect(screen.queryByText('Repeatable combat content. Encounter tiles are preview-only in Phase 3A.')).toBeNull()
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    expect(screen.getByRole('button', { name: /HUNT TARGET/ })).not.toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: /HUNT TARGET/ }))
    expect(onHuntTarget).toHaveBeenCalledWith('whispering-woods', 'forest-wisp')
    expect(screen.queryByRole('button', { name: /START FARMING|SWITCH TARGET|RETURN TO COMBAT/ })).toBeNull()
  })

  it('keeps an unauthorized Gloamridge target inspectable while blocking entry with the contract reason', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.reputation = 10000
    state.progress.huntersOrder.activeContract = { id: 'ashen-only', targetSpec: { type: 'monster', monsterId: 'ashen-tracker' }, target: 5, progress: 0, tier: 'routine', reputationReward: 100, marksReward: 3 }
    state.combat.active = true
    state.combat.locationId = 'hunters-ground'
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
    state.combat.locationId = 'hunters-ground'
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
    setNavigationIntent({ combatLocationId: 'hunters-ground', combatMonsterId: 'veilwing-harrier' })
    renderNavigation()

    expect(screen.getByRole('button', { name: /Veilwing Harrier/ }).getAttribute('aria-pressed')).toBe('true')
    expect(getNavigationIntent()).toMatchObject({ combatLocationId: null, combatMonsterId: null })
    expect(useGameStore.getState().combat.enemyId).toBeNull()
  })

  it.each([
    ['monster', { type: 'monster', monsterId: 'ashen-tracker' }, ['Ashen Tracker']],
    ['family', { type: 'family', familyId: 'Gloamridge Predators' }, ['Ashen Tracker', 'Gloamfang Stalker']],
    ['alignment', { type: 'alignment', alignmentId: 'Wild' }, ['Ashen Tracker', 'Gloamfang Stalker']],
    ['ground patrol', { type: 'ground', groundId: 'hunters-ground' }, ['Ashen Tracker', 'Gloamfang Stalker', 'Runehorn Brute']],
  ] as const)('enables the canonical eligible quarry list for a %s Contract', (_kind, targetSpec, eligibleNames) => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.activeContract = { id: 'integration-contract', targetSpec, target: 5, progress: 0, tier: 'routine', reputationReward: 100, marksReward: 3 }
    state.combat.active = true
    state.combat.locationId = 'hunters-ground'
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
    state.combat.locationId = 'hunters-ground'
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
    state.combat.locationId = 'hunters-ground'
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
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.enemyId = 'forest-wisp'
    useGameStore.setState(state)
    renderNavigation(undefined, undefined, 2)

    expect(screen.getByText('HUNTING')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Stone RootSTANDARD/ }))
    expect(screen.getByText('HUNTING')).toBeTruthy()
    expect(screen.getByText('SELECTED')).toBeTruthy()
  })

  it('preserves the selected target when a hunt attempt is blocked', () => {
    const onHuntTarget = vi.fn(() => false)
    renderNavigation(vi.fn(), onHuntTarget, 2)

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
    state.combat.locationId = 'whispering-woods'
    useGameStore.setState(state)
    const onSelectLocation = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={onSelectLocation} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={vi.fn()} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION/ }))

    expect(onSelectLocation).toHaveBeenCalledWith('howling-den')
    expect(useGameStore.getState().combat.active).toBe(true)
    expect(useGameStore.getState().combat.locationId).toBe('whispering-woods')
    expect(screen.getByRole('heading', { name: 'Howling Den' })).toBeTruthy()
  })

  it('starts a selected Howling Den target through the Inspector action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    const onEnterLocation = vi.fn()
    const onHuntTarget = vi.fn(() => true)
    renderNavigation(onEnterLocation, onHuntTarget)
    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION/ }))
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
    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION/ }))

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
    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    useGameStore.setState(state)
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'Combat Zones' }))
    fireEvent.click(screen.getByRole('tab', { name: 'T4' }))
    fireEvent.click(screen.getByRole('button', { name: /Hall of Unbound Names, COMBAT ZONE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Nameless CantorHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'hall-of-unbound-names' }), 'nameless-cantor')
  })

  it('renders the Black Gate sequence with preserved signature boss and no target or Threat controls', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    useGameStore.setState(state)
    renderNavigation()

    fireEvent.click(screen.getByRole('tab', { name: 'Primary Dungeons' }))
    fireEvent.click(screen.getByRole('tab', { name: 'T5' }))
    fireEvent.click(screen.getByRole('button', { name: /The Black Gate, PRIMARY DUNGEON/ }))

    expect(screen.getByText('DUNGEON RUN')).toBeTruthy()
    expect(screen.getByText('6 FIXED STEPS')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'T5' })).toBeTruthy()
    expect(screen.queryByText('SELECT TARGET')).toBeNull()
    expect(screen.queryByText('ZONE AFFIX')).toBeNull()
    expect(screen.queryByText('AUTO HUNT')).toBeNull()
    expect(screen.queryByText(/THREAT/)).toBeNull()
  })

  it('keeps Zone Boss threat and Auto Hunt controls in the location inspector', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.combat.active = true
    state.combat.locationId = 'howling-den'
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION/ }))

    expect(screen.getByText('ELITE BOSS')).toBeTruthy()
    expect(screen.getByText('Corrupted Greatbear')).toBeTruthy()
    expect(screen.getByText('THREAT 0 / 10.0K')).toBeTruthy()
    expect(screen.getByText('10.0K THREAT TO BOSS')).toBeTruthy()
    expect(screen.queryByText(/MORE KILLS TO BOSS/)).toBeNull()
    const autoHunt = screen.getByRole('button', { name: 'AUTO HUNT OFF' })
    expect(autoHunt).toBeTruthy()

    fireEvent.click(autoHunt)
    expect(useGameStore.getState().progress.autoHuntBossByLocation['howling-den']).toBe(true)
  })

  it('shows Zone Affix context in Howling Den target loot', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Special Locations' }))
    fireEvent.click(screen.getByRole('button', { name: /Howling Den, SPECIAL LOCATION/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bonehide BoarHARD/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getAllByText(/ZONE AFFIX/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/FRENZIED/)).toBeTruthy()
    expect(screen.queryByText(/MINOR AFFIX/)).toBeNull()
  })

  it('disables targeted Loot without a target and opens the selected target reward view', () => {
    renderNavigation(undefined, undefined, 2)

    const loot = screen.getByRole('button', { name: 'LOOT' })
    expect(loot).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    const enabledLoot = screen.getByRole('button', { name: 'LOOT' })
    expect(enabledLoot).not.toHaveProperty('disabled', true)
    fireEvent.click(enabledLoot)

    expect(screen.getByText('FOREST WISP — LOOT')).toBeTruthy()
    expect(screen.getByText('ITEM DROPS')).toBeTruthy()
    expect(screen.getByText('RESONANCE')).toBeTruthy()
    const resonance = resolveEnemyResonanceReward('forest-wisp')
    expect(screen.getByText(`+${(resonance.finalYield.air ?? 0).toLocaleString('en-US')}`)).toBeTruthy()
    expect(screen.queryByText('Shared loot pool from normal encounters.')).toBeNull()
  })

  it('disables targeted Bestiary until a target is selected', () => {
    renderNavigation(undefined, undefined, 2)

    const bestiary = screen.getByRole('button', { name: 'BESTIARY' })
    expect(bestiary).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: /Forest WispEASY/ }))
    expect(screen.getByRole('button', { name: 'BESTIARY' })).not.toHaveProperty('disabled', true)
  })

  it('deep-links Bestiary to the selected targeted monster', () => {
    const onBestiary = vi.fn()
    render(<TooltipProvider><CombatWorldNavigation onSelectLocation={vi.fn()} onEnterLocation={vi.fn()} onHuntTarget={vi.fn(() => true)} onBestiary={onBestiary} onReturnToCombat={vi.fn()} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('tab', { name: 'T2' }))
    fireEvent.click(screen.getByRole('button', { name: /ThornlingEASY/ }))
    fireEvent.click(screen.getByRole('button', { name: 'BESTIARY' }))

    expect(onBestiary).toHaveBeenCalledWith(expect.objectContaining({ id: 'whispering-woods' }), 'thornling')
  })

  it('keeps location-level Loot for non-targeted locations', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    useGameStore.setState(state)
    renderNavigation()
    fireEvent.click(screen.getByRole('tab', { name: 'Primary Dungeons' }))
    fireEvent.click(screen.getByRole('tab', { name: 'T1' }))
    fireEvent.click(screen.getByRole('button', { name: /Abandoned Catacombs, PRIMARY DUNGEON/ }))
    fireEvent.click(screen.getByRole('button', { name: 'LOOT' }))

    expect(screen.getByText('LOCATION LOOT')).toBeTruthy()
    expect(screen.getByText('MONSTER LOOT')).toBeTruthy()
  })

  it('exposes the canonical manual Boss Engage action in the active Zone Boss section', () => {
    const state = createInitialState()
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
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
